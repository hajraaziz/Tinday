import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { api, apiGet, apiPost, apiDelete } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import type { AppNotification, NotificationsResponse } from "@/types";

const KEY = ["notifications"];

// Where a notification leads when tapped. A one-way "connect" notification
// carries the swiper's id (giverId) and surfaces their card on explore; matches
// and messages open the conversation. Keep in sync with TopNav's panel routing.
export function routeForNotification(n: AppNotification): string | null {
  if (n.data?.giverId) return `/explore?connect=${n.data.giverId}`;
  if (n.data?.matchId) return `/inbox/${n.data.matchId}`;
  return null;
}

// Append a unique nonce so re-clicking a notification re-navigates even when the
// target URL is otherwise identical — Next treats a same-URL push as a no-op, so
// without this the explore page wouldn't re-surface the card on a repeat click.
export function withNavNonce(href: string): string {
  const sep = href.includes("?") ? "&" : "?";
  return `${href}${sep}t=${Date.now()}`;
}

// Merge freshly-arrived notifications into the cache, newest first, de-duped.
function mergeNotifications(
  queryClient: QueryClient,
  incoming: AppNotification[]
) {
  if (!incoming.length) return;
  queryClient.setQueryData<NotificationsResponse>(KEY, (prev) => {
    const existing = prev?.notifications ?? [];
    const seen = new Set(existing.map((n) => n.id));
    const fresh = incoming.filter((n) => !seen.has(n.id));
    if (!fresh.length) return prev;
    const notifications = [...fresh, ...existing].sort((a, b) =>
      b.created_at.localeCompare(a.created_at)
    );
    const addedUnread = fresh.filter((n) => !n.read_at).length;
    return {
      notifications,
      unread_count: (prev?.unread_count ?? 0) + addedUnread,
    };
  });
}

// List + unread badge, plus mark-read mutations. Consumed by TopNav.
export function useNotifications() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const query = useQuery<NotificationsResponse>({
    queryKey: KEY,
    queryFn: () => apiGet<NotificationsResponse>("/api/notifications"),
    enabled: isAuthenticated,
    staleTime: 1000 * 30,
  });

  const markAllRead = useMutation({
    mutationFn: () => apiPost("/api/notifications/read-all"),
    onSuccess: () => {
      queryClient.setQueryData<NotificationsResponse>(KEY, (prev) =>
        prev
          ? {
              notifications: prev.notifications.map((n) => ({
                ...n,
                read_at: n.read_at ?? new Date().toISOString(),
              })),
              unread_count: 0,
            }
          : prev
      );
    },
  });

  // Optimistically remove a single notification, restoring it if the request
  // fails. Decrements the unread badge when the dismissed item was unread.
  const dismiss = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/notifications/${id}`),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: KEY });
      const prev = queryClient.getQueryData<NotificationsResponse>(KEY);
      queryClient.setQueryData<NotificationsResponse>(KEY, (curr) => {
        if (!curr) return curr;
        const target = curr.notifications.find((n) => n.id === id);
        return {
          notifications: curr.notifications.filter((n) => n.id !== id),
          unread_count:
            target && !target.read_at
              ? Math.max(0, curr.unread_count - 1)
              : curr.unread_count,
        };
      });
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(KEY, ctx.prev);
    },
  });

  // Optimistically mark a single notification read (on click). Flips its
  // read_at and decrements the unread badge; no-ops if already read.
  const markRead = useMutation({
    mutationFn: (id: string) => apiPost(`/api/notifications/${id}/read`),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: KEY });
      const prev = queryClient.getQueryData<NotificationsResponse>(KEY);
      queryClient.setQueryData<NotificationsResponse>(KEY, (curr) => {
        if (!curr) return curr;
        const target = curr.notifications.find((n) => n.id === id);
        if (!target || target.read_at) return curr;
        return {
          notifications: curr.notifications.map((n) =>
            n.id === id ? { ...n, read_at: new Date().toISOString() } : n
          ),
          unread_count: Math.max(0, curr.unread_count - 1),
        };
      });
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(KEY, ctx.prev);
    },
  });

  return {
    notifications: query.data?.notifications ?? [],
    unreadCount: query.data?.unread_count ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    markAllRead: () => markAllRead.mutate(),
    markRead: (id: string) => markRead.mutate(id),
    dismissNotification: (id: string) => dismiss.mutate(id),
  };
}

// Single long-poll loop. Holds a request open ~27s server-side, wakes the
// instant a notification is created, merges it into the cache and re-opens
// immediately. Mount EXACTLY ONCE (in the app layout). Aborts on logout/unmount.
export function useNotificationStream() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    const controller = new AbortController();
    let stopped = false;
    let backoff = 1000;
    // Only stream notifications created after the loop starts; history comes
    // from the useNotifications() query.
    const startAt = new Date().toISOString();

    const cursor = () => {
      const data = queryClient.getQueryData<NotificationsResponse>(KEY);
      const newest = data?.notifications?.[0]?.created_at;
      return newest && newest > startAt ? newest : startAt;
    };

    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    const handleIncoming = (incoming: AppNotification[]) => {
      mergeNotifications(queryClient, incoming);
      const activeMatch = useUIStore.getState().activeConversationId;
      for (const n of incoming) {
        // Keep adjacent views fresh.
        if (n.type === "message") {
          queryClient.invalidateQueries({ queryKey: ["inbox"] });
        } else if (n.type === "match") {
          queryClient.invalidateQueries({ queryKey: ["matches"] });
          queryClient.invalidateQueries({ queryKey: ["inbox"] });
        }
        // Don't toast a message you're already looking at. (Muted chats never
        // reach here — the server skips notifications for them at the source.)
        if (n.type === "message" && n.data?.matchId === activeMatch) continue;
        const href = routeForNotification(n);
        toast(n.title, {
          description: n.body ?? undefined,
          action: href
            ? { label: "View", onClick: () => router.push(withNavNonce(href)) }
            : undefined,
        });
      }
    };

    const loop = async () => {
      while (!stopped) {
        try {
          const res = await api.get<NotificationsResponse>(
            "/api/notifications/stream",
            { params: { after: cursor() }, signal: controller.signal }
          );
          handleIncoming(res.data.notifications ?? []);
          backoff = 1000;
        } catch {
          if (stopped || controller.signal.aborted) break;
          await sleep(backoff);
          backoff = Math.min(backoff * 2, 30000);
        }
      }
    };

    loop();

    return () => {
      stopped = true;
      controller.abort();
    };
  }, [isAuthenticated, queryClient, router]);
}

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { InboxEntry } from "@/types";

// GET /api/messaging/inbox — one row per match with the latest message,
// unread count and last-activity timestamp (sorted most-recent first).
// Polls every 30s as a baseline; open threads also get sub-second updates
// via Supabase Realtime (useRealtimeMessages invalidates this query).
export function useInbox() {
  return useQuery<InboxEntry[]>({
    queryKey: ["inbox"],
    queryFn: () => apiGet<InboxEntry[]>("/api/messaging/inbox"),
    refetchInterval: 30000,
    staleTime: 0,
  });
}

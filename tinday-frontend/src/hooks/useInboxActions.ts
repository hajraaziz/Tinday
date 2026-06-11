import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiPut, apiPost } from "@/lib/api";
import type { InboxEntry } from "@/types";

interface MatchUserState {
  match_id: string;
  muted: boolean;
  deleted_at: string | null;
}

const INBOX_KEY = ["inbox"];

// PUT /api/messaging/matches/:matchId/mute — toggle mute, persisted server-side
// and synced across devices. Optimistically flips the flag in the inbox cache.
export function useSetMute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ matchId, muted }: { matchId: string; muted: boolean }) =>
      apiPut<MatchUserState>(`/api/messaging/matches/${matchId}/mute`, {
        muted,
      }),

    onMutate: async ({ matchId, muted }) => {
      await queryClient.cancelQueries({ queryKey: INBOX_KEY });
      const previous = queryClient.getQueryData<InboxEntry[]>(INBOX_KEY);
      queryClient.setQueryData<InboxEntry[]>(INBOX_KEY, (prev = []) =>
        prev.map((e) => (e.match_id === matchId ? { ...e, muted } : e))
      );
      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous)
        queryClient.setQueryData(INBOX_KEY, context.previous);
      toast.error("Couldn't update mute. Try again.");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: INBOX_KEY });
    },
  });
}

// POST /api/messaging/matches/:matchId/read — mark the other party's messages
// read without opening the thread. Optimistically zeroes the row's unread_count
// (which drives both the badge and the bold/un-bold styling).
export function useMarkChatRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ matchId }: { matchId: string }) =>
      apiPost(`/api/messaging/matches/${matchId}/read`),

    onMutate: async ({ matchId }) => {
      await queryClient.cancelQueries({ queryKey: INBOX_KEY });
      const previous = queryClient.getQueryData<InboxEntry[]>(INBOX_KEY);
      queryClient.setQueryData<InboxEntry[]>(INBOX_KEY, (prev = []) =>
        prev.map((e) => (e.match_id === matchId ? { ...e, unread_count: 0 } : e))
      );
      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous)
        queryClient.setQueryData(INBOX_KEY, context.previous);
      toast.error("Couldn't mark as read. Try again.");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: INBOX_KEY });
    },
  });
}

// PUT /api/messaging/matches/:matchId/hidden — soft-delete (hidden: true) or
// restore/undo (hidden: false). On hide the row is optimistically removed; the
// server brings it back on its own once newer activity arrives.
export function useSetChatHidden() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ matchId, hidden }: { matchId: string; hidden: boolean }) =>
      apiPut<MatchUserState>(`/api/messaging/matches/${matchId}/hidden`, {
        hidden,
      }),

    onMutate: async ({ matchId, hidden }) => {
      await queryClient.cancelQueries({ queryKey: INBOX_KEY });
      const previous = queryClient.getQueryData<InboxEntry[]>(INBOX_KEY);
      if (hidden) {
        queryClient.setQueryData<InboxEntry[]>(INBOX_KEY, (prev = []) =>
          prev.filter((e) => e.match_id !== matchId)
        );
      }
      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous)
        queryClient.setQueryData(INBOX_KEY, context.previous);
      toast.error("Couldn't update chat. Try again.");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: INBOX_KEY });
    },
  });
}

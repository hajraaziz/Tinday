import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { Message } from "@/types";

// GET /api/messaging/matches/:matchId/messages — chronological (oldest first).
// The backend also marks the other user's unread messages as read as a side
// effect of this fetch. Realtime keeps the thread live after the initial load.
export function useMessages(matchId: string | undefined) {
  return useQuery<Message[]>({
    queryKey: ["messages", matchId],
    queryFn: () =>
      apiGet<Message[]>(`/api/messaging/matches/${matchId}/messages`),
    enabled: !!matchId,
    staleTime: 0,
  });
}

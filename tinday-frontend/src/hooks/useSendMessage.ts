import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiPost } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { Message } from "@/types";

// POST /api/messaging/matches/:matchId/messages — optimistic send.
// A temporary message is appended immediately, then reconciled with the row
// the server returns. Realtime ignores our own messages (see useRealtimeMessages)
// so there's no duplicate when the INSERT echoes back.
export function useSendMessage(matchId: string) {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const queryKey = ["messages", matchId];

  return useMutation({
    mutationFn: (content: string) =>
      apiPost<Message>(`/api/messaging/matches/${matchId}/messages`, {
        content,
      }),

    onMutate: async (content): Promise<{ tempId: string }> => {
      await queryClient.cancelQueries({ queryKey });
      const tempId = `optimistic-${Date.now()}`;
      const optimistic: Message = {
        id: tempId,
        match_id: matchId,
        sender_id: userId ?? "",
        content,
        read_at: null,
        created_at: new Date().toISOString(),
      };
      queryClient.setQueryData<Message[]>(queryKey, (prev = []) => [
        ...prev,
        optimistic,
      ]);
      return { tempId };
    },

    onSuccess: (real, _content, context) => {
      // Swap the optimistic placeholder for the canonical row, de-duping by id
      // in case Realtime already raced it in.
      queryClient.setQueryData<Message[]>(queryKey, (prev = []) => {
        const without = prev.filter(
          (m) => m.id !== context?.tempId && m.id !== real.id
        );
        return [...without, real];
      });
      queryClient.invalidateQueries({ queryKey: ["inbox"] });
    },

    onError: (_err, _content, context) => {
      queryClient.setQueryData<Message[]>(queryKey, (prev = []) =>
        prev.filter((m) => m.id !== context?.tempId)
      );
      toast.error("Couldn't send message. Try again.");
    },
  });
}

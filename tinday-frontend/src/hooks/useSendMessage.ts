import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiPost } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { Message } from "@/types";

// Payload for a send: text, an attachment, or both. For images the caller may
// pass a local object-URL `previewUrl` so the optimistic bubble shows the
// thumbnail instantly — it's swapped for the canonical row on success.
export interface SendMessagePayload {
  content?: string;
  attachment_url?: string;
  attachment_type?: string;
  attachment_name?: string;
  previewUrl?: string;
}

// POST /api/messaging/matches/:matchId/messages — optimistic send.
// A temporary message is appended immediately, then reconciled with the row
// the server returns. Realtime ignores our own messages (see useRealtimeMessages)
// so there's no duplicate when the INSERT echoes back.
export function useSendMessage(matchId: string) {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const queryKey = ["messages", matchId];

  return useMutation({
    mutationFn: (payload: SendMessagePayload) =>
      apiPost<Message>(`/api/messaging/matches/${matchId}/messages`, {
        content: payload.content,
        attachment_url: payload.attachment_url,
        attachment_type: payload.attachment_type,
        attachment_name: payload.attachment_name,
      }),

    onMutate: async (payload): Promise<{ tempId: string }> => {
      await queryClient.cancelQueries({ queryKey });
      const tempId = `optimistic-${Date.now()}`;
      const optimistic: Message = {
        id: tempId,
        match_id: matchId,
        sender_id: userId ?? "",
        content: payload.content ?? null,
        // Use the local preview URL for images so the thumbnail shows instantly.
        attachment_url: payload.previewUrl ?? payload.attachment_url ?? null,
        attachment_type: payload.attachment_type ?? null,
        attachment_name: payload.attachment_name ?? null,
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

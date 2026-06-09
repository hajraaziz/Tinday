import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import type { Message } from "@/types";

// Subscribe to INSERTs on the messages table for one match via Supabase
// Realtime, giving the open thread sub-second delivery. The Express access
// token IS a Supabase JWT, so we authenticate the socket with it and the
// "messages_select" RLS policy gates which rows reach us.
//
// Requires the messages table to be in the supabase_realtime publication
// (migration 07_realtime_messages.sql). Falls back gracefully to the polling
// baseline if Realtime isn't configured.
export function useRealtimeMessages(matchId: string | undefined) {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.access_token);
  const currentUserId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    if (!matchId || !accessToken) return;

    // Authenticate the realtime connection so RLS lets these rows through.
    supabase.realtime.setAuth(accessToken);

    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const message = payload.new as Message;
          // Our own sends are handled optimistically by useSendMessage —
          // ignore the echo to avoid a duplicate bubble.
          if (message.sender_id === currentUserId) return;

          queryClient.setQueryData<Message[]>(
            ["messages", matchId],
            (prev = []) => {
              if (prev.some((m) => m.id === message.id)) return prev;
              return [...prev, message];
            }
          );
          queryClient.invalidateQueries({ queryKey: ["inbox"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, accessToken, currentUserId, queryClient]);
}

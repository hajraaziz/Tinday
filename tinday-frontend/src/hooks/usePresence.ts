import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

// Online presence for a conversation using Supabase Realtime Presence.
// Both participants track themselves on a per-match channel; we report whether
// anyone other than the current user is currently present (i.e. has the thread
// open). Self-contained — needs no backend changes.
export function usePresence(matchId: string | undefined) {
  const [isOtherOnline, setIsOtherOnline] = useState(false);
  const accessToken = useAuthStore((s) => s.access_token);
  const currentUserId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    if (!matchId || !currentUserId || !accessToken) return;
    supabase.realtime.setAuth(accessToken);

    const channel = supabase.channel(`presence:${matchId}`, {
      config: { presence: { key: currentUserId } },
    });

    const sync = () => {
      const state = channel.presenceState();
      setIsOtherOnline(
        Object.keys(state).some((key) => key !== currentUserId)
      );
    };

    channel
      .on("presence", { event: "sync" }, sync)
      .on("presence", { event: "join" }, sync)
      .on("presence", { event: "leave" }, sync)
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      setIsOtherOnline(false);
    };
  }, [matchId, currentUserId, accessToken]);

  return isOtherOnline;
}

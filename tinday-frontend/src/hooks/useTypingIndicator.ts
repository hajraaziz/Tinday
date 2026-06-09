import { useCallback, useEffect, useRef, useState } from "react";
import { getSocket, connectSocket } from "@/lib/socket";

interface TypingEvent {
  matchId: string;
  userId: string;
}

// Typing indicator over the existing socket.io server. Joins the match room,
// broadcasts typing_start/typing_stop (auto-stopping after a quiet period),
// and exposes whether the other participant is currently typing.
export function useTypingIndicator(matchId: string | undefined) {
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTyping = useRef(false);

  useEffect(() => {
    if (!matchId) return;
    connectSocket();
    const socket = getSocket();
    socket.emit("join_match", matchId);

    const onTyping = (e: TypingEvent) => {
      if (e.matchId === matchId) setIsOtherTyping(true);
    };
    const onStopped = (e: TypingEvent) => {
      if (e.matchId === matchId) setIsOtherTyping(false);
    };
    const onOffline = () => setIsOtherTyping(false);

    socket.on("user_typing", onTyping);
    socket.on("user_stopped_typing", onStopped);
    socket.on("user_offline", onOffline);

    return () => {
      socket.off("user_typing", onTyping);
      socket.off("user_stopped_typing", onStopped);
      socket.off("user_offline", onOffline);
      if (isTyping.current) {
        socket.emit("typing_stop", matchId);
        isTyping.current = false;
      }
      if (stopTimer.current) clearTimeout(stopTimer.current);
      setIsOtherTyping(false);
    };
  }, [matchId]);

  const stopTyping = useCallback(() => {
    if (!matchId || !isTyping.current) return;
    isTyping.current = false;
    getSocket().emit("typing_stop", matchId);
  }, [matchId]);

  // Call on each keystroke: emits typing_start once, then schedules an
  // auto-stop ~2.5s after the last keystroke.
  const notifyTyping = useCallback(() => {
    if (!matchId) return;
    if (!isTyping.current) {
      isTyping.current = true;
      getSocket().emit("typing_start", matchId);
    }
    if (stopTimer.current) clearTimeout(stopTimer.current);
    stopTimer.current = setTimeout(stopTyping, 2500);
  }, [matchId, stopTyping]);

  return { isOtherTyping, notifyTyping, stopTyping };
}

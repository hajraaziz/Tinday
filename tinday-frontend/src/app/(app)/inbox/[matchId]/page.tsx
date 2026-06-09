"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { useMessages } from "@/hooks/useMessages";
import { useSendMessage } from "@/hooks/useSendMessage";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { usePresence } from "@/hooks/usePresence";
import { useMatches } from "@/hooks/useMatches";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { MessageBubble } from "@/components/inbox/MessageBubble";
import { TypingIndicator } from "@/components/inbox/TypingIndicator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn, getInitials } from "@/lib/utils";

export default function ThreadPage() {
  const params = useParams<{ matchId: string }>();
  const matchId = params.matchId;
  const router = useRouter();

  const currentUserId = useAuthStore((s) => s.user?.id);
  const setActiveConversation = useUIStore((s) => s.setActiveConversation);

  const { data: messages = [], isLoading, isError } = useMessages(matchId);
  const { data: matches = [] } = useMatches();
  const sendMessage = useSendMessage(matchId);
  useRealtimeMessages(matchId);
  const { isOtherTyping, notifyTyping, stopTyping } =
    useTypingIndicator(matchId);
  const isOtherOnline = usePresence(matchId);

  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const otherUser = useMemo(
    () => matches.find((m) => m.match_id === matchId)?.user,
    [matches, matchId]
  );

  // Mark this thread active for the duration of the view (drives badge/notif
  // suppression elsewhere).
  useEffect(() => {
    setActiveConversation(matchId);
    return () => setActiveConversation(null);
  }, [matchId, setActiveConversation]);

  // Keep the latest message in view as messages arrive or the peer types.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isOtherTyping]);

  const handleSend = () => {
    const content = draft.trim();
    if (!content || sendMessage.isPending) return;
    stopTyping();
    setDraft("");
    sendMessage.mutate(content);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="shrink-0 flex items-center gap-3 px-3 py-3 border-b border-[rgba(132,120,212,0.08)] bg-[#151515]">
        <button
          onClick={() => router.push("/inbox")}
          className="w-9 h-9 flex items-center justify-center rounded-full text-[#9CA3AF] hover:bg-[rgba(132,120,212,0.08)] hover:text-white transition-colors"
          aria-label="Back to messages"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <button
          onClick={() => otherUser && router.push(`/profile/${otherUser.id}`)}
          className="flex items-center gap-3 min-w-0"
          disabled={!otherUser}
        >
          <div className="relative shrink-0">
            <Avatar className="w-9 h-9">
              <AvatarImage src={otherUser?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-[#221E30] text-[#9CA3AF] text-xs">
                {otherUser ? getInitials(otherUser.name) : "?"}
              </AvatarFallback>
            </Avatar>
            {isOtherOnline && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#22C55E] border-2 border-[#151515]" />
            )}
          </div>
          <div className="min-w-0 text-left">
            <p className="truncate text-sm font-semibold text-white">
              {otherUser?.name ?? "Conversation"}
            </p>
            <p className="text-[11px] text-[#9CA3AF]">
              {isOtherTyping
                ? "typing…"
                : isOtherOnline
                  ? "Online"
                  : "Offline"}
            </p>
          </div>
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-7 h-7 rounded-full border-2 border-[rgba(132,120,212,0.2)] border-t-[#8478D4] animate-spin" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <p className="text-[#9CA3AF]">This conversation isn&apos;t available.</p>
              <Button
                onClick={() => router.push("/inbox")}
                className="bg-[#8478D4] text-white hover:bg-[#9488e0]"
              >
                Back to Messages
              </Button>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
              <p className="text-white font-medium">
                You matched{otherUser ? ` with ${otherUser.name}` : ""}!
              </p>
              <p className="text-sm text-[#9CA3AF]">
                Send a message to start the conversation.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.sender_id === currentUserId}
              />
            ))
          )}
          {isOtherTyping && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-[rgba(132,120,212,0.08)] bg-[#151515] px-3 py-3">
        <div className="max-w-2xl mx-auto flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              notifyTyping();
            }}
            onKeyDown={handleKeyDown}
            onBlur={stopTyping}
            rows={1}
            placeholder="Type a message…"
            className="flex-1 resize-none max-h-32 rounded-2xl bg-[#221E30] px-4 py-2.5 text-sm text-white placeholder:text-[#4B5563] outline-none focus:ring-1 focus:ring-[#8478D4]"
          />
          <button
            onClick={handleSend}
            disabled={!draft.trim() || sendMessage.isPending}
            className={cn(
              "shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-colors",
              draft.trim() && !sendMessage.isPending
                ? "bg-[#8478D4] text-white hover:bg-[#9488e0]"
                : "bg-[#221E30] text-[#4B5563]"
            )}
            aria-label="Send message"
          >
            <Send className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>
    </div>
  );
}

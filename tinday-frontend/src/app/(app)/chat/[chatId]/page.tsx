"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAIStore } from "@/store/aiStore";
import { useSendAIMessage } from "@/hooks/useSendAIMessage";
import { useShareProfile } from "@/hooks/useShareProfile";
import { usePublicProfile } from "@/hooks/usePublicProfile";
import { AIOrb } from "@/components/ai/AIOrb";
import { ChatInput } from "@/components/ai/ChatInput";
import { AIMessageBubble } from "@/components/ai/AIMessageBubble";
import type { AIMessage } from "@/types";

const SUGGESTIONS = [
  "Who should I connect with this week?",
  "Draft a friendly intro message",
  "Help me improve my profile bio",
];

const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;

function ChatThread() {
  const params = useParams<{ chatId: string }>();
  const chatId = params.chatId;
  const router = useRouter();
  const searchParams = useSearchParams();
  const shareId = searchParams.get("share") ?? undefined;

  const messages = useAIStore((s) => s.messages[chatId]);
  const hasHydrated = useAIStore((s) => s.hasHydrated);
  const { send, isStreaming, liveText } = useSendAIMessage(chatId);

  const shareProfile = useShareProfile();
  const { data: sharedProfile } = usePublicProfile(shareId);
  const shareHandled = useRef(false);

  const list = useMemo<AIMessage[]>(() => messages ?? [], [messages]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const busy = isStreaming || shareProfile.isPending;

  // One-shot "share a profile with the assistant" flow, triggered by ?share=.
  useEffect(() => {
    if (!shareId || shareHandled.current || !sharedProfile) return;
    shareHandled.current = true;

    const store = useAIStore.getState();
    store.ensureConversation(chatId);
    store.appendMessage(chatId, {
      id: newId(),
      role: "user",
      content: "Can you analyze this profile and tell me if we'd be a good fit?",
      sharedProfile,
    });
    store.touchConversation(chatId, {
      title: `About ${sharedProfile.name}`,
      last_message: "Shared a profile",
    });

    shareProfile.mutate(sharedProfile.id, {
      onSuccess: (res) => {
        const s = useAIStore.getState();
        s.appendMessage(chatId, {
          id: newId(),
          role: "model",
          content: res.analysis,
        });
        s.touchConversation(chatId, { last_message: res.analysis.slice(0, 80) });
      },
      onError: () => {
        useAIStore.getState().appendMessage(chatId, {
          id: newId(),
          role: "model",
          content: "Sorry — I couldn't analyze that profile right now.",
        });
      },
    });

    // Drop the query param so a refresh doesn't re-trigger the analysis.
    router.replace(`/chat/${chatId}`);
  }, [shareId, sharedProfile, chatId, router, shareProfile]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [list.length, liveText, busy]);

  const isEmpty = hasHydrated && list.length === 0 && !busy;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="shrink-0 flex items-center gap-3 px-3 py-3 border-b border-[rgba(132,120,212,0.08)] bg-[#151515]">
        <button
          onClick={() => router.push("/chat")}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-full text-[#9CA3AF] hover:bg-[rgba(132,120,212,0.08)] hover:text-white transition-colors"
          aria-label="Back to chats"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <AIOrb size={30} active={busy} />
        <div>
          <p className="text-sm font-semibold text-white">AI Assistant</p>
          <p className="text-[11px] text-[#9CA3AF]">
            {busy ? "Thinking…" : "Always here to help"}
          </p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center gap-5 py-16 text-center">
              <AIOrb size={56} />
              <p className="text-white font-medium">How can I help?</p>
              <div className="flex flex-col gap-2 w-full max-w-sm">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-xl bg-[#221E30] border border-[rgba(132,120,212,0.1)] px-4 py-3 text-sm text-[#9CA3AF] hover:text-white hover:border-[rgba(132,120,212,0.3)] transition-colors text-left"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            list.map((m) => <AIMessageBubble key={m.id} message={m} />)
          )}

          {busy && (
            <AIMessageBubble
              message={{ id: "live", role: "model", content: liveText }}
              streaming
            />
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-[rgba(132,120,212,0.08)] bg-[#151515] px-3 py-3">
        <div className="max-w-2xl mx-auto">
          <ChatInput onSend={send} disabled={busy} />
        </div>
      </div>
    </div>
  );
}

export default function ChatThreadPage() {
  return (
    <Suspense fallback={null}>
      <ChatThread />
    </Suspense>
  );
}

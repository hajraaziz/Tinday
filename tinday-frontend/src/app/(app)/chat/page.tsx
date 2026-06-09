"use client";

import { useRouter } from "next/navigation";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { useAIConversations } from "@/hooks/useAIConversations";
import { AIOrb } from "@/components/ai/AIOrb";
import { formatRelativeTime } from "@/lib/utils";

export default function ChatListPage() {
  const router = useRouter();
  const { conversations, createConversation, deleteConversation } =
    useAIConversations();

  const startNewChat = () => {
    const id = createConversation();
    router.push(`/chat/${id}`);
  };

  return (
    <div className="min-h-full">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center justify-between px-4 pt-5 pb-3 border-b border-[rgba(132,120,212,0.08)]">
          <div className="flex items-center gap-3">
            <AIOrb size={36} />
            <div>
              <h1 className="text-xl font-semibold text-white font-[family-name:var(--font-display)]">
                AI Assistant
              </h1>
              <p className="text-xs text-[#9CA3AF]">
                Your networking copilot
              </p>
            </div>
          </div>
          <button
            onClick={startNewChat}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#8478D4] text-white text-sm font-medium px-3.5 py-2 hover:bg-[#9488e0] transition-colors"
          >
            <Plus className="w-4 h-4" />
            New
          </button>
        </header>

        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
            <AIOrb size={64} />
            <div>
              <p className="text-white font-medium">Start a conversation</p>
              <p className="text-sm text-[#9CA3AF] max-w-xs mt-1">
                Ask for intros, draft messages, or get advice on who to connect
                with.
              </p>
            </div>
            <button
              onClick={startNewChat}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#8478D4] text-white text-sm font-medium px-4 py-2.5 hover:bg-[#9488e0] transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              New chat
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[rgba(132,120,212,0.06)]">
            {conversations.map((c) => (
              <div
                key={c.id}
                className="group flex items-center gap-3 px-4 py-3 hover:bg-[rgba(132,120,212,0.06)] transition-colors"
              >
                <button
                  onClick={() => router.push(`/chat/${c.id}`)}
                  className="flex-1 min-w-0 text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-white">
                      {c.title}
                    </span>
                    <span className="shrink-0 text-[11px] text-[#9CA3AF]">
                      {formatRelativeTime(c.updated_at)}
                    </span>
                  </div>
                  <p className="truncate text-sm text-[#9CA3AF] mt-0.5">
                    {c.last_message || "No messages yet"}
                  </p>
                </button>
                <button
                  onClick={() => deleteConversation(c.id)}
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-[#4B5563] hover:text-[#EF4444] hover:bg-[rgba(239,68,68,0.08)] opacity-0 group-hover:opacity-100 transition-all"
                  aria-label="Delete conversation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

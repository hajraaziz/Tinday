"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Sparkles, Trash2 } from "lucide-react";
import { useAIConversations } from "@/hooks/useAIConversations";
import { AIOrb } from "@/components/ai/AIOrb";
import { cn, formatRelativeTime } from "@/lib/utils";

export function AIChatSidebar({ activeChatId }: { activeChatId: string | null }) {
  const router = useRouter();
  const { conversations, createConversation, deleteConversation } =
    useAIConversations();
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.last_message.toLowerCase().includes(q)
    );
  }, [conversations, query]);

  const startNewChat = () => {
    const id = createConversation();
    router.push(`/chat/${id}`);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="shrink-0 px-4 pt-5 pb-3 border-b border-[rgba(132,120,212,0.08)]">
        <div className="flex items-center gap-3">
          <AIOrb size={32} />
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-white font-[family-name:var(--font-display)] leading-tight">
              AI Assistant
            </h1>
            <p className="text-xs text-[#9CA3AF]">Your networking copilot</p>
          </div>
        </div>

        {/* New chat */}
        <button
          onClick={startNewChat}
          className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-[#8478D4] text-white text-sm font-medium px-4 py-2.5 hover:bg-[#9488e0] transition-colors"
        >
          <Plus className="w-4 h-4" />
          New chat
        </button>

        {/* Search */}
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4B5563]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats"
            className="w-full rounded-full bg-[#221E30] pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-[#4B5563] outline-none focus:ring-1 focus:ring-[#8478D4]"
          />
        </div>
      </header>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-[rgba(132,120,212,0.12)] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[#8478D4]" />
            </div>
            <p className="text-sm text-[#9CA3AF]">
              {query.trim()
                ? "No chats match your search."
                : "No conversations yet. Start a new chat."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[rgba(132,120,212,0.06)]">
            {visible.map((c) => {
              const isActive = c.id === activeChatId;
              return (
                <div
                  key={c.id}
                  className={cn(
                    "group flex items-center gap-3 px-4 py-3 transition-colors",
                    isActive
                      ? "bg-[rgba(132,120,212,0.12)]"
                      : "hover:bg-[rgba(132,120,212,0.06)]"
                  )}
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

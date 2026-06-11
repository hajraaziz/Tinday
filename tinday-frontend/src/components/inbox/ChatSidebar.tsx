"use client";

import { useMemo, useState } from "react";
import { MessageCircle, Search } from "lucide-react";
import { useInbox } from "@/hooks/useInbox";
import { useAuthStore } from "@/store/authStore";
import { ConversationRow } from "@/components/inbox/ConversationRow";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Filter = "all" | "unread";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
];

function SidebarSkeleton() {
  return (
    <div className="divide-y divide-[rgba(132,120,212,0.06)]">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="w-12 h-12 rounded-full bg-[#221E30] animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 rounded bg-[#221E30] animate-pulse" />
            <div className="h-3 w-2/3 rounded bg-[#221E30] animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChatSidebar({
  activeMatchId,
}: {
  activeMatchId: string | null;
}) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const { data: inbox = [], isLoading, isError, refetch } = useInbox();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  // Soft-deleted chats are already filtered out server-side (getInbox).
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inbox.filter((entry) => {
      if (filter === "unread" && entry.unread_count === 0) return false;
      if (q && !entry.other_user.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [inbox, query, filter]);

  const unreadTotal = useMemo(
    () => inbox.reduce((n, e) => n + (e.unread_count > 0 ? 1 : 0), 0),
    [inbox]
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="shrink-0 px-4 pt-5 pb-3 border-b border-[rgba(132,120,212,0.08)]">
        <h1 className="text-2xl font-semibold text-white font-[family-name:var(--font-display)]">
          Messages
        </h1>

        {/* Search */}
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4B5563]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations"
            className="w-full rounded-full bg-[#221E30] pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-[#4B5563] outline-none focus:ring-1 focus:ring-[#8478D4]"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mt-3">
          {FILTERS.map(({ value, label }) => {
            const active = filter === value;
            const showBadge = value === "unread" && unreadTotal > 0;
            return (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-[#8478D4] text-white"
                    : "bg-[#221E30] text-[#9CA3AF] hover:text-white"
                )}
              >
                {label}
                {showBadge && (
                  <span
                    className={cn(
                      "min-w-4 h-4 px-1 flex items-center justify-center rounded-full text-[10px] font-semibold",
                      active ? "bg-white/25 text-white" : "bg-[#8478D4] text-white"
                    )}
                  >
                    {unreadTotal > 99 ? "99+" : unreadTotal}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <SidebarSkeleton />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
            <p className="text-[#9CA3AF]">We couldn&apos;t load your messages.</p>
            <Button
              onClick={() => refetch()}
              className="bg-[#8478D4] text-white hover:bg-[#9488e0]"
            >
              Retry
            </Button>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-[rgba(132,120,212,0.12)] flex items-center justify-center">
              <MessageCircle className="w-7 h-7 text-[#8478D4]" />
            </div>
            {inbox.length === 0 ? (
              <>
                <p className="text-white font-medium">No conversations yet</p>
                <p className="text-sm text-[#9CA3AF] max-w-xs">
                  When you match with someone, your conversation will show up
                  here.
                </p>
              </>
            ) : (
              <p className="text-sm text-[#9CA3AF]">
                {query.trim()
                  ? "No conversations match your search."
                  : "No unread conversations."}
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[rgba(132,120,212,0.06)]">
            {visible.map((entry) => (
              <ConversationRow
                key={entry.match_id}
                entry={entry}
                currentUserId={currentUserId}
                isActive={entry.match_id === activeMatchId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

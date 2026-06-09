"use client";

import { MessageCircle } from "lucide-react";
import { useInbox } from "@/hooks/useInbox";
import { useAuthStore } from "@/store/authStore";
import { ConversationRow } from "@/components/inbox/ConversationRow";
import { Button } from "@/components/ui/button";

function InboxSkeleton() {
  return (
    <div className="divide-y divide-[rgba(132,120,212,0.06)]">
      {Array.from({ length: 6 }).map((_, i) => (
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

export default function InboxPage() {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const { data: inbox = [], isLoading, isError, refetch } = useInbox();

  return (
    <div className="min-h-full">
      <div className="max-w-2xl mx-auto">
        <header className="px-4 pt-5 pb-3 border-b border-[rgba(132,120,212,0.08)]">
          <h1 className="text-2xl font-semibold text-white font-[family-name:var(--font-display)]">
            Messages
          </h1>
        </header>

        {isLoading ? (
          <InboxSkeleton />
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
        ) : inbox.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-24 text-center">
            <div className="w-14 h-14 rounded-full bg-[rgba(132,120,212,0.12)] flex items-center justify-center">
              <MessageCircle className="w-7 h-7 text-[#8478D4]" />
            </div>
            <p className="text-white font-medium">No conversations yet</p>
            <p className="text-sm text-[#9CA3AF] max-w-xs">
              When you match with someone, your conversation will show up here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[rgba(132,120,212,0.06)]">
            {inbox.map((entry) => (
              <ConversationRow
                key={entry.match_id}
                entry={entry}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

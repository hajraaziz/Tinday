"use client";

import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getInitials, formatRelativeTime } from "@/lib/utils";
import type { InboxEntry } from "@/types";

interface ConversationRowProps {
  entry: InboxEntry;
  currentUserId?: string;
  isActive?: boolean;
}

export function ConversationRow({
  entry,
  currentUserId,
  isActive = false,
}: ConversationRowProps) {
  const router = useRouter();
  const { other_user, latest_message, unread_count } = entry;
  const hasUnread = unread_count > 0;

  const preview = latest_message
    ? `${latest_message.sender_id === currentUserId ? "You: " : ""}${
        latest_message.content
      }`
    : "You matched — say hello 👋";

  return (
    <button
      onClick={() => router.push(`/inbox/${entry.match_id}`)}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
        isActive
          ? "bg-[rgba(132,120,212,0.12)]"
          : "hover:bg-[rgba(132,120,212,0.06)]"
      )}
    >
      <Avatar className="w-12 h-12 shrink-0">
        <AvatarImage src={other_user.avatar_url ?? undefined} />
        <AvatarFallback className="bg-[#221E30] text-[#9CA3AF] text-sm">
          {getInitials(other_user.name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "truncate text-sm",
              hasUnread ? "font-semibold text-white" : "font-medium text-white"
            )}
          >
            {other_user.name}
          </span>
          <span className="shrink-0 text-[11px] text-[#9CA3AF]">
            {formatRelativeTime(entry.last_activity)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span
            className={cn(
              "truncate text-sm",
              hasUnread ? "text-white" : "text-[#9CA3AF]"
            )}
          >
            {preview}
          </span>
          {hasUnread && (
            <span className="shrink-0 min-w-5 h-5 px-1.5 flex items-center justify-center rounded-full bg-[#8478D4] text-[11px] font-semibold text-white">
              {unread_count > 99 ? "99+" : unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bell, BellOff, CheckCheck, MoreHorizontal, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useSetMute,
  useSetChatHidden,
  useMarkChatRead,
} from "@/hooks/useInboxActions";
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
  const isMuted = entry.muted;

  const setMute = useSetMute();
  const setHidden = useSetChatHidden();
  const markRead = useMarkChatRead();

  const messageSummary = (msg: NonNullable<InboxEntry["latest_message"]>) => {
    if (msg.content) return msg.content;
    if (msg.attachment_type?.startsWith("image/")) return "📷 Photo";
    if (msg.attachment_url) return `📎 ${msg.attachment_name ?? "Attachment"}`;
    return "";
  };

  const preview = latest_message
    ? `${
        latest_message.sender_id === currentUserId ? "You: " : ""
      }${messageSummary(latest_message)}`
    : "You matched — say hello 👋";

  const handleMarkRead = () => {
    markRead.mutate({ matchId: entry.match_id });
    toast(`Marked chat with ${other_user.name} as read`);
  };

  const handleMute = () => {
    setMute.mutate({ matchId: entry.match_id, muted: !isMuted });
    toast(
      isMuted ? `Unmuted ${other_user.name}` : `Muted ${other_user.name}`,
      {
        description: isMuted
          ? "You'll be notified about new messages again."
          : "You won't get notifications from this chat.",
      }
    );
  };

  const handleDelete = () => {
    setHidden.mutate({ matchId: entry.match_id, hidden: true });
    toast(`Deleted chat with ${other_user.name}`, {
      description: "It'll return if they send a new message.",
      action: {
        label: "Undo",
        onClick: () =>
          setHidden.mutate({ matchId: entry.match_id, hidden: false }),
      },
    });
  };

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 px-4 py-3 transition-colors",
        isActive
          ? "bg-[rgba(132,120,212,0.12)]"
          : "hover:bg-[rgba(132,120,212,0.06)]"
      )}
    >
      <button
        onClick={() => router.push(`/inbox/${entry.match_id}`)}
        className="flex items-center gap-3 flex-1 min-w-0 text-left"
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
                hasUnread
                  ? "font-semibold text-white"
                  : "font-medium text-white"
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
            <span className="shrink-0 flex items-center gap-1.5">
              {isMuted && <BellOff className="w-3.5 h-3.5 text-[#4B5563]" />}
              {hasUnread && (
                <span className="min-w-5 h-5 px-1.5 flex items-center justify-center rounded-full bg-[#8478D4] text-[11px] font-semibold text-white">
                  {unread_count > 99 ? "99+" : unread_count}
                </span>
              )}
            </span>
          </div>
        </div>
      </button>

      {/* Three-dot menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-[#9CA3AF] hover:bg-[rgba(132,120,212,0.12)] hover:text-white transition-all outline-none",
              "opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100",
              "data-[state=open]:bg-[rgba(132,120,212,0.12)] data-[state=open]:text-white"
            )}
            aria-label={`Options for ${other_user.name}`}
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-44 bg-[#1A1726] border-[rgba(132,120,212,0.12)] text-white"
        >
          <DropdownMenuItem
            onClick={handleMarkRead}
            disabled={!hasUnread}
            className="cursor-pointer focus:bg-[rgba(132,120,212,0.12)] focus:text-white"
          >
            <CheckCheck className="w-4 h-4" />
            Mark as read
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleMute}
            className="cursor-pointer focus:bg-[rgba(132,120,212,0.12)] focus:text-white"
          >
            {isMuted ? (
              <Bell className="w-4 h-4" />
            ) : (
              <BellOff className="w-4 h-4" />
            )}
            {isMuted ? "Unmute" : "Mute"}
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-[rgba(132,120,212,0.12)]" />
          <DropdownMenuItem
            onClick={handleDelete}
            className="cursor-pointer text-[#EF4444] focus:bg-[rgba(239,68,68,0.1)] focus:text-[#EF4444]"
          >
            <Trash2 className="w-4 h-4" />
            Delete chat
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

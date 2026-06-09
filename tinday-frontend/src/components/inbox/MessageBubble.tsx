"use client";

import { cn } from "@/lib/utils";
import type { Message } from "@/types";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const isPending = message.id.startsWith("optimistic-");

  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-4 py-2.5",
          isOwn
            ? "rounded-br-md bg-[#8478D4] text-white"
            : "rounded-bl-md bg-[#221E30] text-white",
          isPending && "opacity-60"
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </p>
        <div
          className={cn(
            "mt-1 flex items-center justify-end gap-1 text-[10px]",
            isOwn ? "text-white/60" : "text-[#9CA3AF]"
          )}
        >
          <span>{formatTime(message.created_at)}</span>
          {isOwn && !isPending && (
            <span>{message.read_at ? "Read" : "Sent"}</span>
          )}
        </div>
      </div>
    </div>
  );
}

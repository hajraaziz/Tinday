"use client";

import Image from "next/image";
import { FileText } from "lucide-react";
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
  const isImage = message.attachment_type?.startsWith("image/");
  const hasAttachment = !!message.attachment_url;

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
        {hasAttachment && isImage && (
          <a
            href={message.attachment_url!}
            target="_blank"
            rel="noopener noreferrer"
            className="block mb-1.5"
          >
            <Image
              src={message.attachment_url!}
              alt={message.attachment_name ?? "Image attachment"}
              width={240}
              height={240}
              unoptimized={isPending}
              className="rounded-lg max-h-60 w-auto object-cover"
            />
          </a>
        )}

        {hasAttachment && !isImage && (
          <a
            href={message.attachment_url!}
            download={message.attachment_name ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 mb-1 transition-colors",
              isOwn
                ? "bg-white/15 hover:bg-white/25"
                : "bg-[rgba(132,120,212,0.12)] hover:bg-[rgba(132,120,212,0.2)]"
            )}
          >
            <FileText className="w-5 h-5 shrink-0" />
            <span className="text-sm truncate max-w-[180px]">
              {message.attachment_name ?? "Attachment"}
            </span>
          </a>
        )}

        {message.content && (
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        )}

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

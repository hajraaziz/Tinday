"use client";

import Image from "next/image";
import { FileText } from "lucide-react";
import { AIOrb } from "@/components/ai/AIOrb";
import { SharedProfileCard } from "@/components/ai/SharedProfileCard";
import type { AIMessage } from "@/types";

interface AIMessageBubbleProps {
  message: AIMessage;
  // When set, render a blinking cursor (the assistant is still streaming).
  streaming?: boolean;
}

export function AIMessageBubble({ message, streaming }: AIMessageBubbleProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] space-y-2 flex flex-col items-end">
          {message.sharedProfile && (
            <SharedProfileCard profile={message.sharedProfile} />
          )}
          {message.attachments?.map((att, i) => {
            const isImage = att.mime_type.startsWith("image/");
            // After a reload the ephemeral object URL is gone — fall back to a
            // filename chip.
            if (isImage && att.url) {
              return (
                <a
                  key={i}
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Image
                    src={att.url}
                    alt={att.name}
                    width={240}
                    height={240}
                    unoptimized
                    className="rounded-2xl max-h-60 w-auto object-cover"
                  />
                </a>
              );
            }
            return (
              <div
                key={i}
                className="flex items-center gap-2.5 rounded-xl bg-[#221E30] px-3 py-2"
              >
                <FileText className="w-5 h-5 shrink-0 text-[#8478D4]" />
                <span className="text-sm text-white truncate max-w-[180px]">
                  {att.name}
                </span>
              </div>
            );
          })}
          {message.content && (
            <div className="rounded-2xl rounded-br-md bg-[#8478D4] text-white px-4 py-2.5">
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start gap-2.5">
      <AIOrb size={28} active={streaming} className="mt-1 shrink-0" />
      <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-[#221E30] text-white px-4 py-2.5">
        <p className="text-sm whitespace-pre-wrap break-words">
          {message.content}
          {streaming && (
            <span className="inline-block w-1.5 h-4 ml-0.5 -mb-0.5 bg-[#8478D4] animate-pulse" />
          )}
        </p>
      </div>
    </div>
  );
}

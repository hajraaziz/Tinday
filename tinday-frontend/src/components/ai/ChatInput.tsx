"use client";

import { useState, type KeyboardEvent } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [value, setValue] = useState("");

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex items-end gap-2 rounded-2xl bg-[#221E30] border border-[rgba(132,120,212,0.12)] px-3 py-2 focus-within:ring-1 focus-within:ring-[#8478D4]">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        rows={1}
        placeholder={placeholder ?? "Ask the assistant anything…"}
        className="flex-1 resize-none max-h-40 bg-transparent text-sm text-white placeholder:text-[#4B5563] outline-none py-1.5"
      />
      <button
        onClick={submit}
        disabled={!value.trim() || disabled}
        className={cn(
          "shrink-0 w-9 h-9 flex items-center justify-center rounded-full transition-colors",
          value.trim() && !disabled
            ? "bg-[#8478D4] text-white hover:bg-[#9488e0]"
            : "bg-[#2a2a2a] text-[#4B5563]"
        )}
        aria-label="Send"
      >
        <ArrowUp className="w-[18px] h-[18px]" />
      </button>
    </div>
  );
}

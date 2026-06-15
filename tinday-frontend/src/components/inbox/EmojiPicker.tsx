"use client";

import { useEffect, useRef, useState } from "react";
import { Smile } from "lucide-react";
import EmojiPickerReact, {
  Theme,
  EmojiStyle,
  type EmojiClickData,
} from "emoji-picker-react";
import { cn } from "@/lib/utils";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  disabled?: boolean;
}

// A Smile trigger that toggles the emoji-picker-react panel above the composer.
// Stays open across picks for fast entry; closes on outside click or Escape.
export function EmojiPicker({ onSelect, disabled }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleClick = (data: EmojiClickData) => {
    onSelect(data.emoji);
  };

  return (
    <div ref={containerRef} className="relative shrink-0">
      {open && (
        <div className="absolute bottom-12 left-0 z-50">
          <EmojiPickerReact
            onEmojiClick={handleClick}
            theme={Theme.DARK}
            emojiStyle={EmojiStyle.NATIVE}
            lazyLoadEmojis
            skinTonesDisabled
            width={320}
            height={400}
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-label="Add emoji"
        className={cn(
          "w-10 h-10 flex items-center justify-center rounded-full text-[#9CA3AF] hover:bg-[rgba(132,120,212,0.08)] hover:text-white transition-colors disabled:opacity-50",
          open && "bg-[rgba(132,120,212,0.12)] text-white"
        )}
      >
        <Smile className="w-[20px] h-[20px]" />
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagInputProps {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  variant?: "accent" | "muted";
  suggestions?: string[];
}

// Type-and-Enter tag editor with optional suggestion chips. Used across the
// Edit Profile form for skills, roles, and preferences.
export function TagInput({
  label,
  value,
  onChange,
  placeholder = "Type and press Enter",
  variant = "accent",
  suggestions = [],
}: TagInputProps) {
  const [input, setInput] = useState("");

  const add = (raw: string) => {
    const tag = raw.trim();
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
    }
    setInput("");
  };

  const remove = (tag: string) => onChange(value.filter((t) => t !== tag));

  const openSuggestions = suggestions.filter((s) => !value.includes(s)).slice(0, 8);

  return (
    <div>
      <label className="block text-sm text-[#9CA3AF] mb-1.5">{label}</label>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add(input);
          }
        }}
        type="text"
        placeholder={placeholder}
        className="w-full rounded-lg px-4 py-2.5 text-white placeholder:text-[#4B5563] outline-none transition-colors focus:ring-2 focus:ring-[#8478D4]/30"
        style={{
          background: "#161222",
          border: "1px solid rgba(132,120,212,0.1)",
        }}
      />

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {value.map((tag) => (
            <span
              key={tag}
              className={cn(
                "inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm",
                variant === "accent"
                  ? "bg-[rgba(132,120,212,0.15)] border border-[rgba(132,120,212,0.2)] text-white"
                  : "bg-white/[0.04] border border-white/[0.06] text-[#9CA3AF]"
              )}
            >
              {tag}
              <button
                type="button"
                onClick={() => remove(tag)}
                className="text-[#9CA3AF] hover:text-white"
                aria-label={`Remove ${tag}`}
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}

      {openSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {openSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="px-3 py-1 rounded-full text-xs text-[#9CA3AF] border border-white/[0.06] hover:border-[#8478D4]/30 hover:text-white transition-all"
              style={{ background: "#221E30" }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

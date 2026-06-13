"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TagValidation } from "@/lib/validateTag";

interface TagInputProps {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  variant?: "accent" | "muted";
  suggestions?: string[];
  // When provided, typed (Enter) entries are checked before being added.
  // Suggestion chips bypass this since they're already curated.
  validate?: (value: string) => Promise<TagValidation>;
  // Singular noun used in the rejection message, e.g. "skill" or "role".
  kindLabel?: string;
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
  validate,
  kindLabel = "entry",
}: TagInputProps) {
  const [input, setInput] = useState("");
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add a curated/suggestion value without validation.
  const addRaw = (raw: string) => {
    const tag = raw.trim();
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
    }
    setInput("");
  };

  // Add a typed value, running validation first when configured.
  const addTyped = async (raw: string) => {
    const tag = raw.trim();
    if (!tag) return;
    if (value.includes(tag)) {
      setInput("");
      return;
    }

    if (!validate) {
      addRaw(tag);
      return;
    }

    setValidating(true);
    setError(null);
    try {
      const result = await validate(tag);
      if (!result.valid) {
        setError(`"${tag}" doesn't look like a real ${kindLabel}.`);
        return;
      }
      const finalTag = result.normalized?.trim() || tag;
      if (!value.includes(finalTag)) {
        onChange([...value, finalTag]);
      }
      setInput("");
    } finally {
      setValidating(false);
    }
  };

  const remove = (tag: string) => onChange(value.filter((t) => t !== tag));

  const openSuggestions = suggestions
    .filter((s) => !value.includes(s))
    .slice(0, 8);

  return (
    <div>
      <label className="block text-sm text-[#9CA3AF] mb-1.5">{label}</label>
      <div className="relative">
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (!validating) addTyped(input);
            }
          }}
          type="text"
          disabled={validating}
          placeholder={placeholder}
          className="w-full rounded-lg px-4 py-2.5 pr-10 text-white placeholder:text-[#4B5563] outline-none transition-colors focus:ring-2 focus:ring-[#8478D4]/30 disabled:opacity-60"
          style={{
            background: "#161222",
            border: "1px solid rgba(132,120,212,0.1)",
          }}
        />
        {validating && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8478D4] animate-spin" />
        )}
      </div>

      {error && <p className="text-xs text-[#EF4444] mt-1.5">{error}</p>}

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
              onClick={() => addRaw(s)}
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

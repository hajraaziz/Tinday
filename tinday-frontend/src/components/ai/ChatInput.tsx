"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { ArrowUp, FileText, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (text: string, files: File[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

// AI chat accepts images + PDFs (what Gemini reads inline). 10MB cap keeps the
// base64-inflated request under Gemini's ~20MB inline-data ceiling.
const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
];
const MAX_BYTES = 10 * 1024 * 1024;

export function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Revoke the image preview URL when it changes or the component unmounts.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const clearFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFile(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!selected) return;
    if (!ALLOWED_TYPES.includes(selected.type)) {
      toast.error("Only images and PDFs are supported");
      return;
    }
    if (selected.size > MAX_BYTES) {
      toast.error("File must be under 10MB");
      return;
    }
    clearFile();
    setFile(selected);
    if (selected.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(selected));
    }
  };

  const submit = () => {
    const text = value.trim();
    if ((!text && !file) || disabled) return;
    onSend(text, file ? [file] : []);
    setValue("");
    clearFile();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="rounded-2xl bg-[#221E30] border border-[rgba(132,120,212,0.12)] px-3 py-2 focus-within:ring-1 focus-within:ring-[#8478D4]">
      {file && (
        <div className="mb-2 flex items-center gap-2.5 rounded-xl bg-[#2a2440] p-2 pr-3 w-fit max-w-full">
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt={file.name}
              width={40}
              height={40}
              unoptimized
              className="w-10 h-10 rounded-lg object-cover shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-[rgba(132,120,212,0.18)] flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-[#8478D4]" />
            </div>
          )}
          <span className="text-sm text-white truncate max-w-[180px]">
            {file.name}
          </span>
          <button
            onClick={clearFile}
            disabled={disabled}
            aria-label="Remove file"
            className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-[#9CA3AF] hover:bg-[rgba(132,120,212,0.18)] hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          aria-label="Attach a file"
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-[#9CA3AF] hover:bg-[rgba(132,120,212,0.12)] hover:text-white transition-colors disabled:opacity-50"
        >
          <Paperclip className="w-[18px] h-[18px]" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={handleFileSelect}
        />
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
          disabled={(!value.trim() && !file) || disabled}
          className={cn(
            "shrink-0 w-9 h-9 flex items-center justify-center rounded-full transition-colors",
            (value.trim() || file) && !disabled
              ? "bg-[#8478D4] text-white hover:bg-[#9488e0]"
              : "bg-[#2a2a2a] text-[#4B5563]"
          )}
          aria-label="Send"
        >
          <ArrowUp className="w-[18px] h-[18px]" />
        </button>
      </div>
    </div>
  );
}

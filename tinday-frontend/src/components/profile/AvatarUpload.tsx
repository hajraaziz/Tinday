"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { getInitials } from "@/lib/utils";

interface AvatarUploadProps {
  currentUrl: string | null;
  name: string;
  onUpload: (file: File) => void;
  isUploading?: boolean;
}

const MAX_BYTES = 5 * 1024 * 1024;

// Avatar with a camera badge that opens a file picker. Validates image type
// and a 5MB ceiling, then hands the File to onUpload. Shows an indeterminate
// progress bar while the parent reports isUploading.
export function AvatarUpload({
  currentUrl,
  name,
  onUpload,
  isUploading = false,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image must be under 5MB");
      return;
    }
    setPreview(URL.createObjectURL(file));
    onUpload(file);
  };

  const src = preview ?? currentUrl;

  return (
    <div className="relative w-24 h-24">
      <div className="w-24 h-24 rounded-full overflow-hidden border-[3px] border-[#8478D4] bg-[#221E30]">
        {src ? (
          <Image
            src={src}
            alt={name}
            width={96}
            height={96}
            className="w-full h-full object-cover"
            unoptimized={!!preview}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl font-semibold text-[#8478D4]">
            {getInitials(name)}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        aria-label="Change profile photo"
        className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#8478D4] border-2 border-[#151515] flex items-center justify-center text-white hover:bg-[#9488e0] transition-colors disabled:opacity-60"
      >
        <Camera className="w-4 h-4" />
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleSelect}
      />

      {isUploading && (
        <div className="absolute -bottom-3 left-0 right-0 h-1 rounded-full bg-[#221E30] overflow-hidden">
          <motion.div
            className="h-full bg-[#8478D4]"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
            style={{ width: "60%" }}
          />
        </div>
      )}
    </div>
  );
}

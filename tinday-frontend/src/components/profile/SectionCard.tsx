"use client";

import { motion } from "framer-motion";
import { Pencil } from "lucide-react";

interface SectionCardProps {
  title: string;
  onEdit?: () => void;
  children: React.ReactNode;
}

// Full-width bento card with an uppercase title and optional edit pencil.
// Shared shell for the About / Projects / Looking For sections.
export function SectionCard({ title, onEdit, children }: SectionCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl p-5 bg-[#1C1829] border border-[rgba(132,120,212,0.1)]"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold tracking-wide text-[#9CA3AF] uppercase">
          {title}
        </h3>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${title}`}
            className="text-[#4B5563] hover:text-[#8478D4] transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
      </div>
      {children}
    </motion.section>
  );
}

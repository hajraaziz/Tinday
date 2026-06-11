"use client";

import { useRef } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Trash2, X } from "lucide-react";
import { formatRelativeTime, cn } from "@/lib/utils";
import type { AppNotification } from "@/types";

// How far (px) the row must be dragged left before release dismisses it.
const DISMISS_THRESHOLD = 80;

export function NotificationItem({
  notification: n,
  onOpen,
  onDismiss,
}: {
  notification: AppNotification;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  const x = useMotionValue(0);
  // Fade the trash reveal in as the row is dragged left.
  const revealOpacity = useTransform(x, [-DISMISS_THRESHOLD, 0], [1, 0]);
  // True once a real drag begins, so the trailing onTap of a swipe doesn't
  // count as a click. Reset at the start of every fresh pointer interaction.
  const didDrag = useRef(false);

  return (
    <div className="relative group overflow-hidden border-b border-[rgba(132,120,212,0.04)]">
      {/* Swipe-to-delete reveal (mobile). Sits behind the opaque row. */}
      <motion.div
        style={{ opacity: revealOpacity }}
        className="absolute inset-0 flex items-center justify-end pr-6 bg-[#3A1D1D] pointer-events-none"
      >
        <Trash2 className="w-4 h-4 text-[#F87171]" />
      </motion.div>

      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.9, right: 0 }}
        style={{ x }}
        onPointerDownCapture={() => {
          didDrag.current = false;
        }}
        onDragStart={() => {
          didDrag.current = true;
        }}
        onDragEnd={(_e, info) => {
          if (info.offset.x < -DISMISS_THRESHOLD) onDismiss();
        }}
        // onTap (not onClick) so a swipe gesture never counts as a tap. The
        // didDrag guard catches partial swipes that spring back without a dismiss.
        onTap={(e) => {
          if (didDrag.current) return;
          if ((e.target as HTMLElement).closest("[data-dismiss]")) return;
          onOpen();
        }}
        className={cn(
          "relative w-full px-5 py-3 cursor-pointer touch-pan-y",
          n.read_at ? "bg-[#1C1829]" : "bg-[#201C30]"
        )}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "w-2 h-2 rounded-full mt-1.5 shrink-0",
              n.type === "match"
                ? "bg-[#F59E0B]"
                : n.type === "connect"
                  ? "bg-[#22C55E]"
                  : "bg-[#8478D4]"
            )}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{n.title}</p>
            {n.body && (
              <p className="text-xs text-[#9CA3AF] mt-0.5 line-clamp-2">
                {n.body}
              </p>
            )}
          </div>
          <span className="text-[10px] text-[#4B5563] shrink-0">
            {formatRelativeTime(n.created_at)}
          </span>
        </div>

        {/* Desktop dismiss: revealed on row hover. */}
        <button
          data-dismiss
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          aria-label="Dismiss notification"
          className="absolute top-1/2 -translate-y-1/2 right-3 hidden md:flex w-6 h-6 rounded-full bg-[#2A2438] hover:bg-[#3A1D1D] items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
        >
          <X className="w-3 h-3 text-[#9CA3AF]" />
        </button>
      </motion.div>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/store/uiStore";
import { getInitials } from "@/lib/utils";

const confettiColors = [
  "#8478D4",
  "#F59E0B",
  "#22C55E",
  "#EF4444",
  "#9CA3AF",
  "#FFFFFF",
  "#4B5563",
];

function ConfettiPiece({ color, index }: { color: string; index: number }) {
  const angle = (index * 137.5) % 360;
  const radians = (angle * Math.PI) / 180;
  // Deterministic per-index spread/spin — keeps the render pure (no Math.random)
  // while still looking scattered.
  const distance = 150 + ((index * 53) % 200);
  const spin = 360 + ((index * 89) % 360);

  return (
    <motion.div
      className="absolute w-2 h-2 rounded-sm"
      style={{
        background: color,
        left: "50%",
        top: "50%",
      }}
      initial={{ x: 0, y: 0, opacity: 0, scale: 0, rotate: 0 }}
      animate={{
        x: Math.cos(radians) * distance,
        y: Math.sin(radians) * distance,
        opacity: [0, 1, 1, 0],
        scale: [0, 1.2, 1, 0],
        rotate: spin,
      }}
      transition={{
        duration: 2.5,
        delay: index * 0.02,
        ease: "easeOut",
      }}
      exit={{ opacity: 0 }}
    />
  );
}

export function MatchOverlay() {
  const router = useRouter();
  const matchData = useUIStore((s) => s.matchOverlayData);
  const closeMatchOverlay = useUIStore((s) => s.closeMatchOverlay);
  const [confettiVisible, setConfettiVisible] = useState(true);

  // Re-arm confetti for each new match by adjusting state during render off a
  // tracked previous id (avoids a synchronous setState in the effect below).
  const currentId = matchData?.id ?? null;
  const [shownFor, setShownFor] = useState<string | null>(currentId);
  if (currentId !== shownFor) {
    setShownFor(currentId);
    setConfettiVisible(!!currentId);
  }

  useEffect(() => {
    if (!matchData) return;
    const confettiTimer = setTimeout(() => setConfettiVisible(false), 2500);
    const closeTimer = setTimeout(() => closeMatchOverlay(), 6000);
    return () => {
      clearTimeout(confettiTimer);
      clearTimeout(closeTimer);
    };
  }, [matchData, closeMatchOverlay]);

  const handleSendMessage = useCallback(() => {
    if (matchData) {
      closeMatchOverlay();
      router.push(`/inbox/${matchData.id}`);
    }
  }, [matchData, closeMatchOverlay, router]);

  const handleKeepExploring = useCallback(() => {
    closeMatchOverlay();
  }, [closeMatchOverlay]);

  return (
    <AnimatePresence>
      {matchData && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleKeepExploring}
          />

          {/* Content */}
          <motion.div
            className="relative z-10 flex flex-col items-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {/* Avatars and SVG connection */}
            <div className="relative flex items-center justify-center mb-6">
              {/* Left avatar */}
              <motion.div
                className="w-20 h-20 rounded-full bg-[rgba(132,120,212,0.2)] border-2 border-[#8478D4] flex items-center justify-center text-xl font-semibold text-[#8478D4]"
                initial={{ x: -80, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                {/* User A — could show avatar if available */}
                <span className="text-sm">You</span>
              </motion.div>

              {/* SVG curved connection */}
              <svg
                width="120"
                height="60"
                viewBox="0 0 120 60"
                className="mx-2"
              >
                <motion.path
                  d="M 10 50 Q 60 -10 110 50"
                  fill="none"
                  stroke="#8478D4"
                  strokeWidth="2"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{
                    duration: 0.8,
                    delay: 0.5,
                    ease: "easeInOut",
                  }}
                />
                {/* Traveling pulse */}
                {!confettiVisible && (
                  <motion.circle
                    r="4"
                    fill="#F59E0B"
                    initial={false}
                    animate={{
                      // Animate along the curve path
                      offsetDistance: ["0%", "100%"],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    style={{
                      // Use offset-path for motion along curve
                      offsetPath: "path('M 10 50 Q 60 -10 110 50')",
                    }}
                  />
                )}
              </svg>

              {/* Right avatar */}
              <motion.div
                className="w-20 h-20 rounded-full bg-[rgba(245,158,11,0.15)] border-2 border-[#F59E0B] flex items-center justify-center text-xl font-semibold text-[#F59E0B]"
                initial={{ x: 80, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
              >
                {getInitials("New Match")}
              </motion.div>
            </div>

            {/* "It's a Match!" text */}
            <motion.h2
              className="text-4xl font-display italic text-white mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              It&apos;s a Match!
            </motion.h2>

            <motion.p
              className="text-sm text-[#9CA3AF] mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              You and this professional connected
            </motion.p>

            {/* Action buttons */}
            <motion.div
              className="flex flex-col gap-3 w-56"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
            >
              <motion.button
                onClick={handleSendMessage}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-xl bg-[#8478D4] text-white font-medium text-sm hover:bg-[#7165C0] transition-colors"
              >
                Send Message
              </motion.button>
              <motion.button
                onClick={handleKeepExploring}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-xl bg-transparent border border-[rgba(132,120,212,0.2)] text-[#9CA3AF] text-sm hover:text-white hover:border-[rgba(132,120,212,0.4)] transition-colors"
              >
                Keep Exploring
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Confetti */}
          <AnimatePresence>
            {confettiVisible && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 80 }).map((_, i) => (
                  <ConfettiPiece
                    key={i}
                    color={confettiColors[i % confettiColors.length]}
                    index={i}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

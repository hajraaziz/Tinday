"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AIOrbProps {
  size?: number;
  active?: boolean;
  className?: string;
}

// Animated gradient orb used as the AI assistant's avatar / brand mark.
// Gently breathes; spins a touch faster while `active` (streaming).
export function AIOrb({ size = 40, active = false, className }: AIOrbProps) {
  return (
    <motion.div
      className={cn("relative rounded-full", className)}
      style={{ width: size, height: size }}
      animate={{ scale: active ? [1, 1.08, 1] : [1, 1.03, 1] }}
      transition={{
        duration: active ? 1.4 : 3,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "conic-gradient(from 0deg, #8478D4, #C4B5FD, #6D5BD0, #8478D4)",
          filter: "blur(1px)",
        }}
        animate={{ rotate: 360 }}
        transition={{
          duration: active ? 4 : 12,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <div
        className="absolute rounded-full bg-[#151515]"
        style={{ inset: size * 0.18 }}
      />
      <div
        className="absolute rounded-full"
        style={{
          inset: size * 0.3,
          background:
            "radial-gradient(circle at 35% 30%, #C4B5FD, #8478D4 70%)",
        }}
      />
    </motion.div>
  );
}

"use client";

import { motion } from "framer-motion";
import { X, Sparkles, Heart } from "lucide-react";
import { toast } from "sonner";

interface SwipeActionsProps {
  onPass: () => void;
  onStar: () => void;
  onConnect: () => void;
  profileName?: string;
}

export function SwipeActions({
  onPass,
  onStar,
  onConnect,
  profileName,
}: SwipeActionsProps) {
  function handlePass() {
    onPass();
    if (profileName) {
      toast(`Passed on ${profileName}`, {
        style: {
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.2)",
          color: "#EF4444",
          fontSize: "13px",
        },
        duration: 1800,
      });
    }
  }

  function handleStar() {
    onStar();
    if (profileName) {
      toast(`Saved ${profileName}`, {
        style: {
          background: "rgba(245,158,11,0.1)",
          border: "1px solid rgba(245,158,11,0.2)",
          color: "#F59E0B",
          fontSize: "13px",
        },
        duration: 1800,
      });
    }
  }

  function handleConnect() {
    onConnect();
    if (profileName) {
      toast(`Connected with ${profileName}!`, {
        style: {
          background: "rgba(34,197,94,0.1)",
          border: "1px solid rgba(34,197,94,0.2)",
          color: "#22C55E",
          fontSize: "13px",
        },
        duration: 1800,
      });
    }
  }

  return (
    <div className="flex items-center justify-center gap-4 mt-6">
      <motion.button
        onClick={handlePass}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="w-[52px] h-[52px] rounded-full flex items-center justify-center bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] text-[#EF4444] hover:bg-[rgba(239,68,68,0.15)] transition-colors"
        aria-label="Pass"
      >
        <X className="w-6 h-6" />
      </motion.button>

      <motion.button
        onClick={handleStar}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="w-[44px] h-[44px] rounded-full flex items-center justify-center bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] text-[#F59E0B] hover:bg-[rgba(245,158,11,0.15)] transition-colors"
        aria-label="Super like"
      >
        <Sparkles className="w-5 h-5" />
      </motion.button>

      <motion.button
        onClick={handleConnect}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="w-[60px] h-[60px] rounded-full flex items-center justify-center bg-[rgba(132,120,212,0.12)] border border-[rgba(132,120,212,0.3)] text-[#8478D4] hover:bg-[rgba(132,120,212,0.2)] transition-colors"
        aria-label="Connect"
      >
        <Heart className="w-7 h-7" />
      </motion.button>
    </div>
  );
}

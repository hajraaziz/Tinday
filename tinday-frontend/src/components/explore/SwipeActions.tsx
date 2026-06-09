"use client";

import { motion } from "framer-motion";
import { X, Check } from "lucide-react";
import { toast } from "sonner";

interface SwipeActionsProps {
  onPass: () => void;
  onConnect: () => void;
  profileName?: string;
}

export function SwipeActions({
  onPass,
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
    <div className="relative z-20 flex items-center justify-center gap-6 mt-8">
      <motion.button
        onClick={handlePass}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="w-[60px] h-[60px] rounded-full flex items-center justify-center bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.25)] text-[#EF4444] hover:bg-[rgba(239,68,68,0.15)] transition-colors"
        aria-label="Pass"
      >
        <X className="w-7 h-7" />
      </motion.button>

      <motion.button
        onClick={handleConnect}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="w-[60px] h-[60px] rounded-full flex items-center justify-center bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.3)] text-[#22C55E] hover:bg-[rgba(34,197,94,0.18)] transition-colors"
        aria-label="Connect"
      >
        <Check className="w-7 h-7" />
      </motion.button>
    </div>
  );
}

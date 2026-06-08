"use client";

import { motion } from "framer-motion";
import { Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";
import type { PublicProfile } from "@/types";

const gradients = [
  "linear-gradient(135deg, #1B1535 0%, #2D1B4E 50%, #1C1829 100%)",
  "linear-gradient(135deg, #0F1A2E 0%, #1B2D4E 50%, #1C1829 100%)",
  "linear-gradient(135deg, #1A0F2E 0%, #2E1B4E 50%, #1C1829 100%)",
  "linear-gradient(135deg, #0F172A 0%, #1E2E4E 50%, #1C1829 100%)",
  "linear-gradient(135deg, #1C1535 0%, #3B1B5E 50%, #1C1829 100%)",
];

interface ProfileCardProps {
  profile: PublicProfile;
  index: number;
  swipeDirection?: "RIGHT" | "LEFT" | null;
  dragProgress?: number;
}

export function ProfileCard({
  profile,
  index,
  swipeDirection,
  dragProgress = 0,
}: ProfileCardProps) {
  const gradient = gradients[index % gradients.length];
  const experienceBadge =
    profile.experience_years > 0
      ? `${profile.experience_years}+ yrs`
      : null;
  const topSkills = profile.skills?.slice(0, 3) ?? [];
  const primaryRole = profile.roles?.[0];
  const location = "Remote";

  const connectedOpacity = swipeDirection === "RIGHT" ? Math.min(Math.abs(dragProgress), 1) : 0;
  const passedOpacity = swipeDirection === "LEFT" ? Math.min(Math.abs(dragProgress), 1) : 0;

  return (
    <motion.div
      className="relative w-64 h-96 rounded-3xl overflow-hidden flex-shrink-0"
      style={{
        background: gradient,
        border: "1px solid rgba(132,120,212,0.1)",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(10,9,15,0.95) 0%, rgba(10,9,15,0.6) 35%, rgba(10,9,15,0.1) 55%, transparent 100%)",
        }}
      />

      <button className="absolute top-3 left-3 p-2 rounded-full bg-black/30 backdrop-blur-sm text-white/60 hover:text-white transition-colors z-10">
        <Share2 className="w-4 h-4" />
      </button>

      {experienceBadge && (
        <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/30 backdrop-blur-sm text-xs font-medium text-[#9CA3AF] border border-[rgba(132,120,212,0.15)] z-10">
          {experienceBadge}
        </div>
      )}

      <div
        className="absolute top-8 left-4 z-20 pointer-events-none"
        style={{ opacity: connectedOpacity }}
      >
        <span className="text-xs font-bold tracking-widest text-[#22C55E] px-3 py-1 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30">
          CONNECTED
        </span>
      </div>

      <div
        className="absolute top-8 right-4 z-20 pointer-events-none"
        style={{ opacity: passedOpacity }}
      >
        <span className="text-xs font-bold tracking-widest text-[#EF4444] px-3 py-1 rounded-full bg-[#EF4444]/10 border border-[#EF4444]/30">
          PASSED
        </span>
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.name}
            className="w-24 h-24 rounded-full object-cover border-2 border-[rgba(132,120,212,0.3)]"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-[rgba(132,120,212,0.15)] border-2 border-[rgba(132,120,212,0.3)] flex items-center justify-center text-xl font-semibold text-[#8478D4]">
            {getInitials(profile.name)}
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 pt-12">
        <h3 className="text-lg font-semibold text-white mb-0.5 font-display">
          {profile.name}
        </h3>
        {primaryRole && (
          <p className="text-sm text-[#9CA3AF] mb-2">{primaryRole}</p>
        )}
        <div className="flex items-center gap-1.5 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
          <span className="text-xs text-[#4B5563]">{location}</span>
        </div>
        {topSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {topSkills.map((skill) => (
              <span
                key={skill}
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-[11px] font-medium",
                  "bg-[rgba(132,120,212,0.12)] text-[#8478D4] border border-[rgba(132,120,212,0.15)]"
                )}
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

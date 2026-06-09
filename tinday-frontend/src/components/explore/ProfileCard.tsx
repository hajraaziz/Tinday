"use client";

import { motion } from "framer-motion";
import { Share2, MapPin, FolderGit2, Briefcase } from "lucide-react";
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
    profile.experience_years > 0 ? `${profile.experience_years}+ yrs` : null;
  const topSkills = profile.skills?.slice(0, 5) ?? [];
  const extraSkills = Math.max((profile.skills?.length ?? 0) - topSkills.length, 0);
  const roles = profile.roles?.slice(0, 2) ?? [];
  const projectCount = profile.projects?.length ?? 0;

  const connectedOpacity =
    swipeDirection === "RIGHT" ? Math.min(Math.abs(dragProgress), 1) : 0;
  const passedOpacity =
    swipeDirection === "LEFT" ? Math.min(Math.abs(dragProgress), 1) : 0;

  return (
    <motion.div
      className="relative w-[21rem] max-w-[86vw] h-[32rem] rounded-[1.75rem] overflow-hidden flex-shrink-0 select-none"
      style={{
        background: gradient,
        border: "1px solid rgba(132,120,212,0.12)",
        boxShadow: "0 24px 60px -20px rgba(10,9,15,0.8)",
      }}
    >
      {/* radial glow behind the avatar */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[360px] h-[360px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(132,120,212,0.28) 0%, transparent 65%)",
        }}
      />

      {/* bottom scrim so text stays legible */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(10,9,15,0.97) 0%, rgba(10,9,15,0.85) 30%, rgba(10,9,15,0.35) 52%, transparent 72%)",
        }}
      />

      <button className="absolute top-3.5 left-3.5 p-2 rounded-full bg-black/30 backdrop-blur-sm text-white/60 hover:text-white transition-colors z-10">
        <Share2 className="w-4 h-4" />
      </button>

      {experienceBadge && (
        <div className="absolute top-3.5 right-3.5 px-3 py-1 rounded-full bg-black/30 backdrop-blur-sm text-xs font-medium text-[#9CA3AF] border border-[rgba(132,120,212,0.15)] z-10">
          {experienceBadge}
        </div>
      )}

      {/* swipe stamps */}
      <div
        className="absolute top-10 left-5 z-20 pointer-events-none -rotate-12"
        style={{ opacity: connectedOpacity }}
      >
        <span className="text-sm font-bold tracking-widest text-[#22C55E] px-4 py-1.5 rounded-xl bg-[#22C55E]/10 border-2 border-[#22C55E]/40">
          CONNECT
        </span>
      </div>
      <div
        className="absolute top-10 right-5 z-20 pointer-events-none rotate-12"
        style={{ opacity: passedOpacity }}
      >
        <span className="text-sm font-bold tracking-widest text-[#EF4444] px-4 py-1.5 rounded-xl bg-[#EF4444]/10 border-2 border-[#EF4444]/40">
          PASS
        </span>
      </div>

      {/* avatar */}
      <div className="absolute top-14 left-1/2 -translate-x-1/2">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.name}
            className="w-32 h-32 rounded-full object-cover border-2 border-[rgba(132,120,212,0.35)] shadow-lg"
          />
        ) : (
          <div className="w-32 h-32 rounded-full bg-[rgba(132,120,212,0.15)] border-2 border-[rgba(132,120,212,0.35)] flex items-center justify-center text-3xl font-semibold text-[#8478D4]">
            {getInitials(profile.name)}
          </div>
        )}
      </div>

      {/* details panel */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <h3 className="text-2xl font-semibold text-white mb-1 font-[family-name:var(--font-display)] leading-tight">
          {profile.name}
        </h3>

        {roles.length > 0 && (
          <p className="text-sm text-[#C4BEE8] mb-1.5">{roles.join(" · ")}</p>
        )}

        <div className="flex items-center gap-1.5 mb-3 text-xs text-[#9CA3AF]">
          <MapPin className="w-3.5 h-3.5 text-[#8478D4]" />
          <span>{profile.location || "Location not set"}</span>
        </div>

        {profile.about && (
          <p className="text-[13px] leading-relaxed text-[#D1D5DB] mb-3 line-clamp-2">
            {profile.about}
          </p>
        )}

        {topSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {topSkills.map((skill) => (
              <span
                key={skill}
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-[11px] font-medium",
                  "bg-[rgba(132,120,212,0.14)] text-[#A79CE6] border border-[rgba(132,120,212,0.2)]"
                )}
              >
                {skill}
              </span>
            ))}
            {extraSkills > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium text-[#6B7280]">
                +{extraSkills} more
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-4 text-[11px] text-[#9CA3AF] pt-2 border-t border-[rgba(132,120,212,0.1)]">
          {profile.experience_years > 0 && (
            <span className="flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-[#8478D4]" />
              {profile.experience_years} yrs exp
            </span>
          )}
          {projectCount > 0 && (
            <span className="flex items-center gap-1.5">
              <FolderGit2 className="w-3.5 h-3.5 text-[#8478D4]" />
              {projectCount} {projectCount === 1 ? "project" : "projects"}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

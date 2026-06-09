"use client";

import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import type { PublicProfile } from "@/types";

// Compact profile card embedded in a chat message when a profile is shared
// with the assistant for analysis.
export function SharedProfileCard({ profile }: { profile: PublicProfile }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(`/profile/${profile.id}`)}
      className="w-full flex items-center gap-3 rounded-xl bg-[#1C1829] border border-[rgba(132,120,212,0.15)] px-3 py-2.5 text-left hover:border-[rgba(132,120,212,0.35)] transition-colors"
    >
      <Avatar className="w-10 h-10 shrink-0">
        <AvatarImage src={profile.avatar_url ?? undefined} />
        <AvatarFallback className="bg-[#221E30] text-[#9CA3AF] text-xs">
          {getInitials(profile.name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-white">
          {profile.name}
        </p>
        {profile.roles?.[0] && (
          <p className="truncate text-xs text-[#9CA3AF]">{profile.roles[0]}</p>
        )}
        {profile.location && (
          <span className="flex items-center gap-1 text-[11px] text-[#9CA3AF] mt-0.5">
            <MapPin className="w-3 h-3 text-[#8478D4]" />
            {profile.location}
          </span>
        )}
      </div>
    </button>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import type { MatchWithUser } from "@/types";

interface MatchesModalProps {
  matches: MatchWithUser[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Lists the profiles a user has matched with. Opened from the "Matches" stat
// on the profile page; each row links to that user's public profile.
export function MatchesModal({ matches, open, onOpenChange }: MatchesModalProps) {
  const router = useRouter();

  const openProfile = (userId: string) => {
    onOpenChange(false);
    router.push(`/profile/${userId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[460px] max-h-[85vh] overflow-y-auto bg-[#1C1829] border border-[rgba(132,120,212,0.15)]">
        <DialogHeader>
          <DialogTitle className="font-[family-name:var(--font-display)] text-xl text-white">
            Matches
          </DialogTitle>
        </DialogHeader>

        {matches.length === 0 ? (
          <p className="py-10 text-center text-sm text-[#9CA3AF]">
            No matches yet.
          </p>
        ) : (
          <div className="space-y-1 py-1">
            {matches.map((m) => (
              <button
                key={m.match_id}
                onClick={() => openProfile(m.user.id)}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-[rgba(132,120,212,0.08)] transition-colors"
              >
                <Avatar className="w-12 h-12 shrink-0">
                  <AvatarImage src={m.user.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-[#221E30] text-[#9CA3AF] text-sm">
                    {getInitials(m.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {m.user.name}
                  </p>
                  {m.user.roles?.[0] && (
                    <p className="truncate text-xs text-[#9CA3AF]">
                      {m.user.roles[0]}
                    </p>
                  )}
                  {m.user.location && (
                    <span className="flex items-center gap-1 text-[11px] text-[#9CA3AF] mt-0.5">
                      <MapPin className="w-3 h-3 text-[#8478D4]" />
                      {m.user.location}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

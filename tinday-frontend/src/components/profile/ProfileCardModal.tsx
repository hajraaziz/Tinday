"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProfileCard } from "@/components/explore/ProfileCard";
import type { Profile, PublicProfile } from "@/types";

interface ProfileCardModalProps {
  profile: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Shows the user's Explore swipe card full-size as a modal overlay.
export function ProfileCardModal({
  profile,
  open,
  onOpenChange,
}: ProfileCardModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-fit border-0 bg-transparent p-0 shadow-none [&>button]:hidden">
        <DialogTitle className="sr-only">Your profile card preview</DialogTitle>
        <ProfileCard
          profile={profile as unknown as PublicProfile}
          index={0}
        />
      </DialogContent>
    </Dialog>
  );
}

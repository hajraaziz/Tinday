"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  LogOut,
  Share2,
  MoreHorizontal,
  Eye,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { useOwnProfile } from "@/hooks/useOwnProfile";
import { useUploadAvatar } from "@/hooks/useUploadAvatar";
import { useMatches } from "@/hooks/useMatches";
import { useAuthStore } from "@/store/authStore";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { IntroCard } from "@/components/profile/IntroCard";
import { AboutCard } from "@/components/profile/AboutCard";
import { ProjectsCard } from "@/components/profile/ProjectsCard";
import { LookingForCard } from "@/components/profile/LookingForCard";
import { EditProfileDialog } from "@/components/profile/EditProfileDialog";
import { MatchesModal } from "@/components/profile/MatchesModal";
import { ProfileCardModal } from "@/components/profile/ProfileCardModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string")
    : [];
}

export default function ProfilePage() {
  const router = useRouter();
  const storedProfile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { data, isLoading, isError, refetch } = useOwnProfile();
  const { data: matches = [] } = useMatches();
  const uploadAvatar = useUploadAvatar();
  const [editOpen, setEditOpen] = useState(false);
  const [matchesOpen, setMatchesOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const profile = data ?? storedProfile;

  if (!profile && isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 rounded-full border-2 border-[rgba(132,120,212,0.2)] border-t-[#8478D4] animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
        <p className="text-[#9CA3AF]">
          {isError ? "We couldn't load your profile." : "No profile found."}
        </p>
        <Button
          onClick={() => refetch()}
          className="bg-[#8478D4] text-white hover:bg-[#9488e0]"
        >
          Retry
        </Button>
      </div>
    );
  }

  const prefs = (profile.preferences ?? {}) as Record<string, unknown>;
  const primaryRole = profile.roles?.[0];
  const matchCount = matches.length;
  const connectNote =
    typeof prefs.connect_note === "string"
      ? (prefs.connect_note as string)
      : "";

  const handleShare = async () => {
    const url = `${window.location.origin}/profile/${profile.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Profile link copied to clipboard");
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  return (
    <div className="min-h-full pb-12 pt-6">
      <div className="max-w-5xl mx-auto px-4 space-y-5">
        {/* Top row — profile-pic card + Intro */}
        <div className="grid lg:grid-cols-[1fr_360px] gap-5 items-start">
          {/* Hero card */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl overflow-hidden bg-[#1C1829] border border-[rgba(132,120,212,0.1)]"
          >
            {/* Cover */}
            <div className="relative h-[140px] overflow-hidden">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(135deg, #1B1535 0%, #2D1B4E 50%, #151515 100%)",
                }}
              />
              <div
                className="absolute top-1/2 left-1/2 w-[360px] h-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle, rgba(132,120,212,0.35) 0%, transparent 70%)",
                }}
              />

              {/* Three-dot menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white/80 hover:text-white hover:bg-black/40 transition-all outline-none data-[state=open]:bg-black/50 data-[state=open]:text-white"
                    aria-label="Profile options"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 bg-[#1A1726] border-[rgba(132,120,212,0.12)] text-white"
                >
                  <DropdownMenuItem
                    onClick={() => setPreviewOpen(true)}
                    className="cursor-pointer focus:bg-[rgba(132,120,212,0.12)] focus:text-white"
                  >
                    <Eye className="w-4 h-4" />
                    Preview profile card
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleShare}
                    className="cursor-pointer focus:bg-[rgba(132,120,212,0.12)] focus:text-white"
                  >
                    <Share2 className="w-4 h-4" />
                    Share profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[rgba(132,120,212,0.12)]" />
                  <DropdownMenuItem
                    onClick={() => setEditOpen(true)}
                    className="cursor-pointer focus:bg-[rgba(132,120,212,0.12)] focus:text-white"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit profile
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="px-5 pb-5">
              {/* Avatar overlapping the cover */}
              <div className="-mt-12">
                <AvatarUpload
                  currentUrl={profile.avatar_url}
                  name={profile.name}
                  onUpload={(file) =>
                    uploadAvatar.mutate(file, {
                      onSuccess: () => toast.success("Photo updated"),
                      onError: () => toast.error("Upload failed. Try again."),
                    })
                  }
                  isUploading={uploadAvatar.isPending}
                />
              </div>

              {/* Identity */}
              <div className="mt-4">
                <h1 className="text-[28px] leading-tight font-semibold text-white font-[family-name:var(--font-display)]">
                  {profile.name}
                </h1>
                {primaryRole && (
                  <p className="text-sm text-[#9CA3AF] mt-1">{primaryRole}</p>
                )}
              </div>
            </div>
          </motion.section>

          {/* Intro */}
          <IntroCard
            socials={profile.socials}
            email={user?.email}
            location={profile.location}
            role={primaryRole}
            experienceYears={profile.experience_years}
            matchCount={matchCount}
            onMatchesClick={() => setMatchesOpen(true)}
            onEdit={() => setEditOpen(true)}
          />
        </div>

        {/* About */}
        <AboutCard
          about={profile.about}
          skills={profile.skills ?? []}
          roles={profile.roles ?? []}
          onEdit={() => setEditOpen(true)}
        />

        {/* Projects */}
        <ProjectsCard
          projects={profile.projects ?? []}
          onEdit={() => setEditOpen(true)}
        />

        {/* Looking For */}
        <LookingForCard
          connectNote={connectNote}
          preferredSkills={asStringArray(prefs.preferred_skills)}
          preferredRoles={asStringArray(prefs.preferred_roles)}
          onEdit={() => setEditOpen(true)}
        />

        {/* Settings links — mobile only; desktop uses the sidebar footer */}
        <div className="md:hidden rounded-2xl overflow-hidden bg-[#1C1829] border border-[rgba(132,120,212,0.1)]">
          <button
            onClick={() => router.push("/settings")}
            className="w-full flex items-center gap-3 px-5 py-4 text-left text-white hover:bg-[rgba(132,120,212,0.04)] transition-colors border-b border-[rgba(132,120,212,0.06)]"
          >
            <Settings className="w-5 h-5 text-[#9CA3AF]" />
            <span className="text-sm">Account &amp; Settings</span>
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-5 py-4 text-left text-[#EF4444] hover:bg-[rgba(239,68,68,0.05)] transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Log Out</span>
          </button>
        </div>
      </div>

      <EditProfileDialog
        profile={profile}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <MatchesModal
        matches={matches}
        open={matchesOpen}
        onOpenChange={setMatchesOpen}
      />

      <ProfileCardModal
        profile={profile}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}

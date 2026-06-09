"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue } from "framer-motion";
import { Settings, LogOut, Share2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useOwnProfile } from "@/hooks/useOwnProfile";
import { useUploadAvatar } from "@/hooks/useUploadAvatar";
import { useMatches } from "@/hooks/useMatches";
import { useAuthStore } from "@/store/authStore";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { StatCounter } from "@/components/profile/StatCounter";
import { ProfileBody } from "@/components/profile/ProfileBody";
import { EditProfileDialog } from "@/components/profile/EditProfileDialog";
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
  const logout = useAuthStore((s) => s.logout);
  const { data, isLoading, isError, refetch } = useOwnProfile();
  const { data: matches = [] } = useMatches();
  const uploadAvatar = useUploadAvatar();
  const [editOpen, setEditOpen] = useState(false);

  // Cover parallax — the scroll container is the app shell's <main>, not the
  // window, so we drive a motion value off its scrollTop at 30% speed.
  const coverY = useMotionValue(0);
  useEffect(() => {
    const scroller = document.querySelector("main");
    if (!scroller) return;
    const onScroll = () => coverY.set(scroller.scrollTop * 0.3);
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [coverY]);

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
          {isError
            ? "We couldn't load your profile."
            : "No profile found."}
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
    <div className="min-h-full pb-12">
      {/* Cover */}
      <div className="relative h-[200px] overflow-hidden">
        <motion.div
          style={{ y: coverY }}
          className="absolute inset-0 -top-16 bottom-0"
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, #1B1535 0%, #2D1B4E 50%, #151515 100%)",
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 w-[420px] h-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(132,120,212,0.35) 0%, transparent 70%)",
            }}
          />
        </motion.div>
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#151515] to-transparent" />
      </div>

      <div className="max-w-2xl mx-auto px-4">
        {/* Avatar overlapping cover */}
        <div className="-mt-12 flex items-end justify-between">
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
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08 } },
          }}
          className="mt-4"
        >
          {[
            <h1
              key="name"
              className="text-[28px] leading-tight font-semibold text-white font-[family-name:var(--font-display)]"
            >
              {profile.name}
            </h1>,
            primaryRole ? (
              <p key="role" className="text-sm text-[#9CA3AF] mt-1">
                {primaryRole}
              </p>
            ) : null,
            <div key="loc" className="flex items-center gap-3 mt-2">
              {profile.location && (
                <span className="flex items-center gap-1 text-xs text-[#9CA3AF]">
                  <MapPin className="w-3.5 h-3.5 text-[#8478D4]" />
                  {profile.location}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                <span className="text-xs text-[#4B5563]">Available to connect</span>
              </span>
            </div>,
          ]
            .filter(Boolean)
            .map((child, i) => (
              <motion.div
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 8 },
                  show: { opacity: 1, y: 0 },
                }}
              >
                {child}
              </motion.div>
            ))}
        </motion.div>

        {/* Action row */}
        <div className="flex items-center gap-3 mt-5">
          <Button
            onClick={() => setEditOpen(true)}
            variant="outline"
            className="flex-1 border-[rgba(132,120,212,0.3)] bg-transparent text-white hover:bg-[rgba(132,120,212,0.08)] hover:text-white"
          >
            Edit Profile
          </Button>
          <Button
            onClick={handleShare}
            variant="outline"
            className="border-[rgba(132,120,212,0.3)] bg-transparent text-[#8478D4] hover:bg-[rgba(132,120,212,0.08)] hover:text-[#8478D4]"
          >
            <Share2 className="w-4 h-4" />
            Share Profile
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-6 mb-2 py-4 rounded-2xl bg-[#1C1829] border border-[rgba(132,120,212,0.1)]">
          <StatCounter value={matchCount} label="Connections" />
          <StatCounter value={matchCount} label="Matches" />
          <StatCounter value={0} label="Profile Views" />
        </div>

        {/* Content cards */}
        <div className="mt-4">
          <ProfileBody
            data={profile}
            onEdit={() => setEditOpen(true)}
            lookingFor={{
              skills: asStringArray(prefs.preferred_skills),
              roles: asStringArray(prefs.preferred_roles),
            }}
          />
        </div>

        {/* Settings links */}
        <div className="mt-6 rounded-2xl overflow-hidden bg-[#1C1829] border border-[rgba(132,120,212,0.1)]">
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
    </div>
  );
}

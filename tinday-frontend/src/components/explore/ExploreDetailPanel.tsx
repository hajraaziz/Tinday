"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { MessageCircle, UserPlus, Check, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { useMatches } from "@/hooks/useMatches";
import { useRecordSwipe } from "@/hooks/useRecordSwipe";
import { useAIStore } from "@/store/aiStore";
import { IntroCard } from "@/components/profile/IntroCard";
import { AboutCard } from "@/components/profile/AboutCard";
import { ProjectsCard } from "@/components/profile/ProjectsCard";
import { LookingForCard } from "@/components/profile/LookingForCard";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";
import type { PublicProfile } from "@/types";

interface ExploreDetailPanelProps {
  profile: PublicProfile;
  onClose: () => void;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string")
    : [];
}

// Skills/Roles layout for the (narrow, resizable) detail panel: stacked by
// default so a sparse card stays short, splitting into two content-width columns
// (packed left, not a wide 50/50 split) only once the panel is wide enough.
const PANEL_PILLS_LAYOUT =
  "grid grid-cols-1 @xl:grid-cols-[repeat(2,minmax(0,max-content))] @xl:justify-start gap-x-10 gap-y-4 mt-4";

/**
 * The "Detail" side of the Explore master-detail split: a self-contained,
 * scrollable full profile for the carousel's current card. Mirrors the bento
 * layout of the internal /profile page (header + intro on top, then about,
 * projects, looking-for) in read-only mode, scrolling in its own container and
 * adding connect/message/AI actions.
 */
export function ExploreDetailPanel({
  profile,
  onClose,
}: ExploreDetailPanelProps) {
  const router = useRouter();
  const { data: matches = [] } = useMatches();
  const recordSwipe = useRecordSwipe();
  const createConversation = useAIStore((s) => s.createConversation);
  const [sentConnect, setSentConnect] = useState(false);

  const existingMatch = matches.find((m) => m.user.id === profile.id);
  const primaryRole = profile.roles?.[0];

  const prefs = (profile.preferences ?? {}) as Record<string, unknown>;
  const connectNote =
    typeof prefs.connect_note === "string" ? (prefs.connect_note as string) : "";

  const handleAskAI = () => {
    const id = createConversation();
    router.push(`/chat/${id}?share=${profile.id}`);
  };

  const handleConnect = () => {
    recordSwipe.mutate(
      { receiver_id: profile.id, direction: "RIGHT" },
      {
        onSuccess: (res) => {
          setSentConnect(true);
          if (res.match) {
            toast.success(`It's a match with ${profile.name}!`);
          } else {
            toast.success("Connection request sent");
          }
        },
        onError: () => toast.error("Something went wrong. Try again."),
      }
    );
  };

  return (
    <div className="h-full overflow-y-auto @container">
      <div className="mx-auto px-4 py-6 space-y-5 w-full max-w-5xl">
        {/* Top row — main header card beside Intro (matches /profile). No
            `items-start`: the Intro stretches to the hero's height so a sparse
            Intro doesn't leave a black gap beneath it. */}
        <div className="grid @2xl:grid-cols-[1fr_320px] gap-5">
          {/* Hero card — read-only adaptation of the /profile hero */}
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
              {/* Dismiss */}
              <button
                onClick={onClose}
                aria-label="Close profile"
                className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white/80 hover:text-white hover:bg-black/40 transition-all outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 pb-5">
              {/* Avatar overlapping the cover (read-only). `relative z-10` keeps
                  it painted above the positioned cover, which would otherwise
                  cover the half that overlaps upward. */}
              <div className="relative z-10 -mt-12">
                <div className="w-24 h-24 rounded-full overflow-hidden border-[3px] border-[#8478D4] bg-[#221E30]">
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.name}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-semibold text-[#8478D4]">
                      {getInitials(profile.name)}
                    </div>
                  )}
                </div>
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

              {/* Action row */}
              <div className="flex items-center gap-3 mt-5">
                {existingMatch ? (
                  <Button
                    onClick={() =>
                      router.push(`/inbox/${existingMatch.match_id}`)
                    }
                    className="flex-1 bg-[#8478D4] text-white hover:bg-[#9488e0]"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Message
                  </Button>
                ) : (
                  <Button
                    onClick={handleConnect}
                    disabled={recordSwipe.isPending || sentConnect}
                    className="flex-1 bg-[#8478D4] text-white hover:bg-[#9488e0] disabled:opacity-60"
                  >
                    {sentConnect ? (
                      <>
                        <Check className="w-4 h-4" /> Request Sent
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" /> Connect
                      </>
                    )}
                  </Button>
                )}
                <Button
                  onClick={handleAskAI}
                  variant="outline"
                  className="border-[rgba(132,120,212,0.3)] bg-transparent text-[#8478D4] hover:bg-[rgba(132,120,212,0.08)] hover:text-[#8478D4]"
                >
                  <Sparkles className="w-4 h-4" />
                  Ask AI
                </Button>
              </div>
            </div>
          </motion.section>

          {/* Intro (read-only: no edit pencil, matches row, or contact prompt) */}
          <IntroCard
            socials={profile.socials ?? null}
            location={profile.location}
            role={primaryRole}
            experienceYears={profile.experience_years}
          />
        </div>

        {/* About — renders null when there's nothing to show */}
        <AboutCard
          about={profile.about}
          skills={profile.skills ?? []}
          roles={profile.roles ?? []}
          pillsClassName={PANEL_PILLS_LAYOUT}
        />

        {/* Projects — renders null when empty */}
        <ProjectsCard projects={profile.projects ?? []} />

        {/* Looking For — now populated from the public `preferences` data */}
        <LookingForCard
          connectNote={connectNote}
          preferredSkills={asStringArray(prefs.preferred_skills)}
          preferredRoles={asStringArray(prefs.preferred_roles)}
          pillsClassName={PANEL_PILLS_LAYOUT}
        />
      </div>
    </div>
  );
}

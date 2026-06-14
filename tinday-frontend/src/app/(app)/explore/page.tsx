"use client";

import {
  Suspense,
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useExploreFeed } from "@/hooks/useExploreFeed";
import { usePublicProfile } from "@/hooks/usePublicProfile";
import { useRecordSwipe } from "@/hooks/useRecordSwipe";
import { useAuthStore } from "@/store/authStore";
import { FilterBar } from "@/components/explore/FilterBar";
import { CardCarousel } from "@/components/explore/CardCarousel";
import { ExploreDetailPanel } from "@/components/explore/ExploreDetailPanel";
import { MatchOverlay } from "@/components/explore/MatchOverlay";
import { cn } from "@/lib/utils";
import type { PublicProfile } from "@/types";

const EXPERIENCE_RANGES: Record<string, { min: number; max: number }> = {
  "1-3 yrs": { min: 1, max: 3 },
  "3-5 yrs": { min: 3, max: 5 },
  "5+ yrs": { min: 5, max: 50 },
};

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string")
    : [];
}

function ExploreInner() {
  const [selectedExperience, setSelectedExperience] = useState<string | null>(
    null
  );
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const ownProfile = useAuthStore((s) => s.profile);

  const filterParams = useMemo(() => {
    const params: {
      skills?: string[];
      roles?: string[];
      location?: string;
      min_experience?: number;
      max_experience?: number;
    } = {};
    if (selectedSkills.length > 0) params.skills = selectedSkills;
    if (selectedRoles.length > 0) params.roles = selectedRoles;
    const trimmedLocation = location.trim();
    if (trimmedLocation) params.location = trimmedLocation;
    if (selectedExperience && EXPERIENCE_RANGES[selectedExperience]) {
      params.min_experience = EXPERIENCE_RANGES[selectedExperience].min;
      params.max_experience = EXPERIENCE_RANGES[selectedExperience].max;
    }
    return params;
  }, [selectedSkills, selectedRoles, location, selectedExperience]);

  const { data: profiles = [], isLoading } = useExploreFeed(filterParams);
  const recordSwipe = useRecordSwipe();

  // Master-detail split: tapping a card opens a detail panel that stays synced
  // to the carousel's current card.
  const [splitOpen, setSplitOpen] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<PublicProfile | null>(
    null
  );

  // User-adjustable split. The detail panel can be dragged narrower (down to a
  // floor that keeps its bento cards legible) but never wider than half the main
  // content area. `detailWidth === null` means "use the default 50% cap".
  const splitRowRef = useRef<HTMLDivElement>(null);
  const [detailWidth, setDetailWidth] = useState<number | null>(null);
  const MIN_DETAIL_WIDTH = 360;

  const startResize = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    const container = splitRowRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const max = rect.width / 2;
    const onMove = (ev: PointerEvent) => {
      const raw = rect.right - ev.clientX;
      setDetailWidth(Math.min(max, Math.max(MIN_DETAIL_WIDTH, raw)));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
  }, []);

  // Keep a dragged width within the 50% cap as the viewport (and thus the main
  // content area) changes size.
  useEffect(() => {
    const container = splitRowRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => {
      setDetailWidth((w) => {
        if (w == null) return w;
        const max = container.getBoundingClientRect().width / 2;
        return Math.min(Math.max(MIN_DETAIL_WIDTH, w), max);
      });
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Arriving from a "wants to connect" notification: ?connect=<giverId> surfaces
  // that person's card first so the user can swipe right back (→ match) or pass.
  const searchParams = useSearchParams();
  const connectId = searchParams.get("connect") ?? undefined;
  // Per-click nonce (see withNavNonce): lets a repeat tap of the same connection
  // re-surface the card even though `connect` is unchanged.
  const focusNonce = searchParams.get("t") ?? "";
  const { data: focusProfile } = usePublicProfile(connectId);

  // Skill options: seed from the user's own skills + what they're looking for,
  // unioned with skills present in the current feed and any already selected
  // (so a selected skill never vanishes from the panel as the feed narrows).
  const skillOptions = useMemo(() => {
    const prefs = (ownProfile?.preferences ?? {}) as Record<string, unknown>;
    const set = new Set<string>([
      ...(ownProfile?.skills ?? []),
      ...asStringArray(prefs.preferred_skills),
      ...profiles.flatMap((p) => p.skills ?? []),
      ...selectedSkills,
    ]);
    return Array.from(set)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 30);
  }, [ownProfile, profiles, selectedSkills]);

  // Role suggestions: seed from the user's own roles + roles present in the
  // current feed + any already selected (so a selection never disappears as the
  // feed narrows). Mirrors skillOptions above.
  const roleOptions = useMemo(() => {
    const prefs = (ownProfile?.preferences ?? {}) as Record<string, unknown>;
    const set = new Set<string>([
      ...(ownProfile?.roles ?? []),
      ...asStringArray(prefs.preferred_roles),
      ...profiles.flatMap((p) => p.roles ?? []),
      ...selectedRoles,
    ]);
    return Array.from(set)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 30);
  }, [ownProfile, profiles, selectedRoles]);

  const handleSwipe = useCallback(
    (profile: PublicProfile, direction: "RIGHT" | "LEFT") => {
      recordSwipe.mutate({ receiver_id: profile.id, direction });
    },
    [recordSwipe]
  );

  // Front-load the focused profile (deduped) when arriving from a connect
  // notification; otherwise show the feed as-is.
  const displayProfiles = useMemo(() => {
    if (!focusProfile) return profiles;
    return [focusProfile, ...profiles.filter((p) => p.id !== focusProfile.id)];
  }, [focusProfile, profiles]);

  // Filter controls. Sits globally beneath the header in full-width mode, but
  // relocates into the left (Master) column when the split view is open so it
  // never stretches across the Detail panel.
  const filterBar = (
    <FilterBar
      selectedExperience={selectedExperience}
      onExperienceChange={setSelectedExperience}
      selectedSkills={selectedSkills}
      onSkillsChange={setSelectedSkills}
      skillOptions={skillOptions}
      selectedRoles={selectedRoles}
      onRolesChange={setSelectedRoles}
      roleOptions={roleOptions}
      location={location}
      onLocationChange={setLocation}
    />
  );

  return (
    <div className="h-full flex flex-col">
      {/* Global filter bar — full-width state only. */}
      {!splitOpen && <div className="px-4 pt-4">{filterBar}</div>}

      <div ref={splitRowRef} className="flex-1 min-h-0 flex">
        {/* Master: filter bar (when split) + swipeable card stack. Narrows when
            the detail panel opens; hidden on mobile where Detail goes fullscreen. */}
        <div
          className={cn(
            "min-w-0 flex flex-col transition-[flex-basis] duration-300 ease-out",
            splitOpen ? "hidden md:flex md:flex-1" : "basis-full"
          )}
        >
          {splitOpen && <div className="px-4 pt-4">{filterBar}</div>}
          <CardCarousel
            key={connectId ? `${connectId}:${focusNonce}` : "feed"}
            profiles={displayProfiles}
            onSwipe={handleSwipe}
            isLoading={isLoading}
            onCardClick={() => setSplitOpen(true)}
            onCurrentChange={setCurrentProfile}
            compact={splitOpen}
          />
        </div>

        {/* Detail: full profile of the current card. Full-height side-by-side
            on desktop (flush under the header, bypassing the filter bar);
            full-screen overlay on mobile. */}
        <AnimatePresence>
          {splitOpen && currentProfile && (
            <motion.aside
              key="detail"
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              style={
                {
                  "--detail-w": detailWidth ? `${detailWidth}px` : undefined,
                } as React.CSSProperties
              }
              className="fixed inset-0 z-50 bg-[#151515] md:relative md:z-auto md:flex-none md:w-[var(--detail-w,50%)] md:max-w-[50%] md:min-w-0 md:border-l md:border-[rgba(132,120,212,0.1)]"
            >
              {/* Drag handle — desktop only. Sits over the left border so the
                  user can widen/narrow the detail panel within the 50% cap. */}
              <div
                onPointerDown={startResize}
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize detail panel"
                className="group absolute inset-y-0 left-0 z-20 hidden w-2 -translate-x-1/2 cursor-col-resize md:block"
              >
                <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-transparent transition-colors group-hover:bg-[#8478D4]/50" />
              </div>
              <ExploreDetailPanel
                profile={currentProfile}
                onClose={() => setSplitOpen(false)}
              />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      <MatchOverlay />
    </div>
  );
}

export default function ExplorePage() {
  // useSearchParams requires a Suspense boundary (matches the repo's other
  // search-param pages, e.g. reset-password).
  return (
    <Suspense fallback={null}>
      <ExploreInner />
    </Suspense>
  );
}

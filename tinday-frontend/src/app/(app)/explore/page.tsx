"use client";

import { Suspense, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useExploreFeed } from "@/hooks/useExploreFeed";
import { usePublicProfile } from "@/hooks/usePublicProfile";
import { useRecordSwipe } from "@/hooks/useRecordSwipe";
import { useAuthStore } from "@/store/authStore";
import { FilterBar } from "@/components/explore/FilterBar";
import { CardCarousel } from "@/components/explore/CardCarousel";
import { MatchOverlay } from "@/components/explore/MatchOverlay";
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

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 pt-4">
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
      </div>

      <CardCarousel
        key={connectId ? `${connectId}:${focusNonce}` : "feed"}
        profiles={displayProfiles}
        onSwipe={handleSwipe}
        isLoading={isLoading}
      />

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

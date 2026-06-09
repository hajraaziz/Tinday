"use client";

import { useState, useCallback, useMemo } from "react";
import { useExploreFeed } from "@/hooks/useExploreFeed";
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

export default function ExplorePage() {
  const [selectedExperience, setSelectedExperience] = useState<string | null>(
    null
  );
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const ownProfile = useAuthStore((s) => s.profile);

  const filterParams = useMemo(() => {
    const params: {
      skills?: string[];
      min_experience?: number;
      max_experience?: number;
    } = {};
    if (selectedSkills.length > 0) params.skills = selectedSkills;
    if (selectedExperience && EXPERIENCE_RANGES[selectedExperience]) {
      params.min_experience = EXPERIENCE_RANGES[selectedExperience].min;
      params.max_experience = EXPERIENCE_RANGES[selectedExperience].max;
    }
    return params;
  }, [selectedSkills, selectedExperience]);

  const { data: profiles = [], isLoading } = useExploreFeed(filterParams);
  const recordSwipe = useRecordSwipe();

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

  const handleSwipe = useCallback(
    (profile: PublicProfile, direction: "RIGHT" | "LEFT") => {
      recordSwipe.mutate({ receiver_id: profile.id, direction });
    },
    [recordSwipe]
  );

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 pt-4">
        <FilterBar
          selectedExperience={selectedExperience}
          onExperienceChange={setSelectedExperience}
          selectedSkills={selectedSkills}
          onSkillsChange={setSelectedSkills}
          skillOptions={skillOptions}
        />
      </div>

      <CardCarousel
        profiles={profiles}
        onSwipe={handleSwipe}
        isLoading={isLoading}
      />

      <MatchOverlay />
    </div>
  );
}

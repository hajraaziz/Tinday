"use client";

import { useState, useCallback } from "react";
import { useExploreFeed } from "@/hooks/useExploreFeed";
import { useRecordSwipe } from "@/hooks/useRecordSwipe";
import { FilterBar } from "@/components/explore/FilterBar";
import { CardCarousel } from "@/components/explore/CardCarousel";
import { MatchOverlay } from "@/components/explore/MatchOverlay";
import type { PublicProfile } from "@/types";

export default function ExplorePage() {
  const [selectedFilter, setSelectedFilter] = useState("All");

  // Map filter selection to API params
  const filterParams = (() => {
    const roleSkills = ["Design", "Engineering", "Product"];
    if (roleSkills.includes(selectedFilter)) {
      return { skills: selectedFilter };
    }
    if (selectedFilter === "1-3 yrs") {
      return { min_experience: 1, max_experience: 3 };
    }
    if (selectedFilter === "3-5 yrs") {
      return { min_experience: 3, max_experience: 5 };
    }
    if (selectedFilter === "5+ yrs") {
      return { min_experience: 5, max_experience: 50 };
    }
    // "All" or unhandled
    return {};
  })();

  const { data: profiles = [], isLoading } = useExploreFeed(filterParams);
  const recordSwipe = useRecordSwipe();

  const handleSwipe = useCallback(
    (profile: PublicProfile, direction: "RIGHT" | "LEFT") => {
      recordSwipe.mutate({
        receiver_id: profile.id,
        direction,
      });
    },
    [recordSwipe]
  );

  const handleStar = useCallback(
    (profile: PublicProfile) => {
      recordSwipe.mutate({
        receiver_id: profile.id,
        direction: "RIGHT",
      });
    },
    [recordSwipe]
  );

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 pt-4">
        <FilterBar
          selectedFilter={selectedFilter}
          onFilterChange={setSelectedFilter}
        />
      </div>

      <CardCarousel
        profiles={profiles}
        onSwipe={handleSwipe}
        onStar={handleStar}
        isLoading={isLoading}
      />

      <MatchOverlay />
    </div>
  );
}

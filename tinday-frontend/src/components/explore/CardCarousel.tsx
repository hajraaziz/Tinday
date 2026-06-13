"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProfileCard } from "./ProfileCard";
import { SwipeActions } from "./SwipeActions";
import { useSwipe } from "@/hooks/useSwipe";
import { cn } from "@/lib/utils";
import type { PublicProfile } from "@/types";

interface CardCarouselProps {
  profiles: PublicProfile[];
  onSwipe: (profile: PublicProfile, direction: "RIGHT" | "LEFT") => void;
  isLoading?: boolean;
  // Tap (not drag) on the active card — used to open the detail split view.
  onCardClick?: (profile: PublicProfile) => void;
  // Fires whenever the active card changes (swipe, prev/next, filter reset),
  // so a synced detail panel can follow the current profile.
  onCurrentChange?: (profile: PublicProfile | null) => void;
  // Narrower layout for when the carousel shares the screen with a detail panel.
  compact?: boolean;
}

function SkeletonCard() {
  return (
    <div className="relative w-[21rem] max-w-[86vw] h-[32rem] rounded-[1.75rem] overflow-hidden flex-shrink-0 bg-[#1C1829] border border-[rgba(132,120,212,0.1)] animate-pulse">
      <div className="absolute top-14 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-[#221E30]" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="h-7 w-40 bg-[#221E30] rounded mb-2" />
        <div className="h-4 w-28 bg-[#221E30] rounded mb-3" />
        <div className="h-3 w-full bg-[#221E30] rounded mb-1.5" />
        <div className="h-3 w-2/3 bg-[#221E30] rounded mb-3" />
        <div className="flex gap-1.5">
          <div className="h-5 w-16 bg-[#221E30] rounded-full" />
          <div className="h-5 w-16 bg-[#221E30] rounded-full" />
          <div className="h-5 w-12 bg-[#221E30] rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function CardCarousel({
  profiles,
  onSwipe,
  isLoading,
  onCardClick,
  onCurrentChange,
  compact,
}: CardCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  // Direction the leaving card flies off toward (drives the exit animation).
  const [exitDir, setExitDir] = useState<1 | -1>(1);

  // Reset to the top of the feed whenever it changes (e.g. filters applied).
  // Adjusting state during render off a tracked prev value is the React-blessed
  // alternative to a reset effect (no extra commit / cascading render).
  const [prevCount, setPrevCount] = useState(profiles.length);
  if (prevCount !== profiles.length) {
    setPrevCount(profiles.length);
    setCurrentIndex(0);
  }

  // Report the active profile so a synced detail panel can follow it. Covers
  // every change path (swipe, prev/next, filter reset, empty feed).
  useEffect(() => {
    onCurrentChange?.(profiles[currentIndex] ?? null);
  }, [currentIndex, profiles, onCurrentChange]);

  const advance = useCallback(() => {
    if (profiles.length === 0) return;
    setExitDir(1);
    setCurrentIndex((prev) => (prev + 1) % profiles.length);
  }, [profiles.length]);

  const retreat = useCallback(() => {
    if (profiles.length === 0) return;
    setExitDir(-1);
    setCurrentIndex((prev) => (prev - 1 + profiles.length) % profiles.length);
  }, [profiles.length]);

  const handleSwipe = useCallback(
    (direction: "RIGHT" | "LEFT") => {
      if (profiles.length === 0) return;
      onSwipe(profiles[currentIndex], direction);
      setExitDir(direction === "RIGHT" ? 1 : -1);
      setCurrentIndex((prev) => (prev + 1) % profiles.length);
    },
    [profiles, currentIndex, onSwipe]
  );

  // Drag-to-swipe on the active card (mouse + touch).
  const swipe = useSwipe({
    onSwipeLeft: () => handleSwipe("LEFT"),
    onSwipeRight: () => handleSwipe("RIGHT"),
    enabled: profiles.length > 0,
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <SkeletonCard />
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center px-8">
          <div className="w-20 h-20 rounded-full bg-[#1C1829] border border-[rgba(132,120,212,0.1)] flex items-center justify-center mx-auto mb-4">
            <ChevronRight className="w-8 h-8 text-[#4B5563]" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No profiles yet</h3>
          <p className="text-sm text-[#9CA3AF]">
            Try adjusting your filters or complete your profile to see more
            recommendations.
          </p>
        </div>
      </div>
    );
  }

  const profile = profiles[currentIndex];
  const flyDistance =
    typeof window !== "undefined" ? window.innerWidth : 800;

  const cardVariants = {
    enter: { opacity: 0, scale: 0.96, x: 0, rotateZ: 0 },
    center: { opacity: 1, scale: 1, x: 0, rotateZ: 0 },
    exit: (dir: 1 | -1) => ({
      x: dir * flyDistance,
      rotateZ: dir * 18,
      opacity: 0,
    }),
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div
        className={cn(
          "relative flex items-center justify-center w-full mx-auto h-[32rem] flex-shrink-0 transition-[max-width] duration-300 ease-out",
          compact ? "max-w-sm" : "max-w-2xl"
        )}
      >
        <button
          onClick={retreat}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-[#1C1829]/80 backdrop-blur-sm border border-[rgba(132,120,212,0.12)] text-[#9CA3AF] hover:text-white transition-colors"
          aria-label="Previous profile"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Only one card is mounted at a time; the leaving card flies off via
            the exit animation while the next fades in. No stacked deck, so
            there is nothing to ghost through behind it. */}
        <AnimatePresence initial={false} custom={exitDir} mode="popLayout">
          <motion.div
            key={profile.id}
            className="absolute cursor-grab active:cursor-grabbing"
            custom={exitDir}
            variants={cardVariants}
            initial="enter"
            animate={
              swipe.isDragging
                ? { opacity: 1, scale: 1, x: swipe.x, rotateZ: swipe.rotation }
                : "center"
            }
            exit="exit"
            transition={
              swipe.isDragging
                ? { duration: 0 }
                : { type: "spring", stiffness: 300, damping: 30 }
            }
            style={{ zIndex: 10 }}
          >
            <div
              {...swipe.bind()}
              onClick={() => {
                // Ignore the synthetic click that follows a drag-release.
                if (swipe.wasDragged()) return;
                onCardClick?.(profile);
              }}
              style={{ touchAction: "pan-y" }}
            >
              <ProfileCard
                profile={profile}
                index={currentIndex}
                swipeDirection={swipe.isDragging ? swipe.swipeDirection : null}
                dragProgress={swipe.progress}
              />
            </div>
          </motion.div>
        </AnimatePresence>

        <button
          onClick={advance}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-[#1C1829]/80 backdrop-blur-sm border border-[rgba(132,120,212,0.12)] text-[#9CA3AF] hover:text-white transition-colors"
          aria-label="Next profile"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <SwipeActions
        onPass={() => handleSwipe("LEFT")}
        onConnect={() => handleSwipe("RIGHT")}
        profileName={profile?.name}
      />
    </div>
  );
}

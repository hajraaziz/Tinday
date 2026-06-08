"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProfileCard } from "./ProfileCard";
import { SwipeActions } from "./SwipeActions";
import type { PublicProfile } from "@/types";

interface CardCarouselProps {
  profiles: PublicProfile[];
  onSwipe: (profile: PublicProfile, direction: "RIGHT" | "LEFT") => void;
  onStar?: (profile: PublicProfile) => void;
  isLoading?: boolean;
}

function getCardStyle(position: number) {
  if (position === 0) {
    return {
      scale: 1,
      opacity: 1,
      filter: "blur(0px)",
      rotateY: 0,
      zIndex: 5,
      x: 0,
      pointerEvents: "auto" as const,
    };
  }
  if (position === -1) {
    return {
      scale: 0.85,
      opacity: 0.4,
      filter: "blur(4px)",
      rotateY: 18,
      zIndex: 4,
      x: "-40%",
      pointerEvents: "none" as const,
    };
  }
  if (position === 1) {
    return {
      scale: 0.85,
      opacity: 0.4,
      filter: "blur(4px)",
      rotateY: -18,
      zIndex: 4,
      x: "40%",
      pointerEvents: "none" as const,
    };
  }
  return {
    scale: 0.7,
    opacity: 0,
    filter: "blur(8px)",
    rotateY: position < 0 ? 30 : -30,
    zIndex: 3,
    x: position < 0 ? "-80%" : "80%",
    pointerEvents: "none" as const,
  };
}

function SkeletonCard() {
  return (
    <div className="relative w-64 h-96 rounded-3xl overflow-hidden flex-shrink-0 bg-[#1C1829] border border-[rgba(132,120,212,0.1)] animate-pulse">
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="h-5 w-32 bg-[#221E30] rounded mb-2" />
        <div className="h-3 w-20 bg-[#221E30] rounded mb-2" />
        <div className="flex gap-1.5">
          <div className="h-5 w-14 bg-[#221E30] rounded-full" />
          <div className="h-5 w-14 bg-[#221E30] rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function CardCarousel({
  profiles,
  onSwipe,
  onStar,
  isLoading,
}: CardCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const advance = useCallback(() => {
    if (profiles.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % profiles.length);
  }, [profiles.length]);

  const retreat = useCallback(() => {
    if (profiles.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + profiles.length) % profiles.length);
  }, [profiles.length]);

  useEffect(() => {
    if (isPaused || profiles.length <= 1) return;
    intervalRef.current = setInterval(advance, 4000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, advance, profiles.length]);

  useEffect(() => {
    function handleWheel(e: WheelEvent) {
      if (e.deltaX > 40 || e.deltaY > 40) advance();
      else if (e.deltaX < -40 || e.deltaY < -40) retreat();
    }
    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [advance, retreat]);

  function handleSwipe(direction: "RIGHT" | "LEFT") {
    if (profiles.length === 0) return;
    const profile = profiles[currentIndex];
    onSwipe(profile, direction);
    advance();
  }

  function handleStar() {
    if (profiles.length === 0) return;
    const profile = profiles[currentIndex];
    onStar?.(profile);
    advance();
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="relative flex items-center justify-center" style={{ perspective: "1000px" }}>
          <SkeletonCard />
        </div>
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
          <p className="text-sm text-[#9CA3AF]">Complete your profile to see more recommendations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div
        className="relative flex items-center justify-center w-full max-w-lg mx-auto"
        style={{ perspective: "1000px" }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <button
          onClick={retreat}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-[#1C1829]/80 backdrop-blur-sm border border-[rgba(132,120,212,0.12)] text-[#9CA3AF] hover:text-white transition-colors"
          aria-label="Previous profile"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <AnimatePresence initial={false} mode="popLayout">
          {[-2, -1, 0, 1, 2].map((offset) => {
            const idx =
              (currentIndex + offset + profiles.length) % profiles.length;
            const style = getCardStyle(offset);
            const profile = profiles[idx];

            if (Math.abs(offset) >= 2 && style.opacity === 0) return null;

            return (
              <motion.div
                key={profile.id}
                className="absolute"
                animate={{
                  opacity: style.opacity,
                  scale: style.scale,
                  filter: style.filter,
                  rotateY: style.rotateY,
                  x: style.x,
                  zIndex: style.zIndex,
                }}
                initial={false}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 28,
                }}
                style={{
                  transformOrigin: "center center",
                  pointerEvents: style.pointerEvents,
                }}
              >
                <ProfileCard
                  profile={profile}
                  index={idx}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>

        <button
          onClick={advance}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-[#1C1829]/80 backdrop-blur-sm border border-[rgba(132,120,212,0.12)] text-[#9CA3AF] hover:text-white transition-colors"
          aria-label="Next profile"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {profiles.length > 0 && (
        <SwipeActions
          onPass={() => handleSwipe("LEFT")}
          onStar={handleStar}
          onConnect={() => handleSwipe("RIGHT")}
          profileName={profiles[currentIndex]?.name}
        />
      )}
    </div>
  );
}

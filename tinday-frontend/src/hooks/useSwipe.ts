"use client";

import { useDrag } from "@use-gesture/react";
import { useState, useCallback } from "react";

interface SwipeState {
  x: number;
  rotation: number;
  velocity: number;
  direction: number;
  swipeDirection: "RIGHT" | "LEFT" | null;
  progress: number;
}

interface UseSwipeOptions {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  threshold?: number;
  enabled?: boolean;
}

export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  threshold,
  enabled = true,
}: UseSwipeOptions) {
  const swipeThreshold = threshold ?? (typeof window !== "undefined" ? window.innerWidth * 0.12 : 120);
  const [state, setState] = useState<SwipeState>({
    x: 0,
    rotation: 0,
    velocity: 0,
    direction: 0,
    swipeDirection: null,
    progress: 0,
  });
  const [isDragging, setIsDragging] = useState(false);

  const bind = useDrag(
    ({ active, movement: [mx], velocity: [vx], direction: [dx], cancel }) => {
      if (!enabled) return;

      const progress = Math.min(Math.abs(mx) / swipeThreshold, 1);
      const rotation = mx * 0.15; // rotation proportional to drag
      const swipeDirection = mx > 10 ? "RIGHT" : mx < -10 ? "LEFT" : null;

      setState({
        x: mx,
        rotation,
        velocity: vx,
        direction: dx,
        swipeDirection: active ? swipeDirection : null,
        progress: active ? progress : 0,
      });

      if (!active) {
        // Released
        setIsDragging(false);
        if (Math.abs(mx) >= swipeThreshold || Math.abs(vx) > 0.4) {
          if (mx > 0) {
            onSwipeRight();
          } else {
            onSwipeLeft();
          }
          // Fly off animation: set x to extreme
          const flyOffX = mx > 0 ? window.innerWidth : -window.innerWidth;
          setState((prev) => ({
            ...prev,
            x: flyOffX,
            rotation: prev.direction > 0 ? 30 : -30,
            swipeDirection: prev.swipeDirection,
          }));
          // Reset after animation completes
          setTimeout(() => {
            setState({
              x: 0,
              rotation: 0,
              velocity: 0,
              direction: 0,
              swipeDirection: null,
              progress: 0,
            });
          }, 400);
        } else {
          // Spring back
          setState({
            x: 0,
            rotation: 0,
            velocity: 0,
            direction: 0,
            swipeDirection: null,
            progress: 0,
          });
        }
      } else {
        setIsDragging(true);
      }
    },
    {
      axis: "x",
      filterTaps: true,
      rubberband: 0.6,
      pointer: { touch: true },
      enabled,
    }
  );

  const reset = useCallback(() => {
    setState({
      x: 0,
      rotation: 0,
      velocity: 0,
      direction: 0,
      swipeDirection: null,
      progress: 0,
    });
    setIsDragging(false);
  }, []);

  return {
    bind,
    x: state.x,
    rotation: state.rotation,
    swipeDirection: state.swipeDirection,
    progress: state.progress,
    isDragging,
    reset,
  };
}

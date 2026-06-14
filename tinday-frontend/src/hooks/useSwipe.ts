"use client";

import { useDrag } from "@use-gesture/react";
import { useState, useCallback, useRef } from "react";

interface SwipeState {
  x: number;
  y: number;
  rotation: number;
  velocity: number;
  direction: number;
  swipeDirection: "RIGHT" | "LEFT" | null;
  progress: number;
}

interface UseSwipeOptions {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  // Vertical gestures — used for navigating between cards (no Pass/Connect).
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  enabled?: boolean;
}

export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold,
  enabled = true,
}: UseSwipeOptions) {
  const swipeThreshold = threshold ?? (typeof window !== "undefined" ? window.innerWidth * 0.12 : 120);
  const verticalThreshold = typeof window !== "undefined" ? window.innerHeight * 0.12 : 120;
  const [state, setState] = useState<SwipeState>({
    x: 0,
    y: 0,
    rotation: 0,
    velocity: 0,
    direction: 0,
    swipeDirection: null,
    progress: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  // Set true once a gesture moves beyond a tap; lets the card distinguish a
  // tap (open detail) from a drag-release (the native click that follows a
  // drag must be ignored). `filterTaps` keeps taps out of this handler.
  const hasDraggedRef = useRef(false);

  const resetState = useCallback(() => {
    setState({
      x: 0,
      y: 0,
      rotation: 0,
      velocity: 0,
      direction: 0,
      swipeDirection: null,
      progress: 0,
    });
  }, []);

  const bind = useDrag(
    ({ active, movement: [mx, my], velocity: [vx, vy], direction: [dx] }) => {
      if (!enabled) return;

      if (active && (Math.abs(mx) > 8 || Math.abs(my) > 8))
        hasDraggedRef.current = true;

      // Lock the gesture to whichever axis it started moving along: horizontal
      // is a Pass/Connect action; vertical navigates between cards.
      const horizontal = Math.abs(mx) >= Math.abs(my);

      if (horizontal) {
        const progress = Math.min(Math.abs(mx) / swipeThreshold, 1);
        const rotation = mx * 0.15; // rotation proportional to drag
        const swipeDirection = mx > 10 ? "RIGHT" : mx < -10 ? "LEFT" : null;

        setState({
          x: mx,
          y: 0,
          rotation,
          velocity: vx,
          direction: dx,
          swipeDirection: active ? swipeDirection : null,
          progress: active ? progress : 0,
        });

        if (!active) {
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
            setTimeout(resetState, 400);
          } else {
            resetState();
          }
        } else {
          setIsDragging(true);
        }
      } else {
        // Vertical: pure navigation — no rotation, no Pass/Connect stamp.
        setState({
          x: 0,
          y: my,
          rotation: 0,
          velocity: vy,
          direction: 0,
          swipeDirection: null,
          progress: 0,
        });

        if (!active) {
          setIsDragging(false);
          if (Math.abs(my) >= verticalThreshold || Math.abs(vy) > 0.4) {
            if (my < 0) {
              onSwipeUp?.();
            } else {
              onSwipeDown?.();
            }
            // Fly off animation: set y to extreme
            const flyOffY = my < 0 ? -window.innerHeight : window.innerHeight;
            setState((prev) => ({ ...prev, y: flyOffY }));
            setTimeout(resetState, 400);
          } else {
            resetState();
          }
        } else {
          setIsDragging(true);
        }
      }
    },
    {
      axis: "lock",
      filterTaps: true,
      rubberband: 0.6,
      pointer: { touch: true },
      enabled,
    }
  );

  const reset = useCallback(() => {
    resetState();
    setIsDragging(false);
  }, [resetState]);

  return {
    bind,
    x: state.x,
    y: state.y,
    rotation: state.rotation,
    swipeDirection: state.swipeDirection,
    progress: state.progress,
    isDragging,
    reset,
    // Returns (and clears) whether the last gesture was a drag rather than a
    // tap — call from the card's onClick to suppress the post-drag click.
    wasDragged: () => {
      const v = hasDraggedRef.current;
      hasDraggedRef.current = false;
      return v;
    },
  };
}

"use client";

import { useEffect, useRef, useState } from "react";

interface StatCounterProps {
  value: number;
  label: string;
}

// Count-up animation, 800ms ease-out cubic, driven by requestAnimationFrame.
export function StatCounter({ value, label }: StatCounterProps) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const duration = 800;
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    let start: number | null = null;

    const tick = (now: number) => {
      if (start === null) start = now;
      const progress = Math.min((now - start) / duration, 1);
      setDisplay(Math.round(easeOutCubic(progress) * value));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

  return (
    <div className="flex flex-col items-center">
      <span className="text-2xl font-semibold text-white font-[family-name:var(--font-display)]">
        {display}
      </span>
      <span className="text-xs text-[#9CA3AF] mt-1">{label}</span>
    </div>
  );
}

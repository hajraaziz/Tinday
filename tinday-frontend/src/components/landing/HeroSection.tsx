"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import Link from "next/link";

const WORDS = ["Developer", "Designer", "Manager", "Founder", "Marketer"];

function WordCycler() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % WORDS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="inline-block relative overflow-hidden align-bottom h-[1.15em] min-w-[280px]">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={WORDS[index]}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="absolute left-0 w-full font-display italic font-light"
        >
          {WORDS[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function LiveClock() {
  const [time, setTime] = useState("");

  const update = useCallback(() => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      timeZone: "Asia/Karachi",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    };
    setTime(now.toLocaleTimeString("en-US", options));
  }, []);

  useEffect(() => {
    // Defer the first tick to a microtask so we don't setState synchronously in
    // the effect body; the interval drives every tick after that.
    queueMicrotask(update);
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [update]);

  return (
    <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
      {time}
    </span>
  );
}

export default function HeroSection() {
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 600], [0, 240]);
  const heroOpacity = useTransform(scrollY, [0, 600], [1, 0]);

  return (
    <section
      id="hero"
      className="relative h-screen overflow-hidden flex items-center justify-center"
      style={{
        background:
          "radial-gradient(ellipse at bottom, #1B1535 0%, #090A0F 100%)",
      }}
    >
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div id="stars1" className="absolute top-0 left-0" />
        <div id="stars2" className="absolute top-0 left-0" />
        <div id="stars3" className="absolute top-0 left-0" />
      </div>

      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(to bottom, transparent 60%, #0A090F 100%)",
        }}
      />

      <motion.div
        className="relative z-20 text-center max-w-[640px] mx-auto px-4"
        style={{ y: heroY, opacity: heroOpacity }}
      >
        <div className="inline-flex items-center mb-8">
          <span
            className="inline-block rounded-full px-4 py-2 font-body text-[11px] uppercase tracking-[0.2em] text-white"
            style={{
              border: "1px solid rgba(132,120,212,0.35)",
              background: "rgba(132,120,212,0.08)",
              backdropFilter: "blur(12px)",
            }}
          >
            Professional Networking, Reimagined
          </span>
        </div>

        <h1
          className="font-display text-[64px] lg:text-[72px] leading-[1.05] tracking-tight mb-6"
          style={{
            color: "#EDE8FF",
            textShadow: "0 0 12px rgba(132,120,212,0.5)",
          }}
        >
          Connect with every
          <br />
          <WordCycler />
        </h1>

        <p
          className="font-body font-light text-[17px] leading-[1.7] max-w-[460px] mx-auto mb-10"
          style={{ color: "rgba(237, 232, 255, 0.85)" }}
        >
          Discover collaborators, co-founders, and teammates through
          intelligent swipe-based matching.
        </p>

        <div className="mb-6">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-full h-12 px-8 font-body text-[15px] font-medium text-white transition-all duration-300"
            style={{
              border: "1px solid rgba(132,120,212,0.4)",
              background: "rgba(132,120,212,0.08)",
              backdropFilter: "blur(12px)",
            }}
          >
            Start Swiping
          </Link>
        </div>

        <div>
          <LiveClock />
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
            {" "}
            · Lahore, PK
          </span>
        </div>
      </motion.div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
        <div className="w-[1px] h-8 bg-gradient-to-b from-transparent to-white/20 mx-auto mb-2" />
        <span className="font-body text-[10px] uppercase tracking-[0.3em] text-[#4B5563]">
          Scroll
        </span>
      </div>
    </section>
  );
}

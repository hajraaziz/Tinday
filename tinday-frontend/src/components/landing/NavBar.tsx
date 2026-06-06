"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 h-[72px] flex items-center transition-all duration-300"
      style={{
        background: scrolled
          ? "rgba(21, 21, 21, 0.85)"
          : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled
          ? "1px solid rgba(132, 120, 212, 0.08)"
          : "1px solid transparent",
      }}
    >
      <div className="w-full max-w-[1280px] mx-auto px-6 flex items-center justify-between">
        <Link
          href="/"
          className="font-display font-bold text-[22px] text-white tracking-tight"
        >
          Tinday.
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="font-body text-[13px] text-[#9CA3AF] hover:text-white transition-colors duration-300"
          >
            Explore
          </a>
          <a
            href="#features"
            className="font-body text-[13px] text-[#9CA3AF] hover:text-white transition-colors duration-300"
          >
            Features
          </a>
          <a
            href="#social-proof"
            className="font-body text-[13px] text-[#9CA3AF] hover:text-white transition-colors duration-300"
          >
            About
          </a>
        </div>

        <Link
          href="/login"
          className="font-body text-[13px] font-medium text-black bg-white rounded-full h-9 px-5 flex items-center hover:scale-105 transition-transform duration-200"
        >
          Get Started
        </Link>
      </div>
    </motion.nav>
  );
}

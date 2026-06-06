"use client";

import { motion } from "framer-motion";

const LOGOS = [
  {
    name: "Notion",
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-white">
        <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L18.28 2.212c-.42-.326-.98-.7-2.055-.607L3.01 2.721c-.466.046-.56.28-.374.466l1.823 1.021zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.84-.046.933-.56.933-1.167V6.354c0-.606-.233-.933-.746-.886l-15.177.887c-.56.046-.747.326-.747.933zm14.337.746c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.747 0-.933-.234-1.494-.933l-4.577-7.186v6.953l1.448.327s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.513.28-.886.747-.933l3.222-.186zM2.87 1.56l13.728-1.02c1.68-.14 2.1.094 2.8.606l3.876 2.727c.466.326.606.747.606 1.307v15.035c0 .933-.326 1.494-1.494 1.587l-15.457.933c-.84.047-1.26-.046-1.727-.653L1.69 18.86c-.514-.7-.747-1.213-.747-1.867V3.1c0-.84.374-1.494 1.307-1.587l.62.047z" />
      </svg>
    ),
  },
  {
    name: "Figma",
    svg: (
      <svg width="18" height="24" viewBox="0 0 38 57" fill="none">
        <path d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z" fill="#1ABCFE" />
        <path d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z" fill="#0ACF83" />
        <path d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z" fill="#FF7262" />
        <path d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z" fill="#F24E1E" />
        <path d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z" fill="#A259FF" />
      </svg>
    ),
  },
  {
    name: "GitHub",
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-white">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
      </svg>
    ),
  },
  {
    name: "Linear",
    svg: (
      <svg width="22" height="22" viewBox="0 0 100 100" fill="currentColor" className="text-white">
        <path d="M1.22541 61.5228c-.97401-1.6673-1.735-3.4428-2.26149-5.3005l43.81518 43.8152c-1.8577-.5765-3.6332-1.2875-5.3005-2.2615L1.22541 61.5228zm-1.0108-12.4196C.685421 22.8074 22.8074.68542 49.1032.21461l50.6821 50.68209c-.4708 26.2959-22.5939 48.4189-48.8898 48.8897L.21461 49.1032zM99.9998 47.9126c-.3337-8.5254-3.0203-16.439-7.4988-23.1372L48.7754 68.5012l31.2118 31.2119c6.6982-4.4786 14.6119-7.1652 23.1373-7.4989L99.9998 47.9126h0zm-2.0692-28.826C89.827 7.51534 77.4847.1693 63.4877.00291l36.4435 36.44359c.1664-14.0006-7.1821-26.341-18.7535-34.4453l6.7529 7.08569z" fillRule="evenodd" />
      </svg>
    ),
  },
  {
    name: "Vercel",
    svg: (
      <svg width="22" height="20" viewBox="0 0 76 65" fill="currentColor" className="text-white">
        <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
      </svg>
    ),
  },
];

export default function SocialProof() {
  return (
    <section id="social-proof" className="relative py-24" style={{ background: "#0A090F" }}>
      <div className="max-w-[1280px] mx-auto px-6">
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center justify-center gap-12 md:gap-16 mb-6 flex-wrap">
            {LOGOS.map((logo) => (
              <div
                key={logo.name}
                className="flex items-center gap-2 cursor-pointer transition-all duration-300"
                style={{ width: 80, filter: "grayscale(100%)", opacity: 0.4 }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = "grayscale(0%)";
                  e.currentTarget.style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = "grayscale(100%)";
                  e.currentTarget.style.opacity = "0.4";
                }}
              >
                {logo.svg}
                <span className="font-body text-[13px] font-medium text-white">
                  {logo.name}
                </span>
              </div>
            ))}
          </div>

          <p className="font-body text-[13px] text-[#9CA3AF] text-center mt-4">
            Professionals from top teams are already on Tinday.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

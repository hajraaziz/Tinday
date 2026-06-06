"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Star, ArrowUpRight } from "lucide-react";

function FeatureCard({
  index,
  className,
  style,
  number,
  title,
  subtitle,
  icon,
  textColor,
  borderColor,
  bgColor,
}: {
  index: number;
  className?: string;
  style?: React.CSSProperties;
  number: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  textColor: string;
  borderColor: string;
  bgColor: string;
}) {
  const baseRotate = index === 0 ? -6 : 6;

  const { scrollY } = useScroll();
  const sway = useTransform(
    scrollY,
    [0, 2000],
    [baseRotate, baseRotate + (index === 0 ? 4 : -4)]
  );

  return (
    <motion.div
      className={`w-full md:w-1/2 rounded-3xl p-10 relative flex flex-col justify-between cursor-pointer ${className ?? ""}`}
      style={{
        background: bgColor,
        border: borderColor,
        aspectRatio: "4/5",
        borderRadius: 24,
        rotate: sway,
        ...style,
      }}
      whileHover={{ rotate: 0, transition: { duration: 0.6 } }}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.2 }}
    >
      <div className="flex items-start justify-between">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{
            background:
              index === 0 ? "rgba(0,0,0,0.1)" : "transparent",
            border:
              index === 0 ? "none" : "1px solid rgba(255,255,255,0.15)",
          }}
        >
          {icon}
        </div>
        <span
          className="inline-flex items-center justify-center rounded-full px-3 py-1 font-body text-[13px] font-medium"
          style={{
            border:
              index === 0
                ? "1px solid rgba(0,0,0,0.2)"
                : "1px solid rgba(132,120,212,0.15)",
            color: index === 0 ? "#000" : "#9CA3AF",
          }}
        >
          {String(number).padStart(2, "0")}
        </span>
      </div>

      <div className="mt-auto">
        <h3
          className="font-display text-[40px] lg:text-[44px] leading-[1.05] tracking-tight mb-3"
          style={{ color: textColor }}
        >
          For
          <br />
          {title}
        </h3>
        <p
          className="font-body text-[15px] leading-relaxed"
          style={{
            color:
              index === 0
                ? "rgba(0,0,0,0.7)"
                : "#9CA3AF",
          }}
        >
          {subtitle}
        </p>
      </div>
    </motion.div>
  );
}

export default function FeatureCards() {
  return (
    <section
      id="features"
      className="relative py-32 overflow-hidden"
      style={{ background: "#0A090F" }}
    >
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(rgba(132,120,212,0.12) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 max-w-[1280px] mx-auto px-6">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-[48px] lg:text-[56px] text-white leading-[1.1] tracking-tight">
            Define your digital
            <br />
            <em className="italic font-normal">presence</em>
          </h2>
        </motion.div>

        <div className="max-w-[900px] mx-auto flex flex-col md:flex-row items-start justify-center gap-6 px-8">
          <FeatureCard
            index={0}
            number={1}
            title="Professionals"
            subtitle="Build your professional identity. Showcase skills, experience, and ambitions to connect with the right people."
            icon={<Star className="text-black text-sm" size={14} />}
            textColor="rgba(0,0,0,0.9)"
            borderColor="none"
            bgColor="#8478D4"
          />
          <FeatureCard
            index={1}
            number={2}
            title="Teams"
            subtitle="Recruit talent, find co-founders, or assemble project teams. Intelligent matching meets team dynamics."
            icon={
              <ArrowUpRight className="text-white text-sm" size={14} />
            }
            textColor="#FFFFFF"
            borderColor="1px solid rgba(132,120,212,0.15)"
            bgColor="#1C1829"
            className="md:mt-24"
          />
        </div>
      </div>
    </section>
  );
}

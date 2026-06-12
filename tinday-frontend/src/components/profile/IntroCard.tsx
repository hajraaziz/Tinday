"use client";

import {
  Mail,
  Phone,
  MapPin,
  Globe,
  Link2,
  AtSign,
  Briefcase,
  Clock,
  Users,
  Pencil,
  type LucideIcon,
} from "lucide-react";
import type { Socials } from "@/types";

interface IntroCardProps {
  socials: Socials | null;
  email?: string;
  location?: string | null;
  role?: string;
  experienceYears?: number;
  matchCount: number;
  onMatchesClick: () => void;
  onEdit: () => void;
}

// Prefix a bare URL/handle so it becomes a valid href.
function toUrl(value: string, base?: string): string {
  const v = value.trim();
  if (/^https?:\/\//i.test(v)) return v;
  if (base) return `${base}${v.replace(/^@/, "")}`;
  return `https://${v}`;
}

interface Row {
  icon: LucideIcon;
  label: string;
  href?: string;
  onClick?: () => void;
}

export function IntroCard({
  socials,
  email,
  location,
  role,
  experienceYears,
  matchCount,
  onMatchesClick,
  onEdit,
}: IntroCardProps) {
  const s = socials ?? {};

  const rows: Row[] = [];
  if (role) rows.push({ icon: Briefcase, label: role });
  if (experienceYears && experienceYears > 0)
    rows.push({
      icon: Clock,
      label: `${experienceYears} ${experienceYears === 1 ? "year" : "years"} of experience`,
    });
  if (location) rows.push({ icon: MapPin, label: location });
  rows.push({
    icon: Users,
    label: `${matchCount} ${matchCount === 1 ? "match" : "matches"}`,
    onClick: onMatchesClick,
  });
  if (email) rows.push({ icon: Mail, label: email });
  if (s.phone) rows.push({ icon: Phone, label: s.phone, href: `tel:${s.phone}` });
  if (s.website)
    rows.push({ icon: Globe, label: "Website", href: toUrl(s.website) });
  if (s.linkedin)
    rows.push({
      icon: Link2,
      label: "LinkedIn",
      href: toUrl(s.linkedin, "https://linkedin.com/in/"),
    });
  if (s.github)
    rows.push({
      icon: Link2,
      label: "GitHub",
      href: toUrl(s.github, "https://github.com/"),
    });
  if (s.instagram)
    rows.push({
      icon: AtSign,
      label: "Instagram",
      href: toUrl(s.instagram, "https://instagram.com/"),
    });
  if (s.twitter)
    rows.push({
      icon: AtSign,
      label: "Twitter / X",
      href: toUrl(s.twitter, "https://x.com/"),
    });

  // True when the user has added no contact links beyond the always-present rows.
  const hasContactLinks =
    !!email ||
    !!s.phone ||
    !!s.website ||
    !!s.linkedin ||
    !!s.github ||
    !!s.instagram ||
    !!s.twitter;

  return (
    <section className="rounded-2xl p-5 bg-[#1C1829] border border-[rgba(132,120,212,0.1)]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold tracking-wide text-[#9CA3AF] uppercase">
          Intro
        </h3>
        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit intro"
          className="text-[#4B5563] hover:text-[#8478D4] transition-colors"
        >
          <Pencil className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2.5">
        {rows.map((row, i) => {
          const Icon = row.icon;
          const iconEl = (
            <Icon className="w-4 h-4 shrink-0 text-[#8478D4]" />
          );

          if (row.href) {
            return (
              <div key={i} className="flex items-center gap-2.5 min-w-0">
                {iconEl}
                <a
                  href={row.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-sm text-[#8478D4] hover:text-[#A098E0] transition-colors"
                >
                  {row.label}
                </a>
              </div>
            );
          }

          if (row.onClick) {
            return (
              <button
                key={i}
                type="button"
                onClick={row.onClick}
                className="flex items-center gap-2.5 min-w-0 w-full text-left hover:opacity-80 transition-opacity"
              >
                {iconEl}
                <span className="truncate text-sm text-[#D1D5DB]">
                  {row.label}
                </span>
              </button>
            );
          }

          return (
            <div key={i} className="flex items-center gap-2.5 min-w-0">
              {iconEl}
              <span className="truncate text-sm text-[#D1D5DB]">
                {row.label}
              </span>
            </div>
          );
        })}

        {!hasContactLinks && (
          <button
            type="button"
            onClick={onEdit}
            className="text-xs text-[#8478D4] hover:text-[#A098E0] transition-colors"
          >
            + Add your contact links
          </button>
        )}
      </div>
    </section>
  );
}

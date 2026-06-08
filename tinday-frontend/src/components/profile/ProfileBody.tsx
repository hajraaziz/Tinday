"use client";

import { motion } from "framer-motion";
import { Pencil } from "lucide-react";
import Image from "next/image";
import { SkillPills } from "./SkillPills";
import type { Project } from "@/types";

interface ProfileBodyData {
  about: string | null;
  skills: string[];
  roles: string[];
  experience_years: number;
  projects: Project[];
}

interface ProfileBodyProps {
  data: ProfileBodyData;
  // When provided, an "edit" pencil appears on each card (own profile only).
  onEdit?: () => void;
  // Preference pills (own profile only) — "Looking For".
  lookingFor?: { skills: string[]; roles: string[] };
}

function Card({
  title,
  onEdit,
  index = 0,
  children,
}: {
  title: string;
  onEdit?: () => void;
  index?: number;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: (index % 6) * 0.1 }}
      className="rounded-2xl p-5 bg-[#1C1829] border border-[rgba(132,120,212,0.1)]"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold tracking-wide text-[#9CA3AF] uppercase">
          {title}
        </h3>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${title}`}
            className="text-[#4B5563] hover:text-[#8478D4] transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
      </div>
      {children}
    </motion.section>
  );
}

export function ProfileBody({ data, onEdit, lookingFor }: ProfileBodyProps) {
  const projects = (data.projects ?? []).slice(0, 4);
  const hasLookingFor =
    lookingFor && (lookingFor.skills.length > 0 || lookingFor.roles.length > 0);

  return (
    <div className="space-y-4">
      {data.about && (
        <Card title="About" onEdit={onEdit} index={0}>
          <p className="text-sm leading-relaxed text-[#D1D5DB] whitespace-pre-wrap">
            {data.about}
          </p>
        </Card>
      )}

      {data.skills?.length > 0 && (
        <Card title="Skills" onEdit={onEdit} index={1}>
          <SkillPills items={data.skills} variant="accent" />
        </Card>
      )}

      {data.roles?.length > 0 && (
        <Card title="Roles" onEdit={onEdit} index={2}>
          <SkillPills items={data.roles} variant="muted" />
        </Card>
      )}

      <Card title="Experience" onEdit={onEdit} index={3}>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-semibold text-white font-[family-name:var(--font-display)]">
            {data.experience_years || 0}
          </span>
          <span className="text-sm text-[#9CA3AF]">
            {data.experience_years === 1 ? "year" : "years"} of experience
          </span>
        </div>
      </Card>

      {projects.length > 0 && (
        <Card title="Projects" onEdit={onEdit} index={4}>
          <div className="grid grid-cols-2 gap-3">
            {projects.map((project, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.03 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="rounded-xl overflow-hidden bg-[#221E30] border border-[rgba(132,120,212,0.08)]"
              >
                {project.media_url && (
                  <div className="relative w-full h-24">
                    <Image
                      src={project.media_url}
                      alt={project.title ?? "Project"}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-3">
                  <p className="text-sm font-medium text-white truncate">
                    {project.title || "Untitled"}
                  </p>
                  {project.description && (
                    <p className="text-xs text-[#9CA3AF] mt-1 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  {project.url && (
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#8478D4] hover:text-[#A098E0] mt-1 inline-block"
                    >
                      View →
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {hasLookingFor && (
        <Card title="Looking For" onEdit={onEdit} index={5}>
          <div className="space-y-3">
            {lookingFor!.roles.length > 0 && (
              <SkillPills items={lookingFor!.roles} variant="accent" />
            )}
            {lookingFor!.skills.length > 0 && (
              <SkillPills items={lookingFor!.skills} variant="muted" />
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

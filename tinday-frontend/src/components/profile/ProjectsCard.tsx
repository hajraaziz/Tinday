"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { SectionCard } from "./SectionCard";
import type { Project } from "@/types";

interface ProjectsCardProps {
  projects: Project[];
  onEdit?: () => void;
}

// "Projects" bento — 2-col tiles. Mirrors the projects block previously in
// ProfileBody so the own-profile redesign keeps the same look.
export function ProjectsCard({ projects, onEdit }: ProjectsCardProps) {
  const items = (projects ?? []).slice(0, 4);
  if (items.length === 0) return null;

  return (
    <SectionCard title="Projects" onEdit={onEdit}>
      <div className="grid grid-cols-2 gap-3">
        {items.map((project, i) => (
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
    </SectionCard>
  );
}

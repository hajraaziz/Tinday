"use client";

import { SectionCard } from "./SectionCard";
import { SkillPills } from "./SkillPills";

interface AboutCardProps {
  about: string | null;
  skills: string[];
  roles: string[];
  onEdit?: () => void;
}

// "About" bento: full-width about text on top, then Skills | Roles side by side.
export function AboutCard({ about, skills, roles, onEdit }: AboutCardProps) {
  const hasSkills = skills.length > 0;
  const hasRoles = roles.length > 0;
  if (!about && !hasSkills && !hasRoles) return null;

  return (
    <SectionCard title="About" onEdit={onEdit}>
      {about && (
        <p className="text-sm leading-relaxed text-[#D1D5DB] whitespace-pre-wrap">
          {about}
        </p>
      )}

      {(hasSkills || hasRoles) && (
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4 mt-4">
          {hasSkills && (
            <div>
              <p className="text-xs font-medium text-[#9CA3AF] mb-2">Skills</p>
              <SkillPills items={skills} variant="accent" />
            </div>
          )}
          {hasRoles && (
            <div>
              <p className="text-xs font-medium text-[#9CA3AF] mb-2">Roles</p>
              <SkillPills items={roles} variant="muted" />
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}

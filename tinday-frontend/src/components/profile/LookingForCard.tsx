"use client";

import { SectionCard } from "./SectionCard";
import { SkillPills } from "./SkillPills";

interface LookingForCardProps {
  connectNote?: string;
  preferredSkills: string[];
  preferredRoles: string[];
  onEdit?: () => void;
  // Layout for the Preferred skills/roles block. Defaults to the side-by-side
  // grid used on /profile; the Explore detail panel overrides it.
  pillsClassName?: string;
}

// "Looking For" bento: connect-note on top (muted prompt when empty),
// then Preferred skills | Preferred roles side by side.
export function LookingForCard({
  connectNote,
  preferredSkills,
  preferredRoles,
  onEdit,
  pillsClassName = "grid sm:grid-cols-2 gap-x-6 gap-y-4 mt-4",
}: LookingForCardProps) {
  const hasSkills = preferredSkills.length > 0;
  const hasRoles = preferredRoles.length > 0;
  const note = connectNote?.trim();

  return (
    <SectionCard title="Looking For" onEdit={onEdit}>
      {note ? (
        <p className="text-sm leading-relaxed text-[#D1D5DB] whitespace-pre-wrap">
          {note}
        </p>
      ) : onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          className="text-sm text-[#4B5563] hover:text-[#8478D4] transition-colors text-left"
        >
          Describe who you want to connect with
        </button>
      ) : !hasSkills && !hasRoles ? (
        // Read-only view of another user with nothing shared here.
        <p className="text-sm text-[#4B5563]">No preferences shared yet.</p>
      ) : null}

      {(hasSkills || hasRoles) && (
        <div className={pillsClassName}>
          {hasSkills && (
            <div>
              <p className="text-xs font-medium text-[#9CA3AF] mb-2">
                Preferred skills
              </p>
              <SkillPills items={preferredSkills} variant="accent" />
            </div>
          )}
          {hasRoles && (
            <div>
              <p className="text-xs font-medium text-[#9CA3AF] mb-2">
                Preferred roles
              </p>
              <SkillPills items={preferredRoles} variant="muted" />
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}

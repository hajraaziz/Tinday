"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { TagInput } from "@/components/profile/TagInput";
import { validateTag } from "@/lib/validateTag";
import { cn } from "@/lib/utils";

const experiencePills = ["1-3 yrs", "3-5 yrs", "5+ yrs"];

interface FilterBarProps {
  selectedExperience: string | null;
  onExperienceChange: (value: string | null) => void;
  selectedSkills: string[];
  onSkillsChange: (skills: string[]) => void;
  skillOptions: string[];
  selectedRoles: string[];
  onRolesChange: (roles: string[]) => void;
  roleOptions: string[];
  location: string;
  onLocationChange: (value: string) => void;
}

function Pill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 border whitespace-nowrap",
        active
          ? "bg-[rgba(132,120,212,0.15)] border-[#8478D4] text-[#8478D4]"
          : "bg-[rgba(132,120,212,0.05)] border-[rgba(132,120,212,0.1)] text-[#9CA3AF] hover:text-white hover:border-[rgba(132,120,212,0.2)]"
      )}
    >
      {label}
    </motion.button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF] mb-2.5">
      {children}
    </p>
  );
}

function RemovablePill({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 pl-3 pr-2 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-[rgba(132,120,212,0.15)] border border-[#8478D4] text-[#A79CE6]">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="text-[#A79CE6]/70 hover:text-white transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

export function FilterBar({
  selectedExperience,
  onExperienceChange,
  selectedSkills,
  onSkillsChange,
  skillOptions,
  selectedRoles,
  onRolesChange,
  roleOptions,
  location,
  onLocationChange,
}: FilterBarProps) {
  const [open, setOpen] = useState(false);

  const activeCount =
    selectedSkills.length +
    selectedRoles.length +
    (selectedExperience ? 1 : 0) +
    (location.trim() ? 1 : 0);

  const clearAll = () => {
    onSkillsChange([]);
    onRolesChange([]);
    onExperienceChange(null);
    onLocationChange("");
  };

  const trimmedLocation = location.trim();

  // Flat list of the currently-applied filters, each with a remover. Rendered
  // as the pill row above the feed so active filters are visible at a glance
  // without opening the modal.
  const activeFilters: { key: string; label: string; onRemove: () => void }[] = [
    ...(selectedExperience
      ? [
          {
            key: `exp:${selectedExperience}`,
            label: selectedExperience,
            onRemove: () => onExperienceChange(null),
          },
        ]
      : []),
    ...selectedRoles.map((role) => ({
      key: `role:${role}`,
      label: role,
      onRemove: () => onRolesChange(selectedRoles.filter((r) => r !== role)),
    })),
    ...selectedSkills.map((skill) => ({
      key: `skill:${skill}`,
      label: skill,
      onRemove: () => onSkillsChange(selectedSkills.filter((s) => s !== skill)),
    })),
    ...(trimmedLocation
      ? [
          {
            key: `loc:${trimmedLocation}`,
            label: trimmedLocation,
            onRemove: () => onLocationChange(""),
          },
        ]
      : []),
  ];

  const hasActive = activeFilters.length > 0;

  return (
    <div className="mb-4">
      {/* Button is left-aligned on its own; once filter pills appear the whole
          group (pills + button) centers. */}
      <div
        className={cn(
          "px-2 flex items-center gap-2",
          hasActive ? "justify-center" : "justify-start"
        )}
      >
        {hasActive && (
          // Clipped active-filter pills. Content is left-aligned and overflows
          // on the right, where a mask fades the last pill out so it cuts off
          // smoothly into the Filters button (signalling "more hidden").
          <div className="relative min-w-0 max-w-[60vw] md:max-w-md overflow-hidden [mask-image:linear-gradient(to_right,black_82%,transparent)]">
            <div className="flex items-center gap-2 w-max">
              {activeFilters.map((f) => (
                <RemovablePill
                  key={f.key}
                  label={f.label}
                  onRemove={f.onRemove}
                />
              ))}
            </div>
          </div>
        )}
        <motion.button
          onClick={() => setOpen(true)}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium inline-flex items-center gap-1.5 transition-colors duration-200 border whitespace-nowrap",
            open || activeCount > 0
              ? "bg-[rgba(132,120,212,0.15)] border-[#8478D4] text-[#8478D4]"
              : "bg-[rgba(132,120,212,0.05)] border-[rgba(132,120,212,0.1)] text-[#9CA3AF] hover:text-white hover:border-[rgba(132,120,212,0.2)]"
          )}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters
          {activeCount > 0 && (
            <span className="ml-0.5 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full bg-[#8478D4] text-white text-[10px] font-semibold">
              {activeCount}
            </span>
          )}
        </motion.button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md bg-[#1C1829] border-[rgba(132,120,212,0.12)] text-white sm:rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Filters</DialogTitle>
            <DialogDescription className="sr-only">
              Filter profiles by experience, roles, skills, and location.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Experience */}
            <div>
              <SectionLabel>Experience</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {experiencePills.map((pill) => (
                  <Pill
                    key={pill}
                    label={pill}
                    active={selectedExperience === pill}
                    onClick={() =>
                      onExperienceChange(
                        selectedExperience === pill ? null : pill
                      )
                    }
                  />
                ))}
              </div>
            </div>

            {/* Roles */}
            <TagInput
              label="Roles"
              value={selectedRoles}
              onChange={onRolesChange}
              suggestions={roleOptions}
              validate={(value) => validateTag(value, "role")}
              kindLabel="role"
              placeholder="Type a role and press Enter"
            />

            {/* Skills */}
            <TagInput
              label="Skills"
              value={selectedSkills}
              onChange={onSkillsChange}
              suggestions={skillOptions}
              validate={(value) => validateTag(value, "skill")}
              kindLabel="skill"
              placeholder="Type a skill and press Enter"
            />

            {/* Location */}
            <div>
              <label className="block text-sm text-[#9CA3AF] mb-1.5">
                Location
              </label>
              <div className="relative">
                <input
                  value={location}
                  onChange={(e) => onLocationChange(e.target.value)}
                  type="text"
                  placeholder="Search by city or country"
                  className="w-full rounded-lg px-4 py-2.5 pr-10 text-white placeholder:text-[#4B5563] outline-none transition-colors focus:ring-2 focus:ring-[#8478D4]/30"
                  style={{
                    background: "#161222",
                    border: "1px solid rgba(132,120,212,0.1)",
                  }}
                />
                {location.trim() && (
                  <button
                    type="button"
                    onClick={() => onLocationChange("")}
                    aria-label="Clear location"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={clearAll}
              disabled={activeCount === 0}
              className="inline-flex items-center gap-1 text-xs text-[#9CA3AF] hover:text-white transition-colors disabled:opacity-40 disabled:hover:text-[#9CA3AF]"
            >
              <X className="w-3 h-3" /> Clear all
            </button>
            <DialogClose asChild>
              <button className="px-5 py-2 rounded-full text-sm font-medium bg-[#8478D4] text-white hover:bg-[#7468c4] transition-colors">
                Done
              </button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

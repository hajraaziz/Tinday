"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const experiencePills = ["1-3 yrs", "3-5 yrs", "5+ yrs"];

interface FilterBarProps {
  selectedExperience: string | null;
  onExperienceChange: (value: string | null) => void;
  selectedSkills: string[];
  onSkillsChange: (skills: string[]) => void;
  skillOptions: string[];
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

export function FilterBar({
  selectedExperience,
  onExperienceChange,
  selectedSkills,
  onSkillsChange,
  skillOptions,
}: FilterBarProps) {
  const [panelOpen, setPanelOpen] = useState(false);

  const toggleSkill = (skill: string) => {
    onSkillsChange(
      selectedSkills.includes(skill)
        ? selectedSkills.filter((s) => s !== skill)
        : [...selectedSkills, skill]
    );
  };

  const activeCount =
    selectedSkills.length + (selectedExperience ? 1 : 0);

  const clearAll = () => {
    onSkillsChange([]);
    onExperienceChange(null);
  };

  return (
    <div className="mb-4">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex items-center gap-2 px-2 pb-2">
          <Pill
            label="All"
            active={activeCount === 0}
            onClick={clearAll}
          />
          {experiencePills.map((pill) => (
            <Pill
              key={pill}
              label={pill}
              active={selectedExperience === pill}
              onClick={() =>
                onExperienceChange(selectedExperience === pill ? null : pill)
              }
            />
          ))}
          <motion.button
            onClick={() => setPanelOpen((o) => !o)}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium inline-flex items-center gap-1.5 transition-colors duration-200 border whitespace-nowrap",
              panelOpen || selectedSkills.length > 0
                ? "bg-[rgba(132,120,212,0.15)] border-[#8478D4] text-[#8478D4]"
                : "bg-[rgba(132,120,212,0.05)] border-[rgba(132,120,212,0.1)] text-[#9CA3AF] hover:text-white hover:border-[rgba(132,120,212,0.2)]"
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Skills
            {selectedSkills.length > 0 && (
              <span className="ml-0.5 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full bg-[#8478D4] text-white text-[10px] font-semibold">
                {selectedSkills.length}
              </span>
            )}
          </motion.button>
        </div>
        <ScrollBar orientation="horizontal" className="h-1.5" />
      </ScrollArea>

      <AnimatePresence initial={false}>
        {panelOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mx-2 mt-1 rounded-2xl p-4 bg-[#1C1829] border border-[rgba(132,120,212,0.1)]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                  Filter by skills
                </p>
                {selectedSkills.length > 0 && (
                  <button
                    onClick={() => onSkillsChange([])}
                    className="inline-flex items-center gap-1 text-xs text-[#9CA3AF] hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
              {skillOptions.length === 0 ? (
                <p className="text-xs text-[#4B5563]">
                  No skills available to filter by yet.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {skillOptions.map((skill) => {
                    const active = selectedSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
                          active
                            ? "bg-[rgba(132,120,212,0.18)] border-[#8478D4] text-[#A79CE6]"
                            : "bg-[rgba(132,120,212,0.05)] border-[rgba(132,120,212,0.12)] text-[#9CA3AF] hover:text-white"
                        )}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

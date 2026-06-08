"use client";

import { motion } from "framer-motion";
import { SlidersHorizontal } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const rolePills = ["All", "Design", "Engineering", "Product"];
const experiencePills = ["1-3 yrs", "3-5 yrs", "5+ yrs"];

interface FilterBarProps {
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
}

export function FilterBar({ selectedFilter, onFilterChange }: FilterBarProps) {
  const allPills = [...rolePills, ...experiencePills];

  return (
    <ScrollArea className="w-full whitespace-nowrap mb-4">
      <div className="flex gap-2 px-2 pb-2">
        {allPills.map((pill) => {
          const isActive = selectedFilter === pill;
          return (
            <motion.button
              key={pill}
              onClick={() => onFilterChange(isActive ? "All" : pill)}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 border",
                isActive
                  ? "bg-[rgba(132,120,212,0.15)] border-[#8478D4] text-[#8478D4]"
                  : "bg-[rgba(132,120,212,0.05)] border-[rgba(132,120,212,0.1)] text-[#9CA3AF] hover:text-white hover:border-[rgba(132,120,212,0.2)]"
              )}
            >
              {pill}
            </motion.button>
          );
        })}
        <motion.button
          whileTap={{ scale: 0.95 }}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium inline-flex items-center gap-1.5 transition-colors duration-200 border",
            "bg-[rgba(132,120,212,0.05)] border-[rgba(132,120,212,0.1)] text-[#9CA3AF] hover:text-white hover:border-[rgba(132,120,212,0.2)]"
          )}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filter
        </motion.button>
      </div>
      <ScrollBar orientation="horizontal" className="h-1.5" />
    </ScrollArea>
  );
}

import { cn } from "@/lib/utils";

interface SkillPillsProps {
  items: string[];
  variant?: "accent" | "muted";
  className?: string;
}

// Accent pills for skills, muted pills for roles / "looking for".
export function SkillPills({
  items,
  variant = "accent",
  className,
}: SkillPillsProps) {
  if (!items?.length) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {items.map((item) => (
        <span
          key={item}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium",
            variant === "accent"
              ? "bg-[rgba(132,120,212,0.12)] text-[#8478D4] border border-[rgba(132,120,212,0.15)]"
              : "bg-white/[0.04] text-[#9CA3AF] border border-white/[0.06]"
          )}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

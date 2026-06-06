"use client";

import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Compass,
  MessageCircle,
  Sparkles,
  User,
} from "lucide-react";

const navItems = [
  { icon: Compass, label: "Explore", path: "/explore" },
  { icon: MessageCircle, label: "Inbox", path: "/inbox" },
  { icon: Sparkles, label: "AI Chat", path: "/chat" },
  { icon: User, label: "Profile", path: "/profile" },
];

export function SideRail() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex flex-col fixed top-[60px] left-0 bottom-0 w-16 bg-[#110E1B] border-r border-[rgba(132,120,212,0.08)] z-30">
      {navItems.map(({ icon: Icon, label, path }) => {
        const isActive = pathname.startsWith(path);
        return (
          <button
            key={path}
            onClick={() => router.push(path)}
            className={cn(
              "relative flex items-center justify-center w-10 h-10 mx-auto mt-3 rounded-xl transition-all duration-200 group",
              isActive
                ? "bg-[rgba(132,120,212,0.12)] text-[#8478D4]"
                : "text-[#9CA3AF] hover:bg-[rgba(132,120,212,0.06)] hover:text-white"
            )}
            aria-label={label}
          >
            {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-[#8478D4] rounded-r-full" />
            )}
            <Icon className="w-[22px] h-[22px]" />

            {/* Tooltip */}
            <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-[#1C1829] text-xs text-white px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50 shadow-lg border border-[rgba(132,120,212,0.12)]">
              {label}
            </div>
          </button>
        );
      })}
    </nav>
  );
}

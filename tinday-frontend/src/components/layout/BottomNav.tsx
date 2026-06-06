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

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-[#151515] border-t border-[rgba(132,120,212,0.08)] z-40 flex items-center justify-around px-2">
      {navItems.map(({ icon: Icon, label, path }) => {
        const isActive = pathname.startsWith(path);
        return (
          <button
            key={path}
            onClick={() => router.push(path)}
            className={cn(
              "relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors duration-200",
              isActive ? "text-[#8478D4]" : "text-[#9CA3AF]"
            )}
            aria-label={label}
          >
            {isActive && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-[#8478D4] rounded-b-full" />
            )}
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

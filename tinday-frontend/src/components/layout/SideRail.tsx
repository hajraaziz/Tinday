"use client";

import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import {
  Compass,
  MessageCircle,
  Sparkles,
  User,
  Settings,
  LogOut,
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
  const logout = useAuthStore((s) => s.logout);

  const settingsActive = pathname.startsWith("/settings");

  return (
    <nav className="group hidden md:flex flex-col gap-1 py-2 fixed top-[60px] left-0 bottom-0 w-16 hover:w-60 bg-[#110E1B] border-r border-[rgba(132,120,212,0.08)] overflow-hidden transition-[width] duration-200 ease-out z-30">
      {navItems.map(({ icon: Icon, label, path }) => {
        const isActive = pathname.startsWith(path);
        return (
          <button
            key={path}
            onClick={() => router.push(path)}
            className={cn(
              "flex items-center h-12 mx-2 rounded-xl transition-colors duration-200",
              isActive
                ? "bg-[rgba(132,120,212,0.12)] text-[#8478D4]"
                : "text-[#9CA3AF] hover:bg-[rgba(132,120,212,0.06)] hover:text-white"
            )}
            aria-label={label}
          >
            <span className="flex items-center justify-center w-12 shrink-0">
              <Icon className="w-6 h-6" />
            </span>
            <span className="text-[15px] font-semibold leading-none whitespace-nowrap opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">
              {label}
            </span>
          </button>
        );
      })}

      {/* Account actions pinned to the bottom */}
      <div className="mt-auto flex flex-col gap-1 pt-2 border-t border-[rgba(132,120,212,0.08)]">
        <button
          onClick={() => router.push("/settings")}
          className={cn(
            "flex items-center h-12 mx-2 rounded-xl transition-colors duration-200",
            settingsActive
              ? "bg-[rgba(132,120,212,0.12)] text-[#8478D4]"
              : "text-[#9CA3AF] hover:bg-[rgba(132,120,212,0.06)] hover:text-white"
          )}
          aria-label="Account & Settings"
        >
          <span className="flex items-center justify-center w-12 shrink-0">
            <Settings className="w-6 h-6" />
          </span>
          <span className="text-[15px] font-semibold leading-none whitespace-nowrap opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">
            Account &amp; Settings
          </span>
        </button>
        <button
          onClick={logout}
          className="flex items-center h-12 mx-2 rounded-xl text-[#EF4444] hover:bg-[rgba(239,68,68,0.05)] transition-colors duration-200"
          aria-label="Log Out"
        >
          <span className="flex items-center justify-center w-12 shrink-0">
            <LogOut className="w-6 h-6" />
          </span>
          <span className="text-[15px] font-semibold leading-none whitespace-nowrap opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">
            Log Out
          </span>
        </button>
      </div>
    </nav>
  );
}

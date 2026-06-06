"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Search, X } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: "match" | "message" | "view";
  title: string;
  body: string;
  time: string;
  read: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "match",
    title: "New Match!",
    body: "You matched with Sarah Chen",
    time: "2m ago",
    read: false,
  },
  {
    id: "2",
    type: "message",
    title: "New Message",
    body: "Alex Rivera sent you a message",
    time: "15m ago",
    read: false,
  },
  {
    id: "3",
    type: "view",
    title: "Profile Viewed",
    body: "James Kim viewed your profile",
    time: "1h ago",
    read: true,
  },
];

export function TopNav() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const { notificationPanelOpen, setNotificationPanel } = useUIStore();
  const panelRef = useRef<HTMLDivElement>(null);
  const [notifications] = useState<Notification[]>(mockNotifications);
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        setNotificationPanel(false);
      }
    }
    if (notificationPanelOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notificationPanelOpen, setNotificationPanel]);

  const initials = profile?.name ? getInitials(profile.name) : "?";

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 h-[60px] bg-[#151515] border-b border-[rgba(132,120,212,0.08)] flex items-center px-4 md:px-0">
        {/* Wordmark */}
        <button
          onClick={() => router.push("/explore")}
          className="font-[family-name:var(--font-display)] text-xl font-semibold text-white md:ml-[72px] tracking-tight"
        >
          Tinday.
        </button>

        {/* Center search */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-2 bg-[#221E30] rounded-xl px-4 py-2 w-[360px]">
          <Search className="w-4 h-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search professionals..."
            className="bg-transparent border-none outline-none text-sm text-white placeholder:text-[#4B5563] w-full"
          />
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3 ml-auto md:pr-8">
          <button
            onClick={() => setNotificationPanel(!notificationPanelOpen)}
            className="relative flex items-center justify-center w-10 h-10 rounded-xl hover:bg-[rgba(132,120,212,0.06)] transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-[#9CA3AF]" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-[18px] h-[18px] rounded-full bg-[#8478D4] text-white text-[10px] font-semibold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => router.push("/profile")}
            className="flex items-center justify-center"
            aria-label="Profile"
          >
            <Avatar className="w-8 h-8 ring-2 ring-transparent hover:ring-[#8478D4] transition-all">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-[#221E30] text-[#9CA3AF] text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </div>
      </header>

      {/* Notification panel */}
      <AnimatePresence>
        {notificationPanelOpen && (
          <>
            <div
              className="fixed inset-0 z-50"
              onClick={() => setNotificationPanel(false)}
            />
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="fixed top-[60px] right-4 md:right-10 z-50 w-[360px] max-w-[calc(100vw-2rem)] bg-[#1C1829] border border-[rgba(132,120,212,0.12)] rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(132,120,212,0.08)]">
                <h3 className="font-semibold text-white">Notifications</h3>
                <button
                  onClick={() => setNotificationPanel(false)}
                  className="text-[#9CA3AF] hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "px-5 py-3 border-b border-[rgba(132,120,212,0.04)] hover:bg-[rgba(132,120,212,0.03)] transition-colors cursor-pointer",
                      !n.read && "bg-[rgba(132,120,212,0.04)]"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full mt-1.5 shrink-0",
                          n.type === "match" && "bg-[#F59E0B]",
                          n.type === "message" && "bg-[#8478D4]",
                          n.type === "view" && "bg-[#22C55E]"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">
                          {n.title}
                        </p>
                        <p className="text-xs text-[#9CA3AF] mt-0.5">
                          {n.body}
                        </p>
                      </div>
                      <span className="text-[10px] text-[#4B5563] shrink-0">
                        {n.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

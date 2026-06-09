"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStream } from "@/hooks/useNotifications";
import { TopNav } from "@/components/layout/TopNav";
import { SideRail } from "@/components/layout/SideRail";
import { BottomNav } from "@/components/layout/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  // Single live notification long-poll for the whole app shell.
  useNotificationStream();

  useEffect(() => {
    // Wait for persisted auth to rehydrate before deciding to redirect,
    // otherwise a hard refresh bounces logged-in users to /login.
    if (hasHydrated && !isAuthenticated) {
      router.replace("/login");
    }
  }, [hasHydrated, isAuthenticated, router]);

  if (!hasHydrated) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#151515]">
        <div className="w-8 h-8 rounded-full border-2 border-[rgba(132,120,212,0.2)] border-t-[#8478D4] animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <>
      <TopNav />
      <SideRail />
      <main className="fixed top-[60px] right-0 bottom-0 overflow-y-auto md:left-16 left-0 pb-[60px] md:pb-0">
        {children}
      </main>
      <BottomNav />
    </>
  );
}

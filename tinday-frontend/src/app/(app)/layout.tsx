"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { TopNav } from "@/components/layout/TopNav";
import { SideRail } from "@/components/layout/SideRail";
import { BottomNav } from "@/components/layout/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

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

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, useMotionValue } from "framer-motion";
import Image from "next/image";
import { MessageCircle, UserPlus, Check } from "lucide-react";
import { toast } from "sonner";
import { usePublicProfile } from "@/hooks/usePublicProfile";
import { useMatches } from "@/hooks/useMatches";
import { useRecordSwipe } from "@/hooks/useRecordSwipe";
import { useAuthStore } from "@/store/authStore";
import { ProfileBody } from "@/components/profile/ProfileBody";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";

export default function PublicProfilePage() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId;
  const router = useRouter();
  const currentUserId = useAuthStore((s) => s.user?.id);

  // Viewing your own id → send to the editable own-profile page.
  useEffect(() => {
    if (currentUserId && userId === currentUserId) {
      router.replace("/profile");
    }
  }, [currentUserId, userId, router]);

  const { data: profile, isLoading, isError, refetch } =
    usePublicProfile(userId);
  const { data: matches = [] } = useMatches();
  const recordSwipe = useRecordSwipe();
  const [sentConnect, setSentConnect] = useState(false);

  // Cover parallax off the app shell's <main> scroll container.
  const coverY = useMotionValue(0);
  useEffect(() => {
    const scroller = document.querySelector("main");
    if (!scroller) return;
    const onScroll = () => coverY.set(scroller.scrollTop * 0.3);
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [coverY]);

  const existingMatch = matches.find((m) => m.user.id === userId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 rounded-full border-2 border-[rgba(132,120,212,0.2)] border-t-[#8478D4] animate-spin" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
        <p className="text-[#9CA3AF]">We couldn&apos;t load this profile.</p>
        <Button
          onClick={() => refetch()}
          className="bg-[#8478D4] text-white hover:bg-[#9488e0]"
        >
          Retry
        </Button>
      </div>
    );
  }

  const primaryRole = profile.roles?.[0];

  const handleConnect = () => {
    recordSwipe.mutate(
      { receiver_id: profile.id, direction: "RIGHT" },
      {
        onSuccess: (res) => {
          setSentConnect(true);
          if (res.match) {
            toast.success(`It's a match with ${profile.name}!`);
          } else {
            toast.success("Connection request sent");
          }
        },
        onError: () => toast.error("Something went wrong. Try again."),
      }
    );
  };

  return (
    <div className="min-h-full pb-12">
      {/* Cover */}
      <div className="relative h-[200px] overflow-hidden">
        <motion.div style={{ y: coverY }} className="absolute inset-0 -top-16 bottom-0">
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, #1B1535 0%, #2D1B4E 50%, #151515 100%)",
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 w-[420px] h-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(132,120,212,0.35) 0%, transparent 70%)",
            }}
          />
        </motion.div>
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#151515] to-transparent" />
      </div>

      <div className="max-w-2xl mx-auto px-4">
        {/* Avatar (read-only) */}
        <div className="-mt-12">
          <div className="w-24 h-24 rounded-full overflow-hidden border-[3px] border-[#8478D4] bg-[#221E30]">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.name}
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-semibold text-[#8478D4]">
                {getInitials(profile.name)}
              </div>
            )}
          </div>
        </div>

        {/* Identity */}
        <div className="mt-4">
          <h1 className="text-[28px] leading-tight font-semibold text-white font-[family-name:var(--font-display)]">
            {profile.name}
          </h1>
          {primaryRole && (
            <p className="text-sm text-[#9CA3AF] mt-1">{primaryRole}</p>
          )}
        </div>

        {/* Action row */}
        <div className="flex items-center gap-3 mt-5">
          {existingMatch ? (
            <Button
              onClick={() => router.push(`/inbox/${existingMatch.match_id}`)}
              className="flex-1 bg-[#8478D4] text-white hover:bg-[#9488e0]"
            >
              <MessageCircle className="w-4 h-4" />
              Message
            </Button>
          ) : (
            <Button
              onClick={handleConnect}
              disabled={recordSwipe.isPending || sentConnect}
              className="flex-1 bg-[#8478D4] text-white hover:bg-[#9488e0] disabled:opacity-60"
            >
              {sentConnect ? (
                <>
                  <Check className="w-4 h-4" /> Request Sent
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Connect
                </>
              )}
            </Button>
          )}
        </div>

        {/* Content cards */}
        <div className="mt-6">
          <ProfileBody data={profile} />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { usePublicProfile } from "@/hooks/usePublicProfile";
import { withNavNonce } from "@/hooks/useNotifications";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

// A recommended-person card the assistant renders inline, in place of a
// [[profile:<id>]] directive in its reply. Mirrors the explore card's look and
// deep-links to /explore?connect=<id>, front-loading that person's swipeable
// card — the same mechanism search results and connect-notifications use.
export function RecommendedProfileCard({ userId }: { userId: string }) {
  const router = useRouter();
  const { data: profile, isError } = usePublicProfile(userId);

  // A bad/stale id (404) shouldn't leave a broken card in the thread.
  if (isError) return null;

  if (!profile) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-[#1C1829] border border-[rgba(132,120,212,0.15)] px-3 py-2.5 animate-pulse">
        <div className="w-10 h-10 rounded-full bg-[#221E30] shrink-0" />
        <div className="space-y-1.5">
          <div className="h-3 w-28 rounded bg-[#221E30]" />
          <div className="h-2.5 w-20 rounded bg-[#221E30]" />
        </div>
      </div>
    );
  }

  const skills = profile.skills?.slice(0, 3) ?? [];

  return (
    <button
      onClick={() =>
        router.push(withNavNonce(`/explore?connect=${profile.id}`))
      }
      className="w-full flex items-center gap-3 rounded-xl bg-[#1C1829] border border-[rgba(132,120,212,0.15)] px-3 py-2.5 text-left hover:border-[rgba(132,120,212,0.35)] transition-colors"
    >
      <Avatar className="w-10 h-10 shrink-0">
        <AvatarImage src={profile.avatar_url ?? undefined} />
        <AvatarFallback className="bg-[#221E30] text-[#9CA3AF] text-xs">
          {getInitials(profile.name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">
          {profile.name}
        </p>
        {profile.roles?.[0] && (
          <p className="truncate text-xs text-[#9CA3AF]">{profile.roles[0]}</p>
        )}
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {skills.map((s) => (
              <span
                key={s}
                className="rounded-md bg-[#221E30] px-2 py-0.5 text-[10px] text-[#9CA3AF]"
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}

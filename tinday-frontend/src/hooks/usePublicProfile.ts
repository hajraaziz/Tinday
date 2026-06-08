import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { PublicProfile } from "@/types";

// GET /api/profiles/{userId} — read-only public profile (no preferences).
export function usePublicProfile(userId: string | undefined) {
  return useQuery<PublicProfile>({
    queryKey: ["profile", userId],
    queryFn: () => apiGet<PublicProfile>(`/api/profiles/${userId}`),
    enabled: !!userId,
  });
}

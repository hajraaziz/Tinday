import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { Profile } from "@/types";

// GET /api/profiles/me — full own profile (includes preferences).
// Syncs the result into authStore so the rest of the app (TopNav avatar, etc.)
// stays in step with the server.
export function useOwnProfile() {
  const setProfile = useAuthStore((s) => s.setProfile);

  const query = useQuery<Profile>({
    queryKey: ["profile", "me"],
    queryFn: () => apiGet<Profile>("/api/profiles/me"),
    staleTime: 1000 * 60,
  });

  useEffect(() => {
    if (query.data) {
      setProfile(query.data);
    }
  }, [query.data, setProfile]);

  return query;
}

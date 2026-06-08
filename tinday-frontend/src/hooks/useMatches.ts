import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { MatchWithUser } from "@/types";

// GET /api/matches — list of the current user's matches (with the other user).
// Used to derive Connections / Matches stats and the "Message" affordance.
export function useMatches() {
  return useQuery<MatchWithUser[]>({
    queryKey: ["matches"],
    queryFn: () => apiGet<MatchWithUser[]>("/api/matches"),
  });
}

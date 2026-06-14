import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { PaginatedProfiles } from "@/types";

interface SearchProfilesParams {
  q?: string;
  skills?: string[];
  min_experience?: number;
  max_experience?: number;
  page?: number;
  limit?: number;
}

// GET /api/profiles/search — paginated profile search.
export function useSearchProfiles(
  params: SearchProfilesParams = {},
  enabled = true
) {
  return useQuery<PaginatedProfiles>({
    queryKey: ["profiles", "search", params],
    queryFn: () =>
      apiGet<PaginatedProfiles>(
        "/api/profiles/search",
        params as Record<string, unknown>
      ),
    enabled,
  });
}

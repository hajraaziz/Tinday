import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { PublicProfile } from "@/types";

interface ExploreFeedParams {
  skills?: string;
  min_experience?: number;
  max_experience?: number;
  limit?: number;
}

export function useExploreFeed(params: ExploreFeedParams = {}) {
  return useQuery<PublicProfile[]>({
    queryKey: ["explore", params],
    queryFn: () =>
      apiGet<PublicProfile[]>("/api/explore", params as Record<string, unknown>),
    staleTime: 0,
  });
}

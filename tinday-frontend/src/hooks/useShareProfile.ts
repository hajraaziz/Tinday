import { useMutation } from "@tanstack/react-query";
import { apiPost } from "@/lib/api";
import type { ProfileAnalysis } from "@/types";

// POST /api/ai/share-profile — returns a one-shot AI analysis (JSON, not
// streamed) of the given profile in the context of the current user.
export function useShareProfile() {
  return useMutation({
    mutationFn: (profileId: string) =>
      apiPost<ProfileAnalysis>("/api/ai/share-profile", {
        profile_id: profileId,
      }),
  });
}

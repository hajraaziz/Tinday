import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPut } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { Profile, UpdateProfileRequest } from "@/types";

// PUT /api/profiles/me — partial update. Returns the full updated Profile.
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setProfile = useAuthStore((s) => s.setProfile);

  return useMutation({
    mutationFn: (body: UpdateProfileRequest) =>
      apiPut<Profile>("/api/profiles/me", body),
    onSuccess: (data) => {
      setProfile(data);
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
    },
  });
}

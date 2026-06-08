import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPost } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { Profile } from "@/types";

// POST /api/profiles/me/photo — raw binary upload (ArrayBuffer + image MIME),
// NOT FormData. Returns the updated Profile with the new avatar_url.
export function useUploadAvatar() {
  const queryClient = useQueryClient();
  const setProfile = useAuthStore((s) => s.setProfile);

  return useMutation({
    mutationFn: async (file: File) => {
      const buffer = await file.arrayBuffer();
      return apiPost<Profile>("/api/profiles/me/photo", buffer, {
        headers: { "Content-Type": file.type },
      });
    },
    onSuccess: (data) => {
      setProfile(data);
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
    },
  });
}

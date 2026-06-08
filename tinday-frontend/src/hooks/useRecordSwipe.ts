import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPost } from "@/lib/api";
import { useUIStore } from "@/store/uiStore";
import type { SwipeResponse } from "@/types";

export function useRecordSwipe() {
  const queryClient = useQueryClient();
  const showMatchOverlay = useUIStore((s) => s.showMatchOverlay);

  return useMutation({
    mutationFn: (body: { receiver_id: string; direction: "RIGHT" | "LEFT" }) =>
      apiPost<SwipeResponse>("/api/swipes", body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["explore"] });
      if (data.match) {
        showMatchOverlay(data.match);
      }
    },
  });
}

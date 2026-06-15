import { useMutation } from "@tanstack/react-query";
import { apiPost } from "@/lib/api";

export interface UploadedAttachment {
  url: string;
  type: string;
  name: string;
}

// POST /api/messaging/matches/:matchId/attachments — raw binary upload
// (ArrayBuffer + file MIME), mirroring useUploadAvatar. The original filename
// rides in X-File-Name since raw binary drops it. Returns the stored file's
// public URL + metadata; the caller then sends a message referencing it.
export function useUploadAttachment(matchId: string) {
  return useMutation({
    mutationFn: async (file: File): Promise<UploadedAttachment> => {
      const buffer = await file.arrayBuffer();
      return apiPost<UploadedAttachment>(
        `/api/messaging/matches/${matchId}/attachments`,
        buffer,
        {
          headers: {
            "Content-Type": file.type,
            "X-File-Name": encodeURIComponent(file.name),
          },
        }
      );
    },
  });
}

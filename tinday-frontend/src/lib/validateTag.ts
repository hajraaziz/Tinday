import { apiPost } from "@/lib/api";

export interface TagValidation {
  valid: boolean;
  normalized?: string;
}

// Ask the backend (Gemini) whether a typed skill/role is real. Fails open:
// on any network/server error the tag is allowed through so an AI outage
// never hard-blocks profile editing.
export async function validateTag(
  value: string,
  kind: "skill" | "role"
): Promise<TagValidation> {
  try {
    return await apiPost<TagValidation>("/api/ai/validate-tag", {
      value,
      kind,
    });
  } catch {
    return { valid: true };
  }
}

import { supabase } from "../../config/supabase.js";
import axios from "axios";

const FASTAPI_URL = process.env.FASTAPI_INTERNAL_URL || "http://fastapi:8000";
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET;

export const getExploreFeed = async (userId, filters = {}) => {
  // 1. Fetch already-swiped IDs for this user
  const { data: swiped, error: swipedError } = await supabase
    .from("swipes")
    .select("receiver_id")
    .eq("giver_id", userId);

  if (swipedError) throw swipedError;
  const excludeIds = (swiped || []).map((s) => s.receiver_id);

  // 2. Call FastAPI /recommend
  const recommendRes = await axios.post(
    `${FASTAPI_URL}/recommend`,
    {
      user_id: userId,
      filters: {
        skills: filters.skills || [],
        min_experience: filters.min_experience,
        max_experience: filters.max_experience,
      },
      exclude_ids: excludeIds,
      limit: filters.limit || 20,
    },
    { headers: { "X-Internal-Key": INTERNAL_SECRET } },
  );

  const rankedIds = recommendRes.data.ranked_user_ids;

  if (!rankedIds || rankedIds.length === 0) {
    return [];
  }

  // 3. Fetch full profiles for the returned IDs
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id, name, avatar_url, about, experience_years, skills, roles, projects",
    )
    .in("id", rankedIds);

  if (profileError) throw profileError;

  // 4. Return the profiles in ranked order
  const profileMap = profiles.reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {});

  return rankedIds.map((id) => profileMap[id]).filter((p) => !!p); // Filter out any profiles that might have been deleted in the interim
};

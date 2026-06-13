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

  // 2. Call FastAPI /recommend for a ranked ordering. This is best-effort: the
  // recommender is non-essential to *which* profiles are eligible, only to their
  // ranking. Any failure (FastAPI down, RPC signature mismatch, etc.) must not
  // blank out Explore — we catch it and fall back to a direct listing below.
  let rankedIds = [];
  try {
    const recommendRes = await axios.post(
      `${FASTAPI_URL}/recommend`,
      {
        user_id: userId,
        filters: {
          skills: filters.skills || [],
          roles: filters.roles || [],
          location: filters.location,
          min_experience: filters.min_experience,
          max_experience: filters.max_experience,
        },
        exclude_ids: excludeIds,
        limit: filters.limit || 20,
      },
      { headers: { "X-Internal-Key": INTERNAL_SECRET } },
    );
    rankedIds = recommendRes.data.ranked_user_ids || [];
  } catch (err) {
    console.error(
      "[explore] /recommend failed, falling back to direct listing:",
      err?.response?.data || err.message,
    );
  }

  // The recommender returns nothing when this user has no preference vector /
  // embedding yet (e.g. brand-new accounts), when no other profile has an
  // embedding to rank, or when the call failed above. Rather than leaving
  // Explore empty, fall back to listing all other profiles directly (still
  // honouring the active filters + exclusions).
  if (rankedIds.length === 0) {
    return fetchFallbackProfiles(userId, excludeIds, filters);
  }

  // 3. Fetch full profiles for the returned IDs
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id, name, avatar_url, about, location, experience_years, skills, roles, projects, preferences, socials",
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

// Direct profile listing used when the recommender can't rank anyone. Mirrors
// the match_profiles WHERE clauses (skills/roles overlap, location ILIKE,
// experience range) so the fallback respects the same active filters.
const fetchFallbackProfiles = async (userId, excludeIds, filters = {}) => {
  let query = supabase
    .from("profiles")
    .select(
      "id, name, avatar_url, about, location, experience_years, skills, roles, projects, preferences, socials",
    )
    .neq("id", userId)
    .order("created_at", { ascending: false })
    .limit(filters.limit || 20);

  if (excludeIds && excludeIds.length > 0) {
    query = query.not("id", "in", `(${excludeIds.join(",")})`);
  }
  if (filters.skills && filters.skills.length > 0) {
    query = query.overlaps("skills", filters.skills);
  }
  if (filters.roles && filters.roles.length > 0) {
    query = query.overlaps("roles", filters.roles);
  }
  if (filters.location) {
    query = query.ilike("location", `%${filters.location}%`);
  }
  if (filters.min_experience !== undefined) {
    query = query.gte("experience_years", filters.min_experience);
  }
  if (filters.max_experience !== undefined) {
    query = query.lte("experience_years", filters.max_experience);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

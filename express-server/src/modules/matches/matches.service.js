import { supabase } from "../../config/supabase.js";

export const getMatches = async (userId) => {
  const { data, error } = await supabase
    .from("matches")
    .select(
      `
    id, created_at,
    user_a:profiles!matches_user_a_id_fkey(id, name, avatar_url, skills, roles),
    user_b:profiles!matches_user_b_id_fkey(id, name, avatar_url, skills, roles)
  `,
    )
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);

  if (error) throw error;

  // Transform to return the "other" user's profile directly
  return data.map((match) => {
    const otherUser = match.user_a.id === userId ? match.user_b : match.user_a;
    return {
      match_id: match.id,
      created_at: match.created_at,
      user: otherUser,
    };
  });
};

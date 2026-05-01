import axios from "axios";
import { supabase } from "../../config/supabase.js";

const aiClient = axios.create({
  baseURL: process.env.FASTAPI_INTERNAL_URL,
  headers: {
    "X-Internal-Key": process.env.INTERNAL_SERVICE_SECRET,
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

export const recommend = async (userId, filters) => {
  // 1. Fetch already-swiped IDs for this user
  const { data: swipes, error: swipesError } = await supabase
    .from("swipes")
    .select("receiver_id")
    .eq("giver_id", userId);

  if (swipesError) throw swipesError;
  const excludeIds = (swipes || []).map((s) => s.receiver_id);

  // 2. Call FastAPI /recommend
  const response = await aiClient.post("/recommend", {
    user_id: userId,
    filters: {
      skills: filters.skills || [],
      min_experience: filters.min_experience,
      max_experience: filters.max_experience,
    },
    exclude_ids: excludeIds,
    limit: filters.limit || 20,
  });

  const rankedIds = response.data.ranked_user_ids;
  if (!rankedIds || rankedIds.length === 0) return [];

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

  return rankedIds.map((id) => profileMap[id]).filter((p) => !!p);
};

export const chat = async (userId, message, conversationHistory, res) => {
  const response = await aiClient.post(
    "/chat",
    {
      user_id: userId,
      message,
      conversation_history: conversationHistory,
    },
    {
      responseType: "stream",
      timeout: 60000,
    },
  );

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  response.data.pipe(res);
};

export const shareProfile = async (userId, profileId) => {
  // 1. Fetch the profile to share
  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "id, name, about, experience_years, skills, roles, projects, avatar_url",
    )
    .eq("id", profileId)
    .single();

  if (error) throw error;

  // 2. Call FastAPI chat with the profile as context
  const message = `Analyze this profile and tell me why it might be a good match for me or what stands out: ${JSON.stringify(
    profile,
  )}`;

  const response = await aiClient.post(
    "/chat",
    {
      user_id: userId,
      message,
      conversation_history: [],
    },
    {
      responseType: "stream",
      timeout: 60000,
    },
  );

  // 3. Accumulate the stream and return as JSON
  return new Promise((resolve, reject) => {
    let fullText = "";
    response.data.on("data", (chunk) => {
      const text = chunk.toString();
      // FastAPI SSE format: "data: content\n\n"
      const matches = text.matchAll(/data: (.*)\n\n/g);
      for (const match of matches) {
        fullText += match[1];
      }
    });

    response.data.on("end", () => {
      resolve({ analysis: fullText });
    });

    response.data.on("error", (err) => {
      reject(err);
    });
  });
};

import { supabase } from "../../config/supabase.js";
import axios from "axios";

const FASTAPI_URL = process.env.FASTAPI_INTERNAL_URL || "http://fastapi:8000";
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET;

export const getOwnProfile = async (userId) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
};

export const updateProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;

  // Fire-and-forget: call FastAPI /embed
  const profileText = `${data.about || ""} ${data.skills?.join(", ") || ""} ${data.roles?.join(", ") || ""} ${JSON.stringify(data.preferences || {})}`;
  axios
    .post(
      `${FASTAPI_URL}/embed`,
      { user_id: userId, profile_text: profileText },
      { headers: { "X-Internal-Key": INTERNAL_SECRET } }
    )
    .catch((err) => console.error("FastAPI embed call failed:", err.message));

  return data;
};

export const uploadAvatar = async (userId, buffer, mimetype) => {
  const ext = mimetype.split("/")[1];
  const filePath = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, buffer, {
      contentType: mimetype,
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath);

  const { data, error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", userId)
    .select()
    .single();

  if (updateError) throw updateError;
  return data;
};

export const uploadProjectMedia = async (userId, buffer, mimetype) => {
  const timestamp = Date.now();
  const ext = mimetype.split("/")[1];
  const filePath = `${userId}/${timestamp}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("projects")
    .upload(filePath, buffer, {
      contentType: mimetype,
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from("projects")
    .getPublicUrl(filePath);

  return { url: publicUrl };
};

export const getProfileById = async (userId) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, avatar_url, about, experience_years, skills, roles, projects")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
};

export const searchProfiles = async (filters) => {
  const { skills, min_experience, max_experience, page = 1, limit = 10 } = filters;
  
  let query = supabase
    .from("profiles")
    .select("*", { count: "exact" });

  if (skills && skills.length > 0) {
    query = query.contains("skills", skills);
  }

  if (min_experience !== undefined) {
    query = query.gte("experience_years", min_experience);
  }

  if (max_experience !== undefined) {
    query = query.lte("experience_years", max_experience);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await query.range(from, to);

  if (error) throw error;
  return { profiles: data, total: count, page, limit };
};

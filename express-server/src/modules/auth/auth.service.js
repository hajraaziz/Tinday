import { supabase } from "../../config/supabase.js";
import axios from "axios";

const FASTAPI_URL = process.env.FASTAPI_INTERNAL_URL || "http://fastapi:8000";
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET;

export const register = async ({ email, password, name }) => {
  // 1. Create user in Supabase Auth
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) throw authError;

  // 2. Insert into profiles table
  const { error: profileError } = await supabase
    .from("profiles")
    .insert({ id: user.id, name });

  if (profileError) {
    // Attempt cleanup: delete user if profile fails?
    // For simplicity, we'll just log and throw.
    console.error("Profile creation failed:", profileError);
    throw profileError;
  }

  // 3. Fire-and-forget: call FastAPI /embed
  const profileText = `${name}`; // Initial text for embedding
  axios
    .post(
      `${FASTAPI_URL}/embed`,
      { user_id: user.id, profile_text: profileText },
      { headers: { "X-Internal-Key": INTERNAL_SECRET } },
    )
    .catch((err) => console.error("FastAPI embed call failed:", err.message));

  return { message: "Account created successfully." };
};

export const login = async ({ email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

export const refresh = async ({ refresh_token }) => {
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token,
  });

  if (error) throw error;
  return data;
};

export const logout = async (token) => {
  const { error } = await supabase.auth.admin.signOut(token);
  if (error) throw error;
};

export const getCurrentUser = async (userId) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw { status: 404, message: "Profile not found" };
  return data;
};

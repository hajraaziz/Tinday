import { supabase, supabaseAuth } from "../../config/supabase.js";
import axios from "axios";

const FASTAPI_URL = process.env.FASTAPI_INTERNAL_URL || "http://fastapi:8000";
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const EMAIL_REDIRECT_TO = `${FRONTEND_URL}/auth/callback`;

const VERIFY_MESSAGE =
  "Account created. Please check your email to confirm your account.";

export const register = async ({ email, password, name }) => {
  // 1. Create the user via the anon client's signUp so Supabase sends the
  //    hosted "Confirm signup" email. With "Confirm email" enabled this returns
  //    no session (matches the existing 201 { message, user } contract).
  const { data, error: authError } = await supabaseAuth.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: EMAIL_REDIRECT_TO,
    },
  });

  if (authError) throw authError;

  const user = data.user;

  // Email-enumeration guard: when the email already exists, Supabase returns an
  // obfuscated user with no identities instead of an error. Return the same
  // generic message so we don't leak which emails are registered.
  if (!user || (user.identities && user.identities.length === 0)) {
    return { message: VERIFY_MESSAGE, user };
  }

  // 2. Insert into profiles table (service-role — works for an unconfirmed user)
  const { error: profileError } = await supabase
    .from("profiles")
    .insert({ id: user.id, name });

  if (profileError) {
    // Don't block signup on profile creation — the user row already exists in
    // auth. Log it; the profile is upserted lazily on first login/getCurrentUser.
    console.error("Profile creation failed:", profileError);
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

  return { message: VERIFY_MESSAGE, user };
};

export const resendConfirmation = async ({ email }) => {
  const { error } = await supabaseAuth.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: EMAIL_REDIRECT_TO },
  });

  if (error) throw error;
  return { message: "Confirmation email sent. Please check your inbox." };
};

export const login = async ({ email, password }) => {
  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

export const refresh = async ({ refresh_token }) => {
  const { data, error } = await supabaseAuth.auth.refreshSession({
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

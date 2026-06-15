import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

// PKCE flow for OAuth; we exchange the code manually in /auth/callback, so
// disable automatic URL detection. (Email confirmation uses verifyOtp, not URL
// detection, so this doesn't affect it.)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { flowType: "pkce", detectSessionInUrl: false },
});

export function setSupabaseSession(
  access_token: string,
  refresh_token: string
) {
  return supabase.auth.setSession({ access_token, refresh_token });
}

export function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
}

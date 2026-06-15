"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { apiPost } from "@/lib/api";
import { setSupabaseSession, supabase } from "@/lib/supabase";
import { connectSocket } from "@/lib/socket";
import { useAuthStore } from "@/store/authStore";
import type { Profile } from "@/types";

type Status = "verifying" | "success" | "error";

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setProfile = useAuthStore((s) => s.setProfile);
  const [status, setStatus] = useState<Status>("verifying");
  const [resending, setResending] = useState(false);

  const tokenHash = params.get("token_hash");
  const email = params.get("email");
  const oauthCode = params.get("code");
  const oauthError = params.get("error");

  useEffect(() => {
    let cancelled = false;

    // Google OAuth redirect: exchange the code for a session, ensure a profile
    // row exists, then route into the app (onboarding or explore).
    async function handleOAuth(code: string) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (cancelled) return;
      if (error || !data.session || !data.user) {
        setStatus("error");
        return;
      }

      // Map Supabase's session/user onto the app's stricter types.
      const { session, user } = data;
      const appUser = {
        id: user.id,
        email: user.email ?? "",
        created_at: user.created_at,
      };
      setAuth({
        user: appUser,
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          token_type: "bearer",
          expires_in: session.expires_in,
          expires_at: session.expires_at ?? 0,
          user: appUser,
        },
      });
      await setSupabaseSession(session.access_token, session.refresh_token);
      if (cancelled) return;
      connectSocket();

      // Guarantee a profiles row (first-time Google users don't have one) and
      // route incomplete profiles into onboarding, everyone else to explore.
      let profile: Profile | null = null;
      try {
        const result = await apiPost<{ profile: Profile; created: boolean }>(
          "/api/auth/oauth-sync"
        );
        profile = result.profile;
        setProfile(profile);
      } catch {
        // If the sync fails, fall through to onboarding so the user can recover.
      }
      if (cancelled) return;
      setStatus("success");
      const needsOnboarding = !profile?.skills || profile.skills.length === 0;
      router.replace(needsOnboarding ? "/onboarding" : "/explore");
    }

    // Email confirmation: the confirm link is generated server-side, so we verify
    // the OTP token hash directly (NOT exchangeCodeForSession — no PKCE verifier).
    async function verifyEmail(hash: string) {
      const { error } = await supabase.auth.verifyOtp({
        type: "email",
        token_hash: hash,
      });
      if (cancelled) return;
      if (error) {
        setStatus("error");
        return;
      }
      // Don't keep this Supabase session — Express mints the app's canonical
      // tokens at login. Sign out the browser client and send the user to log in.
      await supabase.auth.signOut();
      if (cancelled) return;
      setStatus("success");
      toast.success("Email confirmed", {
        description: "You can now sign in to your account.",
      });
      setTimeout(() => {
        router.replace(`/login${email ? `?email=${encodeURIComponent(email)}` : ""}`);
      }, 1500);
    }

    async function run() {
      if (oauthError) {
        setStatus("error");
      } else if (oauthCode) {
        await handleOAuth(oauthCode);
      } else if (tokenHash) {
        await verifyEmail(tokenHash);
      } else {
        setStatus("error");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [tokenHash, email, oauthCode, oauthError, router, setAuth, setProfile]);

  const handleResend = async () => {
    if (!email) {
      router.replace("/register");
      return;
    }
    setResending(true);
    try {
      const { apiPost } = await import("@/lib/api");
      await apiPost("/api/auth/resend-confirmation", { email });
      toast.success("New confirmation email sent");
    } catch {
      toast.error("Couldn't resend. Please register again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative w-full max-w-[440px] mx-4"
    >
      <div
        className="rounded-[16px] p-10 text-center"
        style={{ background: "#1C1829", border: "1px solid rgba(132,120,212,0.12)" }}
      >
        <h1 className="font-display text-3xl text-white mb-8">Tinday.</h1>

        {status === "verifying" && (
          <div className="flex flex-col items-center">
            <Loader2 className="h-10 w-10 text-[#8478D4] animate-spin mb-4" />
            <p className="text-sm text-[#9CA3AF]">Confirming your email…</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center">
            <CheckCircle2 className="h-12 w-12 text-[#22C55E] mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Email confirmed
            </h2>
            <p className="text-sm text-[#9CA3AF]">Redirecting you to sign in…</p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center">
            <XCircle className="h-12 w-12 text-[#EF4444] mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Link expired or invalid
            </h2>
            <p className="text-sm text-[#9CA3AF] mb-6">
              This confirmation link is no longer valid. Request a new one below.
            </p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="w-full py-2.5 rounded-lg font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "#8478D4" }}
            >
              {resending ? "Sending…" : "Resend confirmation email"}
            </button>
            <Link
              href="/login"
              className="mt-4 inline-block text-sm text-[#9CA3AF] hover:text-[#8478D4] transition-colors"
            >
              Back to sign in
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#0A090F] overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#8478D4] opacity-[0.06] blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#8478D4] opacity-[0.04] blur-[120px]" />
      <Suspense fallback={null}>
        <CallbackInner />
      </Suspense>
    </div>
  );
}

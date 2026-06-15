"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { apiGet, apiPost } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { setSupabaseSession, signInWithGoogle, supabase } from "@/lib/supabase";
import { connectSocket } from "@/lib/socket";
import type { AuthResponse, Profile } from "@/types";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setProfile = useAuthStore((s) => s.setProfile);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resending, setResending] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  // Prefill email after coming back from email confirmation (?email=...).
  useEffect(() => {
    const email = new URLSearchParams(window.location.search).get("email");
    if (email) setValue("email", email);
  }, [setValue]);

  const onSubmit = async (data: LoginForm) => {
    setServerError(null);
    setNeedsConfirmation(false);
    try {
      const response = await apiPost<AuthResponse>("/api/auth/login", {
        email: data.email,
        password: data.password,
      });
      setAuth({ user: response.user, session: response.session });
      await setSupabaseSession(
        response.session.access_token,
        response.session.refresh_token
      );
      connectSocket();

      // Route incomplete profiles into onboarding, everyone else to explore.
      try {
        const profile = await apiGet<Profile>("/api/profiles/me");
        setProfile(profile);
        if (!profile.skills || profile.skills.length === 0) {
          router.push("/onboarding");
          return;
        }
      } catch {
        // If the profile lookup fails, fall through to explore.
      }
      router.push("/explore");
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { error?: string; message?: string } };
      };
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Something went wrong. Please try again.";
      if (/confirm/i.test(message)) {
        setNeedsConfirmation(true);
        setServerError("Please confirm your email before signing in.");
      } else {
        setServerError(message);
      }
    }
  };

  const handleResendConfirmation = async () => {
    const email = getValues("email");
    if (!email) {
      toast.error("Enter your email first");
      return;
    }
    setResending(true);
    try {
      await apiPost("/api/auth/resend-confirmation", { email });
      toast.success("Confirmation email sent", {
        description: "Check your inbox and spam folder.",
      });
    } catch {
      toast.error("Couldn't resend right now. Please try again shortly.");
    } finally {
      setResending(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = getValues("email");
    if (!email) {
      toast.error("Enter your email above first", {
        description: "We'll send the reset link there.",
      });
      return;
    }
    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
    } catch {
      // Swallow — show a generic message regardless to avoid email enumeration.
    }
    toast.success("Check your email", {
      description: "If that address has an account, a reset link is on its way.",
    });
  };

  const handleGoogleSignIn = async () => {
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error("Couldn't start Google sign-in", {
        description: "Please try again in a moment.",
      });
    }
    // On success the browser redirects to Google, so nothing else runs here.
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#0A090F] overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#8478D4] opacity-[0.06] blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#8478D4] opacity-[0.04] blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-[440px] mx-4"
      >
        {/* Card */}
        <div
          className="rounded-[16px] p-10"
          style={{
            background: "#1C1829",
            border: "1px solid rgba(132,120,212,0.12)",
          }}
        >
          {/* Wordmark */}
          <h1 className="text-center font-display text-3xl text-white mb-6">
            Tinday.
          </h1>

          {/* Tab switcher */}
          <div className="relative flex rounded-lg p-1 bg-[#221E30] mb-8">
            <motion.div
              layout
              className="absolute inset-1 rounded-md bg-[#8478D4] w-[calc(50%-4px)]"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
            <Link
              href="/login"
              className="relative flex-1 text-center py-2 text-sm font-medium text-white z-10"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="relative flex-1 text-center py-2 text-sm font-medium text-[#9CA3AF] z-10 hover:text-white transition-colors"
            >
              Sign Up
            </Link>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm text-[#9CA3AF] mb-1.5">
                Email
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-lg px-4 py-2.5 text-white placeholder:text-[#4B5563] outline-none transition-colors focus:ring-2 focus:ring-[#8478D4]/30"
                style={{ background: "#161222", border: "1px solid rgba(132,120,212,0.1)" }}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-[#EF4444]">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-[#9CA3AF] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full rounded-lg px-4 py-2.5 pr-10 text-white placeholder:text-[#4B5563] outline-none transition-colors focus:ring-2 focus:ring-[#8478D4]/30"
                  style={{ background: "#161222", border: "1px solid rgba(132,120,212,0.1)" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-[#EF4444]">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Forgot password */}
            <div className="text-right">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-[#9CA3AF] hover:text-[#8478D4] transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-lg font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "#8478D4" }}
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>

            {/* Server error */}
            <AnimatePresence>
              {serverError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-sm text-[#EF4444] text-center"
                >
                  {serverError}
                  {needsConfirmation && (
                    <button
                      type="button"
                      onClick={handleResendConfirmation}
                      disabled={resending}
                      className="mt-1 block w-full text-[#8478D4] hover:text-[#A098E0] transition-colors disabled:opacity-50"
                    >
                      {resending ? "Sending…" : "Resend confirmation email"}
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-xs text-[#4B5563] uppercase">or continue with</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Google sign-in */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="flex w-full items-center justify-center gap-3 h-11 rounded-lg border border-white/[0.06] hover:bg-white/[0.04] transition-colors"
            style={{ background: "#161222" }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-sm font-medium text-white">
              Continue with Google
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

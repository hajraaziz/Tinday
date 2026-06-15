"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { apiPost } from "@/lib/api";
import { signInWithGoogle } from "@/lib/supabase";
import type { User } from "@/types";

const RESEND_COOLDOWN = 45; // seconds

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

function getPasswordStrength(password: string): {
  level: number;
  color: string;
  label: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { level: 1, color: "#EF4444", label: "Weak" };
  if (score === 2) return { level: 2, color: "#F59E0B", label: "Fair" };
  if (score === 3) return { level: 3, color: "#F59E0B", label: "Good" };
  return { level: 4, color: "#22C55E", label: "Strong" };
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  // Set once registration succeeds → switches the card to the "check inbox" view.
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleResend = async () => {
    if (!submittedEmail || resendCooldown > 0) return;
    try {
      await apiPost("/api/auth/resend-confirmation", { email: submittedEmail });
      toast.success("Confirmation email sent", {
        description: "Check your inbox (and spam folder).",
      });
      setResendCooldown(RESEND_COOLDOWN);
    } catch {
      toast.error("Couldn't resend right now. Please try again shortly.");
      setResendCooldown(RESEND_COOLDOWN);
    }
  };

  const handleGoogleSignIn = async () => {
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error("Couldn't start Google sign-up", {
        description: "Please try again in a moment.",
      });
    }
    // On success the browser redirects to Google, so nothing else runs here.
  };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  // useWatch (vs watch()) subscribes via a hook the React Compiler can analyze.
  const passwordValue = useWatch({ control, name: "password" }) ?? "";
  const strength = getPasswordStrength(passwordValue);

  const onSubmit = async (data: RegisterForm) => {
    setServerError(null);
    setFieldErrors({});
    try {
      // Register. Supabase sends a confirmation email — no session yet.
      await apiPost<{ message: string; user: User }>("/api/auth/register", {
        email: data.email,
        password: data.password,
        name: data.name,
      });

      // Switch to the "check your inbox" screen and start the resend cooldown.
      setSubmittedEmail(data.email);
      setResendCooldown(RESEND_COOLDOWN);
    } catch (err: unknown) {
      const error = err as {
        response?: {
          data?: {
            error?: string;
            message?: string;
            details?: Array<{ field: string; message: string }>;
          };
        };
      };
      const body = error?.response?.data;

      if (body?.details) {
        const fields: Record<string, string> = {};
        body.details.forEach((d) => {
          fields[d.field] = d.message;
        });
        setFieldErrors(fields);
        setServerError(body.error || "Validation failed");
      } else {
        setServerError(
          body?.error || body?.message || "Something went wrong. Please try again."
        );
      }
    }
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

          {submittedEmail ? (
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(132,120,212,0.12)]">
                <MailCheck className="h-7 w-7 text-[#8478D4]" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Check your inbox
              </h2>
              <p className="text-sm text-[#9CA3AF] mb-1">
                We sent a confirmation link to
              </p>
              <p className="text-sm font-medium text-white mb-6 break-all">
                {submittedEmail}
              </p>
              <p className="text-xs text-[#4B5563] mb-6">
                Click the link in the email to activate your account, then sign
                in. The link may take a minute to arrive — check spam too.
              </p>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="w-full py-2.5 rounded-lg font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "#8478D4" }}
              >
                {resendCooldown > 0
                  ? `Resend email in ${resendCooldown}s`
                  : "Resend confirmation email"}
              </button>
              <Link
                href="/login"
                className="mt-4 inline-block text-sm text-[#9CA3AF] hover:text-[#8478D4] transition-colors"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
          {/* Tab switcher */}
          <div className="relative flex rounded-lg p-1 bg-[#221E30] mb-8">
            <motion.div
              layout
              className="absolute inset-1 rounded-md bg-[#8478D4] w-[calc(50%-4px)] left-[calc(50%+4px)]"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
            <Link
              href="/login"
              className="relative flex-1 text-center py-2 text-sm font-medium text-[#9CA3AF] z-10 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="relative flex-1 text-center py-2 text-sm font-medium text-white z-10"
            >
              Sign Up
            </Link>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm text-[#9CA3AF] mb-1.5">
                Full Name
              </label>
              <input
                {...register("name")}
                type="text"
                placeholder="Sarah Chen"
                className="w-full rounded-lg px-4 py-2.5 text-white placeholder:text-[#4B5563] outline-none transition-colors focus:ring-2 focus:ring-[#8478D4]/30"
                style={{
                  background: "#161222",
                  border: "1px solid rgba(132,120,212,0.1)",
                }}
              />
              {(errors.name || fieldErrors.name) && (
                <p className="mt-1 text-sm text-[#EF4444]">
                  {errors.name?.message || fieldErrors.name}
                </p>
              )}
            </div>

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
                style={{
                  background: "#161222",
                  border: "1px solid rgba(132,120,212,0.1)",
                }}
              />
              {(errors.email || fieldErrors.email) && (
                <p className="mt-1 text-sm text-[#EF4444]">
                  {errors.email?.message || fieldErrors.email}
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
                  style={{
                    background: "#161222",
                    border: "1px solid rgba(132,120,212,0.1)",
                  }}
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

              {/* Password strength meter */}
              {passwordValue.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1.5 mb-1">
                    {[1, 2, 3, 4].map((segment) => (
                      <div
                        key={segment}
                        className="h-1 flex-1 rounded-full transition-colors"
                        style={{
                          background:
                            segment <= strength.level
                              ? strength.color
                              : "#2a2a2a",
                        }}
                      />
                    ))}
                  </div>
                  <span
                    className="text-xs"
                    style={{ color: strength.color }}
                  >
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm text-[#9CA3AF] mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  {...register("confirmPassword")}
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full rounded-lg px-4 py-2.5 pr-10 text-white placeholder:text-[#4B5563] outline-none transition-colors focus:ring-2 focus:ring-[#8478D4]/30"
                  style={{
                    background: "#161222",
                    border: "1px solid rgba(132,120,212,0.1)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-white transition-colors"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-[#EF4444]">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-lg font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "#8478D4" }}
            >
              {isSubmitting ? "Creating account..." : "Create Account"}
            </button>

            {/* Server error */}
            <AnimatePresence>
              {serverError && !Object.keys(fieldErrors).length && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-sm text-[#EF4444] text-center"
                >
                  {serverError}
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-xs text-[#4B5563] uppercase">
              or sign up with
            </span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Google sign-up */}
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

          {/* Sign In link */}
          <p className="text-center text-sm text-[#9CA3AF] mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[#8478D4] hover:text-[#A098E0] transition-colors"
            >
              Sign in
            </Link>
          </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

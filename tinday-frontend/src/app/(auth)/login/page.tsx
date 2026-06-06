"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { apiPost } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { setSupabaseSession } from "@/lib/supabase";
import { connectSocket } from "@/lib/socket";
import type { AuthResponse } from "@/types";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setServerError(null);
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
      router.push("/explore");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setServerError(
        error?.response?.data?.error || "Something went wrong. Please try again."
      );
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
                onClick={() =>
                  toast("Password reset", {
                    description: "Password reset coming soon.",
                  })
                }
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

          {/* Social buttons */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: "Google",
                svg: (
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
                ),
              },
              {
                label: "GitHub",
                svg: (
                  <svg className="w-5 h-5" fill="#FFFFFF" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    />
                  </svg>
                ),
              },
              {
                label: "Apple",
                svg: (
                  <svg className="w-5 h-5" fill="#FFFFFF" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                ),
              },
            ].map((provider) => (
              <button
                key={provider.label}
                type="button"
                onClick={() =>
                  toast("Social auth coming soon", {
                    description: `${provider.label} login will be available soon.`,
                  })
                }
                className="flex items-center justify-center h-10 rounded-lg border border-white/[0.06] hover:bg-white/[0.04] transition-colors"
                style={{ background: "#161222" }}
              >
                {provider.svg}
                <span className="sr-only">Continue with {provider.label}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

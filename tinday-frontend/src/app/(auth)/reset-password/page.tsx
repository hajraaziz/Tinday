"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

function ResetInner() {
  const router = useRouter();
  const params = useSearchParams();
  const tokenHash = params.get("token_hash");
  const [phase, setPhase] = useState<"verifying" | "ready" | "error">(
    "verifying"
  );
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    let cancelled = false;
    async function verify() {
      if (!tokenHash) {
        setPhase("error");
        return;
      }
      const { error } = await supabase.auth.verifyOtp({
        type: "recovery",
        token_hash: tokenHash,
      });
      if (cancelled) return;
      setPhase(error ? "error" : "ready");
    }
    verify();
    return () => {
      cancelled = true;
    };
  }, [tokenHash]);

  const onSubmit = async (data: FormValues) => {
    const { error } = await supabase.auth.updateUser({ password: data.password });
    if (error) {
      toast.error(error.message || "Couldn't update password");
      return;
    }
    await supabase.auth.signOut();
    toast.success("Password updated", { description: "Please sign in." });
    router.replace("/login");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative w-full max-w-[440px] mx-4"
    >
      <div
        className="rounded-[16px] p-10"
        style={{ background: "#1C1829", border: "1px solid rgba(132,120,212,0.12)" }}
      >
        <h1 className="text-center font-display text-3xl text-white mb-8">
          Tinday.
        </h1>

        {phase === "verifying" && (
          <div className="flex flex-col items-center">
            <Loader2 className="h-10 w-10 text-[#8478D4] animate-spin mb-4" />
            <p className="text-sm text-[#9CA3AF]">Verifying reset link…</p>
          </div>
        )}

        {phase === "error" && (
          <div className="flex flex-col items-center text-center">
            <XCircle className="h-12 w-12 text-[#EF4444] mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Link expired or invalid
            </h2>
            <p className="text-sm text-[#9CA3AF] mb-6">
              Request a new password reset link from the sign-in page.
            </p>
            <Link
              href="/login"
              className="text-sm text-[#8478D4] hover:text-[#A098E0] transition-colors"
            >
              Back to sign in
            </Link>
          </div>
        )}

        {phase === "ready" && (
          <>
            <h2 className="text-center text-lg font-semibold text-white mb-6">
              Set a new password
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm text-[#9CA3AF] mb-1.5">
                  New password
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
              </div>

              <div>
                <label className="block text-sm text-[#9CA3AF] mb-1.5">
                  Confirm password
                </label>
                <input
                  {...register("confirmPassword")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full rounded-lg px-4 py-2.5 text-white placeholder:text-[#4B5563] outline-none transition-colors focus:ring-2 focus:ring-[#8478D4]/30"
                  style={{
                    background: "#161222",
                    border: "1px solid rgba(132,120,212,0.1)",
                  }}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-[#EF4444]">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-lg font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "#8478D4" }}
              >
                {isSubmitting ? "Updating…" : "Update password"}
              </button>
            </form>
          </>
        )}
      </div>
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#0A090F] overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#8478D4] opacity-[0.06] blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#8478D4] opacity-[0.04] blur-[120px]" />
      <Suspense fallback={null}>
        <ResetInner />
      </Suspense>
    </div>
  );
}

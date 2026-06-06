"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  ChevronLeft,
  X,
} from "lucide-react";
import Image from "next/image";
import { apiPost, apiPut } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { Profile } from "@/types";

const SUGGESTED_SKILLS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "FastAPI",
  "PostgreSQL",
  "MongoDB",
  "Docker",
  "Kubernetes",
  "AWS",
  "Figma",
  "Product Design",
  "UI/UX",
  "GraphQL",
  "Rust",
  "Go",
  "Machine Learning",
  "Data Science",
  "DevOps",
  "Project Management",
  "Marketing",
  "Sales",
  "Content Writing",
];

const EXPERIENCE_OPTIONS = [1, 2, 3, 5, 7, 10, 15];
const ROLE_OPTIONS = [
  "Software Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Product Designer",
  "UI/UX Designer",
  "Product Manager",
  "Engineering Manager",
  "Data Scientist",
  "ML Engineer",
  "DevOps Engineer",
  "Tech Lead",
  "Founder",
  "Marketer",
  "Content Creator",
];

const STEP_TITLES = [
  "Welcome! Let's set up your profile",
  "Tell us about yourself",
  "What are your skills?",
  "What are you looking for?",
];

type StepData = {
  name: string;
  role: string;
  avatarFile: File | null;
  avatarPreview: string | null;
  about: string;
  experienceYears: number | null;
  skills: string[];
  roles: string[];
  preferredSkills: string[];
  preferredRoles: string[];
  preferredExperience: number | null;
};

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated, profile, user } = useAuthStore();

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [data, setData] = useState<StepData>({
    name: "",
    role: "",
    avatarFile: null,
    avatarPreview: null,
    about: "",
    experienceYears: null,
    skills: [],
    roles: [],
    preferredSkills: [],
    preferredRoles: [],
    preferredExperience: null,
  });

  const [skillInput, setSkillInput] = useState("");
  const [roleInput, setRoleInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Route guard
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (profile && profile.skills && profile.skills.length > 0) {
      router.replace("/explore");
    }
  }, [isAuthenticated, profile, router]);

  const nextStep = () => {
    if (step < 4) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  };

  const update = (partial: Partial<StepData>) =>
    setData((d) => ({ ...d, ...partial }));

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB");
      return;
    }
    const preview = URL.createObjectURL(file);
    update({ avatarFile: file, avatarPreview: preview });
  };

  const addSkill = (skill: string) => {
    const s = skill.trim();
    if (s && !data.skills.includes(s)) {
      update({ skills: [...data.skills, s] });
    }
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    update({ skills: data.skills.filter((s) => s !== skill) });
  };

  const addRole = (role: string) => {
    const r = role.trim();
    if (r && !data.roles.includes(r)) {
      update({ roles: [...data.roles, r] });
    }
    setRoleInput("");
  };

  const removeRole = (role: string) => {
    update({ roles: data.roles.filter((r) => r !== role) });
  };

  const allRoles = [...new Set([...data.roles, ...(data.role ? [data.role] : [])])];

  const handleComplete = async () => {
    setIsSubmitting(true);
    setApiError(null);
    try {
      const profilePayload: Record<string, unknown> = {};
      if (data.name) profilePayload.name = data.name;
      if (data.about) profilePayload.about = data.about;
      if (data.experienceYears !== null)
        profilePayload.experience_years = data.experienceYears;
      if (data.skills.length > 0) profilePayload.skills = data.skills;
      if (allRoles.length > 0) profilePayload.roles = allRoles;
      profilePayload.preferences = {
        preferred_skills: data.preferredSkills,
        preferred_roles: data.preferredRoles,
        preferred_experience: data.preferredExperience,
      };

      await apiPut<Profile>("/api/profiles/me", profilePayload);

      if (data.avatarFile) {
        const buffer = await data.avatarFile.arrayBuffer();
        await apiPost<Profile>("/api/profiles/me/photo", buffer, {
          headers: { "Content-Type": data.avatarFile.type },
        });
      }

      setShowCelebration(true);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setApiError(
        error?.response?.data?.error ||
          "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepVariants = {
    enter: (dir: 1 | -1) => ({ x: dir === 1 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: 1 | -1) => ({ x: dir === 1 ? -40 : 40, opacity: 0 }),
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#0A090F] overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#8478D4] opacity-[0.06] blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#8478D4] opacity-[0.04] blur-[120px]" />

      {/* Celebration overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            {/* Confetti */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {Array.from({ length: 60 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    background: [
                      "#8478D4",
                      "#F59E0B",
                      "#22C55E",
                      "#EF4444",
                      "#A098E0",
                    ][i % 5],
                  }}
                  initial={{
                    x: "50vw",
                    y: "50vh",
                    scale: 0,
                  }}
                  animate={{
                    x: `calc(50vw + ${(Math.random() - 0.5) * 600}px)`,
                    y: `calc(50vh + ${(Math.random() - 0.5) * 600}px)`,
                    scale: [0, 1, 0],
                    opacity: [1, 1, 0],
                  }}
                  transition={{
                    duration: 2.5,
                    delay: i * 0.02,
                    ease: "easeOut",
                  }}
                />
              ))}
            </div>

            {/* Card */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="relative z-10 text-center p-10 rounded-[24px] max-w-sm"
              style={{
                background: "#1C1829",
                border: "1px solid rgba(132,120,212,0.15)",
              }}
            >
              {/* Avatar preview */}
              <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-2 border-[#8478D4]">
                {data.avatarPreview ? (
                  <Image
                    src={data.avatarPreview}
                    alt="Avatar"
                    width={96}
                    height={96}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#221E30] text-[#9CA3AF] text-2xl font-display">
                    {(data.name || user?.email || "?")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
              </div>

              <h2 className="font-display italic text-3xl text-white mb-2">
                All Set, {data.name || "Explorer"}!
              </h2>
              <p className="text-[#9CA3AF] text-sm mb-6">
                Your profile is ready. Start connecting with amazing people.
              </p>

              {/* Stats preview */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div
                  className="rounded-lg py-2 px-3"
                  style={{ background: "rgba(132,120,212,0.06)" }}
                >
                  <p className="text-lg font-semibold text-white">
                    {data.skills.length || "-"}
                  </p>
                  <p className="text-[10px] text-[#9CA3AF]">Skills</p>
                </div>
                <div
                  className="rounded-lg py-2 px-3"
                  style={{ background: "rgba(132,120,212,0.06)" }}
                >
                  <p className="text-lg font-semibold text-white">
                    {data.experienceYears ? `${data.experienceYears}y` : "-"}
                  </p>
                  <p className="text-[10px] text-[#9CA3AF]">Experience</p>
                </div>
                <div
                  className="rounded-lg py-2 px-3"
                  style={{ background: "rgba(132,120,212,0.06)" }}
                >
                  <p className="text-lg font-semibold text-white">
                    {allRoles.length || "-"}
                  </p>
                  <p className="text-[10px] text-[#9CA3AF]">Roles</p>
                </div>
              </div>

              <button
                onClick={() => router.push("/explore")}
                className="w-full py-2.5 rounded-lg font-medium text-white hover:opacity-90 transition-opacity"
                style={{ background: "#8478D4" }}
              >
                Start Exploring
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-[520px] mx-4"
      >
        <div
          className="rounded-[16px] p-10"
          style={{
            background: "#1C1829",
            border: "1px solid rgba(132,120,212,0.12)",
          }}
        >
          {/* Progress dots + back button */}
          <div className="flex items-center justify-between mb-8">
            <div className="w-8">
              {step > 1 && (
                <button
                  onClick={prevStep}
                  className="text-[#9CA3AF] hover:text-white transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((s) => (
                <motion.div
                  key={s}
                  layout
                  className="rounded-full"
                  animate={{
                    width: s === step ? 20 : 8,
                    height: 8,
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  style={{
                    background: s === step ? "#8478D4" : "#2a2a2a",
                  }}
                />
              ))}
            </div>

            <div className="w-8" />
          </div>

          {/* Step title */}
          <h2 className="text-center font-display text-xl text-white mb-8">
            {STEP_TITLES[step - 1]}
          </h2>

          <AnimatePresence mode="wait" custom={direction}>
            {/* Step 1 — Avatar + Name + Role */}
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Avatar upload */}
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-24 h-24 rounded-full border-2 border-dashed border-[#4B5563] hover:border-[#8478D4] transition-colors flex items-center justify-center overflow-hidden"
                  >
                    {data.avatarPreview ? (
                      <Image
                        src={data.avatarPreview}
                        alt="Avatar preview"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <Camera size={28} className="text-[#4B5563]" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarSelect}
                  />
                </div>
                <p className="text-center text-xs text-[#4B5563] -mt-4">
                  {data.avatarPreview
                    ? "Click to change photo"
                    : "Upload a profile photo"}
                </p>

                {/* Full Name */}
                <div>
                  <label className="block text-sm text-[#9CA3AF] mb-1.5">
                    Full Name
                  </label>
                  <input
                    value={data.name}
                    onChange={(e) => update({ name: e.target.value })}
                    type="text"
                    placeholder="Sarah Chen"
                    className="w-full rounded-lg px-4 py-2.5 text-white placeholder:text-[#4B5563] outline-none transition-colors focus:ring-2 focus:ring-[#8478D4]/30"
                    style={{
                      background: "#161222",
                      border: "1px solid rgba(132,120,212,0.1)",
                    }}
                  />
                </div>

                {/* Your Role */}
                <div>
                  <label className="block text-sm text-[#9CA3AF] mb-1.5">
                    Your Role
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ROLE_OPTIONS.slice(0, 8).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => update({ role })}
                        className="px-3 py-1.5 rounded-full text-xs transition-all"
                        style={{
                          background:
                            data.role === role
                              ? "rgba(132,120,212,0.2)"
                              : "#221E30",
                          border:
                            data.role === role
                              ? "1px solid rgba(132,120,212,0.3)"
                              : "1px solid transparent",
                          color: data.role === role ? "#8478D4" : "#9CA3AF",
                        }}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={nextStep}
                  disabled={!data.name.trim()}
                  className="w-full py-2.5 rounded-lg font-medium text-white transition-all hover:opacity-90 disabled:opacity-40"
                  style={{ background: "#8478D4" }}
                >
                  Continue
                </button>
              </motion.div>
            )}

            {/* Step 2 — About + Experience */}
            {step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* About */}
                <div>
                  <label className="block text-sm text-[#9CA3AF] mb-1.5">
                    About you
                  </label>
                  <textarea
                    value={data.about}
                    onChange={(e) => update({ about: e.target.value })}
                    placeholder="Tell others what you do and what makes you unique..."
                    rows={4}
                    className="w-full rounded-lg px-4 py-2.5 text-white placeholder:text-[#4B5563] outline-none resize-none transition-colors focus:ring-2 focus:ring-[#8478D4]/30"
                    style={{
                      background: "#161222",
                      border: "1px solid rgba(132,120,212,0.1)",
                    }}
                  />
                </div>

                {/* Experience */}
                <div>
                  <label className="block text-sm text-[#9CA3AF] mb-1.5">
                    Years of Experience
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {EXPERIENCE_OPTIONS.map((years) => (
                      <button
                        key={years}
                        type="button"
                        onClick={() => update({ experienceYears: years })}
                        className="px-4 py-2 rounded-lg text-sm transition-all"
                        style={{
                          background:
                            data.experienceYears === years
                              ? "rgba(132,120,212,0.12)"
                              : "#221E30",
                          border:
                            data.experienceYears === years
                              ? "1px solid rgba(132,120,212,0.25)"
                              : "1px solid transparent",
                          color:
                            data.experienceYears === years
                              ? "#8478D4"
                              : "#9CA3AF",
                        }}
                      >
                        {years}+ {years === 1 ? "year" : "years"}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={nextStep}
                  className="w-full py-2.5 rounded-lg font-medium text-white transition-all hover:opacity-90"
                  style={{ background: "#8478D4" }}
                >
                  Continue
                </button>
              </motion.div>
            )}

            {/* Step 3 — Skills + Roles */}
            {step === 3 && (
              <motion.div
                key="step3"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Skills input */}
                <div>
                  <label className="block text-sm text-[#9CA3AF] mb-1.5">
                    Your Skills
                  </label>
                  <div className="relative">
                    <input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSkill(skillInput);
                        }
                      }}
                      type="text"
                      placeholder="Type a skill and press Enter"
                      className="w-full rounded-lg px-4 py-2.5 text-white placeholder:text-[#4B5563] outline-none transition-colors focus:ring-2 focus:ring-[#8478D4]/30"
                      style={{
                        background: "#161222",
                        border: "1px solid rgba(132,120,212,0.1)",
                      }}
                    />
                  </div>

                  {/* Selected skills */}
                  {data.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {data.skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm text-white"
                          style={{
                            background: "rgba(132,120,212,0.15)",
                            border: "1px solid rgba(132,120,212,0.2)",
                          }}
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="text-[#9CA3AF] hover:text-white"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Suggested skills */}
                <div>
                  <label className="block text-sm text-[#4B5563] mb-2">
                    Suggested
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_SKILLS.filter(
                      (s) => !data.skills.includes(s)
                    )
                      .slice(0, 10)
                      .map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => addSkill(skill)}
                          className="px-3 py-1 rounded-full text-xs text-[#9CA3AF] border border-white/[0.06] hover:border-[#8478D4]/30 hover:text-white transition-all"
                          style={{ background: "#221E30" }}
                        >
                          {skill}
                        </button>
                      ))}
                  </div>
                </div>

                {/* Roles */}
                <div>
                  <label className="block text-sm text-[#9CA3AF] mb-1.5">
                    Your Roles
                  </label>
                  <div className="relative mb-3">
                    <input
                      value={roleInput}
                      onChange={(e) => setRoleInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addRole(roleInput);
                        }
                      }}
                      type="text"
                      placeholder="Type a role and press Enter"
                      className="w-full rounded-lg px-4 py-2.5 text-white placeholder:text-[#4B5563] outline-none transition-colors focus:ring-2 focus:ring-[#8478D4]/30"
                      style={{
                        background: "#161222",
                        border: "1px solid rgba(132,120,212,0.1)",
                      }}
                    />
                  </div>
                  {data.roles.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {data.roles.map((role) => (
                        <span
                          key={role}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            color: "#9CA3AF",
                          }}
                        >
                          {role}
                          <button
                            type="button"
                            onClick={() => removeRole(role)}
                            className="text-[#4B5563] hover:text-white"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Include role from step 1 */}
                {data.role && !data.roles.includes(data.role) && (
                  <button
                    type="button"
                    onClick={() => addRole(data.role)}
                    className="text-xs text-[#8478D4] hover:text-[#A098E0] transition-colors"
                  >
                    + Add &ldquo;{data.role}&rdquo; as a role
                  </button>
                )}

                <button
                  onClick={nextStep}
                  className="w-full py-2.5 rounded-lg font-medium text-white transition-all hover:opacity-90"
                  style={{ background: "#8478D4" }}
                >
                  Continue
                </button>
              </motion.div>
            )}

            {/* Step 4 — Preferences */}
            {step === 4 && (
              <motion.div
                key="step4"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Preferred roles */}
                <div>
                  <label className="block text-sm text-[#9CA3AF] mb-1.5">
                    Looking for these roles
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ROLE_OPTIONS.map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() =>
                          update({
                            preferredRoles: data.preferredRoles.includes(
                              role
                            )
                              ? data.preferredRoles.filter(
                                  (r) => r !== role
                                )
                              : [...data.preferredRoles, role],
                          })
                        }
                        className="px-3 py-1.5 rounded-full text-xs transition-all"
                        style={{
                          background: data.preferredRoles.includes(role)
                            ? "rgba(132,120,212,0.12)"
                            : "#221E30",
                          border: data.preferredRoles.includes(role)
                            ? "1px solid rgba(132,120,212,0.25)"
                            : "1px solid transparent",
                          color: data.preferredRoles.includes(role)
                            ? "#8478D4"
                            : "#9CA3AF",
                        }}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preferred skills */}
                <div>
                  <label className="block text-sm text-[#9CA3AF] mb-1.5">
                    Skills you&apos;re looking for
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto">
                    {SUGGESTED_SKILLS.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() =>
                          update({
                            preferredSkills: data.preferredSkills.includes(
                              skill
                            )
                              ? data.preferredSkills.filter(
                                  (s) => s !== skill
                                )
                              : [...data.preferredSkills, skill],
                          })
                        }
                        className="px-3 py-1 rounded-full text-xs transition-all"
                        style={{
                          background: data.preferredSkills.includes(skill)
                            ? "rgba(132,120,212,0.12)"
                            : "#221E30",
                          border: data.preferredSkills.includes(skill)
                            ? "1px solid rgba(132,120,212,0.25)"
                            : "1px solid transparent",
                          color: data.preferredSkills.includes(skill)
                            ? "#8478D4"
                            : "#9CA3AF",
                        }}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preferred experience */}
                <div>
                  <label className="block text-sm text-[#9CA3AF] mb-1.5">
                    Preferred experience level
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {EXPERIENCE_OPTIONS.map((years) => (
                      <button
                        key={years}
                        type="button"
                        onClick={() =>
                          update({ preferredExperience: years })
                        }
                        className="px-4 py-2 rounded-lg text-sm transition-all"
                        style={{
                          background:
                            data.preferredExperience === years
                              ? "rgba(132,120,212,0.12)"
                              : "#221E30",
                          border:
                            data.preferredExperience === years
                              ? "1px solid rgba(132,120,212,0.25)"
                              : "1px solid transparent",
                          color:
                            data.preferredExperience === years
                              ? "#8478D4"
                              : "#9CA3AF",
                        }}
                      >
                        {years}+ {years === 1 ? "year" : "years"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* API error */}
                {apiError && (
                  <div className="text-sm text-[#EF4444] text-center">
                    {apiError}
                  </div>
                )}

                <button
                  onClick={handleComplete}
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-lg font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: "#8478D4" }}
                >
                  {isSubmitting ? "Saving..." : "Complete Profile"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

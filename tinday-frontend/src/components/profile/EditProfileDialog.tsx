"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TagInput } from "./TagInput";
import { useUpdateProfile } from "@/hooks/useUpdateProfile";
import type { Profile, Project, Socials, UpdateProfileRequest } from "@/types";

const SKILL_SUGGESTIONS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "PostgreSQL",
  "Docker",
  "AWS",
  "Figma",
  "Product Design",
  "GraphQL",
];

const ROLE_SUGGESTIONS = [
  "Software Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Product Designer",
  "Product Manager",
  "Data Scientist",
  "Founder",
];

const EXPERIENCE_OPTIONS = [1, 2, 3, 5, 7, 10, 15];

interface EditProfileDialogProps {
  profile: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

const inputStyle = {
  background: "#161222",
  border: "1px solid rgba(132,120,212,0.1)",
};

export function EditProfileDialog({
  profile,
  open,
  onOpenChange,
}: EditProfileDialogProps) {
  const updateProfile = useUpdateProfile();

  const prefs = (profile.preferences ?? {}) as Record<string, unknown>;
  const socials = (profile.socials ?? {}) as Socials;
  const [name, setName] = useState(profile.name ?? "");
  const [location, setLocation] = useState(profile.location ?? "");
  const [phone, setPhone] = useState(socials.phone ?? "");
  const [website, setWebsite] = useState(socials.website ?? "");
  const [linkedin, setLinkedin] = useState(socials.linkedin ?? "");
  const [instagram, setInstagram] = useState(socials.instagram ?? "");
  const [github, setGithub] = useState(socials.github ?? "");
  const [twitter, setTwitter] = useState(socials.twitter ?? "");
  const [about, setAbout] = useState(profile.about ?? "");
  const [experienceYears, setExperienceYears] = useState<number>(
    profile.experience_years ?? 0
  );
  const [skills, setSkills] = useState<string[]>(profile.skills ?? []);
  const [roles, setRoles] = useState<string[]>(profile.roles ?? []);
  const [projects, setProjects] = useState<Project[]>(profile.projects ?? []);
  const [preferredSkills, setPreferredSkills] = useState<string[]>(
    asStringArray(prefs.preferred_skills)
  );
  const [preferredRoles, setPreferredRoles] = useState<string[]>(
    asStringArray(prefs.preferred_roles)
  );
  const [connectNote, setConnectNote] = useState<string>(
    typeof prefs.connect_note === "string" ? (prefs.connect_note as string) : ""
  );

  const updateProject = (index: number, patch: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...patch } : p))
    );
  };

  const addProject = () =>
    setProjects((prev) => [...prev, { title: "", description: "", url: "" }]);

  const removeProject = (index: number) =>
    setProjects((prev) => prev.filter((_, i) => i !== index));

  const handleSave = () => {
    const cleanedProjects = projects.filter(
      (p) => (p.title && p.title.trim()) || (p.description && p.description.trim())
    );

    // Drop the deprecated preferred_experience key when re-saving preferences.
    const { preferred_experience: _omitExp, ...restPrefs } = prefs;
    void _omitExp;

    // Keep only non-empty social links.
    const cleanedSocials = Object.fromEntries(
      Object.entries({
        phone: phone.trim(),
        website: website.trim(),
        linkedin: linkedin.trim(),
        instagram: instagram.trim(),
        github: github.trim(),
        twitter: twitter.trim(),
      }).filter(([, v]) => v !== "")
    ) as Socials;

    const body: UpdateProfileRequest = {
      name: name.trim(),
      location: location.trim(),
      socials: cleanedSocials,
      about: about.trim(),
      experience_years: experienceYears,
      skills,
      roles,
      projects: cleanedProjects,
      preferences: {
        ...restPrefs,
        preferred_skills: preferredSkills,
        preferred_roles: preferredRoles,
        connect_note: connectNote.trim(),
      },
    };

    updateProfile.mutate(body, {
      onSuccess: () => {
        toast.success("Profile updated");
        onOpenChange(false);
      },
      onError: () => toast.error("Could not save your profile. Try again."),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px] max-h-[85vh] overflow-y-auto bg-[#1C1829] border border-[rgba(132,120,212,0.15)]">
        <DialogHeader>
          <DialogTitle className="font-[family-name:var(--font-display)] text-2xl text-white">
            Edit Profile
          </DialogTitle>
          <DialogDescription className="text-[#9CA3AF]">
            Update what others see and who you&apos;re looking to meet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Name */}
          <div>
            <label className="block text-sm text-[#9CA3AF] mb-1.5">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              className="w-full rounded-lg px-4 py-2.5 text-white placeholder:text-[#4B5563] outline-none focus:ring-2 focus:ring-[#8478D4]/30"
              style={inputStyle}
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm text-[#9CA3AF] mb-1.5">Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              type="text"
              placeholder="e.g. Berlin, DE or Remote"
              className="w-full rounded-lg px-4 py-2.5 text-white placeholder:text-[#4B5563] outline-none focus:ring-2 focus:ring-[#8478D4]/30"
              style={inputStyle}
            />
          </div>

          {/* Contact & Links */}
          <div className="space-y-3">
            <label className="block text-sm text-[#9CA3AF]">Contact &amp; Links</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                placeholder="Phone"
                className="w-full rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#4B5563] outline-none focus:ring-2 focus:ring-[#8478D4]/30"
                style={inputStyle}
              />
              <input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                type="url"
                placeholder="Website"
                className="w-full rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#4B5563] outline-none focus:ring-2 focus:ring-[#8478D4]/30"
                style={inputStyle}
              />
              <input
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                type="url"
                placeholder="LinkedIn"
                className="w-full rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#4B5563] outline-none focus:ring-2 focus:ring-[#8478D4]/30"
                style={inputStyle}
              />
              <input
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                type="url"
                placeholder="GitHub"
                className="w-full rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#4B5563] outline-none focus:ring-2 focus:ring-[#8478D4]/30"
                style={inputStyle}
              />
              <input
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                type="text"
                placeholder="Instagram"
                className="w-full rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#4B5563] outline-none focus:ring-2 focus:ring-[#8478D4]/30"
                style={inputStyle}
              />
              <input
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                type="text"
                placeholder="Twitter / X"
                className="w-full rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#4B5563] outline-none focus:ring-2 focus:ring-[#8478D4]/30"
                style={inputStyle}
              />
            </div>
          </div>

          {/* About */}
          <div>
            <label className="block text-sm text-[#9CA3AF] mb-1.5">About</label>
            <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              rows={4}
              placeholder="Tell others what you do and what makes you unique..."
              className="w-full rounded-lg px-4 py-2.5 text-white placeholder:text-[#4B5563] outline-none resize-none focus:ring-2 focus:ring-[#8478D4]/30"
              style={inputStyle}
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
                  onClick={() => setExperienceYears(years)}
                  className="px-4 py-2 rounded-lg text-sm transition-all"
                  style={{
                    background:
                      experienceYears === years
                        ? "rgba(132,120,212,0.12)"
                        : "#221E30",
                    border:
                      experienceYears === years
                        ? "1px solid rgba(132,120,212,0.25)"
                        : "1px solid transparent",
                    color: experienceYears === years ? "#8478D4" : "#9CA3AF",
                  }}
                >
                  {years}+ {years === 1 ? "year" : "years"}
                </button>
              ))}
            </div>
          </div>

          {/* Skills */}
          <TagInput
            label="Skills"
            value={skills}
            onChange={setSkills}
            placeholder="Add a skill and press Enter"
            suggestions={SKILL_SUGGESTIONS}
          />

          {/* Roles */}
          <TagInput
            label="Roles"
            value={roles}
            onChange={setRoles}
            placeholder="Add a role and press Enter"
            variant="muted"
            suggestions={ROLE_SUGGESTIONS}
          />

          {/* Projects */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-[#9CA3AF]">Projects</label>
              <button
                type="button"
                onClick={addProject}
                className="inline-flex items-center gap-1 text-xs text-[#8478D4] hover:text-[#A098E0] transition-colors"
              >
                <Plus size={14} /> Add project
              </button>
            </div>
            <div className="space-y-3">
              {projects.map((project, i) => (
                <div
                  key={i}
                  className="rounded-lg p-3 space-y-2"
                  style={{
                    background: "#161222",
                    border: "1px solid rgba(132,120,212,0.1)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <input
                      value={project.title ?? ""}
                      onChange={(e) =>
                        updateProject(i, { title: e.target.value })
                      }
                      placeholder="Title"
                      className="flex-1 rounded-md px-3 py-2 text-sm text-white placeholder:text-[#4B5563] bg-[#221E30] outline-none focus:ring-2 focus:ring-[#8478D4]/30"
                    />
                    <button
                      type="button"
                      onClick={() => removeProject(i)}
                      className="text-[#9CA3AF] hover:text-[#EF4444] transition-colors"
                      aria-label="Remove project"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <textarea
                    value={project.description ?? ""}
                    onChange={(e) =>
                      updateProject(i, { description: e.target.value })
                    }
                    placeholder="Short description"
                    rows={2}
                    className="w-full rounded-md px-3 py-2 text-sm text-white placeholder:text-[#4B5563] bg-[#221E30] outline-none resize-none focus:ring-2 focus:ring-[#8478D4]/30"
                  />
                  <input
                    value={project.url ?? ""}
                    onChange={(e) => updateProject(i, { url: e.target.value })}
                    placeholder="https://…"
                    className="w-full rounded-md px-3 py-2 text-sm text-white placeholder:text-[#4B5563] bg-[#221E30] outline-none focus:ring-2 focus:ring-[#8478D4]/30"
                  />
                </div>
              ))}
              {projects.length === 0 && (
                <p className="text-xs text-[#4B5563]">No projects yet.</p>
              )}
            </div>
          </div>

          {/* Preferences */}
          <div className="pt-2 border-t border-[rgba(132,120,212,0.08)] space-y-6">
            <p className="text-sm font-medium text-white">Looking For</p>
            <div>
              <label className="block text-sm text-[#9CA3AF] mb-1.5">
                Who do you want to connect with?
              </label>
              <textarea
                value={connectNote}
                onChange={(e) => setConnectNote(e.target.value)}
                rows={3}
                placeholder="Describe who you want to connect with"
                className="w-full rounded-lg px-4 py-2.5 text-white placeholder:text-[#4B5563] outline-none resize-none focus:ring-2 focus:ring-[#8478D4]/30"
                style={inputStyle}
              />
            </div>
            <TagInput
              label="Preferred skills"
              value={preferredSkills}
              onChange={setPreferredSkills}
              placeholder="Add a skill and press Enter"
              suggestions={SKILL_SUGGESTIONS}
            />
            <TagInput
              label="Preferred roles"
              value={preferredRoles}
              onChange={setPreferredRoles}
              placeholder="Add a role and press Enter"
              variant="muted"
              suggestions={ROLE_SUGGESTIONS}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-[#9CA3AF] hover:text-white hover:bg-white/[0.04]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateProfile.isPending || !name.trim()}
            className="bg-[#8478D4] text-white hover:bg-[#9488e0]"
          >
            {updateProfile.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

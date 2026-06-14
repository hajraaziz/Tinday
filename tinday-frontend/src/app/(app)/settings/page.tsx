"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, LogOut } from "lucide-react";
import { toast } from "sonner";
import { apiPost } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import { useUpdateProfile } from "@/hooks/useUpdateProfile";
import { Toggle } from "@/components/settings/Toggle";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const STORAGE_KEY = "tinday-settings";

interface SettingsState {
  allowAIRecommendations: boolean;
  showOnlineStatus: boolean;
  notifyNewMatch: boolean;
  notifyNewMessage: boolean;
  notifyAIRecommendations: boolean;
  notifyProfileViews: boolean;
  reduceMotion: boolean;
}

const DEFAULTS: SettingsState = {
  allowAIRecommendations: true,
  showOnlineStatus: true,
  notifyNewMatch: true,
  notifyNewMessage: true,
  notifyAIRecommendations: false,
  notifyProfileViews: true,
  reduceMotion: false,
};

function SettingRow({
  label,
  description,
  children,
  last,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 px-5 py-4 hover:bg-[rgba(132,120,212,0.03)] transition-colors ${
        last ? "" : "border-b border-white/[0.05]"
      }`}
    >
      <div className="min-w-0">
        <p className="text-sm text-white">{label}</p>
        {description && (
          <p className="text-xs text-[#9CA3AF] mt-0.5">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="mb-6"
    >
      <h2 className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mb-2 px-1">
        {title}
      </h2>
      <div className="rounded-xl overflow-hidden bg-[#1C1829] border border-[rgba(132,120,212,0.1)]">
        {children}
      </div>
    </motion.section>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const logout = useAuthStore((s) => s.logout);

  const [settings, setSettings] = useState<SettingsState>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const {
    isSupported: pushSupported,
    isSubscribed: pushSubscribed,
    isBusy: pushBusy,
    subscribe: subscribePush,
    unsubscribe: unsubscribePush,
  } = usePushSubscription();

  // "Open to connect" is server-backed (it gates the Explore feed), unlike the
  // localStorage toggles above. Source of truth is profile.preferences; absence
  // means ON. Local optimistic state flips the switch instantly, then reconciles
  // when useUpdateProfile refreshes the store.
  const updateProfile = useUpdateProfile();
  const prefs = (profile?.preferences ?? {}) as Record<string, unknown>;
  const [openToConnect, setOpenToConnect] = useState(
    prefs.open_to_connect !== false,
  );

  // Resync if the profile lands in the store after mount (initializer runs once).
  // Skip while a write is in flight so we don't clobber the optimistic value.
  const persistedOpenToConnect = prefs.open_to_connect !== false;
  useEffect(() => {
    if (!updateProfile.isPending) setOpenToConnect(persistedOpenToConnect);
  }, [persistedOpenToConnect, updateProfile.isPending]);

  const handleOpenToConnectChange = (next: boolean) => {
    setOpenToConnect(next);
    updateProfile.mutate(
      { preferences: { ...prefs, open_to_connect: next } },
      {
        onError: () => {
          setOpenToConnect(!next);
          toast.error("Couldn't update — try again.");
        },
      },
    );
  };

  const handlePushToggle = async (next: boolean) => {
    if (next) {
      const ok = await subscribePush();
      toast[ok ? "success" : "error"](
        ok
          ? "Push notifications enabled"
          : "Couldn't enable push — permission was blocked."
      );
    } else {
      await unsubscribePush();
      toast.success("Push notifications disabled");
    }
  };

  // Load persisted toggles on mount (client-only to avoid SSR mismatch).
  // Deferred to a microtask so we don't setState synchronously in the effect
  // body; the loader gate below covers the one-frame gap.
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) setSettings({ ...DEFAULTS, ...JSON.parse(raw) });
      } catch {
        // ignore corrupt storage
      }
      setHydrated(true);
    });
  }, []);

  const set = (key: keyof SettingsState) => (value: boolean) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await apiPost("/api/auth/logout");
    } catch {
      // logout should proceed even if the server call fails
    }
    logout();
  };

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 rounded-full border-2 border-[rgba(132,120,212,0.2)] border-t-[#8478D4] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-full">
      {/* Back nav */}
      <div className="h-11 flex items-center px-4 sticky top-0 z-10 bg-[#151515]/90 backdrop-blur-sm">
        <button
          onClick={() => router.push("/profile")}
          className="inline-flex items-center gap-1.5 text-sm text-[#9CA3AF] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Profile
        </button>
      </div>

      <div className="max-w-xl mx-auto px-4 py-4">
        {/* Account */}
        <Section title="Account">
          <SettingRow label="Connected Accounts" description="Display only">
            <span className="text-xs text-[#4B5563]">Google · GitHub · Apple</span>
          </SettingRow>
          <SettingRow label="Email">
            <span className="text-sm text-[#9CA3AF] truncate max-w-[200px]">
              {user?.email ?? "—"}
            </span>
          </SettingRow>
          <SettingRow label="Username" last>
            <span className="text-sm text-[#9CA3AF] truncate max-w-[200px]">
              {profile?.name ?? "—"}
            </span>
          </SettingRow>
        </Section>

        {/* Privacy */}
        <Section title="Privacy">
          <SettingRow
            label="Open to connect"
            description="When on, your profile card appears in other people's Explore feed. Turn it off to stay hidden from new people."
          >
            <Toggle
              ariaLabel="Open to connect"
              checked={openToConnect}
              disabled={updateProfile.isPending}
              onChange={handleOpenToConnectChange}
            />
          </SettingRow>
          <SettingRow label="Who can see my profile" description="Everyone">
            <Lock className="w-4 h-4 text-[#4B5563]" />
          </SettingRow>
          <SettingRow label="Allow AI recommendations">
            <Toggle
              ariaLabel="Allow AI recommendations"
              checked={settings.allowAIRecommendations}
              onChange={set("allowAIRecommendations")}
            />
          </SettingRow>
          <SettingRow label="Show online status" last>
            <Toggle
              ariaLabel="Show online status"
              checked={settings.showOnlineStatus}
              onChange={set("showOnlineStatus")}
            />
          </SettingRow>
        </Section>

        {/* Notifications */}
        <Section title="Notifications">
          <SettingRow
            label="Browser push notifications"
            description={
              pushSupported
                ? "Get OS banners when the app is in the background"
                : "Not supported in this browser"
            }
          >
            <Toggle
              ariaLabel="Browser push notifications"
              checked={pushSubscribed}
              disabled={!pushSupported || pushBusy}
              onChange={handlePushToggle}
            />
          </SettingRow>
          <SettingRow label="New match">
            <Toggle
              ariaLabel="New match notifications"
              checked={settings.notifyNewMatch}
              onChange={set("notifyNewMatch")}
            />
          </SettingRow>
          <SettingRow label="New message">
            <Toggle
              ariaLabel="New message notifications"
              checked={settings.notifyNewMessage}
              onChange={set("notifyNewMessage")}
            />
          </SettingRow>
          <SettingRow label="AI recommendations">
            <Toggle
              ariaLabel="AI recommendation notifications"
              checked={settings.notifyAIRecommendations}
              onChange={set("notifyAIRecommendations")}
            />
          </SettingRow>
          <SettingRow label="Profile views" last>
            <Toggle
              ariaLabel="Profile view notifications"
              checked={settings.notifyProfileViews}
              onChange={set("notifyProfileViews")}
            />
          </SettingRow>
        </Section>

        {/* Appearance */}
        <Section title="Appearance">
          <SettingRow label="Theme" description="Dark">
            <span
              className="inline-flex items-center gap-1.5 text-xs text-[#4B5563]"
              title="Dark mode always on"
            >
              <Lock className="w-3.5 h-3.5" />
              Dark
            </span>
          </SettingRow>
          <SettingRow label="Reduce motion" last>
            <Toggle
              ariaLabel="Reduce motion"
              checked={settings.reduceMotion}
              onChange={set("reduceMotion")}
            />
          </SettingRow>
        </Section>

        {/* Danger Zone */}
        <Section title="Danger Zone">
          <button
            onClick={() => setDeleteOpen(true)}
            className="w-full flex items-center justify-between px-5 py-4 text-left bg-[rgba(239,68,68,0.05)] hover:bg-[rgba(239,68,68,0.1)] transition-colors"
          >
            <span className="text-sm text-[#EF4444]">Delete Account</span>
            <span className="text-xs text-[#EF4444]/70">Permanent</span>
          </button>
        </Section>

        {/* Logout */}
        <Button
          onClick={handleLogout}
          disabled={loggingOut}
          variant="outline"
          className="w-full border-[rgba(239,68,68,0.3)] bg-transparent text-[#EF4444] hover:bg-[rgba(239,68,68,0.08)] hover:text-[#EF4444]"
        >
          <LogOut className="w-4 h-4" />
          {loggingOut ? "Logging out…" : "Log Out"}
        </Button>

        <p className="text-center text-xs text-[#4B5563] mt-6">
          Tinday v1.0.0 · Made with ❤️
        </p>
      </div>

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md bg-[#1C1829] border border-[rgba(239,68,68,0.2)]">
          <DialogHeader>
            <DialogTitle className="text-white">Delete your account?</DialogTitle>
            <DialogDescription className="text-[#9CA3AF]">
              This permanently removes your profile, matches, and messages. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => setDeleteOpen(false)}
              className="text-[#9CA3AF] hover:text-white hover:bg-white/[0.04]"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setDeleteOpen(false);
                toast("Account deletion isn't available yet.");
              }}
            >
              Delete Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

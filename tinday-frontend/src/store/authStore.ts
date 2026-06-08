/* eslint-disable @typescript-eslint/no-require-imports */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { User, Profile, Session } from "@/types";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  access_token: string | null;
  refresh_token: string | null;
  isAuthenticated: boolean;
  // True once the persisted state has been rehydrated from localStorage.
  // Guards must wait for this before redirecting, otherwise the first render
  // (default state, isAuthenticated=false) kicks authenticated users to /login.
  hasHydrated: boolean;
  setAuth: (payload: { user: User; session: Session }) => void;
  setProfile: (profile: Profile) => void;
  setHasHydrated: (value: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      access_token: null,
      refresh_token: null,
      isAuthenticated: false,
      hasHydrated: false,

      setAuth: ({ user, session }) =>
        set({
          user,
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          isAuthenticated: true,
        }),

      setProfile: (profile) => set({ profile }),

      setHasHydrated: (value) => set({ hasHydrated: value }),

      logout: () => {
        set({
          user: null,
          profile: null,
          access_token: null,
          refresh_token: null,
          isAuthenticated: false,
        });

        // Lazy imports to avoid circular deps
        const { supabase } =
          require("@/lib/supabase") as typeof import("@/lib/supabase");
        supabase.auth.signOut();

        const { disconnectSocket } =
          require("@/lib/socket") as typeof import("@/lib/socket");
        disconnectSocket();

        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      },
    }),
    {
      name: "tinday-auth",
      storage: createJSONStorage(() => localStorage),
      // hasHydrated is runtime-only — never persist it.
      partialize: ({ user, profile, access_token, refresh_token, isAuthenticated }) => ({
        user,
        profile,
        access_token,
        refresh_token,
        isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

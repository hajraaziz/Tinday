/* eslint-disable @typescript-eslint/no-require-imports */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Profile, Session } from "@/types";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  access_token: string | null;
  refresh_token: string | null;
  isAuthenticated: boolean;
  setAuth: (payload: { user: User; session: Session }) => void;
  setProfile: (profile: Profile) => void;
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

      setAuth: ({ user, session }) =>
        set({
          user,
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          isAuthenticated: true,
        }),

      setProfile: (profile) => set({ profile }),

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
      storage: {
        getItem: (key) => {
          const item = localStorage.getItem(key);
          return item ? JSON.parse(item) : null;
        },
        setItem: (key, value) =>
          localStorage.setItem(key, JSON.stringify(value)),
        removeItem: (key) => localStorage.removeItem(key),
      },
    }
  )
);

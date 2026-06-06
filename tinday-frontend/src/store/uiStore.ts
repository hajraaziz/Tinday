import { create } from "zustand";
import type { SwipeResponse } from "@/types";

interface UIState {
  notificationPanelOpen: boolean;
  matchOverlayData: NonNullable<SwipeResponse["match"]> | null;
  activeConversationId: string | null;
  setNotificationPanel: (open: boolean) => void;
  showMatchOverlay: (match: NonNullable<SwipeResponse["match"]>) => void;
  closeMatchOverlay: () => void;
  setActiveConversation: (id: string | null) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  notificationPanelOpen: false,
  matchOverlayData: null,
  activeConversationId: null,

  setNotificationPanel: (open) => set({ notificationPanelOpen: open }),
  showMatchOverlay: (match) => set({ matchOverlayData: match }),
  closeMatchOverlay: () => set({ matchOverlayData: null }),
  setActiveConversation: (id) => set({ activeConversationId: id }),
}));

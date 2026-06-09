import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AIConversation, AIMessage } from "@/types";

interface AIState {
  conversations: AIConversation[];
  messages: Record<string, AIMessage[]>;
  hasHydrated: boolean;

  createConversation: () => string;
  ensureConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  appendMessage: (id: string, message: AIMessage) => void;
  touchConversation: (
    id: string,
    meta: { title?: string; last_message?: string }
  ) => void;
  setHasHydrated: (value: boolean) => void;
}

const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;

export const useAIStore = create<AIState>()(
  persist(
    (set) => ({
      conversations: [],
      messages: {},
      hasHydrated: false,

      createConversation: () => {
        const id = newId();
        const conversation: AIConversation = {
          id,
          title: "New chat",
          last_message: "",
          updated_at: new Date().toISOString(),
        };
        set((s) => ({
          conversations: [conversation, ...s.conversations],
          messages: { ...s.messages, [id]: [] },
        }));
        return id;
      },

      ensureConversation: (id) =>
        set((s) => {
          if (s.conversations.some((c) => c.id === id)) return s;
          return {
            conversations: [
              {
                id,
                title: "New chat",
                last_message: "",
                updated_at: new Date().toISOString(),
              },
              ...s.conversations,
            ],
            messages: { ...s.messages, [id]: s.messages[id] ?? [] },
          };
        }),

      deleteConversation: (id) =>
        set((s) => {
          const messages = { ...s.messages };
          delete messages[id];
          return {
            conversations: s.conversations.filter((c) => c.id !== id),
            messages,
          };
        }),

      appendMessage: (id, message) =>
        set((s) => ({
          messages: {
            ...s.messages,
            [id]: [...(s.messages[id] ?? []), message],
          },
        })),

      touchConversation: (id, meta) =>
        set((s) => ({
          conversations: s.conversations
            .map((c) =>
              c.id === id
                ? {
                    ...c,
                    title:
                      meta.title && c.title === "New chat" ? meta.title : c.title,
                    last_message: meta.last_message ?? c.last_message,
                    updated_at: new Date().toISOString(),
                  }
                : c
            )
            .sort((a, b) => b.updated_at.localeCompare(a.updated_at)),
        })),

      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "tinday-ai",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ conversations, messages }) => ({
        conversations,
        messages,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

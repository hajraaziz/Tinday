import { useAIStore } from "@/store/aiStore";

// Thin selector over the persisted AI store for the conversation-list view.
export function useAIConversations() {
  const conversations = useAIStore((s) => s.conversations);
  const hasHydrated = useAIStore((s) => s.hasHydrated);
  const createConversation = useAIStore((s) => s.createConversation);
  const deleteConversation = useAIStore((s) => s.deleteConversation);

  return { conversations, hasHydrated, createConversation, deleteConversation };
}

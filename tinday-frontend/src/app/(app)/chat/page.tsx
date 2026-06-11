"use client";

import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { useAIConversations } from "@/hooks/useAIConversations";
import { useAuthStore } from "@/store/authStore";
import { AIOrb } from "@/components/ai/AIOrb";

export default function ChatPage() {
  const router = useRouter();
  const { createConversation } = useAIConversations();
  const firstName = useAuthStore((s) => s.profile?.name?.split(" ")[0]);

  const startNewChat = () => {
    const id = createConversation();
    router.push(`/chat/${id}`);
  };

  // Right-pane placeholder shown on desktop when no chat is open. On mobile the
  // sidebar fills the screen at /chat, so this stays hidden (see layout).
  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 px-6 text-center">
      <AIOrb size={72} />
      <div>
        <h2 className="text-2xl font-semibold text-white font-[family-name:var(--font-display)]">
          {firstName ? `Hey, ${firstName}. Ready to dive in?` : "Ready to dive in?"}
        </h2>
        <p className="text-sm text-[#9CA3AF] mt-2 max-w-sm">
          Ask for intros, draft messages, or get advice on who to connect with.
        </p>
      </div>
      <button
        onClick={startNewChat}
        className="inline-flex items-center gap-1.5 rounded-full bg-[#8478D4] text-white text-sm font-medium px-5 py-2.5 hover:bg-[#9488e0] transition-colors"
      >
        <Sparkles className="w-4 h-4" />
        New chat
      </button>
    </div>
  );
}

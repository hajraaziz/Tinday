"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import { AIChatSidebar } from "@/components/ai/AIChatSidebar";
import { cn } from "@/lib/utils";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // `null` at /chat (list view), the chatId when a conversation is open. On
  // mobile we show one pane at a time; on desktop the sidebar is always present.
  const activeChatId = useSelectedLayoutSegment();
  const isChatOpen = activeChatId !== null;

  return (
    <div className="h-full flex">
      <aside
        className={cn(
          "h-full w-full md:w-[360px] md:shrink-0 md:border-r md:border-[rgba(132,120,212,0.08)]",
          isChatOpen ? "hidden md:block" : "block"
        )}
      >
        <AIChatSidebar activeChatId={activeChatId} />
      </aside>

      <section
        className={cn(
          "h-full flex-1 min-w-0",
          isChatOpen ? "block" : "hidden md:block"
        )}
      >
        {children}
      </section>
    </div>
  );
}

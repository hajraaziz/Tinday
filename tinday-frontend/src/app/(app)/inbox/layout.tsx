"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import { ChatSidebar } from "@/components/inbox/ChatSidebar";
import { cn } from "@/lib/utils";

export default function InboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The child segment is `null` at /inbox (list view) and the matchId when a
  // thread is open. On mobile we show one pane at a time; on desktop both.
  const activeMatchId = useSelectedLayoutSegment();
  const isThreadOpen = activeMatchId !== null;

  return (
    <div className="h-full flex">
      <aside
        className={cn(
          "h-full w-full md:w-[360px] md:shrink-0 md:border-r md:border-[rgba(132,120,212,0.08)]",
          isThreadOpen ? "hidden md:block" : "block"
        )}
      >
        <ChatSidebar activeMatchId={activeMatchId} />
      </aside>

      <section
        className={cn(
          "h-full flex-1 min-w-0",
          isThreadOpen ? "block" : "hidden md:block"
        )}
      >
        {children}
      </section>
    </div>
  );
}

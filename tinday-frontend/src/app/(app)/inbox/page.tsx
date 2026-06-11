import { MessageCircle } from "lucide-react";

export default function InboxPage() {
  // Right-pane placeholder shown on desktop when no thread is open. On mobile
  // the sidebar fills the screen at /inbox, so this stays hidden (see layout).
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="w-20 h-20 rounded-full border-2 border-[rgba(132,120,212,0.25)] flex items-center justify-center">
        <MessageCircle className="w-9 h-9 text-[#8478D4]" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-white">Your messages</h2>
        <p className="text-sm text-[#9CA3AF] mt-1 max-w-xs">
          Select a conversation to start chatting.
        </p>
      </div>
    </div>
  );
}

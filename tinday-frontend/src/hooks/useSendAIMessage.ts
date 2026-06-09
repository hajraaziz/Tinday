import { useCallback, useRef, useState } from "react";
import { useAIStore } from "@/store/aiStore";
import { useAuthStore } from "@/store/authStore";
import type { AIMessage } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;

// Streams an AI reply for one conversation. The user message is persisted to the
// store immediately; the assistant reply streams into local `liveText` (so we
// don't write localStorage on every token) and is committed to the store once
// complete. SSE is read straight off the fetch body — the route streams
// `data: <text>\n\n` chunks from FastAPI with no [DONE] terminator.
export function useSendAIMessage(conversationId: string) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [liveText, setLiveText] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (text: string, sharedProfile?: AIMessage["sharedProfile"]) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      const store = useAIStore.getState();
      store.ensureConversation(conversationId);

      // History BEFORE this turn, mapped to the API's {role, content} shape.
      const history = (store.messages[conversationId] ?? []).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      store.appendMessage(conversationId, {
        id: newId(),
        role: "user",
        content: trimmed,
        sharedProfile,
      });
      store.touchConversation(conversationId, {
        title: trimmed.slice(0, 40),
        last_message: trimmed,
      });

      setIsStreaming(true);
      setLiveText("");
      const controller = new AbortController();
      abortRef.current = controller;

      let acc = "";
      try {
        const token = useAuthStore.getState().access_token;
        const res = await fetch(`${API_URL}/api/ai/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            message: trimmed,
            conversation_history: history,
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error(`Chat request failed (${res.status})`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let sep;
          while ((sep = buffer.indexOf("\n\n")) !== -1) {
            const raw = buffer.slice(0, sep);
            buffer = buffer.slice(sep + 2);
            const chunk = raw.startsWith("data: ")
              ? raw.slice(6)
              : raw.startsWith("data:")
                ? raw.slice(5)
                : "";
            if (chunk) {
              acc += chunk;
              setLiveText(acc);
            }
          }
        }
      } catch {
        if (!controller.signal.aborted) {
          acc =
            acc ||
            "Sorry — I couldn't reach the assistant. Please try again.";
        }
      } finally {
        const finalText = acc.trim();
        if (finalText) {
          useAIStore.getState().appendMessage(conversationId, {
            id: newId(),
            role: "model",
            content: finalText,
          });
          useAIStore.getState().touchConversation(conversationId, {
            last_message: finalText.slice(0, 80),
          });
        }
        setIsStreaming(false);
        setLiveText("");
        abortRef.current = null;
      }
    },
    [conversationId, isStreaming]
  );

  return { send, isStreaming, liveText };
}

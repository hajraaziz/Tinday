import { useCallback, useRef, useState } from "react";
import { useAIStore } from "@/store/aiStore";
import { useAuthStore } from "@/store/authStore";
import type { AIMessage } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;

// Base64-encode a File in chunks — a single btoa(String.fromCharCode(...bytes))
// overflows the call stack on large buffers.
async function fileToBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

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
    async (text: string, files?: File[]) => {
      const trimmed = text.trim();
      const fileList = files ?? [];
      if ((!trimmed && fileList.length === 0) || isStreaming) return;

      const store = useAIStore.getState();
      store.ensureConversation(conversationId);

      // History BEFORE this turn, mapped to the API's {role, content} shape.
      // History stays text-only — files from prior turns are never re-sent.
      const history = (store.messages[conversationId] ?? []).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Store only a lightweight descriptor + an ephemeral object URL — never the
      // base64 bytes (which would blow the localStorage quota).
      const attachments: AIMessage["attachments"] = fileList.map((f) => ({
        name: f.name,
        mime_type: f.type,
        url: URL.createObjectURL(f),
      }));

      const previewText = trimmed || (fileList.length ? `📎 ${fileList[0].name}` : "");

      store.appendMessage(conversationId, {
        id: newId(),
        role: "user",
        content: trimmed,
        attachments: attachments.length ? attachments : undefined,
      });
      store.touchConversation(conversationId, {
        title: previewText.slice(0, 40),
        last_message: previewText,
      });

      // Encode the current turn's files for the request body.
      const encodedFiles = await Promise.all(
        fileList.map(async (f) => ({
          name: f.name,
          mime_type: f.type,
          data_base64: await fileToBase64(f),
        }))
      );

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
            files: encodedFiles,
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
            const payload = raw.startsWith("data: ")
              ? raw.slice(6)
              : raw.startsWith("data:")
                ? raw.slice(5)
                : "";
            // Each chunk is JSON-encoded server-side so its newlines survive the
            // "\n\n" SSE framing — decode back to the original text (incl. markdown
            // line breaks). Skip anything that isn't valid JSON.
            if (payload) {
              let chunk = "";
              try {
                chunk = JSON.parse(payload);
              } catch {
                continue;
              }
              if (chunk) {
                acc += chunk;
                setLiveText(acc);
              }
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

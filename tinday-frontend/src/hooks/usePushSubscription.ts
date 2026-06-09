import { useCallback, useEffect, useState } from "react";
import { apiPost } from "@/lib/api";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

// Convert the base64url VAPID key into the Uint8Array the Push API expects.
// Backed by an explicit ArrayBuffer so the type satisfies BufferSource.
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

// Manages this browser's Web Push subscription. Permission is requested lazily
// (only when subscribe() is called), so nothing prompts on page load.
// iOS Safari only supports push from an installed PWA — feature detection here
// degrades gracefully and the app still gets in-app notifications via long poll.
export function usePushSubscription() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (!pushSupported() || !VAPID_PUBLIC_KEY) return;
    let cancelled = false;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (cancelled) return;
        setIsSupported(true);
        setIsSubscribed(!!sub);
      })
      .catch(() => {
        if (!cancelled) setIsSupported(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!pushSupported() || !VAPID_PUBLIC_KEY) return false;
    setIsBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();

      if (!sub) {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return false;
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      await apiPost("/api/notifications/push/subscribe", sub.toJSON());
      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error("Push subscribe failed:", err);
      return false;
    } finally {
      setIsBusy(false);
    }
  }, []);

  const unsubscribe = useCallback(async (): Promise<void> => {
    if (!pushSupported()) return;
    setIsBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await apiPost("/api/notifications/push/unsubscribe", {
          endpoint: sub.endpoint,
        }).catch(() => {});
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
    } catch (err) {
      console.error("Push unsubscribe failed:", err);
    } finally {
      setIsBusy(false);
    }
  }, []);

  return { isSupported, isSubscribed, isBusy, subscribe, unsubscribe };
}

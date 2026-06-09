"use client";

import { useEffect } from "react";

// Registers the push/notification service worker once on the client.
// Push subscription itself is requested lazily elsewhere (usePushSubscription)
// so we never prompt for permission on first load.
export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Service worker registration failed:", err);
    });
  }, []);

  return null;
}

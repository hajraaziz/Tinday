// Tinday service worker — Web Push display + click routing.
// Registered by RegisterServiceWorker; receives pushes sent from the Express
// notifications service.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function routeFor(data) {
  // One-way connect notifications carry the swiper's id and no matchId yet.
  if (data && data.giverId) return `/explore?connect=${data.giverId}`;
  if (data && data.matchId) return `/inbox/${data.matchId}`;
  return "/";
}

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "Tinday", body: event.data ? event.data.text() : "" };
  }

  const data = payload.data || {};
  // Collapse repeated notifications from the same conversation/match/swiper.
  const tag = data.matchId
    ? `match:${data.matchId}`
    : data.giverId
      ? `connect:${data.giverId}`
      : payload.type || "tinday";

  event.waitUntil(
    self.registration.showNotification(payload.title || "Tinday", {
      body: payload.body || "",
      tag,
      data: { ...data, url: routeFor(data) },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // Focus an existing tab and navigate it if possible.
        for (const client of clients) {
          if ("focus" in client) {
            client.focus();
            if ("navigate" in client) client.navigate(url);
            return;
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(url);
      })
  );
});

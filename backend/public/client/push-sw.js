self.addEventListener("push", (event) => {
  const payload = readPayload(event);
  const title = payload.title || "SCINetwork Alert";
  const options = {
    body: payload.body || payload.message || "Alert baru tersedia.",
    icon: payload.icon || "/logo.png",
    badge: payload.badge || "/logo.png",
    tag: payload.tag || "scinetwork-alert",
    requireInteraction: Boolean(payload.requireInteraction),
    data: {
      url: payload.url || "/dashboard/alerts",
      alertId: payload.alert?.id,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetURL = new URL(event.notification.data?.url || "/dashboard/alerts", self.location.origin);

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        const clientURL = new URL(client.url);
        if (clientURL.origin === targetURL.origin) {
          client.focus();
          return client.navigate(targetURL.href);
        }
      }
      return self.clients.openWindow(targetURL.href);
    }),
  );
});

function readPayload(event) {
  if (!event.data) return {};
  try {
    return event.data.json();
  } catch {
    return { body: event.data.text() };
  }
}

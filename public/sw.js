// CareConnect Service Worker for Background Alarms & Local Notifications
const CACHE_NAME = "careconnect-alarm-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming messages from applet (e.g. trigger background notification)
self.addEventListener("message", (event) => {
  if (!event.data) return;

  if (event.data.type === "TRIGGER_NOTIFICATION") {
    const { title, options } = event.data.payload;
    self.registration.showNotification(title, {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      requireInteraction: true,
      vibrate: [500, 200, 500, 200, 500, 200, 800],
      ...options,
    });
  }
});

// Handle notification click and action buttons
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const action = event.action;
  const alarmData = event.notification.data || {};

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Focus open client or open new window
      for (const client of clientList) {
        if (client.url && "focus" in client) {
          client.postMessage({
            type: "NOTIFICATION_ACTION_CLICKED",
            action: action,
            alarm: alarmData,
          });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow("/");
      }
    })
  );
});

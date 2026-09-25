import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

// Push notifications (moved from the former worker/index.js)
type PushPayload = { title?: string; body?: string; icon?: string };

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload: PushPayload = {
    title: "Notification",
    body: "You have a new message.",
    icon: "/icon-192x192.png",
  };

  try {
    payload = JSON.parse(event.data.text());
  } catch {
    // Keep fallback values when payload cannot be parsed.
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || "Notification", {
      body: payload.body || "",
      icon: payload.icon || "/icon-192x192.png",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) return client.focus();
        }

        return self.clients.openWindow("/");
      }),
  );
});

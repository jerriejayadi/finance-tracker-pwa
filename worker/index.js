self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload = {
    title: 'Notification',
    body: 'You have a new message.',
    icon: '/icon-192x192.png',
  };

  try {
    payload = JSON.parse(event.data.text());
  } catch {
    // Keep fallback values when payload cannot be parsed.
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'Notification', {
      body: payload.body || '',
      icon: payload.icon || '/icon-192x192.png',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) return client.focus();
        }

        if (clients.openWindow) {
          return clients.openWindow('/');
        }

        return undefined;
      })
  );
});

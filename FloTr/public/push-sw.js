// Web Push handling, imported into the generated service worker via workbox.importScripts
// (see vite.config.ts) — generateSW mode does not allow inline custom SW code otherwise.

self.addEventListener('push', (event) => {
  if (!event.data) return
  const data = event.data.json()

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.message,
      icon: 'icons/pwa-192.png',
      badge: 'icons/pwa-192.png',
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) return client.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow('./')
    })
  )
})

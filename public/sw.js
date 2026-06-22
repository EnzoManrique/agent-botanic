self.addEventListener('push', function (event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body,
        icon: data.icon || '/icon.svg',
        badge: data.badge || '/icon.svg',
        data: {
          url: data.url || '/'
        },
        // Alertas de sonido y vibración por defecto para mejorar la UX
        vibrate: [100, 50, 100],
        actions: data.actions || []
      };

      event.waitUntil(
        self.registration.showNotification(data.title || 'Secretary Botanic', options)
      );
    } catch (e) {
      console.error('Error parsing push data:', e);
      // Fallback si el payload no es JSON válido
      event.waitUntil(
        self.registration.showNotification('Secretary Botanic', {
          body: event.data.text(),
          icon: '/icon.svg',
          badge: '/icon.svg'
        })
      );
    }
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const urlToOpen = new URL(event.notification.data?.url || '/', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // Buscar si ya hay una pestaña abierta con nuestra app y enfocarla
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no hay pestaña abierta, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

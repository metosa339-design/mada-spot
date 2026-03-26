// Mada Spot — Service Worker v3
const CACHE_NAME = 'mada-spot-v3';
const STATIC_CACHE = 'mada-spot-static-v3';
const EVENT_BANNER_CACHE = 'mada-spot-event-banners-v1';

// Static assets to precache
const PRECACHE_URLS = [
  '/',
  '/offline',
  '/manifest.json',
  '/logo.png',
  '/icons/icon.svg',
];

// Install: precache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  const keepCaches = [CACHE_NAME, STATIC_CACHE, EVENT_BANNER_CACHE];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !keepCaches.includes(key))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Cache event banner API responses for offline viewing
  if (url.pathname === '/api/events' && url.searchParams.get('pinned') === 'true') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(EVENT_BANNER_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Skip API routes, admin, and auth
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/admin') ||
    url.pathname.startsWith('/_next/webpack')
  ) {
    return;
  }

  // Cache external event banner images (Unsplash, Pexels, etc.)
  const imageHosts = ['images.unsplash.com', 'images.pexels.com', 'cdn.pixabay.com'];
  if (imageHosts.some((host) => url.hostname === host)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(EVENT_BANNER_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => cached);
      })
    );
    return;
  }

  // Static assets (JS, CSS, images, fonts): cache-first
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|webp|avif|svg|woff2?|ico)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // HTML pages: network-first with cache fallback
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/offline')))
    );
    return;
  }
});

// ============================================
// Push notification handler
// ============================================
self.addEventListener('push', (event) => {
  let data = { title: 'Mada Spot', body: 'Nouvelle notification', url: '/' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (e) {
    // Fallback to defaults if parsing fails
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: data.tag || 'mada-spot-notification',
      data: { url: data.url || '/' },
    }).then(() => {
      // Notify open tabs to refresh notifications instantly
      try {
        const bc = new BroadcastChannel('mada-notifications');
        bc.postMessage({ type: 'new-notification', data });
        bc.close();
      } catch (e) {
        // BroadcastChannel not supported
      }

      // Also broadcast on messages channel for instant chat delivery
      if (data.tag === 'message_new') {
        try {
          const mc = new BroadcastChannel('mada-messages');
          mc.postMessage({ type: 'new-message', data });
          mc.close();
        } catch (e) {
          // BroadcastChannel not supported
        }
      }
    })
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if (client.navigate) client.navigate(url);
          return;
        }
      }
      return clients.openWindow(url);
    })
  );
});

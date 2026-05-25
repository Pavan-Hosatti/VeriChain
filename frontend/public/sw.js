const CACHE_NAME = 'rapidauth-shell-v1';
const OFFLINE_URLS = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Simple caching strategy:
// - revocation snapshot => network-first, then cache
// - navigation requests => cache-first (serve app shell)
// - other GET requests => cache-first then network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Handle revocation snapshot specially
  if (url.pathname.startsWith('/api/v1/revocations')) {
    event.respondWith(
      fetch(request)
        .then((resp) => {
          // store snapshot in cache for offline use
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return resp;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Navigation (app shell)
  if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      caches.match('/index.html').then((cached) => cached || fetch(request))
    );
    return;
  }

  // Default: try cache, then network
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((resp) => {
      // cache static GET responses for future
      if (resp && resp.ok) {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return resp;
    }).catch(() => cached))
  );
});

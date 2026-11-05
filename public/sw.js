const CACHE_VERSION = 'splitmate-v1.0.0';
const STATIC_CACHE = `splitmate-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `splitmate-runtime-${CACHE_VERSION}`;

// Precache essential app shell assets
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Install: Cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up older cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('splitmate-') && name !== STATIC_CACHE && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Skip non-GET requests (e.g. POST / PUT / DELETE)
  if (request.method !== 'GET') {
    return;
  }

  // 2. NETWORK-FIRST for API & Supabase: Never serve stale financial data from cache
  if (url.pathname.startsWith('/api') || url.hostname.includes('supabase.co')) {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request);
      })
    );
    return;
  }

  // 3. CACHE-FIRST for Static Assets (Scripts, Styles, Fonts, Images)
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Fetch updated version in background (Stale-While-Revalidate)
          fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, networkResponse));
            }
          }).catch(() => {});
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, responseToCache));
          return networkResponse;
        });
      })
    );
    return;
  }

  // 4. NAVIGATION REQUESTS (HTML Pages): Try network, fallback to cache, then offline.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request).then((cached) => {
          return cached || caches.match('/offline.html');
        });
      })
    );
    return;
  }

  // Default network with cache fallback
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
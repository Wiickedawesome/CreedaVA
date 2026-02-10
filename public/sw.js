// Optimized service worker for caching static assets
const CACHE_VERSION = 'v5';
const CACHE_NAME = `creedava-${CACHE_VERSION}`;
const RUNTIME_CACHE = `creedava-runtime-${CACHE_VERSION}`;

// Assets to cache immediately
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg?v=4',
];

// Cache strategies for different asset types
const CACHE_STRATEGIES = {
  static: ['css', 'js', 'woff2', 'woff', 'ttf', 'eot'],
  images: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'],
  api: ['/api/']
};

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Navigation requests (HTML pages) use network-first strategy
  // to ensure users always get the latest deployment
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the fresh HTML for offline fallback
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Offline: fall back to cached HTML
          return caches.match(event.request).then((cached) => {
            return cached || caches.match('/');
          });
        })
    );
    return;
  }

  // Static assets (JS, CSS, images, fonts) use cache-first strategy
  // Vite hashes filenames, so cached versions are always valid
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        if (
          event.request.url.match(/\.(js|css|webp|png|jpg|jpeg|svg|woff|woff2)$/) ||
          event.request.url.includes('/assets/')
        ) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }

        return response;
      });
    })
  );
});

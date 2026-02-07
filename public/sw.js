// Optimized service worker for mobile-first caching
const CACHE_VERSION = 'v5';
const CACHE_NAME = `creedava-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `creedava-runtime-${CACHE_VERSION}`;
const IMAGE_CACHE = `creedava-images-${CACHE_VERSION}`;
const API_CACHE = `creedava-api-${CACHE_VERSION}`;

// Maximum cache sizes (important for mobile devices with limited storage)
const MAX_CACHE_SIZE = {
  static: 50,     // 50 static assets
  runtime: 30,    // 30 runtime requests
  images: 60,     // 60 images
  api: 20         // 20 API responses
};

// Cache duration in milliseconds
const CACHE_DURATION = {
  static: 30 * 24 * 60 * 60 * 1000,  // 30 days
  runtime: 24 * 60 * 60 * 1000,       // 1 day
  images: 7 * 24 * 60 * 60 * 1000,    // 7 days
  api: 5 * 60 * 1000                  // 5 minutes
};

// Assets to cache immediately (critical path)
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg?v=4',
];

// Utility: Limit cache size
async function limitCacheSize(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxItems) {
    // Delete oldest entries
    const keysToDelete = keys.slice(0, keys.length - maxItems);
    await Promise.all(keysToDelete.map(key => cache.delete(key)));
  }
}

// Utility: Check if cache is expired
function isCacheExpired(response, duration) {
  if (!response) return true;
  
  const cachedTime = response.headers.get('sw-cache-time');
  if (!cachedTime) return true;
  
  return Date.now() - parseInt(cachedTime) > duration;
}

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
          if (!cacheName.startsWith('creedava-') || !cacheName.includes(CACHE_VERSION)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - intelligent caching strategies
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  
  // Handle different resource types with appropriate strategies
  
  // 1. Static assets (JS, CSS, fonts) - Cache First
  if (url.pathname.match(/\.(js|css|woff|woff2|ttf|eot)$/)) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse && !isCacheExpired(cachedResponse, CACHE_DURATION.static)) {
          return cachedResponse;
        }
        
        return fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            const headers = new Headers(responseToCache.headers);
            headers.set('sw-cache-time', Date.now().toString());
            
            const cachedResponse = new Response(responseToCache.body, {
              status: responseToCache.status,
              statusText: responseToCache.statusText,
              headers: headers
            });
            
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, cachedResponse);
              limitCacheSize(CACHE_NAME, MAX_CACHE_SIZE.static);
            });
          }
          return response;
        });
      })
    );
    return;
  }
  
  // 2. Images - Cache First with size limit
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/)) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse && !isCacheExpired(cachedResponse, CACHE_DURATION.images)) {
          return cachedResponse;
        }
        
        return fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            const headers = new Headers(responseToCache.headers);
            headers.set('sw-cache-time', Date.now().toString());
            
            const cachedResponse = new Response(responseToCache.body, {
              status: responseToCache.status,
              statusText: responseToCache.statusText,
              headers: headers
            });
            
            caches.open(IMAGE_CACHE).then(cache => {
              cache.put(event.request, cachedResponse);
              limitCacheSize(IMAGE_CACHE, MAX_CACHE_SIZE.images);
            });
          }
          return response;
        });
      })
    );
    return;
  }
  
  // 3. API requests - Network First with short cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          const headers = new Headers(responseToCache.headers);
          headers.set('sw-cache-time', Date.now().toString());
          
          const cachedResponse = new Response(responseToCache.body, {
            status: responseToCache.status,
            statusText: responseToCache.statusText,
            headers: headers
          });
          
          caches.open(API_CACHE).then(cache => {
            cache.put(event.request, cachedResponse);
            limitCacheSize(API_CACHE, MAX_CACHE_SIZE.api);
          });
        }
        return response;
      }).catch(() => {
        // Fallback to cache if network fails
        return caches.match(event.request);
      })
    );
    return;
  }
  
  // 4. HTML pages - Network First
  if (url.pathname.endsWith('.html') || url.pathname === '/' || !url.pathname.includes('.')) {
    event.respondWith(
      fetch(event.request).then(response => {
        const responseToCache = response.clone();
        caches.open(RUNTIME_CACHE).then(cache => {
          cache.put(event.request, responseToCache);
          limitCacheSize(RUNTIME_CACHE, MAX_CACHE_SIZE.runtime);
        });
        return response;
      }).catch(() => {
        return caches.match(event.request).then(cachedResponse => {
          return cachedResponse || caches.match('/');
        });
      })
    );
    return;
  }
  
  // 5. Everything else - Network First with cache fallback
  event.respondWith(
    fetch(event.request).then(response => {
      const responseToCache = response.clone();
      caches.open(RUNTIME_CACHE).then(cache => {
        cache.put(event.request, responseToCache);
        limitCacheSize(RUNTIME_CACHE, MAX_CACHE_SIZE.runtime);
      });
      return response;
    }).catch(() => {
      return caches.match(event.request);
    })
  );
});

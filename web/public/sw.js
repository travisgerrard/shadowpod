// Service Worker for ShadowPod+ PWA

const CACHE_NAME = 'shadowpod-cache-v1';
const OFFLINE_URL = '/offline';

const urlsToCache = [
  '/',
  '/dashboard',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/styles/global.css',
];

// Install the service worker and cache the core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Clean up old caches when a new service worker activates
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Serve cached content when offline
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (event.request.url.startsWith(self.location.origin)) {
    // For API requests, try network first, then fall back to offline page
    if (event.request.url.includes('/api/')) {
      event.respondWith(
        fetch(event.request)
          .catch(() => {
            return caches.match(OFFLINE_URL);
          })
      );
      return;
    }

    // For non-API requests, try cache first, then network
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Cache hit - return the response
          if (response) {
            return response;
          }

          // Clone the request because it's a one-time use stream
          const fetchRequest = event.request.clone();

          return fetch(fetchRequest)
            .then((response) => {
              // Check if we received a valid response
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              // Clone the response because it's a one-time use stream
              const responseToCache = response.clone();

              caches.open(CACHE_NAME)
                .then((cache) => {
                  // Don't cache if it's a data URL
                  if (!event.request.url.startsWith('data:')) {
                    cache.put(event.request, responseToCache);
                  }
                });

              return response;
            })
            .catch(() => {
              // If both cache and network fail, show offline page
              return caches.match(OFFLINE_URL);
            });
        })
    );
  }
}); 
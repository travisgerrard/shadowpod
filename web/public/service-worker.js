const CACHE_NAME = 'shadowpod-v1';
const OFFLINE_URL = '/offline.html';

const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/sw-register.js'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - respond with cached content when possible
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // API calls - network first, then cache
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful responses
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // For HTML requests - try network first, fall back to cache, then offline page
  if (event.request.mode === 'navigate' || 
     (event.request.method === 'GET' && event.request.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the latest version
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // If no cached HTML is found, show offline page
          return cache.match(OFFLINE_URL);
        })
    );
    return;
  }

  // For other requests - try cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        // Clone the request because it's a stream that can only be consumed once
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest)
          .then((response) => {
            // Check valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response since it's a stream that can only be consumed once
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          })
          .catch(() => {
            // For image requests, return a default offline image
            if (event.request.destination === 'image') {
              return caches.match('/icons/offline-image.png');
            }
          });
      })
  );
});

// Background sync for pending requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-user-data') {
    event.waitUntil(syncUserData());
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  const data = event.data.json();
  const options = {
    body: data.body || 'New content is available!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-icon.png',
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'ShadowPod', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data.url;
  
  event.waitUntil(
    clients.matchAll({type: 'window'})
      .then((windowClients) => {
        // Check if there is already a window and navigate to URL
        for (const client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Sync user data function (placeholder)
async function syncUserData() {
  try {
    // Get pending data from IndexedDB
    const pendingData = await getPendingData();
    
    if (pendingData && pendingData.length > 0) {
      // Send data to server
      for (const item of pendingData) {
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
      }
      
      // Clear processed data
      await clearPendingData();
    }
    
    return true;
  } catch (error) {
    console.error('Sync error:', error);
    return false;
  }
}

// IndexedDB helpers (placeholders)
function getPendingData() {
  return new Promise((resolve) => {
    // Implement IndexedDB logic to get pending data
    resolve([]);
  });
}

function clearPendingData() {
  return new Promise((resolve) => {
    // Implement IndexedDB logic to clear pending data
    resolve(true);
  });
} 
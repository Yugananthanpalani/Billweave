// Service Worker for BillWeave PWA
const CACHE_NAME = 'billweave-v1.0.0';
const STATIC_CACHE_NAME = 'billweave-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'billweave-dynamic-v1.0.0';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-apple-touch.png'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker: Static files cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static files', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests (Firebase, etc.)
  if (!url.origin.includes(self.location.origin)) {
    return;
  }

  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/')
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request)
            .then((response) => {
              // Cache the response for future use
              const responseClone = response.clone();
              caches.open(DYNAMIC_CACHE_NAME)
                .then((cache) => {
                  cache.put('/', responseClone);
                });
              return response;
            })
            .catch(() => {
              // Return offline page if available
              return caches.match('/');
            });
        })
    );
    return;
  }

  // Handle other requests
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((response) => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Cache static assets
            if (request.url.includes('.js') || 
                request.url.includes('.css') || 
                request.url.includes('.png') || 
                request.url.includes('.jpg') || 
                request.url.includes('.svg') ||
                request.url.includes('.ico')) {
              
              const responseClone = response.clone();
              caches.open(STATIC_CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseClone);
                });
            }

            return response;
          })
          .catch(() => {
            // Return fallback for images
            if (request.destination === 'image') {
              return caches.match('/icon-192.png');
            }
            
            // Return cached index for navigation
            if (request.mode === 'navigate') {
              return caches.match('/');
            }
          });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle offline actions when back online
      handleBackgroundSync()
    );
  }
});

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New notification from BillWeave',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/icon-192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('BillWeave', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper function for background sync
async function handleBackgroundSync() {
  try {
    // Handle any offline actions stored in IndexedDB
    console.log('Service Worker: Handling background sync');
    
    // This would typically sync offline data with the server
    // For now, we'll just log that sync is happening
    
    return Promise.resolve();
  } catch (error) {
    console.error('Service Worker: Background sync failed', error);
    throw error;
  }
}

// Handle app updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('Service Worker: Loaded');
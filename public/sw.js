// Service Worker for caching and offline support - Optimized for high traffic
const CACHE_VERSION = 'v2';
const STATIC_CACHE = `globalview-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `globalview-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `globalview-images-${CACHE_VERSION}`;

// Max items in dynamic cache to prevent memory bloat
const MAX_DYNAMIC_CACHE_SIZE = 50;
const MAX_IMAGE_CACHE_SIZE = 100;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/logo.jpeg',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name.startsWith('globalview-') && 
                   name !== STATIC_CACHE && 
                   name !== DYNAMIC_CACHE && 
                   name !== IMAGE_CACHE;
          })
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Trim cache to prevent memory bloat
const trimCache = async (cacheName, maxItems) => {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    // Delete oldest items (FIFO)
    const deleteCount = keys.length - maxItems;
    for (let i = 0; i < deleteCount; i++) {
      await cache.delete(keys[i]);
    }
  }
};

// Fetch event - smart caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API calls and Supabase requests - always fetch fresh
  if (url.pathname.includes('/rest/') || 
      url.pathname.includes('/auth/') ||
      url.pathname.includes('/storage/') ||
      url.hostname.includes('supabase')) {
    return;
  }

  // Skip chrome-extension and other non-http protocols
  if (!url.protocol.startsWith('http')) return;

  // Image caching - cache-first with background refresh
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        
        // Return cached immediately if available
        if (cached) {
          // Background refresh for stale images (older than 1 hour)
          const cacheDate = cached.headers.get('sw-cache-date');
          const isStale = cacheDate && (Date.now() - parseInt(cacheDate)) > 3600000;
          
          if (isStale) {
            fetch(request).then((response) => {
              if (response.ok) {
                const clonedResponse = response.clone();
                const headers = new Headers(clonedResponse.headers);
                headers.set('sw-cache-date', Date.now().toString());
                
                clonedResponse.blob().then((blob) => {
                  cache.put(request, new Response(blob, {
                    status: clonedResponse.status,
                    statusText: clonedResponse.statusText,
                    headers: headers,
                  }));
                });
              }
            }).catch(() => {});
          }
          
          return cached;
        }
        
        // Fetch and cache new images
        try {
          const response = await fetch(request);
          if (response.ok) {
            const clonedResponse = response.clone();
            const headers = new Headers(clonedResponse.headers);
            headers.set('sw-cache-date', Date.now().toString());
            
            clonedResponse.blob().then((blob) => {
              cache.put(request, new Response(blob, {
                status: clonedResponse.status,
                statusText: clonedResponse.statusText,
                headers: headers,
              }));
              trimCache(IMAGE_CACHE, MAX_IMAGE_CACHE_SIZE);
            });
          }
          return response;
        } catch (error) {
          // Return placeholder or cached version if offline
          return cached || new Response('', { status: 404 });
        }
      })
    );
    return;
  }

  // Static assets - cache-first
  if (request.destination === 'style' || 
      request.destination === 'script' ||
      request.destination === 'font') {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // HTML pages - stale-while-revalidate for fast navigation
  if (request.destination === 'document' || request.mode === 'navigate') {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        
        const fetchPromise = fetch(request).then((response) => {
          if (response.ok) {
            cache.put(request, response.clone());
            trimCache(DYNAMIC_CACHE, MAX_DYNAMIC_CACHE_SIZE);
          }
          return response;
        }).catch(() => {
          // Return cached version if offline
          return cached || caches.match('/index.html');
        });
        
        // Return cached immediately, update in background
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Default - network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, clone);
            trimCache(DYNAMIC_CACHE, MAX_DYNAMIC_CACHE_SIZE);
          });
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (event.data === 'clearCache') {
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name));
    });
  }
});

const CACHE_NAME = 'elit-cache';

// Assets to precache here:
const PRECACHE_ASSETS = [
    'index.html',
    'style.css',
    'app.js',
    'manifest.json'
]

// Assets to fetch from network here:
const NETWORK_ASSETS = '/https\:\/\/api\.carbonintensity\.org\.uk\/generation/';

// Listener for the install event - precaches our assets list on service worker install.
self.addEventListener('install', event => {

    // Static Routing API...
    if (event.addRoutes) {
        event.addRoutes({
          condition: {
                urlPattern: NETWORK_ASSETS,
                runningStatus: "running"
          },
          source: "network"
        })
    };

    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        cache.addAll(PRECACHE_ASSETS);
    })());
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  event.respondWith(async () => {
      const cache = await caches.open(CACHE_NAME);

      // match the request to our cache
      const cachedResponse = await cache.match(event.request);

      // check if we got a valid response
      if (cachedResponse !== undefined) {
          // Cache hit, return the resource
          return cachedResponse;
      } else {
        // Otherwise, go to the network
        const fetchResponse = await fetch(event.request.url);
        return fetchResponse;
      };
  });
});

self.addEventListener('error', err => {
  console.error(err.message);
});

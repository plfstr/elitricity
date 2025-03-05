const CACHE_NAME = 'elit-cache';

// Assets to precache here:
const PRECACHE_ASSETS = [
    'index.html?20240628',
    'style.css?20240522',
    'app.js?20240529',
    'manifest.json'
]

// Assets to fetch from network here:
const NETWORK_ASSETS = 'https://api.carbonintensity.org.uk/generation';

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
  if (new RegExp(NETWORK_ASSETS).test(event.request.url)) return;
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request);
    })
  );     
});

self.addEventListener('error', err => {
  console.error(err.message);
});

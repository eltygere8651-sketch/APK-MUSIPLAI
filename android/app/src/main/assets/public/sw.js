const CACHE_NAME = "flux-player-v5";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-512.svg",
  "/icon-152.png",
  "/icon-167.png",
  "/icon-180.png",
  "/icon-192.png",
  "/icon-256.png",
  "/icon-384.png",
  "/icon-512.png",
  "/icon-1024.png",
  "/favicon.png",
  "/apple-touch-icon.png?v=5",
  "/apple-touch-icon-152.png?v=5",
  "/apple-touch-icon-167.png?v=5",
  "/apple-touch-icon-180.png?v=5",
  "/apple-touch-icon-precomposed.png?v=5"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.error("Cache addAll error", err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || !event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  event.respondWith(
    fetch(event.request).then((networkResponse) => {
      if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
        return networkResponse;
      }
      const responseToCache = networkResponse.clone();
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, responseToCache);
      });
      return networkResponse;
    }).catch(() => {
      // Ignore query string when matching from cache
      return caches.match(event.request, { ignoreSearch: true });
    })
  );
});

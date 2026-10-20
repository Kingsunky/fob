// FOB Service Worker (PRD Section 19: FR-22, 23.5)
const CACHE_NAME = "fob-shell-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/offline.html",
  "/404.html",
  "/assets/css/tokens.css",
  "/assets/css/base.css",
  "/assets/css/layout.css",
  "/assets/css/components.css",
  "/assets/css/pages.css",
  "/assets/js/main.js",
  "/assets/js/config.js",
  "/assets/js/data.js",
  "/assets/js/fixtures.js",
  "/assets/js/hours.js",
  "/assets/js/whatsapp.js",
  "/assets/js/sheet.js",
  "/assets/js/share.js",
  "/assets/js/map.js",
  "/assets/js/motion.js",
  "/assets/js/tap-the-o.js",
  "/assets/js/analytics.js",
  "/assets/js/livescore.js",
  "/assets/svg/sprite.svg",
  "/data/fixtures.json",
  "/data/livescore.json",
  "/data/hours.json",
  "/data/settings.json"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
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

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache (stale-while-revalidate)
        fetch(e.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, networkResponse);
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(e.request).catch(() => {
        // If navigation request fails, show offline.html
        if (e.request.mode === "navigate") {
          return caches.match("/offline.html");
        }
      });
    })
  );
});

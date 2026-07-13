// Athos V590 Open World — Service Worker leve para GitHub Pages.
// Network-first para impedir cache fantasma durante correções e testes.
const CACHE_VERSION = 'otthos-v593-mobile-polish';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => /athos|otto/i.test(key) && key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isCore = /\/(index\.html|app\.js|style\.css|manifest\.webmanifest|sw\.js)$/.test(url.pathname) || /\/assets\/render-v54\//.test(url.pathname);
  if (isCore) {
    event.respondWith(fetch(req, { cache: 'no-store' }).catch(() => caches.match(req)));
  }
});

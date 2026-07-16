const CACHE = 'otthos-life-world-main-v613';
const CORE = [
  './',
  './index.html?v=613',
  './style.css?v=613',
  './assets/js/save-db.js?v=613',
  './app.js?v=613',
  './manifest.webmanifest?v=613',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/favicon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).catch(() => null));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  // CacheStorage é compartilhado entre projetos do mesmo domínio. Não apagamos
  // caches genéricos de outros jogos/repositórios do usuário.
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  const isNavigation = event.request.mode === 'navigate';
  const isCore = isNavigation || /\.(?:js|css|html|webmanifest)$/.test(url.pathname) || url.pathname.endsWith('/');

  if (isCore) {
    event.respondWith(
      fetch(event.request, {cache:'no-store'}).then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
        }
        return response;
      }).catch(async () => {
        return (await caches.match(event.request)) || (await caches.match('./index.html?v=613'));
      })
    );
    return;
  }

  // Imagens, moldes e athos.glb só entram no cache depois do primeiro uso.
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
      }
      return response;
    }))
  );
});

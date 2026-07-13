const CACHE = 'otthos-life-world-v600';
const CORE = [
  './','./index.html?v=600','./style.css?v=600','./app.js?v=600','./manifest.webmanifest?v=600',
  './icons/icon-192.png','./icons/icon-512.png','./icons/favicon.png','./athos.glb'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).catch(() => null));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && /otthos|athos/i.test(k)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  const isCore = /\.(?:js|css|html|webmanifest)$/.test(url.pathname) || url.pathname.endsWith('/');
  if (isCore) {
    event.respondWith(fetch(event.request, {cache:'no-store'}).then(response => {
      const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); return response;
    }).catch(() => caches.match(event.request).then(r => r || caches.match('./index.html?v=600'))));
  } else {
    event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); return response;
    })));
  }
});

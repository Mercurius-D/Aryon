// Aryon Private — Service Worker
// Strategy: cache-first for static assets, network-first for HTML
const CACHE = 'aryon-v1';

const PRECACHE = [
  '/',
  '/index.html',
  '/fonts/fonts.css',
  '/fonts/f1.woff2',
  '/fonts/f2.woff2',
  '/fonts/f3.woff2',
  '/fonts/f4.woff2',
  '/fonts/f5.woff2',
  '/fonts/f6.woff2',
  '/fonts/f7.woff2',
  '/fonts/f8.woff2',
  '/fonts/f9.woff2',
  '/fonts/f10.woff2',
  '/fonts/f11.woff2',
  '/fonts/f12.woff2',
  '/fonts/f13.woff2',
  '/img/yachting-poster.jpg',
  '/img/logo-transparent.png',
  '/img/og-image.webp',
  '/favicon.svg',
  '/countries-110m.json',
];

// Install: precache core assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate: remove old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch: cache-first for assets, network-first for HTML
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Skip cross-origin requests (CDN, Formspree, etc.)
  if (url.origin !== self.location.origin) return;

  // HTML: network-first so updates are picked up immediately
  if (e.request.headers.get('accept') && e.request.headers.get('accept').includes('text/html')) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Everything else: cache-first
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});

/**
 * Service Worker for Andromeda PWA.
 *
 * Primary purpose: make iOS standalone-mode treat localStorage as persistent.
 * Secondary: cache the app shell for fast repeat loads and basic offline support.
 *
 * Strategy:
 *  - App shell (HTML, JS, CSS, images)  → cache-first, update in background
 *  - API requests (/api/**)              → network-only (never cached)
 *  - Navigation requests                 → network-first, fall back to cached /index.html
 */

const CACHE_NAME = 'andromeda-v1';

const SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/andromeda-icon.png',
  '/logo-andro.jpg',
  '/YadroSide.png',
  '/Yadro.png',
];

// ---- install: pre-cache the app shell ----
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(SHELL_URLS).catch((err) => {
        // Non-fatal: if some asset is missing we still install.
        console.warn('[SW] Pre-cache partial failure:', err);
      })
    )
  );
  // Activate immediately — don't wait for old tabs to close.
  self.skipWaiting();
});

// ---- activate: clean up old caches ----
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  // Claim all open tabs so the SW controls them immediately.
  self.clients.claim();
});

// ---- fetch handler ----
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API calls — always network, never cache.
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Navigation (HTML page loads) — network-first, fall back to cached shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the fresh HTML for offline fallback.
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/', clone));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Static assets — cache-first, then network as fallback + cache update.
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});

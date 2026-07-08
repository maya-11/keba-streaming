// Keba Streaming — Service Worker
// Strategy:
//   Static assets (/_next/static/)  → Cache-first (immutable, content-hashed)
//   Images (same-origin)            → Cache-first with network fallback
//   Navigation (HTML pages)         → Network-first, fall back to cached page, then offline.html
//   API routes / external origins   → Pass-through, no caching

const SHELL_CACHE = 'keba-shell-v2';
const RUNTIME_CACHE = 'keba-runtime-v2';
const OFFLINE_URL = '/offline.html';

// App shell: small set of files that must be available offline immediately after install
const SHELL_ASSETS = [
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-72x72.png',
];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const current = new Set([SHELL_CACHE, RUNTIME_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !current.has(k)).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never touch cross-origin requests (Supabase, Cloudflare, Google, etc.)
  if (url.origin !== self.location.origin) return;

  // Never cache API routes — always hit the network
  if (url.pathname.startsWith('/api/')) return;

  // Never cache Next.js internal routes
  if (url.pathname.startsWith('/_next/webpack-hmr')) return;
  if (url.pathname.startsWith('/_next/data/')) return;

  // ── Next.js static assets: cache-first (filenames are content-hashed) ──
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE));
    return;
  }

  // ── Same-origin images: cache-first ──
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE));
    return;
  }

  // ── Navigation requests: network-first → cached page → offline.html ──
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigate(request));
    return;
  }

  // ── Other same-origin requests (fonts, scripts not under /_next/static): ──
  // stale-while-revalidate
  if (request.method === 'GET') {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
  }
});

// ── Strategies ───────────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Not available offline', { status: 503 });
  }
}

async function networkFirstNavigate(request) {
  try {
    // Try the network
    const response = await fetch(request);
    if (response.ok) {
      // Cache successful navigation responses so they're available offline later
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Network failed — try the cache for this exact URL
    const cached = await caches.match(request);
    if (cached) return cached;
    // Final fallback: offline page (always in SHELL_CACHE)
    const offline = await caches.match(OFFLINE_URL);
    return offline || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);
  return cached || fetchPromise || new Response('', { status: 503 });
}

// ── Skip-waiting message from client ─────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// ── Push Notifications ────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'Keba Streaming', body: 'New content available!', url: '/browse' };
  try { data = event.data.json(); } catch {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      data: { url: data.url },
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/browse';
  event.waitUntil(clients.openWindow(url));
});

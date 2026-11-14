// Offline support: cache the app shell; network requests to food/AI APIs are never cached.
const CACHE = 'nourish-v2';
const SHELL = [
  './', 'index.html', 'styles.css', 'manifest.webmanifest',
  'vendor/preact-htm.js', 'vendor/barcode-detector.js', 'vendor/zxing_reader.wasm',
  'js/app.js', 'js/store.js', 'js/foods.js', 'js/foods-data.js', 'js/api.js', 'js/ui.js',
  'js/diary.js', 'js/add.js', 'js/detail.js', 'js/ai.js', 'js/create.js',
  'js/progress.js', 'js/settings.js', 'js/goals.js', 'js/scanner.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/favicon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network-first for the app's own files (so updates show up), falling back to cache when offline.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(event.request, copy));
        return res;
      })
      .catch(() => caches.match(event.request).then((r) => r || caches.match('index.html')))
  );
});

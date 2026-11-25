// The production build replaces this version with a hash of the site files.
// Bump it when changing files served directly by the development server.
const VERSION = 'v1';
const CACHE_PREFIX = `bahooky-${self.registration.scope}-`;
const CACHE_NAME = `${CACHE_PREFIX}${VERSION}`;
const APP_FILES = [
  'index.html', 'styles.css', 'manifest.webmanifest',
  'src/main.js', 'src/engine.js', 'src/art.js', 'src/input.js', 'src/audio.js', 'src/pwa.js',
  'assets/icon.svg', 'assets/apple-touch-icon.png', 'assets/icon-192.png', 'assets/icon-512.png',
  'assets/boing1.mp3', 'assets/boing2.mp3', 'assets/boing3.mp3',
  'assets/fart1.mp3', 'assets/fart2.mp3', 'assets/fart3.mp3', 'assets/fart4.mp3', 'assets/fart5.mp3',
];
const APP_URLS = new Set(APP_FILES.map(file => new URL(file, self.registration.scope).href));
const HOME_URL = new URL('index.html', self.registration.scope).href;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(
    [...APP_URLS].map(url => new Request(url, { cache: 'reload' })),
  )));
  // Do not skipWaiting: an update must not replace code during an active game.
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  url.search = '';
  // Only handle this app's known files, not unrelated pages on the same host.
  const key = url.href === self.registration.scope ? HOME_URL : url.href;
  if (!APP_URLS.has(key)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    return await cache.match(key) || fetch(event.request);
  })());
});

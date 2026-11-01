// Turned into dist/sw.js at build time: vite.config.ts fills in the cache version and file list.
const CACHE = "subtotal-__VERSION__";
const FILES = __FILES__;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    // Fresh page when online, cached page when offline.
    event.respondWith(fetch(request).catch(() => caches.match("./", { ignoreVary: true })));
    return;
  }
  // ignoreVary: module scripts are requested with an Origin header that the precache requests lacked.
  event.respondWith(caches.match(request, { ignoreVary: true }).then((hit) => hit ?? fetch(request)));
});

// Minimal service worker — presence of a fetch handler satisfies
// Chrome's PWA installability criteria. No offline caching.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Pass-through: let the network handle every request.
});

// sw.js — SELF-DESTRUCT.
//
// The app-shell service worker caused stale builds to be served during active
// development. This version unregisters itself, clears all caches, and reloads
// any open clients so existing installs immediately get fresh code. The browser
// always re-fetches sw.js from the network, so changing this file is what breaks
// a bad cache. (Registration is also removed from main.tsx.)
self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
      await self.registration.unregister()
      const clients = await self.clients.matchAll({ type: 'window' })
      clients.forEach((c) => c.navigate(c.url))
    })(),
  )
})

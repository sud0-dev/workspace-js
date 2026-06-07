// Foundry Service Worker — v1
// Cache-first for hashed build assets; network-first for navigations so updates land.
const VERSION = 'foundry-v1'
const STATIC = `${VERSION}-static`
const RUNTIME = `${VERSION}-runtime`
const PRECACHE = ['/', '/manifest.json', '/favicon.ico', '/logo192.png', '/logo512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)),
      ),
    ).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
  // Never cache the server-fn endpoint or anything API-shaped.
  if (url.pathname.startsWith('/_server') || url.pathname.startsWith('/api/')) return

  if (req.mode === 'navigate') {
    event.respondWith(networkFirst(req))
  } else {
    event.respondWith(cacheFirst(req))
  }
})

async function cacheFirst(req) {
  const cache = await caches.open(RUNTIME)
  const hit = await cache.match(req)
  if (hit) return hit
  try {
    const res = await fetch(req)
    if (res.ok) cache.put(req, res.clone())
    return res
  } catch {
    return new Response('', { status: 504 })
  }
}

async function networkFirst(req) {
  const cache = await caches.open(RUNTIME)
  try {
    const res = await fetch(req)
    if (res.ok) cache.put(req, res.clone())
    return res
  } catch {
    const hit = await cache.match(req)
    if (hit) return hit
    return caches.match('/')
  }
}

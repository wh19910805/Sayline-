const CACHE_NAME = 'sayline-static-v2'
const MAX_CACHE_ENTRIES = 80

function isCacheable(request, url) {
  if (url.origin !== self.location.origin) return false
  if (url.pathname.startsWith('/api/') || url.pathname === '/health') return false
  if (url.pathname === '/' || url.pathname === '/index.html' || url.pathname === '/manifest.json') {
    return request.destination === 'document' || request.destination === 'manifest'
  }
  return (
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/icons/')
  )
}

async function trimCache(cache) {
  const keys = await cache.keys()
  const overflow = keys.length - MAX_CACHE_ENTRIES
  if (overflow <= 0) return
  await Promise.all(keys.slice(0, overflow).map((key) => cache.delete(key)))
}

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  )
  self.clients.claim()
})

// 网络优先，只缓存同源静态资源；用户 API 响应禁止进入 Cache Storage。
self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  if (!request.url.startsWith('http')) return
  const url = new URL(request.url)
  if (!isCacheable(request, url)) return

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone()
          caches.open(CACHE_NAME).then(async (cache) => {
            await cache.put(request, copy)
            await trimCache(cache)
          })
        }
        return response
      })
      .catch(() => caches.match(request)),
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'CLEAR_USER_CACHE') return
  event.waitUntil(caches.delete(CACHE_NAME))
})

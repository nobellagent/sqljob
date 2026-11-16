/**
 * Service worker sqljob — offline après la première visite.
 *
 * Stratégie : cache-first pour tout ce qui est same-origin et pour les CDN
 * réellement utilisés au runtime (jsDelivr : duckdb-wasm, monaco, perspective ;
 * raw.githubusercontent : logo). Les chunks hashés du bundle sont mis en cache
 * au fil de l'eau : pdfme, par exemple, n'est téléchargé qu'au premier PDF.
 *
 * Incrémenter CACHE_VERSION à chaque release pour purger l'ancien cache.
 */
const CACHE_VERSION = 'sqljob-v1'
const INDEX_URL = './index.html'
const PRECACHE_URLS = ['./', INDEX_URL, './manifest.webmanifest']
const CACHEABLE_HOSTS = new Set([
    'cdn.jsdelivr.net',
    'raw.githubusercontent.com',
])

self.addEventListener('install', event => {
    event.waitUntil(
        caches
            .open(CACHE_VERSION)
            .then(cache => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting()),
    )
})

self.addEventListener('activate', event => {
    event.waitUntil(
        caches
            .keys()
            .then(keys => Promise.all(keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key))))
            .then(() => self.clients.claim()),
    )
})

self.addEventListener('fetch', event => {
    const request = event.request
    if (request.method !== 'GET') return

    const url = new URL(request.url)
    const sameOrigin = url.origin === self.location.origin
    if (!sameOrigin && !CACHEABLE_HOSTS.has(url.hostname)) return

    // Navigation : servir l'app shell depuis le cache si le réseau tombe.
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then(response => {
                    if (response.ok) {
                        const copy = response.clone()
                        caches.open(CACHE_VERSION).then(cache => cache.put(request, copy))
                    }
                    return response
                })
                .catch(() => caches.match(INDEX_URL).then(hit => hit || caches.match('./'))),
        )
        return
    }

    event.respondWith(
        caches.match(request).then(hit => {
            if (hit) return hit
            return fetch(request).then(response => {
                if (response.ok) {
                    const copy = response.clone()
                    caches.open(CACHE_VERSION).then(cache => cache.put(request, copy))
                }
                return response
            })
        }),
    )
})

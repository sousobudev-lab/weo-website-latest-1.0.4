// ============================================
// sw.js — Service Worker untuk PWA
// Weo Dashboard
// ============================================

const CACHE_NAME = 'weo-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/styles/style.css',
    '/script.js',
    '/manifest.json'
];

// Install — cache fail asas
self.addEventListener('install', function(e) {
    e.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(ASSETS).catch(() => {});
        })
    );
    self.skipWaiting();
});

// Activate — buang cache lama
self.addEventListener('activate', function(e) {
    e.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            );
        })
    );
    self.clients.claim();
});

// Fetch — serve dari cache jika ada
self.addEventListener('fetch', function(e) {
    e.respondWith(
        caches.match(e.request).then(function(cached) {
            return cached || fetch(e.request).catch(() => cached);
        })
    );
});

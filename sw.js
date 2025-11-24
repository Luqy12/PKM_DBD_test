const CACHE_NAME = 'pkm-dbd-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './assets/css/styles.css',
    './assets/css/print.css',
    './assets/js/scripts.js',
    './assets/js/dashboard.js',
    './assets/js/reports.js',
    './assets/js/quiz.js',
    './assets/js/theme.js',
    './assets/images/icon-192.png',
    './assets/images/icon-512.png',
    './pages/dashboard.html',
    './pages/reports.html',
    './pages/lapor.html',
    './pages/quiz.html',
    './pages/stats.html',
    './pages/3m.html',
    './pages/program.html',
    './pages/about.html',
    './pages/gform.html',
    './pages/poster-a4.html',
    './pages/logbook.html'
];

// Install Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
});

// Fetch Strategy: Stale-While-Revalidate
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                // Update cache with new response
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            });

            // Return cached response if available, otherwise wait for network
            return cachedResponse || fetchPromise;
        })
    );
});

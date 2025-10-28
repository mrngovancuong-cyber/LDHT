// service-worker.js - PHIÊN BẢN NÂNG CAO VỚI MANIFEST ĐỘNG

const CACHE_NAME = 'ldht-cache-v6'; // Tăng phiên bản

// Danh sách các file tĩnh cần cache
const urlsToCache = [
    '/', '/Index.html', '/Exam.html', '/Dashboard.html',
    '/css/styleHome.css', '/css/styleD.css', '/css/styleDashboard.css',
    '/js/home.js', '/js/appF.js', '/js/dashboard.js',
    '/icons/icon-192x192.png', '/icons/icon-512x512.png',
    '/apple-touch-icon.png', '/favicon-32x32.png', '/favicon-16x16.png', '/favicon.ico'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(urlsToCache);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // =================================================================
    //      START: LOGIC ĐÁNH TRÁO MANIFEST ĐỘNG
    // =================================================================

    // Nếu trình duyệt đang yêu cầu file manifest.webmanifest...
    if (url.pathname === '/manifest.webmanifest') {
        event.respondWith(
            // ...chúng ta sẽ tạo ra một manifest mới ngay lập tức
            new Promise(resolve => {
                const classCode = url.searchParams.get('lop') || url.searchParams.get('class') || 'default';
                
                const manifest = {
                    "name": `LDHT - Lớp ${classCode}`,
                    "short_name": `LDHT ${classCode}`,
                    "start_url": `/Index.html?lop=${classCode}`,
                    "display": "standalone",
                    "background_color": "#0b1220",
                    "theme_color": "#0b1220",
                    "scope": "/",
                    "icons": [
                        { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png" },
                        { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png" }
                    ]
                };
                
                // Tạo một Response object chứa manifest động
                const response = new Response(JSON.stringify(manifest), {
                    headers: { 'Content-Type': 'application/json' }
                });
                
                resolve(response);
            })
        );
        return; // Dừng lại, không xử lý gì thêm cho request này
    }

    // =================================================================
    //      END: LOGIC ĐÁNH TRÁO MANIFEST ĐỘNG
    // =================================================================


    // Logic caching "Network First" cho các request khác (giữ nguyên)
    if (event.request.method === 'GET' && event.request.url.startsWith(self.location.origin)) {
        event.respondWith(
            fetch(event.request).then(networkResponse => {
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            }).catch(() => {
                return caches.match(event.request);
            })
        );
    }
});
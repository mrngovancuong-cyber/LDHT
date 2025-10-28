// service-worker.js - PHIÊN BẢN HOÀN CHỈNH

// Tăng phiên bản lên một số mới để buộc trình duyệt cập nhật toàn bộ cache.
const CACHE_NAME = 'ldht-cache-v5'; 

/**
 * Đây là danh sách "sống còn" của ứng dụng. 
 * Tất cả các file trong danh sách này sẽ được tải về và lưu lại 
 * ngay khi người dùng truy cập trang lần đầu tiên.
 */
const urlsToCache = [
  '/', // Luôn cache trang gốc, đại diện cho Index.html
  
  // -- CÁC TRANG HTML CHÍNH --
  '/Index.html',
  '/Exam.html',
  '/Dashboard.html',
  
  // -- CÁC FILE CSS --
  '/css/styleHome.css',
  '/css/styleD.css',
  '/css/styleDashboard.css',
  
  // -- CÁC FILE JAVASCRIPT --
  '/js/home.js',
  '/js/appF.js',
  '/js/dashboard.js',
  
  // -- CÁC ICON CHO PWA MANIFEST --
  // (Những icon này được tham chiếu trong hàm generateDynamicManifest)
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',

  // -- BỘ ICON ĐẦY ĐỦ CHO MỌI THIẾT BỊ --
  // (Những icon này được khai báo trong thẻ <head> của các file HTML)
  '/apple-touch-icon.png',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/favicon.ico'
  
  // LƯU Ý: File site.webmanifest không cần thiết vì chúng ta dùng manifest động.
];

// Sự kiện 'install': Cache các file tĩnh cốt lõi để đảm bảo app có thể chạy offline lần đầu
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching core assets');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting(); // Kích hoạt Service Worker mới ngay lập tức
});

// Sự kiện 'activate': Dọn dẹp các cache cũ không còn dùng đến
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Giành quyền kiểm soát trang ngay lập tức
});


// Sự kiện 'fetch': Áp dụng chiến lược Network First
self.addEventListener('fetch', event => {
  // Bỏ qua các yêu cầu không phải GET (ví dụ: POST đến API)
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Chỉ áp dụng chiến lược này cho các yêu cầu điều hướng (HTML) và các tài nguyên của chính trang web
  // Bỏ qua các yêu cầu đến API của Google
  if (!event.request.url.startsWith(self.location.origin)) {
      return;
  }

  event.respondWith(
    // 1. Thử truy cập mạng trước
    fetch(event.request)
      .then(networkResponse => {
        // 2. Nếu thành công, cập nhật cache và trả về phản hồi từ mạng
        return caches.open(CACHE_NAME).then(cache => {
          // Sao chép phản hồi vì nó chỉ có thể được đọc một lần
          cache.put(event.request, networkResponse.clone()); 
          // console.log('Service Worker: Fetched from network and cached:', event.request.url);
          return networkResponse;
        });
      })
      .catch(() => {
        // 3. Nếu thất bại (mất mạng), tìm trong cache
        // console.log('Service Worker: Network failed, trying cache for:', event.request.url);
        return caches.match(event.request);
      })
  );
});
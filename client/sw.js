const CACHE_NAME = 'photobooth-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/css/components.css',
    '/js/app.js',
    '/manifest.json'
];

// Service Worker 설치
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// 캐시 활성화 및 이전 캐시 삭제
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// 네트워크 요청 가로채기
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // 캐시에서 찾으면 캐시에서 반환
                if (response) {
                    return response;
                }
                // 없으면 네트워크에서 가져오기
                return fetch(event.request);
            })
    );
});
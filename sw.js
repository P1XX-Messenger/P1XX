const CACHE_NAME = 'p1xx-v2.3';
const urlsToCache = [
  '/P1XX/',
  '/P1XX/index.html',
  '/P1XX/manifest.json',
  '/P1XX/icons/icon-72.png',
  '/P1XX/icons/icon-96.png',
  '/P1XX/icons/icon-128.png',
  '/P1XX/icons/icon-144.png',
  '/P1XX/icons/icon-152.png',
  '/P1XX/icons/icon-192.png',
  '/P1XX/icons/icon-384.png',
  '/P1XX/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache).catch(err => {
        console.log('Cache addAll error:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Не кешируем Firebase запросы
  if (event.request.url.includes('firebaseio.com') || 
      event.request.url.includes('googleapis.com') ||
      event.request.url.includes('gstatic.com')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then(cached => 
      cached || fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Оффлайн — возвращаем index.html для навигации
        if (event.request.mode === 'navigate') {
          return caches.match('/P1XX/');
        }
        return new Response('Оффлайн');
      })
    )
  );
});

self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  const options = {
    body: data.body || 'Новое сообщение',
    icon: '/P1XX/icons/icon-192.png',
    badge: '/P1XX/icons/icon-72.png',
    vibrate: [200, 100, 200]
  };
  event.waitUntil(self.registration.showNotification(data.title || 'P1XX', options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clients => {
      if (clients.length > 0) {
        clients[0].focus();
      } else {
        clients.openWindow('/P1XX/');
      }
    })
  );
});
// ================================================================
//  SERVICE WORKER — Reposición ALM9037
//  Permite instalar la app y cachear recursos
// ================================================================

const CACHE_NAME = 'alm9037-v1';
const ASSETS = [
  '/reposicion-alm9037/',
  '/reposicion-alm9037/index.html',
  '/reposicion-alm9037/manifest.json'
];

// Instalar — guardar recursos en cache
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('ALM9037 SW: Cache instalado');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activar — limpiar caches viejos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch — responder desde cache o red
self.addEventListener('fetch', e => {
  // Las llamadas al Apps Script siempre van a la red (no cachear)
  if (e.request.url.includes('script.google.com')) {
    e.respondWith(fetch(e.request));
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).then(response => {
        // Guardar en cache si es un recurso local
        if (e.request.url.includes('github.io')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      });
    }).catch(() => caches.match('/reposicion-alm9037/index.html'))
  );
});

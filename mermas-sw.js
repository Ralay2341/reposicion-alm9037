// ============================================================
//  mermas-sw.js  —  Service Worker PWA Control de Mermas
// ============================================================

const CACHE_NAME    = "mermas-v1";
const OFFLINE_QUEUE = "mermas-offline-queue";

// Archivos que se cachean al instalar (app shell)
const ASSETS = [
  "/mermas.html",
  "/icon-192.png",
  "/icon-512.png"
];

// ── Instalación: cachear app shell ──
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ── Activación: limpiar caches viejos ──
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: red primero, cache como fallback ──
self.addEventListener("fetch", (e) => {
  // Peticiones a la API de Apps Script → solo red (no cachear)
  if (e.request.url.includes("script.google.com")) {
    e.respondWith(fetch(e.request).catch(() =>
      new Response(JSON.stringify({ ok: false, offline: true }),
        { headers: { "Content-Type": "application/json" } })
    ));
    return;
  }

  // App shell → cache first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

// ── Mensaje desde la app: sync manual ──
self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
});

// ── Background Sync (cuando vuelve la conexión) ──
self.addEventListener("sync", (e) => {
  if (e.tag === "sync-mermas") {
    e.waitUntil(syncPendientes());
  }
});

async function syncPendientes() {
  // Notifica a los clientes abiertos para que hagan el sync
  const clients = await self.clients.matchAll({ type: "window" });
  clients.forEach(client => client.postMessage({ type: "DO_SYNC" }));
}

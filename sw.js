/* ============================================================
   Service Worker — PWA Prospectos ROGMAI
   ============================================================ */

var CACHE_NAME = 'prospectos-v1';

var ASSETS_CACHE = [
  '/prospectos/',
  '/prospectos/assets/app.css',
  '/prospectos/assets/app.js',
  '/prospectos/assets/sync.js',
  '/prospectos/assets/map.js',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
];

/* ── Install: precaché de assets estáticos ── */
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS_CACHE);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

/* ── Activate: limpiar caches viejos ── */
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

/* ── Fetch: Network first, cache fallback ── */
self.addEventListener('fetch', function(e) {
  var url = e.request.url;
  var requestUrl = new URL(url);

    // Después — cachea tiles OSM (cache first):
    if (requestUrl.hostname === 'tile.openstreetmap.org' ||
        requestUrl.hostname === 'a.tile.openstreetmap.org' ||
        requestUrl.hostname === 'b.tile.openstreetmap.org' ||
        requestUrl.hostname === 'c.tile.openstreetmap.org') {
      e.respondWith(
        caches.match(e.request).then(function(cached) {
          if (cached) return cached;
          return fetch(e.request).then(function(resp) {
            var clone = resp.clone();
            caches.open('osm-tiles-v1').then(function(cache) {
              cache.put(e.request, clone);
            });
            return resp;
          }).catch(function() {
            return cached;
          });
        })
      );
      return;
    }

  // Las APIs siempre van a red; si falla → error (no cachear respuestas de API)
  if (url.indexOf('/prospectos/api/') !== -1) {
    e.respondWith(
      fetch(e.request).catch(function() {
        return new Response(
          JSON.stringify({ result: false, msjError: 'Sin conexión' }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  if (requestUrl.hostname === 'cdnjs.cloudflare.com') {
    e.respondWith(
      caches.match(e.request).then(function(cachedResponse) {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(e.request).then(function(resp) {
          if (resp && resp.status === 200) {
            var respClone = resp.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(e.request, respClone);
            });
          }
          return resp;
        });
      })
    );
    return;
  }

  if (url.indexOf('/prospectos/') === -1) {
    return;
  }

  // Recursos propios: network first, luego cache
  e.respondWith(
    fetch(e.request).then(function(resp) {
      // Clonar y guardar en cache si es una respuesta válida
      if (resp && resp.status === 200) {
        var respClone = resp.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, respClone);
        });
      }
      return resp;
    }).catch(function() {
      return caches.match(e.request);
    })
  );
});

/* ── Background Sync ── */
self.addEventListener('sync', function(e) {
  if (e.tag === 'sync-queue') {
    e.waitUntil(sincronizarDesdeWorker());
  }
});

function sincronizarDesdeWorker() {
  // Notificar a los clientes que hagan la sync (tienen acceso a IndexedDB y cookies de sesión)
  return self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    .then(function(clients) {
      clients.forEach(function(client) {
        client.postMessage({ type: 'SYNC_REQUEST' });
      });
    });
}

/* ── Mensajes desde la app ── */
self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (e.data && e.data.type === 'UPDATE_BADGE') {
    // Badge API (Chrome Android 81+)
    if (navigator.setAppBadge && e.data.count > 0) {
      navigator.setAppBadge(e.data.count);
    } else if (navigator.clearAppBadge) {
      navigator.clearAppBadge();
    }
  }
});

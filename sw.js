/* ============================================================
   Service Worker — PWA Prospectos ROGMAI
   ============================================================ */

var CACHE_NAME = 'prospectos-v3';

// Assets estaticos que DEBEN cachearse (si falla alguno, falla el install)
var ASSETS_CORE = [
  '/prospectos/offline.html',
  '/prospectos/assets/app.css',
  '/prospectos/assets/app.js',
  '/prospectos/assets/sync.js',
  '/prospectos/assets/wizard-prospecto.js',
  '/prospectos/assets/map.js',
  '/prospectos/install-prompt.js',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
];

// La pagina principal es PHP dinamica — se intenta cachear pero NO bloquea el install
var ASSETS_OPTIONAL = [
  '/prospectos/',
  '/prospectos/index.php'
];

/* ── Install: precaché de assets estáticos ── */
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      // Primero cachear los obligatorios
      return cache.addAll(ASSETS_CORE).then(function() {
        // Intentar cachear los opcionales (PHP) sin bloquear
        return Promise.all(ASSETS_OPTIONAL.map(function(url) {
          return cache.add(url).catch(function(err) {
            console.warn('[SW] No se pudo precachear (opcional):', url, err);
          });
        }));
      });
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
        keys.filter(function(k) { return k !== CACHE_NAME && k !== 'osm-tiles-v1'; })
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

  // Recursos propios: network first, luego cache, luego offline.html
  var isNavigate = e.request.mode === 'navigate';

  e.respondWith(
    fetch(e.request).then(function(resp) {
      // Clonar y guardar en cache si es una respuesta válida
      if (resp && resp.status === 200) {
        var respClone = resp.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, respClone);
          // Para navegaciones, tambien guardar con URL canonica para match seguro
          if (isNavigate) {
            cache.put('/prospectos/', respClone.clone()).catch(function() {});
          }
        });
      }
      return resp;
    }).catch(function() {
      return caches.match(e.request).then(function(cached) {
        if (cached) return cached;
        // Si es navegacion (abrir la app) y no hay cache, mostrar offline.html
        if (isNavigate) {
          return caches.match('/prospectos/offline.html').then(function(offlinePage) {
            return offlinePage || new Response(
              '<h1>Sin conexion</h1><p>Abre la app con internet al menos una vez.</p>',
              { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
            );
          });
        }
        // Para otros recursos (JS/CSS), no hay fallback
        return new Response('', { status: 503 });
      });
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

/* ============================================================
   Push Notifications (server-sent, Web Push Protocol)
   ------------------------------------------------------------
   El backend (api/push-send.php, pendiente) podra empujar
   notificaciones con payload JSON: { title, body, tag, url }.
   Tambien se dispara cuando llega un push silencioso para
   refrescar KPIs o forzar sincronizacion en background.
   ============================================================ */
self.addEventListener('push', function(e) {
  // Caso A: el push trae payload (flujo directo, poco usado aqui)
  if (e.data) {
    var data;
    try { data = e.data.json(); }
    catch (err) { data = { title: 'ROGMAI Prospectos', body: e.data.text() }; }

    var titulo = data.title || 'ROGMAI Prospectos';
    var opciones = {
      body:  data.body  || '',
      icon:  data.icon  || '/prospectos/assets/icons/icon-192.png',
      badge: data.badge || '/prospectos/assets/icons/icon-192.png',
      tag:   data.tag   || 'pwa_push',
      data:  { url: data.url || '/prospectos/' },
      renotify: !!data.renotify
    };
    e.waitUntil(self.registration.showNotification(titulo, opciones));
    return;
  }

  // Caso B: push vacio (flujo lite) — hacer pull a api/push-pull.php
  // con las cookies de sesion del user.
  e.waitUntil(
    fetch('/prospectos/api/push-pull.php', {
      method:      'POST',
      credentials: 'include',
      headers:     { 'Content-Type': 'application/json' },
      body:        JSON.stringify({})
    })
    .then(function(r) { return r.json(); })
    .then(function(resp) {
      if (!resp || !resp.result || !resp.notificaciones || resp.notificaciones.length === 0) {
        // Fallback generico si no hay pendientes
        return self.registration.showNotification('ROGMAI Prospectos', {
          body:  'Tienes una actualizacion',
          icon:  '/prospectos/assets/icons/icon-192.png',
          badge: '/prospectos/assets/icons/icon-192.png',
          tag:   'pwa_push_generic'
        });
      }
      // Mostrar una notificacion por cada pendiente
      return Promise.all(resp.notificaciones.map(function(n) {
        return self.registration.showNotification(n.titulo || 'ROGMAI Prospectos', {
          body:     n.cuerpo || '',
          icon:     '/prospectos/assets/icons/icon-192.png',
          badge:    '/prospectos/assets/icons/icon-192.png',
          tag:      n.tag  || 'pwa_push',
          data:     { url: n.url  || '/prospectos/' },
          renotify: true
        });
      }));
    })
    .catch(function(err) {
      console.warn('[SW push] pull fallo:', err);
      // Mostrar al menos una notificacion default para que el user vea algo
      return self.registration.showNotification('ROGMAI Prospectos', {
        body:  'Tienes actualizaciones pendientes',
        icon:  '/prospectos/assets/icons/icon-192.png',
        badge: '/prospectos/assets/icons/icon-192.png',
        tag:   'pwa_push_fallback'
      });
    })
  );
});

/* ── Clic en notificacion: enfocar la PWA (o abrirla) ── */
self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  var destino = (e.notification.data && e.notification.data.url) || '/prospectos/';

  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Si hay una ventana abierta de la PWA, enfocarla
        for (var i = 0; i < clientList.length; i++) {
          var c = clientList[i];
          if (c.url.indexOf('/prospectos/') !== -1 && 'focus' in c) {
            return c.focus();
          }
        }
        // Si no, abrir una nueva
        if (self.clients.openWindow) {
          return self.clients.openWindow(destino);
        }
      })
  );
});

/* ── Re-subscription cuando el navegador invalida la suscripcion ── */
self.addEventListener('pushsubscriptionchange', function(e) {
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clients) {
        clients.forEach(function(client) {
          client.postMessage({ type: 'PUSH_RESUBSCRIBE' });
        });
      })
  );
});

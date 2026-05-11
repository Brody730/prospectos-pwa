/* ============================================================
   sync.js — IndexedDB + Cola offline
   PWA Prospectos ROGMAI
   ============================================================ */

var DB_NAME    = 'prospectos_offline';
var DB_VERSION = 2;

var SyncDB = {
  db: null,

  init: function(callback) {
    var req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = function(e) {
      var db = e.target.result;
      if (!db.objectStoreNames.contains('sync_queue')) {
        var store = db.createObjectStore('sync_queue', {
          keyPath: 'id', autoIncrement: true
        });
        store.createIndex('status',    'status',    { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
      // Cache local de prospectos para offline
      if (!db.objectStoreNames.contains('prospectos_cache')) {
        db.createObjectStore('prospectos_cache', { keyPath: 'u_movimiento' });
      }
      // Cache local de agenda
      if (!db.objectStoreNames.contains('agenda_cache')) {
        db.createObjectStore('agenda_cache', { keyPath: 'u_task' });
      }
      // Cache de combos (vendedores, fuentes) para formulario offline
      if (!db.objectStoreNames.contains('combos_cache')) {
        db.createObjectStore('combos_cache', { keyPath: 'clave' });
      }
    };

    req.onsuccess = function(e) {
      SyncDB.db = e.target.result;
      if (callback) callback();
    };

    req.onerror = function(e) {
      console.error('IndexedDB error:', e.target.errorCode);
    };
  },

  /* ── Encolar una acción para sync ── */
  encolar: function(action, payload, callback) {
    if (!SyncDB.db) {
      if (callback) callback(false);
      return;
    }
    var tx    = SyncDB.db.transaction(['sync_queue'], 'readwrite');
    var store = tx.objectStore('sync_queue');
    store.add({
      action:    action,
      payload:   payload,
      timestamp: Date.now(),
      status:    'pending'
    });
    tx.oncomplete = function() {
      SyncDB.actualizarBadgeSync();
      // Registrar background sync para que el SW sincronice al reconectar
      SyncDB.registrarBackgroundSync();
      if (callback) callback(true);
    };
    tx.onerror = function() {
      if (callback) callback(false);
    };
  },

  /* ── Sincronizar pendientes → api/sync.php ── */
  sincronizar: function() {
    if (!navigator.onLine) {
      PWA.toast('Sin conexión — se enviará cuando haya internet', 'warn');
      return;
    }
    if (!SyncDB.db) {
      PWA.toast('Base de datos no lista', 'error');
      return;
    }

    var tx    = SyncDB.db.transaction(['sync_queue'], 'readonly');
    var store = tx.objectStore('sync_queue');
    var idx   = store.index('status');
    var req   = idx.getAll('pending');

    req.onsuccess = function(e) {
      var pendientes = e.target.result;
      if (!pendientes || pendientes.length === 0) {
        PWA.toast('Sin pendientes', 'ok');
        return;
      }

      var queue = pendientes.map(function(item) {
        return { id: item.id, action: item.action, payload: item.payload, timestamp: item.timestamp };
      });

      fetch('api/sync.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queue: queue })
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.result) {
          SyncDB.marcarComoSynced(queue.map(function(q) { return q.id; }));
          PWA.toast('Sincronizado: ' + data.synced + ' elementos', 'ok');
          SyncDB.actualizarBadgeSync();
        } else {
          PWA.toast('Error al sincronizar', 'error');
        }
      })
      .catch(function() {
        PWA.toast('Error de conexión', 'error');
      });
    };
  },

  /* ── Marcar ítems como sincronizados ── */
  marcarComoSynced: function(ids) {
    var tx    = SyncDB.db.transaction(['sync_queue'], 'readwrite');
    var store = tx.objectStore('sync_queue');
    ids.forEach(function(id) {
      var req = store.get(id);
      req.onsuccess = function(e) {
        var item = e.target.result;
        if (item) {
          item.status = 'synced';
          store.put(item);
        }
      };
    });
  },

  /* ── Contar pendientes ── */
  contarPendientes: function(callback) {
    if (!SyncDB.db) { if (callback) callback(0); return; }
    var tx    = SyncDB.db.transaction(['sync_queue'], 'readonly');
    var store = tx.objectStore('sync_queue');
    var idx   = store.index('status');
    var req   = idx.count('pending');
    req.onsuccess = function(e) {
      if (callback) callback(e.target.result || 0);
    };
  },

  /* ── Actualizar badge en nav ── */
  actualizarBadgeSync: function() {
    SyncDB.contarPendientes(function(n) {
      var badge = document.getElementById('badgePendientes');
      if (badge) {
        badge.textContent = n;
        badge.style.display = n > 0 ? 'inline-flex' : 'none';
      }
      // Notificar al SW para badge del ícono
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'UPDATE_BADGE',
          count: n
        });
      }
    });
  },

  /* ── Registrar Background Sync con el Service Worker ── */
  registrarBackgroundSync: function() {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then(function(reg) {
        return reg.sync.register('sync-queue');
      }).catch(function(err) {
        console.warn('Background sync no registrado:', err);
      });
    }
  },

  /* ── Cache de prospectos para offline ── */
  guardarProspectosCache: function(prospectos) {
    if (!SyncDB.db) return;
    var tx    = SyncDB.db.transaction(['prospectos_cache'], 'readwrite');
    var store = tx.objectStore('prospectos_cache');
    store.clear();
    prospectos.forEach(function(p) { store.add(p); });
  },

  leerProspectosCache: function(callback) {
    if (!SyncDB.db) { if (callback) callback([]); return; }
    var tx    = SyncDB.db.transaction(['prospectos_cache'], 'readonly');
    var store = tx.objectStore('prospectos_cache');
    var req   = store.getAll();
    req.onsuccess = function(e) {
      if (callback) callback(e.target.result || []);
    };
  },

  /* ── Cache de agenda para offline ── */
  guardarAgendaCache: function(items) {
    if (!SyncDB.db) return;
    var tx    = SyncDB.db.transaction(['agenda_cache'], 'readwrite');
    var store = tx.objectStore('agenda_cache');
    store.clear();
    items.forEach(function(item) { store.add(item); });
  },

  leerAgendaCache: function(callback) {
    if (!SyncDB.db) { if (callback) callback([]); return; }
    var tx    = SyncDB.db.transaction(['agenda_cache'], 'readonly');
    var store = tx.objectStore('agenda_cache');
    var req   = store.getAll();
    req.onsuccess = function(e) {
      if (callback) callback(e.target.result || []);
    };
  },

  /* ── Cache de combos (vendedores, fuentes, etc.) para offline ── */
  guardarCombo: function(clave, datos) {
    if (!SyncDB.db) return;
    try {
      var tx    = SyncDB.db.transaction(['combos_cache'], 'readwrite');
      var store = tx.objectStore('combos_cache');
      store.put({ clave: clave, datos: datos, timestamp: Date.now() });
    } catch (e) {
      console.warn('Error guardando combo cache:', e);
    }
  },

  leerCombo: function(clave, callback) {
    if (!SyncDB.db) { if (callback) callback(null); return; }
    try {
      var tx    = SyncDB.db.transaction(['combos_cache'], 'readonly');
      var store = tx.objectStore('combos_cache');
      var req   = store.get(clave);
      req.onsuccess = function(e) {
        var row = e.target.result;
        if (callback) callback(row ? row.datos : null);
      };
      req.onerror = function() {
        if (callback) callback(null);
      };
    } catch (e) {
      if (callback) callback(null);
    }
  }
};

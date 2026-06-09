/* ============================================================
   Vanilla JS, sin import/export, sin frameworks
   ============================================================ */

var PWA = PWA || {};

/* ── Helper: extraer lat/lng de un prospecto ── */
PWA.extraerCoords = function(p) {
  var lat = parseFloat(p.latitude || 0);
  var lng = parseFloat(p.longitude || 0);
  if (lat && lng) return { lat: lat, lng: lng };

  var link = String(p.link_google_map || '');
  if (!link) return null;

  // Formato simple "lat,lng" (ej: "19.4326,-99.1332")
  var partes = link.split(',');
  if (partes.length === 2) {
    lat = parseFloat(partes[0]);
    lng = parseFloat(partes[1]);
    if (lat && lng) return { lat: lat, lng: lng };
  }

  // URL Google Maps: buscar @lat,lng o ?q=lat,lng o /place/lat,lng
  var m = link.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (!m) m = link.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (!m) m = link.match(/place\/(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (m) {
    lat = parseFloat(m[1]);
    lng = parseFloat(m[2]);
    if (lat && lng) return { lat: lat, lng: lng };
  }
  return null;
};

/* ── Estado global ── */
PWA.session = {};
PWA.state = {
  vistaActual:   'panel',
  prospectos:    [],
  prospectoActivo: null,
  filtroEtapa:   '',
  filtroBuscar:  '',
  agenda:        [],
  panel:         {},
  tiposActividad: [],
  fechaAgenda:   null,
  isOnline:      navigator.onLine
};

var prospectosOffset = 0;
var prospectosLimit = 50;
var prospectosLoading = false;
var prospectosFinished = false;
var filtroActual = 'todos';
var busquedaActual = '';
var timeoutBusqueda;

/* ── Init ── */
document.addEventListener('DOMContentLoaded', function() {
  // Leer datos de sesión inyectados por index.php
  var meta = document.querySelector('meta[name="session-data"]');
  if (meta) {
    try {
      PWA.session = JSON.parse(meta.getAttribute('content'));
    } catch(e) {
      console.error('Error parseando session-data', e);
    }
  }

  // Toast container
  var tc = document.createElement('div');
  tc.id = 'toastContainer';
  document.body.appendChild(tc);

  // Inicializar IndexedDB
  SyncDB.init(function() {
    SyncDB.actualizarBadgeSync();
  });

  // Detectar conectividad
  PWA.detectarOnline();

  // Registrar Service Worker
  PWA.registrarSW();

  // Notificaciones locales
  PWA.Notificaciones.init();

  // Si el permiso de notificacion ya esta 'granted' pero el dispositivo
  // aun no esta suscrito en el backend, suscribirlo en silencio. Esto
  // cubre PWAs recien instaladas sobre una sesion existente.
  setTimeout(function() {
    if (PWA.Push && 'Notification' in window && Notification.permission === 'granted') {
      PWA.Push.suscribirse();
    }
  }, 2000);

  // Verificar si viene de un shortcut con ?action=
  var urlParams = new URLSearchParams(window.location.search);
  var accionInicial = urlParams.get('action');

  if (accionInicial === 'nuevo') {
    PWA.navegarA('lista');
    setTimeout(function() { PWA.NuevoProspecto.abrir(); }, 600);
  } else if (accionInicial === 'agenda') {
    PWA.navegarA('agenda');
  } else if (accionInicial === 'mapa') {
    PWA.navegarA('mapa');
  } else {
    PWA.navegarA('panel');
  }

  // Limpiar el param del URL sin recargar
  if (accionInicial && window.history.replaceState) {
    var cleanUrl = window.location.pathname;
    window.history.replaceState({}, '', cleanUrl);
  }

  // Tour de onboarding — primera vez
  setTimeout(function() {
    if (typeof PWATour !== 'undefined' && !PWATour.yaCompletado()) {
      PWATour.iniciar();
    }
  }, 1200);
});

window.addEventListener('scroll', function() {
  if (PWA.state.vistaActual !== 'lista') return;
  if (prospectosLoading || prospectosFinished) return;

  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
    PWA.Lista.cargarMas();
  }
});

/* ── Service Worker ── */
PWA.swRegistration = null;

PWA.registrarSW = function() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('sw.js').then(function(reg) {
    PWA.swRegistration = reg;
    // Si ya esta instalado y listo, activar notifications server-side ready
    navigator.serviceWorker.ready.then(function(readyReg) {
      PWA.swRegistration = readyReg;
    });
    reg.addEventListener('updatefound', function() {
      var newWorker = reg.installing;
      newWorker.addEventListener('statechange', function() {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          PWA.toast('Nueva versión disponible — recarga para actualizar', 'warn');
        }
      });
    });
  }).catch(function(e) {
    console.warn('SW no registrado:', e);
  });
};

/* ── Conectividad ── */
PWA.detectarOnline = function() {
  function actualizar() {
    PWA.state.isOnline = navigator.onLine;
    var banner = document.getElementById('offlineBanner');
    if (!banner) return;
    if (navigator.onLine) {
      banner.classList.remove('visible');
      document.documentElement.style.setProperty('--banner-h', '0px');
      // Auto-sync al reconectar
      SyncDB.contarPendientes(function(n) {
        if (n > 0) SyncDB.sincronizar();
      });
    } else {
      var offlineText = document.getElementById('offlineText');
      SyncDB.contarPendientes(function(n) {
        if (offlineText) {
          offlineText.textContent = n > 0
            ? 'Sin conexión · ' + n + ' pendientes'
            : 'Sin conexión';
        }
        banner.classList.add('visible');
        document.documentElement.style.setProperty('--banner-h', '44px');
      });
    }
  }
  window.addEventListener('online',  actualizar);
  window.addEventListener('offline', actualizar);
  actualizar();
};

/* ── Navegación ── */
PWA.navegarA = function(vista) {
  document.querySelectorAll('.view').forEach(function(v) {
    v.classList.remove('active');
  });
  document.querySelectorAll('.nav-item').forEach(function(b) {
    b.classList.remove('active');
  });

  var viewEl = document.getElementById('view-' + vista);
  var navEl  = document.querySelector('[data-view="' + vista + '"]');
  if (viewEl) viewEl.classList.add('active');
  if (navEl)  navEl.classList.add('active');

  PWA.state.vistaActual = vista;

  // FAB solo en Lista
  var fab = document.getElementById('fabNuevo');
  if (fab) fab.style.display = vista === 'lista' ? 'flex' : 'none';

  PWA.cargarVista(vista);
};

PWA.cargarVista = function(vista) {
  switch(vista) {
    case 'panel':  PWA.Panel.cargar();  break;
    case 'lista':  PWA.Lista.cargar();  break;
    case 'agenda': PWA.Agenda.cargar(); break;
    case 'mapa':   PWA.Mapa.cargar();   break;
    case 'perfil': PWA.Perfil.cargar(); break;
  }
};

function irALista() {
  PWA.navegarA('lista');
}

PWA.cerrarSesion = function() {
  if (!confirm('¿Cerrar sesión?')) return;
  fetch('/erpdistribucion/Logout.php', { credentials: 'same-origin' })
    .finally(function() {
      window.location.href = '/prospectos/';
    });
};

function aplicarFiltro(filtro) {
  filtroActual = filtro;
  prospectosOffset = 0;
  prospectosFinished = false;

  if (PWA.state.vistaActual !== 'lista') {
    PWA.navegarA('lista');
    return;
  }

  PWA.Lista.cargarMas(true);
}

function buscarProspectos(valor) {
  clearTimeout(timeoutBusqueda);

  timeoutBusqueda = setTimeout(function() {
    busquedaActual = valor;
    prospectosOffset = 0;
    prospectosFinished = false;

    if (PWA.state.vistaActual !== 'lista') {
      PWA.navegarA('lista');
      return;
    }

    PWA.Lista.cargarMas(true);
  }, 400);
}

function verDetalle(id) {
  var prospecto = PWA.state.prospectos.filter(function(p) {
    return p.u_movimiento == id;
  })[0];

  if (!prospecto) return;

  PWA.state.prospectoActivo = prospecto;

  document.querySelectorAll('.view').forEach(function(v) {
    v.classList.remove('active');
  });
  document.querySelectorAll('.nav-item').forEach(function(b) {
    b.classList.remove('active');
  });

  document.querySelector('#view-detalle').classList.add('active');
  var navLista = document.querySelector('[data-view="lista"]');
  if (navLista) navLista.classList.add('active');

  var fab = document.getElementById('fabNuevo');
  if (fab) fab.style.display = 'none';

  PWA.state.vistaActual = 'detalle';
  renderDetalle(prospecto);
}

function renderDetalle(p) {
  var cont = document.querySelector('#view-detalle');
  var nombre = PWA.obtenerNombreProspecto(p);
  var tel = PWA.obtenerTelefono(p);
  var wa = PWA.obtenerWhatsappLink(p);
  var mapa = PWA.obtenerMapaLink(p);
  var badgeColor = PWA.etapaColor(p.nombrealterno);
  var etapaNombre = p.etapa || 'Sin etapa';
  var fechaActividad = p.fecha_actividad ? p.fecha_actividad.substring(0, 10) : '';
  var horaActividad = PWA.formatoHora(p.hora);

  cont.innerHTML = [
    '<div class="card detalle-view" style="margin:16px 0 96px">',
      '<button class="btn btn-ghost" style="margin-bottom:16px" onclick="volverLista()">&larr; Volver</button>',
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px">',
        '<div>',
          '<h2 style="margin:0 0 8px;font-size:22px">' + nombre + '</h2>',
          '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">',
          '<div class="etapa-badge" style="background:' + badgeColor + '">' + etapaNombre + ' · ' + (p.nombrealterno || '—') + '</div>',
          '<span class="btn btn-ghost" style="padding:6px 12px;min-height:34px;font-size:12px;opacity:.85;pointer-events:none">Etapa: ' + (p.etapa || 'Sin etapa') + '</span>',
          '</div>',
        '</div>',
      '</div>',
      '<p style="margin:12px 0 8px;color:var(--pwa-muted)">' + (p.direccion || 'Sin dirección registrada') + '</p>',
      '<p style="margin:0 0 4px;color:var(--pwa-muted)">' + (tel || 'Sin teléfono') + '</p>',
      '<p style="margin:0 0 20px;color:var(--pwa-muted)">' + (p.email || 'Sin email') + '</p>',
      (function() {
        var rutaBtn = '';
        var coords = PWA.extraerCoords(p);
        if (coords) {
          rutaBtn = '<button onclick="PWA.Mapa.trazarRuta(' + coords.lat + ',' + coords.lng + ')" class="btn btn-ghost" style="flex:1">🧭 Trazar ruta</button>';
        }
        return '<div class="panel-action-row" style="margin-bottom:16px">'
          + (tel ? '<a href="tel:' + tel.replace(/\s+/g, '') + '" class="btn btn-primary" style="flex:1">📞 Llamar</a>' : '')
          + (wa ? '<a href="' + wa + '" target="_blank" class="btn btn-ghost" style="flex:1">💬 WhatsApp</a>' : '')
          + rutaBtn
          + '</div>';
      })(),
      '<div class="card2" style="margin-bottom:12px">',
        '<div style="font-size:11px;color:var(--pwa-muted);margin-bottom:6px">PRÓXIMA ACTIVIDAD</div>',
        (fechaActividad
          ? '<div style="font-size:15px;font-weight:700;margin-bottom:4px">' + fechaActividad + ' ' + horaActividad + '</div><div style="font-size:13px;color:var(--pwa-text);margin-bottom:4px">' + (p.tipo_actividad || p.titulo || 'Actividad') + '</div><div style="font-size:12px;color:var(--pwa-muted);margin-bottom:10px">' + (p.descripcion || p.concepto || 'Sin descripción') + '</div><button class="gcal-btn" onclick="PWA.abrirGoogleCalendar(PWA.state.prospectoActivo)">📅 Google Calendar</button>'
          : '<div style="font-size:13px;color:var(--pwa-muted)">Sin actividad próxima registrada</div>'
        ),
      '</div>',
      '<div class="card2" style="margin-bottom:12px">',
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">',
          '<div style="font-size:11px;color:var(--pwa-muted)">NUEVA ACTIVIDAD</div>',
          '<button class="btn btn-primary" type="button" style="padding:8px 12px;min-height:36px" onclick="PWA.NuevaActividad.abrir(\'' + (p.u_movimiento || '') + '\', \'' + nombre.replace(/'/g, '') + '\')">+ Agendar</button>',
        '</div>',
        '<div style="font-size:12px;color:var(--pwa-muted)">Crea seguimiento desde esta misma vista. Si no hay conexión, se encola offline.</div>',
      '</div>',
      '<div class="card2" style="margin-bottom:12px">',
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">',
          '<div style="font-size:11px;color:var(--pwa-muted)">Gestionar prospecto</div>',
          '<button class="btn btn-ghost" type="button" style="padding:8px 12px;min-height:36px" onclick="PWA.WizardProspecto.abrir(\'' + (p.u_movimiento || '') + '\')">Abrir</button>',
        '</div>',
        '<div style="font-size:12px;color:var(--pwa-muted)">Abre el flujo A-D para continuar o cerrar.</div>',
      '</div>',
      '<div class="card2">',
        '<div style="font-size:11px;color:var(--pwa-muted);margin-bottom:10px">HISTORIAL</div>',
        '<div id="detalleHistorial"><div class="spinner"></div></div>',
      '</div>',
    '</div>'
  ].join('');

  PWA.cargarHistorialDetalle(p.u_movimiento);
}

PWA.cargarHistorialDetalle = function(uMovimiento) {
  var cont = document.getElementById('detalleHistorial');
  if (!cont || !uMovimiento) return;

  PWA.apiPost('api/agenda.php', {
    opcion: 'TraerHistorial',
    u_movimiento: uMovimiento
  }, function(err, data) {
    if (err) {
      cont.innerHTML = '<div style="font-size:12px;color:var(--pwa-danger)">Error al cargar historial</div>';
      console.error('[Historial] Error:', err);
      return;
    }

    var items = (data && data.result) ? (data.contenido || []) : [];

    if (items.length === 0) {
      cont.innerHTML = '<div style="font-size:12px;color:var(--pwa-muted)">Sin actividades previas</div>';
      return;
    }

    // Iconos por tipo de actividad
    var iconosTipo = {
      'Llamada Telefónica':  '📞',
      'Llamada Telefonica':  '📞',
      'Envío de Correo':     '✉',
      'Envio de Correo':     '✉',
      'Visita en Sitio':     '🚗',
      'Mensaje':             '💬',
      'Otro Medio':          '📌',
      'Re-Agendar':          '🔁',
      'Investigacion':       '🔍',
      'Investigación':       '🔍'
    };

    var hoy = PWA.fechaHoy();
    var html = '';

    items.forEach(function(item) {
      var fecha = (item.fecha_compromiso || '').substring(0, 10);
      var hora = PWA.formatoHora(item.hora);
      var tipo = item.tipo || 'Actividad';
      var icono = iconosTipo[tipo] || '📌';
      var color = item.color || 'var(--pwa-muted)';
      var usuario = item.usuario || '';
      var esFinal = parseInt(item.es_final || 0, 10) === 1;
      var esVencida = !esFinal && fecha && fecha < hoy;

      // Línea vertical de timeline
      html += '<div class="historial-item" style="position:relative;padding:10px 0 10px 28px;border-left:2px solid ' + color + ';margin-left:8px;margin-bottom:4px">';

      // Punto del timeline
      html += '<div style="position:absolute;left:-7px;top:14px;width:12px;height:12px;border-radius:50%;background:' + color + ';border:2px solid var(--pwa-card)"></div>';

      // Fecha + hora + badge tipo
      html += '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">';
      html += '<span style="font-size:13px;font-weight:700">' + fecha + ' ' + hora + '</span>';
      html += '<span style="font-size:10px;padding:2px 6px;border-radius:4px;background:' + color + ';color:white">' + icono + ' ' + tipo + '</span>';
      if (esVencida) {
        html += '<span style="font-size:10px;color:var(--pwa-danger);font-weight:700">VENCIDA</span>';
      } else if (esFinal) {
        html += '<span style="font-size:10px;color:var(--pwa-accent2)">✓ Completada</span>';
      }
      html += '</div>';

      // Descripción (prioridad: descripcion > concepto > titulo)
      var textoDesc = item.descripcion || item.concepto || item.titulo || '';
      if (textoDesc) {
        html += '<div style="font-size:13px;color:var(--pwa-text);margin-bottom:3px">' + textoDesc + '</div>';
      }

      // Usuario que registró
      if (usuario) {
        html += '<div style="font-size:11px;color:var(--pwa-muted)">— ' + usuario + '</div>';
      }

      html += '</div>';
    });

    cont.innerHTML = html;
  });
};

function volverLista() {
  document.querySelectorAll('.view').forEach(function(v) {
    v.classList.remove('active');
  });
  document.querySelector('#view-lista').classList.add('active');

  document.querySelectorAll('.nav-item').forEach(function(b) {
    b.classList.remove('active');
  });
  var navLista = document.querySelector('[data-view="lista"]');
  if (navLista) navLista.classList.add('active');

  var fab = document.getElementById('fabNuevo');
  if (fab) fab.style.display = 'flex';

  PWA.state.vistaActual = 'lista';
}

/* ── Toast ── */
PWA.toast = function(msg, tipo) {
  var tc = document.getElementById('toastContainer');
  if (!tc) return;
  var t = document.createElement('div');
  t.className = 'toast' + (tipo ? ' ' + tipo : '');
  t.textContent = msg;
  tc.appendChild(t);
  setTimeout(function() {
    if (t.parentNode) t.parentNode.removeChild(t);
  }, 3500);
};

/* ── Helpers ── */
PWA.fechaHoy = function() {
  var d = new Date();
  var mm = ('0' + (d.getMonth()+1)).slice(-2);
  var dd = ('0' + d.getDate()).slice(-2);
  return d.getFullYear() + '-' + mm + '-' + dd;
};

PWA.estadoProspecto = function(fechaActividad) {
  if (!fechaActividad) return 'nuevo';
  var hoy = PWA.fechaHoy();
  var fa  = fechaActividad.substring(0, 10);
  if (fa < hoy) return 'vencido';
  if (fa === hoy) return 'hoy';
  return 'corriente';
};

PWA.iniciales = function(nombre) {
  if (!nombre) return '?';
  var partes = nombre.trim().split(' ');
  if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
  return nombre.substring(0, 2).toUpperCase();
};

PWA.apiPost = function(url, data, callback) {
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(function(r) { return r.json(); })
  .then(function(data) { callback(null, data); })
  .catch(function(e)  { callback(e, null); });
};

PWA.mostrarToast = function(msg, tipo) {
  PWA.toast(msg, tipo);
};

PWA.formatoHora = function(hora) {
  if (!hora) return '--:--';
  return String(hora).substring(0, 5);
};

PWA.parseFechaHora = function(fecha, hora) {
  if (!fecha) return null;
  return new Date(fecha + 'T' + (hora || '00:00:00'));
};

PWA.obtenerLunesSemana = function(fechaBase) {
  var base = fechaBase ? new Date(fechaBase + 'T00:00:00') : new Date();
  var dia = base.getDay();
  var diff = dia === 0 ? -6 : 1 - dia;
  base.setDate(base.getDate() + diff);
  return base;
};

PWA.formatearFechaISO = function(dateObj) {
  var mm = ('0' + (dateObj.getMonth() + 1)).slice(-2);
  var dd = ('0' + dateObj.getDate()).slice(-2);
  return dateObj.getFullYear() + '-' + mm + '-' + dd;
};

PWA.obtenerDiasHabilesSemana = function(fechaBase) {
  var lunes = PWA.obtenerLunesSemana(fechaBase);
  var nombres = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie'];
  var dias = [];
  var i;

  for (i = 0; i < 5; i++) {
    var d = new Date(lunes.getTime());
    d.setDate(lunes.getDate() + i);
    dias.push({
      nombre: nombres[i],
      fecha: PWA.formatearFechaISO(d),
      numero: d.getDate()
    });
  }

  return dias;
};

PWA.obtenerProximaActividad = function(actividades, fechaObjetivo) {
  var ahora = new Date();
  var hoy = fechaObjetivo || PWA.fechaHoy();
  var delDia = (actividades || []).filter(function(a) {
    return (a.fecha_compromiso || '').substring(0, 10) === hoy;
  });
  var siguiente = null;
  var i;

  for (i = 0; i < delDia.length; i++) {
    var fechaHora = PWA.parseFechaHora(delDia[i].fecha_compromiso, delDia[i].hora);
    if (fechaHora && fechaHora >= ahora) {
      siguiente = delDia[i];
      break;
    }
  }

  if (!siguiente && delDia.length > 0) {
    siguiente = delDia[0];
  }

  return siguiente;
};

PWA.obtenerTelefono = function(item) {
  return item.phoneno || item.telefono || item.PhoneNo || '';
};

PWA.obtenerWhatsappLink = function(item) {
  var tel = PWA.obtenerTelefono(item).replace(/[^0-9]/g, '');
  if (!tel) return '';
  if (tel.indexOf('52') !== 0) tel = '52' + tel;
  return 'https://wa.me/' + tel;
};

PWA.obtenerMapaLink = function(item) {
  if (!item) return '';
  var raw = item.link_google_map ? String(item.link_google_map).trim() : '';
  if (raw) {
    // Si ya es URL absoluta, devolverla tal cual
    if (/^https?:\/\//i.test(raw)) return raw;
    // Si es un par "lat,lng" (con o sin espacios), convertir a URL de Google Maps
    if (/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(raw)) {
      return 'https://maps.google.com/?q=' + encodeURIComponent(raw.replace(/\s+/g, ''));
    }
    // Cualquier otro string: tratarlo como query de direccion
    return 'https://maps.google.com/?q=' + encodeURIComponent(raw);
  }
  if (item.latitude && item.longitude) return 'https://maps.google.com/?q=' + item.latitude + ',' + item.longitude;
  if (item.direccion) return 'https://maps.google.com/?q=' + encodeURIComponent(item.direccion);
  return '';
};

PWA.obtenerNombreProspecto = function(item) {
  return item.prospecto || item.nombreProspecto || item.nombre || item.DebtorName || 'Sin nombre';
};

PWA.etapaColor = function(nombrealterno) {
  var mapa = {
    'A': '#4f8ef7',
    'B': '#22d3ee',
    'C': '#f59e0b',
    'D': '#fb923c',
    'V': '#34d399',
    'S': '#a855f7',
    'E': '#8892a4',
    'X': '#8892a4',
    'BD': '#64748b'
  };
  return mapa[nombrealterno] || '#8892a4';
};

PWA.abrirRutaActividad = function(actividad) {
  if (!actividad) return;
  var url = PWA.obtenerMapaLink(actividad);

  if (url) {
    window.open(url, '_blank');
  } else {
    PWA.toast('La actividad no tiene ubicacion disponible', 'warn');
  }
};

PWA.Notificaciones = {
  intervalId: null,

  init: function() {
    this.programarRevision();
  },

  puedeMostrar: function() {
    return 'Notification' in window && Notification.permission === 'granted';
  },

  mostrar: function(titulo, cuerpo, claveSesion) {
    if (!this.puedeMostrar()) return;
    if (claveSesion && sessionStorage.getItem(claveSesion)) return;

    var opciones = {
      body:  cuerpo,
      icon:  'assets/icons/icon-192.png',
      badge: 'assets/icons/icon-192.png',
      tag:   claveSesion || 'pwa_notif',
      renotify: false
    };

    // --- Preferir el Service Worker (funciona en PWA instalada en Android/Chrome,
    //     donde `new Notification(...)` lanza TypeError por estar prohibido).
    var enviadoViaSW = false;
    var swReady = ('serviceWorker' in navigator) ? navigator.serviceWorker.ready : null;

    function marcarMostrada() {
      if (claveSesion) {
        try { sessionStorage.setItem(claveSesion, '1'); } catch (e) {}
      }
    }

    if (swReady && typeof swReady.then === 'function') {
      swReady.then(function(reg) {
        if (reg && typeof reg.showNotification === 'function') {
          enviadoViaSW = true;
          reg.showNotification(titulo, opciones).then(marcarMostrada).catch(function(err) {
            console.warn('[Notif] SW showNotification fallo:', err);
            // Fallback al constructor clasico
            try {
              new Notification(titulo, opciones);
              marcarMostrada();
            } catch (e) {}
          });
        } else {
          // SW sin soporte → fallback
          try {
            new Notification(titulo, opciones);
            marcarMostrada();
          } catch (e) {}
        }
      }).catch(function() {
        try {
          new Notification(titulo, opciones);
          marcarMostrada();
        } catch (e) {}
      });
    } else {
      // Sin SW → fallback clasico (navegador regular)
      try {
        new Notification(titulo, opciones);
        marcarMostrada();
      } catch (e) {}
    }
  },

  solicitarPermisoDesdeUsuario: function() {
    if (!('Notification' in window)) {
      PWA.mostrarToast('Este navegador no soporta notificaciones', 'warn');
      return;
    }

    Notification.requestPermission().then(function(permission) {
      PWA.Perfil.actualizarEstadoNotificaciones();
      if (permission === 'granted') {
        PWA.mostrarToast('Notificaciones activadas', 'ok');
        PWA.Notificaciones.refrescarDesdePanel();
        // Registrar push subscription en el backend para que
        // el server pueda empujar notificaciones aunque la PWA
        // este cerrada. Silenciosamente no-op si falla.
        if (PWA.Push && typeof PWA.Push.suscribirse === 'function') {
          PWA.Push.suscribirse();
        }
      } else if (permission === 'denied') {
        PWA.mostrarToast('Notificaciones bloqueadas en el navegador', 'warn');
      }
    });
  },

  revisarVencidos: function() {
    var panel = PWA.state.panel || {};
    var kpis = panel.kpis || {};
    if (kpis.vencidos > 0) {
      this.mostrar('ROGMAI Prospectos', 'Tienes ' + kpis.vencidos + ' actividades vencidas', 'pwa_notif_vencidos_' + PWA.fechaHoy());
    }
  },

  revisarProximaVisita: function() {
    var panel = PWA.state.panel || {};
    var actividad = panel.proximaActividad || null;
    if (!actividad) return;

    var fechaHora = PWA.parseFechaHora(actividad.fecha_compromiso, actividad.hora);
    if (!fechaHora) return;

    var minutos = Math.round((fechaHora.getTime() - new Date().getTime()) / 60000);
    if (minutos >= 0 && minutos <= 60) {
      var nombre = actividad.nombreProspecto || actividad.prospecto || 'prospecto';
      var clave = 'pwa_notif_visita_' + (actividad.u_task || nombre) + '_' + actividad.fecha_compromiso + '_' + PWA.formatoHora(actividad.hora);
      this.mostrar('ROGMAI Prospectos', 'En ' + minutos + ' minutos: visita a ' + nombre, clave);
    }
  },

  programarRevision: function() {
    var self = this;

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(function() {
      self.revisarProximaVisita();
    }, 5 * 60 * 1000);
  },

  refrescarDesdePanel: function() {
    this.revisarVencidos();
    this.revisarProximaVisita();
  },

  estado: function() {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  }
};

/* ============================================================
   PWA.Push — Web Push subscription (server-triggered)
   ------------------------------------------------------------
   Flujo:
   1) Usuario otorga permiso de notificaciones
   2) suscribirse() pide VAPID public key al server
   3) pushManager.subscribe(...) genera endpoint + keys
   4) Se POSTea al server para guardarla
   Cuando el backend haga push (api/push-send.php), el SW lo
   recibe y muestra la notificacion.
   ============================================================ */
PWA.Push = {

  /* Convertir base64url → Uint8Array (requerido por pushManager) */
  _urlB64ToUint8: function(b64) {
    var padding = '='.repeat((4 - b64.length % 4) % 4);
    var base64  = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/');
    var raw     = atob(base64);
    var out     = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) { out[i] = raw.charCodeAt(i); }
    return out;
  },

  /* ── Suscribirse al push del navegador y registrar en backend ── */
  suscribirse: function() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('[Push] Navegador sin soporte');
      return;
    }
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      console.warn('[Push] Sin permiso de notificacion');
      return;
    }

    // 1) Obtener VAPID public key
    PWA.apiPost('api/push-subscribe.php', { opcion: 'public-key' }, function(err, data) {
      if (err || !data || !data.result || !data.publicKey) {
        console.warn('[Push] No se pudo obtener public key', err, data);
        return;
      }
      var appServerKey = PWA.Push._urlB64ToUint8(data.publicKey);

      // 2) Subscribir via pushManager
      navigator.serviceWorker.ready.then(function(reg) {
        // Si ya hay subscription, reutilizarla (y mandarla al backend por si acaso)
        return reg.pushManager.getSubscription().then(function(existing) {
          if (existing) {
            return existing;
          }
          return reg.pushManager.subscribe({
            userVisibleOnly:      true,
            applicationServerKey: appServerKey
          });
        });
      }).then(function(subscription) {
        var raw = subscription.toJSON();
        var payload = {
          opcion:   'subscribe',
          endpoint: raw.endpoint || subscription.endpoint,
          p256dh:   raw.keys && raw.keys.p256dh,
          auth:     raw.keys && raw.keys.auth
        };
        PWA.apiPost('api/push-subscribe.php', payload, function(err, resp) {
          if (err || !resp || !resp.result) {
            console.warn('[Push] Backend rechazo la suscripcion', err, resp);
          } else {
            console.log('[Push] Suscripcion registrada OK');
          }
        });
      }).catch(function(e) {
        console.warn('[Push] subscribe fallo:', e);
      });
    });
  },

  /* ── Desuscribirse (ej. al cerrar sesion) ── */
  desuscribirse: function() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready.then(function(reg) {
      return reg.pushManager.getSubscription();
    }).then(function(sub) {
      if (!sub) return;
      var endpoint = sub.endpoint;
      sub.unsubscribe().then(function() {
        PWA.apiPost('api/push-subscribe.php', {
          opcion:   'unsubscribe',
          endpoint: endpoint
        }, function() {});
      });
    }).catch(function() {});
  }
};

/* ── Escuchar pushsubscriptionchange del SW (re-subscribirse) ── */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'PUSH_RESUBSCRIBE') {
      PWA.Push.suscribirse();
    }
    if (e.data && e.data.type === 'SYNC_REQUEST') {
      // Disparado por background sync del SW
      if (typeof SyncDB !== 'undefined' && SyncDB.sincronizar) {
        SyncDB.sincronizar();
      }
    }
  });
}

/* ── Google Calendar (link directo, sin API) ── */
PWA.abrirGoogleCalendar = function(actividad) {
  var fechaStr = (actividad.fecha_compromiso || actividad.fecha || PWA.fechaHoy()).substring(0, 10);
  var hora     = actividad.hora || '09:00:00';
  if (hora.length === 5) hora = hora + ':00'; // asegurar HH:mm:ss

  var inicio = fechaStr.replace(/-/g, '') + 'T' + hora.replace(/:/g, '');

  // Fin = inicio + 1 hora
  var horaFin = new Date('1970-01-01T' + hora);
  horaFin.setHours(horaFin.getHours() + 1);
  var hh  = ('0' + horaFin.getHours()).slice(-2);
  var mm  = ('0' + horaFin.getMinutes()).slice(-2);
  var ss  = ('0' + horaFin.getSeconds()).slice(-2);
  var fin = fechaStr.replace(/-/g, '') + 'T' + hh + mm + ss;

  var titulo      = actividad.titulo || actividad.concepto || 'Actividad';
  var descripcion = (actividad.descripcion || '') +
                    (actividad.nombreProspecto ? '\nProspecto: ' + actividad.nombreProspecto : '') +
                    (actividad.u_movimiento    ? '\nOp: ' + actividad.u_movimiento           : '');
  var location    = actividad.direccion || '';

  var url = 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    '&text='     + encodeURIComponent(titulo) +
    '&dates='    + inicio + '/' + fin +
    '&details='  + encodeURIComponent(descripcion) +
    '&location=' + encodeURIComponent(location);

  window.open(url, '_blank');
};

/* ── Toast con acción (para el link de calendario) ── */
PWA.toastAccion = function(msg, labelAccion, fnAccion) {
  var tc = document.getElementById('toastContainer');
  if (!tc) return;
  var t   = document.createElement('div');
  t.className = 'toast ok';
  t.style.display = 'flex';
  t.style.alignItems = 'center';
  t.style.justifyContent = 'space-between';
  var span = document.createElement('span');
  span.textContent = msg;
  var btn  = document.createElement('button');
  btn.textContent = labelAccion;
  btn.style.cssText = 'background:none;border:none;color:var(--pwa-accent);font-weight:700;font-size:12px;cursor:pointer;padding:0;margin-left:12px;white-space:nowrap;flex-shrink:0';
  btn.onclick = function() {
    fnAccion();
    if (t.parentNode) t.parentNode.removeChild(t);
  };
  t.appendChild(span);
  t.appendChild(btn);
  tc.appendChild(t);
  setTimeout(function() {
    if (t.parentNode) t.parentNode.removeChild(t);
  }, 7000);
};

/* ============================================================
   ============================================================ */
PWA.Panel = {
  cargar: function() {
    var el = document.getElementById('view-panel');
    el.innerHTML = '<div class="spinner"></div>';

    PWA.Panel.cargarDatos(function(panelData) {
      PWA.state.panel = panelData;
      PWA.Panel.renderizar(panelData);
      PWA.Notificaciones.refrescarDesdePanel();
    });
  },

  cargarDatos: function(callback) {
    var panelData = {
      kpis: { total: 0, calificados: 0, visitas_hoy: 0, vencidos: 0, diagnostico_estatus: [] },
      agendaHoy: [],
      agendaSemana: [],
      proximaActividad: null
    };
    var pendientes = 3;

    function finalizar() {
      pendientes--;
      if (pendientes <= 0) {
        panelData.proximaActividad = PWA.obtenerProximaActividad(panelData.agendaHoy, PWA.fechaHoy());
        callback(panelData);
      }
    }

    PWA.Panel.cargarKPIs(function(kpis) {
      panelData.kpis = kpis;
      finalizar();
    });

    PWA.Panel.cargarAgendaHoy(function(items) {
      panelData.agendaHoy = items || [];
      finalizar();
    });

    PWA.Panel.cargarAgendaSemana(function(items) {
      panelData.agendaSemana = items || [];
      finalizar();
    });
  },

  cargarKPIs: function(callback) {
    PWA.apiPost('api/prospectos.php', {
      option: 'TraerKPIs',
      userid: PWA.session.userid
    }, function(err, data) {
      if (!err && data && data.result && data.contenido) {
        callback(data.contenido);
        return;
      }

      SyncDB.leerProspectosCache(function(prospectos) {
        var kpis = {
          total: 0,
          calificados: 0,
          visitas_hoy: 0,
          vencidos: 0,
          diagnostico_estatus: []
        };

        (prospectos || []).forEach(function(p) {
          var fa = p.fecha_actividad ? p.fecha_actividad.substring(0, 10) : '';
          var idstatus = parseInt(p.idstatus || 0, 10);
          if ([0, 5, 8].indexOf(idstatus) === -1) kpis.total++;
          if ([2, 3, 4, 7].indexOf(idstatus) !== -1) kpis.calificados++;
          if (fa === PWA.fechaHoy()) kpis.visitas_hoy++;
          if (fa && fa < PWA.fechaHoy() && [5, 8].indexOf(idstatus) === -1) kpis.vencidos++;
        });

        callback(kpis);
      });
    });
  },

  cargarAgendaHoy: function(callback) {
    PWA.apiPost('api/agenda.php', {
      opcion: 'TraerAgenda',
      userid: PWA.session.userid,
      fecha: PWA.fechaHoy()
    }, function(err, data) {
      if (!err && data && data.result) {
        callback(data.contenido || []);
        return;
      }

      SyncDB.leerAgendaCache(function(items) {
        callback(items || []);
      });
    });
  },

  cargarAgendaSemana: function(callback) {
    PWA.apiPost('api/agenda.php', {
      opcion: 'TraerAgenda',
      userid: PWA.session.userid,
      fecha: PWA.fechaHoy(),
      rango: 'semana_actual'
    }, function(err, data) {
      if (!err && data && data.result) {
        callback(data.contenido || []);
        return;
      }

      SyncDB.leerAgendaCache(function(items) {
        callback(items || []);
      });
    });
  },

  renderizar: function(panelData) {
    var hoy = PWA.fechaHoy();
    var kpis = panelData.kpis || {};
    var proximaActividad = panelData.proximaActividad || null;
    var agendaSemana = panelData.agendaSemana || [];
    var diasSemana = PWA.obtenerDiasHabilesSemana(hoy);
    var totalSemana = 0;
    var porcentajeCalificados = 0;
    var html = '';
    var nombre;
    var horaTipo;
    var tel;
    var waLink;
    var mapaLink;
    var puntosSemana = {};

    if ((kpis.total || 0) > 0 && (kpis.calificados || 0) > 0) {
      porcentajeCalificados = Math.round((kpis.calificados / kpis.total) * 100);
    }

    if ((kpis.vencidos || 0) > 0) {
      html += '<div class="panel-feature-card panel-alert-card">';
      html += '<div class="panel-alert-title">⚠️ ATENCIÓN: tienes ' + kpis.vencidos + ' prospectos con actividad vencida</div>';
      html += '<button class="btn btn-ghost btn-full" type="button" onclick="PWA.Lista.filtrarPor(\'vencido\')">Ver vencidos ahora →</button>';
      html += '</div>';
    }

    // KPIs
    html += '<div class="kpi-grid">';
    html += '<div class="kpi-card"><span class="kpi-valor kpi-accent">' + (kpis.total || 0) + '</span><span class="kpi-label">Prospectos</span></div>';
    html += '<div class="kpi-card"><span class="kpi-valor kpi-accent2">' + (kpis.calificados || 0) + '</span><span class="kpi-label">Calificados</span></div>';
    html += '<div class="kpi-card"><span class="kpi-valor kpi-warn">' + (kpis.visitas_hoy || 0) + '</span><span class="kpi-label">Visitas Hoy</span></div>';
    html += '<div class="kpi-card"><span class="kpi-valor kpi-danger">' + (kpis.vencidos || 0) + '</span><span class="kpi-label">Vencidos</span></div>';
    html += '</div>';

    if ((kpis.total || 0) > 0 && (kpis.calificados || 0) > 0) {
      html += '<div class="panel-feature-card">';
      html += '<div class="panel-week-summary">' + kpis.calificados + ' de ' + kpis.total + ' prospectos calificados</div>';
      html += '<div class="progress-track"><div class="progress-fill" style="width:' + porcentajeCalificados + '%"></div></div>';
      html += '<div class="panel-feature-subtitle" style="margin-top:10px;margin-bottom:0">' + porcentajeCalificados + '% del total activo ya está en levantamiento, cotización o seguimiento.</div>';
      html += '</div>';
    }

    html += '<p class="section-title">Proxima actividad del dia</p>';
    if (proximaActividad) {
      nombre = PWA.obtenerNombreProspecto(proximaActividad);
      horaTipo = PWA.formatoHora(proximaActividad.hora) + ' — ' + (proximaActividad.tipo_actividad || proximaActividad.concepto || 'Actividad');
      tel = PWA.obtenerTelefono(proximaActividad);
      waLink = PWA.obtenerWhatsappLink(proximaActividad);
      mapaLink = PWA.obtenerMapaLink(proximaActividad);

      html += '<div class="panel-feature-card panel-next-card">';
      html += '<div class="panel-feature-kicker">Hoy</div>';
      html += '<div class="panel-feature-title">' + nombre + '</div>';
      html += '<div class="panel-feature-subtitle">' + horaTipo + '</div>';
      html += '<div class="panel-action-row">';
      if (tel) {
        html += '<a class="btn btn-primary" style="flex:1" href="tel:' + tel.replace(/\s+/g, '') + '">📞 Llamar</a>';
      } else {
        html += '<button class="btn btn-primary" style="flex:1" type="button" onclick="PWA.toast(\'El prospecto no tiene telefono\', \'warn\')">📞 Llamar</button>';
      }
      if (waLink) {
        html += '<a class="btn btn-ghost" style="flex:1" target="_blank" href="' + waLink + '">💬 WhatsApp</a>';
      }
      if (mapaLink) {
        html += '<a class="btn btn-ghost" style="flex:1" target="_blank" href="' + mapaLink + '">📍 Ver en mapa</a>';
      } else {
        html += '<button class="btn btn-ghost" style="flex:1" type="button" onclick="PWA.abrirRutaActividad(PWA.state.panel.proximaActividad)">📍 Ver en mapa</button>';
      }
      html += '<button class="btn btn-ghost" style="flex:1" type="button" onclick="PWA.abrirGoogleCalendar(PWA.state.panel.proximaActividad)">📅 Calendario</button>';
      html += '</div>';
      html += '</div>';
    } else {
      html += '<div class="panel-feature-card panel-empty-card">';
      html += '<div class="panel-feature-title">Sin visitas programadas hoy</div>';
      html += '<div class="panel-feature-subtitle">No hay actividades activas con fecha ' + hoy + '</div>';
      html += '<button class="btn btn-ghost btn-full" type="button" onclick="PWA.navegarA(\'agenda\')">Ver agenda completa</button>';
      html += '</div>';
    }

    agendaSemana.forEach(function(item) {
      var fecha = (item.fecha_compromiso || '').substring(0, 10);
      if (fecha) {
        puntosSemana[fecha] = true;
        totalSemana++;
      }
    });

    html += '<p class="section-title">Resumen semanal</p>';
    html += '<div class="panel-feature-card">';
    html += '<div class="panel-week-summary">Esta semana: <strong>' + totalSemana + ' actividades programadas</strong></div>';
    html += '<div class="panel-week-strip">';
    diasSemana.forEach(function(dia) {
      html += '<div class="panel-week-day' + (dia.fecha === hoy ? ' active' : '') + '">';
      html += '<span class="panel-week-name">' + dia.nombre + '</span>';
      html += '<span class="panel-week-number">' + dia.numero + '</span>';
      html += '<span class="panel-week-dot' + (puntosSemana[dia.fecha] ? ' has-items' : '') + '"></span>';
      html += '</div>';
    });
    html += '</div>';
    html += '</div>';

    // Info de sesión
    html += '<p class="section-title" style="margin-top:16px">Sesión</p>';
    html += '<div class="card">';
    html += '<div style="font-size:13px;color:var(--pwa-muted)">Usuario: <strong style="color:var(--pwa-text)">' + (PWA.session.username || PWA.session.userid) + '</strong></div>';
    html += '<div style="font-size:12px;color:var(--pwa-muted);margin-top:4px">Hoy: ' + hoy + '</div>';
    html += '</div>';

    document.getElementById('view-panel').innerHTML = html;
  }
};

/* ============================================================
   ============================================================ */
PWA.CambiarEtapa = {
  // ⚠️ FEATURE FLAG — cambiar a null para activar para todos
  soloParaProspecto: null,  // prospecto de prueba
  
  // Matriz de transiciones permitidas
  // idstatus: 0=BD(Base de Datos) 1=A(Nuevo) 2=B(Levant) 3=C(CotSol) 4=D(CotEnt) 5=E(Descart) 6=V(Venta) 7=S(Seguim) 8=X(Cancel)
  transicionesPermitidas: {
    0: [1, 2, 5, 7, 8],        // BD → A, B, S, E, X (rescatar legacy atorados en BD)
    1: [2, 5, 7, 8],           // A → B, S, E, X
    2: [1, 3, 5, 7, 8],        // B → A, C, S, E, X
    3: [1, 2, 4, 5, 7, 8],     // C → B, A, D, S, E, X
    4: [1, 2, 3, 5, 6, 7, 8],  // D → A, B, C, V, S, E, X
    7: [1, 2, 3, 4, 5, 8]      // S → A, B, C, D, E, X (reactivar)
    // 5 (E), 6 (V), 8 (X) son terminales → no se pueden cambiar
  },

  // Info de cada etapa (nombre + color)
  etapas: {
    0: { label: 'Base de Datos',      letra: 'BD', color: '#64748b', avance: true  },
    1: { label: 'Nuevo',              letra: 'A', color: '#4f8ef7', avance: true  },
    2: { label: 'Levantamiento',      letra: 'B', color: '#22d3ee', avance: true  },
    3: { label: 'Cotización Solic.',  letra: 'C', color: '#f59e0b', avance: true  },
    4: { label: 'Cotización Entreg.', letra: 'D', color: '#fb923c', avance: true  },
    5: { label: 'Descartado',         letra: 'E', color: '#ef4444', terminal: true },
    6: { label: 'Venta',              letra: 'V', color: '#34d399', terminal: true },
    7: { label: 'Seguimiento',        letra: 'S', color: '#a855f7', avance: false },
    8: { label: 'Cancelado',          letra: 'X', color: '#8892a4', terminal: true }
  },
  
  esTerminal: function(idstatus) {
    var info = PWA.CambiarEtapa.etapas[idstatus];
    return !!(info && info.terminal);
  },
  
  estaHabilitadoPara: function(uMovimiento) {
    var flag = PWA.CambiarEtapa.soloParaProspecto;
    if (flag === null || typeof flag === 'undefined') return true;
    return parseInt(uMovimiento, 10) === parseInt(flag, 10);
  },
  
  abrir: function(uMovimiento, idstatusActual, nombre) {
    // Check de feature flag
    if (!PWA.CambiarEtapa.estaHabilitadoPara(uMovimiento)) {
      PWA.CambiarEtapa.mostrarAvisoPruebas();
      return;
    }
    
    idstatusActual = parseInt(idstatusActual, 10);
    
    // Check terminal
    if (PWA.CambiarEtapa.esTerminal(idstatusActual)) {
      PWA.toast('Esta etapa es final y no se puede modificar', 'warn');
      return;
    }
    
    var transiciones = PWA.CambiarEtapa.transicionesPermitidas[idstatusActual] || [];
    if (transiciones.length === 0) {
      PWA.toast('No hay transiciones permitidas desde esta etapa', 'warn');
      return;
    }
    
    // Armar botones
    var etapaActualInfo = PWA.CambiarEtapa.etapas[idstatusActual] || { label: 'Desconocida', letra: '?' };
    var botonesHtml = '';
    
    // Separar botones: avance, retroceso, laterales (S), terminales (E/X/V)
    var avance = [], retroceso = [], laterales = [], terminales = [];
    transiciones.forEach(function(idNuevo) {
      var info = PWA.CambiarEtapa.etapas[idNuevo];
      if (!info) return;
      if (info.terminal) {
        terminales.push({ id: idNuevo, info: info });
      } else if (idNuevo === 7) {
        laterales.push({ id: idNuevo, info: info });
      } else if (idNuevo > idstatusActual) {
        avance.push({ id: idNuevo, info: info });
      } else {
        retroceso.push({ id: idNuevo, info: info });
      }
    });
    
    function botonHtml(item, clase) {
      return '<button class="btn-etapa ' + (clase || '') + '" ' +
             'style="background:' + item.info.color + ';color:white;border:none;padding:14px 12px;border-radius:10px;font-size:14px;font-weight:600;width:100%;margin-bottom:8px;cursor:pointer;text-align:left;display:flex;align-items:center;gap:10px" ' +
             'onclick="PWA.CambiarEtapa.confirmar(' + uMovimiento + ',' + item.id + ',\'' + item.info.label.replace(/'/g, '\\\'') + '\')">' +
             '<span style="background:rgba(0,0,0,0.2);padding:4px 8px;border-radius:4px;font-size:11px;font-weight:700">' + item.info.letra + '</span>' +
             '<span>' + item.info.label + '</span>' +
             '</button>';
    }
    
    if (avance.length > 0) {
      botonesHtml += '<div style="font-size:11px;color:var(--pwa-muted);margin:8px 0 6px">AVANZAR</div>';
      avance.forEach(function(item) { botonesHtml += botonHtml(item); });
    }
    
    if (retroceso.length > 0) {
      botonesHtml += '<div style="font-size:11px;color:var(--pwa-muted);margin:12px 0 6px">RETROCEDER</div>';
      retroceso.forEach(function(item) { botonesHtml += botonHtml(item); });
    }
    
    if (laterales.length > 0) {
      botonesHtml += '<div style="font-size:11px;color:var(--pwa-muted);margin:12px 0 6px">OTRAS</div>';
      laterales.forEach(function(item) { botonesHtml += botonHtml(item); });
    }
    
    if (terminales.length > 0) {
      botonesHtml += '<div style="font-size:11px;color:var(--pwa-muted);margin:12px 0 6px">FINALIZAR (irreversible)</div>';
      terminales.forEach(function(item) { botonesHtml += botonHtml(item); });
    }
    
    // Render bottom sheet
    var backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop open';
    backdrop.id = 'cambiarEtapaBackdrop';
    backdrop.innerHTML = [
      '<div class="modal-sheet">',
        '<div class="modal-handle"></div>',
        '<div class="modal-title">Cambiar etapa</div>',
        '<div style="font-size:13px;color:var(--pwa-muted);margin-bottom:4px">' + (nombre || '') + '</div>',
        '<div style="font-size:12px;margin-bottom:16px">Etapa actual: <strong style="color:' + (PWA.CambiarEtapa.etapas[idstatusActual] ? PWA.CambiarEtapa.etapas[idstatusActual].color : '#888') + '">' + etapaActualInfo.label + ' (' + etapaActualInfo.letra + ')</strong></div>',
        '<div class="form-group">',
          '<label class="form-label">Fecha de compromiso para siguiente acción</label>',
          '<input class="form-input" id="etapaFechaCompromiso" type="date" value="' + PWA.fechaHoy() + '">',
        '</div>',
        '<div style="max-height:50vh;overflow-y:auto;padding:4px 0">',
          botonesHtml,
        '</div>',
        '<button class="btn btn-ghost btn-full" style="margin-top:12px" onclick="PWA.CambiarEtapa.cerrar()">Cancelar</button>',
      '</div>'
    ].join('');
    
    backdrop.addEventListener('click', function(e) {
      if (e.target === backdrop) PWA.CambiarEtapa.cerrar();
    });
    
    document.body.appendChild(backdrop);
    document.documentElement.classList.add('body-modal-open');
  },

  confirmar: function(uMovimiento, nuevoIdstatus, labelNuevo) {
    var esTerminal = PWA.CambiarEtapa.esTerminal(nuevoIdstatus);
    var fecha = document.getElementById('etapaFechaCompromiso').value || PWA.fechaHoy();
    
    var ejecutar = function() {
      PWA.CambiarEtapa.ejecutar(uMovimiento, nuevoIdstatus, fecha);
    };
    
    if (esTerminal) {
      var msj = '¿Marcar prospecto como "' + labelNuevo + '"?\n\nEste cambio es DEFINITIVO y no se puede deshacer.';
      if (confirm(msj)) ejecutar();
    } else {
      ejecutar();
    }
  },
  
  ejecutar: function(uMovimiento, nuevoIdstatus, fecha) {
    var prospecto = PWA.state.prospectoActivo || 
                    (PWA.state.prospectos.filter(function(p) { return p.u_movimiento == uMovimiento; })[0]);
    var salesmanActual = prospecto ? (prospecto.salesman || '') : '';
    
    var payload = {
      option: 'GuardarCambioEstatus',
      u_movimiento: String(uMovimiento),
      cmbCambiarEstatus: String(nuevoIdstatus),
      cmbVendedor03: String(salesmanActual),
      fechacompromiso: fecha,
      userid: PWA.session.userid
    };
    
    console.log('[CambiarEtapa] Enviando:', payload);
    
    if (!navigator.onLine) {
      SyncDB.encolar('cambio_etapa', payload, function() {
        PWA.toast('Guardado offline — se enviará al reconectar', 'warn');
        PWA.CambiarEtapa.cerrar();
      });
      return;
    }
    
    PWA.apiPost('api/prospectos.php', payload, function(err, data) {
      if (err || !data || !data.result) {
        var msj = (data && data.msjError) ? data.msjError : 'Error al cambiar etapa';
        PWA.toast(msj, 'warn');
        // Si fue error de red, encolar
        if (err) {
          SyncDB.encolar('cambio_etapa', payload);
          PWA.toast('Guardado offline', 'warn');
        }
        return;
      }
      
      PWA.toast('Etapa actualizada ✓', 'ok');
      PWA.CambiarEtapa.cerrar();
      
      // Actualizar state local
      if (prospecto) {
        var infoEtapa = PWA.CambiarEtapa.etapas[nuevoIdstatus];
        prospecto.idstatus = String(nuevoIdstatus);
        prospecto.etapa = infoEtapa ? infoEtapa.label : prospecto.etapa;
        prospecto.nombrealterno = infoEtapa ? infoEtapa.letra : prospecto.nombrealterno;
      }
      
      // Refrescar vista actual
      if (PWA.state.vistaActual === 'detalle' && PWA.state.prospectoActivo) {
        renderDetalle(PWA.state.prospectoActivo);
      }
      
      // Invalidar cache para que Lista recargue la próxima
      SyncDB.guardarProspectosCache(PWA.state.prospectos);
    });
  },
  
  cerrar: function() {
    var bd = document.getElementById('cambiarEtapaBackdrop');
    if (bd) bd.parentNode.removeChild(bd);
    if (!document.querySelector('.modal-backdrop.open')) {
      document.documentElement.classList.remove('body-modal-open');
    }
  },
  
  mostrarAvisoPruebas: function() {
    var backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop open';
    backdrop.id = 'avisoPruebasBackdrop';
    backdrop.innerHTML = [
      '<div class="modal-sheet" style="text-align:center;padding:24px 20px">',
        '<div style="font-size:48px;margin-bottom:12px">🧪</div>',
        '<div style="font-size:18px;font-weight:700;margin-bottom:10px">Función en pruebas</div>',
        '<div style="font-size:14px;color:var(--pwa-muted);line-height:1.5;margin-bottom:8px">',
          'Esta funcionalidad está en fase de pruebas. Solo está habilitada para un prospecto específico de QA.',
        '</div>',
        '<div style="font-size:13px;color:var(--pwa-muted);line-height:1.5;margin-bottom:20px">',
          'Si necesitas cambiar la etapa de este prospecto, usa el ERP por ahora.',
        '</div>',
        '<button class="btn btn-primary btn-full" onclick="PWA.CambiarEtapa.cerrarAviso()">Entendido</button>',
      '</div>'
    ].join('');
    
    backdrop.addEventListener('click', function(e) {
      if (e.target === backdrop) PWA.CambiarEtapa.cerrarAviso();
    });
    
    document.body.appendChild(backdrop);
    document.documentElement.classList.add('body-modal-open');
  },

  cerrarAviso: function() {
    var bd = document.getElementById('avisoPruebasBackdrop');
    if (bd) bd.parentNode.removeChild(bd);
    if (!document.querySelector('.modal-backdrop.open')) {
      document.documentElement.classList.remove('body-modal-open');
    }
  }
};

/* ============================================================
   ============================================================ */
PWA.Lista = {
  etapas: [],

  cargar: function() {
    var el = document.getElementById('view-lista');
    el.innerHTML = '<div class="spinner"></div>';
    prospectosOffset = 0;
    prospectosFinished = false;
    PWA.state.prospectos = [];
    PWA.Lista.cargarMas(true);

    if (PWA.Lista.etapas.length === 0) {
      PWA.apiPost('api/prospectos.php', { option: 'TraerEstatus' }, function(err, data) {
        if (!err && data && data.result) {
          PWA.Lista.etapas = data.contenido || [];
          PWA.Lista.renderizar();
        }
      });
    }
  },

  cargarMas: function(reset) {
    if (typeof reset === 'undefined') reset = false;
    if (prospectosLoading || prospectosFinished) return;

    prospectosLoading = true;

    if (reset) {
      prospectosOffset = 0;
      prospectosFinished = false;
      PWA.state.prospectos = [];
    }

    PWA.Lista.actualizarLoader();

    PWA.apiPost('api/prospectos.php', {
      option: 'TraerProspectos',
      limit: prospectosLimit,
      offset: prospectosOffset,
      filtro: filtroActual,
      busqueda: busquedaActual,
      userid: PWA.session.userid
    }, function(err, data) {
      if (err || !data || !data.result) {
        if (reset) {
          SyncDB.leerProspectosCache(function(prospectos) {
            PWA.state.prospectos = prospectos;
            PWA.Lista.renderizar();
            if (prospectos.length > 0 && !navigator.onLine) {
              PWA.toast('Sin conexión — mostrando datos guardados', 'warn');
            }
            prospectosLoading = false;
            prospectosFinished = true;
            PWA.Lista.actualizarLoader();
          });
          return;
        }
        prospectosLoading = false;
        PWA.Lista.actualizarLoader();
        return;
      }

      var nuevos = data.contenido || [];

      if (reset) {
        PWA.state.prospectos = nuevos;
        PWA.Lista.renderizar();
      } else {
        PWA.state.prospectos = PWA.state.prospectos.concat(nuevos);
        PWA.Lista.renderAppend(nuevos);
      }

      SyncDB.guardarProspectosCache(PWA.state.prospectos);

      if (nuevos.length === 0 || nuevos.length < prospectosLimit) {
        prospectosFinished = true;
      }

      prospectosOffset += nuevos.length;
      prospectosLoading = false;
      PWA.Lista.actualizarLoader();
    });
  },

  filtrarPor: function(estado) {
    var filtro = 'todos';

    if (estado === 'hoy') {
      filtro = 'hoy';
    } else if (estado === 'vencido') {
      filtro = 'vencidos';
    } else if (estado === 'calificado') {
      filtro = 'calificados';
    }

    aplicarFiltro(filtro);
  },

  renderizar: function() {
    var el = document.getElementById('view-lista');
    var filtrados = PWA.Lista.filtrarProspectos(PWA.state.prospectos);

    var html = '';

    // Buscador
    html += '<div class="search-bar">';
    html += '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--pwa-muted)" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
    html += '<input type="text" id="inputBusqueda" placeholder="Buscar prospecto..." value="' + busquedaActual + '" oninput="buscarProspectos(this.value)">';
    html += '</div>';

    // Pills filtro
    html += '<div class="filter-pills">';
    html += '<button class="pill' + (filtroActual === 'todos' ? ' active' : '') + '" onclick="aplicarFiltro(\'todos\')">Todos</button>';
    html += '<button class="pill' + (filtroActual === 'hoy' ? ' active' : '') + '" onclick="aplicarFiltro(\'hoy\')">Hoy</button>';
    html += '<button class="pill' + (filtroActual === 'vencidos' ? ' active' : '') + '" onclick="aplicarFiltro(\'vencidos\')">Vencidos</button>';
    html += '<button class="pill' + (filtroActual === 'calificados' ? ' active' : '') + '" onclick="aplicarFiltro(\'calificados\')">Calificados</button>';
    html += '</div>';

    // Lista
    html += '<div id="prospectListItems">';
    if (filtrados.length === 0) {
      html += '<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-text">Sin resultados</div></div>';
    } else {
      filtrados.forEach(function(p) {
        html += PWA.Lista.renderCard(p);
      });
    }
    html += '</div>';
    html += '<div id="prospectListLoader" style="padding:16px;text-align:center;color:var(--pwa-muted);font-size:12px"></div>';

    el.innerHTML = html;
    PWA.Lista.actualizarLoader();

    // Re-enfocar buscador si había texto
    if (busquedaActual) {
      var inp = document.getElementById('inputBusqueda');
      if (inp) { inp.focus(); inp.setSelectionRange(busquedaActual.length, busquedaActual.length); }
    }
  },

  renderAppend: function(prospectos) {
    var contenedor = document.getElementById('prospectListItems');
    var filtrados = PWA.Lista.filtrarProspectos(prospectos);
    var html = '';

    if (!contenedor) {
      PWA.Lista.renderizar();
      return;
    }

    if (filtrados.length === 0) {
      PWA.Lista.actualizarLoader();
      return;
    }

    if (contenedor.querySelector('.empty-state')) {
      contenedor.innerHTML = '';
    }

    filtrados.forEach(function(p) {
      html += PWA.Lista.renderCard(p);
    });

    contenedor.insertAdjacentHTML('beforeend', html);
    PWA.Lista.actualizarLoader();
  },

  filtrarProspectos: function(prospectos) {
    return prospectos;
  },

  actualizarLoader: function() {
    var loader = document.getElementById('prospectListLoader');
    if (!loader) return;

    if (prospectosLoading) {
      loader.textContent = 'Cargando...';
      return;
    }

    if (prospectosFinished && PWA.state.prospectos.length > 0) {
      loader.textContent = 'No hay mas registros';
      return;
    }

    loader.textContent = '';
  },

  renderCard: function(p) {
    var nombre  = p.prospecto || p.nombre || p.DebtorName || 'Sin nombre';
    var tel     = p.phoneno || p.telefono || p.PhoneNo || '';
    var sector  = p.salesmanname || p.SectComercialNombre || '';
    var valor   = p.valor_estimado ? '$' + parseInt(p.valor_estimado).toLocaleString() : '';
    var etapaNombre = p.etapa || p.etapaNombre || p.statusNombre || '';
    var estado  = PWA.estadoProspecto(p.fecha_actividad);
    var initials = PWA.iniciales(nombre);
    var umov = p.u_movimiento || '';
    var telHref = tel ? 'tel:' + tel.replace(/\s+/g,'') : '#';
    var mapsHref = (p.latitude && p.longitude)
      ? 'https://maps.google.com/?q=' + p.latitude + ',' + p.longitude
      : '#';

    var html = '';
    html += '<div class="prospect-card estado-' + estado + '" onclick="verDetalle(\'' + umov + '\')">';
    html += '<div class="prospect-avatar">' + initials + '</div>';
    html += '<div class="prospect-info">';
    html += '<div class="prospect-nombre">' + nombre + '</div>';
    html += '<div class="prospect-sub">' + (sector || tel || '—') + '</div>';
    if (p._offline) html += '<span class="prospect-etapa" style="background:var(--pwa-warn);color:#fff;font-size:10px">Pendiente sync</span>';
    if (etapaNombre) html += '<span class="prospect-etapa">' + etapaNombre + '</span>';
    if (valor) html += '<span class="prospect-etapa" style="margin-left:4px;color:var(--pwa-accent2)">' + valor + '</span>';
    html += '</div>';
    html += '<div class="prospect-actions" onclick="event.stopPropagation()">';
    if (tel) {
      html += '<a href="' + telHref + '" class="icon-btn" title="Llamar">';
      html += '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.18 11a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.09 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';
      html += '</a>';
    }
    html += '<button class="icon-btn" title="Chat" onclick="PWA.Chat.abrir(\'' + umov + '\')">';
    html += '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
    html += '</button>';
    html += '</div>';
    html += '</div>';
    return html;
  },
};

/* ============================================================
   ============================================================ */
PWA.Detalle = {
  _prospecto: null,

  abrirCalendario: function() {
    var p = PWA.Detalle._prospecto;
    if (!p || !p.fecha_actividad) return;
    PWA.abrirGoogleCalendar({
      fecha_compromiso: p.fecha_actividad,
      hora:             p.hora || '09:00:00',
      titulo:           p.concepto || ('Actividad — ' + PWA.obtenerNombreProspecto(p)),
      descripcion:      p.descripcion || '',
      nombreProspecto:  PWA.obtenerNombreProspecto(p),
      u_movimiento:     p.u_movimiento || '',
      direccion:        p.direccion || ''
    });
  },

  abrir: function(uMovimiento) {
    if (!uMovimiento) return;

    var backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop open';
    backdrop.id = 'detalleBackdrop';
    backdrop.innerHTML = '<div class="modal-sheet"><div class="modal-handle"></div><div class="spinner"></div></div>';
    document.body.appendChild(backdrop);
    document.documentElement.classList.add('body-modal-open');

    backdrop.addEventListener('click', function(e) {
      if (e.target === backdrop) PWA.Detalle.cerrar();
    });

    // Buscar en cache local
    var p = PWA.state.prospectos.filter(function(x) { return x.u_movimiento == uMovimiento; })[0];
    if (p) {
      PWA.Detalle.renderizar(p);
    } else {
      PWA.apiPost('api/prospectos.php', {
        option: 'TraerProspectos',
        limit: 50,
        offset: 0,
        u_movimiento: uMovimiento,
        userid: PWA.session.userid
      }, function(err, data) {
        var prosp = (data && data.contenido && data.contenido[0]) ? data.contenido[0] : null;
        if (prosp) PWA.Detalle.renderizar(prosp);
      });
    }
  },

  renderizar: function(p) {
    var sheet = document.querySelector('#detalleBackdrop .modal-sheet');
    if (!sheet) return;

    PWA.Detalle._prospecto = p; // guardar para abrirCalendario

    var nombre  = PWA.obtenerNombreProspecto(p);
    var tel     = PWA.obtenerTelefono(p);
    var email   = p.email || p.correo || '';
    var sector  = p.salesmanname || p.SectComercialNombre || '';
    var etapaNombre = p.etapa || p.etapaNombre || p.statusNombre || '';
    var estado  = PWA.estadoProspecto(p.fecha_actividad);
    var umov    = p.u_movimiento || '';

    var colorEstado = {
      vencido: 'var(--pwa-danger)',
      hoy: 'var(--pwa-warn)',
      corriente: 'var(--pwa-accent2)',
      nuevo: 'var(--pwa-accent)'
    }[estado] || 'var(--pwa-accent)';

    sheet.innerHTML = [
      '<div class="modal-handle"></div>',
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">',
        '<div class="prospect-avatar" style="width:52px;height:52px;border-radius:26px;font-size:18px;border:3px solid ' + colorEstado + '">' + PWA.iniciales(nombre) + '</div>',
        '<div><div style="font-size:17px;font-weight:700">' + nombre + '</div>',
        (etapaNombre ? '<div style="font-size:12px;color:var(--pwa-muted)">' + etapaNombre + '</div>' : ''),
        '</div></div>',
      '<div style="display:flex;gap:8px;margin-bottom:16px">',
        (tel ? '<a href="tel:' + tel.replace(/\s+/g,'') + '" class="btn btn-ghost" style="flex:1;font-size:13px">📞 Llamar</a>' : ''),
        '<button class="btn btn-primary" style="flex:1;font-size:13px" onclick="PWA.NuevaActividad.abrir(\'' + umov + '\',\'' + nombre.replace(/'/g,'') + '\')">+ Actividad</button>',
      '</div>',
      (function() {
        var coords = PWA.extraerCoords(p);
        if (coords) {
          return '<button class="btn btn-ghost btn-full" style="margin-bottom:8px" onclick="PWA.Mapa.trazarRuta(' + coords.lat + ',' + coords.lng + ')">🧭 Trazar ruta</button>';
        }
        return '';
      })(),
      (sector ? '<div class="card2" style="margin-bottom:10px"><div style="font-size:11px;color:var(--pwa-muted);margin-bottom:4px">SECTOR</div><div style="font-size:14px">' + sector + '</div></div>' : ''),
      (tel ? '<div class="card2" style="margin-bottom:10px"><div style="font-size:11px;color:var(--pwa-muted);margin-bottom:4px">TELÉFONO</div><div style="font-size:14px">' + tel + '</div></div>' : ''),
      (p.fecha_actividad
        ? '<div class="card2" style="margin-bottom:10px;border-left:3px solid ' + colorEstado + '"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px"><div style="font-size:11px;color:var(--pwa-muted)">PRÓXIMA ACTIVIDAD</div><button class="gcal-btn" title="Agregar a Google Calendar" onclick="PWA.Detalle.abrirCalendario()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><span style="margin-left:4px">Cal</span></button></div><div style="font-size:14px">' + p.fecha_actividad.substring(0,10) + '</div></div>'
        : ''),
      '<button class="btn btn-ghost btn-full" style="margin-top:8px" onclick="PWA.Chat.abrir(\'' + umov + '\');PWA.Detalle.cerrar()">💬 Chat</button>',
      '<button class="btn btn-ghost btn-full" style="margin-top:8px;color:var(--pwa-muted)" onclick="PWA.Detalle.cerrar()">Cerrar</button>'
    ].join('');
  },

  cerrar: function() {
    var bd = document.getElementById('detalleBackdrop');
    if (bd) bd.parentNode.removeChild(bd);
    if (!document.querySelector('.modal-backdrop.open')) {
      document.documentElement.classList.remove('body-modal-open');
    }
  }
};

/* ============================================================
   ============================================================ */
PWA.NuevaActividad = {
  _nombreProspecto: '',

  obtenerOpcionesTipo: function() {
    var tipos = PWA.state.tiposActividad || [];
    var html = '';

    if (tipos.length === 0) {
      return '<option value="1">Actividad</option>';
    }

    tipos.forEach(function(tipo) {
      html += '<option value="' + tipo.id + '">' + tipo.descripcion + '</option>';
    });

    return html;
  },

  cargarTipos: function(callback) {
    if ((PWA.state.tiposActividad || []).length > 0) {
      if (callback) callback(PWA.state.tiposActividad);
      return;
    }

    PWA.apiPost('api/agenda.php', { opcion: 'TraerTiposActividad' }, function(err, data) {
      if (!err && data && data.result) {
        PWA.state.tiposActividad = data.contenido || [];
      }
      if (callback) callback(PWA.state.tiposActividad || []);
    });
  },

  abrir: function(uMovimiento, nombreProspecto) {
    PWA.NuevaActividad._nombreProspecto = nombreProspecto || '';
    var backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop open';
    backdrop.id = 'actividadBackdrop';
    var hoy = PWA.fechaHoy();

    backdrop.innerHTML = [
      '<div class="modal-sheet">',
        '<div class="modal-handle"></div>',
        '<div class="modal-title">Nueva actividad</div>',
        '<div style="font-size:13px;color:var(--pwa-muted);margin-bottom:14px">' + (nombreProspecto || '') + '</div>',
        '<div class="form-group">',
          '<label class="form-label">Tipo</label>',
          '<select class="form-select" id="actTipo">',
            PWA.NuevaActividad.obtenerOpcionesTipo(),
          '</select>',
        '</div>',
        '<div class="form-group">',
          '<label class="form-label">Título <span style="font-weight:400;color:var(--pwa-muted);font-size:11px">(opcional)</span></label>',
          '<input class="form-input" id="actTitulo" type="text" placeholder="Ej: Segundo intento, no contestó">',
        '</div>',
        '<div class="form-group">',
          '<label class="form-label">Fecha</label>',
          '<input class="form-input" id="actFecha" type="date" value="' + hoy + '">',
        '</div>',
        '<div class="form-group">',
          '<label class="form-label">Hora</label>',
          '<input class="form-input" id="actHora" type="time" value="09:00">',
        '</div>',
        '<div class="form-group">',
          '<label class="form-label">Descripción</label>',
          '<textarea class="form-textarea" id="actDesc" placeholder="Detalles..."></textarea>',
        '</div>',
        '<div style="display:flex;gap:8px">',
          '<button class="btn btn-ghost" style="flex:1" onclick="PWA.NuevaActividad.cerrar()">Cancelar</button>',
          '<button class="btn btn-primary" style="flex:1" onclick="PWA.NuevaActividad.guardar(\'' + uMovimiento + '\')">Guardar</button>',
        '</div>',
      '</div>'
    ].join('');

    backdrop.addEventListener('click', function(e) {
      if (e.target === backdrop) PWA.NuevaActividad.cerrar();
    });

    document.body.appendChild(backdrop);
    document.documentElement.classList.add('body-modal-open');

    PWA.NuevaActividad.cargarTipos(function() {
      var select = document.getElementById('actTipo');
      if (select) {
        select.innerHTML = PWA.NuevaActividad.obtenerOpcionesTipo();
      }
    });
  },

  guardar: function(uMovimiento) {
    var tipoSelect = document.getElementById('actTipo');
    var tipo  = tipoSelect.value;
    var titulo = document.getElementById('actTitulo').value.trim();
    var fecha = document.getElementById('actFecha').value;
    var hora  = document.getElementById('actHora').value;
    var desc  = document.getElementById('actDesc').value.trim();

    // Título opcional: si vacío, usar el nombre del tipo como default
    if (!titulo) {
      var tipoTextoDefault = (tipoSelect && tipoSelect.options[tipoSelect.selectedIndex])
        ? tipoSelect.options[tipoSelect.selectedIndex].text
        : 'Actividad';
      titulo = tipoTextoDefault;
    }
    if (!fecha)  { PWA.toast('Selecciona fecha', 'warn'); return; }

    var partesHora = (hora || '09:00').split(':');
    var tipoTexto = (tipoSelect && tipoSelect.options[tipoSelect.selectedIndex])
      ? tipoSelect.options[tipoSelect.selectedIndex].text
      : 'Actividad';
    var payload = {
      txtMovimiento: uMovimiento,
      cmbTipoActividad: tipo,
      txtTituloActividad: titulo,
      txtFechaActividad: fecha,
      txtHora: partesHora[0] || '09',
      txtMinutos: partesHora[1] || '00',
      txtHoraActividad: (hora || '09:00') + ':00',
      txtDescripcionActividad: desc,
      u_movimiento: uMovimiento,
      TipoMovimientoId: tipo,
      tipoTexto: tipoTexto,
      titulo: titulo,
      fecha: fecha,
      hora: (hora || '09:00') + ':00',
      concepto: titulo,
      descripcion: desc
    };

    if (navigator.onLine) {
      PWA.apiPost('api/prospectos.php', {
        option: 'GuardarActividad',
        txtMovimiento: payload.txtMovimiento,
        cmbTipoActividad: payload.cmbTipoActividad,
        txtTituloActividad: payload.txtTituloActividad,
        txtFechaActividad: payload.txtFechaActividad,
        txtHora: payload.txtHora,
        txtMinutos: payload.txtMinutos,
        txtHoraActividad: payload.txtHoraActividad,
        txtDescripcionActividad: payload.txtDescripcionActividad,
        userid: PWA.session.userid
      }, function(err, data) {
        if (!err && data && data.result) {
          PWA.NuevaActividad.cerrar();
          var actParaCalendario = {
            fecha_compromiso: payload.fecha,
            hora:             payload.hora,
            titulo:           payload.titulo,
            descripcion:      payload.descripcion,
            nombreProspecto:  PWA.NuevaActividad._nombreProspecto,
            u_movimiento:     payload.u_movimiento,
            direccion:        ''
          };
          PWA.toastAccion('Actividad guardada', '📅 Agregar al calendario', function() {
            PWA.abrirGoogleCalendar(actParaCalendario);
          });
          if (PWA.state.vistaActual === 'detalle' && PWA.state.prospectoActivo && PWA.state.prospectoActivo.u_movimiento == uMovimiento) {
            PWA.state.prospectoActivo.fecha_actividad = payload.fecha;
            PWA.state.prospectoActivo.hora = payload.hora;
            PWA.state.prospectoActivo.tipo_actividad = payload.tipoTexto;
            PWA.state.prospectoActivo.descripcion = payload.descripcion;
            renderDetalle(PWA.state.prospectoActivo);
          }
        } else {
          PWA.toast('Error al guardar — guardando offline', 'warn');
          SyncDB.encolar('nueva_actividad', payload);
          PWA.NuevaActividad.cerrar();
        }
      });
    } else {
      SyncDB.encolar('nueva_actividad', payload, function() {
        PWA.toast('Guardado offline — se enviará al reconectar', 'warn');
        PWA.NuevaActividad.cerrar();
      });
    }
  },

  cerrar: function() {
    var bd = document.getElementById('actividadBackdrop');
    if (bd) bd.parentNode.removeChild(bd);
    if (!document.querySelector('.modal-backdrop.open')) {
      document.documentElement.classList.remove('body-modal-open');
    }
  }
};

/* ============================================================
   NUEVO PROSPECTO — formulario de alta con GPS (bridge ERP)
   ============================================================ */
PWA.NuevoProspecto = {
  _gps: null,
  _combos: { vendedores: [], fuentes: [], loadedV: false, loadedF: false },

  abrir: function(opcionesOcoords) {
    // Acepta:
    //   PWA.NuevoProspecto.abrir()                       → flujo normal (GPS automatico)
    //   PWA.NuevoProspecto.abrir({lat, lng})             → prellenar con coords (tap en mapa)
    //   PWA.NuevoProspecto.abrir({lat, lng, nombre})     → prellenar nombre tambien
    this._gps = null;
    this._combos = { vendedores: [], fuentes: [], loadedV: false, loadedF: false };
    this._coordsIniciales = null;
    this._nombreInicial   = '';

    if (opcionesOcoords && typeof opcionesOcoords === 'object') {
      if (opcionesOcoords.lat && opcionesOcoords.lng) {
        this._coordsIniciales = {
          lat: parseFloat(opcionesOcoords.lat),
          lng: parseFloat(opcionesOcoords.lng)
        };
      }
      if (opcionesOcoords.nombre) this._nombreInicial = String(opcionesOcoords.nombre);
    }

    this._renderForm();

    // Si venimos de un tap en mapa, prellenar y pedir direccion desde coords
    if (this._coordsIniciales) {
      var inp = document.getElementById('np_linkMapa');
      if (inp) {
        inp.value = this._coordsIniciales.lat.toFixed(6) + ',' +
                    this._coordsIniciales.lng.toFixed(6);
      }
      if (this._nombreInicial) {
        var nom = document.getElementById('np_nombre');
        if (nom) nom.value = this._nombreInicial;
      }
      // Lanzar reverseGeocode en background
      var self = this;
      setTimeout(function() { self._llenarDireccionDesdeInput(false); }, 100);
      // Tambien iniciar GPS watcher por si se quiere actualizar
      this._iniciarGPS();
    } else {
      this._iniciarGPS();
    }

    this._cargarCombos();
    document.documentElement.classList.add('body-modal-open');
  },

  cerrar: function() {
    var bd = document.getElementById('nuevoProspectoBackdrop');
    if (bd) bd.parentNode.removeChild(bd);
    if (!document.querySelector('.modal-backdrop.open')) {
      document.documentElement.classList.remove('body-modal-open');
    }
    // Limpiar marker temporal si se vino desde el mapa
    if (typeof PWA !== 'undefined' && PWA.Mapa && PWA.Mapa._tempMarker && PWA.Mapa.map) {
      try { PWA.Mapa.map.removeLayer(PWA.Mapa._tempMarker); } catch (e) {}
      PWA.Mapa._tempMarker = null;
    }
  },

  _renderForm: function() {
    var self = this;
    var bd = document.createElement('div');
    bd.className = 'modal-backdrop open';
    bd.id = 'nuevoProspectoBackdrop';
    bd.innerHTML = [
      '<div class="modal-sheet wizard-sheet">',
        '<div class="modal-handle"></div>',
        '<div class="wizard-header">',
          '<div class="wizard-title-wrap">',
            '<div class="modal-title" style="margin-bottom:4px">Nuevo prospecto</div>',
            '<div class="wizard-subtitle">Crea un prospecto y abre el flujo A-D</div>',
          '</div>',
          '<button class="wizard-close" type="button" onclick="PWA.NuevoProspecto.cerrar()">✕</button>',
        '</div>',
        '<div class="wizard-scroll-body">',
          this._camposHTML(),
          '<div class="wizard-footer" style="display:flex;gap:8px">',
            '<button class="btn btn-ghost" type="button" onclick="PWA.NuevoProspecto.cerrar()" style="flex:1">Cancelar</button>',
            '<button class="btn btn-primary" type="button" onclick="PWA.NuevoProspecto.guardar()" style="flex:1">Guardar y continuar</button>',
          '</div>',
        '</div>',
      '</div>'
    ].join('');
    bd.addEventListener('click', function(e) { if (e.target === bd) self.cerrar(); });
    document.body.appendChild(bd);
  },

  _camposHTML: function() {
    var req = '<span style="color:var(--pwa-danger)">*</span>';
    return [
      '<div class="form-group"><label class="form-label">Nombre comercial ' + req + '</label>',
        '<input id="np_nombre" class="form-input" placeholder="Nombre del prospecto"></div>',
      '<div class="form-group"><label class="form-label">Teléfono</label>',
        '<input id="np_tel" class="form-input" inputmode="tel"></div>',
      '<div class="form-group"><label class="form-label">Email</label>',
        '<input id="np_email" class="form-input" inputmode="email"></div>',
      '<div class="form-group"><label class="form-label">Vendedor ' + req + '</label>',
        '<select id="np_vendedor" class="form-input"><option value="">Cargando...</option></select></div>',
      '<div class="form-group"><label class="form-label">Fuente ' + req + '</label>',
        '<select id="np_fuente" class="form-input"><option value="">Cargando...</option></select></div>',
      '<div class="form-group"><label class="form-label">Ubicación GPS ' + req + '</label>',
        '<div style="display:flex;gap:6px">',
          '<input id="np_linkMapa" class="form-input" style="flex:1" placeholder="lat,lng (ej. 20.56,-100.41)">',
          '<button class="btn btn-ghost" type="button" onclick="PWA.NuevoProspecto._reubicar()" title="Obtener mi ubicación">📍</button>',
          '<button class="btn btn-ghost" type="button" onclick="PWA.NuevoProspecto._llenarDireccionDesdeInput(true)" title="Llenar dirección desde coordenadas">🏠</button>',
        '</div>',
        '<div id="np_gps_status" style="font-size:11px;color:var(--pwa-muted);margin-top:4px">Obteniendo ubicación...</div>',
      '</div>',
      '<div class="form-group"><label class="form-label">Comentarios</label>',
        '<textarea id="np_coments" class="form-textarea"></textarea></div>',
      '<details class="card2 wizard-card-soft" style="margin-bottom:10px">',
        '<summary style="cursor:pointer;font-size:12px;color:var(--pwa-muted);padding:4px 0">Dirección (opcional)</summary>',
        '<div style="margin-top:10px">',
          '<div class="form-group"><label class="form-label">Calle y número</label><input id="np_dir" class="form-input"></div>',
          '<div class="form-group"><label class="form-label">Colonia</label><input id="np_col" class="form-input"></div>',
          '<div class="form-group"><label class="form-label">Ciudad</label><input id="np_ciu" class="form-input"></div>',
          '<div class="form-group"><label class="form-label">Estado</label><input id="np_est" class="form-input"></div>',
          '<div class="form-group"><label class="form-label">CP</label><input id="np_cp" class="form-input" inputmode="numeric"></div>',
        '</div>',
      '</details>',
      '<details class="card2 wizard-card-soft">',
        '<summary style="cursor:pointer;font-size:12px;color:var(--pwa-muted);padding:4px 0">Datos fiscales (opcional)</summary>',
        '<div style="margin-top:10px">',
          '<div class="form-group"><label class="form-label">RFC</label><input id="np_rfc" class="form-input"></div>',
          '<div class="form-group"><label class="form-label">Giro</label><input id="np_giro" class="form-input"></div>',
        '</div>',
      '</details>'
    ].join('');
  },

  _iniciarGPS: function() {
    var self = this;
    if (!navigator.geolocation) {
      var s = document.getElementById('np_gps_status');
      if (s) s.textContent = 'Tu navegador no soporta GPS — ingresa coordenadas manualmente';
      return;
    }
    navigator.geolocation.getCurrentPosition(
      function(pos) {
        var coord = pos.coords.latitude.toFixed(6) + ',' + pos.coords.longitude.toFixed(6);
        self._gps = coord;
        var inp = document.getElementById('np_linkMapa');
        var st  = document.getElementById('np_gps_status');
        if (inp && !inp.value) inp.value = coord;
        if (st) { st.textContent = '✓ Ubicación detectada'; st.style.color = 'var(--pwa-ok)'; }
        // Autocompletar direccion (sin forzar: solo llena campos vacios)
        self._llenarDireccion(coord, false);
      },
      function(err) {
        var st = document.getElementById('np_gps_status');
        if (st) { st.textContent = 'No se pudo obtener GPS — ingresa coordenadas manualmente'; st.style.color = 'var(--pwa-warn)'; }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  },

  _reubicar: function() {
    var st = document.getElementById('np_gps_status');
    if (st) { st.textContent = 'Buscando ubicación...'; st.style.color = 'var(--pwa-muted)'; }
    this._iniciarGPS();
  },

  // Lee coordenadas del input y dispara el autollenado.
  // forzar=true sobrescribe lo que el usuario ya escribio.
  _llenarDireccionDesdeInput: function(forzar) {
    var coord = (document.getElementById('np_linkMapa') || {}).value || '';
    coord = String(coord).trim();
    if (!/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(coord)) {
      PWA.toast('Coordenadas invalidas (formato lat,lng)', 'warn');
      return;
    }
    this._llenarDireccion(coord, !!forzar);
  },

  // Llama a api/geo.php ReverseGeocode y pobla los campos de direccion.
  _llenarDireccion: function(coord, forzar) {
    var parts = String(coord).split(',');
    var lat = parseFloat(parts[0]);
    var lng = parseFloat(parts[1]);
    if (!lat || !lng) return;

    var st = document.getElementById('np_gps_status');
    var prev = st ? st.textContent : '';
    if (st) { st.textContent = '🔎 Buscando direccion...'; st.style.color = 'var(--pwa-muted)'; }

    PWA.apiPost('api/geo.php', { opcion: 'ReverseGeocode', lat: lat, lng: lng }, function(err, data) {
      if (err || !data || !data.result) {
        if (st) { st.textContent = prev || '✓ Ubicación detectada'; st.style.color = 'var(--pwa-ok)'; }
        if (forzar) {
          PWA.toast((data && data.msjError) ? data.msjError : 'No se pudo obtener la direccion', 'warn');
        }
        return;
      }

      var c = data.contenido || {};
      var pares = [
        ['np_dir', c.calle],
        ['np_col', c.colonia],
        ['np_ciu', c.ciudad],
        ['np_est', c.estado],
        ['np_cp',  c.cp]
      ];
      var llenados = 0;
      pares.forEach(function(p) {
        var el = document.getElementById(p[0]);
        if (!el) return;
        var val = (p[1] == null) ? '' : String(p[1]).trim();
        if (!val) return;
        // Solo llenar campos vacios, salvo que se haya pedido forzar
        if (forzar || !el.value || !el.value.trim()) {
          el.value = val;
          llenados++;
        }
      });

      if (st) {
        st.textContent = llenados > 0
          ? '✓ Dirección autocompletada (' + llenados + ' campos)'
          : '✓ Ubicación detectada';
        st.style.color = 'var(--pwa-ok)';
      }

      // Abrir el <details> de Direccion si estaba cerrado y se llenaron campos
      if (llenados > 0) {
        var detalles = document.querySelectorAll('.wizard-scroll-body details');
        for (var i = 0; i < detalles.length; i++) {
          var sum = detalles[i].querySelector('summary');
          if (sum && /Direcci/i.test(sum.textContent || '')) {
            detalles[i].open = true;
            break;
          }
        }
      }
    });
  },

  _cargarCombos: function() {
    var self = this;

    // --- Vendedores ---
    if (navigator.onLine) {
      PWA.apiPost('api/prospectos.php', { option: 'TraerVendedoresPWA' }, function(err, data) {
        self._combos.loadedV = true;
        if (!err && data && data.result) {
          self._combos.vendedores = data.contenido || [];
          // Guardar en cache para uso offline
          if (typeof SyncDB !== 'undefined' && SyncDB && SyncDB.db) {
            SyncDB.guardarCombo('vendedores', self._combos.vendedores);
          }
        }
        self._poblarVendedores();
      });
    } else {
      // Offline: leer de IndexedDB
      if (typeof SyncDB !== 'undefined' && SyncDB && SyncDB.db) {
        SyncDB.leerCombo('vendedores', function(datos) {
          self._combos.loadedV = true;
          self._combos.vendedores = datos || [];
          self._poblarVendedores();
          if (!datos || !datos.length) {
            PWA.toast('Sin datos de vendedores en cache — conecta a internet primero', 'warn');
          }
        });
      } else {
        self._combos.loadedV = true;
        self._poblarVendedores();
      }
    }

    // --- Fuentes ---
    if (navigator.onLine) {
      PWA.apiPost('api/prospectos.php', { option: 'TraerFuentesContactoPWA' }, function(err, data) {
        self._combos.loadedF = true;
        if (!err && data && data.result) {
          self._combos.fuentes = data.contenido || [];
          // Guardar en cache para uso offline
          if (typeof SyncDB !== 'undefined' && SyncDB && SyncDB.db) {
            SyncDB.guardarCombo('fuentes', self._combos.fuentes);
          }
        }
        self._poblarFuentes();
      });
    } else {
      // Offline: leer de IndexedDB
      if (typeof SyncDB !== 'undefined' && SyncDB && SyncDB.db) {
        SyncDB.leerCombo('fuentes', function(datos) {
          self._combos.loadedF = true;
          self._combos.fuentes = datos || [];
          self._poblarFuentes();
        });
      } else {
        self._combos.loadedF = true;
        self._poblarFuentes();
      }
    }
  },

  _esc: function(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },

  _poblarVendedores: function() {
    var sel = document.getElementById('np_vendedor');
    if (!sel) return;
    var self = this;
    var mine = (PWA.session && PWA.session.salesman) ? String(PWA.session.salesman) : '';
    var html = '<option value="">Selecciona vendedor</option>';
    this._combos.vendedores.forEach(function(v) {
      var selected = (String(v.salesmancode) === mine) ? ' selected' : '';
      html += '<option value="' + self._esc(v.salesmancode) + '"' + selected + '>' + self._esc(v.salesmanname) + '</option>';
    });
    sel.innerHTML = html;
  },

  _poblarFuentes: function() {
    var sel = document.getElementById('np_fuente');
    if (!sel) return;
    var self = this;
    var html = '<option value="">Selecciona fuente</option>';
    this._combos.fuentes.forEach(function(f) {
      html += '<option value="' + self._esc(f.CustLeadSourceId) + '">' + self._esc(f.CustLeadSourceNom) + '</option>';
    });
    sel.innerHTML = html;
  },

  _val: function(id) {
    var e = document.getElementById(id);
    return e ? (e.value || '').trim() : '';
  },

  guardar: function() {
    var self = this;
    var nombre   = this._val('np_nombre');
    var vendedor = this._val('np_vendedor');
    var fuente   = this._val('np_fuente');
    var linkMapa = this._val('np_linkMapa');

    if (!nombre)   { PWA.toast('Falta nombre comercial', 'warn'); return; }
    if (!vendedor) { PWA.toast('Selecciona un vendedor', 'warn'); return; }
    if (!fuente)   { PWA.toast('Selecciona una fuente', 'warn'); return; }
    if (!linkMapa || !/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(linkMapa)) {
      PWA.toast('Coordenadas inválidas (formato lat,lng)', 'warn');
      return;
    }

    // Los apellidos ya no se piden en el formulario; se mandan vacios para
    // que el modelo legacy siga recibiendo las mismas llaves del payload.
    var apat = '';
    var amat = '';

    var payload = {
      option: 'insertarEtapaA',
      lblProspectoId_Existente: '',
      nombre: nombre,
      aPaterno: apat,
      aMaterno: amat,
      aPaterno_alterno: apat,
      conName: nombre,
      cmbVendedor: vendedor,
      CustLeadSourceId: fuente,
      txtLinkMapa_pros: linkMapa,
      txtComentarios: this._val('np_coments'),
      direccion: this._val('np_dir'),
      colonia: this._val('np_col'),
      ciudad: this._val('np_ciu'),
      estado: this._val('np_est'),
      cp: this._val('np_cp'),
      rfc: this._val('np_rfc'),
      giro: this._val('np_giro'),
      email: this._val('np_email'),
      // El modelo legacy (ProspectV2Modelo.php) lee $_POST['telefonoFijo'],
      // 'telefonoMovil' y 'nextel' — NO 'phoneno'. Mandamos el telefono del
      // formulario como telefonoFijo (principal) y tambien como telefonoMovil
      // para que ambos inserts (debtorsmaster y custcontacts) queden con valor.
      telefonoFijo:  this._val('np_tel'),
      telefonoMovil: this._val('np_tel'),
      nextel:        '',
      // Se deja phoneno por compatibilidad hacia adelante por si el modelo
      // se actualiza para leerlo directo.
      phoneno: this._val('np_tel')
    };

    // --- Rama OFFLINE: encolar en IndexedDB para que api/sync.php lo procese
    //     cuando regrese la conexion. Se manda el mismo payload que iria a
    //     api/prospectos.php (option=insertarEtapaA), y sync.php replica el
    //     passthrough legacy. De esta forma un prospecto creado sin internet
    //     queda identico a uno creado online en cuanto se sincronice.
    if (!navigator.onLine) {
      if (typeof SyncDB === 'undefined' || !SyncDB || !SyncDB.db) {
        PWA.toast('Sin conexion y cola no disponible', 'warn');
        return;
      }
      SyncDB.encolar('nuevo_prospecto', payload, function(ok) {
        if (!ok) {
          PWA.toast('No se pudo guardar offline', 'warn');
          return;
        }
        // Agregar prospecto temporal a la lista en memoria para feedback visual
        var tempProspecto = {
          u_movimiento: 'offline_' + Date.now(),
          prospecto: nombre,
          telefono_fijo: payload.telefonoFijo || '',
          email: payload.email || '',
          idstatus: 1,
          _offline: true  // marcador para distinguirlo en el render
        };
        if (PWA.state && PWA.state.prospectos) {
          PWA.state.prospectos.unshift(tempProspecto);
        }
        PWA.toast('Prospecto guardado offline — se enviara al reconectar', 'ok');
        self.cerrar();
        if (PWA.Lista && typeof PWA.Lista.renderizar === 'function') {
          PWA.Lista.renderizar();
        }
      });
      return;
    }

    PWA.toast('Creando prospecto...', 'ok');

    PWA.apiPost('api/prospectos.php', payload, function(err, data) {
      // Si la red fallo despues de pasar el check de navigator.onLine
      // (por ejemplo timeout), encolar el payload tambien como fallback.
      if (err) {
        if (typeof SyncDB !== 'undefined' && SyncDB && SyncDB.db) {
          SyncDB.encolar('nuevo_prospecto', payload, function(ok) {
            if (ok) {
              PWA.toast('Sin red — guardado en cola para enviar', 'warn');
              self.cerrar();
              if (PWA.Lista && typeof PWA.Lista.cargar === 'function') PWA.Lista.cargar();
            } else {
              PWA.toast('Error de conexion', 'warn');
            }
          });
          return;
        }
        PWA.toast('Error de conexion', 'warn');
        return;
      }
      if (!data || !data.result) {
        var msg = (data && data.msjError) ? data.msjError : 'No se pudo crear el prospecto';
        PWA.toast('Error: ' + msg, 'warn');
        return;
      }
      var uMov = data.result;
      PWA.toast('Prospecto #' + uMov + ' creado ✓', 'ok');
      self.cerrar();
      if (PWA.Lista && typeof PWA.Lista.cargar === 'function') PWA.Lista.cargar();
      setTimeout(function() {
        if (PWA.WizardProspecto && typeof PWA.WizardProspecto.abrir === 'function') {
          PWA.WizardProspecto.abrir(uMov);
        }
      }, 300);
    });
  }
};

/* ============================================================
   ============================================================ */
PWA.Agenda = {
  _mapaActividades: {},

  cargar: function() {
    if (!PWA.state.fechaAgenda) {
      PWA.state.fechaAgenda = PWA.fechaHoy();
    }
    var el = document.getElementById('view-agenda');
    el.innerHTML = '<div class="spinner"></div>';

    PWA.apiPost('api/agenda.php', {
      opcion:  'TraerAgenda',
      userid:  PWA.session.userid,
      fecha:   PWA.state.fechaAgenda
    }, function(err, data) {
      if (err || !data || !data.result) {
        SyncDB.leerAgendaCache(function(items) {
          PWA.state.agenda = items;
          PWA.Agenda.renderizar();
        });
        return;
      }
      PWA.state.agenda = data.contenido || [];
      SyncDB.guardarAgendaCache(PWA.state.agenda);
      PWA.Agenda.renderizar();
    });
  },

  renderizar: function() {
    var el = document.getElementById('view-agenda');
    var hoy = PWA.fechaHoy();
    var fechaSeleccionada = PWA.state.fechaAgenda || hoy;

    // Nombres en español
    var mesesES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                   'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    var diasES  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

    // Generar strip de 7 días centrado en hoy (−3 … +3)
    var dias = [];
    var base = new Date();
    for (var i = -3; i <= 3; i++) {
      var d = new Date(base);
      d.setDate(base.getDate() + i);
      var mm = ('0' + (d.getMonth()+1)).slice(-2);
      var dd = ('0' + d.getDate()).slice(-2);
      var fechaStr = d.getFullYear() + '-' + mm + '-' + dd;
      dias.push({
        fecha:     fechaStr,
        diaNombre: diasES[d.getDay()],
        diaNum:    d.getDate()
      });
    }

    // Título mes/año del día seleccionado en español
    var partesFecha = fechaSeleccionada.split('-');
    var anioSel = parseInt(partesFecha[0], 10);
    var mesSel  = parseInt(partesFecha[1], 10) - 1;
    var tituloMes = mesesES[mesSel] + ' ' + anioSel;

    // Actividades del día (calculadas antes para decidir si mostrar botón exportar)
    var actividadesDia = PWA.state.agenda.filter(function(a) {
      return (a.fecha_compromiso || '').substring(0,10) === fechaSeleccionada;
    });

    var html = '';
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin:16px 16px 8px;gap:8px">';
    html += '<p class="section-title" style="margin:0">' + tituloMes + '</p>';
    if (actividadesDia.length > 0) {
      html += '<button class="btn btn-ghost" style="padding:6px 10px;font-size:11px;min-height:0;display:inline-flex;align-items:center;gap:4px" onclick="PWA.Agenda.exportarDiaICS()" title="Exportar el día a Calendar (.ics)">';
      html += '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
      html += 'Exportar d&iacute;a';
      html += '</button>';
    }
    html += '</div>';

    // Strip de días
    html += '<div class="day-strip">';
    dias.forEach(function(d) {
      var activo = d.fecha === fechaSeleccionada ? ' active' : '';
      var esHoy  = d.fecha === hoy ? ' hoy' : '';
      html += '<button class="day-btn' + activo + esHoy + '" onclick="PWA.Agenda.cambiarFecha(\'' + d.fecha + '\')">';
      html += '<span style="font-size:10px">' + d.diaNombre + '</span>';
      html += '<span class="day-num">' + d.diaNum + '</span>';
      html += '</button>';
    });
    html += '</div>';

    // Actividades del día ya se calcularon arriba (antes del header para decidir botón exportar)
    var coloresTipo = { '1': '#4f8ef7', '2': '#34d399', '3': '#f59e0b', '4': '#a855f7', '5': '#8892a4' };

    if (actividadesDia.length === 0) {
      html += '<div class="empty-state" style="padding:32px 16px">';
      html += '<div style="opacity:0.4;margin-bottom:12px"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--pwa-muted)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>';
      html += '<div style="font-size:15px;font-weight:600;margin-bottom:6px">Sin actividades para este día</div>';
      html += '<div style="font-size:13px;color:var(--pwa-muted)">Aquí aparecerán tus visitas y llamadas programadas</div>';
      html += '</div>';
    } else {
      PWA.Agenda._mapaActividades = {};
      actividadesDia.forEach(function(a) {
        var hora     = (a.hora || '').substring(0,5) || '--:--';
        var tipo     = a.TipoMovimientoId || '1';
        var color    = coloresTipo[tipo] || '#8892a4';
        var titulo   = a.titulo || a.concepto || 'Actividad';
        var prospecto = a.nombreProspecto || a.nombre || '';
        var uTask    = String(a.u_task || '');

        // Guardar en mapa para acceso desde el botón de calendario
        if (uTask) {
          PWA.Agenda._mapaActividades[uTask] = a;
        }

        html += '<div class="actividad-card" onclick="verDetalle(\'' + (a.u_movimiento||'') + '\')">';
        html += '<div class="actividad-hora">' + hora + '</div>';
        html += '<div class="actividad-tipo-dot" style="background:' + color + '"></div>';
        html += '<div class="actividad-info">';
        html += '<div class="actividad-titulo">' + titulo + '</div>';
        if (prospecto) html += '<div class="actividad-prospecto">' + prospecto + '</div>';
        // FIX 2026-06-08: boton Confirmar visita para actividades tipo "Visita en Sitio"
        var esVisitaSitio = (a.tipo_actividad || '').toLowerCase().indexOf('visita en sitio') !== -1;
        if (esVisitaSitio && uTask) {
          html += PWA.Visitas.renderBtnConfirmar(a);
        }
        html += '</div>';
        if (uTask) {
          html += '<button class="gcal-btn" title="Agregar a Google Calendar" onclick="event.stopPropagation();PWA.abrirGoogleCalendar(PWA.Agenda._mapaActividades[\'' + uTask + '\'])">';
          html += '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
          html += '</button>';
        }
        html += '</div>';
      });
    }

    el.innerHTML = html;

    // Sección "Requieren atención" (lazy load)
    PWA.Agenda.cargarNecesitanAtencion(el);

    // Badge agenda: actividades hoy o vencidas
    var hoyCount = PWA.state.agenda.filter(function(a) {
      var fa = (a.fecha_compromiso || '').substring(0,10);
      return fa <= hoy;
    }).length;
    var badge = document.getElementById('badgeAgenda');
    if (badge) {
      badge.textContent = hoyCount;
      badge.style.display = hoyCount > 0 ? 'inline-flex' : 'none';
    }
  },

  cambiarFecha: function(fecha) {
    PWA.state.fechaAgenda = fecha;
    var el = document.getElementById('view-agenda');
    el.innerHTML = '<div class="spinner"></div>';
    PWA.apiPost('api/agenda.php', {
      opcion: 'TraerAgenda',
      userid: PWA.session.userid,
      fecha:  fecha
    }, function(err, data) {
      if (!err && data && data.result) {
        PWA.state.agenda = data.contenido || [];
      }
      PWA.Agenda.renderizar();
    });
  },

  /* ──────────────────────────────────────────────────────────
     Exportar TODAS las actividades del día a un archivo .ics
     (importable a Google Calendar, Apple Calendar, Outlook...)
     ────────────────────────────────────────────────────────── */
  exportarDiaICS: function() {
    var fecha = PWA.state.fechaAgenda || PWA.fechaHoy();
    var actividadesDia = (PWA.state.agenda || []).filter(function(a) {
      return (a.fecha_compromiso || '').substring(0,10) === fecha;
    });

    if (actividadesDia.length === 0) {
      PWA.toast('No hay actividades para exportar', 'error');
      return;
    }

    // Helper: escapar texto para ICS (RFC 5545)
    function escICS(s) {
      if (s == null) return '';
      return String(s)
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\r?\n/g, '\\n');
    }
    // Helper: fecha/hora local → YYYYMMDDTHHMMSS (sin Z, local time)
    function fmtDT(fechaStr, horaStr) {
      var f = (fechaStr || '').substring(0,10).replace(/-/g, '');
      var h = (horaStr || '09:00:00');
      if (h.length === 5) h = h + ':00';
      return f + 'T' + h.replace(/:/g, '');
    }
    // Helper: timestamp UTC actual (DTSTAMP) → YYYYMMDDTHHMMSSZ
    function nowUTC() {
      var d = new Date();
      function p(n) { return ('0'+n).slice(-2); }
      return d.getUTCFullYear() +
             p(d.getUTCMonth()+1) +
             p(d.getUTCDate()) + 'T' +
             p(d.getUTCHours()) +
             p(d.getUTCMinutes()) +
             p(d.getUTCSeconds()) + 'Z';
    }
    // Helper: inicio + 1 hora
    function horaMasUna(horaStr) {
      var h = horaStr || '09:00:00';
      if (h.length === 5) h = h + ':00';
      var d = new Date('1970-01-01T' + h);
      d.setHours(d.getHours() + 1);
      function p(n) { return ('0'+n).slice(-2); }
      return p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
    }

    var dtstamp = nowUTC();
    var lineas = [];
    lineas.push('BEGIN:VCALENDAR');
    lineas.push('VERSION:2.0');
    lineas.push('PRODID:-//ROGMAI//Prospectos PWA//ES');
    lineas.push('CALSCALE:GREGORIAN');
    lineas.push('METHOD:PUBLISH');
    lineas.push('X-WR-CALNAME:Agenda ' + fecha);
    lineas.push('X-WR-TIMEZONE:America/Mexico_City');

    actividadesDia.forEach(function(a, idx) {
      var hora      = a.hora || '09:00:00';
      var dtStart   = fmtDT(a.fecha_compromiso || fecha, hora);
      var dtEnd     = fmtDT(a.fecha_compromiso || fecha, horaMasUna(hora));
      var titulo    = a.titulo || a.concepto || 'Actividad';
      var prospecto = a.nombreProspecto || a.nombre || '';
      var umov      = a.u_movimiento || '';
      var utask     = a.u_task || '';
      var descr     = (a.descripcion || '') +
                      (prospecto ? '\nProspecto: ' + prospecto : '') +
                      (umov      ? '\nOp: ' + umov             : '');
      var location  = a.direccion || '';
      var uid       = (utask || umov || ('act-' + idx)) + '@prospectos.rogmai';

      lineas.push('BEGIN:VEVENT');
      lineas.push('UID:' + uid);
      lineas.push('DTSTAMP:' + dtstamp);
      // Sin TZID → cliente interpreta como "floating" local time (suficiente para agenda diaria)
      lineas.push('DTSTART:' + dtStart);
      lineas.push('DTEND:'   + dtEnd);
      lineas.push('SUMMARY:' + escICS(titulo + (prospecto ? ' — ' + prospecto : '')));
      if (descr)    lineas.push('DESCRIPTION:' + escICS(descr));
      if (location) lineas.push('LOCATION:'    + escICS(location));
      lineas.push('STATUS:CONFIRMED');
      lineas.push('END:VEVENT');
    });

    lineas.push('END:VCALENDAR');

    // RFC 5545 pide CRLF
    var contenido = lineas.join('\r\n') + '\r\n';

    try {
      var blob = new Blob([contenido], { type: 'text/calendar;charset=utf-8' });
      var url  = URL.createObjectURL(blob);
      var a    = document.createElement('a');
      a.href     = url;
      a.download = 'agenda_' + fecha + '.ics';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function() { URL.revokeObjectURL(url); }, 2000);

      PWA.toast('Agenda exportada (' + actividadesDia.length + ' actividades)', 'ok');
    } catch (err) {
      console.error('[exportarDiaICS]', err);
      PWA.toast('No se pudo exportar', 'error');
    }
  },

  cargarNecesitanAtencion: function(contenedor) {
    // Crear placeholder mientras carga
    var seccion = document.createElement('div');
    seccion.id = 'agenda-atencion';
    seccion.innerHTML = '<div class="spinner" style="margin:16px auto"></div>';
    contenedor.appendChild(seccion);

    PWA.apiPost('api/agenda.php', { opcion: 'ProspectosNecesitanAtencion' }, function(err, data) {
      var items = (!err && data && data.result) ? (data.contenido || []) : [];

      if (items.length === 0) {
        seccion.remove();
        return;
      }

      var html = '<p class="section-title" style="margin:20px 16px 10px;color:var(--pwa-danger)">&#x26A1; Requieren atenci&oacute;n</p>';

      items.forEach(function(p) {
        var nombre = p.prospecto || 'Sin nombre';
        var iniciales = PWA.iniciales(nombre);
        var tel = p.phoneno || '';
        var valor = p.valor_estimado ? '$' + parseInt(p.valor_estimado, 10).toLocaleString() : '';
        var diasTexto = p.ultima_actividad
          ? ('Hace ' + (p.dias_sin_actividad || '?') + ' d&iacute;as sin actividad')
          : 'Sin actividad registrada';
        var etapa = (p.etapa || '') + (p.nombrealterno ? ' (' + p.nombrealterno + ')' : '');
        var umov = p.u_movimiento || '';

        html += '<div class="prospect-card" style="border-left:4px solid var(--pwa-danger)">';
        html += '<div style="display:flex;align-items:center;gap:12px;padding:12px">';
        html += '<div class="prospect-avatar" style="background:var(--pwa-danger)">' + iniciales + '</div>';
        html += '<div style="flex:1;min-width:0">';
        html += '<div style="font-weight:700;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + nombre + '</div>';
        html += '<div style="font-size:12px;color:var(--pwa-muted)">' + etapa + (valor ? ' &middot; ' + valor : '') + '</div>';
        html += '<div style="font-size:11px;color:var(--pwa-danger);margin-top:2px">' + diasTexto + '</div>';
        html += '</div>';
        html += '<div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0">';
        if (tel) {
          html += '<a href="tel:' + tel.replace(/\s+/g,'') + '" class="btn btn-ghost" style="padding:5px 10px;font-size:11px;min-height:0" onclick="event.stopPropagation()">&#x1F4DE;</a>';
        }
        if (umov) {
          html += '<button class="btn btn-ghost" style="padding:5px 10px;font-size:11px;min-height:0" onclick="event.stopPropagation();PWA.NuevaActividad.abrir(\'' + umov + '\',\'' + nombre.replace(/'/g,'') + '\')">+</button>';
        }
        html += '</div>';
        html += '</div>';
        html += '</div>';
      });

      seccion.innerHTML = html;
    });
  }
};

/* ============================================================
   ============================================================ */
PWA.Perfil = {
  cargar: function() {
    var el = document.getElementById('view-perfil');
    var userid   = PWA.session.userid   || '';
    var username = PWA.session.username || userid;
    var initials = PWA.iniciales(username);

    var html = '';
    html += '<div class="perfil-header">';
    html += '<div class="perfil-avatar">' + initials + '</div>';
    html += '<div class="perfil-nombre">' + username + '</div>';
    html += '<div class="perfil-id">ID: ' + userid + '</div>';
    html += '</div>';

    html += '<p class="section-title">Sincronización</p>';
    html += '<div class="card">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">';
    html += '<span style="font-size:14px">Pendientes offline</span>';
    html += '<span id="contadorPendientesTexto" style="color:var(--pwa-warn);font-weight:700">—</span>';
    html += '</div>';
    html += '<button class="btn btn-primary btn-full" onclick="SyncDB.sincronizar()">Sincronizar ahora</button>';
    html += '</div>';

    html += '<p class="section-title">Notificaciones</p>';
    html += '<div class="card">';
    html += '<div id="notificacionesEstado" style="font-size:13px;color:var(--pwa-muted);line-height:1.6;margin-bottom:12px">Cargando estado...</div>';
    html += '<div id="notificacionesAccion"></div>';
    html += '</div>';

    html += '<p class="section-title">Aplicación</p>';
    html += '<div class="card">';
    html += '<div id="actualizarAppEstado" style="font-size:13px;color:var(--pwa-muted);line-height:1.6;margin-bottom:12px">Forzar descarga de la última versión sin reinstalar.</div>';
    html += '<button id="btnActualizarApp" class="btn btn-primary btn-full" onclick="PWA.Perfil.actualizarApp()">🔄 Actualizar app</button>';
    html += '</div>';

    // ── Instalar app (si no está instalada) ──
    var yaInstalada = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (!yaInstalada) {
      html += '<p class="section-title">Instalación</p>';
      html += '<div class="card">';
      html += '<div id="perfilInstalarEstado" style="font-size:13px;color:var(--pwa-muted);line-height:1.6;margin-bottom:12px">Instala la app en tu dispositivo para acceso rapido desde la pantalla de inicio.</div>';
      html += '<button id="btnInstalarApp" class="btn btn-primary btn-full" onclick="PWA.Perfil.instalarApp()">📲 Instalar app</button>';
      html += '</div>';
    }

    // ── Tour de ayuda ──
    html += '<p class="section-title">Ayuda</p>';
    html += '<div class="card">';
    html += '<div style="font-size:13px;color:var(--pwa-muted);line-height:1.6;margin-bottom:12px">Recorre las funciones principales de la app con un tour guiado.</div>';
    html += '<button class="btn btn-primary btn-full" onclick="PWA.Perfil.iniciarTour()">🎓 Ver tour de la app</button>';
    html += '</div>';

    html += '<p class="section-title">Información</p>';
    html += '<div class="card">';
    html += '<div style="font-size:13px;color:var(--pwa-muted);line-height:1.8">';
    html += 'Versión: <strong style="color:var(--pwa-text)">1.1</strong><br>';
    html += 'Conexión: <strong id="estadoConexion" style="color:var(--pwa-accent2)">' + (navigator.onLine ? 'En línea' : 'Sin conexión') + '</strong>';
    html += '</div></div>';

    html += '<div style="margin-top:24px">';
    html += '<button onclick="PWA.cerrarSesion()" class="btn btn-ghost btn-full" style="color:var(--pwa-danger)">Cerrar sesión</button>';
    html += '</div>';

    el.innerHTML = html;

    SyncDB.contarPendientes(function(n) {
      var ct = document.getElementById('contadorPendientesTexto');
      if (ct) ct.textContent = n > 0 ? n + ' pendientes' : 'Sin pendientes';
    });

    PWA.Perfil.actualizarEstadoNotificaciones();
  },

  actualizarEstadoNotificaciones: function() {
    var estadoEl = document.getElementById('notificacionesEstado');
    var accionEl = document.getElementById('notificacionesAccion');
    if (!estadoEl || !accionEl) return;

    var estado = PWA.Notificaciones.estado();
    accionEl.innerHTML = '';

    if (estado === 'granted') {
      estadoEl.innerHTML = '<strong style="color:var(--pwa-accent2)">Notificaciones ✅ Activas</strong>';
      return;
    }

    if (estado === 'denied') {
      estadoEl.innerHTML = '<strong style="color:var(--pwa-danger)">Notificaciones bloqueadas</strong> — actívalas en configuración del navegador.';
      return;
    }

    if (estado === 'default') {
      estadoEl.textContent = 'Aún no has activado recordatorios locales para vencidos y próximas visitas.';
      accionEl.innerHTML = '<button id="btnActivarNotif" class="btn btn-primary btn-full" type="button">🔔 Activar notificaciones</button>';
      var btn = document.getElementById('btnActivarNotif');
      if (btn) {
        btn.addEventListener('click', function() {
          PWA.Notificaciones.solicitarPermisoDesdeUsuario();
        });
      }
      return;
    }

    estadoEl.textContent = 'Este navegador no soporta notificaciones.';
  },

  /* ── Forzar actualizacion de la PWA sin reinstalar ──
     (a) skipWaiting al SW en espera (si lo hay)
     (b) registration.update() busca nueva version
     (c) borra caches del SW (prospectos-*, osm-tiles-*)
     (d) recarga con cache busting */
  actualizarApp: function() {
    var btn = document.getElementById('btnActualizarApp');
    var est = document.getElementById('actualizarAppEstado');
    if (btn) { btn.disabled = true; btn.textContent = 'Buscando actualizacion...'; }
    if (est) { est.textContent = 'Revisando si hay nueva version...'; }

    function reloadDuro() {
      if (est) { est.textContent = 'Actualizando — recargando...'; }
      // Cache busting: agregar ?v=timestamp al URL actual
      var u = new URL(window.location.href);
      u.searchParams.set('_v', Date.now());
      setTimeout(function() { window.location.replace(u.toString()); }, 400);
    }

    if (!('serviceWorker' in navigator)) {
      reloadDuro();
      return;
    }

    navigator.serviceWorker.getRegistration().then(function(reg) {
      var pasos = [];

      // Si hay un SW en waiting, decirle que tome el control
      if (reg && reg.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

      // Buscar nueva version
      if (reg) { pasos.push(reg.update().catch(function() { return null; })); }

      // Borrar caches
      if ('caches' in window) {
        pasos.push(
          caches.keys().then(function(keys) {
            return Promise.all(keys.map(function(k) {
              // Borramos caches del SW — se vuelven a llenar en el siguiente fetch
              return caches.delete(k);
            }));
          })
        );
      }

      Promise.all(pasos).then(reloadDuro).catch(reloadDuro);
    }).catch(reloadDuro);
  },

  iniciarTour: function() {
    if (typeof PWATour !== 'undefined') {
      PWATour.reiniciar();
    } else {
      PWA.toast('Tour no disponible', 'warn');
    }
  },

  instalarApp: function() {
    var btn = document.getElementById('btnInstalarApp');
    var est = document.getElementById('perfilInstalarEstado');

    // Verificar si hay un deferredPrompt capturado (Chrome/Edge)
    if (window._pwaInstallPrompt) {
      window._pwaInstallPrompt.prompt();
      window._pwaInstallPrompt.userChoice.then(function(result) {
        window._pwaInstallPrompt = null;
        if (result.outcome === 'accepted') {
          if (btn) btn.textContent = 'Instalada';
          if (btn) btn.disabled = true;
          if (est) est.textContent = 'La app se instalo correctamente.';
          PWA.toast('App instalada', 'ok');
        }
      });
      return;
    }

    // Detectar navegador para instrucciones específicas
    var ua = navigator.userAgent;
    var isIOS = /iphone|ipad|ipod/i.test(ua);
    var isBrave = (navigator.brave && navigator.brave.isBrave) || false;
    var isSamsung = /SamsungBrowser/i.test(ua);
    var isFirefox = /Firefox/i.test(ua) && !/Seamonkey/i.test(ua);
    var isChrome = /Chrome/i.test(ua) && !/Brave|Edge|OPR|Samsung/i.test(ua);

    var instrucciones = '';

    if (isIOS) {
      instrucciones = '<div style="text-align:center">'
        + '<div style="font-size:28px;margin-bottom:8px">↑</div>'
        + 'Toca el boton <strong style="color:var(--pwa-primary)">Compartir</strong> en la barra de Safari<br>'
        + 'y luego <strong style="color:var(--pwa-primary)">"Agregar a pantalla de inicio"</strong>'
        + '</div>';
    } else if (isBrave) {
      instrucciones = '<div style="text-align:center">'
        + '<div style="font-size:20px;margin-bottom:6px">🦁</div>'
        + 'En <strong style="color:var(--pwa-primary)">Brave</strong>, toca el menu <strong style="color:var(--pwa-primary)">⋮</strong> arriba a la derecha<br>'
        + 'y selecciona <strong style="color:var(--pwa-primary)">"Instalar app"</strong><br>'
        + '<span style="font-size:11px;color:var(--pwa-muted);margin-top:6px;display:block">Si no aparece, intenta con Chrome para instalacion directa</span>'
        + '</div>';
    } else if (isSamsung) {
      instrucciones = '<div style="text-align:center">'
        + 'Toca el menu <strong style="color:var(--pwa-primary)">☰</strong> y selecciona<br>'
        + '<strong style="color:var(--pwa-primary)">"Añadir pagina a" → Pantalla de inicio</strong>'
        + '</div>';
    } else if (isFirefox) {
      instrucciones = '<div style="text-align:center">'
        + 'Toca el menu <strong style="color:var(--pwa-primary)">⋮</strong> y selecciona<br>'
        + '<strong style="color:var(--pwa-primary)">"Instalar"</strong>'
        + '</div>';
    } else {
      instrucciones = '<div style="text-align:center">'
        + 'Toca el menu <strong style="color:var(--pwa-primary)">⋮</strong> del navegador<br>'
        + 'y selecciona <strong style="color:var(--pwa-primary)">"Instalar app"</strong><br>'
        + 'o <strong style="color:var(--pwa-primary)">"Añadir a pantalla de inicio"</strong>'
        + '</div>';
    }

    if (est) est.innerHTML = instrucciones;
    if (btn) { btn.textContent = 'Entendido'; btn.onclick = function() { PWA.toast('Sigue las instrucciones para instalar', 'ok'); }; }
  }
};

/* ============================================================
   ============================================================ */
PWA.Chat = {
  abrir: function(uMovimiento) {
    PWA.toast('Chat — módulo disponible próximamente', 'warn');
  }
};

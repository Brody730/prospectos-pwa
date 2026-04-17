/* ============================================================
   app.js — Lógica principal PWA Prospectos ROGMAI
   Vanilla JS, sin import/export, sin frameworks
   ============================================================ */

var PWA = PWA || {};

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

  // Escuchar mensajes del SW
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', function(e) {
      if (e.data && e.data.type === 'SYNC_REQUEST') {
        SyncDB.sincronizar();
      }
    });
  }

  // Navegar a panel inicial
  PWA.navegarA('panel');
});

window.addEventListener('scroll', function() {
  if (PWA.state.vistaActual !== 'lista') return;
  if (prospectosLoading || prospectosFinished) return;

  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
    PWA.Lista.cargarMas();
  }
});

/* ── Service Worker ── */
PWA.registrarSW = function() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('sw.js').then(function(reg) {
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
          '<button class="btn btn-ghost" style="padding:6px 12px;min-height:34px;font-size:12px" onclick="PWA.CambiarEtapa.abrir(\'' + p.u_movimiento + '\',\'' + p.idstatus + '\',\'' + nombre.replace(/\'/g, "\\'") + '\')">⇆ Cambiar</button>',
          '</div>',
        '</div>',
      '</div>',
      '<p style="margin:12px 0 8px;color:var(--pwa-muted)">' + (p.direccion || 'Sin dirección registrada') + '</p>',
      '<p style="margin:0 0 4px;color:var(--pwa-muted)">' + (tel || 'Sin teléfono') + '</p>',
      '<p style="margin:0 0 20px;color:var(--pwa-muted)">' + (p.email || 'Sin email') + '</p>',
      ['<div class="panel-action-row" style="margin-bottom:16px">',
        (tel ? '<a href="tel:' + tel.replace(/\s+/g, '') + '" class="btn btn-primary" style="flex:1">📞 Llamar</a>' : ''),
        (wa ? '<a href="' + wa + '" target="_blank" class="btn btn-ghost" style="flex:1">💬 WhatsApp</a>' : ''),
        (mapa ? '<a href="' + mapa + '" target="_blank" class="btn btn-ghost" style="flex:1">📍 Ver en mapa</a>' : ''),
        '</div>'
      ].join(''),
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
    var items = (!err && data && data.result) ? (data.contenido || []) : [];
    var html = '';

    if (items.length === 0) {
      cont.innerHTML = '<div style="font-size:12px;color:var(--pwa-muted)">Sin actividades previas</div>';
      return;
    }

    items.forEach(function(item) {
      html += '<div class="historial-item">';
      html += '<div class="historial-top">';
      html += '<span style="font-weight:700">' + ((item.fecha_compromiso || '').substring(0, 10) || 'Sin fecha') + ' ' + PWA.formatoHora(item.hora) + '</span>';
      html += '<span class="historial-type" style="background:' + (item.color || 'var(--pwa-card)') + '">' + (item.tipo || 'Actividad') + '</span>';
      html += '</div>';
      if (item.concepto) html += '<div style="font-size:13px;margin-top:6px">' + item.concepto + '</div>';
      if (item.descripcion) html += '<div style="font-size:12px;color:var(--pwa-muted);margin-top:4px">' + item.descripcion + '</div>';
      if (item.estatus_tarea) html += '<div style="font-size:11px;color:var(--pwa-muted);margin-top:6px">Estatus: ' + item.estatus_tarea + '</div>';
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
  if (item.link_google_map) return item.link_google_map;
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

    try {
      new Notification(titulo, {
        body: cuerpo,
        icon: 'assets/icons/icon-192.png',
        badge: 'assets/icons/icon-192.png'
      });

      if (claveSesion) {
        sessionStorage.setItem(claveSesion, '1');
      }
    } catch (e) {}
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
   PANEL
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
   CAMBIAR ETAPA — Feature con feature flag
   ============================================================ */
PWA.CambiarEtapa = {
  // ⚠️ FEATURE FLAG — cambiar a null para activar para todos
  soloParaProspecto: 31136,  // prospecto de prueba
  
  // Matriz de transiciones permitidas
  // idstatus: 1=A(Nuevo) 2=B(Levant) 3=C(CotSol) 4=D(CotEnt) 5=E(Descart) 6=V(Venta) 7=S(Seguim) 8=X(Cancel)
  transicionesPermitidas: {
    1: [2, 5, 7, 8],           // A → B, S, E, X
    2: [1, 3, 5, 7, 8],        // B → A, C, S, E, X
    3: [1, 2, 4, 5, 7, 8],     // C → B, A, D, S, E, X
    4: [1, 2, 3, 5, 6, 7, 8],  // D → A, B, C, V, S, E, X
    7: [1, 2, 3, 4, 5, 8]      // S → A, B, C, D, E, X (reactivar)
    // 5 (E), 6 (V), 8 (X) son terminales → no se pueden cambiar
  },
  
  // Info de cada etapa (nombre + color)
  etapas: {
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
  },
  
  cerrarAviso: function() {
    var bd = document.getElementById('avisoPruebasBackdrop');
    if (bd) bd.parentNode.removeChild(bd);
  }
};

/* ============================================================
   LISTA DE PROSPECTOS
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
   DETALLE DE PROSPECTO (Sheet modal)
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
        (email ? '<a href="mailto:' + email + '" class="btn btn-ghost" style="flex:1;font-size:13px">✉ Email</a>' : ''),
        '<button class="btn btn-primary" style="flex:1;font-size:13px" onclick="PWA.NuevaActividad.abrir(\'' + umov + '\',\'' + nombre.replace(/'/g,'') + '\')">+ Actividad</button>',
      '</div>',
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
  }
};

/* ============================================================
   NUEVA ACTIVIDAD
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
          '<label class="form-label">Título</label>',
          '<input class="form-input" id="actTitulo" type="text" placeholder="Ej: Visita de seguimiento">',
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

    if (!titulo) { PWA.toast('Ingresa un título', 'warn'); return; }
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
  }
};

/* ============================================================
   NUEVO PROSPECTO (stub — expandir en siguiente paso)
   ============================================================ */
PWA.NuevoProspecto = {
  abrir: function() {
    PWA.toast('Formulario nuevo prospecto — próximamente', 'warn');
  }
};

/* ============================================================
   AGENDA
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

    var html = '';
    html += '<p class="section-title" style="margin:16px 16px 8px">' + tituloMes + '</p>';

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

    // Actividades del día seleccionado
    var actividadesDia = PWA.state.agenda.filter(function(a) {
      return (a.fecha_compromiso || '').substring(0,10) === fechaSeleccionada;
    });

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
   PERFIL
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

    html += '<p class="section-title">Información</p>';
    html += '<div class="card">';
    html += '<div style="font-size:13px;color:var(--pwa-muted);line-height:1.8">';
    html += 'Versión: <strong style="color:var(--pwa-text)">1.0</strong><br>';
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
  }
};

/* ============================================================
   CHAT (stub — el módulo completo es PWA.Chat)
   ============================================================ */
PWA.Chat = {
  abrir: function(uMovimiento) {
    PWA.toast('Chat — módulo disponible próximamente', 'warn');
  }
};

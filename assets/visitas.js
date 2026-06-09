/* ============================================================
   assets/visitas.js
   Módulo PWA.Visitas — Confirmación de visitas en sitio
   CREADO: 2026-06-08
   Depende de: app.js (PWA), api/visitas.php
   ============================================================ */

PWA.Visitas = {

  // ── Renderiza el botón "Confirmar visita" dentro de la tarjeta de agenda ──
  renderBtnConfirmar: function(actividad) {
    var uTask       = String(actividad.u_task       || '');
    var uMovimiento = String(actividad.u_movimiento || '');
    // FIX 2026-06-08: tratar lat/lng == 0 como sin coordenadas (custbranch sin datos)
    var latProsp    = (actividad.latitude  && parseFloat(actividad.latitude)  !== 0) ? actividad.latitude  : '';
    var lngProsp    = (actividad.longitude && parseFloat(actividad.longitude) !== 0) ? actividad.longitude : '';
    // FIX 2026-06-08b: fallback a link_google_map si custbranch no tiene coords
    if ((!latProsp || !lngProsp) && actividad.link_google_map) {
      var _lgm = actividad.link_google_map.split(',');
      if (_lgm.length >= 2) {
        var _lgmLat = parseFloat(_lgm[0].trim());
        var _lgmLng = parseFloat(_lgm[1].trim());
        if (_lgmLat !== 0 && _lgmLng !== 0) { latProsp = _lgmLat; lngProsp = _lgmLng; }
      }
    }

    // Serializar los datos de la actividad para el onclick
    var dataAttr = encodeURIComponent(JSON.stringify({
      u_task:        uTask,
      u_movimiento:  uMovimiento,
      lat_prospecto: latProsp,
      lng_prospecto: lngProsp,
      nombre:        actividad.nombreProspecto || ''
    }));

    return '<div style="margin-top:6px" onclick="event.stopPropagation()">'
      + '<button class="btn btn-primary" style="padding:5px 12px;font-size:11px;min-height:0;width:100%;display:flex;align-items:center;justify-content:center;gap:5px" '
      + 'onclick="PWA.Visitas.abrirConfirmacion(\'' + dataAttr + '\')">'
      + '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">'
      + '<polyline points="20 6 9 17 4 12"></polyline></svg>'
      + 'Confirmar visita en sitio'
      + '</button>'
      + '</div>';
  },

  // ── Abre el bottom sheet de confirmación ──────────────────────────────────
  abrirConfirmacion: function(dataAttrEncoded) {
    var data;
    try { data = JSON.parse(decodeURIComponent(dataAttrEncoded)); }
    catch(e) { PWA.toast('Error al abrir confirmación', 'error'); return; }

    // Pedir GPS antes de mostrar el sheet
    if (!navigator.geolocation) {
      PWA.toast('Tu navegador no soporta GPS', 'error');
      return;
    }

    PWA.toast('Obteniendo tu ubicación...', 'info');

    navigator.geolocation.getCurrentPosition(
      function(pos) {
        data.lat_vendedor = pos.coords.latitude;
        data.lng_vendedor = pos.coords.longitude;
        PWA.Visitas._mostrarSheet(data);
      },
      function(err) {
        // Si falla GPS, igual abrir el sheet pero sin distancia
        data.lat_vendedor = null;
        data.lng_vendedor = null;
        data._gpsError = true;
        PWA.Visitas._mostrarSheet(data);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  },

  // ── Renderiza y muestra el sheet con los datos de GPS ─────────────────────
  _mostrarSheet: function(data) {
    var distanciaM   = null;
    var distTexto    = 'Sin coordenadas del prospecto';
    var distColor    = 'var(--pwa-muted)';
    var distIcono    = '○';
    var gpsOk        = !data._gpsError && data.lat_vendedor;
    var btnBloqueado = false; // FIX 2026-06-08: true cuando distancia conocida > 500m

    if (gpsOk && data.lat_prospecto && data.lng_prospecto) {
      distanciaM = PWA.Visitas._haversineM(
        parseFloat(data.lat_vendedor),  parseFloat(data.lng_vendedor),
        parseFloat(data.lat_prospecto), parseFloat(data.lng_prospecto)
      );
      if (distanciaM < 500) {
        distTexto    = distanciaM + ' m — En sitio ✓';
        distColor    = '#34d399';
        distIcono    = '✓';
        btnBloqueado = false;
      } else {
        distTexto    = distanciaM + ' m del prospecto — muy lejos';
        distColor    = '#f87171';
        distIcono    = '⚠';
        btnBloqueado = true;
      }
    } else if (data._gpsError) {
      distTexto = 'No se pudo obtener GPS';
      distColor = '#f87171';
    }

    // Guardar estado en el objeto para recuperarlo en guardar()
    PWA.Visitas._pendiente = {
      u_task:        data.u_task,
      u_movimiento:  data.u_movimiento,
      lat_vendedor:  data.lat_vendedor,
      lng_vendedor:  data.lng_vendedor,
      lat_prospecto: data.lat_prospecto,
      lng_prospecto: data.lng_prospecto,
      distancia_m:   distanciaM,
      nombre:        data.nombre
    };

    var html = ''
      + '<div id="visita-sheet-overlay" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:1000;display:flex;align-items:flex-end" onclick="PWA.Visitas.cerrarSheet()">'
      + '<div id="visita-sheet" style="background:var(--pwa-card);border-radius:16px 16px 0 0;border-top:0.5px solid var(--pwa-border);width:100%;padding:0 16px 32px;max-height:80vh;overflow-y:auto" onclick="event.stopPropagation()">'
      + '<div style="width:36px;height:3px;background:var(--pwa-border);border-radius:2px;margin:10px auto 16px"></div>'
      + '<div style="font-size:15px;font-weight:600;margin-bottom:2px;color:var(--pwa-text)">Confirmar visita en sitio</div>'
      + '<div style="font-size:12px;color:var(--pwa-muted);margin-bottom:14px">' + (data.nombre || 'Prospecto') + '</div>'

      // Card GPS
      + '<div style="background:var(--pwa-bg);border:0.5px solid var(--pwa-border);border-radius:10px;padding:10px 12px;margin-bottom:12px">'

      + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">'
      + '<span style="font-size:12px;color:var(--pwa-muted);flex:1">📍 Tu ubicación</span>'
      + '<span style="font-size:11px;color:var(--pwa-text)">'
      + (gpsOk ? parseFloat(data.lat_vendedor).toFixed(5) + ', ' + parseFloat(data.lng_vendedor).toFixed(5) : 'No disponible')
      + '</span>'
      + '</div>'

      + '<div style="display:flex;align-items:center;gap:8px">'
      + '<span style="font-size:12px;color:var(--pwa-muted);flex:1">🏢 Prospecto</span>'
      + '<span style="font-size:11px;color:' + distColor + ';font-weight:600">' + distTexto + '</span>'
      + '</div>'
      + '</div>'

      // Advertencia si GPS falla pero dejamos continuar
      + (data._gpsError
          ? '<div style="background:#2a0d0d;border:0.5px solid #f8717144;border-radius:8px;padding:8px 12px;margin-bottom:12px;font-size:12px;color:#f87171">No se pudo obtener tu GPS. La visita se guardará sin validación de ubicación.</div>'
          : '')

      // Textarea comentarios
      + '<textarea id="visita-comentarios" placeholder="Comentarios de la visita..." '
      + 'style="width:100%;background:var(--pwa-bg);border:0.5px solid var(--pwa-border);border-radius:8px;padding:8px 10px;color:var(--pwa-text);font-size:13px;resize:none;height:70px;margin-bottom:12px;font-family:inherit"></textarea>'

      // Botones — FIX 2026-06-08: bloquear si lejos
      + (btnBloqueado
          ? '<div style="background:#2a0d0d;border:0.5px solid #f8717144;border-radius:8px;padding:10px 12px;margin-bottom:12px;font-size:13px;color:#f87171;text-align:center">'
            + '⚠ Estás a <b>' + distanciaM + 'm</b> del prospecto.<br>Necesitas estar a menos de 500m para confirmar la visita.</div>'
          : '')
      + '<div style="display:flex;gap:8px">'
      + '<button class="btn btn-ghost" style="padding:10px 16px" onclick="PWA.Visitas.cerrarSheet()">Cancelar</button>'
      + '<button class="btn btn-primary" '
        + (btnBloqueado ? 'disabled style="flex:1;padding:10px;opacity:0.4;cursor:not-allowed"' : 'style="flex:1;padding:10px"')
        + ' onclick="PWA.Visitas.guardar()">Guardar visita →</button>'
      + '</div>'

      + '</div>'
      + '</div>';

    // Inyectar en el DOM
    var overlay = document.getElementById('visita-sheet-overlay');
    if (overlay) overlay.remove();
    document.body.insertAdjacentHTML('beforeend', html);
  },

  // ── Envía la confirmación al servidor ─────────────────────────────────────
  guardar: function() {
    var p           = PWA.Visitas._pendiente;
    var comentarios = (document.getElementById('visita-comentarios') || {}).value || '';

    if (!p || !p.u_task || !p.u_movimiento) {
      PWA.toast('Error: datos incompletos', 'error');
      return;
    }

    if (!p.lat_vendedor) {
      // Confirmar que el usuario quiere guardar sin GPS
      if (!confirm('¿Guardar sin ubicación GPS? La visita quedará pendiente de aprobación de todas formas.')) return;
    }

    var btnGuardar = document.querySelector('#visita-sheet .btn-primary');
    if (btnGuardar) { btnGuardar.disabled = true; btnGuardar.textContent = 'Guardando...'; }

    PWA.apiPost('api/visitas.php', {
      opcion:        'ConfirmarVisitaSitio',
      u_task:        p.u_task,
      u_movimiento:  p.u_movimiento,
      lat_vendedor:  p.lat_vendedor,
      lng_vendedor:  p.lng_vendedor,
      lat_prospecto: p.lat_prospecto,
      lng_prospecto: p.lng_prospecto,
      comentarios:   comentarios
    }, function(err, data) {
      if (err || !data || !data.result) {
        var msg = (data && data.msjError) ? data.msjError : 'Error al guardar';
        PWA.toast(msg, 'error');
        if (btnGuardar) { btnGuardar.disabled = false; btnGuardar.textContent = 'Guardar visita →'; }
        return;
      }
      PWA.Visitas.cerrarSheet();
      PWA.toast('Visita guardada. Pendiente de aprobación del supervisor.', 'success');
      // Re-renderizar la agenda para reflejar el estado pendiente
      PWA.Agenda.cargar();
    });
  },

  // ── Cierra el bottom sheet ────────────────────────────────────────────────
  cerrarSheet: function() {
    var overlay = document.getElementById('visita-sheet-overlay');
    if (overlay) overlay.remove();
    PWA.Visitas._pendiente = null;
  },

  // ── Haversine: distancia en metros entre dos puntos GPS ──────────────────
  _haversineM: function(lat1, lng1, lat2, lng2) {
    var R    = 6371000;
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLng = (lng2 - lng1) * Math.PI / 180;
    var a    = Math.sin(dLat/2) * Math.sin(dLat/2)
             + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
             * Math.sin(dLng/2) * Math.sin(dLng/2);
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
  },

  // ── Vista supervisor: lista de visitas pendientes ─────────────────────────
  cargarPendientes: function(contenedor) {
    var el = typeof contenedor === 'string'
      ? document.getElementById(contenedor)
      : contenedor;
    if (!el) return;

    el.innerHTML = '<div class="spinner"></div>';

    PWA.apiPost('api/visitas.php', { opcion: 'TraerPendientes' }, function(err, data) {
      if (err || !data || !data.result) {
        el.innerHTML = '<div style="padding:16px;color:var(--pwa-muted);font-size:13px">Error al cargar visitas pendientes</div>';
        return;
      }
      var items = data.contenido || [];
      if (items.length === 0) {
        el.innerHTML = '<div style="padding:16px;color:var(--pwa-muted);font-size:13px;text-align:center">Sin visitas pendientes de aprobación ✓</div>';
        return;
      }
      var html = '';
      items.forEach(function(v) {
        var distColor = '#34d399';
        var distTexto = 'Sin GPS';
        if (v.distancia_m !== null && v.distancia_m !== '') {
          var d = parseInt(v.distancia_m, 10);
          distColor = d <= 500 ? '#34d399' : '#f59e0b';
          distTexto = d + ' m';
        }
        html += '<div class="card2" style="margin-bottom:10px">'
          + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">'
          + '<div style="width:32px;height:32px;border-radius:50%;background:var(--pwa-bg);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:var(--pwa-text)">'
          + (v.userid_vendedor || '?').substring(0,2).toUpperCase()
          + '</div>'
          + '<div><div style="font-size:13px;font-weight:600;color:var(--pwa-text)">' + (v.userid_vendedor || '') + '</div>'
          + '<div style="font-size:11px;color:var(--pwa-muted)">' + (v.nombre_prospecto || '') + ' · ' + (v.fecha_confirmacion || '').substring(0,16) + '</div>'
          + '</div></div>'
          + '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:8px;background:var(--pwa-bg);border-radius:8px;padding:8px">'
          + '<span style="color:var(--pwa-muted)">📍 Distancia</span>'
          + '<span style="color:' + distColor + ';font-weight:600">' + distTexto + '</span>'
          + '</div>'
          + (v.comentarios ? '<div style="font-size:12px;color:var(--pwa-muted);margin-bottom:10px;font-style:italic">"' + v.comentarios + '"</div>' : '')
          + '<div style="display:flex;gap:8px">'
          + '<button class="btn" style="flex:1;background:#0d2a1a;color:#34d399;border-color:#34d39944;padding:8px;font-size:12px" onclick="PWA.Visitas.aprobar(' + v.id + ', this)">✓ Aprobar</button>'
          + '<button class="btn" style="flex:1;background:#2a0d0d;color:#f87171;border-color:#f8717144;padding:8px;font-size:12px" onclick="PWA.Visitas.rechazar(' + v.id + ', this)">✗ Rechazar</button>'
          + '</div>'
          + '</div>';
      });
      el.innerHTML = html;
    });
  },

  aprobar: function(id, btn) {
    if (btn) { btn.disabled = true; btn.textContent = '...'; }
    PWA.apiPost('api/visitas.php', { opcion: 'AprobarVisita', id: id }, function(err, data) {
      if (!data || !data.result) { PWA.toast('Error al aprobar', 'error'); return; }
      PWA.toast('Visita aprobada ✓', 'success');
      // Quitar la tarjeta del DOM
      var card = btn ? btn.closest('.card2') : null;
      if (card) card.remove();
    });
  },

  rechazar: function(id, btn) {
    var motivo = prompt('Motivo del rechazo (opcional):') || '';
    if (btn) { btn.disabled = true; btn.textContent = '...'; }
    PWA.apiPost('api/visitas.php', { opcion: 'RechazarVisita', id: id, motivo_rechazo: motivo }, function(err, data) {
      if (!data || !data.result) { PWA.toast('Error al rechazar', 'error'); return; }
      PWA.toast('Visita rechazada', 'info');
      var card = btn ? btn.closest('.card2') : null;
      if (card) card.remove();
    });
  }

};

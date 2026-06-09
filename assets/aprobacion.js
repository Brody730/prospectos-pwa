/* ============================================================
   assets/aprobacion.js
   Módulo PWA.Aprobacion — Aprobación de prospectos nuevos
   CREADO: 2026-06-08
   Depende de: app.js (PWA), api/aprobacion.php
   ============================================================ */

PWA.Aprobacion = {

  // ── Llamar después de crear un prospecto nuevo (online) ──────────────────
  notificarNuevoProspecto: function(u_movimiento, nombre) {
    if (!u_movimiento) return;
    PWA.apiPost('api/aprobacion.php', {
      opcion:       'SolicitarAprobacion',
      u_movimiento: u_movimiento,
      nombre:       nombre || ''
    }, function(err, data) {
      if (!err && data && data.result) {
        PWA.toast('Prospecto enviado al supervisor para aprobación', 'info');
      }
    });
  },

  // ── Cola de aprobaciones para supervisor ─────────────────────────────────
  cargarPendientes: function(contenedorId) {
    var el = document.getElementById(contenedorId);
    if (!el) return;

    el.innerHTML = '<div class="spinner"></div>';

    PWA.apiPost('api/aprobacion.php', { opcion: 'TraerPendientesAprobacion' }, function(err, data) {
      if (err || !data || !data.result) {
        el.innerHTML = '<div style="padding:12px;font-size:13px;color:var(--pwa-muted)">Error al cargar</div>';
        return;
      }
      var items = data.contenido || [];
      if (items.length === 0) {
        el.innerHTML = '<div style="padding:12px;font-size:13px;color:var(--pwa-muted);text-align:center">Sin prospectos pendientes de aprobación ✓</div>';
        return;
      }
      var html = '';
      items.forEach(function(p) {
        var fecha = (p.fecha_alta || '').substring(0, 16);
        html += '<div class="card2" style="margin-bottom:10px">'
          + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">'
          + '<div style="width:32px;height:32px;border-radius:50%;background:var(--pwa-bg);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:var(--pwa-text)">'
          + (p.userid_vendedor || '?').substring(0,2).toUpperCase()
          + '</div>'
          + '<div><div style="font-size:13px;font-weight:600;color:var(--pwa-text)">' + (p.userid_vendedor || '') + '</div>'
          + '<div style="font-size:11px;color:var(--pwa-muted)">' + fecha + '</div>'
          + '</div></div>'
          + '<div style="font-size:14px;color:var(--pwa-text);margin-bottom:10px">'
          + (p.nombre_prospecto || 'Sin nombre')
          + ' <span style="font-size:11px;color:var(--pwa-muted)">#' + p.u_movimiento + '</span>'
          + '</div>'
          + '<div style="display:flex;gap:8px">'
          + '<button class="btn" style="flex:1;background:#0d2a1a;color:#34d399;border-color:#34d39944;padding:8px;font-size:12px" '
          + 'onclick="PWA.Aprobacion.aprobar(' + p.id + ', this)">✓ Aprobar</button>'
          + '<button class="btn" style="flex:1;background:#2a0d0d;color:#f87171;border-color:#f8717144;padding:8px;font-size:12px" '
          + 'onclick="PWA.Aprobacion.rechazar(' + p.id + ', this)">✗ Rechazar</button>'
          + '</div>'
          + '</div>';
      });
      el.innerHTML = html;
    });
  },

  aprobar: function(id, btn) {
    if (btn) { btn.disabled = true; btn.textContent = '...'; }
    PWA.apiPost('api/aprobacion.php', { opcion: 'AprobarProspecto', id: id }, function(err, data) {
      if (!data || !data.result) { PWA.toast('Error al aprobar', 'error'); if (btn) { btn.disabled = false; btn.textContent = '✓ Aprobar'; } return; }
      PWA.toast('Prospecto aprobado ✓', 'success');
      var card = btn ? btn.closest('.card2') : null;
      if (card) card.remove();
    });
  },

  rechazar: function(id, btn) {
    var motivo = prompt('Motivo del rechazo (opcional):') || '';
    if (btn) { btn.disabled = true; btn.textContent = '...'; }
    PWA.apiPost('api/aprobacion.php', { opcion: 'RechazarProspecto', id: id, motivo_rechazo: motivo }, function(err, data) {
      if (!data || !data.result) { PWA.toast('Error al rechazar', 'error'); if (btn) { btn.disabled = false; btn.textContent = '✗ Rechazar'; } return; }
      PWA.toast('Prospecto rechazado', 'info');
      var card = btn ? btn.closest('.card2') : null;
      if (card) card.remove();
    });
  }

};

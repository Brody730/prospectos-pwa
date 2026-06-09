/* ============================================================
   assets/llamadas.js
   Módulo PWA.Llamadas — Registro de llamadas desde la app
   CREADO: 2026-06-09
   Estrategia: event delegation global en <a href="tel:...">
   No requiere parchar botones individuales en app.js.
   ============================================================ */

PWA.Llamadas = {

  _estado: null,  // { tel, u_movimiento, inicio }
  _realizo: null,

  init: function() {
    var self = this;

    // Interceptar TODOS los clicks en enlaces tel: de la app
    document.addEventListener('click', function(e) {
      var el = e.target.closest('a[href^="tel:"]');
      if (!el) return;
      e.preventDefault();
      var tel = el.getAttribute('href').replace('tel:', '').replace(/\s+/g, '');
      var uMov = self._obtenerUMovimiento();
      self.iniciar(tel, uMov);
    }, true);

    // Detectar regreso a la app tras la llamada
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'visible' && self._estado) {
        self._onRegreso();
      }
    });

    // Fallback para pageshow (iOS Safari)
    window.addEventListener('pageshow', function() {
      if (self._estado) {
        setTimeout(function() { self._onRegreso(); }, 500);
      }
    });
  },

  // Obtener u_movimiento del contexto actual de la app
  _obtenerUMovimiento: function() {
    if (!PWA.state) return null;
    // Prioridad 1: prospecto activo en vista de detalle
    if (PWA.state.prospectoActivo && PWA.state.prospectoActivo.u_movimiento) {
      return PWA.state.prospectoActivo.u_movimiento;
    }
    // Prioridad 2: próxima actividad del panel
    if (PWA.state.panel && PWA.state.panel.proximaActividad) {
      return PWA.state.panel.proximaActividad.u_movimiento;
    }
    return null;
  },

  iniciar: function(tel, u_movimiento) {
    this._estado  = { tel: tel, u_movimiento: u_movimiento || null, inicio: Date.now() };
    this._realizo = null;
    window.location.href = 'tel:' + tel;
  },

  _onRegreso: function() {
    var estado = this._estado;
    if (!estado) return;
    // Evitar doble disparo (pageshow + visibilitychange)
    if (this._modalAbierto) return;
    this._modalAbierto = true;

    var durSeg = Math.round((Date.now() - estado.inicio) / 1000);
    this._mostrarModal(durSeg, estado);
  },

  _mostrarModal: function(durSeg, estado) {
    var mins = Math.floor(durSeg / 60);
    var segs = durSeg % 60;
    var durTxt = mins > 0 ? mins + 'min ' + segs + 's' : durSeg + 's';

    var html = ''
      + '<div id="llamada-modal-overlay" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:2000;display:flex;align-items:flex-end">'
      + '<div style="background:var(--pwa-card);border-radius:16px 16px 0 0;border-top:0.5px solid var(--pwa-border);width:100%;padding:0 16px 32px">'
      + '<div style="width:36px;height:3px;background:var(--pwa-border);border-radius:2px;margin:10px auto 16px"></div>'
      + '<div style="font-size:15px;font-weight:600;color:var(--pwa-text);margin-bottom:3px">Registrar llamada</div>'
      + '<div style="font-size:12px;color:var(--pwa-muted);margin-bottom:14px">Tel: ' + estado.tel + ' &nbsp;·&nbsp; Duración estimada: <strong>' + durTxt + '</strong></div>'

      // Botones Si/No
      + '<div style="display:flex;gap:8px;margin-bottom:12px">'
      + '<button id="llamada-btn-si" class="btn" style="flex:1;background:#0d2a1a;color:#34d399;border-color:#34d39944;padding:10px" '
      + 'onclick="PWA.Llamadas._setRealizo(true)">Si, la realice</button>'
      + '<button id="llamada-btn-no" class="btn" style="flex:1;background:#1a1a1a;color:#888;border-color:#333;padding:10px" '
      + 'onclick="PWA.Llamadas._setRealizo(false)">No, cancele</button>'
      + '</div>'

      // Comentarios
      + '<textarea id="llamada-comentarios" placeholder="Comentarios (opcional)..." '
      + 'style="width:100%;background:var(--pwa-bg);border:0.5px solid var(--pwa-border);border-radius:8px;padding:8px 10px;'
      + 'color:var(--pwa-text);font-size:13px;resize:none;height:60px;margin-bottom:12px;font-family:inherit"></textarea>'

      // Acciones
      + '<div style="display:flex;gap:8px">'
      + '<button class="btn btn-ghost" style="padding:10px 16px" onclick="PWA.Llamadas.cerrarModal()">Omitir</button>'
      + '<button id="llamada-btn-guardar" class="btn btn-primary" style="flex:1;padding:10px" '
      + 'onclick="PWA.Llamadas.guardar(' + durSeg + ')">Guardar llamada</button>'
      + '</div>'

      + '</div></div>';

    var old = document.getElementById('llamada-modal-overlay');
    if (old) old.remove();
    document.body.insertAdjacentHTML('beforeend', html);
  },

  _setRealizo: function(val) {
    this._realizo = val;
    var si = document.getElementById('llamada-btn-si');
    var no = document.getElementById('llamada-btn-no');
    if (si) si.style.background = val  ? '#0d4a2a' : '#0d2a1a';
    if (no) no.style.background = !val ? '#4a0d0d' : '#1a1a1a';
    if (si) si.style.color = val  ? '#34d399' : '#34d399';
    if (no) no.style.color = !val ? '#f87171' : '#888';
    if (no) no.style.borderColor = !val ? '#f8717144' : '#333';
  },

  guardar: function(durSeg) {
    var self      = this;
    var estado    = this._estado;
    var realizo   = this._realizo;
    var comentarios = (document.getElementById('llamada-comentarios') || {}).value || '';

    if (realizo === null) {
      PWA.toast('Indica si realizaste la llamada', 'warn');
      return;
    }

    // Si no realizó: cerrar sin guardar
    if (!realizo) {
      this.cerrarModal();
      return;
    }

    if (!estado || !estado.u_movimiento) {
      // Sin prospecto identificado: guardar igual pero sin u_prospecto
      // (el supervisor verá el registro pero sin link al prospecto)
    }

    var btn = document.getElementById('llamada-btn-guardar');
    if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }

    PWA.apiPost('api/agenda.php', {
      opcion:        'RegistrarLlamada',
      u_movimiento:  estado ? estado.u_movimiento : null,
      tel:           estado ? estado.tel : '',
      duracion_seg:  durSeg,
      comentarios:   comentarios
    }, function(err, data) {
      if (err || !data || !data.result) {
        PWA.toast((data && data.msjError) || 'Error al guardar llamada', 'error');
        if (btn) { btn.disabled = false; btn.textContent = 'Guardar llamada'; }
        return;
      }
      self.cerrarModal();
      PWA.toast('Llamada registrada', 'success');
    });
  },

  cerrarModal: function() {
    var el = document.getElementById('llamada-modal-overlay');
    if (el) el.remove();
    this._estado       = null;
    this._realizo      = null;
    this._modalAbierto = false;
  }
};

// Init al cargar
(function() {
  function init() { if (typeof PWA !== 'undefined') { PWA.Llamadas.init(); } }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

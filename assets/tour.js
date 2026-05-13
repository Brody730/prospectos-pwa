/* ============================================================
   Tour de Onboarding — PWA Prospectos ROGMAI
   Tooltips paso a paso, primera vez + boton en Perfil
   ============================================================ */
(function() {

  var TOUR_KEY = 'pwa_tour_completado';

  // ── Pasos del tour ──
  var pasos = [
    {
      selector: '[data-view="panel"]',
      titulo: 'Panel de control',
      texto: 'Aqui ves tus KPIs: prospectos activos, calificados, visitas de hoy y vencidos. Es tu resumen diario.',
      posicion: 'arriba'
    },
    {
      selector: '[data-view="lista"]',
      titulo: 'Lista de prospectos',
      texto: 'Todos tus prospectos en un solo lugar. Puedes filtrar por etapa, buscar por nombre o telefono.',
      posicion: 'arriba'
    },
    {
      selector: '#fabNuevo',
      titulo: 'Crear prospecto',
      texto: 'Toca este boton para dar de alta un nuevo prospecto. Funciona incluso sin internet.',
      posicion: 'arriba',
      preAccion: function() {
        PWA.navegarA('lista');
        var fab = document.getElementById('fabNuevo');
        if (fab) fab.style.display = 'flex';
      }
    },
    {
      selector: '[data-view="agenda"]',
      titulo: 'Agenda de actividades',
      texto: 'Tu calendario de visitas y seguimientos. Visualiza las actividades de hoy, manana o cualquier fecha.',
      posicion: 'arriba'
    },
    {
      selector: '[data-view="mapa"]',
      titulo: 'Mapa de prospectos',
      texto: 'Ubica a tus prospectos en el mapa. Puedes trazar ruta desde tu ubicacion hasta cualquier prospecto.',
      posicion: 'arriba'
    },
    {
      selector: '[data-view="perfil"]',
      titulo: 'Tu perfil',
      texto: 'Sincroniza datos offline, activa notificaciones, actualiza la app e instala la PWA en tu dispositivo.',
      posicion: 'arriba'
    },
    {
      selector: null,
      titulo: 'Flujo de prospectos A → D',
      texto: 'Cada prospecto pasa por 4 etapas:\n\nA — Datos del prospecto\nB — Visita y productos de interes\nC — Cotizacion formal\nD — Cierre de venta',
      posicion: 'centro',
      icono: '📋'
    },
    {
      selector: null,
      titulo: 'Funciona sin internet',
      texto: 'Puedes crear prospectos, ver tu lista y consultar el mapa sin conexion. Todo se sincroniza automaticamente al reconectar.',
      posicion: 'centro',
      icono: '📡'
    }
  ];

  // ── Inyectar CSS del tour ──
  function inyectarCSS() {
    if (document.getElementById('tour-css')) return;
    var style = document.createElement('style');
    style.id = 'tour-css';
    style.textContent = [
      '.tour-overlay {',
      '  position: fixed; top: 0; left: 0; right: 0; bottom: 0;',
      '  z-index: 10000;',
      '  pointer-events: none;',
      '  transition: opacity 0.3s;',
      '}',
      '.tour-overlay.active { pointer-events: auto; }',
      '',
      '.tour-backdrop {',
      '  position: fixed; top: 0; left: 0; right: 0; bottom: 0;',
      '  background: rgba(0,0,0,0.7);',
      '  z-index: 10001;',
      '}',
      '',
      '.tour-highlight {',
      '  position: absolute;',
      '  z-index: 10002;',
      '  border-radius: 12px;',
      '  box-shadow: 0 0 0 4000px rgba(0,0,0,0.7), 0 0 0 4px rgba(79,142,247,0.6);',
      '  transition: all 0.35s ease;',
      '  pointer-events: none;',
      '}',
      '',
      '.tour-tooltip {',
      '  position: absolute;',
      '  z-index: 10003;',
      '  background: #1e2130;',
      '  border: 1px solid rgba(79,142,247,0.3);',
      '  border-radius: 16px;',
      '  padding: 20px;',
      '  width: 300px;',
      '  max-width: calc(100vw - 32px);',
      '  box-shadow: 0 12px 40px rgba(0,0,0,0.5);',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;',
      '  transition: all 0.35s ease;',
      '  pointer-events: auto;',
      '}',
      '',
      '.tour-tooltip-center {',
      '  position: fixed;',
      '  top: 50%; left: 50%;',
      '  transform: translate(-50%, -50%);',
      '  z-index: 10003;',
      '  background: #1e2130;',
      '  border: 1px solid rgba(79,142,247,0.3);',
      '  border-radius: 16px;',
      '  padding: 28px 24px;',
      '  width: 320px;',
      '  max-width: calc(100vw - 32px);',
      '  box-shadow: 0 12px 40px rgba(0,0,0,0.5);',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;',
      '  text-align: center;',
      '  pointer-events: auto;',
      '}',
      '',
      '.tour-titulo {',
      '  font-size: 16px; font-weight: 700; color: #f1f5f9;',
      '  margin-bottom: 8px;',
      '}',
      '.tour-texto {',
      '  font-size: 13px; color: #94a3b8; line-height: 1.6;',
      '  margin-bottom: 16px; white-space: pre-line;',
      '}',
      '.tour-icono {',
      '  font-size: 40px; margin-bottom: 12px;',
      '}',
      '',
      '.tour-footer {',
      '  display: flex; align-items: center; justify-content: space-between; gap: 8px;',
      '}',
      '.tour-contador {',
      '  font-size: 11px; color: #64748b;',
      '}',
      '.tour-btns { display: flex; gap: 8px; }',
      '',
      '.tour-btn {',
      '  padding: 8px 16px; border-radius: 10px; border: none;',
      '  font-size: 13px; font-weight: 600; cursor: pointer;',
      '  transition: background 0.15s;',
      '}',
      '.tour-btn-primary {',
      '  background: #4f8ef7; color: white;',
      '}',
      '.tour-btn-primary:active { background: #3b7ae0; }',
      '.tour-btn-ghost {',
      '  background: rgba(255,255,255,0.08); color: #94a3b8;',
      '}',
      '.tour-btn-ghost:active { background: rgba(255,255,255,0.15); }',
      '',
      '.tour-progress {',
      '  display: flex; gap: 4px; justify-content: center; margin-bottom: 16px;',
      '}',
      '.tour-dot {',
      '  width: 8px; height: 8px; border-radius: 50%;',
      '  background: rgba(255,255,255,0.15); transition: all 0.3s;',
      '}',
      '.tour-dot.active { background: #4f8ef7; width: 20px; border-radius: 4px; }',
      '.tour-dot.done { background: rgba(79,142,247,0.4); }'
    ].join('\n');
    document.head.appendChild(style);
  }

  // ── Posicionar tooltip respecto al elemento ──
  function posicionarTooltip(tooltip, elRect, pos) {
    var margin = 12;
    var tooltipW = 300;

    // Posicionar encima del elemento (para bottom nav items)
    if (pos === 'arriba') {
      var left = elRect.left + (elRect.width / 2) - (tooltipW / 2);
      // Mantener dentro de la pantalla
      if (left < 16) left = 16;
      if (left + tooltipW > window.innerWidth - 16) left = window.innerWidth - 16 - tooltipW;

      tooltip.style.left = left + 'px';
      tooltip.style.bottom = (window.innerHeight - elRect.top + margin) + 'px';
      tooltip.style.top = 'auto';
    }
  }

  // ── Crear dots de progreso ──
  function crearDots(actual) {
    var html = '<div class="tour-progress">';
    for (var i = 0; i < pasos.length; i++) {
      var cls = 'tour-dot';
      if (i === actual) cls += ' active';
      else if (i < actual) cls += ' done';
      html += '<div class="' + cls + '"></div>';
    }
    html += '</div>';
    return html;
  }

  // ── Motor del tour ──
  var pasoActual = 0;
  var overlay = null;

  function iniciar() {
    pasoActual = 0;
    inyectarCSS();

    // Crear overlay contenedor
    overlay = document.createElement('div');
    overlay.className = 'tour-overlay active';
    overlay.id = 'tourOverlay';
    document.body.appendChild(overlay);

    mostrarPaso(0);
  }

  function mostrarPaso(idx) {
    if (idx >= pasos.length) {
      terminar();
      return;
    }
    pasoActual = idx;
    var paso = pasos[idx];

    // Limpiar overlay
    overlay.innerHTML = '';

    // Pre-accion (ej: navegar a una vista)
    if (paso.preAccion) paso.preAccion();

    if (paso.posicion === 'centro' || !paso.selector) {
      // Paso centrado (sin highlight)
      overlay.innerHTML = '<div class="tour-backdrop"></div>';

      var tooltip = document.createElement('div');
      tooltip.className = 'tour-tooltip-center';
      tooltip.innerHTML = [
        crearDots(idx),
        (paso.icono ? '<div class="tour-icono">' + paso.icono + '</div>' : ''),
        '<div class="tour-titulo">' + paso.titulo + '</div>',
        '<div class="tour-texto">' + paso.texto + '</div>',
        '<div class="tour-footer">',
          '<div class="tour-contador">' + (idx + 1) + ' / ' + pasos.length + '</div>',
          '<div class="tour-btns">',
            (idx > 0 ? '<button class="tour-btn tour-btn-ghost" data-tour="prev">Anterior</button>' : ''),
            (idx < pasos.length - 1
              ? '<button class="tour-btn tour-btn-primary" data-tour="next">Siguiente</button>'
              : '<button class="tour-btn tour-btn-primary" data-tour="finish">Comenzar</button>'),
          '</div>',
        '</div>'
      ].join('');
      overlay.appendChild(tooltip);

    } else {
      // Paso con highlight sobre un elemento
      var el = document.querySelector(paso.selector);
      if (!el) {
        // Si no se encuentra el elemento, saltar al siguiente
        mostrarPaso(idx + 1);
        return;
      }

      var rect = el.getBoundingClientRect();

      // Highlight (agujero en el backdrop)
      var highlight = document.createElement('div');
      highlight.className = 'tour-highlight';
      highlight.style.top = (rect.top - 6) + 'px';
      highlight.style.left = (rect.left - 6) + 'px';
      highlight.style.width = (rect.width + 12) + 'px';
      highlight.style.height = (rect.height + 12) + 'px';
      overlay.appendChild(highlight);

      // Tooltip
      var tooltip = document.createElement('div');
      tooltip.className = 'tour-tooltip';
      tooltip.innerHTML = [
        crearDots(idx),
        '<div class="tour-titulo">' + paso.titulo + '</div>',
        '<div class="tour-texto">' + paso.texto + '</div>',
        '<div class="tour-footer">',
          '<div class="tour-contador">' + (idx + 1) + ' / ' + pasos.length + '</div>',
          '<div class="tour-btns">',
            (idx > 0 ? '<button class="tour-btn tour-btn-ghost" data-tour="prev">Anterior</button>' : ''),
            '<button class="tour-btn tour-btn-ghost" data-tour="skip">Saltar</button>',
            '<button class="tour-btn tour-btn-primary" data-tour="next">Siguiente</button>',
          '</div>',
        '</div>'
      ].join('');
      overlay.appendChild(tooltip);

      posicionarTooltip(tooltip, rect, paso.posicion);
    }

    // Event listeners
    overlay.querySelectorAll('[data-tour]').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        var accion = e.target.getAttribute('data-tour');
        if (accion === 'next') mostrarPaso(pasoActual + 1);
        else if (accion === 'prev') mostrarPaso(pasoActual - 1);
        else if (accion === 'skip') terminar();
        else if (accion === 'finish') terminar();
      });
    });
  }

  function terminar() {
    if (overlay) {
      overlay.classList.remove('active');
      setTimeout(function() {
        if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
        overlay = null;
      }, 300);
    }
    localStorage.setItem(TOUR_KEY, '1');
    // Regresar al panel
    PWA.navegarA('panel');
  }

  // ── API publica ──
  window.PWATour = {
    iniciar: iniciar,
    yaCompletado: function() {
      return localStorage.getItem(TOUR_KEY) === '1';
    },
    reiniciar: function() {
      localStorage.removeItem(TOUR_KEY);
      iniciar();
    }
  };

  // ── Auto-iniciar en primer uso ──
  // Se llama desde app.js despues de que la app cargue
})();

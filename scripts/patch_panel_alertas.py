#!/usr/bin/env python3
# patch_panel_alertas.py
# Agrega alertas de aprobacion en el Panel:
#   - Admin: cuantas visitas/prospectos estan pendientes de aprobar
#   - Usuario: si su visita/prospecto fue aprobado o rechazado
# CREADO: 2026-06-09

import sys, os, shutil, datetime

TARGET = sys.argv[2] if len(sys.argv) > 2 else '/var/www/html/prospectos/assets/app.js'
mode   = sys.argv[1] if len(sys.argv) > 1 else '--verify'

PATCHES = [
    # PATCH 1: placeholder div antes del KPI grid en renderizar()
    {
        'search': "    // KPIs\n    html += '<div class=\"kpi-grid\">';",
        'replace': """    // FIX 2026-06-09: placeholder alertas de aprobacion (se llena async en refrescarDesdePanel)
    html += '<div id="panel-aprobaciones-alert"></div>';

    // KPIs
    html += '<div class="kpi-grid">';""",
        'desc': 'Patch 1: placeholder div en renderizar'
    },
    # PATCH 2: llamar revisarAprobaciones en refrescarDesdePanel
    {
        'search': "  refrescarDesdePanel: function() {\n    this.revisarVencidos();\n    this.revisarProximaVisita();\n  },",
        'replace': """  refrescarDesdePanel: function() {
    this.revisarVencidos();
    this.revisarProximaVisita();
    // FIX 2026-06-09: alertas de aprobaciones pendientes
    this.revisarAprobaciones();
  },""",
        'desc': 'Patch 2: agregar revisarAprobaciones en refrescarDesdePanel'
    },
    # PATCH 3: agregar metodo revisarAprobaciones antes de estado()
    {
        'search': "  estado: function() {\n    if (!('Notification' in window)) return 'unsupported';\n    return Notification.permission;\n  }",
        'replace': """  revisarAprobaciones: function() {
    var userid = (PWA.session && PWA.session.userid) ? PWA.session.userid : '';
    var el = document.getElementById('panel-aprobaciones-alert');
    if (!el) return;

    if (userid === 'admin') {
      // Admin: contar visitas y prospectos pendientes de aprobacion
      var totalV = 0, totalP = 0, done = 0;

      function renderAdmin() {
        done++;
        if (done < 2) return;
        if (totalV === 0 && totalP === 0) { el.innerHTML = ''; return; }
        var html = '<div class="panel-feature-card panel-alert-card" style="border-color:#f59e0b44;background:#1a150a;margin-bottom:12px">';
        html += '<div class="panel-alert-title" style="color:#f59e0b">\uD83D\uDD14 Pendientes de aprobaci\u00f3n</div>';
        if (totalV > 0) html += '<div style="font-size:13px;color:var(--pwa-muted);margin:4px 0">\u2022 ' + totalV + ' visita' + (totalV !== 1 ? 's' : '') + ' en sitio</div>';
        if (totalP > 0) html += '<div style="font-size:13px;color:var(--pwa-muted);margin:4px 0">\u2022 ' + totalP + ' prospecto' + (totalP !== 1 ? 's' : '') + ' nuevo' + (totalP !== 1 ? 's' : '') + '</div>';
        html += '<button class="btn btn-ghost btn-full" style="margin-top:8px;border-color:#f59e0b55;color:#f59e0b" onclick="PWA.navegarA(\'perfil\')">Revisar aprobaciones \u2192</button>';
        html += '</div>';
        el.innerHTML = html;
      }

      PWA.apiPost('api/visitas.php', { opcion: 'TraerPendientes' }, function(err, data) {
        totalV = (!err && data && data.result) ? (parseInt(data.total, 10) || 0) : 0;
        renderAdmin();
      });
      PWA.apiPost('api/aprobacion.php', { opcion: 'TraerPendientesAprobacion' }, function(err, data) {
        totalP = (!err && data && data.result) ? (parseInt(data.total, 10) || 0) : 0;
        renderAdmin();
      });

    } else {
      // Vendedor: mostrar estado de su visita mas reciente resuelta
      PWA.apiPost('api/visitas.php', { opcion: 'TraerVisitasVendedor' }, function(err, data) {
        if (err || !data || !data.result) { el.innerHTML = ''; return; }
        var resueltas = (data.contenido || []).filter(function(v) {
          return v.estado === 'aprobada' || v.estado === 'rechazada';
        });
        if (resueltas.length === 0) { el.innerHTML = ''; return; }
        var v = resueltas[0];
        var aprobada = v.estado === 'aprobada';
        var color = aprobada ? '#34d399' : '#f87171';
        var bg    = aprobada ? '#0d2a1a' : '#2a0d0d';
        var icono = aprobada ? '\u2713' : '\u2717';
        var nombre = v.nombre_prospecto || 'tu prospecto';
        var html = '<div class="panel-feature-card" style="border:0.5px solid ' + color + '44;background:' + bg + ';margin-bottom:12px">';
        html += '<div style="font-size:13px;font-weight:600;color:' + color + '">' + icono + ' Visita ' + v.estado + '</div>';
        html += '<div style="font-size:12px;color:var(--pwa-muted);margin-top:4px">Tu visita a <strong style="color:var(--pwa-text)">' + nombre + '</strong> fue ' + v.estado;
        if (!aprobada && v.motivo_rechazo) html += ': ' + v.motivo_rechazo;
        html += '</div></div>';
        el.innerHTML = html;
      });
    }
  },

  estado: function() {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  }""",
        'desc': 'Patch 3: agregar metodo revisarAprobaciones'
    }
]

with open(TARGET, 'r') as f:
    contenido = f.read()

if mode == '--verify':
    all_ok = True
    for p in PATCHES:
        c = contenido.count(p['search'])
        ok = c == 1
        if not ok: all_ok = False
        print(('OK  ' if ok else 'ERR ') + '[' + p['desc'] + '] x' + str(c))
    print('\n' + ('Listo para --apply' if all_ok else 'REVISAR errores'))
    if not all_ok: sys.exit(1)

elif mode == '--apply':
    for p in PATCHES:
        if contenido.count(p['search']) != 1:
            print('ERR [' + p['desc'] + '] Abortando.')
            sys.exit(1)
    ts  = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    bak = TARGET + '.bak_' + ts
    shutil.copy2(TARGET, bak)
    print('Backup: ' + bak)
    for p in PATCHES:
        contenido = contenido.replace(p['search'], p['replace'], 1)
        print('OK  ' + p['desc'])
    with open(TARGET, 'w') as f:
        f.write(contenido)
    print('\nPatch aplicado: ' + TARGET)

elif mode == '--revert':
    base = os.path.dirname(TARGET) or '.'
    baks = sorted([f for f in os.listdir(base) if 'app.js.bak_' in f])
    if not baks: print('No hay backups.'); sys.exit(1)
    ultimo = os.path.join(base, baks[-1])
    shutil.copy2(ultimo, TARGET)
    print('Revertido: ' + ultimo)

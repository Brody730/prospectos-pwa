#!/usr/bin/env python3
# patch_app_supervisor.py
# Dos parches en app.js:
#   1. Agrega seccion supervisor en PWA.Perfil.cargar (visitas + prospectos pendientes)
#   2. Llama PWA.Aprobacion.notificarNuevoProspecto tras crear prospecto online
# CREADO: 2026-06-08

import sys, os, shutil, datetime

TARGET = sys.argv[2] if len(sys.argv) > 2 else '/var/www/html/prospectos/assets/app.js'
mode   = sys.argv[1] if len(sys.argv) > 1 else '--verify'

PATCHES = [
    # PATCH 1: seccion supervisor en Perfil (antes del boton cerrar sesion)
    {
        'search': "    html += '<div style=\"margin-top:24px\">';\n    html += '<button onclick=\"PWA.cerrarSesion()\" class=\"btn btn-ghost btn-full\" style=\"color:var(--pwa-danger)\">Cerrar sesión</button>';\n    html += '</div>';",
        'replace': """    // FIX 2026-06-08: seccion supervisor — solo visible para admin
    if (PWA.session.userid === 'admin') {
      html += '<p class="section-title">Supervisión — Visitas pendientes</p>';
      html += '<div id="perfil-visitas-pendientes"><div class="spinner"></div></div>';
      html += '<p class="section-title" style="margin-top:16px">Supervisión — Prospectos nuevos</p>';
      html += '<div id="perfil-prospectos-pendientes"><div class="spinner"></div></div>';
    }

    html += '<div style="margin-top:24px">';
    html += '<button onclick="PWA.cerrarSesion()" class="btn btn-ghost btn-full" style="color:var(--pwa-danger)">Cerrar sesión</button>';
    html += '</div>';""",
        'desc': 'Patch 1: seccion supervisor en Perfil'
    },
    # PATCH 2: cargar listas supervisor despues de el.innerHTML = html en Perfil
    {
        'search': "    PWA.Perfil.actualizarEstadoNotificaciones();\n  },",
        'replace': """    PWA.Perfil.actualizarEstadoNotificaciones();

    // FIX 2026-06-08: cargar colas de aprobacion para admin
    if (PWA.session.userid === 'admin') {
      if (typeof PWA.Visitas !== 'undefined')    { PWA.Visitas.cargarPendientes('perfil-visitas-pendientes'); }
      if (typeof PWA.Aprobacion !== 'undefined') { PWA.Aprobacion.cargarPendientes('perfil-prospectos-pendientes'); }
    }
  },""",
        'desc': 'Patch 2: trigger cargarPendientes al cargar Perfil admin'
    },
    # PATCH 3: notificar aprobacion al crear prospecto online exitosamente
    {
        'search': "      PWA.toast('Prospecto #' + uMov + ' creado \u2713', 'ok');\n      self.cerrar();",
        'replace': """      PWA.toast('Prospecto #' + uMov + ' creado \u2713', 'ok');
      // FIX 2026-06-08: solicitar aprobacion del supervisor
      if (typeof PWA.Aprobacion !== 'undefined') {
        PWA.Aprobacion.notificarNuevoProspecto(uMov, nombre);
      }
      self.cerrar();""",
        'desc': 'Patch 3: notificar supervisor al crear prospecto'
    }
]

with open(TARGET, 'r') as f:
    contenido = f.read()

if mode == '--verify':
    all_ok = True
    for p in PATCHES:
        c = contenido.count(p['search'])
        status = 'OK ' if c == 1 else 'ERR'
        if c != 1: all_ok = False
        print(status + ' [' + p['desc'] + '] encontrado ' + str(c) + ' vez/veces')
    print('\n' + ('Listo para --apply' if all_ok else 'REVISAR errores antes de aplicar'))
    if not all_ok: sys.exit(1)

elif mode == '--apply':
    all_ok = True
    for p in PATCHES:
        if contenido.count(p['search']) != 1:
            print('ERR [' + p['desc'] + '] Abortando.')
            all_ok = False
    if not all_ok: sys.exit(1)
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

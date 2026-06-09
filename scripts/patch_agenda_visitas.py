#!/usr/bin/env python3
# patch_agenda_visitas.py
# Inserta el boton "Confirmar visita" en las tarjetas de agenda
# para actividades de tipo "Visita en Sitio"
# CREADO: 2026-06-08

import sys, os, shutil, datetime

TARGET_FILE = sys.argv[2] if len(sys.argv) > 2 else '/var/www/html/prospectos/assets/app.js'

# String exacto a buscar (linea 2539 aprox)
SEARCH = "        if (prospecto) html += '<div class=\"actividad-prospecto\">' + prospecto + '</div>';\n        html += '</div>';"

# Reemplazo: agrega deteccion Visita en Sitio entre ambas lineas
REPLACE = """        if (prospecto) html += '<div class="actividad-prospecto">' + prospecto + '</div>';
        // FIX 2026-06-08: boton Confirmar visita para actividades tipo "Visita en Sitio"
        var esVisitaSitio = (a.tipo_actividad || '').toLowerCase().indexOf('visita en sitio') !== -1;
        if (esVisitaSitio && uTask) {
          html += PWA.Visitas.renderBtnConfirmar(a);
        }
        html += '</div>';"""

mode = sys.argv[1] if len(sys.argv) > 1 else '--verify'

with open(TARGET_FILE, 'r') as f:
    contenido = f.read()

count = contenido.count(SEARCH)

if mode == '--verify':
    if count == 1:
        print('OK: string encontrado exactamente 1 vez. Listo para aplicar.')
    elif count == 0:
        print('ERROR: string NO encontrado. Verificar manualmente.')
        sys.exit(1)
    else:
        print('WARN: string encontrado ' + str(count) + ' veces.')
        sys.exit(1)

elif mode == '--apply':
    if count != 1:
        print('ERROR: string encontrado ' + str(count) + ' veces. Abortando.')
        sys.exit(1)
    ts = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    bak = TARGET_FILE + '.bak_' + ts
    shutil.copy2(TARGET_FILE, bak)
    print('Backup: ' + bak)
    nuevo = contenido.replace(SEARCH, REPLACE, 1)
    with open(TARGET_FILE, 'w') as f:
        f.write(nuevo)
    print('OK: patch aplicado en ' + TARGET_FILE)

elif mode == '--revert':
    baks = sorted([f for f in os.listdir(os.path.dirname(TARGET_FILE) or '.') if 'app.js.bak_' in f])
    if not baks:
        print('ERROR: no hay backups.')
        sys.exit(1)
    ultimo = os.path.join(os.path.dirname(TARGET_FILE) or '.', baks[-1])
    shutil.copy2(ultimo, TARGET_FILE)
    print('Revertido desde: ' + ultimo)

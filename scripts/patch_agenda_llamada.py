#!/usr/bin/env python3
# patch_agenda_llamada.py
# Agrega opcion RegistrarLlamada a api/agenda.php
# CREADO: 2026-06-09

import sys, os, shutil, datetime

TARGET = sys.argv[2] if len(sys.argv) > 2 else '/var/www/html/prospectos/api/agenda.php'
mode   = sys.argv[1] if len(sys.argv) > 1 else '--verify'

SEARCH = "    default:\n        $response = array('result' => false, 'msjError' => 'Opcion no reconocida');\n        break;\n}"

REPLACE = """    // ── RegistrarLlamada ────────────────────────────────────────
    // Crea una actividad de tipo Llamada Telefonica completada
    // en tasks_movimientos para el prospecto indicado.
    // CREADO: 2026-06-09
    case 'RegistrarLlamada':
        $uMovimiento = isset($input['u_movimiento']) ? intval($input['u_movimiento']) : 0;
        $tel         = isset($input['tel'])          ? trim($input['tel'])            : '';
        $durSeg      = isset($input['duracion_seg']) ? intval($input['duracion_seg']) : 0;
        $comentarios = isset($input['comentarios'])  ? trim($input['comentarios'])    : '';

        if ($uMovimiento <= 0) {
            $response = array('result' => false, 'msjError' => 'u_movimiento invalido');
            break;
        }

        $uidEsc  = DB_escape_string($userid);
        $telEsc  = DB_escape_string($tel);
        $comEsc  = DB_escape_string($comentarios);
        $now     = date('Y-m-d H:i:s');
        $hoy     = date('Y-m-d');
        $hora    = date('H:i:s');
        $dia     = intval(date('j'));
        $mes     = intval(date('n'));
        $anio    = intval(date('Y'));

        $mins    = intval(floor($durSeg / 60));
        $segs    = $durSeg % 60;
        $durTxt  = $mins > 0 ? $mins . 'min ' . $segs . 's' : $durSeg . 's';
        $desc    = 'Tel: ' . $tel . ' | Duracion: ' . $durTxt;
        if (!empty($comentarios)) { $desc .= ' | ' . $comentarios; }
        $descEsc = DB_escape_string($desc);

        // idstatus 5 = Fin-exito (llamada completada)
        // TipoMovimientoId 1 = Llamada Telefonica
        $sql = "INSERT INTO tasks_movimientos
                    (u_prospecto, TipoMovimientoId, titulo, concepto, descripcion,
                     fecha_compromiso, hora, dia, mes, anio,
                     u_user, UserId, idstatus, fecha_alta, fecha, activo)
                VALUES (
                    " . $uMovimiento . ", 1,
                    'Llamada Telefonica',
                    'Llamada a " . $telEsc . " (" . $durTxt . ")',
                    '" . $descEsc . "',
                    '" . $hoy . "', '" . $hora . "', " . $dia . ", " . $mes . ", " . $anio . ",
                    '" . $uidEsc . "', '" . $uidEsc . "',
                    5, '" . $now . "', '" . $hoy . "', 1
                )";

        ob_start();
        $res = DB_query($sql, $db);
        $err = ob_get_clean();

        if (!empty(trim($err))) {
            error_log('[PWA-agenda] RegistrarLlamada error: ' . strip_tags($err));
            $response = array('result' => false, 'msjError' => 'Error al registrar llamada');
            break;
        }

        $response = array('result' => true, 'msj' => 'Llamada registrada');
        break;

    default:
        $response = array('result' => false, 'msjError' => 'Opcion no reconocida');
        break;
}"""

with open(TARGET, 'r') as f:
    contenido = f.read()

if mode == '--verify':
    c = contenido.count(SEARCH)
    print(('OK' if c == 1 else 'ERR') + ': encontrado ' + str(c) + ' vez/veces')
    if c != 1: sys.exit(1)
    print('Listo para --apply')

elif mode == '--apply':
    if contenido.count(SEARCH) != 1:
        print('ERR: patron no encontrado. Abortando.')
        sys.exit(1)
    ts  = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    bak = TARGET + '.bak_' + ts
    shutil.copy2(TARGET, bak)
    print('Backup: ' + bak)
    contenido = contenido.replace(SEARCH, REPLACE, 1)
    with open(TARGET, 'w') as f:
        f.write(contenido)
    print('OK: RegistrarLlamada agregado en ' + TARGET)

elif mode == '--revert':
    base = os.path.dirname(TARGET) or '.'
    baks = sorted([f for f in os.listdir(base) if 'agenda.php.bak_' in f])
    if not baks: print('No hay backups.'); sys.exit(1)
    shutil.copy2(os.path.join(base, baks[-1]), TARGET)
    print('Revertido: ' + baks[-1])

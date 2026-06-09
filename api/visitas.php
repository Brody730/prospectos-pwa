<?php
/* ============================================================
   api/visitas.php
   Confirmación y aprobación de visitas en sitio — PWA ROGMAI
   PHP 5 compatible
   CREADO: 2026-06-08
   ============================================================ */
ini_set('display_errors', 0);
error_reporting(E_ALL);
ob_start();

session_start();

$PathPrefix = '/var/www/html/erpdistribucion/';
include($PathPrefix . 'config.php');
include($PathPrefix . 'includes/ConnectDB.inc');
include($PathPrefix . 'includes/SQL_CommonFunctions.inc');

while (ob_get_level() > 0) { ob_end_clean(); }
header('Content-Type: application/json');
ob_start();

// ── Constante supervisor ────────────────────────────────────
// Por ahora solo 'admin' es supervisor. Para agregar más,
// ampliar este array o mover a tabla de config.
// ACTUALIZAR 2026-06-08: solo admin y desarrollo usan esta función.
define('PWA_VISITAS_SUPERVISOR', 'admin');

// ── Helper: ejecutar query capturando output de DB_query ────
function vt_query($sql, $db, $ctx) {
    ob_start();
    $res = DB_query($sql, $db);
    $err = ob_get_clean();
    if (!empty(trim($err))) {
        error_log('[PWA-visitas] DB_query error (' . $ctx . '): ' . strip_tags($err));
        return false;
    }
    return $res;
}

// ── Helper: ¿el usuario actual es supervisor? ───────────────
function vt_es_supervisor($userid) {
    return ($userid === PWA_VISITAS_SUPERVISOR);
}

// ── Helper: enviar push al supervisor ──────────────────────
// Llama a api/push-send.php por HTTP interno.
// Si push falla la visita igual se guarda — no es bloqueante.
function vt_push_supervisor($titulo, $cuerpo, $url, $tag) {
    $payload = json_encode(array(
        'userid' => PWA_VISITAS_SUPERVISOR,
        'titulo' => $titulo,
        'cuerpo' => $cuerpo,
        'url'    => $url,
        'tag'    => $tag
    ));
    $pushUrl = 'http://localhost/prospectos/api/push-send.php';
    $ctx = stream_context_create(array('http' => array(
        'method'  => 'POST',
        'header'  => "Content-Type: application/json\r\n",
        'content' => $payload,
        'timeout' => 3
    )));
    @file_get_contents($pushUrl, false, $ctx);
}

// ── Helper: notificar al vendedor ───────────────────────────
function vt_push_vendedor($userid_vendedor, $titulo, $cuerpo, $url, $tag) {
    $payload = json_encode(array(
        'userid' => $userid_vendedor,
        'titulo' => $titulo,
        'cuerpo' => $cuerpo,
        'url'    => $url,
        'tag'    => $tag
    ));
    $pushUrl = 'http://localhost/prospectos/api/push-send.php';
    $ctx = stream_context_create(array('http' => array(
        'method'  => 'POST',
        'header'  => "Content-Type: application/json\r\n",
        'content' => $payload,
        'timeout' => 3
    )));
    @file_get_contents($pushUrl, false, $ctx);
}

// ── Helper: parsear coords desde link_google_map ────────────
// Formato guardado: "20.3713, -100.7956" o "20.3713,-100.7956"
function vt_parsear_link_google_map($link) {
    if (empty($link)) return null;
    $partes = explode(',', $link);
    if (count($partes) < 2) return null;
    $lat = floatval(trim($partes[0]));
    $lng = floatval(trim($partes[1]));
    if ($lat == 0.0 && $lng == 0.0) return null;
    return array('lat' => $lat, 'lng' => $lng);
}

// ── Validación de sesión ────────────────────────────────────
$response = null;

try {

if (!isset($_SESSION['UserID']) || empty($_SESSION['UserID'])) {
    ob_end_clean();
    echo json_encode(array('result' => false, 'msjError' => 'No autorizado'));
    exit;
}

$userid = $_SESSION['UserID'];
$raw    = file_get_contents('php://input');
$input  = json_decode($raw, true);
if (empty($input)) { $input = array(); }
if (!empty($_POST)) { $input = array_merge($_POST, $input); }

$opcion = isset($input['opcion']) ? $input['opcion'] : '';
error_log('[PWA] visitas opcion=' . $opcion . ' userid=' . $userid);

switch ($opcion) {

    // ──────────────────────────────────────────────────────
    // ConfirmarVisitaSitio
    // Vendedor confirma que está en el lugar y guarda coords.
    // Estado queda 'pendiente' hasta que supervisor apruebe.
    // ──────────────────────────────────────────────────────
    case 'ConfirmarVisitaSitio':
        $u_task        = isset($input['u_task'])        ? intval($input['u_task'])        : 0;
        $u_movimiento  = isset($input['u_movimiento'])  ? intval($input['u_movimiento'])  : 0;
        $lat_vend      = isset($input['lat_vendedor'])  ? floatval($input['lat_vendedor']): 0;
        $lng_vend      = isset($input['lng_vendedor'])  ? floatval($input['lng_vendedor']): 0;
        $comentarios   = isset($input['comentarios'])   ? trim($input['comentarios'])     : '';
        // Coords del prospecto enviadas desde el front (ya las trae TraerAgenda)
        $lat_prosp_raw = isset($input['lat_prospecto']) ? floatval($input['lat_prospecto']): null;
        $lng_prosp_raw = isset($input['lng_prospecto']) ? floatval($input['lng_prospecto']): null;

        if ($u_task <= 0 || $u_movimiento <= 0) {
            $response = array('result' => false, 'msjError' => 'Parametros invalidos');
            break;
        }

        if ($lat_vend == 0 || $lng_vend == 0) {
            $response = array('result' => false, 'msjError' => 'No se pudo obtener tu ubicacion GPS');
            break;
        }

        // Verificar que u_task pertenece al vendedor actual
        $uidEsc = DB_escape_string($userid);
        $sqlChk = "SELECT tm.u_movimiento AS u_task, tm.u_prospecto,
                          pm.link_google_map,
                          cb.lat AS lat_cb, cb.lng AS lng_cb,
                          d.name AS nombre_prospecto
                   FROM tasks_movimientos tm
                   INNER JOIN prospect_movimientos pm ON tm.u_prospecto = pm.u_movimiento
                   INNER JOIN debtorsmaster d         ON pm.debtorno    = d.debtorno
                   INNER JOIN custbranch cb           ON pm.debtorno = cb.debtorno
                                                     AND pm.branchcode = cb.branchcode
                   INNER JOIN salesman s              ON pm.salesman = s.salesmancode
                   WHERE tm.u_movimiento = " . $u_task . "
                     AND tm.u_prospecto  = " . $u_movimiento . "
                     AND s.usersales     = '" . $uidEsc . "'
                   LIMIT 1";

        $resChk = vt_query($sqlChk, $db, 'ConfirmarVisitaSitio-check');
        if ($resChk === false || DB_num_rows($resChk) === 0) {
            $response = array('result' => false, 'msjError' => 'Actividad no encontrada o no tienes permiso');
            break;
        }
        $rowChk = DB_fetch_array($resChk);

        // Verificar que no exista ya una confirmación pendiente o aprobada para esta tarea
        $sqlDup = "SELECT id FROM pwa_visitas_confirmacion
                   WHERE u_task = " . $u_task . "
                     AND estado IN ('pendiente','aprobada')
                   LIMIT 1";
        $resDup = vt_query($sqlDup, $db, 'ConfirmarVisitaSitio-dup');
        if ($resDup !== false && DB_num_rows($resDup) > 0) {
            $response = array('result' => false, 'msjError' => 'Esta visita ya fue confirmada anteriormente');
            break;
        }

        // Resolver coords del prospecto:
        // Prioridad 1: link_google_map del prospect (más específico)
        // Prioridad 2: custbranch.lat/lng (coords del cliente)
        // Prioridad 3: coords enviadas por el front (fallback)
        $coordsProsp = vt_parsear_link_google_map($rowChk['link_google_map']);
        if ($coordsProsp === null && !empty($rowChk['lat_cb']) && floatval($rowChk['lat_cb']) != 0) {
            $coordsProsp = array('lat' => floatval($rowChk['lat_cb']), 'lng' => floatval($rowChk['lng_cb']));
        }
        if ($coordsProsp === null && $lat_prosp_raw !== null && $lat_prosp_raw != 0) {
            $coordsProsp = array('lat' => $lat_prosp_raw, 'lng' => $lng_prosp_raw);
        }

        $lat_prosp   = ($coordsProsp !== null) ? $coordsProsp['lat'] : null;
        $lng_prosp   = ($coordsProsp !== null) ? $coordsProsp['lng'] : null;
        $distancia_m = null;

        // Calcular distancia Haversine en PHP si tenemos coords del prospecto
        if ($lat_prosp !== null && $lng_prosp !== null) {
            $R    = 6371000;
            $dLat = ($lat_prosp - $lat_vend) * M_PI / 180;
            $dLng = ($lng_prosp - $lng_vend) * M_PI / 180;
            $a    = sin($dLat/2)*sin($dLat/2)
                  + cos($lat_vend*M_PI/180)*cos($lat_prosp*M_PI/180)
                  * sin($dLng/2)*sin($dLng/2);
            $distancia_m = intval(round($R * 2 * atan2(sqrt($a), sqrt(1-$a))));
        }

        // INSERT en pwa_visitas_confirmacion
        $lat_prosp_sql = ($lat_prosp !== null) ? floatval($lat_prosp)  : 'NULL';
        $lng_prosp_sql = ($lng_prosp !== null) ? floatval($lng_prosp)  : 'NULL';
        $dist_sql      = ($distancia_m !== null) ? intval($distancia_m) : 'NULL';
        $comsEsc       = DB_escape_string($comentarios);
        $nowStr        = date('Y-m-d H:i:s');

        $sqlIns = "INSERT INTO pwa_visitas_confirmacion
                    (u_task, u_movimiento, userid_vendedor,
                     lat_vendedor, lng_vendedor,
                     lat_prospecto, lng_prospecto,
                     distancia_m, comentarios, estado,
                     fecha_confirmacion, fecha_alta)
                   VALUES (
                    " . $u_task . ", " . $u_movimiento . ", '" . $uidEsc . "',
                    " . floatval($lat_vend) . ", " . floatval($lng_vend) . ",
                    " . $lat_prosp_sql . ", " . $lng_prosp_sql . ",
                    " . $dist_sql . ", '" . $comsEsc . "', 'pendiente',
                    '" . $nowStr . "', '" . $nowStr . "'
                   )";

        $resIns = vt_query($sqlIns, $db, 'ConfirmarVisitaSitio-insert');
        if ($resIns === false) {
            $response = array('result' => false, 'msjError' => 'Error al guardar la visita');
            break;
        }

        // Push al supervisor
        $nombreProsp = $rowChk['nombre_prospecto'];
        $distTexto   = ($distancia_m !== null) ? $distancia_m . 'm del prospecto' : 'sin coords de prospecto';
        vt_push_supervisor(
            'Visita pendiente de aprobación',
            $userid . ' confirmó visita en ' . $nombreProsp . ' (' . $distTexto . ')',
            '/prospectos/?view=visitas-pendientes',
            'visita-pendiente-' . $u_task
        );

        $response = array(
            'result'      => true,
            'distancia_m' => $distancia_m,
            'msj'         => 'Visita guardada. Pendiente de aprobación por supervisor.'
        );
        break;

    // ──────────────────────────────────────────────────────
    // AprobarVisita — solo supervisor
    // ──────────────────────────────────────────────────────
    case 'AprobarVisita':
        if (!vt_es_supervisor($userid)) {
            $response = array('result' => false, 'msjError' => 'Sin permiso');
            break;
        }

        $id = isset($input['id']) ? intval($input['id']) : 0;
        if ($id <= 0) {
            $response = array('result' => false, 'msjError' => 'ID invalido');
            break;
        }

        $supEsc = DB_escape_string($userid);
        $nowStr = date('Y-m-d H:i:s');

        // Obtener datos antes de aprobar para poder notificar al vendedor
        $sqlGet = "SELECT userid_vendedor, u_movimiento FROM pwa_visitas_confirmacion WHERE id = " . $id . " LIMIT 1";
        $resGet = vt_query($sqlGet, $db, 'AprobarVisita-get');
        $rowGet = ($resGet !== false) ? DB_fetch_array($resGet) : null;

        $sqlUpd = "UPDATE pwa_visitas_confirmacion
                   SET estado = 'aprobada',
                       userid_supervisor  = '" . $supEsc . "',
                       fecha_resolucion   = '" . $nowStr . "'
                   WHERE id = " . $id . "
                     AND estado = 'pendiente'";

        $resUpd = vt_query($sqlUpd, $db, 'AprobarVisita-update');
        if ($resUpd === false) {
            $response = array('result' => false, 'msjError' => 'Error al aprobar');
            break;
        }

        // Notificar al vendedor
        if ($rowGet) {
            vt_push_vendedor(
                $rowGet['userid_vendedor'],
                'Visita aprobada ✓',
                'Tu visita fue aprobada por el supervisor.',
                '/prospectos/?u_movimiento=' . $rowGet['u_movimiento'],
                'visita-aprobada-' . $id
            );
        }

        $response = array('result' => true, 'msj' => 'Visita aprobada');
        break;

    // ──────────────────────────────────────────────────────
    // RechazarVisita — solo supervisor
    // ──────────────────────────────────────────────────────
    case 'RechazarVisita':
        if (!vt_es_supervisor($userid)) {
            $response = array('result' => false, 'msjError' => 'Sin permiso');
            break;
        }

        $id            = isset($input['id'])            ? intval($input['id'])              : 0;
        $motivo        = isset($input['motivo_rechazo'])? trim($input['motivo_rechazo'])    : '';
        if ($id <= 0) {
            $response = array('result' => false, 'msjError' => 'ID invalido');
            break;
        }

        $supEsc    = DB_escape_string($userid);
        $motivoEsc = DB_escape_string($motivo);
        $nowStr    = date('Y-m-d H:i:s');

        $sqlGet = "SELECT userid_vendedor, u_movimiento FROM pwa_visitas_confirmacion WHERE id = " . $id . " LIMIT 1";
        $resGet = vt_query($sqlGet, $db, 'RechazarVisita-get');
        $rowGet = ($resGet !== false) ? DB_fetch_array($resGet) : null;

        $sqlUpd = "UPDATE pwa_visitas_confirmacion
                   SET estado            = 'rechazada',
                       userid_supervisor = '" . $supEsc . "',
                       motivo_rechazo    = '" . $motivoEsc . "',
                       fecha_resolucion  = '" . $nowStr . "'
                   WHERE id = " . $id . "
                     AND estado = 'pendiente'";

        $resUpd = vt_query($sqlUpd, $db, 'RechazarVisita-update');
        if ($resUpd === false) {
            $response = array('result' => false, 'msjError' => 'Error al rechazar');
            break;
        }

        if ($rowGet) {
            vt_push_vendedor(
                $rowGet['userid_vendedor'],
                'Visita rechazada',
                'El supervisor rechazó tu visita. Motivo: ' . ($motivo ?: 'sin especificar'),
                '/prospectos/?u_movimiento=' . $rowGet['u_movimiento'],
                'visita-rechazada-' . $id
            );
        }

        $response = array('result' => true, 'msj' => 'Visita rechazada');
        break;

    // ──────────────────────────────────────────────────────
    // TraerPendientes — cola de aprobación para supervisor
    // ──────────────────────────────────────────────────────
    case 'TraerPendientes':
        if (!vt_es_supervisor($userid)) {
            $response = array('result' => false, 'msjError' => 'Sin permiso');
            break;
        }

        $sql = "SELECT
                    vc.id,
                    vc.u_task,
                    vc.u_movimiento,
                    vc.userid_vendedor,
                    vc.lat_vendedor,
                    vc.lng_vendedor,
                    vc.lat_prospecto,
                    vc.lng_prospecto,
                    vc.distancia_m,
                    vc.comentarios,
                    vc.estado,
                    vc.fecha_confirmacion,
                    d.name AS nombre_prospecto,
                    tm.titulo AS titulo_tarea,
                    tm.fecha_compromiso
                FROM pwa_visitas_confirmacion vc
                INNER JOIN tasks_movimientos tm   ON vc.u_task       = tm.u_movimiento
                INNER JOIN prospect_movimientos pm ON vc.u_movimiento = pm.u_movimiento
                INNER JOIN debtorsmaster d         ON pm.debtorno     = d.debtorno
                WHERE vc.estado = 'pendiente'
                ORDER BY vc.fecha_confirmacion DESC
                LIMIT 50";

        $res = vt_query($sql, $db, 'TraerPendientes');
        if ($res === false) {
            $response = array('result' => false, 'msjError' => 'Error de base de datos');
            break;
        }

        $items = array();
        while ($row = DB_fetch_array($res)) { $items[] = $row; }

        $response = array('result' => true, 'contenido' => $items, 'total' => count($items));
        break;

    // ──────────────────────────────────────────────────────
    // TraerVisitasVendedor — historial de visitas del vendedor
    // ──────────────────────────────────────────────────────
    case 'TraerVisitasVendedor':
        $u_movimiento = isset($input['u_movimiento']) ? intval($input['u_movimiento']) : 0;

        $uidEsc = DB_escape_string($userid);

        $whereExtra = ($u_movimiento > 0) ? " AND vc.u_movimiento = " . $u_movimiento : '';

        $sql = "SELECT
                    vc.id,
                    vc.u_task,
                    vc.u_movimiento,
                    vc.distancia_m,
                    vc.comentarios,
                    vc.estado,
                    vc.motivo_rechazo,
                    vc.fecha_confirmacion,
                    vc.fecha_resolucion,
                    d.name AS nombre_prospecto
                FROM pwa_visitas_confirmacion vc
                INNER JOIN prospect_movimientos pm ON vc.u_movimiento = pm.u_movimiento
                INNER JOIN debtorsmaster d          ON pm.debtorno     = d.debtorno
                WHERE vc.userid_vendedor = '" . $uidEsc . "'
                " . $whereExtra . "
                ORDER BY vc.fecha_confirmacion DESC
                LIMIT 30";

        $res = vt_query($sql, $db, 'TraerVisitasVendedor');
        if ($res === false) {
            $response = array('result' => false, 'msjError' => 'Error de base de datos');
            break;
        }

        $items = array();
        while ($row = DB_fetch_array($res)) { $items[] = $row; }

        $response = array('result' => true, 'contenido' => $items);
        break;

    default:
        $response = array('result' => false, 'msjError' => 'Opcion no reconocida');
        break;
}

} catch (Exception $e) {
    $response = array('result' => false, 'msjError' => 'Error interno: ' . $e->getMessage());
}

ob_end_clean();
echo json_encode($response !== null ? $response : array('result' => false, 'msjError' => 'Error interno'));
?>

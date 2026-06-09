<?php
/* ============================================================
   api/aprobacion.php
   Aprobación de prospectos nuevos por supervisor — PWA ROGMAI
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

define('APR_SUPERVISOR', 'admin');

function apr_query($sql, $db, $ctx) {
    ob_start();
    $res = DB_query($sql, $db);
    $err = ob_get_clean();
    if (!empty(trim($err))) {
        error_log('[PWA-aprobacion] DB_query error (' . $ctx . '): ' . strip_tags($err));
        return false;
    }
    return $res;
}

function apr_push($userid, $titulo, $cuerpo, $url, $tag) {
    $payload = json_encode(array(
        'userid' => $userid, 'titulo' => $titulo,
        'cuerpo' => $cuerpo, 'url'    => $url, 'tag' => $tag
    ));
    $ctx = stream_context_create(array('http' => array(
        'method'  => 'POST',
        'header'  => "Content-Type: application/json\r\n",
        'content' => $payload, 'timeout' => 3
    )));
    @file_get_contents('http://localhost/prospectos/api/push-send.php', false, $ctx);
}

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
error_log('[PWA] aprobacion opcion=' . $opcion . ' userid=' . $userid);

switch ($opcion) {

    // ── SolicitarAprobacion ──────────────────────────────────
    // Llamado automáticamente al crear un prospecto nuevo.
    // Crea el registro en pendiente y notifica al supervisor.
    case 'SolicitarAprobacion':
        $u_movimiento     = isset($input['u_movimiento'])    ? intval($input['u_movimiento'])       : 0;
        $nombre_prospecto = isset($input['nombre'])          ? trim($input['nombre'])               : '';

        if ($u_movimiento <= 0) {
            $response = array('result' => false, 'msjError' => 'u_movimiento invalido');
            break;
        }

        // Evitar duplicados
        $uidEsc = DB_escape_string($userid);
        $sqlDup = "SELECT id FROM pwa_prospectos_aprobacion WHERE u_movimiento = " . $u_movimiento . " LIMIT 1";
        $resDup = apr_query($sqlDup, $db, 'SolicitarAprobacion-dup');
        if ($resDup !== false && DB_num_rows($resDup) > 0) {
            $response = array('result' => true, 'msj' => 'Ya existe solicitud de aprobacion');
            break;
        }

        $nomEsc = DB_escape_string($nombre_prospecto);
        $now    = date('Y-m-d H:i:s');

        $sqlIns = "INSERT INTO pwa_prospectos_aprobacion
                    (u_movimiento, nombre_prospecto, userid_vendedor, estado, fecha_alta)
                   VALUES (" . $u_movimiento . ", '" . $nomEsc . "', '" . $uidEsc . "', 'pendiente', '" . $now . "')";

        $resIns = apr_query($sqlIns, $db, 'SolicitarAprobacion-insert');
        if ($resIns === false) {
            $response = array('result' => false, 'msjError' => 'Error al registrar solicitud');
            break;
        }

        apr_push(
            APR_SUPERVISOR,
            'Prospecto nuevo por aprobar',
            $userid . ' creó el prospecto "' . $nombre_prospecto . '" — requiere aprobación.',
            '/prospectos/?view=aprobaciones-pendientes',
            'prospecto-aprobacion-' . $u_movimiento
        );

        $response = array('result' => true, 'msj' => 'Solicitud enviada al supervisor');
        break;

    // ── AprobarProspecto ─────────────────────────────────────
    case 'AprobarProspecto':
        if ($userid !== APR_SUPERVISOR) {
            $response = array('result' => false, 'msjError' => 'Sin permiso');
            break;
        }

        $id = isset($input['id']) ? intval($input['id']) : 0;
        if ($id <= 0) { $response = array('result' => false, 'msjError' => 'ID invalido'); break; }

        $sqlGet = "SELECT userid_vendedor, nombre_prospecto, u_movimiento FROM pwa_prospectos_aprobacion WHERE id = " . $id . " LIMIT 1";
        $resGet = apr_query($sqlGet, $db, 'AprobarProspecto-get');
        $rowGet = ($resGet !== false) ? DB_fetch_array($resGet) : null;

        $supEsc = DB_escape_string($userid);
        $now    = date('Y-m-d H:i:s');

        $sqlUpd = "UPDATE pwa_prospectos_aprobacion
                   SET estado = 'aprobado', userid_supervisor = '" . $supEsc . "', fecha_resolucion = '" . $now . "'
                   WHERE id = " . $id . " AND estado = 'pendiente'";

        $resUpd = apr_query($sqlUpd, $db, 'AprobarProspecto-update');
        if ($resUpd === false) { $response = array('result' => false, 'msjError' => 'Error'); break; }

        if ($rowGet) {
            apr_push(
                $rowGet['userid_vendedor'],
                'Prospecto aprobado ✓',
                'Tu prospecto "' . $rowGet['nombre_prospecto'] . '" fue aprobado.',
                '/prospectos/?u_movimiento=' . $rowGet['u_movimiento'],
                'prospecto-aprobado-' . $id
            );
        }

        $response = array('result' => true, 'msj' => 'Prospecto aprobado');
        break;

    // ── RechazarProspecto ────────────────────────────────────
    case 'RechazarProspecto':
        if ($userid !== APR_SUPERVISOR) {
            $response = array('result' => false, 'msjError' => 'Sin permiso');
            break;
        }

        $id     = isset($input['id'])            ? intval($input['id'])              : 0;
        $motivo = isset($input['motivo_rechazo'])? trim($input['motivo_rechazo'])    : '';
        if ($id <= 0) { $response = array('result' => false, 'msjError' => 'ID invalido'); break; }

        $sqlGet = "SELECT userid_vendedor, nombre_prospecto, u_movimiento FROM pwa_prospectos_aprobacion WHERE id = " . $id . " LIMIT 1";
        $resGet = apr_query($sqlGet, $db, 'RechazarProspecto-get');
        $rowGet = ($resGet !== false) ? DB_fetch_array($resGet) : null;

        $supEsc    = DB_escape_string($userid);
        $motivoEsc = DB_escape_string($motivo);
        $now       = date('Y-m-d H:i:s');

        $sqlUpd = "UPDATE pwa_prospectos_aprobacion
                   SET estado = 'rechazado', userid_supervisor = '" . $supEsc . "',
                       motivo_rechazo = '" . $motivoEsc . "', fecha_resolucion = '" . $now . "'
                   WHERE id = " . $id . " AND estado = 'pendiente'";

        $resUpd = apr_query($sqlUpd, $db, 'RechazarProspecto-update');
        if ($resUpd === false) { $response = array('result' => false, 'msjError' => 'Error'); break; }

        if ($rowGet) {
            apr_push(
                $rowGet['userid_vendedor'],
                'Prospecto rechazado',
                'Tu prospecto "' . $rowGet['nombre_prospecto'] . '" fue rechazado. Motivo: ' . ($motivo ?: 'sin especificar'),
                '/prospectos/?u_movimiento=' . $rowGet['u_movimiento'],
                'prospecto-rechazado-' . $id
            );
        }

        $response = array('result' => true, 'msj' => 'Prospecto rechazado');
        break;

    // ── TraerPendientesAprobacion ────────────────────────────
    case 'TraerPendientesAprobacion':
        if ($userid !== APR_SUPERVISOR) {
            $response = array('result' => false, 'msjError' => 'Sin permiso');
            break;
        }

        $sql = "SELECT id, u_movimiento, nombre_prospecto, userid_vendedor, estado, fecha_alta
                FROM pwa_prospectos_aprobacion
                WHERE estado = 'pendiente'
                ORDER BY fecha_alta DESC
                LIMIT 50";

        $res = apr_query($sql, $db, 'TraerPendientesAprobacion');
        if ($res === false) { $response = array('result' => false, 'msjError' => 'Error'); break; }

        $items = array();
        while ($row = DB_fetch_array($res)) { $items[] = $row; }

        $response = array('result' => true, 'contenido' => $items, 'total' => count($items));
        break;

    // ── TraerEstadoProspecto ─────────────────────────────────
    // Para mostrar badge en la tarjeta del prospecto.
    case 'TraerEstadoProspecto':
        $u_movimiento = isset($input['u_movimiento']) ? intval($input['u_movimiento']) : 0;
        if ($u_movimiento <= 0) { $response = array('result' => false, 'msjError' => 'ID invalido'); break; }

        $sql = "SELECT estado, motivo_rechazo, fecha_resolucion
                FROM pwa_prospectos_aprobacion
                WHERE u_movimiento = " . $u_movimiento . "
                ORDER BY fecha_alta DESC LIMIT 1";

        $res = apr_query($sql, $db, 'TraerEstadoProspecto');
        if ($res === false || DB_num_rows($res) === 0) {
            $response = array('result' => true, 'estado' => null);
            break;
        }
        $row = DB_fetch_array($res);
        $response = array('result' => true, 'estado' => $row['estado'], 'motivo_rechazo' => $row['motivo_rechazo']);
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

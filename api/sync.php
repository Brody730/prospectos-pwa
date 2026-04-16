<?php
/* ============================================================
   api/sync.php
   Procesador de cola offline
   Recibe lote de acciones, las aplica a MySQL
   PWA Prospectos ROGMAI
   ============================================================ */
ini_set('display_errors', 0);
error_reporting(E_ALL);
ob_start();

session_start();

$PathPrefix = '../../';
include($PathPrefix . 'config.php');
include($PathPrefix . 'includes/ConnectDB.inc');
include($PathPrefix . 'includes/SQL_CommonFunctions.inc');

ob_end_clean();
header('Content-Type: application/json');

try {

if (!isset($_SESSION['UserID']) || empty($_SESSION['UserID'])) {
    echo json_encode(array('result' => false, 'msjError' => 'No autorizado'));
    exit;
}

$userid = $_SESSION['UserID'];

$input = json_decode(file_get_contents('php://input'), true);
$queue = isset($input['queue']) ? $input['queue'] : array();

$synced = 0;
$errors = array();

// Ordenar por timestamp ascendente para aplicar en orden cronológico
usort($queue, function($a, $b) {
    $ta = isset($a['timestamp']) ? $a['timestamp'] : 0;
    $tb = isset($b['timestamp']) ? $b['timestamp'] : 0;
    if ($ta == $tb) return 0;
    return $ta < $tb ? -1 : 1;
});

foreach ($queue as $item) {
    $action  = isset($item['action'])  ? $item['action']  : '';
    $payload = isset($item['payload']) ? $item['payload']  : array();

    DB_Txn_Begin($db);
    $ok = true;

    switch ($action) {

        case 'nueva_actividad':
            $fecha       = isset($payload['fecha'])        ? $payload['fecha']                           : date('Y-m-d');
            $concepto    = isset($payload['concepto'])     ? addslashes($payload['concepto'])            : '';
            $descripcion = isset($payload['descripcion'])  ? addslashes($payload['descripcion'])         : '';
            $uMovimiento = isset($payload['u_movimiento']) ? intval($payload['u_movimiento'])            : 0;
            $titulo      = isset($payload['titulo'])       ? addslashes($payload['titulo'])              : $concepto;
            $tipo        = isset($payload['tipo'])         ? intval($payload['tipo'])                    : 1;
            $hora        = isset($payload['hora'])         ? addslashes($payload['hora'])                : '09:00';

            $sql = "INSERT INTO tasks_movimientos
                        (u_proyecto, dia, mes, anio, concepto, descripcion, u_user,
                         idstatus, fecha_compromiso, fecha_alta, u_movimiento, titulo,
                         TipoMovimientoId, hora)
                    VALUES
                        (0,
                         '" . date('d', strtotime($fecha)) . "',
                         '" . date('m', strtotime($fecha)) . "',
                         '" . date('Y', strtotime($fecha)) . "',
                         '" . $concepto . "',
                         '" . $descripcion . "',
                         '" . addslashes($userid) . "',
                         1,
                         '" . $fecha . "',
                         NOW(),
                         '" . $uMovimiento . "',
                         '" . $titulo . "',
                         '" . $tipo . "',
                         '" . $hora . "')";
            DB_query($sql, $db);
            break;

        case 'cambio_estatus':
            $uMovimiento = isset($payload['u_movimiento']) ? intval($payload['u_movimiento']) : 0;
            $idstatus    = isset($payload['idstatus'])     ? intval($payload['idstatus'])     : 0;
            if (!$uMovimiento || !$idstatus) { $ok = false; break; }
            $sql = "UPDATE prospect_movimientos
                    SET idstatus = '" . $idstatus . "'
                    WHERE u_movimiento = '" . $uMovimiento . "'";
            DB_query($sql, $db);
            break;

        case 'registrar_visita_gps':
            $lat = isset($payload['lat']) ? floatval($payload['lat']) : 0;
            $lng = isset($payload['lng']) ? floatval($payload['lng']) : 0;
            if (!$lat || !$lng) { $ok = false; break; }
            $sql = "INSERT INTO royalRoute (userid, latitude, longitude, fecha_registro, fecha_modificacion)
                    VALUES ('" . addslashes($userid) . "', '" . $lat . "', '" . $lng . "', NOW(), NOW())";
            DB_query($sql, $db);
            break;

        case 'nuevo_prospecto':
            $nombre   = isset($payload['DebtorName']) ? addslashes($payload['DebtorName']) : '';
            $telefono = isset($payload['PhoneNo'])    ? addslashes($payload['PhoneNo'])    : '';
            $email    = isset($payload['email'])      ? addslashes($payload['email'])      : '';
            $idstatus = isset($payload['idstatus'])   ? intval($payload['idstatus'])       : 1;
            if (!$nombre) { $ok = false; break; }
            // Usar modelo para guardar prospecto
            include_once($PathPrefix . 'modelo/ProspectV2Modelo.php');
            $modelo = new ProspectV2Modelo($db);
            $res = $modelo->GuardarProspecto(array(
                'userid'     => $userid,
                'DebtorName' => $nombre,
                'PhoneNo'    => $telefono,
                'email'      => $email,
                'idstatus'   => $idstatus,
            ));
            if (!$res['result']) { $ok = false; }
            break;

        case 'enviar_mensaje':
            $uMovimiento = isset($payload['u_movimiento']) ? intval($payload['u_movimiento']) : 0;
            $mensaje     = isset($payload['mensaje'])      ? addslashes($payload['mensaje'])   : '';
            if (!$uMovimiento || !$mensaje) { $ok = false; break; }
            $sql = "INSERT INTO chat_erp (u_movimiento, userid, mensaje, fecha_alta, tipo)
                    VALUES ('" . $uMovimiento . "',
                            '" . addslashes($userid) . "',
                            '" . $mensaje . "',
                            NOW(), 'vendedor')";
            DB_query($sql, $db);
            break;

        default:
            $ok = false;
            $errors[] = array('action' => $action, 'error' => 'Accion desconocida');
            break;
    }

    if ($ok) {
        DB_Txn_Commit($db);
        $synced++;
    } else {
        DB_Txn_Rollback($db);
        if (!isset($errors[count($errors)-1]['action']) || $errors[count($errors)-1]['action'] !== $action) {
            $errors[] = array('action' => $action, 'error' => 'Error procesando accion');
        }
    }
}

echo json_encode(array(
    'result'  => true,
    'synced'  => $synced,
    'errors'  => $errors,
    'total'   => count($queue)
));

} catch (Exception $e) {
    echo json_encode(array('result' => false, 'msjError' => 'Error interno: ' . $e->getMessage()));
}
?>

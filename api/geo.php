<?php
/* ============================================================
   api/geo.php
   GPS: registra posición en royalRoute y visitas
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
if (!$input) { $input = $_POST; }

$opcion = isset($input['opcion']) ? $input['opcion'] : '';

switch ($opcion) {

    case 'RegistrarPosicion':
        $lat = isset($input['lat']) ? floatval($input['lat']) : 0;
        $lng = isset($input['lng']) ? floatval($input['lng']) : 0;

        if (!$lat || !$lng) {
            echo json_encode(array('result' => false, 'msjError' => 'Coordenadas inválidas'));
            break;
        }

        $sql = "INSERT INTO royalRoute (userid, latitude, longitude, fecha_registro, fecha_modificacion)
                VALUES ('" . addslashes($userid) . "',
                        '" . $lat . "',
                        '" . $lng . "',
                        NOW(), NOW())";
        DB_query($sql, $db);
        echo json_encode(array('result' => true));
        break;

    case 'RegistrarVisita':
        $lat         = isset($input['lat'])          ? floatval($input['lat'])              : 0;
        $lng         = isset($input['lng'])          ? floatval($input['lng'])              : 0;
        $uMovimiento = isset($input['u_movimiento']) ? intval($input['u_movimiento'])       : 0;
        $titulo      = isset($input['titulo'])       ? addslashes($input['titulo'])         : 'Visita GPS';
        $descripcion = isset($input['descripcion'])  ? addslashes($input['descripcion'])    : '';

        if (!$lat || !$lng || !$uMovimiento) {
            echo json_encode(array('result' => false, 'msjError' => 'Datos incompletos'));
            break;
        }

        DB_Txn_Begin($db);

        // Registrar en royalRoute
        $sql1 = "INSERT INTO royalRoute (userid, latitude, longitude, fecha_registro, fecha_modificacion)
                 VALUES ('" . addslashes($userid) . "', '" . $lat . "', '" . $lng . "', NOW(), NOW())";
        DB_query($sql1, $db);

        // Registrar actividad de visita
        $hoy = date('Y-m-d');
        $sql2 = "INSERT INTO tasks_movimientos
                    (u_proyecto, dia, mes, anio, concepto, descripcion, u_user,
                     idstatus, fecha_compromiso, fecha_alta, u_movimiento, titulo,
                     TipoMovimientoId, hora)
                 VALUES
                    (0, '" . date('d') . "', '" . date('m') . "', '" . date('Y') . "',
                     '" . $titulo . "',
                     '" . $descripcion . " [GPS: " . $lat . "," . $lng . "]',
                     '" . addslashes($userid) . "',
                     1, '" . $hoy . "', NOW(),
                     '" . $uMovimiento . "',
                     '" . $titulo . "',
                     2, '" . date('H:i') . "')";
        DB_query($sql2, $db);

        DB_Txn_Commit($db);
        echo json_encode(array('result' => true));
        break;

    default:
        echo json_encode(array('result' => false, 'msjError' => 'Opcion no reconocida'));
        break;
}

} catch (Exception $e) {
    echo json_encode(array('result' => false, 'msjError' => 'Error interno: ' . $e->getMessage()));
}
?>

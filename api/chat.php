<?php
/* ============================================================
   api/chat.php
   Wrapper → modelo/ChatModelo.php
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

include($PathPrefix . 'modelo/ChatModelo.php');
$modelo = new ChatModelo($db);

switch ($opcion) {

    case 'TraerMensajes':
        $uMovimiento = isset($input['u_movimiento']) ? intval($input['u_movimiento']) : 0;
        if (!$uMovimiento) {
            echo json_encode(array('result' => false, 'msjError' => 'u_movimiento requerido'));
            break;
        }
        $resultado = $modelo->TraerMensajes(array(
            'u_movimiento' => $uMovimiento,
            'userid'       => $userid
        ));
        echo json_encode($resultado);
        break;

    case 'EnviarMensaje':
        $uMovimiento = isset($input['u_movimiento']) ? intval($input['u_movimiento'])  : 0;
        $mensaje     = isset($input['mensaje'])      ? trim($input['mensaje'])          : '';
        if (!$uMovimiento || !$mensaje) {
            echo json_encode(array('result' => false, 'msjError' => 'Datos incompletos'));
            break;
        }
        $resultado = $modelo->EnviarMensaje(array(
            'u_movimiento' => $uMovimiento,
            'userid'       => $userid,
            'mensaje'      => $mensaje
        ));
        echo json_encode($resultado);
        break;

    case 'MarcarLeido':
        $uMovimiento = isset($input['u_movimiento']) ? intval($input['u_movimiento']) : 0;
        if (!$uMovimiento) {
            echo json_encode(array('result' => false, 'msjError' => 'u_movimiento requerido'));
            break;
        }
        $resultado = $modelo->MarcarLeido(array(
            'u_movimiento' => $uMovimiento,
            'userid'       => $userid
        ));
        echo json_encode($resultado);
        break;

    default:
        echo json_encode(array('result' => false, 'msjError' => 'Opcion no reconocida'));
        break;
}

} catch (Exception $e) {
    echo json_encode(array('result' => false, 'msjError' => 'Error interno: ' . $e->getMessage()));
}
?>

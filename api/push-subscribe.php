<?php
/* ============================================================
   api/push-subscribe.php
   Gestion de suscripciones Web Push.
   Opciones:
     - public-key  : devuelve VAPID_PUBLIC_KEY para pushManager.subscribe()
     - subscribe   : guarda una suscripcion
     - unsubscribe : marca una suscripcion como inactiva
   PWA Prospectos ROGMAI
   ============================================================ */
ini_set('display_errors', 0);
error_reporting(E_ALL);
ob_start();

session_start();

$PathPrefix = '/var/www/html/erpdistribucion/';
include($PathPrefix . 'config.php');
include($PathPrefix . 'includes/ConnectDB.inc');
include($PathPrefix . 'includes/SQL_CommonFunctions.inc');

// Config VAPID — el archivo se genera con scripts/gen-vapid.php
$pushConfig = __DIR__ . '/push-config.php';
if (!file_exists($pushConfig)) {
    ob_end_clean();
    header('Content-Type: application/json');
    echo json_encode(array(
        'result'   => false,
        'msjError' => 'push-config.php no existe — ejecuta scripts/gen-vapid.php'
    ));
    exit;
}
require_once($pushConfig);

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

    case 'public-key':
        echo json_encode(array(
            'result'    => true,
            'publicKey' => VAPID_PUBLIC_KEY
        ));
        break;

    case 'subscribe':
        $endpoint  = isset($input['endpoint'])  ? trim($input['endpoint']) : '';
        $p256dh    = isset($input['p256dh'])    ? trim($input['p256dh'])   : '';
        $authToken = isset($input['auth'])      ? trim($input['auth'])     : '';
        $userAgent = isset($_SERVER['HTTP_USER_AGENT']) ? substr($_SERVER['HTTP_USER_AGENT'], 0, 250) : '';

        if ($endpoint === '' || $p256dh === '' || $authToken === '') {
            echo json_encode(array('result' => false, 'msjError' => 'Datos incompletos'));
            break;
        }

        $endpointHash = sha1($endpoint);

        // Si ya existe (mismo userid + endpoint) → actualizar y reactivar
        $endpointEsc  = addslashes($endpoint);
        $hashEsc      = addslashes($endpointHash);
        $p256dhEsc    = addslashes($p256dh);
        $authEsc      = addslashes($authToken);
        $uaEsc        = addslashes($userAgent);
        $useridEsc    = addslashes($userid);

        $sqlSel = "SELECT id FROM pwa_push_subscriptions
                   WHERE userid = '" . $useridEsc . "'
                     AND endpoint_hash = '" . $hashEsc . "'
                   LIMIT 1";
        $resSel = DB_query($sqlSel, $db);
        $row    = $resSel ? DB_fetch_array($resSel) : null;

        if ($row && isset($row['id'])) {
            $sql = "UPDATE pwa_push_subscriptions
                    SET p256dh      = '" . $p256dhEsc . "',
                        auth_token  = '" . $authEsc   . "',
                        user_agent  = '" . $uaEsc     . "',
                        activa      = 1,
                        fecha_uso   = NOW()
                    WHERE id = " . intval($row['id']);
            DB_query($sql, $db);
        } else {
            $sql = "INSERT INTO pwa_push_subscriptions
                        (userid, endpoint, endpoint_hash, p256dh, auth_token,
                         user_agent, fecha_alta, fecha_uso, activa)
                    VALUES
                        ('" . $useridEsc . "',
                         '" . $endpointEsc . "',
                         '" . $hashEsc . "',
                         '" . $p256dhEsc . "',
                         '" . $authEsc . "',
                         '" . $uaEsc . "',
                         NOW(), NOW(), 1)";
            DB_query($sql, $db);
        }

        error_log('[PUSH SUB] userid=' . $userid . ' hash=' . $endpointHash);
        echo json_encode(array('result' => true));
        break;

    case 'unsubscribe':
        $endpoint = isset($input['endpoint']) ? trim($input['endpoint']) : '';
        if ($endpoint === '') {
            echo json_encode(array('result' => false, 'msjError' => 'Falta endpoint'));
            break;
        }
        $hashEsc   = addslashes(sha1($endpoint));
        $useridEsc = addslashes($userid);
        $sql = "UPDATE pwa_push_subscriptions
                SET activa = 0
                WHERE userid = '" . $useridEsc . "'
                  AND endpoint_hash = '" . $hashEsc . "'";
        DB_query($sql, $db);
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

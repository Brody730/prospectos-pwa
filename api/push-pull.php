<?php
/* ============================================================
   api/push-pull.php
   Lo invoca el Service Worker cuando recibe un push vacio.
   Devuelve la lista de notificaciones pendientes para el user
   logueado y las marca como entregadas.

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

ob_end_clean();
header('Content-Type: application/json');

try {

if (!isset($_SESSION['UserID']) || empty($_SESSION['UserID'])) {
    echo json_encode(array('result' => false, 'msjError' => 'No autorizado',
                           'notificaciones' => array()));
    exit;
}

$userid    = $_SESSION['UserID'];
$useridEsc = addslashes($userid);

// Obtener pendientes (limite 20 para no saturar)
$sql = "SELECT id, titulo, cuerpo, url, tag
        FROM pwa_push_pendientes
        WHERE userid = '" . $useridEsc . "'
          AND entregada = 0
        ORDER BY fecha_alta ASC
        LIMIT 20";
$res = DB_query($sql, $db);

$notificaciones = array();
$ids            = array();
while ($row = DB_fetch_array($res)) {
    $notificaciones[] = array(
        'titulo' => $row['titulo'],
        'cuerpo' => $row['cuerpo'],
        'url'    => $row['url'] ?: '/prospectos/',
        'tag'    => $row['tag'] ?: 'pwa_push'
    );
    $ids[] = intval($row['id']);
}

// Marcar como entregadas
if (!empty($ids)) {
    $idsLista = implode(',', $ids);
    DB_query("UPDATE pwa_push_pendientes
              SET entregada = 1, fecha_entrega = NOW()
              WHERE id IN (" . $idsLista . ")", $db);
}

echo json_encode(array(
    'result'         => true,
    'notificaciones' => $notificaciones
));

} catch (Exception $e) {
    echo json_encode(array(
        'result'   => false,
        'msjError' => 'Error interno: ' . $e->getMessage(),
        'notificaciones' => array()
    ));
}
?>

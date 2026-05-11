<?php
/* ============================================================
   api/push-send.php
   Encola una notificacion pendiente para un userid y dispara
   un push vacio a todas sus suscripciones activas.

   Puede usarse como:
     - Endpoint HTTP (POST JSON) desde la ERP, cron, u otras PWAs
     - Script CLI:  php push-send.php <userid> "<titulo>" "<cuerpo>" [url]

   Payload HTTP:
     { userid: "AHP", titulo: "...", cuerpo: "...", url: "/prospectos/", tag: "kpis" }

   PWA Prospectos ROGMAI
   ============================================================ */
ini_set('display_errors', 0);
error_reporting(E_ALL);

$esCli = (php_sapi_name() === 'cli');

/* ---------- Stubs para que el bootstrap ERP no rompa en CLI ---------- */
if ($esCli) {
    if (!isset($_SERVER['HTTP_HOST']))     $_SERVER['HTTP_HOST']     = 'localhost';
    if (!isset($_SERVER['REQUEST_URI']))   $_SERVER['REQUEST_URI']   = '/prospectos/api/push-send.php';
    if (!isset($_SERVER['SERVER_NAME']))   $_SERVER['SERVER_NAME']   = 'localhost';
    if (!isset($_SERVER['REMOTE_ADDR']))   $_SERVER['REMOTE_ADDR']   = '127.0.0.1';
    if (!isset($_SERVER['HTTPS']))         $_SERVER['HTTPS']         = 'on';
    if (!isset($_SERVER['SCRIPT_NAME']))   $_SERVER['SCRIPT_NAME']   = $_SERVER['REQUEST_URI'];
    if (session_status() === PHP_SESSION_NONE) @session_start();
} else {
    if (session_status() === PHP_SESSION_NONE) session_start();
}

/* ---------- Intento 1: usar el bootstrap del ERP (HTTP normal) ---------- */
$PathPrefix = '/var/www/html/erpdistribucion/';
ob_start();
@include($PathPrefix . 'config.php');
@include($PathPrefix . 'includes/ConnectDB.inc');
@include($PathPrefix . 'includes/SQL_CommonFunctions.inc');
$bootstrapOutput = ob_get_clean();

/* ---------- Push config + WebPushLite ---------- */
$pushConfig = __DIR__ . '/push-config.php';
if (!file_exists($pushConfig)) {
    $m = 'push-config.php no existe';
    if ($esCli) { fwrite(STDERR, $m . "\n"); exit(1); }
    header('Content-Type: application/json');
    echo json_encode(array('result' => false, 'msjError' => $m));
    exit;
}
require_once($pushConfig);
require_once(__DIR__ . '/../lib/WebPushLite.php');

/* ---------- Intento 2: fallback a mysqli directo (CLI o ERP roto) ---------- */
$usarMysqliFallback = !function_exists('DB_query');
$mysqliConn         = null;

if ($usarMysqliFallback) {
    if (!defined('PWA_DB_HOST') || !defined('PWA_DB_USER') ||
        !defined('PWA_DB_PASS') || !defined('PWA_DB_NAME')) {
        $m = 'DB_query no disponible y faltan constantes PWA_DB_* en push-config.php';
        if ($esCli) { fwrite(STDERR, $m . "\n"); exit(1); }
        header('Content-Type: application/json');
        echo json_encode(array('result' => false, 'msjError' => $m));
        exit;
    }
    $mysqliConn = @new mysqli(PWA_DB_HOST, PWA_DB_USER, PWA_DB_PASS, PWA_DB_NAME);
    if ($mysqliConn->connect_errno) {
        $m = 'No se pudo conectar a BD: ' . $mysqliConn->connect_error;
        if ($esCli) { fwrite(STDERR, $m . "\n"); exit(1); }
        header('Content-Type: application/json');
        echo json_encode(array('result' => false, 'msjError' => $m));
        exit;
    }
    $mysqliConn->set_charset('utf8mb4');
}

/* Wrappers que funcionan con DB_query (ERP) o con mysqli (fallback) ------- */
function pwa_query($sql) {
    global $usarMysqliFallback, $mysqliConn, $db;
    if ($usarMysqliFallback) {
        $r = $mysqliConn->query($sql);
        if ($r === false) {
            error_log('[push-send] mysqli error: ' . $mysqliConn->error . ' | SQL: ' . substr($sql, 0, 200));
        }
        return $r;
    }
    return DB_query($sql, $db);
}
function pwa_fetch_array($res) {
    global $usarMysqliFallback;
    if ($res === false || $res === null) return false;
    if ($usarMysqliFallback) return $res->fetch_assoc();
    return DB_fetch_array($res);
}
function pwa_escape($s) {
    global $usarMysqliFallback, $mysqliConn;
    if ($usarMysqliFallback) return $mysqliConn->real_escape_string($s);
    return addslashes($s);
}

/* ── 1. Obtener params ── */
if ($esCli) {
    $userid = isset($argv[1]) ? $argv[1] : '';
    $titulo = isset($argv[2]) ? $argv[2] : 'ROGMAI Prospectos';
    $cuerpo = isset($argv[3]) ? $argv[3] : '';
    $url    = isset($argv[4]) ? $argv[4] : '/prospectos/';
    $tag    = isset($argv[5]) ? $argv[5] : 'pwa_push';
} else {
    header('Content-Type: application/json');

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) { $input = $_POST; }

    if (!isset($_SESSION['UserID']) || empty($_SESSION['UserID'])) {
        echo json_encode(array('result' => false, 'msjError' => 'No autorizado'));
        exit;
    }

    $userid = isset($input['userid']) ? $input['userid'] : $_SESSION['UserID'];
    $titulo = isset($input['titulo']) ? $input['titulo'] : 'ROGMAI Prospectos';
    $cuerpo = isset($input['cuerpo']) ? $input['cuerpo'] : '';
    $url    = isset($input['url'])    ? $input['url']    : '/prospectos/';
    $tag    = isset($input['tag'])    ? $input['tag']    : 'pwa_push';
}

if ($userid === '' || $cuerpo === '') {
    $m = 'Faltan parametros (userid, cuerpo)';
    if ($esCli) { fwrite(STDERR, $m . "\n"); exit(1); }
    echo json_encode(array('result' => false, 'msjError' => $m));
    exit;
}

/* ── 2. Encolar la notificacion en pwa_push_pendientes ── */
$useridEsc = pwa_escape($userid);
$tituloEsc = pwa_escape(substr($titulo, 0, 120));
$cuerpoEsc = pwa_escape(substr($cuerpo, 0, 500));
$urlEsc    = pwa_escape(substr($url,    0, 500));
$tagEsc    = pwa_escape(substr($tag,    0, 80));

$sqlIns = "INSERT INTO pwa_push_pendientes
              (userid, titulo, cuerpo, url, tag, fecha_alta, entregada)
           VALUES
              ('" . $useridEsc . "',
               '" . $tituloEsc . "',
               '" . $cuerpoEsc . "',
               '" . $urlEsc    . "',
               '" . $tagEsc    . "',
               NOW(), 0)";
pwa_query($sqlIns);

/* ── 3. Buscar suscripciones activas del user ── */
$sqlSubs = "SELECT id, endpoint, p256dh, auth_token
            FROM pwa_push_subscriptions
            WHERE userid = '" . $useridEsc . "'
              AND activa = 1";
$resSubs = pwa_query($sqlSubs);

$wp = new WebPushLite(VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT);

$enviados   = 0;
$expiradas  = 0;
$fallidos   = 0;
$detalles   = array();

while ($resSubs && ($sub = pwa_fetch_array($resSubs))) {
    $r = $wp->enviarPush($sub['endpoint']);
    $detalles[] = array(
        'sub_id'    => $sub['id'],
        'http_code' => $r['http_code'],
        'ok'        => $r['ok']
    );
    if ($r['ok']) {
        $enviados++;
        pwa_query("UPDATE pwa_push_subscriptions SET fecha_uso = NOW()
                   WHERE id = " . intval($sub['id']));
    } elseif ($r['expired']) {
        $expiradas++;
        pwa_query("UPDATE pwa_push_subscriptions SET activa = 0
                   WHERE id = " . intval($sub['id']));
        error_log('[PUSH SEND] sub ' . $sub['id'] . ' expirada (http ' . $r['http_code'] . ')');
    } else {
        $fallidos++;
        error_log('[PUSH SEND] sub ' . $sub['id'] . ' fallo: ' . (isset($r['error']) ? $r['error'] : 'http ' . $r['http_code']));
    }
}

$salida = array(
    'result'    => true,
    'userid'    => $userid,
    'enviados'  => $enviados,
    'expiradas' => $expiradas,
    'fallidos'  => $fallidos,
    'via'       => $usarMysqliFallback ? 'mysqli' : 'erp',
    'detalles'  => $detalles
);

if ($esCli) {
    echo json_encode($salida, JSON_PRETTY_PRINT) . "\n";
} else {
    echo json_encode($salida);
}

if ($mysqliConn) $mysqliConn->close();

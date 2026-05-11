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

$PathPrefix = '/var/www/html/erpdistribucion/';
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

    case 'ReverseGeocode':
        // Convierte lat,lng en direccion usando Nominatim (OpenStreetMap).
        // Gratis, sin API key. Rate limit: ~1 req/seg (suficiente para este uso).
        $lat = isset($input['lat']) ? floatval($input['lat']) : 0;
        $lng = isset($input['lng']) ? floatval($input['lng']) : 0;

        if (!$lat || !$lng) {
            echo json_encode(array('result' => false, 'msjError' => 'Coordenadas invalidas'));
            break;
        }

        $url = 'https://nominatim.openstreetmap.org/reverse'
             . '?format=jsonv2'
             . '&lat=' . urlencode($lat)
             . '&lon=' . urlencode($lng)
             . '&accept-language=es'
             . '&addressdetails=1'
             . '&zoom=18';

        $ch = curl_init($url);
        curl_setopt_array($ch, array(
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT        => 10,
            // Nominatim exige un User-Agent identificable
            CURLOPT_USERAGENT      => 'ROGMAI-Prospectos-PWA/1.0 (contacto@portalito.com)',
            CURLOPT_HTTPHEADER     => array('Accept: application/json'),
            CURLOPT_SSL_VERIFYPEER => true,
        ));
        $resp   = curl_exec($ch);
        $httpc  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curErr = curl_error($ch);
        curl_close($ch);

        if ($resp === false || $httpc >= 400) {
            error_log('[PWA-geo] Nominatim fallo http=' . $httpc . ' err=' . $curErr);
            echo json_encode(array(
                'result'   => false,
                'msjError' => 'No se pudo obtener la direccion (codigo ' . $httpc . ')'
            ));
            break;
        }

        $data = json_decode($resp, true);
        if (!$data || !isset($data['address'])) {
            echo json_encode(array(
                'result'   => false,
                'msjError' => 'Respuesta sin direccion'
            ));
            break;
        }

        $a = $data['address'];

        // Construir "Calle y numero" combinando road + house_number
        $road = '';
        foreach (array('road', 'pedestrian', 'footway', 'residential', 'highway') as $k) {
            if (!empty($a[$k])) { $road = $a[$k]; break; }
        }
        $num = isset($a['house_number']) ? $a['house_number'] : '';
        $calle = trim($road . ($num !== '' ? ' ' . $num : ''));

        // Colonia: probar varias llaves que usa Nominatim en MX
        $colonia = '';
        foreach (array('neighbourhood', 'suburb', 'quarter', 'hamlet', 'city_district') as $k) {
            if (!empty($a[$k])) { $colonia = $a[$k]; break; }
        }

        // Ciudad
        $ciudad = '';
        foreach (array('city', 'town', 'village', 'municipality', 'county') as $k) {
            if (!empty($a[$k])) { $ciudad = $a[$k]; break; }
        }

        // Estado
        $estado = isset($a['state']) ? $a['state'] : '';
        // CP
        $cp = isset($a['postcode']) ? $a['postcode'] : '';
        // Pais
        $pais = isset($a['country']) ? $a['country'] : '';

        echo json_encode(array(
            'result'    => true,
            'contenido' => array(
                'calle'        => $calle,
                'colonia'      => $colonia,
                'ciudad'       => $ciudad,
                'estado'       => $estado,
                'cp'           => $cp,
                'pais'         => $pais,
                'display_name' => isset($data['display_name']) ? $data['display_name'] : ''
            )
        ));
        break;

    default:
        echo json_encode(array('result' => false, 'msjError' => 'Opcion no reconocida'));
        break;
}

} catch (Exception $e) {
    echo json_encode(array('result' => false, 'msjError' => 'Error interno: ' . $e->getMessage()));
}
?>

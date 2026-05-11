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

            case 'cambio_etapa':
            // Validar feature flag (igual que prospectos.php)
            $FEATURE_FLAG_PROSPECTO_PRUEBA = null;  // null para rollout total
            
            $uMovimiento     = isset($payload['u_movimiento'])      ? intval($payload['u_movimiento'])      : 0;
            $nuevoStatus     = isset($payload['cmbCambiarEstatus']) ? intval($payload['cmbCambiarEstatus']) : 0;
            $salesman        = isset($payload['cmbVendedor03'])     ? intval($payload['cmbVendedor03'])     : 0;
            $fechaCompromiso = isset($payload['fechacompromiso'])   ? trim($payload['fechacompromiso'])     : '';
            
            // 1. Feature flag
            if ($FEATURE_FLAG_PROSPECTO_PRUEBA !== null && $uMovimiento !== $FEATURE_FLAG_PROSPECTO_PRUEBA) {
                error_log('[PWA SYNC cambio_etapa BLOCKED] userid=' . $userid . ' u_movimiento=' . $uMovimiento . ' (feature flag solo permite ' . $FEATURE_FLAG_PROSPECTO_PRUEBA . ')');
                $ok = false;
                $errors[] = array('action' => 'cambio_etapa', 'error' => 'Funcion en pruebas, prospecto no permitido');
                break;
            }
            
            // 2. Parametros obligatorios
            if ($uMovimiento <= 0 || $nuevoStatus <= 0 || empty($fechaCompromiso)) {
                $ok = false;
                $errors[] = array('action' => 'cambio_etapa', 'error' => 'Parametros invalidos');
                break;
            }
            
            // 3. Formato fecha YYYY-MM-DD
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fechaCompromiso)) {
                $ok = false;
                $errors[] = array('action' => 'cambio_etapa', 'error' => 'Formato fecha invalido');
                break;
            }
            
            // 4. Obtener estatus actual y validar transicion
            $sqlActual = "SELECT idstatus FROM prospect_movimientos WHERE u_movimiento = " . $uMovimiento;
            $resActual = DB_query($sqlActual, $db);
            $rowActual = $resActual ? DB_fetch_array($resActual) : null;
            
            if (!$rowActual) {
                $ok = false;
                $errors[] = array('action' => 'cambio_etapa', 'error' => 'Prospecto no encontrado');
                break;
            }
            
            $statusActual = intval($rowActual['idstatus']);
            
            $transicionesPermitidas = array(
                1 => array(2, 5, 7, 8),
                2 => array(1, 3, 5, 7, 8),
                3 => array(1, 2, 4, 5, 7, 8),
                4 => array(1, 2, 3, 5, 6, 7, 8),
                7 => array(1, 2, 3, 4, 5, 8)
            );
            
            if (!isset($transicionesPermitidas[$statusActual])) {
                error_log('[PWA SYNC cambio_etapa] Etapa terminal, ignorado. u_movimiento=' . $uMovimiento . ' status=' . $statusActual);
                $ok = false;
                $errors[] = array('action' => 'cambio_etapa', 'error' => 'Etapa terminal');
                break;
            }
            
            if (!in_array($nuevoStatus, $transicionesPermitidas[$statusActual])) {
                error_log('[PWA SYNC cambio_etapa INVALID] userid=' . $userid . ' u_movimiento=' . $uMovimiento . ' ' . $statusActual . ' -> ' . $nuevoStatus);
                $ok = false;
                $errors[] = array('action' => 'cambio_etapa', 'error' => 'Transicion no permitida');
                break;
            }
            
            // 5. Ejecutar el mismo UPDATE que hace el ERP (GuardarCambioEstatus)
            error_log('[PWA SYNC cambio_etapa] userid=' . $userid . ' u_movimiento=' . $uMovimiento . ' de=' . $statusActual . ' a=' . $nuevoStatus . ' fecha=' . $fechaCompromiso);
            
            $sql = "UPDATE prospect_movimientos 
                    SET idstatus = '" . $nuevoStatus . "', 
                        salesman = '" . $salesman . "', 
                        fecha_compromiso = '" . $fechaCompromiso . "' 
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
            // Si el payload viene de la PWA (con option=insertarEtapaA o con
            // cmbVendedor + nombre), replicamos EXACTAMENTE el passthrough
            // de api/prospectos.php — asi un prospecto creado offline queda
            // igual que uno creado online (debtorsmaster, custcontacts, tags,
            // fuente, coordenadas, etc.).
            $esPayloadPWA = (isset($payload['option']) && $payload['option'] === 'insertarEtapaA')
                         || (isset($payload['nombre']) && isset($payload['cmbVendedor']));

            if ($esPayloadPWA) {
                // Forzar option y poblar $_POST igual que hace prospectos.php
                $payload['option'] = 'insertarEtapaA';
                $_POST = array_merge($_POST, $payload);

                error_log('[PWA SYNC nuevo_prospecto IN] userid=' . $userid
                    . ' post_keys=' . implode(',', array_keys($_POST)));

                ob_start();
                include($PathPrefix . 'modelo/ProspectV2Modelo.php');
                $modeloOut = ob_get_clean();

                $resultVar   = isset($result)   ? $result   : null;
                $msjErrorVar = isset($msjError) ? $msjError : '';

                // Fix idstatus=0 -> 1 (igual que online)
                if ($resultVar && is_numeric($resultVar)) {
                    $uMovNuevo = intval($resultVar);
                    $sqlFix = "UPDATE prospect_movimientos
                               SET idstatus = 1
                               WHERE u_movimiento = " . $uMovNuevo . "
                                 AND idstatus = 0";
                    DB_query($sqlFix, $db);
                    error_log('[PWA SYNC nuevo_prospecto OK] u_movimiento=' . $uMovNuevo);
                } else {
                    error_log('[PWA SYNC nuevo_prospecto FAIL] result=' . var_export($resultVar, true)
                        . ' msjError=' . $msjErrorVar);
                    $ok = false;
                    $errors[] = array('action' => 'nuevo_prospecto',
                                      'error'  => $msjErrorVar ?: 'Error al crear prospecto');
                }

                // Limpiar $_POST para que no contamine la siguiente iteracion
                $_POST = array();
                break;
            }

            // Fallback: payload minimo legacy (DebtorName / PhoneNo / email)
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

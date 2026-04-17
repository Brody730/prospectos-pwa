<?php
/* ============================================================
   api/agenda.php
   Actividades / agenda por vendedor
   PWA Prospectos ROGMAI — PHP 5 compatible
   ============================================================ */
ini_set('display_errors', 0);
error_reporting(E_ALL);
ob_start();

session_start();

$PathPrefix = '/var/www/html/erpdistribucion/';
include($PathPrefix . 'config.php');
include($PathPrefix . 'includes/ConnectDB.inc');
include($PathPrefix . 'includes/SQL_CommonFunctions.inc');
include($PathPrefix . 'includes/SecurityFunctions.inc');

// Limpiar TODOS los buffers que los includes puedan haber dejado abiertos.
// SecurityFunctions.inc puede abrir su propio ob_start() sin cerrarlo; un solo
// ob_end_clean() cerraría el suyo dejando el nuestro (nivel 1) activo con HTML acumulado.
while (ob_get_level() > 0) {
    ob_end_clean();
}
header('Content-Type: application/json');

// Buffer de seguridad: captura cualquier HTML que escape a los ob internos de DB_query.
// La respuesta se construye en $response y se emite UNA sola vez al final.
ob_start();

function ProspectosAgendaEjecutarConsulta($sql, $db, $contexto)
{
    ob_start();
    $res = DB_query($sql, $db);
    $dbErr = ob_get_clean();

    if (!empty(trim($dbErr))) {
        error_log('[PWA-agenda] DB_query error (' . $contexto . '): ' . strip_tags($dbErr));
        return false;
    }

    return $res;
}

function ProspectosAgendaWhereVendedor($userid)
{
    global $db;

    $showAll = isset($_SESSION['AllowedPageSecurityTokens']) && is_array($_SESSION['AllowedPageSecurityTokens'])
        ? in_array(2055, $_SESSION['AllowedPageSecurityTokens'])
        : (isset($_SESSION['ShowAllSalesman']) ? intval($_SESSION['ShowAllSalesman']) === 1 : false);

    if ($showAll) {
        return '';
    }

    $uidEsc = addslashes($userid);

    // Si el usuario no tiene registro en salesman → no es vendedor → ver todos
    ob_start();
    $resCheck = DB_query("SELECT COUNT(*) AS tiene FROM salesman WHERE usersales = '" . $uidEsc . "'", $db);
    ob_get_clean();
    $rowCheck = ($resCheck !== false) ? DB_fetch_array($resCheck) : array('tiene' => 0);
    if ((int)$rowCheck['tiene'] === 0) {
        return '';
    }

    return " AND pm.salesman IN (
        SELECT salesmancode FROM salesman WHERE usersales = '" . $uidEsc . "'
    ) ";
}

$response = null;

try {

if (!isset($_SESSION['UserID']) || empty($_SESSION['UserID'])) {
    ob_end_clean();
    echo json_encode(array('result' => false, 'msjError' => 'No autorizado'));
    exit;
}

$userid = $_SESSION['UserID'];
$raw = file_get_contents('php://input');
$input = json_decode($raw, true);
if (empty($input)) {
    $input = array();
}
if (!empty($_POST)) {
    $input = array_merge($_POST, $input);
}

$opcion = isset($input['opcion']) ? $input['opcion'] : '';
error_log('[PWA] agenda opcion=' . $opcion . ' userid=' . $userid);

switch ($opcion) {

    case 'TraerAgenda':
        $fecha = isset($input['fecha']) ? addslashes($input['fecha']) : date('Y-m-d');
        $rango = isset($input['rango']) ? $input['rango'] : '';

        $fechaInicio = date('Y-m-d', strtotime($fecha . ' -3 days'));
        $fechaFin    = date('Y-m-d', strtotime($fecha . ' +3 days'));

        if ($rango == 'semana_actual') {
            $diaSemana = date('N', strtotime($fecha));
            $fechaInicio = date('Y-m-d', strtotime($fecha . ' -' . ($diaSemana - 1) . ' days'));
            $fechaFin    = date('Y-m-d', strtotime($fechaInicio . ' +4 days'));
        }

        $whereSalesman = ProspectosAgendaWhereVendedor($userid);

        $sql = "SELECT
                    tm.u_movimiento   AS u_task,
                    tm.u_prospecto    AS u_movimiento,
                    d.name            AS nombreProspecto,
                    tm.fecha_compromiso,
                    tm.hora,
                    cb.phoneno,
                    pm.link_google_map,
                    cb.lat            AS latitude,
                    cb.lng            AS longitude,
                    CONCAT(IFNULL(cb.braddress1,''), ', ', IFNULL(cb.braddress3,''), ', ', IFNULL(cb.braddress4,'')) AS direccion,
                    tm.concepto,
                    tm.titulo,
                    tm.descripcion,
                    tm.TipoMovimientoId,
                    ot.descripcion    AS tipo_actividad,
                    ot.color          AS color_actividad,
                    ps.nombre         AS estatus_tarea
                FROM tasks_movimientos tm
                INNER JOIN prospect_movimientos pm ON tm.u_prospecto = pm.u_movimiento
                INNER JOIN debtorsmaster d         ON pm.debtorno    = d.debtorno
                INNER JOIN custbranch cb           ON pm.debtorno    = cb.debtorno
                                                  AND pm.branchcode = cb.branchcode
                LEFT JOIN oportunidad_tipo ot      ON tm.TipoMovimientoId = ot.id
                LEFT JOIN prdstatussimple ps       ON tm.idstatus    = ps.idstatus
                WHERE tm.fecha_compromiso >= '" . $fechaInicio . "'
                  AND tm.fecha_compromiso <= '" . $fechaFin . "'
                  AND IFNULL(ps.final, 0) = 0
                " . $whereSalesman . "
                ORDER BY tm.fecha_compromiso ASC, tm.hora ASC, tm.u_movimiento ASC";

        $res = ProspectosAgendaEjecutarConsulta($sql, $db, 'TraerAgenda');
        if ($res === false) {
            $response = array('result' => false, 'contenido' => array(), 'msjError' => 'Error de base de datos');
            break;
        }

        $items = array();
        while ($row = DB_fetch_array($res)) {
            $items[] = $row;
        }

        $response = array('result' => true, 'contenido' => $items);
        break;

    case 'TraerHistorial':
        $uMovimiento = isset($input['u_movimiento']) ? intval($input['u_movimiento']) : 0;
        if ($uMovimiento <= 0) {
            $response = array('result' => false, 'contenido' => array(), 'msjError' => 'u_movimiento invalido');
            break;
        }

        // Historial: sin filtro de vendedor. Si ya puede ver el detalle, puede ver el historial.
        $sql = "SELECT
                    tm.u_movimiento AS u_task,
                    tm.fecha_compromiso,
                    tm.hora,
                    ot.descripcion AS tipo,
                    ot.color,
                    tm.concepto,
                    tm.descripcion,
                    tm.titulo,
                    tm.TipoMovimientoId,
                    tm.u_user AS usuario,
                    ps.nombre AS estatus_tarea,
                    IFNULL(ps.final, 0) AS es_final
                FROM tasks_movimientos tm
                LEFT JOIN oportunidad_tipo ot ON tm.TipoMovimientoId = ot.id
                LEFT JOIN prdstatussimple ps ON tm.idstatus = ps.idstatus
                WHERE tm.u_prospecto = " . $uMovimiento . "
                ORDER BY tm.fecha_compromiso DESC, tm.hora DESC, tm.u_movimiento DESC
                LIMIT 50";

        $res = ProspectosAgendaEjecutarConsulta($sql, $db, 'TraerHistorial');
        if ($res === false) {
            $response = array('result' => false, 'contenido' => array(), 'msjError' => 'Error de base de datos');
            break;
        }

        $items = array();
        while ($row = DB_fetch_array($res)) {
            $items[] = $row;
        }

        $response = array('result' => true, 'contenido' => $items);
        break;

    case 'TraerTiposActividad':
        $sql = "SELECT id, descripcion, color
                FROM oportunidad_tipo
                ORDER BY descripcion ASC";
        $res = ProspectosAgendaEjecutarConsulta($sql, $db, 'TraerTiposActividad');
        if ($res === false) {
            $response = array('result' => false, 'contenido' => array(), 'msjError' => 'Error de base de datos');
            break;
        }

        $items = array();
        while ($row = DB_fetch_array($res)) {
            $items[] = $row;
        }

        $response = array('result' => true, 'contenido' => $items);
        break;

    case 'ProspectosNecesitanAtencion':
        $whereSalesman = ProspectosAgendaWhereVendedor($userid);

        // Prospectos activos (no Descartado/Venta/Cancelado/BD) cuya última tarea activa
        // está vencida O tienen más de 30 días sin actividad O no tienen ninguna tarea
        $sql = "SELECT
                    pm.u_movimiento,
                    d.name      AS prospecto,
                    cb.phoneno,
                    ps.nombre   AS etapa,
                    ps.nombrealterno,
                    pm.cargo    AS valor_estimado,
                    MAX(tm.fecha_compromiso) AS ultima_actividad,
                    DATEDIFF(CURDATE(), MAX(tm.fecha_compromiso)) AS dias_sin_actividad
                FROM prospect_movimientos pm
                INNER JOIN debtorsmaster d ON pm.debtorno = d.debtorno
                INNER JOIN custbranch cb
                    ON pm.debtorno = cb.debtorno AND pm.branchcode = cb.branchcode
                INNER JOIN prospect_status ps ON pm.idstatus = ps.idstatus
                LEFT JOIN tasks_movimientos tm ON pm.u_movimiento = tm.u_prospecto
                WHERE pm.activo = 1
                  AND pm.idstatus NOT IN (0, 5, 6, 8)
                " . $whereSalesman . "
                GROUP BY pm.u_movimiento, d.name, cb.phoneno,
                         ps.nombre, ps.nombrealterno, pm.cargo
                HAVING ultima_actividad IS NULL
                    OR dias_sin_actividad > 30
                    OR MAX(tm.fecha_compromiso) < CURDATE()
                ORDER BY
                    CASE WHEN ultima_actividad IS NULL THEN 1 ELSE 0 END DESC,
                    dias_sin_actividad DESC,
                    pm.cargo DESC
                LIMIT 20";

        $res = ProspectosAgendaEjecutarConsulta($sql, $db, 'ProspectosNecesitanAtencion');
        if ($res === false) {
            $response = array('result' => false, 'contenido' => array(), 'msjError' => 'Error de base de datos');
            break;
        }

        $items = array();
        while ($row = DB_fetch_array($res)) {
            $items[] = array(
                'u_movimiento'     => $row['u_movimiento'],
                'prospecto'        => $row['prospecto'],
                'phoneno'          => $row['phoneno'],
                'etapa'            => $row['etapa'],
                'nombrealterno'    => $row['nombrealterno'],
                'valor_estimado'   => $row['valor_estimado'],
                'ultima_actividad' => $row['ultima_actividad'],
                'dias_sin_actividad' => $row['dias_sin_actividad']
            );
        }

        $response = array('result' => true, 'contenido' => $items);
        break;

    default:
        $response = array('result' => false, 'msjError' => 'Opcion no reconocida');
        break;
}

} catch (Exception $e) {
    $response = array('result' => false, 'msjError' => 'Error interno: ' . $e->getMessage());
}

// Descartar cualquier HTML que haya escapado al buffer de seguridad y emitir solo JSON válido
ob_end_clean();
echo json_encode($response !== null ? $response : array('result' => false, 'msjError' => 'Error interno'));
?>

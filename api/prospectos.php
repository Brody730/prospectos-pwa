<?php
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

function ProspectosTienePermisoVerTodos()
{
    if (isset($_SESSION['AllowedPageSecurityTokens']) && is_array($_SESSION['AllowedPageSecurityTokens'])) {
        return in_array(2055, $_SESSION['AllowedPageSecurityTokens']);
    }

    return isset($_SESSION['ShowAllSalesman']) && (int)$_SESSION['ShowAllSalesman'] === 1;
}

function ProspectosEjecutarConsulta($sql, $db, $contexto)
{
    ob_start();
    $result = DB_query($sql, $db);
    $dbErr = ob_get_clean();

    if (!empty(trim($dbErr))) {
        error_log('[PWA-prospectos] DB_query error (' . $contexto . '): ' . trim(strip_tags($dbErr)));
        return false;
    }

    return $result;
}

try {

if (!isset($_SESSION['UserID']) || empty($_SESSION['UserID'])) {
    echo json_encode(array(
        'result' => false,
        'contenido' => array(),
        'msjError' => 'No autorizado'
    ));
    exit;
}

$raw = file_get_contents('php://input');
$input = json_decode($raw, true);
if (empty($input)) {
    $input = array();
}
if (!empty($_POST)) {
    $input = array_merge($_POST, $input);
}

$option = isset($input['option']) ? $input['option'] : '';
error_log('[PWA] option=' . $option . ' userid=' . $_SESSION['UserID']);

// ── TEMP: diagnóstico de paths (borrar después) ──
if ($option === 'diagnosticoImagenes') {
    $candidatos = [
        '/data2/html/erpdistribucion/images/prospectos',
        '/var/www/html/erpdistribucion/images/prospectos',
        '/data2/html/erpdistribucion/images',
        '/var/www/html/erpdistribucion/images',
        '/data2/html/erpdistribucion',
        '/var/www/html/erpdistribucion',
        '/data2/html',
        '/var/www/html',
    ];
    $info = [];
    foreach ($candidatos as $p) {
        $info[$p] = [
            'is_dir'      => is_dir($p),
            'is_writable' => is_writable($p),
        ];
    }
    // Intentar crear el directorio de prospectos
    $target = '/data2/html/erpdistribucion/images/prospectos';
    $mkdirOk = is_dir($target) ? 'ya existe' : (@mkdir($target, 0775, true) ? 'creado OK' : 'FALLO');
    $phpUser = 'n/a';
    if (function_exists('posix_geteuid')) {
        $pw = posix_getpwuid(posix_geteuid());
        $phpUser = isset($pw['name']) ? $pw['name'] : 'n/a';
    }
    echo json_encode(array(
        'result'       => true,
        'document_root'=> isset($_SERVER['DOCUMENT_ROOT']) ? $_SERVER['DOCUMENT_ROOT'] : '',
        'script_dir'   => __DIR__,
        'php_user'     => $phpUser,
        'mkdir_data2'  => $mkdirOk,
        'paths'        => $info,
    ), JSON_PRETTY_PRINT);
    exit;
}

// ── GuardarAdjuntos: manejado directamente para garantizar ruta y permisos ──
if ($option === 'GuardarAdjuntos') {
    $u_movimiento = isset($input['u_oportunidad']) ? intval($input['u_oportunidad']) : 0;

    if ($u_movimiento <= 0) {
        echo json_encode(['result' => false, 'msjError' => 'Se requiere u_oportunidad']);
        exit;
    }

    // Rutas candidatas en orden de preferencia
    $candidatos = [
        '/data2/html/erpdistribucion/images/prospectos',
        '/var/www/html/erpdistribucion/images/prospectos',
    ];
    $dirImg = null;
    foreach ($candidatos as $c) {
        if (!is_dir($c)) {
            @mkdir($c, 0775, true);
        }
        if (is_dir($c) && is_writable($c)) {
            $dirImg = $c;
            break;
        }
    }

    if ($dirImg === null) {
        error_log('[PWA GuardarAdjuntos] No se encontró directorio escribible. Candidatos: ' . implode(', ', $candidatos));
        echo json_encode(['result' => false, 'msjError' => 'No hay directorio de imágenes disponible']);
        exit;
    }

    error_log('[PWA GuardarAdjuntos] Usando directorio: ' . $dirImg);

    $imagenesJson = isset($input['imagenesconvertidas']) ? $input['imagenesconvertidas'] : '[]';
    $imagenes = json_decode($imagenesJson);
    $guardadas = 0;
    $errores = 0;

    if (is_array($imagenes) && count($imagenes) > 0) {
        DB_Txn_Begin($db);
        try {
            foreach ($imagenes as $img) {
                if (empty($img->cadena) || empty($img->nombre) || empty($img->tipo)) {
                    $errores++;
                    continue;
                }

                $nombreSanitizado = preg_replace('/[^a-zA-Z0-9_.\-]/', '_', basename($img->nombre));
                $rutaFisica = $dirImg . '/' . $nombreSanitizado;

                // Decodificar base64 (formato: data:image/jpeg;base64,/9j/...)
                $partes = explode(',', $img->cadena, 2);
                $base64Data = isset($partes[1]) ? $partes[1] : $partes[0];
                $binario = base64_decode($base64Data);

                if ($binario === false || strlen($binario) < 100) {
                    error_log('[PWA GuardarAdjuntos] base64 inválido para: ' . $nombreSanitizado);
                    $errores++;
                    continue;
                }

                if (file_put_contents($rutaFisica, $binario) === false) {
                    error_log('[PWA GuardarAdjuntos] Error escribiendo: ' . $rutaFisica);
                    $errores++;
                    continue;
                }

                $nombre_esc   = DB_escape_string($nombreSanitizado, $db);
                $umov_esc     = DB_escape_string((string)$u_movimiento, $db);
                $userid_esc   = DB_escape_string($_SESSION['UserID'], $db);
                $ruta_esc     = DB_escape_string($rutaFisica, $db);
                $tipo_esc     = DB_escape_string($img->tipo, $db);

                $sql = "INSERT INTO documents (name, typedoc, user_register, public, register_date, tipo, archivoblob)
                        VALUES ('$nombre_esc', '$umov_esc', '$userid_esc', '$ruta_esc', CURDATE(), '$tipo_esc', '')";

                ProspectosEjecutarConsulta($sql, $db, 'GuardarAdjuntos-insert');
                $guardadas++;
            }

            DB_Txn_Commit($db);
            echo json_encode(['result' => true, 'guardadas' => $guardadas, 'errores' => $errores]);
        } catch (Exception $e) {
            DB_Txn_Rollback($db);
            error_log('[PWA GuardarAdjuntos] Exception: ' . $e->getMessage());
            echo json_encode(['result' => false, 'msjError' => $e->getMessage()]);
        }
    } else {
        echo json_encode(['result' => true, 'guardadas' => 0, 'errores' => 0]);
    }
    exit;
}

// Passthrough normal para actividades y otros
if (in_array($option, array(
    'GuardarActividad',
    'traeultimaposicion',
    'obtenerImagenesOportunidad',
    'insertarEtapaA',
    'modificarEtapaA',
    'ObtenerOportunidad',
    'obtenerCheckTiempoVida',
    'ModalBuscarProductos',
    'GuardarEtapaB',
    'GuardarEtapaC',
    'ModificarEtapaC',
    'GuardarEtapaD',
    'EliminarImagen',
    'ObtenerDocAdmin',
    'SolicitarAutorizarCotizacion',
    'AutorizarCotizacion'
))) {
    $_POST = array_merge($_POST, $input);
    include($PathPrefix . 'modelo/ProspectV2Modelo.php');
    exit;
}

// Passthrough con validación para cambio de etapa (feature PWA)
if ($option == 'GuardarCambioEstatus') {
    // 1. Validar feature flag server-side (prospecto de prueba)
    $uMovimiento = isset($input['u_movimiento']) ? intval($input['u_movimiento']) : 0;
    $FEATURE_FLAG_PROSPECTO_PRUEBA = null;  // null para rollout total
    
    if ($FEATURE_FLAG_PROSPECTO_PRUEBA !== null && $uMovimiento !== $FEATURE_FLAG_PROSPECTO_PRUEBA) {
        error_log('[PWA CambiarEtapa BLOCKED] userid=' . $_SESSION['UserID'] . ' intentó cambiar u_movimiento=' . $uMovimiento . ' pero feature flag solo permite ' . $FEATURE_FLAG_PROSPECTO_PRUEBA);
        echo json_encode(array(
            'result' => false,
            'contenido' => array(),
            'msjError' => 'Función en pruebas. Solo habilitada para el prospecto de QA.'
        ));
        exit;
    }
    
    // 2. Validar parámetros obligatorios
    $nuevoStatus = isset($input['cmbCambiarEstatus']) ? intval($input['cmbCambiarEstatus']) : 0;
    $salesman = isset($input['cmbVendedor03']) ? intval($input['cmbVendedor03']) : 0;
    $fechaCompromiso = isset($input['fechacompromiso']) ? trim($input['fechacompromiso']) : '';
    
    if ($uMovimiento <= 0 || $nuevoStatus <= 0 || empty($fechaCompromiso)) {
        echo json_encode(array(
            'result' => false,
            'contenido' => array(),
            'msjError' => 'Parámetros inválidos'
        ));
        exit;
    }
    
    // Validar formato de fecha YYYY-MM-DD
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fechaCompromiso)) {
        echo json_encode(array(
            'result' => false,
            'contenido' => array(),
            'msjError' => 'Formato de fecha inválido'
        ));
        exit;
    }
    
    // 3. Obtener estatus actual de BD para validar transición
    $sqlActual = "SELECT idstatus FROM prospect_movimientos WHERE u_movimiento = " . $uMovimiento;
    $resActual = ProspectosEjecutarConsulta($sqlActual, $db, 'GuardarCambioEstatus actual');
    if ($resActual === false) {
        echo json_encode(array(
            'result' => false,
            'contenido' => array(),
            'msjError' => 'Error al consultar estado actual'
        ));
        exit;
    }
    
    $rowActual = DB_fetch_array($resActual);
    if (!$rowActual) {
        echo json_encode(array(
            'result' => false,
            'contenido' => array(),
            'msjError' => 'Prospecto no encontrado'
        ));
        exit;
    }
    
    $statusActual = intval($rowActual['idstatus']);
    
    // 4. Validar transición permitida (matriz server-side)
    $transicionesPermitidas = array(
        1 => array(2, 5, 7, 8),
        2 => array(1, 3, 5, 7, 8),
        3 => array(1, 2, 4, 5, 7, 8),
        4 => array(1, 2, 3, 5, 6, 7, 8),
        7 => array(1, 2, 3, 4, 5, 8)
    );
    
    if (!isset($transicionesPermitidas[$statusActual])) {
        echo json_encode(array(
            'result' => false,
            'contenido' => array(),
            'msjError' => 'Esta etapa es terminal y no se puede modificar'
        ));
        exit;
    }
    
    if (!in_array($nuevoStatus, $transicionesPermitidas[$statusActual])) {
        error_log('[PWA CambiarEtapa INVALID] userid=' . $_SESSION['UserID'] . ' u_movimiento=' . $uMovimiento . ' intentó ' . $statusActual . ' → ' . $nuevoStatus . ' (no permitida)');
        echo json_encode(array(
            'result' => false,
            'contenido' => array(),
            'msjError' => 'Transición no permitida: ' . $statusActual . ' → ' . $nuevoStatus
        ));
        exit;
    }
    
    // 5. Log antes del passthrough
    error_log('[PWA CambiarEtapa] userid=' . $_SESSION['UserID'] . ' u_movimiento=' . $uMovimiento . ' de=' . $statusActual . ' a=' . $nuevoStatus . ' fecha=' . $fechaCompromiso);
    
    // 6. Passthrough al ERP (mismo patrón de siempre)
    $_POST = array_merge($_POST, $input);
    include($PathPrefix . 'modelo/ProspectV2Modelo.php');
    exit;
}

if ($option == 'TraerKPIs') {
    $usuario = addslashes($_SESSION['UserID']);
    $whereSalesman = '';

    $sqlCheckSalesman = "SELECT COUNT(*) AS tiene FROM salesman WHERE usersales = '" . $usuario . "'";
    $resCheck = ProspectosEjecutarConsulta($sqlCheckSalesman, $db, 'TraerKPIs checkSalesman');
    $rowCheck = ($resCheck !== false) ? DB_fetch_array($resCheck) : array('tiene' => 0);
    $tieneSalesman = (isset($rowCheck['tiene']) && (int)$rowCheck['tiene'] > 0);

    error_log('[PWA KPI] usuario=' . $usuario . ' tieneSalesman=' . ($tieneSalesman ? 'si' : 'no') . ' verTodos=' . (ProspectosTienePermisoVerTodos() ? 'si' : 'no'));

    if (!$tieneSalesman || ProspectosTienePermisoVerTodos()) {
        $whereSalesman = '';
    } else {
        $whereSalesman = " AND pm.salesman IN (
            SELECT salesmancode FROM salesman WHERE usersales = '" . $usuario . "'
        ) ";
    }

    $sqlTotal = "SELECT COUNT(DISTINCT pm.u_movimiento) AS total
                 FROM prospect_movimientos pm
                 WHERE pm.activo = 1
                   AND pm.idstatus NOT IN (0, 5, 8)" . $whereSalesman;

    $sqlCalificados = "SELECT COUNT(DISTINCT pm.u_movimiento) AS calificados
                       FROM prospect_movimientos pm
                       WHERE pm.activo = 1
                         AND pm.idstatus IN (2, 3, 4, 7)" . $whereSalesman;

    $sqlVisitasHoy = "SELECT COUNT(*) AS visitas_hoy
                      FROM tasks_movimientos tm
                      INNER JOIN prospect_movimientos pm ON tm.u_prospecto = pm.u_movimiento
                      INNER JOIN prdstatussimple ps ON tm.idstatus = ps.idstatus
                      WHERE DATE(tm.fecha_compromiso) = CURDATE()
                        AND ps.final = 0" . $whereSalesman;

    $sqlVencidos = "SELECT COUNT(DISTINCT pm.u_movimiento) AS vencidos
                    FROM prospect_movimientos pm
                    INNER JOIN tasks_movimientos tm ON pm.u_movimiento = tm.u_prospecto
                    INNER JOIN prdstatussimple ps ON tm.idstatus = ps.idstatus
                    WHERE tm.fecha_compromiso < CURDATE()
                      AND tm.fecha_compromiso != '0000-00-00'
                      AND ps.final = 0
                      AND pm.activo = 1
                      AND pm.idstatus NOT IN (5, 8)" . $whereSalesman;

    $sqlDiagnostico = "SELECT idstatus, nombre, nombrealterno, marcainicial
                       FROM prospect_status
                       ORDER BY idstatus";

    $resTotal = ProspectosEjecutarConsulta($sqlTotal, $db, 'TraerKPIs total');
    $resCalificados = ProspectosEjecutarConsulta($sqlCalificados, $db, 'TraerKPIs calificados');
    $resVisitasHoy = ProspectosEjecutarConsulta($sqlVisitasHoy, $db, 'TraerKPIs visitas_hoy');
    $resVencidos = ProspectosEjecutarConsulta($sqlVencidos, $db, 'TraerKPIs vencidos');
    $resDiagnostico = ProspectosEjecutarConsulta($sqlDiagnostico, $db, 'TraerKPIs diagnostico_estatus');

    if ($resTotal === false || $resCalificados === false || $resVisitasHoy === false || $resVencidos === false || $resDiagnostico === false) {
        echo json_encode(array(
            'result' => false,
            'contenido' => array(),
            'msjError' => 'Error de base de datos'
        ));
        exit;
    }

    error_log('[PWA KPI SQL total] ' . $sqlTotal);
    error_log('[PWA KPI SQL calificados] ' . $sqlCalificados);
    error_log('[PWA KPI SQL visitas_hoy] ' . $sqlVisitasHoy);
    error_log('[PWA KPI SQL vencidos] ' . $sqlVencidos);

    $rowTotal = DB_fetch_array($resTotal);
    $rowCalificados = DB_fetch_array($resCalificados);
    $rowVisitasHoy = DB_fetch_array($resVisitasHoy);
    $rowVencidos = DB_fetch_array($resVencidos);
    $diagnostico = array();

    while ($row = DB_fetch_array($resDiagnostico)) {
        $diagnostico[] = array(
            'idstatus' => $row['idstatus'],
            'nombre' => $row['nombre'],
            'nombrealterno' => $row['nombrealterno'],
            'marcainicial' => $row['marcainicial']
        );
    }

    echo json_encode(array(
        'result' => true,
        'contenido' => array(
            'total' => isset($rowTotal['total']) ? (int)$rowTotal['total'] : 0,
            'calificados' => isset($rowCalificados['calificados']) ? (int)$rowCalificados['calificados'] : 0,
            'visitas_hoy' => isset($rowVisitasHoy['visitas_hoy']) ? (int)$rowVisitasHoy['visitas_hoy'] : 0,
            'vencidos' => isset($rowVencidos['vencidos']) ? (int)$rowVencidos['vencidos'] : 0,
            'diagnostico_estatus' => $diagnostico
        ),
        'msjError' => ''
    ));
    exit;
}

if ($option == 'TraerEstatus') {
    $data = array();
    $sql = "SELECT idstatus, nombre, nombrealterno, marcainicial
            FROM prospect_status
            ORDER BY idstatus";
    $result = ProspectosEjecutarConsulta($sql, $db, 'TraerEstatus');

    if ($result === false) {
        echo json_encode(array(
            'result' => false,
            'contenido' => array(),
            'msjError' => 'Error de base de datos'
        ));
        exit;
    }

    while ($row = DB_fetch_array($result)) {
        $data[] = array(
            'idstatus' => $row['idstatus'],
            'nombre' => $row['nombre'],
            'nombrealterno' => $row['nombrealterno'],
            'marcainicial' => $row['marcainicial']
        );
    }

    echo json_encode(array(
        'result' => true,
        'contenido' => $data,
        'msjError' => ''
    ));
    exit;
}

if ($option == 'TraerProspectos') {
    $data = array();
    $usuario = addslashes($_SESSION['UserID']);
    $filtro = isset($input['filtro']) ? $input['filtro'] : 'todos';
    $busqueda = isset($input['busqueda']) ? trim($input['busqueda']) : '';
    $limit = isset($input['limit']) ? intval($input['limit']) : 100;
    $offset = isset($input['offset']) ? intval($input['offset']) : 0;
    $uMovimiento = isset($input['u_movimiento']) ? intval($input['u_movimiento']) : 0;
    $condVendedor = '';
    $whereBusqueda = '';
    $whereEstatus = '';

    if ($limit <= 0) {
        $limit = 100;
    }

    if ($offset < 0) {
        $offset = 0;
    }

    $sqlCheckSalesman2 = "SELECT COUNT(*) AS tiene FROM salesman WHERE usersales = '" . $usuario . "'";
    $resCheck2 = ProspectosEjecutarConsulta($sqlCheckSalesman2, $db, 'TraerProspectos checkSalesman');
    $rowCheck2 = ($resCheck2 !== false) ? DB_fetch_array($resCheck2) : array('tiene' => 0);
    $tieneSalesman2 = (isset($rowCheck2['tiene']) && (int)$rowCheck2['tiene'] > 0);

    if ($tieneSalesman2 && !ProspectosTienePermisoVerTodos()) {
        $condVendedor = " AND pm.salesman IN (
            SELECT salesmancode FROM salesman WHERE usersales = '" . $usuario . "'
        ) ";
    }

    if ($filtro == 'hoy') {
        $whereEstatus = " AND DATE(tm.fecha_compromiso) = CURDATE() ";
    } elseif ($filtro == 'vencidos') {
        $whereEstatus = " AND tm.fecha_compromiso < CURDATE() ";
    } elseif ($filtro == 'calificados') {
        $whereEstatus = " AND pm.idstatus IN (2, 3, 4, 7) ";
    }

    if (!empty($busqueda)) {
        $b = addslashes($busqueda);
        $whereBusqueda = " AND (
            d.name LIKE '%" . $b . "%' OR
            cb.phoneno LIKE '%" . $b . "%' OR
            cb.email LIKE '%" . $b . "%' OR
            pm.u_movimiento LIKE '%" . $b . "%'
        )";
    }

    $sql = "SELECT
                pm.u_movimiento,
                pm.idstatus,
                ps.nombre AS etapa,
                ps.nombrealterno,
                d.debtorno,
                d.name AS prospecto,
                cb.phoneno,
                cb.email,
                pm.salesman,
                s.salesmanname,
                s.usersales AS vendedor_userid,
                pm.cargo AS valor_estimado,
                CONCAT(IFNULL(d.address1,''), ', ', IFNULL(d.address3,''), ', ', IFNULL(d.address4,'')) AS direccion,
                pm.link_google_map,
                tm.fecha_compromiso AS fecha_actividad,
                tm.hora,
                tm.concepto,
                tm.descripcion,
                tm.titulo,
                ot.descripcion AS tipo_actividad,
                ot.color AS color_actividad
            FROM prospect_movimientos pm
            INNER JOIN debtorsmaster d ON pm.debtorno = d.debtorno
            INNER JOIN custbranch cb ON pm.debtorno = cb.debtorno AND pm.branchcode = cb.branchcode
            INNER JOIN prospect_status ps ON pm.idstatus = ps.idstatus
            LEFT JOIN salesman s ON pm.salesman = s.salesmancode
            LEFT JOIN (
                SELECT u_prospecto, MAX(u_movimiento) AS max_id
                FROM tasks_movimientos
                GROUP BY u_prospecto
            ) ultima ON pm.u_movimiento = ultima.u_prospecto
            LEFT JOIN tasks_movimientos tm ON ultima.max_id = tm.u_movimiento
            LEFT JOIN oportunidad_tipo ot ON tm.TipoMovimientoId = ot.id
            WHERE pm.activo = 1" . $condVendedor . $whereBusqueda . $whereEstatus;

    if ($uMovimiento > 0) {
        $sql .= " AND pm.u_movimiento = " . $uMovimiento;
    }

    $sql .= " ORDER BY pm.u_movimiento DESC
              LIMIT " . $offset . ", " . $limit;

    if (!empty($busqueda)) {
        error_log('[PWA BUSQUEDA] buscando: ' . $busqueda);
        error_log('[PWA SQL] ' . $sql);
    }

    $result = ProspectosEjecutarConsulta($sql, $db, 'TraerProspectos');
    if ($result === false) {
        echo json_encode(array(
            'result' => false,
            'contenido' => array(),
            'msjError' => 'Error de base de datos'
        ));
        exit;
    }

    while ($row = DB_fetch_array($result)) {
        $data[] = array(
            'u_movimiento' => $row['u_movimiento'],
            'idstatus' => $row['idstatus'],
            'etapa' => $row['etapa'],
            'nombrealterno' => $row['nombrealterno'],
            'debtorno' => $row['debtorno'],
            'prospecto' => $row['prospecto'],
            'phoneno' => $row['phoneno'],
            'email' => $row['email'],
            'salesman' => $row['salesman'],
            'salesmanname' => $row['salesmanname'],
            'vendedor_userid' => $row['vendedor_userid'],
            'valor_estimado' => $row['valor_estimado'],
            'direccion' => $row['direccion'],
            'link_google_map' => $row['link_google_map'],
            'fecha_actividad' => $row['fecha_actividad'],
            'hora' => $row['hora'],
            'concepto' => $row['concepto'],
            'descripcion' => $row['descripcion'],
            'titulo' => $row['titulo'],
            'tipo_actividad' => $row['tipo_actividad'],
            'color_actividad' => $row['color_actividad']
        );
    }

    echo json_encode(array(
        'result' => true,
        'contenido' => $data,
        'total' => count($data),
        'msjError' => ''
    ));
    exit;
}

echo json_encode(array(
    'result' => false,
    'contenido' => array(),
    'msjError' => 'Opcion no valida'
));

} catch (Exception $e) {
    echo json_encode(array(
        'result'    => false,
        'contenido' => array(),
        'msjError'  => 'Error interno: ' . $e->getMessage()
    ));
}
?>

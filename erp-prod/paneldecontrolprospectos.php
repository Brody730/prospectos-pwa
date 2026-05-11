<?php

$funcion = 2210;
$PageSecurity = 3;
$title = _('Prospectos - Panel de Control de Prospectos');

include('includes/session.inc');

$isAjaxPagos = (
    (isset($_POST['ajax_pagos_html']) && intval($_POST['ajax_pagos_html']) === 1) ||
    (isset($_POST['ajax_guardar_pago']) && intval($_POST['ajax_guardar_pago']) === 1)
);

if (!$isAjaxPagos) {
    include('includes/header.inc');
}
include('includes/SecurityFunctions.inc');
include('includes/SQL_CommonFunctions.inc');
include("includes/ElementosGenerales.inc");

//error_reporting(E_ALL);
//ini_set('display_errors', '1');

// Declaracion de variables generales
$estructura = array();
$condicion = "";
$fechainicio = "";
$fechafin = "";
$opcionespoligono = "";
$editarpoligono = false;
//arreglo para permisos de checkboxs
$arrUsuarios = array("desarrollo", "scenteno", "general", "pmejia", "malvarez", "ilores");

// Declaracion de permisos 
$permisomostrartodoslosvendedores = Havepermission($_SESSION['UserID'], 2055, $db);
$permisovendedores = Havepermission($_SESSION['UserID'], 859, $db);
$permisoverpoligonos = Havepermission($_SESSION['UserID'], 2251, $db);
$permisoAutorizarOV = Havepermission($_SESSION['UserID'], 2090, $db);

if (isset($_GET["umovimiento"])) {
    $_POST["txtProspecto"] = $_GET["umovimiento"];
}

// Inicializar datos de elementos
if (!isset($_POST["txtAnioInicio"])) {
    $_POST["txtAnioInicio"] = date("Y");
}

if (!isset($_POST["txtAnioFin"])) {
    $_POST["txtAnioFin"] = date("Y");
}

if (!isset($_POST["cmbDiaInicio"])) {
    $_POST["cmbDiaInicio"] = "1";
}

if (!isset($_POST["cmbDiaFin"])) {
    $_POST["cmbDiaFin"] = date("d");
}

if (!isset($_POST["cmbMesInicio"])) {
    $_POST["cmbMesInicio"] = date("m");
}

if (!isset($_POST["cmbMesFin"])) {
    $_POST["cmbMesFin"] = date("m");
}

$checkfecha = '<input type="checkbox" id="chkPorFecha" name="chkPorFecha">';

if (isset($_POST["chkPorFecha"])) {
    $checkfecha = '<input type="checkbox" id="chkPorFecha" name="chkPorFecha" checked>';
    $fechainicio = $_POST["txtAnioInicio"] . "-" . substr("00" . $_POST["cmbMesInicio"], -2) . "-" . substr("00" . $_POST["cmbDiaInicio"], -2);
    $fechafin = $_POST["txtAnioFin"] . "-" . substr("00" . $_POST["cmbMesFin"], -2) . "-" . substr("00" . $_POST["cmbDiaFin"], -2);
}

// Arreglo para genearar estructura de tabla de datos
$estructura["encabezado"] = array(
    ["nombre" => "#", "columna" => "indice", "alineacion" => "center", "rowspan" => 2],
    ["nombre" => "Etapa", "columna" => 0, "alineacion" => "center; background-color: lightyellow"],
    ["nombre" => "Op", "columna" => 1, "alineacion" => "center"],
    ["nombre" => "Fecha Alta", "columna" => 2, "alineacion" => "center"],
    ["nombre" => "Prospecto", "columna" => 3, "alineacion" => "left"],
    ["nombre" => "Telefono", "columna" => 4, "alineacion" => "center"],
    ["nombre" => "Vendedor", "columna" => 5, "alineacion" => "center", "interlineado" => "nowrap"],
    ["nombre" => "Sector Comercial", "columna" => 6, "alineacion" => "center"],
    ["nombre" => "Valor Estimado", "columna" => 7, "alineacion" => "center"],
    ["nombre" => "Estado y Municipio", "columna" => 8, "alineacion" => "center"],
    ["nombre" => "Fuente Contacto", "columna" => 9, "alineacion" => "center"],
    ["nombre" => "Acciones", "columna" => 10, "alineacion" => "center", "interlineado" => "nowrap"]
);

// Arreglo para el manejo de pie de tabla
$estructura["pietabla"][0] = array("valor" => "Total Estimado:", "celdas" => 8, "alineacion" => "right");
$estructura["pietabla"][1] = array("valor" => 0, "celdas" => 1, "alineacion" => "right");
$estructura["pietabla"][2] = array("valor" => 0, "celdas" => 3, "alineacion" => "center");

$elementos = new ElementosGenerales();

// Consultar datos iniciales 
if ($permisomostrartodoslosvendedores != 1) {
    $condicion .= " AND www_users.userid = '" . $_SESSION['UserID'] . "'";
}

$consulta = "SELECT salesmancode AS id, salesmanname AS descripcion
            FROM salesman
            INNER JOIN www_users ON salesman.usersales=www_users.userid
            WHERE salesman.status='Active' " . $condicion . " 
            ORDER BY descripcion";
// echo $consulta;
$resultado = DB_query($consulta, $db);

if (DB_num_rows($resultado) == 1) {
    $_POST["cmbComisionista"] = array();

    while ($renglon = DB_fetch_array($resultado)) {
        $_POST["cmbComisionista"][] = $renglon["id"];
    }
}

// consultar fechas compromiso para generar notificaciones
/*$instruccion = "INSERT INTO notificaciones_erp (titulo, comentario, estatus, fecha_creacion, fecha_vencimiento, pagina, tipo, to_userid, from_userid, html, transno, tipo_notificacion) VALUES ";
$detalle = "";

$consulta = "SELECT prospect_movimientos.u_movimiento, debtorsmaster.name, prospect_movimientos.fecha_compromiso, 
            DATEDIFF(NOW(), prospect_movimientos.fecha_compromiso) AS dias
            FROM prospect_movimientos 
            INNER JOIN debtorsmaster ON prospect_movimientos.debtorno=debtorsmaster.debtorno
            INNER JOIN prospect_status ON prospect_movimientos.idstatus=prospect_status.idstatus
            WHERE fecha_compromiso<=NOW() AND prospect_movimientos.fecha_compromiso!= '0000-00-00'
            AND prospect_status.nombrealterno IN ('B', 'D')";

$resultado = DB_query($consulta, $db);
while ($renglon = DB_fetch_array($resultado)) {
    $detalle .= "('El Prospecto " . $renglon["name"] . " lleva " . $renglon["dias"] . " dias con fecha de cierre vencida, favor de re-agendar.', '', 0, NOW(), NOW(), 'paneldecontrolprospectos.php?umovimiento=" . $renglon['u_movimiento'] . "', '1', 'scenteno', 'admin','cierre=vencido', '" . $renglon['u_movimiento'] . "', 'Notificacion'),";
}

if (!empty($detalle)) {
    DB_query("DELETE FROM notificaciones_erp WHERE html='cierre=vencido';", $db);
    $instruccion .= substr($detalle, 0, -1) . ";";
    DB_query($instruccion, $db);
}*/

// consultar coordenadas para dibujar las areas de ventas en el mapa
$consulta = "SELECT id, area, longitud, latitud, color
            FROM poligonos
            ORDER BY area, orden";

$resultado = DB_query($consulta, $db);

while ($renglon = DB_fetch_array($resultado)) {
    $opcionespoligono .= '<option value="' . $renglon['id'] . '" >' . $renglon['area'] . '|' . $renglon['longitud'] . '|' . $renglon['latitud'] . '|' . $renglon['color'] . '</option>';
}

// Cambio Prospectos
$sql = "SELECT id, title FROM contactmeans where active=1";
$result = DB_query($sql, $db, $ErrMsg);
$optionMedioContacto = "";
$optionMedioContacto = '<option  VALUE="" selected>Ninguno </option>';
while ($row = DB_fetch_array($result, $db)) {
    $optionMedioContacto .= '<option  VALUE="' . $row['id'] . '" >' . $row['title'] . '</option>';
}

$sql = "SELECT * FROM Custleadsource";
$result = DB_query($sql, $db, $ErrMsg);
$optionFuenteContacto = "";
$optionFuenteContacto = '<option  VALUE="" selected>Ninguno</option>';
while ($row = DB_fetch_array($result, $db)) {
    $optionFuenteContacto .= '<option  VALUE="' . $row['CustLeadSourceId'] . '" >' . $row['CustLeadSourceNom'] . '</option>';
}

$SQL = "Select SectComClId, SectComClNom
        From SectComercialCl";
$resulttag = DB_query($SQL, $db);
$optionSectorComercial = "";
$optionSectorComercial = '<option selected value="">' . _('Ninguno') . '</option>';
while ($myrowUN = DB_fetch_array($resulttag)) {
    $optionSectorComercial .= '<option value="' . $myrowUN['SectComClId'] . '">' . $myrowUN['SectComClNom'] . '</option>';
}

$qry = "Select * FROM states";
$rss = DB_query($qry, $db);
$optionEstados = "<option value=''>" . _('Ninguno') . "</option>";

while ($rows = DB_fetch_array($rss)) {
    $optionEstados .= "<option VALUE='" . $rows['state'] . "'>" . $rows['state'] . "</option>";
}

$sql = "SELECT id, descripcion FROM oportunidad_tipo where estatus=1";
$result = DB_query($sql, $db, $ErrMsg);
$optionTipoActividad = "";
while ($row = DB_fetch_array($result, $db)) {
    $optionTipoActividad .= '<option  value="' . $row['id'] . '" >' . $row['descripcion'] . '</option>';
}

if ($_SESSION['ShowAllSalesman'] == 1) {
    $sql = "SELECT DISTINCT concat(area,' | ',salesmanname)  as salesmanname, salesmancode,usersales
	  FROM salesman
	  WHERE status='Active' /*and (usersales='" . $_SESSION['UserID'] . "' or salesman.salesmancode='" . $_POST['Salesman'] . "')*/
	  ORDER BY salesmanname desc";
} else {
    $sql = "SELECT distinct  concat(ar.areacode,'-',salesmanname) as salesmanname,salesmancode,
                CASE WHEN usersales='" . $_SESSION['UserID'] . "' THEN 1 ELSE 0 END AS opcion
            FROM salesman as sm
            LEFT JOIN areas as ar ON sm.area=ar.areacode
            JOIN tags as tg ON ar.areacode=tg.areacode 
            JOIN sec_unegsxuser as u ON u.tagref = tg.tagref
            WHERE u.userid='" . $_SESSION['UserID'] . "'
            ORDER BY salesmanname,tg.tagref";
}

$result = DB_query($sql, $db);
$optionVendedores = "";
while ($myrow = DB_fetch_array($result)) {
    $optionVendedores .= "<option $selected value='{$myrow['salesmancode']}'>{$myrow['salesmanname']}</option>";
}

if (in_array($_SESSION["UserID"], $arrUsuarios)) {
    echo '
    <script type="text/javascript">
        var editarpoligono= true;
    </script>';
} else {
    echo '
    <script type="text/javascript">
        var editarpoligono= false;
    </script>';
}

// funcion para generar la estructura de tabla de prospectos

if (isset($_POST['ajax_pagos_html']) && intval($_POST['ajax_pagos_html']) === 1) {
    if (ob_get_length()) {
        ob_clean();
    }
    header('Content-Type: text/html; charset=UTF-8');
    $u_movimiento = isset($_POST['u_movimiento']) ? intval($_POST['u_movimiento']) : 0;

    if ($u_movimiento <= 0) {
        echo '<div class="alert alert-danger">Movimiento inválido</div>';
        exit;
    }

    $sqlMovimientoAjax = "SELECT 
                            pm.u_movimiento,
                            pm.cargo,
                            pm.monto_pagado,
                            pm.concepto,
                            pm.descripcion,
                            pm.encargado_proyecto,
                            pm.fecha_alta
                          FROM prospect_movimientos pm
                          WHERE pm.u_movimiento = " . $u_movimiento . "
                          LIMIT 1";
    $resMovimientoAjax = DB_query($sqlMovimientoAjax, $db);

    if (!$resMovimientoAjax) {
        echo '<div class="alert alert-danger"><b>Error consultando movimiento</b><br><pre>' . htmlspecialchars($sqlMovimientoAjax) . '</pre></div>';
        exit;
    }

    $movAjax = DB_fetch_array($resMovimientoAjax);

    if (!$movAjax) {
        echo '<div class="alert alert-warning">No se encontró el movimiento</div>';
        exit;
    }

    $cargoAjax = floatval($movAjax['cargo']);
    $montoPagadoAjax = floatval($movAjax['monto_pagado']);
    $porcentajeRealAjax = 0;

    if ($cargoAjax > 0) {
        $porcentajeRealAjax = round(($montoPagadoAjax / $cargoAjax) * 100, 2);
    }

    $porcentajeBarraAjax = $porcentajeRealAjax;
    if ($porcentajeBarraAjax > 100) {
        $porcentajeBarraAjax = 100;
    }

    $colorBarraAjax = '#d9534f';
    if ($porcentajeRealAjax >= 70) {
        $colorBarraAjax = '#5cb85c';
    } elseif ($porcentajeRealAjax >= 30) {
        $colorBarraAjax = '#f0ad4e';
    }

    $sqlHistorialAjax = "SELECT id, monto, usuario, DATE_FORMAT(fecha, '%d/%m/%Y %H:%i:%s') AS fecha
                         FROM prospect_pagos
                         WHERE u_movimiento = " . $u_movimiento . "
                         ORDER BY id DESC";
    $resHistorialAjax = DB_query($sqlHistorialAjax, $db);

    ob_start();
    ?>
    <div class="container-fluid" style="padding:10px 8px 0 8px;">
        <style>
            .pagos-resumen-card {
                border: 1px solid #d9e6f2;
                background: #f9fcff;
                border-radius: 10px;
                padding: 14px 16px;
                margin-bottom: 12px;
            }
            .pagos-label {
                display: block;
                font-size: 12px;
                color: #6c7a89;
                text-transform: uppercase;
                margin-bottom: 2px;
            }
            .pagos-value {
                display: block;
                font-size: 18px;
                font-weight: bold;
                color: #2c3e50;
                line-height: 1.2;
            }
            .pagos-value-small {
                display: block;
                font-size: 15px;
                font-weight: bold;
                color: #2c3e50;
                line-height: 1.3;
                word-break: break-word;
            }
            .pagos-barra-bg {
                width: 100%;
                background: #e9ecef;
                border-radius: 14px;
                overflow: hidden;
                margin-top: 10px;
                height: 28px;
            }
            .pagos-barra-fill {
                height: 28px;
                line-height: 28px;
                color: #fff;
                text-align: center;
                font-weight: bold;
                font-size: 13px;
                min-width: 70px;
            }
            .pagos-tabs-wrap {
                margin-top: 10px;
            }
            .pagos-tabs-wrap .nav-tabs > li > a {
                font-weight: bold;
                color: #337ab7;
            }
            .pagos-tab-pane {
                border: 1px solid #ddd;
                border-top: 0;
                padding: 16px;
                background: #fff;
            }
            .pagos-help {
                margin-top: 6px;
                font-size: 12px;
                color: #777;
            }
            .pagos-total-mini {
                font-size: 13px;
                color: #4a4a4a;
                margin-bottom: 10px;
            }
            .pagos-total-mini b {
                color: #2c3e50;
            }
            .tabla-pagos th {
                background: #eef5fb;
                color: #2c3e50;
            }
            .tabla-pagos td,
            .tabla-pagos th {
                vertical-align: middle !important;
            }
            .tabla-pagos .monto {
                text-align: right;
                font-weight: bold;
                color: #2c7a2c;
                white-space: nowrap;
            }
            .tabla-pagos .usuario {
                color: #666;
            }
        </style>

        <div class="pagos-resumen-card">
            <div class="row">
                <div class="col-md-3 col-sm-6">
                    <span class="pagos-label">Movimiento</span>
                    <span class="pagos-value-small"><?php echo $movAjax['u_movimiento']; ?></span>
                </div>
                <div class="col-md-5 col-sm-6">
                    <span class="pagos-label">Encargado</span>
                    <span class="pagos-value-small"><?php echo htmlspecialchars($movAjax['encargado_proyecto']); ?></span>
                </div>
                <div class="col-md-4 col-sm-12">
                    <span class="pagos-label">Descripción</span>
                    <span class="pagos-value-small"><?php echo htmlspecialchars($movAjax['descripcion']); ?></span>
                </div>
            </div>

            <div class="row" style="margin-top:12px;">
                <div class="col-md-4 col-sm-4">
                    <span class="pagos-label">Monto estimado</span>
                    <span class="pagos-value">$<?php echo number_format($cargoAjax, 2, ".", ","); ?></span>
                </div>
                <div class="col-md-4 col-sm-4">
                    <span class="pagos-label">Monto pagado</span>
                    <span class="pagos-value" style="color:#2c7a2c;">$<?php echo number_format($montoPagadoAjax, 2, ".", ","); ?></span>
                </div>
                <div class="col-md-4 col-sm-4">
                    <span class="pagos-label">Avance</span>
                    <span class="pagos-value" style="color:#1f4e79;"><?php echo number_format($porcentajeRealAjax, 2, ".", ","); ?>%</span>
                </div>
            </div>

            <div class="pagos-barra-bg">
                <div class="pagos-barra-fill" style="width:<?php echo $porcentajeBarraAjax; ?>%; background:<?php echo $colorBarraAjax; ?>;">
                    <?php echo number_format($porcentajeRealAjax, 2, ".", ","); ?>%
                </div>
            </div>
        </div>

        <div class="pagos-tabs-wrap">
            <ul class="nav nav-tabs" role="tablist">
                <li class="active">
                    <a href="#tabRegistrarPago" role="tab" data-toggle="tab">Registrar pago</a>
                </li>
                <li>
                    <a href="#tabHistorialPagos" role="tab" data-toggle="tab">Historial</a>
                </li>
            </ul>

            <div class="tab-content">
                <div class="tab-pane active pagos-tab-pane" id="tabRegistrarPago">
                    <form onsubmit="fnGuardarPagoInline(event, <?php echo $u_movimiento; ?>);">
                        <div class="row">
                            <div class="col-md-9 col-sm-8">
                                <label>Nuevo pago</label>
                                <input type="number" step="0.01" min="0.01" name="monto" id="txtNuevoPagoModal" class="form-control input-lg" placeholder="Ej. 1500.00" required>
                                <div class="pagos-help">Captura el monto sin comas.</div>
                            </div>
                            <div class="col-md-3 col-sm-4" style="padding-top:25px;">
                                <button type="submit" class="btn btn-success btn-lg btn-block">Guardar pago</button>
                            </div>
                        </div>
                    </form>
                </div>

                <div class="tab-pane pagos-tab-pane" id="tabHistorialPagos">
                    <div class="pagos-total-mini">
                        <b>Total de pagos registrados:</b> <?php echo mysqli_num_rows($resHistorialAjax); ?>
                        &nbsp;&nbsp;|&nbsp;&nbsp;
                        <b>Total pagado:</b> $<?php echo number_format($montoPagadoAjax, 2, ".", ","); ?>
                    </div>

                    <table class="table table-striped table-hover table-bordered table-condensed tabla-pagos">
                        <thead>
                            <tr>
                                <th style="width:70px;">ID</th>
                                <th style="width:220px;">Fecha</th>
                                <th style="width:160px;">Monto</th>
                                <th>Usuario</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php while ($rowAjax = DB_fetch_array($resHistorialAjax)) { ?>
                            <tr>
                                <td><?php echo $rowAjax['id']; ?></td>
                                <td><?php echo $rowAjax['fecha']; ?></td>
                                <td class="monto">$<?php echo number_format($rowAjax['monto'], 2, ".", ","); ?></td>
                                <td class="usuario"><?php echo htmlspecialchars($rowAjax['usuario']); ?></td>
                            </tr>
                            <?php } ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    <?php
    echo ob_get_clean();
    exit;
}

if (isset($_POST['ajax_guardar_pago']) && intval($_POST['ajax_guardar_pago']) === 1) {
    if (ob_get_length()) {
        ob_clean();
    }
    header('Content-Type: text/plain; charset=UTF-8');
    $u_movimiento = isset($_POST['u_movimiento']) ? intval($_POST['u_movimiento']) : 0;
    $monto = isset($_POST['monto']) ? floatval($_POST['monto']) : 0;
    $usuario = isset($_SESSION['UserID']) ? $_SESSION['UserID'] : 'sistema';

    if ($u_movimiento <= 0 || $monto <= 0) {
        echo 'ERROR';
        exit;
    }

    $sqlInsertPago = "INSERT INTO prospect_pagos (u_movimiento, monto, usuario)
                      VALUES (" . $u_movimiento . ", " . $monto . ", '" . $usuario . "')";
    DB_query($sqlInsertPago, $db);

    $sqlUpdatePago = "UPDATE prospect_movimientos pm
                      SET pm.monto_pagado = (
                          SELECT IFNULL(SUM(pp.monto), 0)
                          FROM prospect_pagos pp
                          WHERE pp.u_movimiento = pm.u_movimiento
                      )
                      WHERE pm.u_movimiento = " . $u_movimiento;
    DB_query($sqlUpdatePago, $db);

    echo 'OK';
    exit;
}


function fnGeneraDatos(
    $oportunidad = "",
    $vendedor = array(),
    $fechainicio = "",
    $fechafin = "",
    $arrEstatus = array(),
    $db
) {
    try {
        $datos = array();
        $arrImagenes = array();
        $indice = 1;
        $marcainicial = "";
        $condicion = "";
        $opcionesfechas = "";
        $condicionagenda = "";

        global $permisovendedores;
        global $arrUsuarios;

        // consultar si existen imagenes por oportunidad
        $consulta = "SELECT typedoc, count(*) AS imagenes FROM documents GROUP BY typedoc ORDER BY typedoc";
        $resultado = DB_query($consulta, $db);

        while ($registro = DB_fetch_array($resultado)) {
            $arrImagenes[$registro["typedoc"]] = $registro["imagenes"];
        }

        // condicion para buscar dato por nombre o codigo del prospecto
        if (!empty($oportunidad)) {
            $condicion .= " AND (prospect_movimientos.u_movimiento LIKE '%" . $oportunidad . "%' OR debtorsmaster.debtorno LIKE '%" . $oportunidad . "%' OR debtorsmaster.name LIKE '%" . $oportunidad . "%') ";
        }

        //if (isset($sectorcomercial) && count($sectorcomercial)>0) {
        if (!empty($sectorcomercial)) {
            $condicion .= " AND custbranch.SectComClId IN (" . implode(',', $sectorcomercial) . ") ";
        }

        // agregar condicion para filtro de prospectos por vendedor
        if (!empty($vendedor)) {
            $condicion .= " AND prospect_movimientos.salesman IN (" . implode(',', $vendedor) . ") ";
            $condicionagenda = " AND prospect_movimientos.salesman IN (" . implode(',', $vendedor) . ") ";
        }

        // condicion para el filtro por funte de contacto
        if (!empty($fuentecontacto)) {
            $condicion .= " AND custcontacts.CustLeadSourceId IN (" . implode(',', $fuentecontacto) . ") ";
        }

        // condicion para el filtro por municipio
        if (!empty($municipio)) {
            $condicion .= " AND debtorsmaster.address3 IN ('" . implode("','", str_replace("@", " ", $municipio)) . "') ";
        }

        if (!empty($fechainicio)) {
            $condicion .= " AND  IF(tasks_movimientos.fecha_compromiso IS NULL, prospect_movimientos.fecha_compromiso, tasks_movimientos.fecha_compromiso) BETWEEN '" . $fechainicio . "' AND '" . $fechafin . " 23:59:59' ";
            //$condicion.= " AND prospect_movimientos.fecha_compromiso BETWEEN '".$fechainicio."' AND '".$fechafin." 23:59:59' ";
        }

        if (!empty($arrEstatus) && empty($oportunidad)) {
            $condicion .= " AND prospect_status.idstatus IN (" . implode(',', $arrEstatus) . ") ";
        } else {
            if (empty($oportunidad)) {
                $marcainicial = " AND prospect_status.marcainicial=1";
            }
        }

        // consulta fecha de actividades para mostrar en la agenda
        $consulta = "SELECT prospect_movimientos.u_movimiento, debtorsmaster.name, tasks_movimientos.u_movimiento as actividad_id, 
                    tasks_movimientos.fecha_compromiso, tasks_movimientos.hora, CONCAT(tasks_movimientos.fecha_compromiso, 'T', tasks_movimientos.hora) AS fecha_agenda,
                    oportunidad_tipo.iconodia, IFNULL(SUBSTRING(oportunidad_tipo.descripcion, 1, 4), '') AS tiposeguimiento, 
                    oportunidad_tipo.color
                    FROM prospect_movimientos
                    INNER JOIN debtorsmaster ON prospect_movimientos.debtorno=debtorsmaster.debtorno
                    INNER JOIN tasks_movimientos ON prospect_movimientos.u_movimiento=tasks_movimientos.u_prospecto
	            INNER JOIN prdstatussimple ON tasks_movimientos.idstatus=prdstatussimple.idstatus
                    LEFT JOIN oportunidad_tipo ON tasks_movimientos.TipoMovimientoId=oportunidad_tipo.id
                    WHERE 1=1 AND prdstatussimple.final=0 AND tasks_movimientos.fecha_compromiso!='0000-00-00' " . $condicionagenda;

        $resultado = DB_query($consulta, $db);

        prnMsg($consulta, "no");

        while ($renglon = DB_fetch_array($resultado)) {
            $opcionesfechas .= "<option value='" . $renglon['u_movimiento'] . "'>" . $renglon['fecha_agenda'] . "@" . $renglon['name'] . "@" . $renglon['tiposeguimiento'] . "@" . $renglon['color'] . "</option>";
        }

        // consulta para obtener prospectos, oportunidades y actividades
        $consulta = "SELECT prospect_movimientos.idstatus, prospect_status.nombre AS etapa, prospect_status.nombrealterno, prospect_status.logo, debtorsmaster.debtorno, 
                        prospect_movimientos.u_movimiento, debtorsmaster.name AS prospecto, custbranch.salesman, salesman.salesmanname, salesman.usersales AS vendedor_userid, 
                        custbranch.SectComClId, SectComercialCl.SectComClNom, debtorsmaster.address4, debtorsmaster.address3, custbranch.email, 
                        custbranch.phoneno, custbranch.movilno, custcontacts.CustLeadSourceId, custcontacts.contactname, Custleadsource.CustLeadSourceNom, 
                        prospect_movimientos.link_google_map, prospect_movimientos.cargo, prospect_movimientos.fecha_compromiso AS fecha_oportunidad, 
                        tasks_movimientos.fecha_compromiso AS fecha_actividad, 
                        IF(tasks_movimientos.fecha_compromiso IS NULL, prospect_movimientos.fecha_compromiso, CONCAT(tasks_movimientos.fecha_compromiso, ' ',tasks_movimientos.hora)) AS ultima_fecha,
                        CONCAT(IF(prospect_movimientos.concepto IS NULL, '', prospect_movimientos.concepto), IF(tasks_movimientos.concepto IS NULL, '', CONCAT(' - ', tasks_movimientos.concepto))) AS titulo, 
                        prospect_movimientos.descripcion AS oportunidad, tasks_movimientos.descripcion AS ultima_actividad,
                        debtorsmaster.address1, custbranch.braddress4 AS codigopostal, 
                        CASE WHEN tasks_movimientos.fecha_compromiso IS NULL THEN prospect_status.logo
                        	WHEN tasks_movimientos.fecha_compromiso BETWEEN '" . $fechainicio . "' AND '" . $fechafin . "' AND oportunidad_tipo.id IS NOT NULL THEN oportunidad_tipo.iconodia
                        	WHEN tasks_movimientos.fecha_compromiso = DATE_FORMAT(NOW(), '%Y-%m-%d') THEN oportunidad_tipo.iconodia
                        	WHEN tasks_movimientos.fecha_compromiso > DATE_FORMAT(NOW(), '%Y-%m-%d') THEN oportunidad_tipo.iconoagendado
                        	ELSE prospect_status.logo END AS icono_mapa,
                        CASE WHEN tasks_movimientos.fecha_compromiso IS NULL THEN 0 
                            WHEN tasks_movimientos.fecha_compromiso BETWEEN '" . $fechainicio . "' AND '" . $fechafin . "' AND oportunidad_tipo.id IS NOT NULL AND oportunidad_tipo.flagvisita THEN 1 
                            WHEN tasks_movimientos.fecha_compromiso = DATE_FORMAT(NOW(), '%Y-%m-%d') AND oportunidad_tipo.flagvisita THEN 1 
                            WHEN tasks_movimientos.fecha_compromiso > DATE_FORMAT(NOW(), '%Y-%m-%d') THEN 0
                            ELSE 0 END AS rutadia, prospect_movimientos.referencia, prospect_movimientos.erp, 
                            IFNULL(prospect_clasificacion.description, 'S/C') AS clasificacion,
                            IFNULL(salesorders.orderno, 0) AS pedidoventa, prospect_movimientos.fecha_alta,
                            IFNULL(prospect_movimientos.monto_pagado, 0) AS monto_pagado,
                            DATE_FORMAT(prospect_movimientos.fecha_alta, '%d/%m/%Y') as fecha_alta_formato
                    FROM debtorsmaster
                    INNER JOIN custbranch ON debtorsmaster.debtorno=custbranch.debtorno AND debtorsmaster.debtorno=custbranch.branchcode
                    INNER JOIN prospect_movimientos ON debtorsmaster.debtorno=prospect_movimientos.debtorno
                    INNER JOIN prospect_status ON prospect_movimientos.idstatus=prospect_status.idstatus
                    LEFT JOIN custcontacts ON prospect_movimientos.clientcontactid=custcontacts.contid
                    LEFT JOIN Custleadsource ON custcontacts.CustLeadSourceId=Custleadsource.CustLeadSourceId
                    LEFT JOIN salesman ON prospect_movimientos.salesman=salesman.salesmancode
                    LEFT JOIN SectComercialCl ON custbranch.SectComClId=SectComercialCl.SectComClId
                    LEFT JOIN (
                        SELECT u_prospecto, MAX(u_movimiento) AS u_movimiento
                        FROM tasks_movimientos 
                        INNER JOIN prdstatussimple ON tasks_movimientos.idstatus=prdstatussimple.idstatus
                        WHERE prdstatussimple.final=0
                        GROUP BY u_prospecto
                    ) actividades ON prospect_movimientos.u_movimiento=actividades.u_prospecto
                    LEFT JOIN tasks_movimientos ON actividades.u_movimiento=tasks_movimientos.u_movimiento
                    LEFT JOIN oportunidad_tipo ON tasks_movimientos.TipoMovimientoId=oportunidad_tipo.id
                    LEFT JOIN prospect_clasificacion ON prospect_movimientos.erp=prospect_clasificacion.id
                    LEFT JOIN salesorders ON prospect_movimientos.u_movimiento=salesorders.idprospect
                    WHERE 1=1 " . $marcainicial . " " . $condicion . " 
                    ORDER BY ultima_fecha, prospecto, prospect_status.orden";

        prnMsg($consulta, "no");

        $resultado = DB_query($consulta, $db);

        while ($registro = DB_fetch_array($resultado)) {
            $dato = array();
            $accionmapa = "disabled";
            $habilitaimagenes = "disabled";
            $selecionado = "";

            //$dato["indice"] = '<span>Alta: ' . $registro['fecha_alta_formato'] . '</span>';
            $dato["indice"] = '<span class="badge" style="background-color: slategray;">' . $indice . '</span>';

            if (in_array($_SESSION["UserID"], $arrUsuarios)) {
                if (isset($_POST["chkSelecciona_" . $registro['u_movimiento']])) {
                    $selecionado = "checked";
                }

                $dato["indice"] .= '<input type="checkbox" class="chkOportunidad" name="chkSelecciona_' . $registro['u_movimiento'] . '" id="chkSelecciona_' . $registro['u_movimiento'] . '" ' . $selecionado . ' data-oportunidad="' . $registro['u_movimiento'] . '" value="' . $registro['u_movimiento'] . '">';
            }

            $dato[0] =  '<span class="hidden">Etapa ' . $registro['nombrealterno'] . '</span>
                        <button type="button" class="btn btn-default" id="u_' . $registro['u_movimiento'] . '" onclick="fnEtapaB(' . $registro['u_movimiento'] . ');" 
                            data-toggle="tooltip" data-placement="right" title="[' . $registro['nombrealterno'] . '] | ' . $registro['etapa'] . '">
                            <img width=20 height=20 src="images/' . $registro['logo'] . '" border="0">
                        </button>';

            $dato[1] = $registro['u_movimiento'];

            $dato[2] = $registro['fecha_alta_formato'];

            $dato[3] = "<b>" . $registro['debtorno'] . " | " . $registro['prospecto'] . " (" . $registro['referencia'] . ")</b><br><font color='gray'>" . "Correo: " . $registro['email'] . "</font>";
            $dato[3] .= "<label id='lblFechaOportunidad_" . $registro['u_movimiento'] . "' style='display: none;'>" . $registro['fecha_oportunidad'] . "</label>";
            $dato[3] .= "<label id='lblOportunidad_" . $registro['u_movimiento'] . "' style='display: none;'>" . $registro['oportunidad'] . "</label>";
            $dato[3] .= "<label id='lblFechaActividad_" . $registro['u_movimiento'] . "' style='display: none;'>" . $registro['fecha_actividad'] . "</label>";
            $dato[3] .= "<label id='lblUlimaActividad_" . $registro['u_movimiento'] . "' style='display: none;'>" . $registro['ultima_actividad'] . "</label>";
            $dato[3] .= "<label id='lblNombreProspecto_" . $registro['u_movimiento'] . "' style='display: none;'>" . $registro['prospecto'] . "</label>";
            $dato[3] .= "<label id='lblContactoProspecto_" . $registro['u_movimiento'] . "' style='display: none;'>" . $registro['contactname'] . "</label>";
            $dato[3] .= "<label id='lblTelProspecto_" . $registro['u_movimiento'] . "' style='display: none;'>" . $registro['phoneno'] . "</label>";
            $dato[3] .= "<label id='lblDireccionProspecto_" . $registro['u_movimiento'] . "' style='display: none;'>" . $registro['address1'] . "</label>";
            $dato[3] .= "<label id='lblMapaProspecto_" . $registro['u_movimiento'] . "' style='display: none;'>" . $registro['link_google_map'] . "</label>";
            $dato[3] .= "<label id='lblLogo_" . $registro['u_movimiento'] . "' style='display: none;'>" . $registro['icono_mapa'] . "</label>";
            $dato[3] .= "<label id='lblEstatus_" . $registro['u_movimiento'] . "' style='display: none;'>" . $registro['idstatus'] . "</label>";
            $dato[3] .= "<label id='lblRutaDia_" . $registro['u_movimiento'] . "' style='display: none;'>" . $registro['rutadia'] . "</label>";

            $dato[4] = $registro['phoneno'] . "<br>" . $registro['contactname'];

            // agregar boton para cambiar vendedor
            $dato[5] = "<label id='lblNombreVendedor_" . $registro['u_movimiento'] . "'>" . $registro['salesmanname'] . "</label>";

            if ($permisovendedores == "1") {
                $dato[5] .= '&nbsp;&nbsp;
                        <button type="button" class="btn btn-info btn-xs" data-toggle="modal" data-target="#modalvendedor" data-movimiento="' . $registro['u_movimiento'] . '" 
                            data-toggle="tooltip" data-placement="right" title="Asignar Vendedor" style="border-radius: 15px;">
                            <span class="glyphicon glyphicon-user" aria-hidden="true"></span>
                        </button>';
            }

            $dato[6] = $registro['SectComClNom'];

            $montoEstimado = floatval($registro['cargo']);
            $montoPagado = isset($registro['monto_pagado']) ? floatval($registro['monto_pagado']) : 0;
            $porcentajePagado = 0;

            if ($montoEstimado > 0) {
                $porcentajePagado = round(($montoPagado / $montoEstimado) * 100, 2);
            }

            $dato[7] = "<span id='lblValorEstimado_" . $registro['u_movimiento'] . "' style='display:none;'>" . number_format($registro['cargo'], 2, ".", "") . "</span>"
                    . "<span id='lblMontoPagado_" . $registro['u_movimiento'] . "' style='display:none;'>" . number_format($montoPagado, 2, ".", "") . "</span>"
                    . "$ " . number_format($registro['cargo'], 2, ".", ",") . "<br>" . $registro['clasificacion'];
            $dato[8] = $registro['address3'] . ", " . $registro['address4'];
            $dato[9] = $registro['CustLeadSourceNom'];

            if (!empty($registro['link_google_map'])) {
                $accionmapa = "btn-success";
            }

            if (!empty($arrImagenes[$registro['u_movimiento']]) && $arrImagenes[$registro['u_movimiento']] > 0) {
                $habilitaimagenes = "btn-success";
            }

            $lnkpedidoventa = '<button type="button" class="btn btn-default disabled" data-toggle="tooltip" data-placement="right" title="Ir al Pedido de Venta">
                                <span class="glyphicon glyphicon-usd" aria-hidden="true"></span>
                            </button>
                            &nbsp;
                            <button type="button" class="btn btn-default disabled" data-toggle="tooltip" data-placement="right" title="Imprimir Documentos">
                                <span class="glyphicon glyphicon-print" aria-hidden="true"></span>
                            </button>
                            ';

            // validar si la oportunidad ya tiene un pedido asignado
            if (!empty($registro['pedidoventa'])) {
                $lnkpedidoventa = '<a target="_blank" href="SelectOrderItemsV7_0.php?&ModifyOrderNumber=' . $registro['pedidoventa'] . '">
                                        <button type="button" class="btn btn-success" data-toggle="tooltip" data-placement="right" title="Ir al Pedido de Venta">
                                            <span class="glyphicon glyphicon-usd" aria-hidden="true"></span>
                                        </button>
                                    </a>
                                    &nbsp;
                                    <button type="button" class="btn btn-success" data-toggle="tooltip" data-placement="right" title="Imprimir Documentos" onclick="fnDocumentosAdmin(' . $registro['u_movimiento'] . ');">
                                        <span class="glyphicon glyphicon-print" aria-hidden="true"></span>
                                    </button>';
            }

            $dato[10] = '<a target="#">
                            <button type="button" class="btn btn-default ' . $accionmapa . '" data-toggle="tooltip" data-placement="right" title="Ver Mapa" onclick="fnMostrarCoordenadaMapa(' . $registro['u_movimiento'] . ',' . $registro['link_google_map'] . ');">
                                <span class="glyphicon glyphicon-map-marker" aria-hidden="true"></span>
                            </button>
                        </a>
                        &nbsp;' .
                $lnkpedidoventa .
                '&nbsp;';

            //if ($registro['u_movimiento'] == '28197'){
            $dato[10] .= '<button type="button" class="btn btn-default ' . $habilitaimagenes . '" onclick="fnMostrarImagenOportunidad(' . $registro['u_movimiento'] . ',\'_234fasdf2rg\');" data-toggle="tooltip" data-placement="right" title="Ver Imagenes">
                            <span class="glyphicon glyphicon-picture" aria-hidden="true"></span>
                        </button>';

            $dato[10] .= '&nbsp;<button type="button" class="btn btn-info btn-xs" onclick="fnAbrirModalPagos(' . $registro['u_movimiento'] . ');" title="Pagos e historial">
                            <span class="glyphicon glyphicon-list-alt" aria-hidden="true"></span>
                        </button>';
            $arrAdmins = array('desarrollo', 'asantacruz', 'iflores', 'ilores');
            $esAdmin = in_array($_SESSION['UserID'], $arrAdmins) ? 1 : 0;
            $esVendedorDueno = ($registro['vendedor_userid'] == $_SESSION['UserID']) ? 1 : 0;
            if ($esAdmin || $esVendedorDueno) {
                $dato[10] .= '&nbsp;<button type="button" class="btn btn-warning btn-xs" data-userid="' . $registro['vendedor_userid'] . '" data-nombre="' . addslashes($registro['salesmanname']) . '" data-movimiento="' . $registro['u_movimiento'] . '" data-prospecto="' . addslashes($registro['prospecto']) . '" data-esadmin="' . $esAdmin . '" onclick="fnAbrirChatVendedor(this.dataset.userid, this.dataset.nombre, this.dataset.movimiento, this.dataset.prospecto, this.dataset.esadmin);" title="Chat Vendedor" style="border-radius:15px;"><span class="glyphicon glyphicon-comment"></span></button>';
            }
            /*} else {
                $dato[9].= '<button type="button" class="btn btn-default '.$habilitaimagenes.'" onclick="fnMostrarImagenOportunidad('.$registro['u_movimiento'].');" data-toggle="tooltip" data-placement="right" title="Ver Imagenes">
                            <span class="glyphicon glyphicon-picture" aria-hidden="true"></span>
                        </button>';
            }*/

            if (!in_array($registro['idstatus'], array('0', '6', '8')) && $_SESSION['UserID'] === "scenteno") {
                $dato[10] .= '&nbsp;<button type="button" class="btn btn-default" onclick="fnCambiarEtapa(' . $registro['u_movimiento'] . ', ' . $registro['idstatus'] . ', ' . $registro['salesman'] . ', \'' . $registro['fecha_oportunidad'] . '\');" data-toggle="tooltip" data-placement="right" title="Cambiar Etapa">
                                <span class="glyphicon glyphicon-retweet" aria-hidden="true"></span>
                            </button>';
            }

            $dato[11] = "<b>Fecha Actividad: </b>" . $registro['fecha_actividad'];
            $dato[12] = "<b>Titulo:</b> " . (isset($registro['concepto']) ? $registro['concepto'] : '');
            $dato[13] = "<b>Comentario:</b> " . (isset($registro['descripcion']) ? $registro['descripcion'] : '');
            $dato[14] = $registro['u_movimiento'];

            if (in_array($registro['idstatus'], array('0', '1', '2', '3', '4'))) {
                if (!empty($registro["fecha_actividad"])) {
                    if ($registro["fecha_actividad"] == date("Y-m-d")) {
                        $dato["estilos"] = "style='background-color: gold'";
                    } else if ($registro["fecha_actividad"] < date("Y-m-d")) {
                        $dato["estilos"] = "style='background-color: lightcoral; color: white;'";
                        $dato[3] .= "<label id='bolGeneraActividad_" . $registro['u_movimiento'] . "' style='display: none;'>1</label>";
                    }
                } else {
                    if ($registro["fecha_oportunidad"] == date("Y-m-d")) {
                        $dato["estilos"] = "style='background-color: gold'";
                    } else if ($registro["fecha_oportunidad"] < date("Y-m-d")) {
                        $dato["estilos"] = "style='background-color: lightcoral; color: white;'";
                        $dato[3] .= "<label id='bolGeneraActividad_" . $registro['u_movimiento'] . "' style='display: none;'>1</label>";
                    }
                }
            }


            $dato["estilos"] .= " class='renglondatos' ";

            /*$registro['link_google_map'];
            $dato[18]=$registro['cargo'];
            $dato[19]=$registro['fecha_opotunidad'];
            $dato[20]=$registro['concepto'];
            $dato[21]=$registro['descripcion'];
            $dato[22]=$registro['fecha_alta'];*/

            $datos["contenido"][] = $dato;

            $datos["totalestimado"] += isset($registro['cargo']) ? $registro['cargo'] : 0;

            $indice++;
        }

        $datos["fechas"] = $opcionesfechas;

        return $datos;
    } catch (Exception $ex) {
        prnMsg($ex->getMessage(), "error");
    }
}

// Generar arreglo con el contenido de datos para la tabla
if (isset($_POST["btnBuscarDatos"]) || isset($_GET["umovimiento"])) {
    $datosprospectos = array();
    $datosprospectos = fnGeneraDatos(
        $_POST["txtProspecto"],
        $_POST["cmbComisionista"],
        $fechainicio,
        $fechafin,
        $_POST["chkEstatus"],
        $db
    );

    $estructura["datos"] = $datosprospectos["contenido"];

    $estructura["pietabla"][1]["valor"] = number_format($datosprospectos["totalestimado"], 2, '.', ',');

    // Genera tabla html de todo el contenido de la orden de trabajo
    $tablahtml = $elementos::fnGeneraTabla($estructura, "tblProspectos", 0);
}

?>

<!--<script src="https://code.jquery.com/jquery-3.5.1.js"></script>-->
<!--<script src="//ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min.js"></script>-->

<script src="https://polyfill.io/v3/polyfill.min.js?features=default"></script>

<!-- Include the plugins CSS and JS: -->
<script type="text/javascript" src="javascripts/multiselect/bootstrap-multiselect.js"></script>
<link rel="stylesheet" href="javascripts/multiselect/bootstrap-multiselect.css" type="text/css">

<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
<link rel="stylesheet" href="//code.jquery.com/ui/1.11.4/themes/smoothness/jquery-ui.css">

<!-- Incluir librerias para el estilo de tabla -->
<link rel="stylesheet" href="css/datatable/DataTables-1.13.2/css/jquery.dataTables.css" type="text/css">
<link rel="stylesheet" href="css/datatable/DataTables-1.13.2/css/dataTables.bootstrap.min.css" type="text/css">
<link rel="stylesheet" href="css/datatable/datatables.min.css" type="text/css">
<link rel="stylesheet" href="css/datatable/FixedColumns-4.2.1/css/fixedColumns.dataTables.min.css" type="text/css">
<link rel="stylesheet" href="css/datatable/FixedHeader-3.3.1/css/fixedHeader.dataTables.min.css" type="text/css">
<link rel="stylesheet" href="css/datatable/Buttons-2.3.4/css/buttons.bootstrap5.min.css" type="text/css">
<link rel="stylesheet" href="css/datatable/RowGroup-1.3.0/css/rowGroup.dataTables.min.css" type="text/css">
<link rel="stylesheet" href="estilostesoreria.css" type="text/css">

<!--<script type="text/javascript" src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js" ></script>-->
<script type="text/javascript" src="css/datatable/DataTables-1.13.2/js/jquery.dataTables.min.js"></script>
<script type="text/javascript" src="css/datatable/DataTables-1.13.2/js/dataTables.bootstrap.min.js"></script>
<script type="text/javascript" src="css/datatable/FixedColumns-4.2.1/js/dataTables.fixedColumns.min.js"></script>
<script type="text/javascript" src="css/datatable/FixedHeader-3.3.1/js/dataTables.fixedHeader.min.js"></script>
<script type="text/javascript" src="css/datatable/Buttons-2.3.4/js/dataTables.buttons.min.js"></script>
<script type="text/javascript" src="css/datatable/Buttons-2.3.4/js/buttons.dataTables.min.js"></script>
<script type="text/javascript" src="css/datatable/Buttons-2.3.4/js/buttons.html5.min.js"></script>
<script type="text/javascript" src="css/datatable/Buttons-2.3.4/js/buttons.colVis.min.js"></script>
<script type="text/javascript" src="css/datatable/JSZip-2.5.0/jszip.min.js"></script>
<script type="text/javascript" src="javascripts/jquery-datatable/extensions/export/buttons.flash.min.js"></script>
<script type="text/javascript" src="css/datatable/RowGroup-1.3.0/js/dataTables.rowGroup.min.js"></script>

<!-- FullCalendar -->
<link href="javascripts/fullcalendar/dist/fullcalendar.min.css" rel="stylesheet">
<link href="javascripts/fullcalendar/dist/fullcalendar.print.css" rel="stylesheet" media="print">
<script src="js/uuid.js"></script>
<script type="module" src="./coordenadas.js"></script>
<script src="js/ProspectV2.js?v=<?= rand(); ?>" type="text/javascript"></script>

<style>
    @media only screen and (max-width: 600px) {
        .tabla_header {
            display: none;
        }

        #pac-input {
            width: 90%;

        }

        #cuadroruta {
            height: 30px;
            width: 60%;
        }

        #detalleruta {
            display: none;
        }
    }

    .buscar_direccion {
        margin-left: 9px;
        height: 32px;
        width: 30%;
        border: 1px solid lightgray;
    }

    .estiloruta {
        width: 20%;
        border: 1px solid gray;
        margin-left: 10px;
        border-radius: 10px;
        background-color: rgba(0, 0, 0, 0.8);
        color: whitesmoke;
        height: 450px;
        margin-top: 10px;
    }

    .renglonruta {
        padding-bottom: 15px;
    }

    /* cada turno como un post-it individual */
    .postit {
        background: #fff9c4;
        /* amarillo clásico post-it */
        padding: 1.2rem 1.5rem;
        border-radius: 8px 20px 20px 20px;
        box-shadow: 4px 6px 10px rgba(0, 0, 0, 0.1), 0 0 0 1px #f9e88b inset, 0 0 0 2px #fffbe6 inset;
        transition: transform 0.1s ease;
        position: relative;
        max-width: 90%;
        width: fit-content;
        font-family: 'Segoe UI', 'Kalam', 'Courier New', monospace;
    }

    /* variante para usuario y para modal/respuesta (distinto color pero mismo estilo) */
    .postit-usuario {
        background: #fff2b5;
        /* amarillo más claro */
        align-self: flex-start;
        border-bottom-left-radius: 8px;
        border-top-right-radius: 20px;
        border-bottom-right-radius: 20px;
        transform: rotate(-0.5deg);
    }

    /* texto dentro de la nota */
    .mensaje-postit {
        font-size: 1rem;
        line-height: 1.45;
        color: #2c2a24;
        margin-bottom: 0.6rem;
        word-break: break-word;
    }

    /* remitente y meta pequeña (simula escritura a mano) */
    .autor-nota {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.8rem;
        flex-wrap: wrap;
        margin-top: 0.5rem;
        border-top: 1px dashed #e7cf89;
        padding-top: 0.5rem;
        font-size: 0.7rem;
        font-family: 'Courier New', monospace;
        color: #7f6942;
    }

    .nombre {
        font-weight: bold;
        background: #fff0bf;
        padding: 0.1rem 0.6rem;
        border-radius: 30px;
        letter-spacing: -0.2px;
    }

    .fecha-simulada {
        font-style: italic;
    }
</style>

<!-- Custom styling plus plugins -->
<!-- <link href="javascripts/fullcalendar/build/css/custom.min.css" rel="stylesheet"> -->

<form method="POST" action="paneldecontrolprospectos.php" name="formulario" id="formulario">
    <div class="container-fluid">
        <div class="panel-group" style="font-family: Helvetica Neue ,Helvetica,Arial,sans-serif; font-size: 14px;">
            <div class="panel panel-default">
                <div class="panel-heading h35">
                    <h4 class="panel-title">
                        <div class="fl text-left">
                            <a role="button" data-toggle="collapse" data-parent="#accordion" href="#closeTab" aria-expanded="true" aria-controls="collapseOne" style="color: #337ab7;">
                                <b>Filtros Para Panel de Prospectos</b>
                            </a>
                        </div>
                    </h4>
                </div>
                <div id="closeTab" class="panel-collapse collapse in">
                    <div class="panel-body">
                        <div class="row">
                            <div class="col-md-3">
                                <div class="form-group">
                                    <label class="pull-left">Prospecto:</label>
                                    <? echo InsertaElemento("texto", "txtProspecto", $_POST["txtProspecto"], "", true, "id='txtProspecto' class='form-control'", "", false); ?>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <label class="pull-left">Sector Comercial:</label>
                                    <? echo InsertaElemento("sectorcomercial", "cmbSectorComercial[]", $_POST["cmbSectorComercial"], "", true, "id='cmbSectorComercial' multiple='multiple'", "form-control", false); ?>
                                </div>
                            </div>

                            <div class="col-md-3">
                                <div class="form-group">
                                    <label class="pull-left">Vendedor:</label>
                                    <? echo InsertaElemento("comisionistas", "cmbComisionista[]", $_POST["cmbComisionista"], "", true, "id='cmbComisionista' multiple='multiple'", "form-control", false); ?>
                                </div>
                            </div>

                            <div class="col-md-3">
                                <div class="form-group">
                                    <label class="pull-left">Fuente Contacto:</label>
                                    <? echo InsertaElemento("fuentecontacto", "cmbFuenteContacto[]", $_POST["cmbFuenteContacto"], "", true, "id='cmbFuenteContacto' multiple='multiple'", "form-control", false); ?>
                                </div>
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-md-3">
                                <div class="form-group">
                                    <label class="pull-left">Municipio:</label>
                                    <? echo InsertaElemento("municipios", "cmbMunicipio[]", $_POST["cmbMunicipio"], "", true, "id='cmbMunicipio' multiple='multiple'", "form-control", false); ?>
                                </div>
                            </div>

                            <div class="col-md-2">
                                <div class="col-md-1 col-xs-1">
                                    <? echo $checkfecha; ?>
                                </div>
                                <div class="form-group">
                                    <div class="row">
                                        <label class="pull-left" style="margin-left: 16px;">Desde:</label>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-4 col-xs-4"><? echo InsertaElemento("combodia", "cmbDiaInicio", $_POST["cmbDiaInicio"], "width: 63px;", true, "id='cmbDiaInicio'", "form-control", false); ?> </div>
                                        <div class="col-md-4 col-xs-4"><? echo InsertaElemento("combomes", "cmbMesInicio", $_POST["cmbMesInicio"], "", true, "id='cmbMesInicio'", "form-control", false); ?> </div>
                                        <div class="col-md-4 col-xs-4"><? echo InsertaElemento("texto", "txtAnioInicio", $_POST["txtAnioInicio"], "margin-left: 17px;width:70px;", true, "id='txtAnioInicio'", "class='form-control'", false); ?> </div>
                                    </div>
                                </div>
                            </div>

                            <div class="col-md-2" style="margin-left: 44px;">
                                <div class="form-group">
                                    <div class="row">
                                        <label class="pull-left" style="margin-left: 16px;">Hasta:</label>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-4 col-xs-4"><? echo InsertaElemento("combodia", "cmbDiaFin", $_POST["cmbDiaFin"], "width: 63px;", true, "id='cmbDiaFin'", "form-control", false); ?></div>
                                        <div class="col-md-4 col-xs-4"><? echo InsertaElemento("combomes", "cmbMesFin", $_POST["cmbMesFin"], "", true, "id='cmbMesFin'", "form-control", false); ?></div>
                                        <div class="col-md-3 col-xs-3"><? echo InsertaElemento("texto", "txtAnioFin", $_POST["txtAnioFin"], "margin-left: 17px;width:70px;", true, "id='txtAnioFin'", "class='form-control'", false); ?></div>
                                    </div>
                                </div>
                            </div>

                            <div class="col-md-4 text-center" style="margin-top:10px; margin-left: 50px; padding-bottom: 12px;">
                                <? echo InsertaElemento("estatusprospectos", "chkEstatus", $_POST["chkEstatus"], "", true, "id='chkEstatus'", "form-control", false); ?>
                            </div>
                        </div>

                        <div class="row">
                            <button type="submit" class="btn btn-default btn-primary" name="btnBuscarDatos" id="btnBuscarDatos">Consultar Prospectos</button>
                            <button type="button" class="btn btn-default btn-info" name="btnNuevoProspecto" id="btnNuevoProspecto" data-toggle="modal" data-target="#myModal">Nuevo Prospecto</button>
                            <input type="textbox" id="txtUsuario" class="hide" value="<?php echo $_SESSION['UsersRealName']; ?>">
                            <select id="selFechas" name="selFechas" class="hide"><?php echo $datosprospectos["fechas"]; ?></select>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="container-fluid">
        <div id="pestanas">
            <ul id=lista>
                <li id="pestana1"><a href='javascript:cambiarPestana2(pestanas,pestana1);'>Prospectos</a></li>
                <li id="pestana2"><a href='javascript:cambiarPestana2(pestanas,pestana2);'>Agenda</a></li>
                <li id="pestana3"><a href='javascript:cambiarPestana2(pestanas,pestana3);'>Mapa</a></li>
            </ul>
        </div>

        <div id="contenidopestanas">
            <div id="cpestana1">
                <div id="tablaResultados">
                    <? echo $tablahtml; ?>
                </div>
            </div>
            <div id="cpestana2">
                <div class="row">
                    <div class="col-md-12">
                        <div class="x_content">
                            <div id='calendar'></div>
                        </div>
                    </div>
                </div>
            </div>
            <div id="cpestana3">
                <div id="map" style="height: 600px;"></div>

                <script
                    src="https://maps.googleapis.com/maps/api/js?key=AIzaSyAH1lXJkBGChSsCkrWnZFOznM-Rzaqggsk&libraries=geometry,places,marker&callback=initMap&v=weekly&loading=async"
                    defer></script>
                <!--<script>
                    (g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({
                        key: "AIzaSyAH1lXJkBGChSsCkrWnZFOznM-Rzaqggsk",
                        // Add other bootstrap parameters as needed, using camel case.
                        // Use the 'v' parameter to indicate the version to load (alpha, beta, weekly, etc.)
                    });
                </script>-->
            </div>
        </div>
    </div>
</form>

<div style="display: none">
    <input id="pac-input" class="buscar_direccion" type="text" placeholder="Buscar direccion" style="left: 9px;" />
</div>

<div id="infowindow-content" class="ventanita" style="text-align: left; display: none;">
    <header style="border: 1px solid blue;border-bottom: 1px solid lightgray;border-left: 0px;border-top: 0px;border-right: 0px;">
        <image width=30 height=30 src="images/logoconstramos.png" border="0"></image>
        &nbsp;&nbsp;&nbsp;<label>Datos de prospecto</label>
    </header>
    <br>
    <label>Direccion: &nbsp;</label><span id="place-address"></span>
    <br>
    <label>Coordenadas: &nbsp;</label><span id="place-id"></span>
    <br>
    <button type="button" class="btn btn-default btn-info btn-xs" name="btnNuevoProspecto" id="btnNuevoProspecto" data-toggle="modal" data-target="#myModal">Nuevo Prospecto</button>
</div>

<div style="display: none;">
    <div id="cuadroruta" class="estiloruta" style="text-align: left;">
        <header style="border: 1px solid blue;border-bottom: 1px solid lightgray;border-left: 0px;border-top: 0px;border-right: 0px;">
            <img width="25" height="25" src="images/logoconstramos.png" border="0" onclick="fnMuestraRuta();">
            &nbsp;&nbsp;&nbsp;<label>Distancia a recorrer:</label>
            <span id="spKilometros"></span>
        </header>
        <div id="detalleruta" style="width: 274px;height: 400px;overflow-x: hidden;overflow-y: auto;text-align: lefr;padding: 8px;">

        </div>
    </div>
</div>

<select id="cmbPoligonos" name="cmbPoligonos" class="hide">
    <?php echo $opcionespoligono; ?>
</select>

<div class="modal fade" id="modalactividad" tabindex="-1" role="dialog">
    <div class="modal-dialog modal-lg" style="width:90%;" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title">Agregar Actividad Para Prospecto <label id="lblprospectoactividad"></label></h4>
            </div>
            <div class="modal-body">
                <form id="formActividad" name="formActividad">
                    <div class="row">
                        <div class="col-md-2 col-xs-12">
                            <div class="form-group">
                                <label class="">Fecha Actividad:</label>
                                <div class="input-group">
                                    <input id="txtFechaActividad" name="txtFechaActividad" type="text" placeholder="yyyy-mm-dd" class="form-control input-sm" value="<?php echo date("Y-m-d"); ?>" autocomplete="off">
                                    <div class="input-group-addon" id="divFechaActividad"><span class="glyphicon glyphicon-calendar" aria-hidden="true"></span></div>
                                    <input type="text" id="txtMovimiento" name="txtMovimiento" class="hide" value="">
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 col-xs-12">
                            <div class="form-group">
                                <label>Tipo Actividad: </label>
                                <select id="cmbTipoActividad" class="form-control" name="cmbTipoActividad">
                                    <?php echo $optionTipoActividad; ?>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-4 col-xs-12">
                            <div class="form-group">
                                <label class="pull-left">Título:</label>
                                <? echo InsertaElemento("texto", "txtTituloActividad", $_POST["txtTituloActividad"], "", true, "id='txtTituloActividad' class='form-control'", "", false); ?>
                            </div>
                        </div>

                    </div>
                    <div class="row">
                        <div class="col-md-6 col-xs-12">
                            <div class="form-group">
                                <label class="pull-left">Descripción:</label>
                                <? echo InsertaElemento("editor", "txtDescripcionActividad", $_POST["txtDescripcionActividad"], "style='resize: vertical;'", true, "id='txtDescripcionActividad' class='form-control'", "", false); ?>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-12 text-right">
                            <button type="button" class="btn btn-primary" id="btnGuardarActividad">Guardar Actividad</button>
                        </div>
                    </div>
                </form>
                <br>
                <div class="row">
                    <div class="col-md-12">
                        <div class="table-responsive" style="margin: 4px, 4px;padding:4px;height: 310px;overflow-x: hidden;overflow-y: auto;">
                            <table id="tablaHistorial" class="table table-striped">
                                <thead>
                                    <td class="titulos_principales">Fecha</td>
                                    <td class="titulos_principales">Tipo</td>
                                    <td class="titulos_principales">Título</td>
                                    <td class="titulos_principales">Descipción</td>
                                    <td class="titulos_principales">Usuario</td>
                                    <td class="titulos_principales">Respuesta</td>
                                </thead>
                                <tbody id="tbHistorial"></tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <div class="alert alert-success hide" role="alert" id="msjActividad1">
                    <p id="mensajeactividad1"></p>
                </div>
                <div class="alert alert-danger hide" role="alert" id="msjActividad2">
                    <p id="mensajeactividad2"></p>
                </div>
                <button type="button" class="btn btn-default" data-dismiss="modal">Cerrar</button>
            </div>
        </div><!-- /.modal-content -->
    </div><!-- /.modal-dialog -->
</div><!-- /.modal -->

<form id="formHistorial" name="formHistorial">
    <div class="modal fade" id="modalhistorial" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-lg" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                    <h4 class="modal-title">Historial de Actividades</label></h4>
                </div>
                <div class="modal-body">
                    <div class="table-responsive hide">
                        <table id="tablaHistorialold" class="table table-striped">
                            <thead>
                                <td class="titulos_principales">Fecha</td>
                                <td class="titulos_principales">Titulo</td>
                                <td class="titulos_principales">Descipcion</td>
                                <td class="titulos_principales">Usuario</td>
                            </thead>
                            <tbody id="tbHistorial">

                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default" data-dismiss="modal">Cerrar</button>
                </div>
            </div><!-- /.modal-content -->
        </div><!-- /.modal-dialog -->
    </div><!-- /.modal -->
</form>

<form id="formVendedor" name="formVendedor">
    <div class="modal fade" id="modalvendedor" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-sm" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                    <h4 class="modal-title">Asignacion de Vendedor</label></h4>
                    <input id="txtMovimientoVendedor" name="txtMovimientoVendedor" class="hidden" value="0">
                </div>
                <div class="modal-body">
                    <div class="row">
                        <div class="col-md-12 col-xs-12">
                            <div class="form-group">
                                <label class="pull-left">Vendedor:</label>
                                <? echo InsertaElemento("comisionistas", "cmbVendedor02", $_POST["cmbVendedor02"], "", true, "id='cmbVendedor02'", "form-control", false); ?>
                            </div>
                        </div>
                    </div>
                    <br />
                </div>
                <div class="modal-footer">
                    <div class="alert alert-success hide" role="alert" id="msjVendedor">
                        <p id="mensajevendedor"></p>
                    </div>
                    <button type="button" id="btnModificaVendedor" name="btnModificaVendedor" class="btn btn-success" onclick="fnActualizaVendedor();">Modificar</button>
                    <button type="button" class="btn btn-default" data-dismiss="modal">Cerrar</button>
                </div>
            </div><!-- /.modal-content -->
        </div><!-- /.modal-dialog -->
    </div><!-- /.modal -->
</form>

<form id="formCalendario" name="formCalendario">
    <div class="modal fade" id="modalcalendario" tabindex="-1" role="dialog">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                    <h4 class="modal-title">Vista Calendario</label></h4>
                </div>
                <div class="modal-body">
                    <p id="txtTitulo"></p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default" data-dismiss="modal">Cerrar</button>
                </div>
            </div><!-- /.modal-content -->
        </div><!-- /.modal-dialog -->
    </div><!-- /.modal -->
</form>
<textarea id="txtRespuestaRuta" class="hide"></textarea>
<!-- Bootstrap -->
<!--<script src="javascripts/fullcalendar/dist/bootstrap.bundle.min.js"></script>-->
<!-- FullCalendar -->
<script src="javascripts/fullcalendar/moment/min/moment.min.js"></script>
<script src="javascripts/fullcalendar/dist/fullcalendar.js"></script>

<!-- Custom Theme Scripts -->
<!--<script src="javascripts/fullcalendar/build/js/custom.js"></script>-->
<script src="js/calendario.js"></script>
<!--<script src="javascripts/fullcalendar/dist/lang/es.js"></script>-->

<?php

include('./modalProspecto.php');

/*
Encontré la solución la comparto para todos ustedes:

1- Crear una variable global del datatable ej: table
2- Al llamar el metodo donde se pintan los datos sobre el body realizar los siguientes pasos:
2.1) borrar los datos del tbody ej: tblBody.empty();
2.2) evaluar si el objeto global es diferente de nulo, si lo es ejecutar las siguientes lineas dentro del if ej:
=>table.clear().draw();//Elimina los datos del objeto global y lo dibuja en la tabla
=> table = $("#tblDatatable").dataTable().fnDestroy();//Destruye el componente datatable para permitir inicializarlo nuevamente nuevamente

2.3) pintar los datos sobre el tbody
2.4) una vez pintados todos los datos inicializar nuevamente dataTable con toda su configuración ej:

table =$("#tblDatatable").DataTable({responsive: true});

FIN, de esta forma el dataTable no guardara el cache como me estaba pasando, espero les sirva de mucha ayuda
*/

?>

<script type="text/javascript">
    var arrDatosPoligono = [];

    $(function() {
        $('[data-toggle="tooltip"]').tooltip();
    });

    $(document).ready(function() {
        $('#cmbSectorComercial, #cmbComisionista, #cmbMunicipio, #cmbFuenteContacto, #cmbCambiarEstatus, #cmbTipoActividad, #cmbVendedor02, #cmbVendedor03').multiselect({
            buttonWidth: '100%',
            maxHeight: 340,
            enableFiltering: true,
            includeSelectAllOption: true,
            enableCaseInsensitiveFiltering: true,
            filterPlaceholder: "Buscar...",
            nonSelectedText: "Seleccionar...",
            selectAllText: "Seleccionar todos"
        });

        $('#cmbMesInicio, #cmbMesFin').multiselect({
            buttonWidth: '80px',
            buttonTextAlignment: 'left',
            maxHeight: 340,
            enableFiltering: true,
            includeSelectAllOption: true,
            enableCaseInsensitiveFiltering: true,
            filterPlaceholder: "Buscar...",
            nonSelectedText: "Seleccionar...",
            selectAllText: "Seleccionar todos",
        });

        var datapicker_config = {
            dateFormat: "yy-mm-dd",
            defaultDate: "Now",
            dayNames: ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"],
            dayNamesShort: ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"],
            dayNamesMin: ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"],
            monthNames: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
            monthNamesShort: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
            minDate: 0,
            beforeShow: function() {
                setTimeout(function() {
                    $(".ui-datepicker").css("z-index", 2100);
                }, 0);
            }
        };

        init_calendar("calendar", true);

        $('#modalvendedor').on('show.bs.modal', function(event) {
            var boton = $(event.relatedTarget); // Button that triggered the modal
            var oportunidad = boton.data('movimiento'); // Extract info from data-* attributes
            var modal = $(this);

            $("#msjVendedor").addClass("hide");
            $("#cmbVendedor02").val(0);
            $("#cmbVendedor02").multiselect("refresh");

            modal.find('#txtMovimientoVendedor').val(oportunidad);
        });

        if ($.fn.datepicker) {
            $("#txtFechaActividad").datepicker(datapicker_config);
            $("#txtFechaActividadNuevo").datepicker(datapicker_config);
            $("#txtModificarFechaActividad").datepicker(datapicker_config);
        }

        function addCell(tr, content, colSpan = 1, alineacion = "right", colorfondo = "") {
            let td = document.createElement('th');

            td.colSpan = colSpan;
            td.textContent = content;
            td.style = "text-align: " + alineacion + "; background-color: " + colorfondo + ";";
            td.noWrap = "nowrap";

            tr.appendChild(td);
        }

        $("#tblProspectos").DataTable({
            dom: 'Bfrtip',
            paging: false,
            ordering: true,
            info: false,
            scrollY: "500px",
            scrollX: true,
            scrollCollapse: true,
            buttons: [{
                    extend: 'excelHtml5',
                    filename: "Prospectos",
                    footer: true,
                    sheetName: "Prospectos",
                    exportOptions: {
                        messageTop: 'Archivo Excel'
                    }
                },
                {
                    extend: 'colvisGroup',
                    className: "btnDuplicar",
                    text: 'Duplicar Oportunidad'
                },
            ],
            fixedHeader: {
                header: true
            },
            rowGroup: {
                startRender: null,
                endRender: function(rows, group) {
                    let botonactividad = "<button type='button' class='btn btn-default btn-xs btn-primary' data-toggle='modal' onclick=\"fnAbrilModalActividadesNuevo(" + group + ", '" + $("#lblNombreProspecto_" + group).text() + "', '" + $("#lblTelProspecto_" + group).text() + "', '" + $("#lblContactoProspecto_" + group).text() + "');\" data-movimiento='" + group + "' data-prospecto='" + $("#lblNombreProspecto_" + group).text() + "' data-telefono='" + $("#lblTelProspecto_" + group).text() + "' data-contacto='" + $("#lblContactoProspecto_" + group).text() + "'>" +
                        "<span class='glyphicon glyphicon-tasks' aria-hidden='true'></span>" +
                        "</button>";
                    let botonhistorial = "";
                    /*let botonhistorial= "<button type='button' class='btn btn-default btn-xs btn-info' onclick='fnTraeHistorial("+group+");'>"+
                                            "<span class='glyphicon glyphicon-list' aria-hidden='true'></span>"+
                                        "</button>";*/
                    let idestatus = $("#lblEstatus_" + group).text();
                    let oportunidad = "";
                    if (idestatus == "3" || idestatus == "4" || idestatus == "6" || idestatus == "7") {
                        oportunidad += "<font style='font-weight: normal;'>Fecha Estimada Cierre:</font> <font color='blue' style='font-weight: normal;'>" + $("#lblFechaOportunidad_" + group).text() + "</font> &nbsp;&nbsp;&nbsp;";
                        oportunidad += "<font style='font-weight: normal;'>Oportunidad:</font> <font color='blue' style='font-weight: normal;'>" + $("#lblOportunidad_" + group).text() + "</font> &nbsp;&nbsp;&nbsp;";
                    }

                    oportunidad += "<font style='font-weight: normal;'>Fecha Actividad:</font> <font color='blue' style='font-weight: normal;'>" + $("#lblFechaActividad_" + group).text() + "</font> &nbsp;&nbsp;&nbsp;";


                    let montoPagadoTxt = ($("#lblMontoPagado_" + group).text() || "0").replace(/,/g, "").trim();
                    let valorEstimadoTxt = ($("#lblValorEstimado_" + group).text() || "0").replace(/,/g, "").trim();

                    let montoPagado = parseFloat(montoPagadoTxt);
                    let valorEstimado = parseFloat(valorEstimadoTxt);

                    if (isNaN(montoPagado)) {
                        montoPagado = 0;
                    }

                    if (isNaN(valorEstimado)) {
                        valorEstimado = 0;
                    }

                    let porcentajePagado = 0;
                    if (valorEstimado > 0) {
                        porcentajePagado = ((montoPagado / valorEstimado) * 100).toFixed(2);
                    }

                    let detallePagado = "&nbsp;&nbsp;&nbsp;<font style='font-weight: normal;'>Pagado:</font> <font color='green' style='font-weight: bold;'>$" + montoPagado.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + "</font>";
                    let detalleAvance = "&nbsp;&nbsp;&nbsp;<font style='font-weight: normal;'>Avance pago:</font> <font color='#1f4e79' style='font-weight: bold;'>" + porcentajePagado + "%</font>";

                    let actividad = "<font style='font-weight: normal;'>Comentario Actividad:</font> <font color='blue' style='font-weight: normal;'>" + $("#lblUlimaActividad_" + group).text() + "</font>" + detallePagado + detalleAvance;

                    if ($("#bolGeneraActividad_" + group).text() == "1") {
                        actividad = "<font style='font-weight: normal;'>Comentario Actividad:</font> <font color='blue' style='font-weight: normal;'>" + $("#lblUlimaActividad_" + group).text() + "</font>" + detallePagado + detalleAvance + " <br> <font color='red' style='font-weight: bold;'>" + "SE REQUIERE DAR DE ALTA UNA ACTIVIDAD&nbsp;&nbsp;&nbsp;</font>";
                    }

                    /* CALCULAR DIAS DE VENCIMIENTO */

                    let lblDiasVencido = "";

                    if (idestatus != "6" && idestatus != "5" && idestatus != "8") {
                        let fechaValidar = $("#lblFechaActividad_" + group).text();
                        if (fechaValidar == "") {
                            fechaValidar = $("#lblFechaOportunidad_" + group).text();
                        }
                        var fecha_oporutunidad = new Date(fechaValidar);
                        var fecha_actual = new Date();
                        let lblDias = "";
                        if (fecha_oporutunidad < fecha_actual) {
                            lblDias = fecha_oporutunidad - fecha_actual;
                            lblDias = (lblDias / (1000 * 60 * 60 * 24));
                            if (Math.abs(parseInt(lblDias)) > 0) {
                                lblDiasVencido = "<font style='font-weight: 900;'> Días Vencimiento:</font> <font color='red' style='font-weight: normal;'>" + Math.abs(parseInt(lblDias)) + " </font> &nbsp;&nbsp;&nbsp;";
                            }
                        }
                    }

                    var divNotas = '<div class="postit postit-usuario">' +
                        '<div class="mensaje-postit">' +
                        '<strong>¿Que opinas de este diseño?</strong><br>' +
                        'La ventana modal se ve bien, pero algo no me convence.' +
                        '</div>' +
                        '<div class="autor-nota">' +
                        '<span class="nombre">usuario</span>' +
                        '<span class="fecha-simulada">post-it #1</span>' +
                        '</div>' +
                        '</div>' +
                        '</div>';

                    /*lblDiasVencido+= "<button type='button' class='btn btn-default btn-xs btn-primary' data-toggle='modal' onclick=\"fnAbrilModalActividadesNuevo("+group+", '"+$("#lblNombreProspecto_"+group).text()+"', '"+$("#lblTelProspecto_"+group).text()+"', '"+$("#lblContactoProspecto_"+group).text()+"');\" data-movimiento='"+group+"' data-prospecto='"+$("#lblNombreProspecto_"+group).text()+"' data-telefono='"+$("#lblTelProspecto_"+group).text()+"' data-contacto='"+$("#lblContactoProspecto_"+group).text()+"'>"+
                                        "<span class='glyphicon glyphicon-remove' aria-hidden='true'></span>"+
                                    "</button>";*/

                    /* */

                    return botonactividad + "&nbsp;&nbsp;" + botonhistorial + "&nbsp;&nbsp;&nbsp;" + oportunidad + actividad + lblDiasVencido;

                    /*let tr = document.createElement('tr');

                    addCell(tr, boton); // boton para crear actividad
                    addCell(tr, boton); // boton para ver el historial de actividades
                    addCell(tr, oportunidad, 9);

                    return tr;*/
                },
                dataSrc: 2
            },
            "language": {
                "sProcessing": "Procesando...",
                "sLengthMenu": "Mostrar _MENU_ registros",
                "sZeroRecords": "No se encontraron resultados",
                "sEmptyTable": "Ningun dato disponible en esta tabla",
                "sInfo": "Registros del _START_ al _END_  total: _TOTAL_ ",
                "sInfoEmpty": "Sin registros",
                "sInfoFiltered": "(filtrado de un total de _MAX_ registros)",
                "sInfoPostFix": "",
                "sSearch": "Buscar:",
                "sUrl": "",
                "sInfoThousands": ",",
                "sLoadingRecords": "Cargando...",
                "oPaginate": {
                    "sFirst": "Primero",
                    "sLast": "Ultimo",
                    "sNext": "Siguiente",
                    "sPrevious": "Anterior"
                },
                "oAria": {
                    "sSortAscending": ": Activar para ordenar la columna de manera ascendente",
                    "sSortDescending": ": Activar para ordenar la columna de manera descendente"
                }
            }
        });

        // Muestra el contenido de la pesta�a pasada como parametro a la funcion,
        // cambia el color de la pesta�a y aumenta el padding para que tape el  
        // borde superior del contenido que esta juesto debajo y se vea de este 
        // modo que esta seleccionada.
        /*$(cpestanna).css('display','');
        $(pestanna).css('background','dimgray');
        $(pestanna).css('padding-bottom','2px'); */

        cambiarPestana2(pestanas, pestana1);

        $('.btnDuplicar').on('click', function(e) {
            e.preventDefault();

            var seleccionados = $('[class="chkOportunidad"]:checked').map(function() {
                return this.value;
            }).get();

            fnDuplicaOportunidad(seleccionados);
        });

        $(".btnDuplicar").css("background-color", "whitesmoke");
        $(".btnDuplicar").css("color", "darkslategray");
        $(".buttons-excel").css("background-color", "whitesmoke");
        $(".buttons-excel").css("color", "darkslategray");
    });

    function fnAbrilModalActividades(oportunidad, prospecto, telefono, contacto) {
        $("#modalactividad input[type=text] , #modalactividad textarea").each(function() {
            this.value = ''
        });
        if ($.fn.datepicker) {
            $('#txtFechaActividad').datepicker("setDate", new Date());
        }
        $('#lblprospectoactividad').text(prospecto + " - " + telefono + " - " + contacto);
        $('#txtMovimiento').val(oportunidad);
        fnTraeHistorial(oportunidad);
        $('#modalactividad').modal("show");
    }

    function cambiarPestana2(pestannas, pestanna) {
        for (let index = 1; index <= 3; index++) {
            $("#pestana" + index).css('background', '');
            $("#pestana" + index).css('padding-bottom', '');
        }

        $("#" + pestanna.id).css('background', 'royalblue');
        $("#" + pestanna.id).css('padding', '5px 20px 10px 20px');

        if (pestanna.id == "pestana1") {
            $("#cpestana1").css("display", "inline");
            $("#cpestana2").css("display", "none");
            $("#cpestana3").css("display", "none");
        }

        if (pestanna.id == "pestana2") {
            $("#cpestana1").css("display", "none");
            $("#cpestana2").css("display", "inline");
            $("#cpestana3").css("display", "none");
        }

        if (pestanna.id == "pestana3") {
            $("#cpestana1").css("display", "none");
            $("#cpestana2").css("display", "none");
            $("#cpestana3").css("display", "inline");
        }
    }

    function cambiarPestana(pestannas, pestanna) {
        // Obtiene los elementos con los identificadores pasados.
        pestanna = document.getElementById(pestanna.id);
        listaPestannas = document.getElementById(pestannas.id);

        // Obtiene las divisiones que tienen el contenido de las pestañas.
        cpestanna = document.getElementById('c' + pestanna.id);
        listacPestannas = document.getElementById('contenido' + pestannas.id);

        i = 0;
        // Recorre la lista ocultando todas las pestañas y restaurando el fondo 
        // y el padding de las pestañas.
        while (typeof listacPestannas.getElementsByTagName('div')[i] != 'undefined') {
            //$(listacPestannas.getElementsByTagName('div')[i]).css('display','none');
            $(listaPestannas.getElementsByTagName('li')[i]).css('background', '');
            $(listaPestannas.getElementsByTagName('li')[i]).css('padding-bottom', '');

            i += 1;
        }

        $(document).ready(function() {
            // Muestra el contenido de la pestaña pasada como parametro a la funcion,
            // cambia el color de la pestaña y aumenta el padding para que tape el  
            // borde superior del contenido que esta juesto debajo y se vea de este 
            // modo que esta seleccionada.
            $(cpestanna).css('display', '');
            $(pestanna).css('background', 'dimgray');
            $(pestanna).css('padding-bottom', '2px');
        });
    }

    function fnMuestraRuta() {
        if ($("#detalleruta").css("display") == "none") {
            $("#cuadroruta").css("height", "450px");
            $("#detalleruta").css("display", "block");
        } else {
            $("#cuadroruta").css("height", "30px");
            $("#detalleruta").css("display", "none");
        }
    }

    /*const comprimirImagen = (imagenComoArchivo, porcentajeCalidad, tipoimagen) => {
		return new Promise((resolve, reject) => {
			const $canvas = document.createElement("canvas");
			const imagen = new Image();
			imagen.onload = () => {
				$canvas.width = imagen.width;
				$canvas.height = imagen.height;
				$canvas.getContext("2d").drawImage(imagen, 0, 0);
                
                $canvas.toBlob(
					(blob) => {
						if (blob === null) {
							return reject(blob);
						} else {
							resolve(blob);
						}
					},
					tipoimagen,
					porcentajeCalidad / 100
				);
			};
			imagen.src = URL.createObjectURL(imagenComoArchivo);
		});
	};*/

    /* Eliminado permanentemente */

function fnAbrirModalPagos(u_movimiento) {
    $("#modalPagosProspecto").modal("show");
    $("#modalPagosProspecto .modal-body").html('<div style="padding:20px;" class="alert alert-info">Cargando...</div>');

    $.ajax({
        url: "paneldecontrolprospectos.php",
        type: "POST",
        data: { ajax_pagos_html: 1, u_movimiento: u_movimiento },
        success: function(html) {
            $("#modalPagosProspecto .modal-body").html(html);
            $("#modalPagosProspecto .blockUI, #modalPagosProspecto .blockOverlay").remove();
            $(".blockUI, .blockOverlay").remove();
            $(".ui-widget-overlay").remove();
            if ($.unblockUI) {
                $.unblockUI();
            }
        },
        error: function(xhr) {
            $("#modalPagosProspecto .modal-body").html('<div style="padding:20px;" class="alert alert-danger">Error AJAX</div>');
            if ($.unblockUI) {
                $.unblockUI();
            }
            $(".blockUI, .blockOverlay").remove();
            console.log(xhr.responseText);
        },
        complete: function() {
            if ($.unblockUI) {
                $.unblockUI();
            }
            $(".blockUI, .blockOverlay").remove();
        }
    });
}

function fnGuardarPagoInline(e, u_movimiento) {
    e.preventDefault();

    var monto = parseFloat($("#txtNuevoPagoModal").val());
    if (isNaN(monto) || monto <= 0) {
        alert("Monto inválido");
        return false;
    }

    $.ajax({
        url: "paneldecontrolprospectos.php",
        type: "POST",
        data: { ajax_guardar_pago: 1, u_movimiento: u_movimiento, monto: monto },
        success: function(resp) {
            console.log("RESP GUARDAR:", resp);
            if (resp && resp.indexOf("OK") !== -1) {
                fnAbrirModalPagos(u_movimiento);
            } else {
                alert("No se pudo guardar el pago");
            }
            if ($.unblockUI) {
                $.unblockUI();
            }
            $(".blockUI, .blockOverlay").remove();
        },
        error: function(xhr) {
            alert("Error al guardar el pago");
            if ($.unblockUI) {
                $.unblockUI();
            }
            $(".blockUI, .blockOverlay").remove();
            console.log(xhr.responseText);
        },
        complete: function() {
            if ($.unblockUI) {
                $.unblockUI();
            }
            $(".blockUI, .blockOverlay").remove();
        }
    });
}



</script>



<?php

include('chat_include.php');


echo <<<HTML
HTML;

echo <<<HTML
<div class="modal fade" id="modalPagosProspecto" tabindex="-1" role="dialog" aria-labelledby="modalPagosProspectoLabel">
    <div class="modal-dialog modal-lg" role="document" style="width:78%; max-width:1050px;">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Cerrar"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title" id="modalPagosProspectoLabel">Pagos e historial</h4>
            </div>
            <div class="modal-body" style="padding:0;">
                <iframe id="iframePagosProspecto" src="" style="width:100%; height:650px; border:0;"></iframe>
            </div>
        </div>
    </div>
</div>
HTML;

if (!$isAjaxPagos) {
    if (!$isAjaxPagos) {
    include('includes/footer.inc');
}
}

?>
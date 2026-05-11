<?php
$PageSecurity = 1;
//$PageSecurity = 4;
$PathPrefix = '../';
// $funcion = 2318;
$funcion = 1159;

define('WP_MEMORY_LIMIT', '128M');
define('WP_MAX_MEMORY_LIMIT', '256M');

//include($PathPrefix.'includes/session.inc');
session_start();
include($PathPrefix . 'config.php');
include $PathPrefix . "includes/SecurityUrl.php";
include($PathPrefix . 'includes/ConnectDB.inc');
include($PathPrefix . 'includes/SecurityFunctions.inc');
include($PathPrefix . 'includes/SQL_CommonFunctions.inc');
// Include para el periodo
include($PathPrefix . 'includes/DateFunctions.inc');

include($PathPrefix . 'includes/DefineSalesOrderItemsFast.inc');

$option = $_POST['option'];
$ErrMsg = _('No transactions were returned by the SQL because');
$contenido = array();
$result = false;
$SQL = '';
$msjError = '';


$typeid = $_SESSION['ProspectTypeId'];
$sqlTipoProsp = "SELECT typeid FROM debtortype WHERE flagshowinprospect=1";
$rsTipoProsp = DB_query($sqlTipoProsp, $db);
$fetTipoProsp = DB_fetch_array($rsTipoProsp);
$typeid = $fetTipoProsp['typeid'];
$holdreason = $_SESSION['ProspectHoldReason'];
$paymentterms = $_SESSION['ProspectPaymentTerms'];
$salestype = $_SESSION['ProspectSalesType'];

$directorioFiles = '/data2/html/erpdistribucion/images/prospectos';

if (isset($_GET['aPaterno'])) {
    $aPaterno = $_GET['aPaterno'];
} else if (isset($_POST['aPaterno'])) {
    $aPaterno = $_POST['aPaterno'];
} else {
    $aPaterno = '';
}

if (isset($_GET['aMaterno'])) {
    $aMaterno = $_GET['aMaterno'];
} else if (isset($_POST['aMaterno'])) {
    $aMaterno = $_POST['aMaterno'];
} else {
    $aMaterno = '';
}

if (isset($_GET['nombre'])) {
    $nombre = $_GET['nombre'];
} else if (isset($_POST['nombre'])) {
    $nombre = $_POST['nombre'];
} else {
    $nombre = '';
}

if (isset($_GET['nombreComercial'])) {
    $nombreComercial = $_GET['nombreComercial'];
} else if (isset($_POST['nombreComercial'])) {
    $nombreComercial = $_POST['nombreComercial'];
} else {
    $nombreComercial = '';
}

if (isset($_GET['rfc'])) {
    $rfc = $_GET['rfc'];
} else if (isset($_POST['rfc'])) {
    $rfc = $_POST['rfc'];
} else {
    $rfc = '';
}

if (isset($_GET['curp'])) {
    $curp = $_GET['curp'];
} else if (isset($_POST['curp'])) {
    $curp = $_POST['curp'];
} else {
    $curp = '';
}

if (isset($_GET['email'])) {
    $email = $_GET['email'];
} else if (isset($_POST['email'])) {
    $email = $_POST['email'];
} else {
    $email = '';
}

if (isset($_GET['emailC'])) {
    $emailC = $_GET['emailC'];
} else if (isset($_POST['emailC'])) {
    $emailC = $_POST['emailC'];
} else {
    $emailC = '';
}

if (isset($_GET['telefonoFijo'])) {
    $telefonoFijo = $_GET['telefonoFijo'];
} else if (isset($_POST['telefonoFijo'])) {
    $telefonoFijo = $_POST['telefonoFijo'];
} else {
    $telefonoFijo = '';
}

if (isset($_GET['telefonoMovil'])) {
    $telefonoMovil = $_GET['telefonoMovil'];
} else if (isset($_POST['telefonoMovil'])) {
    $telefonoMovil = $_POST['telefonoMovil'];
} else {
    $telefonoMovil = '';
}

if (isset($_GET['nextel'])) {
    $nextel = $_GET['nextel'];
} else if (isset($_POST['nextel'])) {
    $nextel = $_POST['nextel'];
} else {
    $nextel = '';
}

if (isset($_GET['direccion'])) {
    $direccion = $_GET['direccion'];
} else if (isset($_POST['direccion'])) {
    $direccion = $_POST['direccion'];
} else {
    $direccion = '';
}

if (isset($_GET['colonia'])) {
    $colonia = $_GET['colonia'];
} else if (isset($_POST['colonia'])) {
    $colonia = $_POST['colonia'];
} else {
    $colonia = '';
}

if (isset($_GET['numExt'])) {
    $numExt = $_GET['numExt'];
} else if (isset($_POST['numExt'])) {
    $numExt = $_POST['numExt'];
} else {
    $numExt = '';
}

if (isset($_GET['numInt'])) {
    $numInt = $_GET['numInt'];
} else if (isset($_POST['numInt'])) {
    $numInt = $_POST['numInt'];
} else {
    $numInt = '';
}

if (isset($_GET['custpais'])) {
    $custpais = $_GET['custpais'];
} else if (isset($_POST['custpais'])) {
    $custpais = $_POST['custpais'];
} else {
    $custpais = '';
}

if (isset($_GET['ciudad'])) {
    $ciudad = $_GET['ciudad'];
} else if (isset($_POST['ciudad'])) {
    $ciudad = $_POST['ciudad'];
} else {
    $ciudad = '';
}

if (isset($_GET['estado'])) {
    $estado = $_GET['estado'];
} else if (isset($_POST['estado'])) {
    $estado = $_POST['estado'];
} else {
    $estado = '';
}

if (isset($_GET['cp'])) {
    $cp = $_GET['cp'];
} else if (isset($_POST['cp'])) {
    $cp = $_POST['cp'];
} else {
    $cp = '';
}

if (isset($_GET['extra1'])) {
    $extra1 = $_GET['extra1'];
} else if (isset($_POST['extra1'])) {
    $extra1 = $_POST['extra1'];
} else {
    $extra1 = '';
}

if (isset($_GET['extra2'])) {
    $extra2 = $_GET['extra2'];
} else if (isset($_POST['extra2'])) {
    $extra2 = $_POST['extra2'];
} else {
    $extra2 = '';
}

if (isset($_GET['extra3'])) {
    $extra3 = $_GET['extra3'];
} else if (isset($_POST['extra3'])) {
    $extra3 = $_POST['extra3'];
} else {
    $extra3 = '';
}

if (isset($_GET['cmbVendedor'])) {
    $vendedor = $_GET['cmbVendedor'];
} else if (isset($_POST['cmbVendedor'])) {
    $vendedor = $_POST['cmbVendedor'];
} else {
    $vendedor = '';
}

if (isset($_GET['area'])) {
    $area = $_GET['area'];
} else if (isset($_POST['area'])) {
    $area = $_POST['area'];
} else {
    $area = '';
}

$impuesto = '1';

if (isset($_GET['almacen'])) {
    $almacen = $_GET['almacen'];
} else if (isset($_POST['almacen'])) {
    $almacen = $_POST['almacen'];
} else {
    $almacen = '';
}

if (isset($_GET['moneda'])) {
    $moneda = $_GET['moneda'];
} else if (isset($_POST['moneda'])) {
    $moneda = $_POST['moneda'];
} else {
    $moneda = '';
}
if (isset($_GET['frompage'])) {
    $frompage = $_GET['frompage'];
} elseif (isset($_POST['frompage'])) {
    $frompage = $_POST['frompage'];
}

if (empty($_POST["txtDesde"])) {
    $_POST["txtDesde"] = date('Y-m-d');
}

$giro = "";
if (isset($_POST['giro'])) {
    $giro = $_POST['giro'];
}

$SectComClId = "";
if (isset($_POST['SectComClId'])) {
    $SectComClId = $_POST['SectComClId'];
}

$hoy = date('Y-m-d');

function human_filesize($bytes, $decimals = 2)
{
    $sz = 'BKMGTP';
    $factor = floor((strlen($bytes) - 1) / 3);
    return sprintf("%.{$decimals}f", $bytes / pow(1024, $factor)) . @$sz[$factor];
}


if ($option == 'obtenerImagenesOportunidad') {
    $imagenes = array();
    $idOportunidad = isset($_POST['idOportunidad']) ? $_POST['idOportunidad'] : '';

    if ($idOportunidad != '') {
        $SQL = "SELECT `documents`.`iddoc`, `documents`.`name`, `documents`.`typedoc`, `documents`.`user_register`, 
                `documents`.`public`, date_format(`documents`.`register_date`,'%d-%m-%Y') as register_date, 
                SUBSTRING_INDEX(documents.tipo, '/', -1) AS tipo, IFNULL(documents.archivoblob, '') AS archivoblob,
                IFNULL(`documents`.`categoria`, 'imagen') AS categoria
                FROM `documents`
                WHERE `documents`.`typedoc` = '" . $idOportunidad . "';";

        $TransResult = DB_query($SQL, $db, $ErrMsg);

        while ($myrow = DB_fetch_array($TransResult)) {
            $rutaArchivo = $directorioFiles . "/" . $myrow['name'];
            $tamanoImagen = file_exists($rutaArchivo) ? human_filesize(filesize($rutaArchivo), 1) : '';

            $imagenes[] =
                array(
                    'iddoc' => $myrow['iddoc'],
                    'name' => $myrow['name'],
                    'user_register' => $myrow['user_register'],
                    'register_date' => $myrow['register_date'],
                    'tipo' => $myrow['tipo'],
                    'archivoblob' => $myrow['archivoblob'],
                    'tamanoimagen' => $tamanoImagen,
                    'categoria' => $myrow['categoria']
                );
        }
    }

    $contenido = $imagenes;
    $result = true;
}

if ($option == 'EliminarImagen') {
    try {
        DB_Txn_Begin($db);

        $consulta = "SELECT documents.iddoc, documents.name, documents.archivoblob
                    FROM documents
                    WHERE documents.iddoc = '" . $_POST['idarchivo'] . "';";

        $resultado = DB_query($consulta, $db);

        if ($renglon = DB_fetch_array($resultado)) {
            unlink($directorioFiles . "/" . $renglon["name"]);
        }

        $instruccion = "DELETE FROM documents WHERE iddoc = '" . $_POST['idarchivo'] . "';";
        DB_query($instruccion, $db);

        DB_Txn_Commit($db);

        $result = true;
    } catch (Exception $e) {
        $msjError = $e->getMessage();
        DB_Txn_Rollback($db);
        $result = false;
    }
}

if ($option == 'obtenerCheckTiempoVida') {
    $SQL = "SELECT id, descripcion, pesimo, malo, regular, bueno, excelente
            FROM tiempo_vida_concepto;";
    $TransResult = DB_query($SQL, $db, $ErrMsg);

    while ($myrow = DB_fetch_array($TransResult)) {
        $imagenes[] =
            array(
                'id' => $myrow['id'],
                'descripcion' => $myrow['descripcion'],
                'pesimo' => $myrow['pesimo'],
                'malo' => $myrow['malo'],
                'regular' => $myrow['regular'],
                'bueno' => $myrow['bueno'],
                'excelente' => $myrow['excelente']
            );
    }

    $contenido = $imagenes;
    $result = true;
}

if ($option == 'insertarEtapaA') {
    DB_Txn_Begin($db);

    try {
        $debtorno = $_POST["lblProspectoId_Existente"];

        // validar si es un prospecto existente
        if (empty($debtorno)) {
            $debtorno = GetNextTransNo(500, $db);

            $nombre = addslashes($nombre);
            $direccion = addslashes($direccion);
            $colonia = addslashes($colonia);

            $sql = "
                INSERT INTO debtorsmaster (
                    debtorno,
                    name,
                    name1,
                    name2,
                    name3,
                    nameextra,
                    address1,
                    address2,
                    address3,
                    address4,
                    address5,
                    address6,
                    currcode,
                    holdreason,
                    paymentterms,
                    discount,
                    discountcode,
                    pymtdiscount,
                    creditlimit,
                    salestype,
                    invaddrbranch,
                    taxref,
                    customerpoline,
                    typeid,
                    fechanacimiento,
                    curp,
                    prospectsince,
                    userprospect,
                    clientsince
                ) VALUES (
                    '$debtorno',
                    '$aPaterno $aMaterno $nombre',
                    '$aPaterno',
                    '$aMaterno',
                    '$nombre',
                    '$nombreComercial',
                    '$direccion',
                    '$colonia',
                    '$ciudad',
                    '$estado',
                    '$cp',
                    '$extra1',
                    '$moneda',
                    '$holdreason',
                    '$paymentterms',
                    '0',
                    '0',
                    '0',
                    '0',
                    '$salestype',
                    '0',
                    '$rfc',
                    '0',
                    
                    '$typeid',
                    '$fechanacimiento',
                    '$curp',
                    '" . $hoy . "',
                    '" . $_SESSION["UserID"] . "',
                    Now()
                )
            ";
            //var_dump($sql);
            $result = DB_query($sql, $db);

            $sql = "
                INSERT INTO custbranch (
                    branchcode,
                    debtorno,
                    brname,
                    braddress1,
                    braddress2,
                    braddress3,
                    braddress4,
                    braddress5,
                    braddress6,
                    braddress7,
                    brnumint,
                    brnumext,
                    lat,
                    lng,
                    specialinstructions,
                    estdeliverydays,
                    fwddate,
                    salesman,
                    phoneno,
                    movilno,
                    nextelno,
                    faxno,
                    contactname,
                    area,
                    email,
                    taxgroupid,
                    defaultlocation,
                    brpostaddr1,
                    brpostaddr2,
                    disabletrans,
                    defaultshipvia,
                    custbranchcode,
                    deliverblind,
                    taxid,
                    paymentname,
                    nocuenta,
                    custpais,
                    lineofbusiness,
                    SectComClId
                ) VALUES (
                    '$debtorno',
                    '$debtorno',
                    '$aPaterno $aMaterno $nombre',
                    '$direccion',
                    '$ciudad',
                    '$estado',
                    '$cp',
                    '$extra1',
                    '$colonia',
                    '$custpais',
                    '$numInt',
                    '$numExt',
                    '0',
                    '0',
                    '',
                    '0',
                    '0',
                    '$vendedor',
                    '$telefonoFijo',
                    '$telefonoMovil',
                    '$nextel',
                    '',
                    '',
                    '$area',
                    '$email',
                    '$impuesto',
                    '$almacen',
                    '$extra2',
                    '$extra3',
                    '0',
                    '0',
                    '1',
                    '1',
                    '$rfc',
                    'No Identificado',
                    'No Identificado',
                    '$custpais',
                    '" . $giro . "',
                    '" . $SectComClId . "'			
                )	
            ";
            //var_dump($sql);
            $result = DB_query($sql, $db);

            $fechaalta = date('Y-m-d');
            $conName = $aPaterno . ' ' . $aMaterno . ' ' . $nombre;
            if ($_POST['conName'] != "")
                $conName = $_POST['conName'];
            if (strlen($emailC) == 0) {
                $emailC = $email;
            }

            $sql = "
                INSERT INTO custcontacts (
                    debtorno,
                    contactname,
                    phoneno,
                    notes,
                    SinceCustcontactd,
                    emailcontact,  
                    CustLeadSourceId,
                    contactsmensid,
                    role,
                    phoneno2,
                    estadocivil,
                    idCapComIngresos,
                    companyprospect,
                    usercontact
                ) VALUES (
                    '$debtorno',
                    '$conName',
                    '',
                    'Prospecto',
                    '" . $fechaalta . "',
                    '',
                    '" . $_POST['CustLeadSourceId'] . "',
                    '',		
                    '',
                    '',					
                    '',
                    '',
                    '',
                    '" . $_SESSION["UserID"] . "'
                )
            ";
            //var_dump($sql);
            $result = DB_query($sql, $db);
            $contactoID = DB_Last_Insert_ID($db, 'custcontacts', 'contid');


            if($_POST['cmbVendedorMulti'] != 1){


                if (isset($_POST['cmbVendedorMulti']) && is_array($_POST['cmbVendedorMulti'])) {
                    $items = $_POST['cmbVendedorMulti'];
                    $procentaje = 3/(count($items)+1);

                    foreach ($items as $item) {
                        $sql = "
                        INSERT INTO coagente VALUES (
                            '',
                            '$item',
                            '$debtorno',
                            '$procentaje',
                            '" . $_SESSION["UserID"] . "',
                            '" . $fechaalta . "'
                        )
                    ";
                    $resultCo = DB_query($sql, $db);
                    }
                } else {
                    echo 'No items selected.';
                }

                $sql = "
                    INSERT INTO coagente VALUES (
                        '',
                        '" . $_POST['cmbVendedor'] . "',
                        '$debtorno',
                        '$procentaje',
                        '" . $_SESSION["UserID"] . "',
                        '" . $fechaalta . "'
                    )
                ";
                $resultCo = DB_query($sql, $db);
            }

        } else {
            $consulta = "SELECT contid FROM custcontacts WHERE debtorno='" . $debtorno . "'";
            $resultado = DB_query($consulta, $db);

            if ($registro = DB_fetch_array($resultado)) {
                $contactoID = $registro["contid"];
            }
        }

        $comentarioSlash = $_POST['txtComentarios'];
        $comentarioTXT = addslashes($comentarioSlash);

        $mapaCoordenadas = $_POST['txtLinkMapa_pros'];
        $mapaCoordenadasSinEspacios = str_replace(" ", "", $mapaCoordenadas);

        $insertOportunidad = "INSERT INTO prospect_movimientos
            (u_proyecto, dia, mes, anio, concepto, descripcion, cargo, confirmado, prioridad, 
            u_user, UserId, Estimado, fecha, activo, idstatus, currcode, fecha_compromiso, 
            fecha_alta, debtorno, branchcode, areacod, clientcontactid, link_google_map,
            hora_visita, encargado_proyecto, telefono_encargado, correo_encargado, km_planta,
            area_total, perfil_producto, tiempo_dedicado, cometarios, salesman, referencia
        ) VALUES (
            1,DATE_FORMAT(NOW(), '%d'), DATE_FORMAT(NOW(), '%m'), DATE_FORMAT(NOW(), '%Y'),'Nuevo Prospecto', '','0',0,1,
            '" . $_SESSION["UserID"] . "','" . $_SESSION["UserID"] . "', 0, curdate(),1,0,'MXN',curdate(),
            curdate(),'$debtorno','$debtorno',1,'$contactoID','$mapaCoordenadasSinEspacios',
            '','','','','',
            '0','','','$comentarioTXT','" . $_POST['cmbVendedor'] . "', '" . $_POST['aPaterno_alterno'] . "'
        )";

        $rsOportunidad = DB_query($insertOportunidad, $db);
        $u_movimientoID = DB_Last_Insert_ID($db, 'prospect_movimientos', 'u_movimiento');

        DB_Txn_Commit($db);
        $result = $u_movimientoID;
        $id = $debtorno;
    } catch (Exception $e) {
        $msjError = $e->getMessage();
        DB_Txn_Rollback($db);
        $result = false;
    }
}

if ($option == 'actualizarEstatus') {
    DB_Txn_Begin($db);
    try {
        $sql = "UPDATE prospect_movimientos 
                SET idstatus = '" . $_POST["idEstatus"] . "' 
                WHERE u_movimiento = '" . $_POST["idOportunidad"] . "'";
        $contenido = DB_query($sql, $db);
        $result =  true;

        DB_Txn_Commit($db);
    } catch (Exception $e) {
        $msjError = $e->getMessage();
        DB_Txn_Rollback($db);
        $result = false;
    }
}

if ($option == 'iconoMapaEstatus') {
    DB_Txn_Begin($db);
    try {
        $sql = "SELECT prospect_movimientos.link_google_map, debtorsmaster.name, prospect_movimientos.u_movimiento, prospect_status.logo, debtorsmaster.address1, www_users.realname 
                FROM prospect_movimientos
                INNER JOIN debtorsmaster ON debtorsmaster.debtorno = prospect_movimientos.debtorno
                LEFT JOIN prospect_status ON prospect_status.idstatus = prospect_movimientos.idstatus
                LEFT JOIN www_users ON www_users.userid = prospect_movimientos.u_user
                WHERE u_movimiento = '" . $_POST["idOportunidad"] . "'";
        $contenido = DB_query($sql, $db);
        $rowsDatos = array();
        while ($rowIconoDato = mysqli_fetch_object($contenido)) {
            $rowsDatos[] = [
                'link_google_map' => $rowIconoDato->link_google_map,
                'name' => $rowIconoDato->name,
                'debtorno' => $rowIconoDato->u_movimiento,
                'logo' => $rowIconoDato->logo,
                'direccion' => $rowIconoDato->address1,
                'vendedor' => $rowIconoDato->realname
            ];
        }

        $result =  $rowsDatos;
        DB_Txn_Commit($db);
    } catch (Exception $e) {
        $msjError = $e->getMessage();
        DB_Txn_Rollback($db);
        $result = false;
    }
}

if ($option == 'actividadMapa') {
    try {
        $sql = "SELECT tm.titulo, pm.link_google_map, tm.fecha_compromiso, d.name
                FROM tasks_movimientos tm
                LEFT JOIN prospect_movimientos pm on pm.u_movimiento = tm.u_prospecto
                LEFT JOIN debtorsmaster d ON pm.debtorno = d.debtorno 
                WHERE pm.salesman = '" . $_POST["vendedor"] . "' AND tm.TipoMovimientoId = '3' AND tm.fecha_compromiso = '" . $_POST["fechaActividad"] . "'
                ORDER BY tm.hora";
        $contenido = DB_query($sql, $db);
        $rowsDatos = array();
        while ($rowIconoDato = mysqli_fetch_object($contenido)) {
            $rowsDatos[] = [
                'titulo' => $rowIconoDato->titulo,
                'coordenadas' => $rowIconoDato->link_google_map,
                'fecha_compromiso' => $rowIconoDato->fecha_compromiso,
                "name" => $rowIconoDato->name
            ];
        }
        $result =  $rowsDatos;
    } catch (Exception $e) {
        $msjError = $e->getMessage();
        $result = false;
    }
}

if ($option == 'modificarEtapaA') {
    DB_Txn_Begin($db);

    try {

        $SQL = "UPDATE debtorsmaster
                SET 
                name='$aPaterno $aMaterno $nombre',
                name1='$aPaterno',
                name2='$aMaterno',
                name3='$nombre',
                nameextra='$nombreComercial',
                address1='$direccion',
                address2='$colonia',
                address3='$ciudad',
                address4='$estado',
                address5='$cp',
                address6='$extra1',
                currcode='$moneda',
                holdreason='$holdreason',
                paymentterms='$paymentterms',
                discount='0',
                discountcode='0',
                pymtdiscount='0',
                creditlimit='0',
                salestype='$salestype',
                invaddrbranch='0',
                taxref='$rfc',
                customerpoline='0',
                typeid='$typeid',
                fechanacimiento='$fechanacimiento',
                curp='$curp',
                userprospect='" . $_SESSION["UserID"] . "'
                WHERE debtorno ='" . $_POST["idProspecto"] . "'";

        $rsDebtormaster = DB_query($SQL, $db);

        $SQL = "UPDATE custbranch
                SET
                brname='$aPaterno $aMaterno $nombre',
                braddress1='$direccion',
                braddress2='$ciudad',
                braddress3='$estado',
                braddress4='$cp',
                braddress5='$extra1',
                braddress6='$colonia',
                braddress7='$custpais',
                brnumint='$numInt',
                brnumext='$numExt',
                lat='0',
                lng='0',
                specialinstructions='',
                estdeliverydays='0',
                fwddate='0',
                salesman='$vendedor',
                phoneno='$telefonoFijo',
                movilno='$telefonoMovil',
                nextelno='$nextel',
                faxno='',
                contactname='',
                area='$area',
                email='$email',
                taxgroupid='$impuesto',
                defaultlocation='$almacen',
                brpostaddr1='$extra2',
                brpostaddr2='$extra3',
                disabletrans='0',
                defaultshipvia='0',
                custbranchcode='1',
                deliverblind='1',
                taxid='$rfc',
                paymentname='No Identificado',
                nocuenta='No Identificado',
                custpais='$custpais',
                lineofbusiness='" . $giro . "',
                SectComClId='" . $SectComClId . "'
                WHERE debtorno ='" . $_POST["idProspecto"] . "'";

        $rsCutsbranch = DB_query($SQL, $db);

        $SQL = "SELECT clientcontactid FROM prospect_movimientos WHERE u_movimiento='" . $_POST['idOportunidad'] . "' LIMIT 1;";
        $rs = DB_query($SQL, $db);
        $row = DB_fetch_array($rs);

        if (empty($row["clientcontactid"])) {
            $fechaalta = date('Y-m-d');
            $SQL = "
            INSERT INTO custcontacts (
                debtorno,
                contactname,
                phoneno,
                notes,
                SinceCustcontactd,
                emailcontact,  
                CustLeadSourceId,
                contactsmensid,
                role,
                phoneno2,
                estadocivil,
                idCapComIngresos,
                companyprospect,
                usercontact
            ) VALUES (
                '" . $_POST["idProspecto"] . "',
                '" . $_POST["aPaterno"] . "',
                
                '',
                'Prospecto',
                '" . $fechaalta . "',
                '',
                '" . $_POST['CustLeadSourceId'] . "',
                '',		
                '',
                '',					
                '',
                '',
                '',
                '" . $_SESSION["UserID"] . "'
            )";
            $rs = DB_query($SQL, $db);
            $contactoID = DB_Last_Insert_ID($db, 'custcontacts', 'contid');


        } else {
            $SQL = "UPDATE custcontacts SET CustLeadSourceId='" . $_POST['CustLeadSourceId'] . "' WHERE contid='" . $row["clientcontactid"] . "'";
            $rs = DB_query($SQL, $db);
            $contactoID = $row["clientcontactid"];
        }

        $mapaCoordenadasUpdate = $_POST['txtLinkMapa_pros'];
        $mapaCoordenadasSinUpdate = str_replace(" ", "", $mapaCoordenadasUpdate);

        $updateOportunidad = "UPDATE prospect_movimientos 
                            SET debtorno='" . $_POST["idProspecto"] . "', branchcode='" . $_POST["idProspecto"] . "', cometarios='" . $_POST['txtComentarios'] . "', clientcontactid=$contactoID, 
                            link_google_map='$mapaCoordenadasSinUpdate', salesman='" . $_POST['cmbVendedor'] . "',
                            referencia='" . $_POST['aPaterno_alterno'] . "' 
                            WHERE u_movimiento='" . $_POST['idOportunidad'] . "'";

        $rsOportunidad = DB_query($updateOportunidad, $db);

        $result = true;

        DB_Txn_Commit($db);

    } catch (Exception $e) {
        $msjError = $e->getMessage();
        DB_Txn_Rollback($db);
        $result = false;
    }
}

if ($option == 'AutorizarEtapaB') {
    DB_Txn_Begin($db);
    try {
        $arrFechaVisita = explode("-", $_POST['txtFechaVisita']);

        $sql = "UPDATE prospect_movimientos 
                SET dia = '" . $arrFechaVisita[2] . "', 
                    mes = '" . $arrFechaVisita[1] . "',  
                    anio  = '" . $arrFechaVisita[0] . "', 
                    fecha_compromiso='" . $_POST['txtFechaVisita'] . "',
                    concepto ='" . $_POST['txtTituloCita'] . "',
                    descripcion ='" . $_POST['txtConceptoCita'] . "',
                    salesman ='" . $_POST['cmbVendedorVisita'] . "',
                    idstatus= IF(idstatus >1, idstatus, 1)
                WHERE u_movimiento = '" . $_POST['u_movimiento'] . "'";

        //echo $sql;

        $contenido = DB_query($sql, $db);
        $result = true;

        DB_Txn_Commit($db);
    } catch (Exception $e) {
        $msjError = $e->getMessage();
        DB_Txn_Rollback($db);
        $result = false;
    }
}

if ($option == 'AutorizarCotizacion') {
    DB_Txn_Begin($db);
    try {
        $sql = "UPDATE prospect_movimientos 
                SET  idstatus = IF(idstatus >4, idstatus, 4), idpropiedad=null
                WHERE u_movimiento = '" . $_POST['u_movimiento'] . "'";

        $contenido = DB_query($sql, $db);

        $sql = "UPDATE notificaciones_erp 
                SET estatus = 1
                WHERE transno = '" . $_POST['u_movimiento'] . "' 
                AND html='cotizacion=autorizar'";

        $contenido = DB_query($sql, $db);

        $result = true;

        DB_Txn_Commit($db);
    } catch (Exception $e) {
        $msjError = $e->getMessage();
        DB_Txn_Rollback($db);
        $result = false;
    }
}

if ($option == 'SolicitarAutorizarCotizacion') {
    DB_Txn_Begin($db);
    try {
        $sql = "UPDATE prospect_movimientos 
                SET  idpropiedad = 1
                WHERE u_movimiento = '" . $_POST['u_movimiento'] . "'";
        $contenido = DB_query($sql, $db);
        $result = true;

        DB_Txn_Commit($db);
    } catch (Exception $e) {
        $msjError = $e->getMessage();
        DB_Txn_Rollback($db);
        $result = false;
    }
}

if ($option == 'ObtenerOportunidad') {
    try {

        $sql = "SELECT prospect_movimientos.debtorno,
                prospect_movimientos.idstatus,
                prospect_movimientos.descripcion,
                prospect_movimientos.cargo,
                prospect_movimientos.encargado_proyecto ,
                prospect_movimientos.telefono_encargado ,
                prospect_movimientos.correo_encargado ,
                prospect_movimientos.km_planta ,
                prospect_movimientos.area_total ,
                prospect_movimientos.perfil_producto ,
                prospect_movimientos.tiempo_dedicado ,
                prospect_movimientos.cometarios ,
                prospect_movimientos.link_google_map,
                prospect_movimientos.salesman,
                COALESCE(prospect_movimientos.idpropiedad,0) AS idpropiedad,
                debtorsmaster.name as prospecto,
                debtorsmaster.address1 as direccion,
                debtorsmaster.address2 as colonia,
                debtorsmaster.address3 as ciudad,
                debtorsmaster.address4 as estado,
                debtorsmaster.address5 as cp,
                custbranch.email,
                custbranch.SectComClId,
                custbranch.phoneno as telefono_fijo,
                prospect_movimientos.referencia,
                debtorsmaster.companyprospect,
                COALESCE(wu_session.permisoCambioFechaCierre, 0) AS permisoCambioFechaCierre
                FROM prospect_movimientos 
                INNER JOIN debtorsmaster ON debtorsmaster.debtorno = prospect_movimientos.debtorno 
                INNER JOIN custbranch ON custbranch.debtorno = debtorsmaster.debtorno AND prospect_movimientos.branchcode=custbranch.branchcode AND prospect_movimientos.debtorno=custbranch.debtorno
                LEFT JOIN www_users wu_session ON wu_session.userid = '" . DB_escape_string($_SESSION['UserID'], $db) . "'
                WHERE prospect_movimientos.u_movimiento = '" . $_POST['u_movimiento'] . "'";

        $rs = DB_query($sql, $db);
        $rows = array();

        $id_contacto = "";
        $nombre_contacto = "";
        $medio_contacto = "";
        $fuente_contacto = "";
        $puesto_contacto = "";
        $telefono_contacto = "";
        $movil_contacto = "";
        $email_contacto = "";

        $sqlProductos = "SELECT po.*, stockmaster.description, stockmaster.units 
                        FROM `productos_oportunidad` po
                        LEFT JOIN stockmaster ON po.stockid = stockmaster.stockid 
                        WHERE `u_movimiento` = '" . $_POST['u_movimiento'] . "' AND etapa='B'";

        $rsProductos = DB_query($sqlProductos, $db);
        $rowsProductos = array();

        while ($rowProducto = mysqli_fetch_object($rsProductos)) {
            $rowsProductos[] = [
                'id' => $rowProducto->id,
                'u_movimiento' => $rowProducto->u_movimiento,
                'stockid' => $rowProducto->stockid,
                'precio' => $rowProducto->precio,
                'cantidad' => $rowProducto->cantidad,
                'description' => $rowProducto->description,
                'units' => $rowProducto->units
            ];
        }

        $sqlProductosC = "SELECT po.*, stockmaster.description, taxauthrates.taxrate,
                                COALESCE(sod.narrative, '') as narrative
                        FROM `productos_oportunidad` po
                        LEFT JOIN stockmaster ON po.stockid = stockmaster.stockid 
                        INNER JOIN taxauthrates ON stockmaster.taxcatid = taxauthrates.taxcatid
                        LEFT JOIN salesorders so ON so.idprospect = po.u_movimiento
                        LEFT JOIN salesorderdetails sod ON sod.orderno = so.orderno AND sod.stkcode = po.stockid
                        WHERE `u_movimiento` = '" . $_POST['u_movimiento'] . "' AND etapa='C'";

        $rsProductosC = DB_query($sqlProductosC, $db);
        $rowsProductosC = array();

        while ($rowProductoC = mysqli_fetch_object($rsProductosC)) {
            $rowsProductosC[] = [
                'id' => $rowProductoC->id,
                'u_movimiento' => $rowProductoC->u_movimiento,
                'stockid' => $rowProductoC->stockid,
                'precio' => $rowProductoC->precio,
                'cantidad' => $rowProductoC->cantidad,
                'description' => $rowProductoC->description,
                'narrative' => $rowProductoC->narrative,
                'taxrate' => $rowProductoC->taxrate
            ];
        }

        $sqlCotizacion = "SELECT orderno,tagref FROM salesorders WHERE idprospect ='" . $_POST['u_movimiento'] . "'";
        $rsCotizacion = DB_query($sqlCotizacion, $db);
        $rowsCotizaciones = array();

        while ($rowCotizacion = mysqli_fetch_object($rsCotizacion)) {
            $rowsCotizaciones[] = [
                'orderno' => $rowCotizacion->orderno,
                'tagref' => $rowCotizacion->tagref
            ];
        }

        $sqlPDFTemplates = "SELECT `idtexto`, `Titulo`, `Texto`, `Ubicacion`, `Orden`, `tipodocto`, `consulta` FROM PDFTemplates WHERE Titulo ='CotizacionProspecto' and Ubicacion='Body' and visible=1 Order by Orden;";
        $rsPDFTemplates = DB_query($sqlPDFTemplates, $db);
        $rowsPDFTemplates = array();
        setlocale(LC_TIME, 'es_MX.UTF-8', 'es_MX', 'es');
        $fechaVigencia = strftime('%d de %B de %Y', strtotime('+30 days'));

        while ($rowPDFTemplate = mysqli_fetch_object($rsPDFTemplates)) {
            $textoPDF = $rowPDFTemplate->consulta;
            $textoPDF = preg_replace(
                '/vigencia hasta el \d{1,2} de \w+ de \d{4}/i',
                'vigencia hasta el ' . $fechaVigencia,
                $textoPDF
            );
            $rowsPDFTemplates[] = [
                'idtexto' => $rowPDFTemplate->idtexto,
                'Titulo' => $rowPDFTemplate->Titulo,
                'Texto' => $rowPDFTemplate->Texto,
                'Ubicacion' => $rowPDFTemplate->Ubicacion,
                'Orden' => $rowPDFTemplate->Orden,
                'tipodocto' => $rowPDFTemplate->tipodocto,
                'consulta' => $textoPDF
            ];
        }

        $sqlTiempoVida = "SELECT idConcepto, idSuperficie, puntos FROM oportunidad_ciclo_vida WHERE idOportunidad='" . $_POST['u_movimiento'] . "'";
        $rsTiempoVida = DB_query($sqlTiempoVida, $db);
        $rowsTiempoVidas = array();
        while ($rowTiempoVida = mysqli_fetch_object($rsTiempoVida)) {
            $rowsTiempoVidas[] = [
                'idConcepto' => $rowTiempoVida->idConcepto,
                'idSuperficie' => $rowTiempoVida->idSuperficie,
                'puntos' => $rowTiempoVida->puntos
            ];
        }

        $sqlImagenes = "SELECT `documents`.`iddoc`, `documents`.`name`, `documents`.`typedoc`, `documents`.`user_register`, `documents`.`public`, date_format(`documents`.`register_date`,'%d-%m-%Y') as register_date
        FROM `documents`
        WHERE `documents`.`typedoc` = '" . $_POST['u_movimiento'] . "';";
        $rsImagenes = DB_query($sqlImagenes, $db);
        $rowsImagenes = array();
        while ($rowImagen = mysqli_fetch_object($rsImagenes)) {
            $rowsImagenes[] = [
                'iddoc' => $rowImagen->iddoc,
                'name' => $rowImagen->name
            ];
        }

        while ($row = mysqli_fetch_object($rs)) {
            $sqlContacto = "SELECT * FROM custcontacts WHERE debtorno = '" . $row->debtorno . "' LIMIT 1";
            $rsContacto = DB_query($sqlContacto, $db);

            while ($rowContacto = mysqli_fetch_object($rsContacto)) {
                $medio_contacto = $rowContacto->contactsmensid;
                $fuente_contacto = $rowContacto->CustLeadSourceId;
                $id_contacto = $rowContacto->contid;
                $nombre_contacto = $rowContacto->contactname;
                $puesto_contacto = $rowContacto->role;
                $telefono_contacto = $rowContacto->phoneno;
                $movil_contacto = $rowContacto->phoneno2;
                $email_contacto = $rowContacto->emailcontact;
            }

            $rows[] = [
                'debtorno' => $row->debtorno,
                'idstatus' => $row->idstatus,
                'descripcion' => $row->descripcion,
                'cargo' => $row->cargo,
                'idpropiedad' => $row->idpropiedad,
                'encargado_proyecto' => $row->encargado_proyecto,
                'telefono_encargado' => $row->telefono_encargado,
                'correo_encargado' => $row->correo_encargado,
                'km_planta' => $row->km_planta,
                'area_total' => $row->area_total,
                'perfil_producto' => $row->perfil_producto,
                'tiempo_dedicado' => $row->tiempo_dedicado,
                'cometarios' => $row->cometarios,
                'link_google_map' => $row->link_google_map,
                'ciudad' => $row->ciudad,
                'estado' => $row->estado,
                'direccion' => $row->direccion,
                'colonia' => $row->colonia,
                'cp' => $row->cp,
                'prospecto' => $row->prospecto,
                'email' => $row->email,
                'SectComClId' => $row->SectComClId,
                'telefono_fijo' => $row->telefono_fijo,
                'salesman' => $row->salesman,
                'id_contacto' => $id_contacto,
                'medio_contacto' => $medio_contacto,
                'fuente_contacto' => $fuente_contacto,
                'nombre_contacto' => $nombre_contacto,
                'puesto_contacto' => $puesto_contacto,
                'telefono_contacto' => $telefono_contacto,
                'movil_contacto' => $movil_contacto,
                'email_contacto' => $email_contacto,
                'productos' => $rowsProductos,
                'productosC' => $rowsProductosC,
                'cotizaciones' => $rowsCotizaciones,
                'tiempovida' => $rowsTiempoVidas,
                'pdftemplates' => $rowsPDFTemplates,
                'imagenes' => $rowsImagenes,
                'referencia' => $row->referencia,
                'companyprospect' => $row->companyprospect,
                'permisoCambioFechaCierre' => (int)$row->permisoCambioFechaCierre
            ];
        }

        $contenido = $rows;
        $result = true;
    } catch (Exception $e) {
        $msjError = $e->getMessage();
        $result = false;
    }
}

if ($option == 'GuardarEtapaB') {
    DB_Txn_Begin($db);
    try {
        $u_movimiento = $_POST['u_movimientoID'];
        $idContacto = $_POST['idContacto'];
        $soloGuardar = $_POST['soloGuardar'];
        $filtroSoloGuardar = ", idstatus= IF(idstatus >2, idstatus, 2)";
        $instruccion = "";

        // BLOQUEO BACKEND: Verificar si el prospecto ya está en etapa C o superior.
        // Si es así, se permite guardar datos generales (encargado, comentarios, etc.)
        // pero NO se tocarán los productos de etapa B.
        $sqlCheckEstatus = "SELECT idstatus FROM prospect_movimientos WHERE u_movimiento = '$u_movimiento' LIMIT 1";
        $rsCheckEstatus = DB_query($sqlCheckEstatus, $db);
        $rowEstatus = DB_fetch_array($rsCheckEstatus);
        $idstatusActualDB = intval(isset($rowEstatus['idstatus']) ? $rowEstatus['idstatus'] : 0);

        if ($soloGuardar == "true") {
            $filtroSoloGuardar = "";
        }

        $d = new DateTime(date("Y-m-d"));

        $meses = 1;
        if ($_POST['txtMesesPuntosTV'] != "") {
            $meses = $_POST['txtMesesPuntosTV'];
        }

        $d->modify('+' . $meses . ' month');

        // obtener clasificacion de prospecto
        $clasificacion = 0;
        $consulta = "SELECT id, description FROM prospect_clasificacion WHERE '" . floatval($_POST['txtValorEstimado']) . "' BETWEEN minimo AND maximo";
        $resultado = DB_query($consulta, $db);

        if ($registro = DB_fetch_array($resultado)) {
            $clasificacion = $registro["id"];
        }

        $contenido = $consulta;

        $tipoComentarios = $_POST['txtComentarios'];
        $tipoComentariosAdd = addslashes($tipoComentarios);
        $tipoNecesidades = $_POST['txtNecesidadesCliente'];
        $tipoNecesidadesAdd = addslashes($tipoNecesidades);

        //Update Oportunidad - separar campos segun etapa
        if ($idstatusActualDB < 2) {
            // Etapa B o anterior: se pueden editar todos los campos de etapa B
            $sql = "UPDATE prospect_movimientos 
                    SET encargado_proyecto = '" . $_POST['txtNombreEncargado'] . "', 
                    telefono_encargado = '" . $_POST['txtTelefonoEncargado'] . "', 
                    correo_encargado = '" . $_POST['txtCorreoEncargado'] . "', 
                    km_planta = '" . $_POST['txtKmPlanta'] . "',
                    area_total = '" . $_POST['txtAreaTotal'] . "', 
                    tiempo_dedicado = '" . $_POST['txtTiempoDedicado'] . "', 
                    cometarios = '$tipoComentariosAdd',
                    descripcion = '$tipoNecesidadesAdd',
                    cargo = '" . $_POST['txtValorEstimado'] . "',
                    erp = '" . $clasificacion . "',
                    tiempo_vida='" . $_POST['txtPuntosTV'] . "',
                    des_tiempo_vida='" . $_POST['txtMesesPuntosTV'] . "',
                    fecha_compromiso='" . $d->format('Y-m-d') . "',
                    dia='" . $d->format('d') . "', mes='" . $d->format('m') . "', anio='" . $d->format('Y') . "'
                    $filtroSoloGuardar
                    WHERE u_movimiento = '$u_movimiento';";
        } else {
            // Etapa C o D: SOLO se permiten editar datos de contacto, comentarios y descripcion
            $sql = "UPDATE prospect_movimientos 
                    SET encargado_proyecto = '" . $_POST['txtNombreEncargado'] . "', 
                    telefono_encargado = '" . $_POST['txtTelefonoEncargado'] . "', 
                    correo_encargado = '" . $_POST['txtCorreoEncargado'] . "',
                    cometarios = '$tipoComentariosAdd',
                    descripcion = '$tipoNecesidadesAdd'
                    WHERE u_movimiento = '$u_movimiento';";
        }

        $rsOportunidad = DB_query($sql, $db);

        /* Inicio Update Contacto */
        $sqlUpdateContacto = "UPDATE custcontacts
                                SET contactsmensid = '" . $_POST['contactsmensid'] . "',
                                contactname = '" . $_POST['txtNombreEncargado'] . "',
                                phoneno = '" . $_POST['txtTelefonoEncargado'] . "',
                                emailcontact = '" . $_POST['txtCorreoEncargado'] . "'
                                WHERE contid = '" . $idContacto . "';";

        $rsContacto = DB_query($sqlUpdateContacto, $db);
        /** Fin Update Contecto */

        // Insert productos - BLOQUEO: solo si el prospecto está en etapa B (idstatus < 2)
        if ($_POST['productos'] != "" && $idstatusActualDB < 2) {
            $delete_productos = "DELETE FROM `productos_oportunidad` WHERE `u_movimiento` = '$u_movimiento' and etapa='B'";
            $rsDeleteProductos = DB_query($delete_productos, $db);

            $productos = json_decode($_POST['productos']);
            $insert_productos = "INSERT INTO `productos_oportunidad` (`u_movimiento`,`stockid`,`precio`,`cantidad`,`etapa`) VALUES ";
            foreach ($productos as $producto) {
                $insert_productos .= "('$u_movimiento','$producto->stockid','$producto->precio','$producto->cantidad','B'),";
            }
            $insert_productos = substr($insert_productos, 0, -1);
            $rsProductos = DB_query($insert_productos, $db);

            if ($rsProductos) {
                $delete_productos = "DELETE FROM `productos_oportunidad` WHERE `u_movimiento` = '$u_movimiento' and etapa='C'";
                $rsDeleteProductos = DB_query($delete_productos, $db);
                $insert_productos = "INSERT INTO `productos_oportunidad` (`u_movimiento`,`stockid`,`precio`,`cantidad`,`etapa`)
                SELECT `u_movimiento`,`stockid`,`precio`,`cantidad`,'C' FROM `productos_oportunidad` WHERE `u_movimiento` = '$u_movimiento' and etapa='B'";
                $rsProductos = DB_query($insert_productos, $db);
            }
        }
        /* Fin Insert productos */

        if ($_POST['tiempovida'] != "" && $idstatusActualDB < 2) {
            $delete_tiempovida = "DELETE FROM `oportunidad_ciclo_vida` WHERE `idOportunidad` = '$u_movimiento';";
            $rsDeleteProductos = DB_query($delete_tiempovida, $db);

            $tiempovida = json_decode($_POST['tiempovida']);
            $insert_tiempovida = "INSERT INTO `oportunidad_ciclo_vida` (`idOportunidad`,`idConcepto`,`idSuperficie`,`puntos`) VALUES ";
            foreach ($tiempovida as $tiempovida) {
                $insert_tiempovida .= "('$u_movimiento','$tiempovida->idconcepto','$tiempovida->idsuperficie','$tiempovida->puntos'),";
            }
            $insert_tiempovida = substr($insert_tiempovida, 0, -1);
            $rsTiempoVida = DB_query($insert_tiempovida, $db);
        }

        // si hay imagenes cargadas guardar en base de datos
        if (!empty($_POST["imagenesconvertidas"])) {
            $imagenes = json_decode($_POST["imagenesconvertidas"]);

            foreach ($imagenes as $key => $elemento) {
                //$contenido.= "cadena imagen: ".$elemento->cadena;
                fnConvertirBase64_fisico($elemento->cadena, $directorioFiles . "/" . $elemento->nombre);
                $instruccion .= "('$elemento->nombre','$u_movimiento','" . $_SESSION["UserID"] . "','" . $directorioFiles . "/" . $elemento->nombre . "', CURDATE(), '$elemento->tipo', ''),";
            }

            if (!empty($instruccion)) {
                $SQL = "INSERT INTO `documents`
                    (`name`, `typedoc`, `user_register`, `public`, `register_date`, `tipo`, `archivoblob`) 
                    VALUES " . substr($instruccion, 0, -1) . ";";

                $Result = DB_query($SQL, $db);
            }
        }

        /**Inicio Cargar Imagenes */
        if (isset($_FILES["fileEvidencias"]) and $u_movimiento != "") {
            fnCargarMultipleArchivo($_FILES['fileEvidencias'], $u_movimiento, $directorioFiles, $db);
        }
        /** Fin Cargar Imagenes */

        $result = true;

        DB_Txn_Commit($db);
    } catch (Exception $e) {
        $msjError = $e->getMessage();
        DB_Txn_Rollback($db);
        $result = false;
    }
}

function fnConvertirBase64_fisico($base64, $archivoimagen)
{
    // open the output file for writing
    $ifp = fopen($archivoimagen, 'wb');

    // split the string on commas
    // $data[ 0 ] == "data:image/png;base64"
    // $data[ 1 ] == <actual base64 string>
    $data = explode(',', $base64);

    // we could add validation here with ensuring count( $data ) > 1
    fwrite($ifp, base64_decode($data[1]));

    // clean up the file resource
    fclose($ifp);

    return $archivoimagen;
}

function fnCargarMultipleArchivo($typeArchivo, $idProspecto = 0, $directorio, $db, $permitirImagenes = false, $categoria = 'imagen')
{
    // Whitelist de categorias permitidas (evita inyeccion por $_POST manipulado)
    $categoriasPermitidas = array('documento', 'pago', 'imagen');
    if (!in_array($categoria, $categoriasPermitidas)) {
        $categoria = 'imagen';
    }

    $arrExtensionesDescartar = ["jpg", "jpeg", "png", "bmp"];

    //Como el elemento es un arreglos utilizamos foreach para extraer todos los valores
    foreach ($typeArchivo['tmp_name'] as $key => $tmp_name) {
        //Validamos que el archivo exista
        if ($typeArchivo["name"][$key]) {
            $filename = $typeArchivo["name"][$key]; //Obtenemos el nombre original del archivo
            $source = $typeArchivo["tmp_name"][$key]; //Obtenemos un nombre temporal del archivo
            $file_type = strtolower(pathinfo($filename, PATHINFO_EXTENSION)); //Obtenemos un tipo temporal del archivo

            if ($permitirImagenes || !in_array($file_type, $arrExtensionesDescartar)) {
                //Validamos si la ruta de destino existe, en caso de no existir la creamos
                if (!file_exists($directorio)) {
                    mkdir($directorio, 0777) or die("No se puede crear el directorio de extracci&oacute;n");
                }

                $dir = opendir($directorio); //Abrimos el directorio de destino
                $target_path = $directorio . '/' . $filename; //Indicamos la ruta de destino, así como el nombre del archivo

                //Movemos y validamos que el archivo se haya cargado correctamente
                //El primer campo es el origen y el segundo el destino
                if (move_uploaded_file($source, $target_path)) {
                    $SQL = "INSERT INTO `documents`
                    (`name`, `typedoc`, `user_register`, `public`, `register_date`, `tipo`, `categoria`)
                    VALUES('$filename','$idProspecto','" . $_SESSION["UserID"] . "','$target_path',curdate(), '$file_type', '$categoria');";

                    DB_query($SQL, $db);
                    //echo "El archivo $filename se ha almacenado en forma exitosa.<br>";
                } else {
                    //echo "Ha ocurrido un error, por favor inténtelo de nuevo.<br>";
                }

                closedir($dir); //Cerramos el directorio de destino
            }
        }
    }
}

if ($option == 'ModalBuscarProductos') {
    $filtro = $_POST["filtro"];

    $sql = "SELECT prices.stockid, prices.price, stockmaster.description, stockmaster.units, taxauthrates.taxrate
            FROM prices 
            inner join stockmaster on  prices.stockid = stockmaster.stockid
            INNER JOIN taxauthrates ON stockmaster.taxcatid = taxauthrates.taxcatid
            WHERE typeabbrev='L1' AND stockmaster.description like '%$filtro%';";
    $rs = DB_query($sql, $db);
    $rows = array();

    while ($row = mysqli_fetch_object($rs)) {
        $rows[] = [
            'stockid' => $row->stockid,
            'price' => number_format($row->price, '2', '.', ''),
            'description' => $row->description,
            'units' => $row->units,
            'taxrate' => $row->taxrate
        ];
    }

    $contenido = $rows;
    $result = true;
}

if ($option == 'ObtenerProductos') {
    $sql = "SELECT prices.stockid, prices.price, stockmaster.description, stockmaster.units, taxauthrates.taxrate
            FROM prices 
            inner join stockmaster on  prices.stockid = stockmaster.stockid
            INNER JOIN taxauthrates ON stockmaster.taxcatid = taxauthrates.taxcatid
            WHERE typeabbrev='L1';";
    $rs = DB_query($sql, $db);
    $rows = array();

    while ($row = mysqli_fetch_object($rs)) {
        $rows[] = [
            'stockid' => $row->stockid,
            'price' => number_format($row->price, '2', '.', ''),
            'description' => $row->description,
            'units' => $row->units,
            'taxrate' => $row->taxrate
        ];
    }
    $contenido = $rows;
    $result = true;
}

if ($option == 'GuardarEtapaC') {
    DB_Txn_Begin($db);
    try {
        $u_movimiento = $_POST['u_movimientoID'];
        $idContacto = $_POST['idContacto'];
        $arrResponse = array();
        $renglonalmacen = array("tagref" => "", "loccode" => "");

        // consultar datos del almacen por la unidad de negocio seleccionada
        $consulta = "SELECT tagref, loccode
                    FROM locations 
                    WHERE tagref='" . $_POST['cmbUnidadesNegocio'] . "'";

        $resultado = DB_query($consulta, $db);

        if ($renglonalmacen = DB_fetch_array($resultado));

        // Insert productos
        if ($_POST['productosC'] != "") {
            $delete_productos = "DELETE FROM `productos_oportunidad` WHERE `u_movimiento` = '$u_movimiento' and etapa='C'";
            $rsDeleteProductos = DB_query($delete_productos, $db);

            $productos = json_decode($_POST['productosC']);
            $insert_productos = "INSERT INTO `productos_oportunidad` (`u_movimiento`,`stockid`,`precio`,`cantidad`,`etapa`) VALUES ";
            foreach ($productos as $producto) {
                $insert_productos .= "('$u_movimiento','$producto->stockid','$producto->precio','$producto->cantidad','C'),";
            }
            $insert_productos = substr($insert_productos, 0, -1);
            $rsProductos = DB_query($insert_productos, $db);
        }

        /* Fin Insert productos */
        $TotalGeneral = $_POST['subtotal'];
        $TotalGeneralIva = $_POST['iva'];

        $SQL = "SELECT typeabbrev,
                    sales_type,
                    salestypes.termsindicator,
                    terms
            FROM salestypes
            LEFT JOIN paymentterms ON salestypes.termsindicator = paymentterms.termsindicator
            WHERE typeabbrev = 'L1'";

        // echo '<pre>' . $SQL;
        $Result = DB_query($SQL, $db);
        $myrow = DB_fetch_array($Result);

        $termino = $myrow['termsindicator'];
        $termname = $myrow['terms'];
        $fecha = $_POST['year'] . "-" . $_POST['mes'] . "-" . $_POST['dia'] . " " . date("H:i:s");
        $codigoarea = "";

        // validar si ya existe un pedido para esta oportunidad
        $consulta = "SELECT orderno, fromstkloc, ordertype  FROM salesorders WHERE idprospect='" . $u_movimiento . "'";
        $resultado = DB_query($consulta, $db);

        if ($renglon = DB_fetch_array($resultado)) {
            $orderno = $renglon["orderno"];
            $loccode = $renglon['fromstkloc'];
            $ordertype = $renglon['ordertype'];
        } else {
            $pedido = InsertSalesOrders($db, $_SESSION['UserID'], $TotalGeneral, $TotalGeneralIva, $termino, $termname, $fecha, 'L1', $codigoarea, '136');
            $orderno = $pedido["orderno"];
            $loccode = $pedido['loccode'];
            $ordertype = $pedido['ordertype'];
            $SQL = $pedido["SQL"];

            $resulin = DB_query($SQL, $db); // insertar registro de pedido
        }

        $fecha = date('Y-m-d');

        $line = 0;
        $productosC = json_decode($_POST['productosC']);

        if ($_POST['productosC'] != "") {
            $sqlEliminaritem = "DELETE FROM salesorderdetails WHERE orderno ='$orderno';";
            $rsitem = DB_query($sqlEliminaritem, $db);

            foreach ($productosC as $producto) {
                $narrative = isset($producto->descripcion) ? $producto->descripcion : '';
                $SQLDetail = InsertSalesOrderDetails($db, $line, $orderno, $producto->stockid, $producto->precio, $producto->cantidad, $producto->descuento1, 0, 0, $narrative, $fecha, $loccode, $ordertype, '0', '0', '0');
                //echo $SQL."<br>";
                $line++;
                $resulin = DB_query($SQLDetail, $db);
            }
        }

        if ($orderno > 0) {
            $sql = "SELECT * FROM prospect_movimientos WHERE u_movimiento = '$u_movimiento';";
            $rsOportunidad = DB_query($sql, $db);
            $rowOportunidad = DB_fetch_array($rsOportunidad);

            // actualizar unidad negocio y almacen en pedido
            $sqlUpdate = "UPDATE salesorders 
                        SET idprospect ='" . $u_movimiento . "', 
                            tagref='" . $renglonalmacen["tagref"] . "',
                            fromstkloc='" . $renglonalmacen["loccode"] . "', 
                            salesman='" . $_POST['cmbVendedor'] . "', 
                            debtorno='" . $rowOportunidad['debtorno'] . "', 
                            branchcode='" . $rowOportunidad['branchcode'] . "' 
                        WHERE orderno = '" . $orderno . "'";

            $rs = DB_query($sqlUpdate, $db);

            // actualizar almacen en detalle pedido
            $sqlUpdate = "UPDATE salesorderdetails 
                        SET fromstkloc ='" . $renglonalmacen["loccode"] . "' 
                        WHERE orderno = '" . $orderno . "'";

            $rs = DB_query($sqlUpdate, $db);

            // Agregar a tabla de fechas de pedidos
            $deleteCondiciones = "DELETE FROM salesdate WHERE orderno = '$orderno';";
            $rsDelete = DB_query($deleteCondiciones, $db);

            $qry = "INSERT INTO salesdate(orderno,fecha_solicitud,usersolicitud, fecha_cotizacion, usercotizacion)
                    VALUES(" . $orderno . ",now(),'" . $_SESSION['UserID'] . "', now(),'" . $_SESSION['UserID'] . "')";

            $Result = DB_query($qry, $db);

            $deleteCondiciones = "DELETE FROM fieldsalesordervalues WHERE orderno = '$orderno';";
            $rsDelete = DB_query($deleteCondiciones, $db);

            $sqlComercial = "INSERT INTO `fieldsalesordervalues`
                            (`orderno`,`fieldid`,`value`,`showOnPdf`,`descripcion`,`orden`) 
                            VALUES('$orderno',1,'Condiciones',1,'" . $_POST['txtCondicionesComerciales'] . "',1);";

            $Result = DB_query($sqlComercial, $db);

            // obtener clasificacion de prospecto
            $clasificacion = 0;
            $consulta = "SELECT id, description FROM prospect_clasificacion WHERE '" . floatval($TotalGeneral) . "' BETWEEN minimo AND maximo";
            $resultado = DB_query($consulta, $db);

            if ($registro = DB_fetch_array($resultado)) {
                $clasificacion = $registro["id"];
            }

            //Update Oportunidad
            $sql = "UPDATE prospect_movimientos 
                    SET cargo = '$TotalGeneral', 
                        erp= '" . $clasificacion . "',
                        idstatus= IF(idstatus >3, idstatus, 3)
                    WHERE u_movimiento = '$u_movimiento';";

            $rsOportunidad = DB_query($sql, $db);
            /* Fin Update Oportunidad */
        }

        $arrResponse[] = [
            'orderno' => $orderno,
            'tagref' => $_POST['cmbUnidadesNegocio']
        ];

        $result = true;
        $contenido = $arrResponse;

        DB_Txn_Commit($db);
    } catch (Exception $e) {
        $msjError = $e->getMessage();
        DB_Txn_Rollback($db);
        $result = false;
    }
}

if ($option == 'traeActividad') {
    try {
        // validar si existe la actividad para actualizar
        $consulta = "SELECT tasks_movimientos.u_movimiento, tasks_movimientos.concepto, tasks_movimientos.descripcion, 
                    tasks_movimientos.u_user, tasks_movimientos.TipoMovimientoId, tasks_movimientos.idstatus, 
                    tasks_movimientos.fecha_compromiso, tasks_movimientos.hora, tasks_movimientos.u_prospecto, 
                    prospect_movimientos.debtorno, debtorsmaster.name
                    FROM tasks_movimientos 
                    INNER JOIN prospect_movimientos ON tasks_movimientos.u_prospecto=prospect_movimientos.u_movimiento
                    INNER JOIN debtorsmaster ON prospect_movimientos.debtorno=debtorsmaster.debtorno
                    WHERE tasks_movimientos.u_movimiento='" . $_POST["actividad_id"] . "'";

        $resultado = DB_query($consulta, $db);

        while ($renglon = DB_fetch_array($resultado)) {
            $contenido[$renglon['u_movimiento']] = [
                'u_movimiento' => $renglon['u_movimiento'],
                'concepto' => $renglon['concepto'],
                'descripcion' => $renglon['descripcion'],
                'u_user' => $renglon['u_user'],
                'tipomovimiento' => $renglon['TipoMovimientoId'],
                'idstatus' => $renglon['idstatus'],
                'fecha_compromiso' => $renglon['fecha_compromiso'],
                'hora' => $renglon['hora'],
                'u_prospecto' => $renglon['u_prospecto'],
                'prospectoid' => $renglon['debtorno'],
                'prospecto' => $renglon['name']
            ];
        }

        $result = true;
    } catch (Exception $e) {
        $msjError = $e->getMessage();
        DB_Txn_Rollback($db);
        $result = false;
    }
}

if ($option == 'GuardarActividad') {
    DB_Txn_Begin($db);

    try {
        $arrFechaActividad = explode("-", $_POST['txtFechaActividad']);
        $horaActividad = $_POST['txtHora'] . ":" . $_POST['txtMinutos'] . ":00";
        $actividad_id = 0;

        if (!empty($_POST['actividad_id'])) {
            $actividad_id = $_POST['actividad_id'];
        }

        if (!empty($_POST["txtHoraActividad"])) {
            $horaActividad = $_POST["txtHoraActividad"];
        }

        // validar si existe la actividad para actualizar
        $consulta = "SELECT * FROM tasks_movimientos WHERE u_movimiento='" . $actividad_id . "'";
        $resultado = DB_query($consulta, $db);

        if (DB_fetch_array($resultado)) {
            $instruccion = "UPDATE tasks_movimientos
                            SET descripcion='" . $_POST['txtDescripcionActividad'] . "',
                                hora='" . $horaActividad . "',
                                TipoMovimientoId='" . $_POST['cmbTipoActividad'] . "',
                                fecha_compromiso='" . $_POST['txtFechaActividad'] . "' 
                            WHERE u_movimiento='" . $actividad_id . "'";

            DB_query($instruccion, $db);
        } else {
        // VALIDACION: No permitir duplicar Visita en Sitio mismo vendedor misma fecha/hora
        if ($_POST['cmbTipoActividad'] == '3') {
            $fechaVal = $_POST['txtFechaActividad'];
            $horaVal  = $_POST['txtHora'] . ':' . $_POST['txtMinutos'] . ':00';
            $vendedor = $_SESSION['UserID'];
            $sqlCheck = "SELECT u_movimiento FROM tasks_movimientos 
                          WHERE TipoMovimientoId = '3'
                            AND fecha_compromiso = '$fechaVal'
                            AND ABS(TIME_TO_SEC(TIMEDIFF(hora, '$horaVal'))) < 1200
                            AND u_user = '$vendedor'
                            AND u_movimiento != '$actividad_id'
                          LIMIT 1";
            $rsCheck = DB_query($sqlCheck, $db);
            if (DB_fetch_array($rsCheck)) {
                throw new Exception('Ya tienes una Visita en Sitio agendada a menos de 20 minutos de esa hora.');
            }
        }
            $tipoActividad = $_POST['txtDescripcionActividad'];
            $tipoAddList = addslashes($tipoActividad);

            $sql = "INSERT INTO `tasks_movimientos` (`u_proyecto`, `dia`, `mes`, `anio`, `concepto`, `descripcion`, `u_user`, `idstatus`, `fecha_compromiso`, `fecha_alta`, `hora`, `u_prospecto`, `titulo`, `TipoMovimientoId`)
                    VALUES (
                        0,
                        '" . $arrFechaActividad[2] . "', 
                        '" . $arrFechaActividad[1] . "', 
                        '" . $arrFechaActividad[0] . "',  
                        '" . $_POST['txtTituloActividad'] . "', 
                        '$tipoAddList', 
                        '" . $_SESSION["UserID"] . "', 
                        1, 
                        '" . $_POST['txtFechaActividad'] . "', 
                        NOW(), 
                        '" . $horaActividad . "', 
                        '" . $_POST['txtMovimiento'] . "', 
                        '" . $_POST['txtTituloActividad'] . "',
                        '" . $_POST['cmbTipoActividad'] . "'
                    )";

            DB_query($sql, $db);

            $actividad_id = DB_Last_Insert_ID($db, 'tasks_movimientos', 'u_movimiento');
        }

        //actualizar Oportunidad
        $sql = "UPDATE prospect_movimientos 
                SET idstatus= IF(idstatus=0, 1, idstatus)
                WHERE u_movimiento = '" . $_POST['txtMovimiento'] . "';";

        DB_query($sql, $db);

        $contenido[] = [
            "id_actividad" => $actividad_id
        ];

        $result = true;

        DB_Txn_Commit($db);
    } catch (Exception $e) {
        $msjError = $e->getMessage();
        DB_Txn_Rollback($db);
        $result = false;
    }
}

if ($option == 'GuardarComentario') {
    DB_Txn_Begin($db);
    try {
        $arrFechaActividad = explode("-", $_POST['txtFechaActividad']);

        //Agregar comentario como respuesta a la actividad
        $sql = "INSERT INTO tasks_comentarios (idtarea, comentario, fecha, avance, idstatus, urecurso, userid, operacion, idusercorrection)
                VALUES ('" . $_POST['idactividad'] . "', '" . $_POST['txtcomentario'] . "', sysdate(),0,1, '*','" . $_SESSION["UserID"] . "','','');";

        $contenido = DB_query($sql, $db);

        //Update Oportunidad
        $sql = "UPDATE prospect_movimientos
        LEFT JOIN tasks_movimientos ON  prospect_movimientos.u_movimiento = tasks_movimientos.u_prospecto
        SET prospect_movimientos.idstatus= IF(prospect_movimientos.idstatus =0, 1, prospect_movimientos.idstatus)
        WHERE tasks_movimientos.u_movimiento = '" . $_POST['idactividad'] . "';";
        $rsOportunidad = DB_query($sql, $db);

        $result = true;

        DB_Txn_Commit($db);
    } catch (Exception $e) {
        $msjError = $e->getMessage();
        DB_Txn_Rollback($db);
        $result = false;
    }
}

if ($option == 'GuardarActividadGeneral') {
    DB_Txn_Begin($db);
    try {
        $fecha = $_POST['txtFechaActividad'];
        if ($_POST['txtFechaActividad'] == "") {
            $fecha = date("Y-m-d");
        }

        $arrFechaActividad = explode("-", $fecha);

        $sql = "INSERT INTO `tasks_movimientos` (`u_proyecto`, `dia`, `mes`, `anio`, `concepto`, `descripcion`, `u_user`, `idstatus`, `fecha_compromiso`, `fecha_alta`, `u_prospecto`, `titulo`)
                VALUES (
                    0,
                    '" . $arrFechaActividad[2] . "', 
                    '" . $arrFechaActividad[1] . "', 
                    '" . $arrFechaActividad[0] . "',  
                    '" . $_POST['txtTituloActividad'] . "', 
                    '" . $_POST['txtDescripcionActividad'] . "', 
                    '" . $_SESSION["UserID"] . "', 
                    1, 
                    '" . $fecha . "', 
                    NOW(), 
                    '" . $_POST['txtMovimiento'] . "', 
                    '" . $_POST['txtTituloActividad'] . "'
                )";

        $contenido = DB_query($sql, $db);

        //echo $sql;

        $result = true;

        DB_Txn_Commit($db);
    } catch (Exception $e) {
        $msjError = $e->getMessage();
        DB_Txn_Rollback($db);
        $result = false;
    }
}

if ($option == 'traeHistorial') {
    try {
        $sql = "SELECT u_movimiento, fecha_compromiso, concepto AS titulo, tasks_movimientos.descripcion, www_users.realname AS usuario, COALESCE(oportunidad_tipo.descripcion,'Historico') as desc_tipoactividad 
                FROM tasks_movimientos 
                INNER JOIN www_users ON tasks_movimientos.u_user=www_users.userid
                LEFT JOIN oportunidad_tipo ON tasks_movimientos.TipoMovimientoId = oportunidad_tipo.id
                WHERE u_prospecto='" . $_POST["idOportunidad"] . "'
                ORDER BY fecha_compromiso DESC, u_movimiento DESC";

        $rs = DB_query($sql, $db);
        $rows = array();

        while ($row = mysqli_fetch_object($rs)) {
            $sqlComentarios = "SELECT tasks_comentarios.idcomentario, tasks_comentarios.fecha, tasks_comentarios.comentario, www_users.realname AS usuario
            FROM tasks_comentarios 
            INNER JOIN www_users ON tasks_comentarios.userid=www_users.userid
            WHERE tasks_comentarios.idtarea='" . $row->u_movimiento . "'
            ORDER BY tasks_comentarios.idcomentario DESC";

            $rsComentario = DB_query($sqlComentarios, $db);
            $rowsComentarios = array();
            while ($rowComentario = mysqli_fetch_object($rsComentario)) {
                $rowsComentarios[] = [
                    'idcomentario' => $rowComentario->idcomentario,
                    'fecha' => $rowComentario->fecha,
                    'comentario' => $rowComentario->comentario,
                    'usuario' => $rowComentario->usuario,
                ];
            }

            $rows[] = [
                'idactividad' => $row->u_movimiento,
                'fecha' => $row->fecha_compromiso,
                'tipo' => $row->desc_tipoactividad,
                'titulo' => $row->titulo,
                'descripcion' => $row->descripcion,
                'usuario' => $row->usuario,
                'comentarios' => $rowsComentarios
            ];
        }

        $contenido = $rows;
        $result = true;
    } catch (Exception $e) {
        $msjError = $e->getMessage();
        $result = false;
    }
}

if ($option == 'traeCalificacionVendedor') {
    try {
        $datos = array();

        // Coonsultar todos los datos generales del prospecto para mostrar en pantalla
        $consulta = "SELECT COUNT(*) AS total_actividades, 
                    SUM(CASE 
                    WHEN DATE_FORMAT(CONCAT(tasks_movimientos.fecha_compromiso,' ', tasks_movimientos.hora), '%Y-%m-%d %H:%i:%s') < NOW() AND tasks_comentarios.fecha < DATE_FORMAT(CONCAT(tasks_movimientos.fecha_compromiso,' ', tasks_movimientos.hora), '%Y-%m-%d %H:%i:%s') THEN '1' 
                    WHEN DATE_FORMAT(CONCAT(tasks_movimientos.fecha_compromiso,' ', tasks_movimientos.hora), '%Y-%m-%d %H:%i:%s') < NOW() AND tasks_comentarios.idtarea IS NULL THEN '0'
                    WHEN tasks_comentarios.fecha > DATE_FORMAT(CONCAT(tasks_movimientos.fecha_compromiso,' ', tasks_movimientos.hora), '%Y-%m-%d %H:%i:%s') THEN '0'
                    ELSE '1' END) AS correctas
                    FROM prospect_movimientos 
                    INNER JOIN tasks_movimientos ON prospect_movimientos.u_movimiento=tasks_movimientos.u_prospecto
                    LEFT JOIN tasks_comentarios ON tasks_movimientos.u_movimiento=tasks_comentarios.idtarea
                    WHERE prospect_movimientos.salesman='" . $_POST["vendedor"] . "'";

        $resultado = DB_query($consulta, $db);

        while ($renglon = DB_fetch_array($resultado)) {
            $contenido[] = [
                "calificacion" => ($renglon["correctas"] / $renglon["total_actividades"]) * 100
            ];
        }

        $result = true;
    } catch (Exception $e) {
        $msjError = $e->getMessage();
        $result = false;
    }
}

if ($option == 'traeInfoProspecto') {
    try {
        $datos = array();
        $prospectoid = 0;
        $actividadid = 0;
        $calificacion = 0;

        // Coonsultar todos los datos generales del prospecto para mostrar en pantalla
        $consulta = "SELECT prospect_movimientos.u_movimiento AS prospectoid, prospect_movimientos.idstatus, prospect_status.nombrealterno, 
                    prospect_status.logo, prospect_movimientos.debtorno, debtorsmaster.name AS prospecto, 
                    IF(prospect_movimientos.encargado_proyecto='', 'SIN NOMBRE CONTACTO', prospect_movimientos.encargado_proyecto) AS nombre_contacto,
                    prospect_movimientos.telefono_encargado, 
                    prospect_movimientos.correo_encargado, 
                    CONCAT(prospect_movimientos.telefono_encargado,'/',custbranch.phoneno) AS telefonos_contacto,
					CONCAT(prospect_movimientos.correo_encargado, '/', custbranch.email) AS correos_contacto,
                    prospect_movimientos.area_total, prospect_movimientos.tiempo_vida, prospect_movimientos.salesman AS vendedorid, salesman.salesmanname AS vendedor, 
                    custbranch.SectComClId AS sector_comercial_id, SectComercialCl.SectComClNom AS sector_comercial, custbranch.email AS correo, 
                    custbranch.phoneno AS telefono, custcontacts.CustLeadSourceId AS fuente_contacto_id, Custleadsource.CustLeadSourceNom AS fuente_contacto, 
                    prospect_movimientos.cargo, tasks_movimientos.u_movimiento AS actividad_id, 
                    tasks_movimientos.hora, oportunidad_tipo.descripcion AS tipo_actividad, oportunidad_tipo.iconodia, 
                    oportunidad_tipo.iconoagendado, tasks_movimientos.descripcion AS descripcion_actividad, 
                    tasks_movimientos.u_user AS usuario_actividad, tasks_comentarios.idcomentario, tasks_comentarios.comentario, 
                    tasks_comentarios.fecha, tasks_comentarios.userid AS usuario_comentario,
                    CONCAT(tasks_movimientos.fecha_compromiso, ' ',tasks_movimientos.hora) AS fecha_seguimiento, 
                    IFNULL(prospect_movimientos.fecha_compromiso, '') as fecha_cierre,
                    IFNULL(prospect_clasificacion.description, 'S/C') AS clasificacion,
                    IFNULL(salesorders.orderno, 0) AS pedidoventa,
                    COALESCE(wu_ses.permisoCambioFechaCierre, 0) AS permisoCambioFechaCierre                    
                    FROM prospect_movimientos 
                    INNER JOIN debtorsmaster ON prospect_movimientos.debtorno=debtorsmaster.debtorno
                    INNER JOIN custbranch ON debtorsmaster.debtorno=custbranch.debtorno AND debtorsmaster.debtorno=custbranch.branchcode 
                    INNER JOIN prospect_status ON prospect_movimientos.idstatus=prospect_status.idstatus
                    LEFT JOIN custcontacts ON prospect_movimientos.debtorno=custcontacts.debtorno
                    LEFT JOIN SectComercialCl ON custbranch.SectComClId=SectComercialCl.SectComClId
                    LEFT JOIN Custleadsource ON custcontacts.CustLeadSourceId=Custleadsource.CustLeadSourceId
                    LEFT JOIN salesman ON prospect_movimientos.salesman=salesman.salesmancode
                    LEFT JOIN tasks_movimientos ON prospect_movimientos.u_movimiento=tasks_movimientos.u_prospecto
                    LEFT JOIN oportunidad_tipo ON tasks_movimientos.TipoMovimientoId = oportunidad_tipo.id
                    LEFT JOIN tasks_comentarios ON tasks_movimientos.u_movimiento=tasks_comentarios.idtarea
                    LEFT JOIN prospect_clasificacion ON prospect_movimientos.erp=prospect_clasificacion.id
                    LEFT JOIN salesorders ON prospect_movimientos.u_movimiento=salesorders.idprospect
                    LEFT JOIN www_users wu_ses ON wu_ses.userid = '" . DB_escape_string($_SESSION['UserID'], $db) . "'
                    WHERE prospect_movimientos.u_movimiento='" . $_POST["idOportunidad"] . "'
                    ORDER BY CONCAT(tasks_movimientos.fecha_compromiso, ' ',tasks_movimientos.hora) DESC, tasks_comentarios.fecha DESC ";

        $resultado = DB_query($consulta, $db);

        while ($renglon = DB_fetch_array($resultado)) {
            if ($prospectoid != $renglon['prospectoid']) {
                // Coonsultar todos los datos generales del prospecto para mostrar en pantalla
                $consulta = "SELECT COUNT(DISTINCT tasks_movimientos.u_movimiento) AS total_actividades, 
                            SUM(CASE 
                            WHEN DATE_FORMAT(CONCAT(tasks_movimientos.fecha_compromiso,' ', tasks_movimientos.hora), '%Y-%m-%d %H:%i:%s') < NOW() AND tasks_comentarios.fecha <= DATE_FORMAT(CONCAT(tasks_movimientos.fecha_compromiso,' ', tasks_movimientos.hora), '%Y-%m-%d %H:%i:%s') THEN '1' 
                            WHEN DATE_FORMAT(CONCAT(tasks_movimientos.fecha_compromiso,' ', tasks_movimientos.hora), '%Y-%m-%d %H:%i:%s') < NOW() AND tasks_comentarios.idtarea IS NULL THEN '0'
                            WHEN tasks_comentarios.fecha > DATE_FORMAT(CONCAT(tasks_movimientos.fecha_compromiso,' ', tasks_movimientos.hora), '%Y-%m-%d %H:%i:%s') THEN '0'
                            ELSE '1' END) AS correctas
                            FROM prospect_movimientos 
                            INNER JOIN prospect_status ON prospect_movimientos.idstatus=prospect_status.idstatus
                            INNER JOIN tasks_movimientos ON prospect_movimientos.u_movimiento=tasks_movimientos.u_prospecto
                            LEFT JOIN tasks_comentarios ON tasks_movimientos.u_movimiento=tasks_comentarios.idtarea
                            WHERE prospect_movimientos.salesman='" . $renglon['vendedorid'] . "' 
                            AND prospect_movimientos.idstatus>0
                            AND prospect_status.flagfactura=0
                            AND tasks_movimientos.fecha_compromiso >= '2024-04-01'";

                $resultadocal = DB_query($consulta, $db);

                while ($rengloncal = DB_fetch_array($resultadocal)) {
                    $calificacion = ($rengloncal["correctas"] / $rengloncal["total_actividades"]) * 100;
                }

                $datos[$renglon['prospectoid']] = [
                    'prospectoid' => $renglon['prospectoid'],
                    'idstatus' => $renglon['idstatus'],
                    'nombrealterno' => $renglon['nombrealterno'],
                    'logo' => $renglon['logo'],
                    'debtorno' => $renglon['debtorno'],
                    'prospecto' => $renglon['prospecto'],
                    'nombre_contacto' => $renglon['nombre_contacto'],
                    'telefonos_contacto' => $renglon['telefonos_contacto'],
                    'correos_contacto' => $renglon['correos_contacto'],
                    'area_total' => $renglon['area_total'],
                    'tiempo_vida' => $renglon['tiempo_vida'],
                    'vendedorid' => $renglon['vendedorid'],
                    'vendedor' => $renglon['vendedor'],
                    'sector_comercial_id' => $renglon['sector_comercial_id'],
                    'sector_comercial' => $renglon['sector_comercial'],
                    'fuente_contacto_id' => $renglon['fuente_contacto_id'],
                    'fuente_contacto' => $renglon['fuente_contacto'],
                    'cargo' => $renglon['cargo'],
                    'fecha_seguimiento' => $renglon['fecha_seguimiento'],
                    'fecha_cierre' => $renglon['fecha_cierre'],
                    'calificacion' => $calificacion,
                    'clasificacion' => $renglon['clasificacion'],
                    'archivos' => 0,
                    'pedidoventa' => $renglon['pedidoventa'],
                    'permisoCambioFechaCierre' => (int)$renglon['permisoCambioFechaCierre']
                ];
            }

            // agregar registro de actividades al prospecto
            if (!empty($renglon['actividad_id'])) {
                if ($actividadid != $renglon['actividad_id']) {
                    $datos[$renglon['prospectoid']]["actividades"][] = [
                        'actividad_id' => $renglon['actividad_id'],
                        'fecha_seguimiento' => $renglon['fecha_seguimiento'],
                        'hora' => $renglon['hora'],
                        'tipo_actividad' => $renglon['tipo_actividad'],
                        'iconodia' => $renglon['iconodia'],
                        'iconoagendado' => $renglon['iconoagendado'],
                        'descripcion_actividad' => $renglon['descripcion_actividad'],
                        'usuario_actividad' => $renglon['usuario_actividad']
                    ];
                }

                // agregar registro de comentarios o respuestas a la actividad
                if (!empty($renglon['idcomentario'])) {
                    $datos[$renglon['prospectoid']]["comentarios"][$renglon['actividad_id']][] = [
                        'idcomentario' => $renglon['idcomentario'],
                        'comentario' => $renglon['comentario'],
                        'fecha' => $renglon['fecha'],
                        'usuario_comentario' => $renglon['usuario_comentario']
                    ];
                }
            }

            $prospectoid = $renglon['prospectoid'];
            $actividadid = $renglon['actividad_id'];
        }

        // consulta para obtener los cambios de etapas
        $consulta = "SELECT prospect_movimientos.fecha_alta, prospect_status_log.*, prospect_status.logo AS icono_ant, 
                    prospect_status.color AS color_ant, estatus.logo AS icono_act, estatus.color AS color_act,
                    IF(DATEDIFF(prospect_status_log.fechamovto, prospect_movimientos.fecha_alta) = 0, 1, DATEDIFF(prospect_status_log.fechamovto, prospect_movimientos.fecha_alta)) AS dias,
                    DATEDIFF(NOW(), prospect_movimientos.fecha_alta) AS totaldias
                    FROM prospect_movimientos 
                    LEFT JOIN prospect_status_log ON prospect_movimientos.u_movimiento=prospect_status_log.u_movimiento
                    LEFT JOIN prospect_status ON prospect_status_log.idstatus_ant=prospect_status.idstatus
                    LEFT JOIN prospect_status estatus ON prospect_status_log.idstatus_act=estatus.idstatus
                    WHERE prospect_movimientos.u_movimiento='" . $_POST["idOportunidad"] . "' 
                    ORDER BY fechamovto";

        $resultado = DB_query($consulta, $db);

        while ($renglon = DB_fetch_array($resultado)) {
            $datos[$prospectoid]["estatus"][] = [
                'id' => $renglon['id'],
                'u_movimiento' => $renglon['u_movimiento'],
                'idstatus_ant' => $renglon['idstatus_ant'],
                'idstatus_act' => $renglon['idstatus_act'],
                'fecha_alta' => $renglon['fecha_alta'],
                'fechamovto' => $renglon['fechamovto'],
                'comentario' => $renglon['comentario'],
                'usuario' => $renglon['usuario'],
                'icono_ant' => $renglon['icono_ant'],
                'color_ant' => $renglon['color_ant'],
                'icono_act' => $renglon['icono_act'],
                'color_act' => $renglon['color_act'],
                'dias' => $renglon['dias'],
                'totaldias' => $renglon['totaldias']
            ];
        }

        // consultar si el prospecto tiene archivod cargados
        $consulta = "SELECT COUNT(*) AS archivos FROM documents WHERE typedoc='" . $_POST["idOportunidad"] . "'";

        $resultado = DB_query($consulta, $db);

        while ($renglon = DB_fetch_array($resultado)) {
            $datos[$prospectoid]["archivos"] = $renglon["archivos"];
        }

        $contenido = $datos;

        $result = true;
    } catch (Exception $e) {
        $msjError = $e->getMessage();
        $result = false;
    }
}

if ($option == 'ModificarEtapaC') {
    DB_Txn_Begin($db);
    try {
        $u_movimiento = $_POST['u_movimientoID'];
        $orderno = $_POST['txtIdOrderNo'];
        $idContacto = $_POST['idContacto'];
        $arrResponse = array();
        $renglonalmacen = array("tagref" => "", "loccode" => "");

        // consultar almacen de acuerdo a la unidad de negocio seleccionada
        $consulta = "SELECT tagref, loccode
                    FROM locations 
                    WHERE tagref='" . $_POST['cmbUnidadesNegocio'] . "'";

        $resultado = DB_query($consulta, $db);

        if ($renglonalmacen = DB_fetch_array($resultado));

        // Insert productos
        if ($_POST['productosC'] != "") {
            $delete_productos = "DELETE FROM `productos_oportunidad` WHERE `u_movimiento` = '$u_movimiento' and etapa='C'";
            $rsDeleteProductos = DB_query($delete_productos, $db);

            $productos = json_decode($_POST['productosC']);
            $insert_productos = "INSERT INTO `productos_oportunidad` (`u_movimiento`,`stockid`,`precio`,`cantidad`,`etapa`) VALUES ";
            foreach ($productos as $producto) {
                $insert_productos .= "('$u_movimiento','$producto->stockid','$producto->precio','$producto->cantidad','C'),";
            }
            $insert_productos = substr($insert_productos, 0, -1);
            //echo $insert_productos;
            $rsProductos = DB_query($insert_productos, $db);
        }

        /* Fin Insert productos */
        $TotalGeneral = $_POST['subtotal'];
        $TotalGeneralIva = $_POST['iva'];

        if ($orderno != "") {
            $loccode = "";
            $ordertype = "";

            $sqlCotizacion = "SELECT ordertype, fromstkloc as loccode FROM salesorders WHERE orderno ='$orderno';";
            $rsCotizacion = DB_query($sqlCotizacion, $db);

            while ($rowCotizacion = mysqli_fetch_object($rsCotizacion)) {
                $loccode = $rowCotizacion->loccode;
                $ordertype = $rowCotizacion->ordertype;
            }

            $fecha = date('Y-m-d');
            $line = 0;
            $productosC = json_decode($_POST['productosC']);

            if ($_POST['productosC'] != "") {
                $sqlEliminaritem = "DELETE FROM salesorderdetails WHERE orderno ='$orderno';";
                $rsitem = DB_query($sqlEliminaritem, $db);

                foreach ($productosC as $producto) {
                    $narrative = isset($producto->descripcion) ? $producto->descripcion : '';
                    $SQLDetail = InsertSalesOrderDetails($db, $line, $orderno, $producto->stockid, $producto->precio, $producto->cantidad, $producto->descuento1, 0, 0, $narrative, $fecha, $renglonalmacen["loccode"], $ordertype, '0', '0', '0');
                    //echo $SQL."<br>";
                    $line++;

                    $resulin = DB_query($SQLDetail, $db);
                }
            }

            $sqlUpdate = "UPDATE salesorders 
                        SET orddate= curdate(), 
                            taxtotal='" . $TotalGeneral . "', 
                            totaltaxret='" . $TotalGeneralIva . "', 
                            idprospect ='" . $u_movimiento . "', 
                            tagref='" . $renglonalmacen["tagref"] . "', 
                            fromstkloc='" . $renglonalmacen["loccode"] . "', 
                            salesman='" . $_POST['cmbVendedor'] . "' 
                        WHERE orderno = '" . $orderno . "'";

            $rs = DB_query($sqlUpdate, $db);

            $deleteCondiciones = "DELETE FROM fieldsalesordervalues WHERE orderno = '$orderno';";
            $rsDelete = DB_query($deleteCondiciones, $db);

            $sqlComercial = "INSERT INTO `fieldsalesordervalues`
                            (`orderno`,`fieldid`,`value`,`showOnPdf`,`descripcion`,`orden`) 
                            VALUES('$orderno',1,'Condiciones',1,'" . $_POST['txtCondicionesComerciales'] . "',1);";

            $Result = DB_query($sqlComercial, $db);

            // obtener clasificacion de prospecto
            $clasificacion = 0;
            $consulta = "SELECT id, description FROM prospect_clasificacion WHERE '" . floatval($TotalGeneral) . "' BETWEEN minimo AND maximo";
            $resultado = DB_query($consulta, $db);

            if ($registro = DB_fetch_array($resultado)) {
                $clasificacion = $registro["id"];
            }

            //Update Oportunidad
            $sql = "UPDATE prospect_movimientos 
                    SET cargo = '$TotalGeneral', 
                        erp= '" . $clasificacion . "',
                        idstatus= IF(idstatus >3, idstatus, 3)
                    WHERE u_movimiento = '$u_movimiento';";

            $rsOportunidad = DB_query($sql, $db);
        }

        $arrResponse[] = [
            'orderno' => $orderno,
            'tagref' => $_POST['cmbUnidadesNegocio']
        ];

        $result = true;
        $contenido = $arrResponse;

        DB_Txn_Commit($db);
    } catch (Exception $e) {
        $msjError = $e->getMessage();
        DB_Txn_Rollback($db);
        $result = false;
    }
}

if ($option == 'traerRegistroBase') {
    DB_Txn_Begin($db);
    try {
        $sql = "SELECT u_movimiento 
                FROM prospect_movimientos 
                WHERE u_user = '" . $_SESSION["UserID"] . "'
                ORDER BY debtorno 
                DESC LIMIT 1";
        $contenido = DB_query($sql, $db);
        $dato = mysqli_fetch_object($contenido);
        $idRegistroDB = $dato->u_movimiento;
        $result =  $idRegistroDB;

        DB_Txn_Commit($db);
    } catch (Exception $e) {
        $msjError = $e->getMessage();
        DB_Txn_Rollback($db);
        $result = false;
    }
}

if ($option == 'actualizaVendedor') {
    DB_Txn_Begin($db);
    try {
        $sql = "UPDATE prospect_movimientos 
                SET salesman='" . $_POST["cmbVendedor02"] . "',
                    idstatus= CASE WHEN idstatus=0 THEN 0 ELSE idstatus END 
                WHERE u_movimiento='" . $_POST["txtMovimientoVendedor"] . "'";

        $rs = DB_query($sql, $db);
        $rows = array();

        $rows[] = ["actualizacion" => "exitosa"];

        $result = true;

        $contenido = $rows;

        DB_Txn_Commit($db);
    } catch (Exception $e) {
        $msjError = $e->getMessage();
        DB_Txn_Rollback($db);
        $result = false;
    }
}

// guardar en base de datos las coordenadas del poligono
if ($option == 'actualizaPoligono') {
    DB_Txn_Begin($db);
    try {
        $datospoligono = json_decode($_POST["datos"]);

        $sql = "DELETE FROM poligonos WHERE area='" . $datospoligono[0]->poligono . "'";
        $rs = DB_query($sql, $db);

        $instruccion = "INSERT INTO `poligonos` (`area`, `longitud`, `latitud`, `color`, `orden`) VALUES ";

        foreach ($datospoligono as $key => $poligono) {
            $instruccion .= "('" . $poligono->poligono . "', 
                                '" . $poligono->longitud . "', 
                                '" . $poligono->latitud . "', 
                                '" . $poligono->colorfondo . "', 
                                '" . $poligono->orden . "'
                            ),";
        }

        $instruccion = substr($instruccion, 0, -1) . ";";

        $rs = DB_query($instruccion, $db);

        $rows = array();
        $rows[] = ["actualizacion" => "exitosa"];

        $result = true;

        $contenido = $rows;

        DB_Txn_Commit($db);
    } catch (Exception $e) {
        $msjError = $e->getMessage();
        DB_Txn_Rollback($db);
        $result = false;
    }
}

if ($option == 'GuardarEtapaD') {
    DB_Txn_Begin($db);
    try {
        $arrFechaVisita = explode("-", $_POST['dtFechaCierre']);

        $sql = "UPDATE prospect_movimientos 
                SET  dia = '" . $arrFechaVisita[2] . "', 
                mes = '" . $arrFechaVisita[1] . "',  
                anio  = '" . $arrFechaVisita[0] . "', 
                fecha_compromiso='" . $_POST['dtFechaCierre'] . "',
                idstatus= 4
                WHERE u_movimiento = '" . $_POST['u_movimiento'] . "'";
        $contenido = DB_query($sql, $db);
        $result = true;

        DB_Txn_Commit($db);
    } catch (Exception $e) {
        $msjError = $e->getMessage();
        DB_Txn_Rollback($db);
        $result = false;
    }
}

if ($option == 'CoincidenciasProspecto') {
    DB_Txn_Begin($db);

    try {
        $rows = array();
        $nombre_prospecto = $_POST['nombre_prospecto'];

        $sql = "SELECT debtorsmaster.debtorno, debtorsmaster.name, date_format(coalesce(clientsince, prospectsince),'%d-%m-%Y') AS fecha, 
                coalesce(userprospect,'-') AS userprospect,
                debtorsmaster.address1 AS direccion,
                debtorsmaster.address2 AS colonia,
                debtorsmaster.address3 AS ciudad,
                debtorsmaster.address4 AS estado,
                debtorsmaster.address5 AS cp,
                custbranch.email,
                custbranch.SectComClId,
                custbranch.phoneno AS telefono_fijo, custcontacts.CustLeadSourceId
                FROM debtorsmaster 
                INNER JOIN custbranch ON debtorsmaster.debtorno = debtorsmaster.debtorno AND debtorsmaster.debtorno=custbranch.branchcode
                LEFT JOIN custcontacts ON debtorsmaster.debtorno=custcontacts.debtorno
                WHERE debtorsmaster.name LIKE '%" . $nombre_prospecto . "%';";

        $rs = DB_query($sql, $db);

        while ($rowProspecto = mysqli_fetch_object($rs)) {
            $rows[] = [
                'debtorno' => $rowProspecto->debtorno,
                'name' => $rowProspecto->name,
                'fecha' => $rowProspecto->fecha,
                'userprospect' => $rowProspecto->userprospect,
                'direccion' => $rowProspecto->direccion,
                'colonia' => $rowProspecto->colonia,
                'ciudad' => $rowProspecto->ciudad,
                'estado' => $rowProspecto->estado,
                'cp' => $rowProspecto->cp,
                'email' => $rowProspecto->email,
                'SectComClId' => $rowProspecto->SectComClId,
                'telefono_fijo' => $rowProspecto->telefono_fijo,
                'CustLeadSourceId' => $rowProspecto->CustLeadSourceId
            ];
        }

        $contenido = $rows;

        $result = true;

        DB_Txn_Commit($db);
    } catch (Exception $e) {
        $msjError = $e->getMessage();
        DB_Txn_Rollback($db);
        $result = false;
    }
}

if ($option == 'ValidarRepuestaUltimaActividad') {
    DB_Txn_Begin($db);
    try {

        $result = false;

        $sql = "SELECT count(*) as actividades FROM tasks_movimientos WHERE u_prospecto = '" . $_POST['txtMovimiento'] . "'";
        $rs = DB_query($sql, $db);
        $rowActividades = mysqli_fetch_object($rs);

        if ($rowActividades->actividades > 0) {
            $sql = "SELECT count(*) as comentarios FROM tasks_comentarios WHERE idtarea = (select max(u_movimiento) from tasks_movimientos where u_prospecto = '" . $_POST['txtMovimiento'] . "')";
            $rs = DB_query($sql, $db);

            while ($rowRegistros = mysqli_fetch_object($rs)) {
                if ($rowRegistros->comentarios > 0) {
                    $result = true;
                }
            }
        } else {
            //Se regresa true por que no tiene ninguna actividad a validar
            $result = true;
        }

        DB_Txn_Commit($db);
    } catch (Exception $e) {
        $msjError = $e->getMessage();
        DB_Txn_Rollback($db);
        $result = false;
    }
}

if ($option == 'GuardarAdjuntos') {
    try {
        DB_Txn_Begin($db);

        $result = false;
        $instruccion = "";

        if (!isset($_POST["u_oportunidad"])) {
            throw new Exception("Se requiere el ID de oportunidad para poder guardar los archivos...", 1);
        }

        $u_movimiento = $_POST["u_oportunidad"];

        // Lectura y validacion de la categoria (whitelist)
        $categoria = isset($_POST["categoria"]) ? trim($_POST["categoria"]) : 'imagen';
        $categoriasPermitidas = array('documento', 'pago', 'imagen');
        if (!in_array($categoria, $categoriasPermitidas)) {
            $categoria = 'imagen';
        }

        /**Inicio Cargar Imagenes */
        if (isset($_FILES["fileEvidenciasModal"]) and $u_movimiento != "") {
            fnCargarMultipleArchivo($_FILES['fileEvidenciasModal'], $u_movimiento, $directorioFiles, $db, true, $categoria);
        }

        if (!empty($_POST["imagenesconvertidas"])) {
            $imagenes = json_decode($_POST["imagenesconvertidas"]);

            if (is_array($imagenes)) {
                if (!file_exists($directorioFiles)) {
                    mkdir($directorioFiles, 0777, true);
                }

                foreach ($imagenes as $key => $elemento) {
                    if (empty($elemento->cadena) || empty($elemento->nombre) || empty($elemento->tipo)) {
                        continue;
                    }

                    fnConvertirBase64_fisico($elemento->cadena, $directorioFiles . "/" . $elemento->nombre);
                    $instruccion .= "('$elemento->nombre','$u_movimiento','" . $_SESSION["UserID"] . "','" . $directorioFiles . "/" . $elemento->nombre . "', CURDATE(), '$elemento->tipo', '$categoria', ''),";
                }
            }

            if (!empty($instruccion)) {
                $SQL = "INSERT INTO `documents`
                    (`name`, `typedoc`, `user_register`, `public`, `register_date`, `tipo`, `categoria`, `archivoblob`) 
                    VALUES " . substr($instruccion, 0, -1) . ";";

                $Result = DB_query($SQL, $db);
            }
        }

        $result = true;

        DB_Txn_Commit($db);
    } catch (Exception $e) {
        DB_Txn_Rollback($db);
        $msjError = $e->getMessage();
        $result = false;
    }
}

if ($option == "ObtenerDocAdmin") {
    DB_Txn_Begin($db);
    try {
        $result = false;
        $idOportunidad = $_POST["idOportunidad"];
        $rows = array();

        /**Obtenemos la cotizacion */
        $sql = "SELECT * FROM salesorders WHERE idprospect = '$idOportunidad';";
        $rsCotizacion = DB_query($sql, $db);

        $rowsCotizaciones = array();
        //echo "DocAdmin";

        while ($rowsCotizacion = mysqli_fetch_object($rsCotizacion)) {
            $rowsCotizaciones[] = [
                'orderno' => $rowsCotizacion->orderno,
                'orddate' => $rowsCotizacion->orddate,
                'tipo' => "Cotizacion",
                'user' => $rowsCotizacion->UserRegister,
                'subtotal' => number_format($rowsCotizacion->taxtotal, '2', '.', ','),
                'iva' => number_format($rowsCotizacion->totaltaxret, '2', '.', ','),
                'total' => number_format(floatval($rowsCotizacion->taxtotal) + floatval($rowsCotizacion->totaltaxret), '2', '.', ','),
            ];
        }


        /**Obtenemos la cotizacion */
        $sql = "SELECT debtortrans.folio, debtortrans.ovamount, debtortrans.ovgst, debtortrans.order_, debtortrans.userid, DATE_FORMAT(debtortrans.trandate,'%d-%m-%Y') as trandate, systypes.typename  
                FROM debtortrans 
                INNER JOIN salesorders ON debtortrans.order_= salesorders.orderno 
                LEFT JOIN systypes ON debtortrans.type = systypes.typeid
                WHERE salesorders.idprospect = '$idOportunidad';";

        $rsTimbres = DB_query($sql, $db);

        $rowsTimbres = array();

        while ($rowTimbre = mysqli_fetch_object($rsTimbres)) {
            $rowsTimbres[] = [
                'orderno' => $rowTimbre->order_,
                'folio' => $rowTimbre->folio,
                'orddate' => $rowTimbre->trandate,
                'tipo' => $rowTimbre->typename,
                'user' => $rowTimbre->userid,
                'subtotal' => number_format($rowTimbre->ovamount, '2', ',', '.'),
                'iva' => number_format($rowTimbre->ovgst, '2', ',', '.'),
                'total' => number_format(floatval($rowTimbre->ovamount) + floatval($rowTimbre->ovgst), '2', ',', '.'),
            ];
        }

        $rows[] = ["cotizaciones" => $rowsCotizaciones, "timbres" => $rowsTimbres];

        $contenido = $rows;
        $result = true;

        DB_Txn_Commit($db);
    } catch (Exception $e) {
        $msjError = $e->getMessage();
        DB_Txn_Rollback($db);
        $result = false;
    }
}

if ($option == 'GuardarCambioEstatus') {
    DB_Txn_Begin($db);

    try {
        $sql = "UPDATE prospect_movimientos 
                SET idstatus= '" . $_POST['cmbCambiarEstatus'] . "', 
                    salesman = '" . $_POST['cmbVendedor03'] . "', 
                    fecha_compromiso='" . $_POST['fechacompromiso'] . "' 
                WHERE u_movimiento = '" . $_POST['u_movimiento'] . "'";

        $contenido = DB_query($sql, $db);
        $result = true;

        $fecha = date("Y-m-d");
        $fecha = $_POST['fechacompromiso'];

        $arrFechaActividad = explode("-", $fecha);

        /*$sql = "INSERT INTO `tasks_movimientos` (`u_proyecto`,
                    `dia`, `mes`, `anio`, `concepto`, `descripcion`, `u_user`, `idstatus`, `fecha_compromiso`, `fecha_alta`, 
                    `u_prospecto`, `titulo`, `u_modulo` ,  `u_funcion`, `TipoMovimientoId`)
                VALUES (
                    0,
                    '".$arrFechaActividad[2]."', 
                    '".$arrFechaActividad[1]."', 
                    '".$arrFechaActividad[0]."',  
                    'Cambio de Etapa', 
                    '".$_POST['txtComentarioCambioEtapa']."', 
                    '".$_SESSION ["UserID"]."', 
                    1, 
                    '".$fecha."', 
                    NOW(), 
                    '".$_POST['u_oportunidad_']."', 
                    '".$_POST['txtTituloActividad']."',
                    '".$_POST['txtEstatusActual']."',
                    '".$_POST['cmbCambiarEstatus']."'
                )";

        $contenido = DB_query ( $sql, $db);*/
        $result = true;

        DB_Txn_Commit($db);
    } catch (Exception $e) {
        $msjError = $e->getMessage();
        DB_Txn_Rollback($db);
        $result = false;
    }
}

if ($option == 'traeProductosEstimados') {
    try {
        // Coonsultar todos los datos generales del prospecto para mostrar en pantalla
        $consulta = "SELECT productos_oportunidad.*, stockmaster.description 
                    FROM productos_oportunidad
                    INNER JOIN stockmaster ON productos_oportunidad.stockid=stockmaster.stockid
                    INNER JOIN prospect_movimientos ON productos_oportunidad.u_movimiento=prospect_movimientos.u_movimiento
                    INNER JOIN prospect_status ON prospect_movimientos.idstatus=prospect_status.idstatus AND productos_oportunidad.etapa=prospect_status.nombrealterno
                    WHERE productos_oportunidad.u_movimiento='" . $_POST["oportunidadid"] . "'";

        $resultado = DB_query($consulta, $db);

        while ($renglon = DB_fetch_array($resultado)) {
            $contenido[] = [
                'id' => $renglon['id'],
                'u_movimiento' => $renglon['u_movimiento'],
                'stockid' => $renglon['stockid'],
                'description' => $renglon['description'],
                'precio' => $renglon['precio'],
                'cantidad' => $renglon['cantidad'],
                'etapa' => $renglon['etapa']
            ];
        }

        $result = true;
    } catch (Exception $e) {
        $msjError = $e->getMessage();
        $result = false;
    }
}

if ($option == 'DuplicarOportunidad') {
    try {
        DB_Txn_Begin($db);

        $oportunidades = json_decode($_POST['oportunidades']);

        $instruccion = "INSERT INTO prospect_movimientos (u_proyecto, dia, mes, anio, concepto, descripcion, cargo, prioridad, u_user, UserId, fecha, activo, idstatus, currcode, fecha_compromiso, fecha_alta, debtorno, branchcode, areacod, clientcontactid, encargado_proyecto, telefono_encargado, km_planta, area_total, tiempo_dedicado, salesman, tiempo_vida, des_tiempo_vida)
                        SELECT u_proyecto, DAY(NOW()), MONTH(NOW()), YEAR(NOW()), concepto, 'Oportunidad Duplicada', 0, prioridad, '" . $_SESSION["UserID"] . "', '" . $_SESSION["UserID"] . "', NOW(), activo, 1, currcode, NOW(), NOW(), debtorno, branchcode, areacod, clientcontactid, encargado_proyecto, telefono_encargado, 0, 0, 0, salesman, 0, 0 
                        FROM prospect_movimientos 
                        WHERE u_movimiento IN (" . implode(',', $oportunidades) . ")";

        DB_query($instruccion, $db);

        $result = true;

        DB_Txn_Commit($db);
    } catch (Exception $e) {
        DB_Txn_Rollback($db);
        $msjError = $e->getMessage();
        $result = false;
    }
}

if ($option == 'rutaReal') {
    try {
        $sql = "SELECT rr.fecha_registro, rr.latitude, rr.longitude  FROM salesman s 
                INNER JOIN royalRoute rr ON s.usersales = rr.userid
                WHERE rr.fecha_modificacion between '" . $_POST["fechaActividad"] . " 00:00:00' AND '" . $_POST["fechaActividad"] . " 23:59:59' AND s.salesmancode = " . $_POST["vendedor"] . "";
        $contenido = DB_query($sql, $db);
        $rowsDatos = array();
        while ($rowIconoDato = mysqli_fetch_object($contenido)) {
            $rowsDatos[] = [
                'lat' => (float)$rowIconoDato->latitude,
                'lng' => (float)$rowIconoDato->longitude,
            ];
        }
        $result = $rowsDatos;
    } catch (Exception $e) {
        $msjError = $e->getMessage();
        $result = false;
    }
}

if ($option == 'traeultimaposicion') {
    try {
        $consulta = "SELECT royalRoute.userid, royalRoute.latitude, royalRoute.longitude, www_users.ImagenUsuario
                        FROM sec_salesmanxuser
                        INNER JOIN salesman ON sec_salesmanxuser.salesmancode=salesman.salesmancode
                        INNER JOIN (
                            SELECT userid, MAX(id) AS id FROM royalRoute GROUP BY userid
                        ) AS coordenadas ON salesman.usersales= coordenadas.userid
                        INNER JOIN royalRoute ON coordenadas.id= royalRoute.id
                        INNER JOIN www_users ON royalRoute.userid=www_users.userid
                        WHERE sec_salesmanxuser.userid= '" . $_SESSION["UserID"] . "'";


        $resultado = DB_query($consulta, $db);

        while ($renglon = DB_fetch_array($resultado)) {
            $contenido[] = [
                'userid' => $renglon['userid'],
                'latitud' => $renglon['latitude'],
                'longitud' => $renglon['longitude'],
                'imagen' => $renglon['ImagenUsuario']
            ];
        }

        $result = true;
    } catch (Exception $e) {
        $msjError = $e->getMessage();
        $result = false;
    }
}


if ($option == 'GuardarSoloFechaCierre') {
    try {

        $u_movimiento = DB_escape_string($_POST['u_movimiento'], $db);
        $fecha_cierre  = DB_escape_string($_POST['fecha_cierre'], $db);

        $sqlPerm = "SELECT permisoCambioFechaCierre FROM www_users WHERE userid = '" . DB_escape_string($_SESSION['UserID'], $db) . "'";
        $rsPerm  = DB_query($sqlPerm, $db);
        $rowPerm = mysqli_fetch_object($rsPerm);

        if (!$rowPerm || !$rowPerm->permisoCambioFechaCierre) {
            $result   = false;
            $msjError = 'Sin permisos para cambiar la fecha de cierre';
        } else {
            $sqlUpdate = "UPDATE prospect_movimientos SET fecha_compromiso = '" . $fecha_cierre . "' WHERE u_movimiento = '" . $u_movimiento . "'";
            DB_query($sqlUpdate, $db);
            $result   = true;
        }
    } catch (Exception $e) {
        $msjError = $e->getMessage();
        $result   = false;
    }
}

$dataObj = array('contenido' => $contenido, 'result' => $result, 'msjError' => $msjError);
echo json_encode($dataObj);

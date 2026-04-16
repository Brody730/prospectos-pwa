<?php
$funcion = 9946;
$PageSecurity = 3;

$rootDir = '/var/www/html/erpdistribucion';
$PathPrefix = $rootDir . '/';
chdir($rootDir);

include($PathPrefix . 'config.php');

if (isset($SessionSavePath)) {
    session_save_path($SessionSavePath);
}

ini_set('session.gc_Maxlifetime', $SessionLifeTime);
ini_set('max_execution_time', $MaximumExecutionTime);

session_start();

include($PathPrefix . 'includes/LanguageSetup.php');

$title = _('Prospectos');

function ProspectosRenderLogin($error = '', $company = 'erprogmai', $user = '')
{
    $company = $company !== '' ? $company : 'erprogmai';
    ?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ROGMAI Prospectos</title>
  <style>
    body{margin:0;font-family:Arial,sans-serif;background:radial-gradient(circle at top,#1e293b 0,#0f1117 55%,#090b10 100%);color:#f8fafc;min-height:100vh;display:flex;align-items:center;justify-content:center}
    .card{width:100%;max-width:420px;margin:24px;padding:28px;border-radius:20px;background:rgba(15,17,23,.92);box-shadow:0 24px 60px rgba(0,0,0,.45);border:1px solid rgba(148,163,184,.12)}
    .logo{width:64px;height:64px;border-radius:16px;background:#2563eb;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:22px;margin-bottom:18px}
    h1{margin:0 0 6px;font-size:28px}
    p{margin:0 0 18px;color:#94a3b8;line-height:1.45}
    label{display:block;font-size:13px;color:#cbd5e1;margin:0 0 6px}
    input{width:100%;box-sizing:border-box;border:1px solid #334155;border-radius:12px;background:#111827;color:#f8fafc;padding:14px 15px;font-size:15px;margin:0 0 14px}
    input:focus{outline:none;border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.18)}
    .btn{width:100%;border:0;border-radius:12px;background:#2563eb;color:#fff;padding:14px 16px;font-size:15px;font-weight:700;cursor:pointer}
    .btn:hover{background:#1d4ed8}
    .error{margin:0 0 16px;padding:12px 14px;border-radius:12px;background:rgba(239,68,68,.14);border:1px solid rgba(239,68,68,.28);color:#fecaca}
    .hint{margin-top:16px;font-size:12px;color:#64748b}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">R</div>
    <h1>ROGMAI Prospectos</h1>
    <p>Acceso directo a la PWA de Prospectos usando la autenticación legacy del ERP.</p>
    <?php if ($error !== '') { ?>
      <div class="error"><?php echo htmlspecialchars($error, ENT_QUOTES, 'UTF-8'); ?></div>
    <?php } ?>
    <form method="post" action="">
      <input type="hidden" name="prospectos_login" value="1">
      <label for="CompanyNameField">Empresa</label>
      <input type="text" id="CompanyNameField" name="CompanyNameField" value="<?php echo htmlspecialchars($company, ENT_QUOTES, 'UTF-8'); ?>">
      <label for="UserNameEntryField">Usuario</label>
      <input type="text" id="UserNameEntryField" name="UserNameEntryField" value="<?php echo htmlspecialchars($user, ENT_QUOTES, 'UTF-8'); ?>">
      <label for="Password">Contraseña</label>
      <input type="password" id="Password" name="Password" value="">
      <button class="btn" type="submit">Entrar</button>
    </form>
    <div class="hint">Mientras tanto, también puedes iniciar sesión en el ERP y luego abrir <strong>/prospectos/</strong>.</div>
  </div>
</body>
</html>
<?php
    exit;
}

function ProspectosCryptPass($password)
{
    global $CryptFunction;

    if ($CryptFunction == 'sha1') {
        return sha1($password);
    } elseif ($CryptFunction == 'md5') {
        return md5($password);
    }

    return $password;
}

function ProspectosAuthenticate($company, $user, $password, $rootDir, &$error)
{
    global $db, $dbType, $host, $dbuser, $dbpassword, $mysqlport, $dbsocket, $PathPrefix;

    if ($company === '') {
        $error = 'Debes indicar la empresa.';
        return false;
    }

    if (!is_dir($rootDir . '/companies/' . $company)) {
        $error = 'La empresa indicada no existe en esta instalación.';
        return false;
    }

    $_SESSION['DatabaseName'] = $company;
    setcookie('defaultempresa', $company, 0, '/erpdistribucion/');

    error_log('PWA Prospectos login init company=' . $company
        . ' DatabaseName=' . $_SESSION['DatabaseName']
        . ' dbhost=' . $host
        . ' dbuser=' . $dbuser);

    include_once($rootDir . '/includes/ConnectDB_' . $dbType . '.inc');

    $sql = "SELECT www_users.fullaccess,
                www_users.customerid,
                www_users.lastvisitdate,
                www_users.pagesize,
                www_users.defaultarea,
                www_users.branchcode,
                www_users.modulesallowed,
                www_users.blocked,
                www_users.realname,
                www_users.theme,
                www_users.displayrecordsmax,
                www_users.userid,
                www_users.language,
                www_users.salesman,
                www_users.defaultunidadNegocio,
                www_users.discount1,
                www_users.discount2,
                www_users.discount3,
                www_users.creditlimit,
                www_users.email
            FROM www_users
            WHERE www_users.userid='" . DB_escape_string($user) . "'
            AND (www_users.password='" . ProspectosCryptPass(DB_escape_string($password)) . "'
            OR www_users.password='" . DB_escape_string($password) . "')";
    $authResult = DB_query($sql, $db);

    if (DB_num_rows($authResult) <= 0) {
        $error = 'La combinación de usuario y contraseña no es válida.';
        unset($_SESSION['UserID']);
        unset($_SESSION['DatabaseName']);
        return false;
    }

    $myrow = DB_fetch_row($authResult);
    if ($myrow[7] == 1) {
        $error = 'La cuenta se encuentra bloqueada.';
        unset($_SESSION['UserID']);
        unset($_SESSION['DatabaseName']);
        return false;
    }

    $_SESSION['AttemptsCounter'] = 0;
    $_SESSION['AccessLevel'] = $myrow[0];
    $_SESSION['CustomerID'] = $myrow[1];
    $_SESSION['UserBranch'] = $myrow[5];
    $_SESSION['DefaultPageSize'] = $myrow[3];
    $_SESSION['ModulesEnabled'] = explode(',', $myrow[6]);
    $_SESSION['UsersRealName'] = $myrow[8];
    $_SESSION['Theme'] = $myrow[9];
    $_SESSION['UserID'] = $myrow[11];
    $_SESSION['Language'] = $myrow[12];
    $_SESSION['SalesmanLogin'] = $myrow[13];
    $_SESSION['DefaultUnidad'] = $myrow[14];
    $_SESSION['discount1'] = $myrow[15];
    $_SESSION['discount2'] = $myrow[16];
    $_SESSION['discount3'] = $myrow[17];
    $_SESSION['creditlimit'] = $myrow[18];
    $_SESSION['usremail'] = $myrow[19];
    $_SESSION['DefaultArea'] = $myrow[4];
    $_SESSION['DisplayRecordsMax'] = $myrow[10] > 0 ? $myrow[10] : 15;

    $sql = "UPDATE www_users
            SET lastvisitdate='" . date('Y-m-d H:i:s') . "'
            WHERE www_users.userid='" . DB_escape_string($user) . "'";
    DB_query($sql, $db);

    $sql = 'SELECT tokenid FROM securitygroups
            WHERE secroleid = ' . $_SESSION['AccessLevel'];
    $secResult = DB_query($sql, $db);

    $_SESSION['AllowedPageSecurityTokens'] = array();
    if (DB_num_rows($secResult) == 0) {
        $error = 'Tu usuario no tiene grupos de seguridad configurados.';
        unset($_SESSION['UserID']);
        unset($_SESSION['DatabaseName']);
        return false;
    }

    $i = 0;
    while ($secRow = DB_fetch_row($secResult)) {
        $_SESSION['AllowedPageSecurityTokens'][$i] = $secRow[0];
        $i++;
    }

    include($rootDir . '/includes/GetConfig.php');
    error_log('PWA Prospectos login ok company=' . $company
        . ' DatabaseName=' . $_SESSION['DatabaseName']
        . ' dbhost=' . $host
        . ' dbuser=' . $dbuser
        . ' UserID=' . $_SESSION['UserID']);

    return true;
}

$loginCompany = isset($_POST['CompanyNameField']) ? trim($_POST['CompanyNameField']) : (isset($_COOKIE['defaultempresa']) ? $_COOKIE['defaultempresa'] : 'erprogmai');
$loginUser = isset($_POST['UserNameEntryField']) ? trim($_POST['UserNameEntryField']) : '';
$loginError = '';

if (!empty($_POST['prospectos_login'])) {
    if ($loginCompany === '') {
        $loginCompany = 'erprogmai';
    }

    if ($loginUser === '' || empty($_POST['Password'])) {
        $loginError = 'Ingresa empresa, usuario y contraseña.';
        ProspectosRenderLogin($loginError, $loginCompany, $loginUser);
    }

    if (ProspectosAuthenticate($loginCompany, $loginUser, $_POST['Password'], $rootDir, $loginError)) {
        header('Location: index.php');
        exit;
    }

    ProspectosRenderLogin($loginError, $loginCompany, $loginUser);
}

if (empty($_SESSION['UserID']) || empty($_SESSION['DatabaseName'])) {
    ProspectosRenderLogin('', $loginCompany, $loginUser);
}

include($PathPrefix . 'includes/ConnectDB.inc');
include($PathPrefix . 'includes/SQL_CommonFunctions.inc');

function ProspectosHavePermission($consultausuario, $funcionvalida, &$db)
{
    $secFunctionTable = empty($_SESSION['SecFunctionTable']) ? 'sec_functions' : $_SESSION['SecFunctionTable'];
    $querySQL = " SELECT 1 as permiso
            FROM sec_modules s, sec_submodules sm, www_users u,
              sec_profilexuser PU, sec_funxprofile FP,
              $secFunctionTable FuxP, sec_categories C
            WHERE s.moduleid=sm.moduleid and s.active=1
              and FP.profileid=PU.profileid and FuxP.submoduleid=sm.submoduleid and C.categoryid=FuxP.categoryid
              and u.userid=PU.userid and PU.userid='" . $consultausuario . "'
              and u.userid=PU.userid and FuxP.functionid=FP.functionid
              and FP.functionid=" . $funcionvalida . "
              and FuxP.active=1
              and FuxP.functionid not in (select functionid from sec_funxuser where userid='" . $consultausuario . "')
           UNION
           SELECT PU.permiso as permiso
           FROM sec_modules s, sec_submodules sm, www_users u,
              $secFunctionTable FuxP, sec_categories C, sec_funxuser PU
           WHERE s.moduleid=sm.moduleid and s.active=1
              and FuxP.submoduleid=sm.submoduleid and C.categoryid=FuxP.categoryid
              and u.userid=PU.userid and PU.userid='" . $consultausuario . "'
              and u.userid=PU.userid and FuxP.functionid=PU.functionid
              and FuxP.functionid=" . $funcionvalida . "
              and FuxP.active=1";

    $getPermission = DB_query($querySQL, $db, _('No Tiene Permisos'));
    if (DB_num_rows($getPermission) == 1) {
        $myrowpermiso = DB_fetch_row($getPermission);
        return (int)$myrowpermiso[0];
    }

    return 0;
}

$userid = $_SESSION['UserID'];
$databaseName = isset($_SESSION['DatabaseName']) ? $_SESSION['DatabaseName'] : '';
$permisoPagina = ProspectosHavePermission($userid, $funcion, $db);

error_log('PWA Prospectos acceso user=' . $userid . ' db=' . $databaseName . ' functionid=' . $funcion . ' permiso=' . $permisoPagina);

if ($permisoPagina !== 1) {
    error_log('PWA Prospectos acceso denegado user=' . $userid . ' db=' . $databaseName . ' functionid=' . $funcion);
    ?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Prospectos — Acceso denegado</title>
  <style>
    body{margin:0;font-family:Arial,sans-serif;background:#0f1117;color:#f3f4f6;display:flex;min-height:100vh;align-items:center;justify-content:center}
    .card{max-width:460px;margin:24px;padding:24px;border-radius:16px;background:#171923;box-shadow:0 16px 40px rgba(0,0,0,.35)}
    h1{margin:0 0 12px;font-size:22px}
    p{margin:0 0 10px;color:#cbd5e1;line-height:1.45}
    .meta{margin-top:16px;padding-top:16px;border-top:1px solid #2a2f3a;font-size:12px;color:#94a3b8}
    .btn{display:inline-block;margin-top:16px;padding:10px 14px;border-radius:10px;background:#2563eb;color:#fff;text-decoration:none}
  </style>
</head>
<body>
  <div class="card">
    <h1>No tiene acceso a Prospectos</h1>
    <p>Su sesión del ERP está activa, pero la seguridad legacy no le permite abrir esta función.</p>
    <p>Revise el permiso del functionid <strong><?php echo (int)$funcion; ?></strong> para este usuario.</p>
    <div class="meta">
      <div>UserID: <?php echo htmlspecialchars($userid, ENT_QUOTES, 'UTF-8'); ?></div>
      <div>DatabaseName: <?php echo htmlspecialchars($databaseName, ENT_QUOTES, 'UTF-8'); ?></div>
      <div>FunctionID: <?php echo (int)$funcion; ?></div>
    </div>
    <a class="btn" href="../index.php">Volver al ERP</a>
  </div>
</body>
</html>
<?php
    exit;
}

// Permisos del sistema
$permisoVerTodos    = ProspectosHavePermission($userid, 2055, $db); // Ver todos los vendedores
$permisoVendedores  = ProspectosHavePermission($userid, 859, $db);  // Asignar vendedor
$permisoPoligonos   = ProspectosHavePermission($userid, 2251, $db); // Editar polígonos mapa
$permisoAutorizarOV = ProspectosHavePermission($userid, 2090, $db); // Autorizar OV

$sessionData = json_encode(array(
    'userid'         => $userid,
    'username'       => isset($_SESSION['UsersRealName']) ? $_SESSION['UsersRealName'] : $userid,
    'databaseName'   => $databaseName,
    'functionid'     => $funcion,
    'showAllSalesman'=> isset($_SESSION['ShowAllSalesman']) ? (int)$_SESSION['ShowAllSalesman'] : 0,
    'permisoVerTodos'=> (bool)$permisoVerTodos,
    'permisoVendedores'  => (bool)$permisoVendedores,
    'permisoPoligonos'   => (bool)$permisoPoligonos,
    'permisoAutorizarOV' => (bool)$permisoAutorizarOV,
));
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <meta name="session-data" content='<?php echo htmlspecialchars($sessionData, ENT_QUOTES, 'UTF-8'); ?>'>
  <meta name="theme-color" content="#0f1117">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Prospectos">
  <title>Prospectos — ROGMAI</title>
  <link rel="manifest" href="manifest.json">
  <link rel="apple-touch-icon" href="assets/icons/icon-192.png">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">
  <link rel="stylesheet" href="assets/app.css">
</head>
<body>

  <!-- BANNER OFFLINE -->
  <div id="offlineBanner" class="offline-banner" style="display:none">
    <span class="offline-dot"></span>
    <span id="offlineText">Sin conexión</span>
    <button class="btn-sync" onclick="SyncDB.sincronizar()">Sync</button>
  </div>

  <!-- CONTENEDOR DE VISTAS -->
  <main id="mainContent">
    <div id="view-panel"  class="view active"></div>
    <div id="view-lista"  class="view"></div>
    <div id="view-detalle" class="view"></div>
    <div id="view-agenda" class="view"></div>
    <div id="view-mapa"   class="view"></div>
    <div id="view-perfil" class="view"></div>
  </main>

  <!-- FAB nuevo prospecto (visible en lista) -->
  <button id="fabNuevo" class="fab" style="display:none" onclick="PWA.NuevoProspecto.abrir()">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  </button>

  <!-- NAV INFERIOR -->
  <nav class="bottom-nav" id="bottomNav">
    <button class="nav-item active" data-view="panel" onclick="PWA.navegarA('panel')">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
      <span>Panel</span>
    </button>
    <button class="nav-item" data-view="lista" onclick="PWA.navegarA('lista')">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
        <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
        <circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/>
      </svg>
      <span>Lista</span>
    </button>
    <button class="nav-item" data-view="agenda" onclick="PWA.navegarA('agenda')">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      <span class="badge-wrap">Agenda<span id="badgeAgenda" class="badge" style="display:none">0</span></span>
    </button>
    <button class="nav-item" data-view="mapa" onclick="PWA.navegarA('mapa')">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
        <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
      </svg>
      <span>Mapa</span>
    </button>
    <button class="nav-item" data-view="perfil" onclick="PWA.navegarA('perfil')">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
      <span>Perfil</span>
    </button>
  </nav>

  <!-- Scripts -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
  <script src="assets/sync.js"></script>
  <script src="assets/map.js"></script>
  <script src="assets/app.js"></script>
  <script src="install-prompt.js"></script>
</body>
</html>

# CONTEXTO MAESTRO — PWA Prospectos ROGMAI
# Archivo: CONTEXTO_MAESTRO.md
# Ubicación: ~/ERP-GITHUB-VERSIONADO/erpdistribucion/CONTEXTO_MAESTRO.md
# 
# INSTRUCCIÓN PARA CODEX:
# Lee este archivo AL INICIO de cada sesión.
# Al terminar cualquier feature o corrección, actualiza la sección
# "HISTORIAL DE CAMBIOS" y el "ESTADO ACTUAL" con lo que hiciste.
# Guarda el archivo. Incluye el archivo en el git commit.
# ─────────────────────────────────────────────────────────────────

---

## QUIÉN SOY

Soy Jozet, desarrollador del ERP ROGMAI.
Trabajo con Claude (para arquitectura y prompts) y Codex (para ejecutar código).

---

## RUTAS — MUY IMPORTANTE

```
# Máquina local (donde corre Codex)
~/ERP-GITHUB-VERSIONADO/erpdistribucion/

# Servidor producción (Amazon Linux 2)
/var/www/html/erpdistribucion/

# URL producción
https://erprogmai.portalito.com/prospectos/

# ERP desktop original (NO TOCAR)
https://erprogmai.portalito.com/erpdistribucion/paneldecontrolprospectos.php
```

## FLUJO DE DEPLOY

```
Codex edita archivos locales
    ↓
Codex hace git commit (NO git push — no tiene acceso HTTPS)
    ↓
Jozet hace manualmente:
    git push origin main
    ↓
En el servidor:
    cd /var/www/html/erpdistribucion && git pull origin main
    ↓
Probar en browser
```

**REGLA FIJA:** Codex NUNCA hace git push. Solo commit. Jozet hace el push.

---

## EL PROYECTO

### Qué estamos construyendo
PWA mobile-first para vendedores de campo del ERP ROGMAI.
Ruta: `/prospectos/`

### Usuario objetivo
Vendedores de campo con celulares desde iPhone mini hasta Android 5.x viejito.
En movimiento, mala señal, a veces sin internet.

### Principio de diseño
SIMPLIFICAR. Si en el ERP desktop son 5 clics, en la PWA debe ser 1.
Botones grandes, cards claras, colores con significado.

---

## STACK TÉCNICO — RESTRICCIONES DURAS

```
Servidor:   Amazon Linux 2, PHP 5, MySQL legacy
            Sin Composer, sin PDO moderno, sin operador ??
            Funciones propias: DB_query($sql,$db), DB_fetch_array($rs)
            Transacciones: DB_Txn_Begin($db) / DB_Txn_Commit($db) / DB_Txn_Rollback($db)
            PathPrefix desde prospectos/api/ = '../../'
            PathPrefix desde prospectos/ = '../'

Frontend:   Vanilla JS ES6 — sin npm, sin webpack, sin import/export
            Sin React, sin Vue, sin jQuery nuevo
            Compatible: iOS Safari 11.3+ y Chrome Android 60+

CSS:        Mobile-first, sin Tailwind, sin Bootstrap
            Variables CSS propias en assets/app.css

Mapas:      Leaflet.js 1.9.x desde cdnjs.cloudflare.com
            Sin Google Maps API key

Offline:    Service Worker + IndexedDB nativos
            Sin librerías externas de sync

Auth:       $_SESSION['UserID'] del ERP existente
            Bootstrap: $funcion = 9946; $PageSecurity = 3; $PathPrefix = '../';
            include('../includes/session.inc');
```

---

## PALETA DE COLORES

```css
:root {
  --pwa-bg: #0f1117;
  --pwa-card: #1a1d27;
  --pwa-card2: #22263a;
  --pwa-accent: #4f8ef7;    /* Azul — acción principal */
  --pwa-accent2: #34d399;   /* Verde — al corriente */
  --pwa-warn: #f59e0b;      /* Amarillo — hoy / pendiente */
  --pwa-danger: #ef4444;    /* Rojo — vencido / urgente */
  --pwa-text: #f1f5f9;
  --pwa-muted: #8892a4;
  --pwa-border: rgba(255,255,255,0.08);
  --pwa-radius: 16px;
  --pwa-radius-sm: 10px;
}
```

**Código de color borde izquierdo de card:**
- ROJO `#ef4444` → vencido (fecha actividad < hoy)
- AMARILLO `#f59e0b` → actividad hoy
- VERDE `#34d399` → al corriente
- AZUL `#4f8ef7` → nuevo / sin actividad

---

## ESTRUCTURA DE ARCHIVOS

```
prospectos/
├── index.php              ← Shell PWA + auth gate legacy
├── manifest.json          ← PWA: standalone, portrait, dark
├── sw.js                  ← Service Worker
├── CONTEXTO_MAESTRO.md    ← ESTE ARCHIVO — leerlo siempre
├── assets/
│   ├── app.css            ← Dark theme completo
│   ├── app.js             ← Lógica de todas las vistas
│   ├── map.js             ← Leaflet + GPS
│   └── sync.js            ← IndexedDB + cola offline
└── api/
    ├── prospectos.php     ← API principal de prospectos (SQL directo)
    ├── agenda.php         ← Actividades / agenda
    ├── geo.php            ← GPS / royalRoute
    ├── sync.php           ← Cola offline → BD
    └── chat.php           ← Wrapper ChatModelo

# NUNCA TOCAR:
modelo/ProspectV2Modelo.php    ← Core legacy procedural
modelo/ChatModelo.php          ← Chat legacy
paneldecontrolprospectos.php   ← Panel desktop original
```

---

## TABLAS DE BD — SCHEMA VERIFICADO CON DESCRIBE

```sql
-- ⚠️ SCHEMA REAL confirmado con DESCRIBE en producción (2026-04-14)
-- NO modificar sin verificar en la BD

prospect_movimientos
    u_movimiento    int PK autoincrement
    debtorno        varchar(20)
    branchcode      varchar(20)
    idstatus        int
    salesman        int(4)          ← ES INT, no varchar
    cargo           decimal(18,2)   ← valor estimado
    fecha_compromiso date
    activo          int (1=activo)
    fecha_alta      datetime

debtorsmaster
    debtorno        varchar(10) PK
    name            varchar(255)    ← nombre prospecto
    address1-6      varchar         ← dirección (address1, address2, address3, address4...)
    telefonocelular varchar(15)     ← celular (NO hay columna phoneno aquí)
    -- ⚠️ phoneno NO existe en debtorsmaster — está en custbranch

custbranch
    branchcode      varchar(20) PK
    debtorno        varchar(20) PK
    salesman        varchar(6)      ← código vendedor
    phoneno         varchar(20)     ← teléfono principal ✓
    email           varchar(55)     ← email ✓
    lat             float(10,6)     ← GPS latitud ✓ (usar para pins de mapa)
    lng             float(10,6)     ← GPS longitud ✓
    braddress1-6    varchar         ← dirección de la sucursal
    SectComClId     int
    -- ⚠️ address1 NO existe en custbranch — las de debtorsmaster se llaman address1-6
    -- ⚠️ las de custbranch se llaman braddress1-6

tasks_movimientos
    u_movimiento    int PK autoincrement   ← ID del task (alias u_task en API)
    u_prospecto     int                    ← FK → prospect_movimientos.u_movimiento
    fecha_compromiso date
    hora            time
    TipoMovimientoId int
    idstatus        int
    concepto        varchar(2000)
    descripcion     text
    titulo          varchar(250)
    u_user          varchar(40)            ← UserID de quien creó el task

prospect_status         -- idstatus, nombre, nombrealterno, marcainicial, logo  (NO tiene 'orden')
salesman                -- salesmancode varchar(6), salesmanname, usersales(→userid)
www_users               -- userid, realname, email, ImagenUsuario
oportunidad_tipo        -- id, descripcion, color, iconodia
prdstatussimple         -- idstatus, final (0=activa, 1=cerrada)
documents               -- iddoc, name, typedoc(=u_movimiento), user_register, public, register_date, tipo
chat_erp                -- de_usuario, para_usuario, mensaje, leido, u_movimiento, nombre_prospecto, fecha
royalRoute              -- userid, latitude, longitude, fecha_registro, fecha_modificacion
poligonos               -- id, area, longitud, latitud, color, orden
Custleadsource          -- CustLeadSourceId, CustLeadSourceNom
SectComercialCl         -- SectComClId, SectComClNom
```

---

## OPCIONES REALES DEL MODELO LEGACY

### ProspectV2Modelo.php — script procedural, usa $_POST['option']

**IMPORTANTE:** Este modelo NO tiene clase ni métodos. Es un script que lee
$_POST['option'] y al final hace echo json_encode($dataObj).
La lista de prospectos NO está en el modelo — hay que hacerla con SQL directo.

Opciones confirmadas que SÍ existen:
```
obtenerImagenesOportunidad  → fotos (param: idOportunidad)
EliminarImagen              → eliminar foto (param: idarchivo)
obtenerCheckTiempoVida      → checklist tiempo de vida
insertarEtapaA              → crear prospecto nuevo
GuardarActividad            → nueva actividad/seguimiento
GuardarCambioEstatus        → cambiar etapa (params: u_movimiento, cmbCambiarEstatus, cmbVendedor03, fechacompromiso)
traeultimaposicion          → última posición GPS vendedores
rutaReal                    → ruta GPS por día (params: fechaActividad, vendedor)
DuplicarOportunidad         → duplicar (param: oportunidades[])
traeProductosEstimados      → productos en oportunidad (param: oportunidadid)
ObtenerDocAdmin             → cotizaciones y timbres (param: idOportunidad)
```

### ChatModelo.php — usa $_POST['option']
```
EnviarMensaje    → params: para_usuario, mensaje, u_movimiento, nombre_prospecto
TraerMensajes    → params: para_usuario, u_movimiento
ContarNoLeidos   → sin params
```

---

## PERMISOS DEL SISTEMA

```php
Havepermission($userid, 2055, $db)  // Ver todos los vendedores (ShowAllSalesman)
Havepermission($userid, 859, $db)   // Asignar vendedor
Havepermission($userid, 2251, $db)  // Editar polígonos mapa
Havepermission($userid, 2090, $db)  // Autorizar OV
```

Admins con chat: `['desarrollo', 'asantacruz', 'iflores', 'ilores']`

---

## QUERY BASE DE LISTA DE PROSPECTOS

```sql
SELECT
    pm.u_movimiento,
    pm.idstatus,
    ps.nombre AS etapa,
    ps.nombrealterno,
    d.debtorno,
    d.name AS prospecto,
    d.phoneno,
    d.email,
    cb.salesman,
    s.salesmanname,
    s.usersales AS vendedor_userid,
    pm.cargo AS valor_estimado,
    cb.address1,
    cb.address3,
    cb.address4,
    cb.link_google_map,
    tm.fecha_compromiso AS fecha_actividad,
    tm.hora,
    ot.descripcion AS tipo_actividad,
    ot.color AS color_actividad
FROM prospect_movimientos pm
INNER JOIN debtorsmaster d ON pm.debtorno = d.debtorno
INNER JOIN custbranch cb ON pm.debtorno = cb.debtorno AND pm.branchcode = cb.branchcode
INNER JOIN prospect_status ps ON pm.idstatus = ps.idstatus
INNER JOIN salesman s ON cb.salesman = s.salesmancode
LEFT JOIN tasks_movimientos tm ON pm.u_movimiento = tm.u_prospecto
    AND tm.idstatus IN (SELECT idstatus FROM prdstatussimple WHERE final = 0)
LEFT JOIN oportunidad_tipo ot ON tm.TipoMovimientoId = ot.id
WHERE pm.activo = 1
-- Si NO tiene permiso 2055: AND s.usersales = '$userid'
-- Si SÍ tiene permiso 2055: sin filtro de vendedor
ORDER BY pm.u_movimiento DESC
```

---

## HISTORIAL DE CAMBIOS

### Paso 1 — Estructura base PWA [COMPLETO ✅]
- Creados: index.php, manifest.json, sw.js, assets/app.css, assets/app.js,
  assets/map.js, assets/sync.js, api/prospectos.php, api/agenda.php,
  api/geo.php, api/sync.php, api/chat.php
- Dark theme completo con variables CSS
- 5 vistas: Panel, Lista, Agenda, Mapa, Perfil
- Service Worker con cache de assets
- IndexedDB con sync_queue, prospectos_cache, agenda_cache
- Commit: feat: PWA Prospectos — módulo mobile-first para vendedores de campo

### Paso 1b — Google Calendar integration [COMPLETO ✅]
- PWA.abrirGoogleCalendar() en app.js
- Botón en: cada card de Agenda, detalle de prospecto, toast post-guardar
- Formato fechas YYYYMMDDTHHmmss, duración 1 hora por defecto
- encodeURIComponent en todos los parámetros

### Paso 2A — Fix bootstrap legacy [COMPLETO ✅]
- prospectos/index.php: $funcion=9946, $PageSecurity=3, $PathPrefix='../'
- Usa includes/session.inc en lugar de session_start() manual
- Se eliminó redirección manual duplicada
- Commit: Fix prospectos PWA legacy security bootstrap

### Paso 2B — Fix Service Worker tiles OSM [COMPLETO ✅]
- sw.js fetch handler corregido:
  - tile.openstreetmap.org → no interceptar (return sin respondWith)
  - cdnjs.cloudflare.com → cache first
  - /prospectos/ → network first, cache fallback
  - cualquier otra URL externa → no interceptar
- Commit: fix(pwa): avoid sw fetch undefined responses for external map tiles

### Paso 2C — Conexión datos reales [COMPLETO ✅]
- api/prospectos.php reescrito como script procedural PHP 5
- SQL directo con JOIN de las tablas del ERP
- Los datos llegan: montos correctos ($534k, $775k, etc.), colores de borde OK
- Búsqueda funciona, filtros de pills funcionan
- Mapa carga con GPS (punto azul en Querétaro)
- Perfil muestra usuario, sincronización, conexión
- Detalle de prospecto muestra nombre, dirección, teléfono, email
- Botones Llamar, WhatsApp, Mapa presentes

### Paso 10 — Schema verificado + búsqueda funcional + lat/lng en SELECT [COMPLETO ✅]

**Búsqueda:** `total: 40` para "Colegio" — funciona correctamente.
**Schema real** obtenido con DESCRIBE en producción. Correcciones al CONTEXTO_MAESTRO:
- `debtorsmaster`: tiene `address1-6`, NO tiene `phoneno` ni `email`
- `custbranch`: tiene `phoneno`, `email`, `lat`, `lng`, `braddress1-6` (NO `address1`)
- `prospect_movimientos.salesman` es `int(4)`, no varchar
- `tasks_movimientos.u_movimiento` = PK del task, `u_prospecto` = FK al prospecto
- `prospect_status` NO tiene columna `orden`

**Fix en `api/prospectos.php`:**
- Añadido `cb.lat AS latitude`, `cb.lng AS longitude` al SELECT
  (habilita pins de mapa sin queries adicionales)
- Error handler de DB_query vuelve a mensaje genérico (sin texto diagnóstico)
- Error_log de SQL de búsqueda eliminado (ya no necesario)

**Próximo paso:** usar `latitude`/`longitude` en `map.js` para mostrar pins.

### Paso 9 — Fix cb.address1 → d.address1 (address está en debtorsmaster) [COMPLETO ✅]

**Error confirmado:** `Unknown column 'cb.address1' in 'field list'`

**Causa:** En Paso 3 cambié `d.address1/3/4` → `cb.address1/3/4` incorrectamente.
Las columnas de dirección (`address1`, `address3`, `address4`) están en `debtorsmaster`,
no en `custbranch`.

**Fix:** `cb.address1/3/4` → `d.address1/3/4` en el CONCAT del SELECT.
**Schema CONTEXTO_MAESTRO corregido** con advertencias claras de qué va en cada tabla.

**Archivos:** `api/prospectos.php`, `CONTEXTO_MAESTRO.md`

### Paso 8 — Diagnóstico búsqueda: simplificar WHERE + ORDER BY + exponer error SQL [COMPLETO ✅]

**Estado:** búsqueda devuelve `{ result: false, msjError: "SQL error: ..." }` — primer char es `{`
JSON ya es limpio, el error viene del DB_query.

**Cambios:**
- WHERE busqueda: quitado `cb.email` del LIKE (solo nombre + teléfono, confirmados)
- ORDER BY: eliminado `ps.orden` (no existe en schema de prospect_status) y
  `pm.fecha_compromiso` (potencial columna inexistente) — reemplazado por
  `IF(tm.fecha_compromiso IS NULL, 0, 1), tm.fecha_compromiso, tm.hora, prospecto`
- Error handler: ahora devuelve el texto real del error SQL (primeros 300 chars)
  para diagnosticar → quitar `substr($errTexto,0,300)` cuando se resuelva

**Fetch de diagnóstico:**
```js
fetch('/prospectos/api/prospectos.php', {
  method:'POST', headers:{'Content-Type':'application/json'},
  credentials:'same-origin',
  body: JSON.stringify({ option:'TraerProspectos', busqueda:'Colegio' })
}).then(r=>r.json()).then(d => console.log(d.msjError))
```
→ El `msjError` dirá exactamente qué columna falla.

### Paso 7 — Fix columna phoneno/email en custbranch + DB_query buffering [COMPLETO ✅]

**Problema confirmado desde browser:**
`Unknown column 'd.phoneno' in 'field list'`
`DB_query` del ERP emitía HTML de error que tampoco era JSON.

**Causa raíz:**
- `phoneno` y `email` NO están en `debtorsmaster` — están en `custbranch`
- El schema en CONTEXTO_MAESTRO era incorrecto; fue corregido arriba
- `ini_set('display_errors',0)` del paso anterior suprime PHP warnings pero NO el
  HTML que emite `DB_query()` del ERP cuando falla una query MySQL

**Fixes en `api/prospectos.php`:**
1. SELECT: `d.phoneno` → `cb.phoneno`, `d.email` → `cb.email`
2. WHERE busqueda: `d.phoneno` → `cb.phoneno`, `d.email` → `cb.email`
3. Ambos `DB_query()` envueltos en `ob_start()/ob_get_clean()`:
   si DB_query emite HTML de error → se captura, se loguea, se devuelve JSON limpio

**Fix en `api/agenda.php`:** mismo patrón ob_start en el DB_query principal.

**Archivos:** `api/prospectos.php`, `api/agenda.php`, `CONTEXTO_MAESTRO.md`

**Commit:** fix(pwa): correct phoneno/email to custbranch and buffer DB_query HTML errors

### Paso 6 — Fix APIs devuelven HTML en vez de JSON + toast offline [COMPLETO ✅]

**Problema confirmado desde browser:** `SyntaxError: JSON.parse unexpected character`
→ PHP devolvía HTML (warnings/notices) antes del JSON.

**Causa raíz:** `config.php` y/o `ConnectDB.inc` emiten output (warnings PHP, notices,
HTML de error) antes de que el script llegue a `header('Content-Type: application/json')`.
En PHP 5 con `display_errors = On` en el servidor, cualquier notice contamina la respuesta.

**Fix aplicado en los 5 archivos de api/:**
1. `ini_set('display_errors', 0)` — suprime errores en output (se siguen logueando)
2. `ob_start()` antes de los includes — captura cualquier output de config/ConnectDB
3. `ob_end_clean()` después de los includes — descarta el output capturado
4. `header('Content-Type: application/json')` después de ob_end_clean — garantizado limpio
5. `try { ... } catch (Exception $e)` envuelve toda la lógica — devuelve JSON en error

**Toast offline falso (Bug 2 de esta sesión):**
- El toast "Modo offline — datos guardados" aparecía cuando la API devolvía HTML
  (el fetch fallaba, se usaba cache, el toast se disparaba sin verificar conectividad)
- Fix: `!navigator.onLine` como condición adicional — toast solo aparece si realmente offline

**Archivos:** `api/prospectos.php`, `api/agenda.php`, `api/geo.php`, `api/sync.php`,
`api/chat.php`, `assets/app.js`

**Commit:** fix(pwa): force JSON headers in all APIs and fix offline toast condition

### Paso 5 — Fix regresión: búsqueda rota por DB_escape_string [COMPLETO ✅]

**Problema:** La búsqueda en la Lista de Prospectos dejó de funcionar después del Paso 3.

**Causa raíz:** `api/prospectos.php` usaba `DB_escape_string($busqueda)` — función que
no existe en este ERP (PHP 5, sin extensión mysql_escape_string activa). Cuando el usuario
escribía en el buscador, PHP lanzaba un fatal error silencioso que mataba la request.
Sin búsqueda (`$busqueda` vacío) la query corría bien, por eso solo se notaba al buscar.

**Fix:** `DB_escape_string()` → `addslashes()` (nativo PHP 5).
Se agrega `error_log` del SQL completo cuando hay búsqueda activa (diagnóstico temporal).

**Por qué no se vio antes:** El bug existía antes del Paso 3 pero la búsqueda usaba `cb.phoneno`
que coincidía con el campo incorrecto; al corregir a `d.phoneno` se hizo más evidente.

**Archivos:** `api/prospectos.php`

**Commit:** fix(pwa): restore search functionality broken by field mapping fix

### Paso 4 — Fix offline banner, agenda locale, agenda API [COMPLETO ✅]

**Bug 1 — Banner offline aparece cuando hay conexión:**
- Causa: CSS `.offline-banner { display: flex }` — era el default visible antes de que corriera el JS
- Fix: CSS cambiado a `display: none` por defecto, clase `.visible` la activa
- JS actualizado: usa `classList.add/remove('visible')` en lugar de `banner.style.display`
- El texto del banner espera a `SyncDB.contarPendientes` antes de mostrarse

**Bug 2 — Agenda mostraba fecha en inglés / fecha incorrecta:**
- Causa: no había título de mes/año en la Agenda; el strip tenía un rango asimétrico (−2 a +6)
- Fix: se agrega `<p class="section-title">Abril 2026</p>` con nombres de meses hardcodeados en español
- Strip centrado simétricamente: −3 a +3 (7 días exactos centrados en hoy)
- Variantes de nombre de día ya estaban en español

**Bug 3 — Agenda sin actividades (API con SQL roto):**
- Causa: `pm.nombre` no existe (debe ser `d.name`), `d.DebtorName`/`d.DebtorNo` incorrecto
  (deben ser `d.name`/`d.debtorno`), `tm.u_user` no existe — el filtro por vendedor
  debe ir por `pm.salesman → salesman.usersales`
- Fix: reescritura completa de `api/agenda.php`:
  - JOINs correctos con columnas en minúsculas
  - `tm.u_movimiento AS u_task`, `tm.u_prospecto AS u_movimiento` para compatibilidad app.js
  - Filtro por vendedor via `pm.salesman IN (SELECT salesmancode FROM salesman WHERE usersales=?)`
  - Rango ±3 días consistente con el strip de la UI
  - Se eliminó `TraerActividadDetalle` (no usado por app.js)

**Archivos modificados:**
- `assets/app.css` — `.offline-banner` default `display:none`, clase `.visible`
- `assets/app.js` — `detectarOnline()` usa `classList`, Agenda agrega título español, strip −3..+3
- `api/agenda.php` — reescritura completa del SQL

**Commit:** fix(pwa): fix offline banner, agenda locale and agenda API connection

### Paso 3 — Fix "Sin nombre" en cards [COMPLETO ✅]
**Problema:** Las cards mostraban "Sin nombre" y "—" como subtítulo.

**Causa raíz (3 bugs):**
1. `app.js renderCard` usaba `p.nombre` → API envía `p.prospecto`
2. `app.js renderCard` usaba `p.telefono`/`p.PhoneNo` → API envía `p.phoneno`
3. `app.js renderCard` usaba `p.SectComercialNombre` → API envía `p.salesmanname`
4. `app.js renderCard` usaba `p.etapaNombre`/`p.statusNombre` → API envía `p.etapa`
5. `api/prospectos.php` JOIN de custbranch incorrecto: `d.debtorno = cb.branchcode` → corregido a `pm.branchcode = cb.branchcode`
6. `api/prospectos.php` `cb.phoneno`/`cb.email` → `d.phoneno`/`d.email` (están en debtorsmaster)
7. Dirección corregida a usar `cb.address1/3/4` (custbranch tiene las columnas correctas)

**Archivos modificados:**
- `assets/app.js` — renderCard y Panel.renderizar "próxima visita"
- `api/prospectos.php` — SQL JOIN + campos phoneno/email + búsqueda

**Commit:** fix(pwa): fix field mapping for prospect name, phone, subtitle and SQL JOIN

### Paso 5 — KPIs reales, panel enriquecido, iconos PWA y notificaciones locales [COMPLETO ✅]
**Objetivo cubierto:** corregir el Panel para que deje de depender de los 50 registros cargados en cliente y pase a usar KPIs reales desde SQL.

**Backend**
- `api/prospectos.php`:
  - nueva opción `TraerKPIs`
  - respuesta JSON única con `total`, `calificados`, `visitas_hoy`, `vencidos`
  - incluye `diagnostico_estatus` con `idstatus`, `nombre`, `nombrealterno`, `marcainicial`
  - filtro por vendedor basado en permiso `2055` (`AllowedPageSecurityTokens`)
  - se restauró `TraerEstatus` para que la vista Lista siga pudiendo cargar etapas
- `api/agenda.php`:
  - ahora expone `phoneno`, `latitude`, `longitude`, `direccion`, `titulo`
  - nuevo modo `rango=semana_actual` para el resumen Lun-Vie del Panel

**Frontend**
- `assets/app.js`:
  - Panel ahora consume `TraerKPIs`
  - nueva card "Próxima actividad del día" con acciones `Llamar`, `Ruta`, `Calendario`
  - nuevo resumen semanal con strip Lun-Vie y conteo de actividades
  - nueva alerta roja para vencidos con acceso directo al filtro `Vencidos`
  - notificaciones locales del browser:
    - solicitud de permiso al cargar
    - aviso de actividades vencidas una vez por sesión
    - recordatorio de próxima visita dentro de 60 minutos, revisado cada 5 minutos
- `assets/app.css`:
  - estilos nuevos para cards del Panel, strip semanal y alerta de vencidos

**PWA / iconos**
- `prospectos/generar-iconos.php`:
  - script PHP 5 con GD para generar `assets/icons/icon-192.png` y `icon-512.png`
  - si GD no existe, responde error y queda activo fallback SVG
- `manifest.json`:
  - agrega icono SVG inline `purpose: any` como fallback para instalación

**Limitación de esta sesión**
- No fue posible ejecutar consultas reales ni correr `generar-iconos.php` desde esta máquina porque no existe `php` CLI en el entorno local de Codex. La validación real de `nombrealterno` y la generación de PNG quedan para prueba en servidor/browser.

### Sesión 2026-04-15b — Install prompt + Agenda mejorada [COMPLETO ✅]

**Install prompt (TAREA 0):**
- Creado `prospectos/install-prompt.js` con soporte Android (beforeinstallprompt)
  e iOS Safari (banner manual con instrucciones Compartir → Añadir a pantalla inicio).
- Inyectado en `includes/footer.inc` (ambas ramas ShowIndex) y `prospectos/index.php`.
- El script registra el SW desde cualquier página del ERP → el browser evalúa
  instalabilidad antes de que el vendedor entre a la PWA.
- Banner se suprime 7 días después de ser descartado (localStorage).

**Agenda — ícono vacío (TAREA 1B):**
- Reemplazado emoji `📅` (mostraba "July 17" en algunos dispositivos) por SVG inline neutro
  con subtítulo explicativo.

**Agenda — sección "Requieren atención" (TAREA 1A):**
- Nueva función `PWA.Agenda.cargarNecesitanAtencion()` en app.js:
  lazy-load tras renderizar el strip, agrega sección roja al final de la vista.
- Nuevo endpoint `ProspectosNecesitanAtencion` en `api/agenda.php`:
  devuelve hasta 20 prospectos activos con tarea vencida, >30 días sin actividad
  o sin ninguna actividad registrada. Ordenados por gravedad y valor.
- Fix `ProspectosAgendaWhereVendedor`: ahora verifica `COUNT(*) FROM salesman WHERE usersales=?`
  antes de aplicar el filtro. Si el usuario no tiene salesman → sin filtro (ver todos).
  Mismo patrón ya aplicado en `prospectos.php`.
- Cada card de atención tiene botón 📞 (si tiene tel) y botón + para nueva actividad.

**Commits:**
- `feat(pwa): add install prompt banner before login for Android and iOS`
- `feat(pwa): improve agenda — fix empty state icon, add attention section`
- `feat(pwa): add ProspectosNecesitanAtencion endpoint + fix salesman filter`

### Sesión MVP Rescue (2026-04-15) — SyntaxError + KPIs cero + iconos 404 [COMPLETO ✅]

**Problema 1 — app.js SyntaxError línea 273:**
`Uncaught SyntaxError: expected expression, got ']'`

**Causa raíz:** En `renderDetalle()`, el array de botones de acción (tel/wa/mapa)
no tenía el `[` de apertura del array interno. El `]` de línea 253 cerraba el
array EXTERNO de `cont.innerHTML`, dejando 20 líneas de HTML huérfanas.
El `].join('');` de línea 273 no tenía array que cerrar → SyntaxError fatal.

**Fix:** Agregar `[` antes de `'<div class="panel-action-row"'` en línea 249 y
`'</div>'` como último elemento del array interno antes de `].join('')`.
Commit: `fix(pwa): recover app.js syntax error breaking entire app`

**Problema 2 — KPIs todos en 0:**
Usuario `desarrollo` no tiene registro en tabla `salesman` con `usersales='desarrollo'`.
El filtro `pm.salesman IN (SELECT salesmancode FROM salesman WHERE usersales='desarrollo')`
devolvía vacío → cero prospectos, cero KPIs.

**Fix:** Antes de aplicar filtro, se verifica con `SELECT COUNT(*) FROM salesman WHERE usersales=?`.
Si el usuario no tiene salesman asignado O tiene permiso 2055 → sin filtro (`$whereSalesman = ''`).
Se aplica el mismo patrón en `TraerKPIs` y `TraerProspectos`.
Commit: `fix(pwa): fix KPI and list salesman filter for users without salesman record`

**Problema 3 — Iconos 404:**
`assets/icons/icon-192.png` y `icon-512.png` no existían.

**Fix:** Generados con Python (`struct` + `zlib`) como PNGs válidos de color sólido `#0f1117`.
Son placeholders — Jozet debe ejecutar `prospectos/generar-iconos.php` en el servidor
para reemplazarlos con iconos ROGMAI reales (requiere extensión GD de PHP).
Commit: `fix(pwa): add PNG placeholder icons to fix 404 errors`

### Paso 6 — Restauración de KPIs/lista, notificaciones por click y detalle útil [COMPLETO ✅]
**Problema confirmado:** el commit `d864eb97` dejó el Panel con KPIs en cero, la búsqueda ya no encontraba prospectos y el navegador bloqueó `Notification.requestPermission()` por ejecutarse fuera de un gesto del usuario.

**Correcciones backend**
- `api/prospectos.php`:
  - lectura de JSON estandarizada con `$raw` + `json_decode()` y fallback limpio
  - `error_log('[PWA] option=...')` al inicio de cada request
  - `TraerKPIs` ahora usa estatus reales confirmados:
    - activos: `idstatus NOT IN (0,5,8)`
    - calificados: `idstatus IN (2,3,4,7)`
    - vencidos: excluye `5,8`
  - `TraerProspectos` restaurado con búsqueda por nombre, teléfono, email y `u_movimiento`
  - logs temporales de búsqueda y SQL final
  - lista vuelve a usar `pm.link_google_map`, `cb.phoneno`, `cb.email` y última actividad por `MAX(u_movimiento)`
- `api/agenda.php`:
  - nueva opción `TraerHistorial` para últimas 5 actividades por prospecto
  - nueva opción `TraerTiposActividad` para poblar el select real desde `oportunidad_tipo`
  - `TraerAgenda` incluye `pm.link_google_map`

**Correcciones frontend**
- `assets/app.js`:
  - notificaciones solo se solicitan desde botón visible en Perfil
  - Perfil muestra estado real: activas, bloqueadas o pendientes de activar
  - Panel:
    - alerta roja prominente antes de KPIs
    - barra de progreso `calificados / total`
    - próxima actividad con `Llamar`, `WhatsApp`, `Ver en mapa`, `Calendario`
  - detalle del prospecto:
    - badge de etapa con color por `nombrealterno`
    - sección de próxima actividad
    - CTA para nueva actividad usando payload compatible con `GuardarActividad` legacy
    - historial cargado desde `api/agenda.php`
  - la Agenda abre la vista detalle completa en vez del modal viejo
- `assets/app.css`:
  - estilos para progreso, badge de etapa e historial
- `manifest.json`:
  - `theme_color` corregido a `#4f8ef7`

---

## ESTADO ACTUAL (actualizar después de cada cambio)

```
Lista de prospectos:    ✅  Query restaurada con última actividad y mapa
Búsqueda:               ✅  Nombre, teléfono, email y folio (`u_movimiento`)
Filtros pills:          ✅  Todos, Hoy, Vencidos, Calificados
Colores borde card:     ✅  Rojo/Amarillo/Azul según estado
Detalle prospecto:      ✅  Badge etapa, próxima actividad, nueva actividad e historial
Mapa:                   ✅  GPS activo, punto azul, tiles OSM cargando
Mapa pins prospectos:   🔧  cb.lat/cb.lng en SELECT — pendiente render en map.js
Perfil:                 ✅  Usuario, sync, conexión y activación de notificaciones
Panel KPIs:             ✅  Filtro vendedor robusto: si usuario no tiene salesman → ver todos
Panel visual:           ✅  Alerta, progreso, próxima actividad, resumen semanal
Agenda strip:           ✅  Strip en español, ícono vacío corregido (SVG neutro)
Agenda atención:        ✅  Sección "Requieren atención" con prospectos vencidos/inactivos
Google Calendar:        ✅  Integrado
Offline sync:           🔧  Estructura lista, pendiente probar
Cámara/fotos:           ❌  Pendiente
Notificaciones locales: ✅  Browser notifications sin push server-side
Push notifications:     ❌  Pendiente VAPID / servidor
Instalar PWA:           ✅  Banner beforeinstallprompt inyectado en ERP + iOS manual
app.js SyntaxError:     ✅  Resuelto — array interno de botones tenía '[' faltante
```

---

## PLAN COMPLETO — LO QUE FALTA

### 🔴 INMEDIATO

**Validación en servidor**
- Confirmar que `TraerKPIs` vuelva a entregar `total ~50` en producción
- Probar búsqueda real con "Pruebas"
- Ejecutar `prospectos/generar-iconos.php` una vez en ambiente con PHP GD

### 🟡 SIGUIENTE SPRINT

**Pins en mapa**
Los prospectos necesitan coordenadas en custbranch.link_google_map
o bien geocodificar la dirección. Investigar qué datos hay en BD.

### 🟢 SPRINT 3

**Cámara y fotos**
- `<input type="file" accept="image/*" capture="environment">`
- Comprimir en canvas: max 800px, calidad 0.75
- Convertir a base64 → POST api/prospectos.php opción 'SubirFoto'
- INSERT en tabla documents
- Si offline: encolar en IndexedDB → sync al reconectar
- Galería usando opción existente 'obtenerImagenesOportunidad' del modelo

**Pull to refresh**
- Detectar swipe down en scroll top 0
- delta > 80px → recargar vista actual

**Swipe left en card**
- Revelar botones: Llamar, WhatsApp, Ruta sin abrir detalle

**Skeleton loaders**
- Cards grises animadas mientras carga (shimmer effect)

**Haptic feedback**
- navigator.vibrate(50) en acciones de confirmación

### 🟢 SPRINT 4

**Push notifications**
- Generar VAPID keys en servidor
- Nueva tabla push_subscriptions en BD
- SW maneja evento 'push'
- PHP envía push al asignar actividad, mensaje nuevo, recordatorio 1h antes

**Iconos PWA reales**
- Si llega logo final ROGMAI, regenerar `icon-192.png` y `icon-512.png` con branding definitivo

---

## INSTRUCCIÓN FINAL PARA CODEX

Al terminar cualquier tarea:
1. Actualiza "HISTORIAL DE CAMBIOS" — agrega entrada con qué hiciste
2. Actualiza "ESTADO ACTUAL" — cambia el emoji del feature que completaste
3. Si hay un nuevo "EN PROGRESO", descríbelo en el historial
4. Incluye CONTEXTO_MAESTRO.md en el git commit
5. Mensaje de commit siempre descriptivo y en inglés
6. NO hagas git push — Jozet lo hace manualmente

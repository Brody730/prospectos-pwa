# CONTEXTO MAESTRO — PWA Prospectos ROGMAI
**Última actualización:** 2026-04-17
**Autor:** Jozet Mendoza (jmendoza)
**Repo:** https://github.com/Brody730/prospectos-pwa

---

## QUIÉN SOY
Soy Jozet, desarrollador del ERP ROGMAI.
Estoy construyendo una PWA mobile-first para vendedores de campo que les permite
operar sin abrir el ERP web desde el celular.

---

## RUTAS — MUY IMPORTANTE

```
# Máquina local (VS Code)
~/Escritorio/prospectos-pwa/

# Servidor producción (Amazon Linux 2)
/var/www/html/erpdistribucion/       ← ERP legacy, NUNCA TOCAR (solo leer)
/var/www/html/prospectos/            ← PWA independiente (este proyecto)

# URLs
https://erprogmai.portalito.com/prospectos/                 ← PWA nueva (producción)
https://erprogmai.portalito.com/erpdistribucion/prospectos/ ← PWA vieja (legacy, aún funciona)
```

---

## FLUJO DE TRABAJO

```
Edito en VS Code local (~/Escritorio/prospectos-pwa/)
        ↓
git push origin main  (pide user + personal access token)
        ↓
En server: cd /var/www/html/prospectos && git pull origin main
        ↓
Probar en https://erprogmai.portalito.com/prospectos/ (Ctrl+Shift+R para bypass de cache)
```

### Si hay conflictos al hacer pull en el server

```bash
git checkout -- [archivo_conflicto]
git pull
```

O más nuclear (descarta TODOS los cambios locales del server):
```bash
cd /var/www/html/prospectos
git checkout -- .
git pull
```

### Claude Code y GitHub

Claude Code NO puede pushear automáticamente porque `gh` CLI no está instalado.
Jozet pushea manualmente desde terminal local con credentials guardadas.
Token generado en: https://github.com/settings/tokens (permisos: `repo`).

---

## STACK TÉCNICO

```
Servidor:   Amazon Linux 2, PHP legacy
            - Vive en /var/www/html/erpdistribucion/ (ERP original)
            - PathPrefix = '/var/www/html/erpdistribucion/' (ruta absoluta)
            - Funciones ERP: DB_query($sql, $db), DB_fetch_array($rs), DB_Txn_Begin/Commit/Rollback
            - OPcache: DESHABILITADO en producción (cambios son inmediatos)

Frontend:   Vanilla JS ES6 — sin npm, sin webpack, sin React
            Compatible iOS Safari 11.3+ y Chrome Android 60+
            NO usar: arrow functions, async/await, features ES7+
            SÍ usar: var, function(), callbacks

CSS:        Mobile-first, dark theme, variables CSS propias
Mapas:      Leaflet.js 1.9.x desde cdnjs.cloudflare.com
Offline:    Service Worker + IndexedDB nativos
Auth:       Login propio en index.php que autentica contra el ERP
            $_SESSION['UserID'] disponible después del login
```

---

## ESTRUCTURA DE ARCHIVOS

```
prospectos-pwa/
├── index.php              ← Login propio + Shell PWA
├── manifest.json          ← PWA config
├── sw.js                  ← Service Worker (cachea assets + tiles OSM)
├── install-prompt.js      ← Banner instalación Android/iOS
├── index-local.html       ← Para desarrollo local sin BD
├── CONTEXTO_MAESTRO.md    ← (este archivo)
├── PROMPT_SIGUIENTE.md    ← Contexto para nueva sesión de Claude
├── assets/
│   ├── app.css            ← Dark theme completo
│   ├── app.js             ← Toda la lógica de vistas
│   ├── map.js             ← Leaflet + GPS + pins
│   └── sync.js            ← IndexedDB + cola offline
└── api/
    ├── prospectos.php     ← API principal (SQL directo + passthrough ERP)
    ├── agenda.php         ← Actividades / historial / requieren atención
    ├── geo.php            ← GPS / royalRoute
    ├── sync.php           ← Cola offline → BD
    └── chat.php           ← Chat wrapper
```

---

## PALETA DE COLORES

```css
:root {
  --pwa-bg: #0f1117;
  --pwa-card: #1a1d27;
  --pwa-card2: #22263a;
  --pwa-accent: #4f8ef7;    /* Azul */
  --pwa-accent2: #34d399;   /* Verde */
  --pwa-warn: #f59e0b;      /* Amarillo */
  --pwa-danger: #ef4444;    /* Rojo */
  --pwa-text: #f1f5f9;
  --pwa-muted: #8892a4;
  --pwa-border: rgba(255,255,255,0.08);
}
```

### Colores por etapa (derivados de prospect_status.nombrealterno)

```javascript
'A' (Nuevo):              '#4f8ef7'  // Azul
'B' (Levantamiento):      '#22d3ee'  // Cian
'C' (Cotiz. Solicitada):  '#f59e0b'  // Amarillo
'D' (Cotiz. Entregada):   '#fb923c'  // Naranja
'V' (Venta):              '#34d399'  // Verde
'S' (Seguimiento):        '#a855f7'  // Morado
'E' (Descartado):         '#ef4444'  // Rojo
'X' (Cancelado):          '#8892a4'  // Gris
'BD' (Base de datos):     '#64748b'  // Gris oscuro
```

---

## BD — DATOS CLAVE

```
Tablas principales:
- prospect_movimientos  (u_movimiento=ID, idstatus, salesman, debtorno, cargo, activo)
- debtorsmaster         (debtorno, name, email, phoneno)
- custbranch            (debtorno, branchcode, salesman, address1/3/4, phoneno, email)
- prospect_status       (idstatus, nombre, nombrealterno, marcainicial)
- tasks_movimientos     (u_prospecto, fecha_compromiso, hora, TipoMovimientoId, idstatus)
- oportunidad_tipo      (id, descripcion, color) — 7 tipos de actividad
- prdstatussimple       (idstatus, final)
- salesman              (salesmancode, salesmanname, usersales→userid)
- royalRoute            (userid, latitude, longitude, fecha_registro)

Estatus confirmados (prospect_status):
0 = BD
1 = NuevoProspecto        (A)  marcainicial
2 = Levantamiento          (B)
3 = CotizSolicitada        (C)
4 = CotizEntregada         (D)
5 = Descartado             (E)  terminal
6 = Venta                  (V)  terminal
7 = Seguimiento            (S)
8 = Cancelado              (X)  terminal

Activos: idstatus NOT IN (0, 5, 8)
Calificados: idstatus IN (2, 3, 4, 7)

Tipos de actividad (oportunidad_tipo):
- Llamada Telefónica
- Envío de Correo
- Visita en Sitio
- Mensaje
- Otro Medio
- Re-Agendar
- Investigación

Coordenadas geo:
- prospect_movimientos.link_google_map → formato "20.401558,-100.001293" (lat,lng)
- 148 prospectos tienen coordenadas en producción (no 66 como antes).
```

---

## ESTADO ACTUAL DE FEATURES (2026-04-17)

| Feature | Estado | Notas |
|---|---|---|
| Login propio en /prospectos/ | ✅ | empresa/usuario/contraseña |
| Panel KPIs | ✅ | total, calificados, visitas hoy, vencidos |
| Lista prospectos | ✅ | nombres reales, búsqueda, filtros, paginación scroll |
| Detalle prospecto | ✅ | Llamar/WhatsApp/Mapa + historial + nueva actividad + cambiar etapa |
| Mapa GPS vendedor | ✅ | punto azul, tiles OSM cacheadas offline |
| **Mapa pins prospectos** | ✅ | **148 prospectos con coordenadas, colores por estado (fecha)** |
| **Cambiar etapa desde detalle** | ✅ | **Feature flag activo solo para 31136 (QA)** |
| **Historial timeline** | ✅ | **Íconos por tipo, colores oportunidad_tipo, badge VENCIDA** |
| **Nueva actividad funcional** | ✅ | **Título opcional con auto-default del tipo** |
| Agenda strip | ✅ | español, strip 7 días centrado en hoy |
| Agenda "Requieren atención" | ✅ | lazy-load, cards vencidas/inactivas |
| Google Calendar | ✅ | integrado (link directo sin API) |
| Instalar PWA — Android | ✅ | banner beforeinstallprompt |
| Instalar PWA — iOS | ✅ | banner manual con instrucciones |
| Iconos PWA | ✅ | placeholder PNG, sin 404 |
| Logout | ✅ | redirect a /prospectos/ (no al menú del ERP) |
| Offline — Service Worker | ✅ | cachea assets + tiles OSM |
| Offline — IndexedDB | ✅ | cache prospectos + agenda |
| **Offline — cola cambio_etapa** | ✅ | **handler en api/sync.php** |
| Offline — cola nueva_actividad | ✅ | ya funcionaba |
| Chat | ❌ | stub — módulo pendiente |
| Cámara/fotos | ❌ | no iniciado |
| Push notifications | ❌ | no iniciado |
| Cambio datos prospecto (panel completo) | ❌ | roadmap futuro |

---

## FEATURE DETALLE: CAMBIAR ETAPA (2026-04-17)

### Reglas de transición

```
Desde │ Permitidos                         │ Confirmación
──────┼─────────────────────────────────────┼──────────────
  A   │ B, S, E, X                          │ E, X
  B   │ A, C, S, E, X                       │ E, X
  C   │ A, B, D, S, E, X                    │ E, X
  D   │ A, B, C, V, S, E, X                 │ V, E, X
  S   │ A, B, C, D, E, X                    │ E, X
  V   │ (terminal)                          │ bloqueado
  E   │ (terminal)                          │ bloqueado
  X   │ (terminal)                          │ bloqueado
```

### Feature flag (PRUEBAS)

**Activo solo para u_movimiento=31136 hasta rollout total.**

Para desactivar feature flag (rollout total), cambiar en 3 lugares:

1. `assets/app.js` → `PWA.CambiarEtapa.soloParaProspecto: null`
2. `api/prospectos.php` → `$FEATURE_FLAG_PROSPECTO_PRUEBA = null`
3. `api/sync.php` → `$FEATURE_FLAG_PROSPECTO_PRUEBA = null`

### Backend — Passthrough al ERP

`api/prospectos.php` recibe `option='GuardarCambioEstatus'` y:
1. Valida feature flag server-side.
2. Valida transición permitida (matriz).
3. Hace `include(ProspectV2Modelo.php)` que ejecuta el UPDATE.

**Parámetros que espera el modelo del ERP:**
```
u_movimiento        = ID del prospecto
cmbCambiarEstatus   = idstatus nuevo
cmbVendedor03       = salesman (se reenvía el mismo actual)
fechacompromiso     = YYYY-MM-DD
```

### Offline

`api/sync.php` tiene `case 'cambio_etapa'` que replica la lógica online
(UPDATE directo a `prospect_movimientos` con validación de transición).

**NOTA:** El handler viejo `cambio_estatus` (singular) sigue existiendo en sync.php
en paralelo; no se tocó para no romper nada.

---

## KEY LEARNINGS Y TRAMPAS CONOCIDAS

### 1. `config.php` no está en git (intencional)

Contiene credenciales de BD. Un `git reset --hard` en server lo sobrescribe
con el config tracked del repo (que apunta a desarrollo), rompiendo la conexión.

**Precaución:** Si haces git reset/checkout masivo en el server, verifica
después que `config.php` tenga las creds de producción.

### 2. `/var/www/html` es symlink a `/data2/html`

Las operaciones de extracción de tar.gz deben respetar el symlink.

### 3. Service Worker puede cachear código viejo agresivamente

Tras un deploy, si la PWA muestra comportamiento viejo:
- Ctrl+Shift+R en desktop (hard reload)
- En móvil: desinstalar y reinstalar la PWA, o borrar caché del sitio

Para forzar actualización del SW:
```javascript
navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.update()))
```

Mejor práctica futura: bumpear versión del cache en `sw.js` en cada deploy.

### 4. **BUG CRÍTICO: SecurityFunctions.inc del ERP** (resuelto 2026-04-17)

Incluir `/var/www/html/erpdistribucion/includes/SecurityFunctions.inc` desde
un endpoint de la PWA **hace que PHP emita HTML de error y haga exit()** cuando
la página no está registrada en las tablas `sec_modules/sec_functions` del ERP.

**Síntoma:** El endpoint devuelve `<DIV class="error">...` en lugar de JSON,
rompiendo el parsing en frontend con:
```
SyntaxError: JSON.parse: unexpected character at line 1 column 1
```

**Causa raíz:** `SecurityFunctions.inc` ejecuta una query de validación de
permisos al momento del include. Cuando el `functionid` llega vacío, el SQL
queda malformado (`FP.functionid= AND FuxP.active=1`) y `DB_query` imprime
el HTML de error Y HACE EXIT. Ningún `ob_start/ob_end_clean` alrededor del
include puede atrapar el exit.

**Solución:** NO incluir `SecurityFunctions.inc` en endpoints de la PWA.
La autenticación la maneja el login propio que pone `$_SESSION['UserID']`.
Las validaciones de `AllowedPageSecurityTokens` funcionan solas porque esos
valores ya están en la sesión (los pone el login).

**Regla:** Para cualquier endpoint nuevo en `api/*.php`, incluir SOLO:
```php
include($PathPrefix . 'config.php');
include($PathPrefix . 'includes/ConnectDB.inc');
include($PathPrefix . 'includes/SQL_CommonFunctions.inc');
// NO incluir SecurityFunctions.inc
```

### 5. Patrón obligatorio para endpoints PHP

Para evitar que HTML basura contamine el JSON de respuesta:

```php
<?php
ini_set('display_errors', 0);
ob_start();
session_start();

// Includes necesarios (NUNCA SecurityFunctions.inc)
include($PathPrefix . 'config.php');
include($PathPrefix . 'includes/ConnectDB.inc');
include($PathPrefix . 'includes/SQL_CommonFunctions.inc');

// Limpiar buffers de los includes
while (ob_get_level() > 0) {
    ob_end_clean();
}
header('Content-Type: application/json');
ob_start();

// Acumular respuesta en $response, NO hacer echo en medio
$response = null;

try {
    switch ($opcion) {
        case 'MiEndpoint':
            // ...
            $response = array('result' => true, 'contenido' => $items);
            break;
        default:
            $response = array('result' => false, 'msjError' => 'Opcion no reconocida');
    }
} catch (Exception $e) {
    $response = array('result' => false, 'msjError' => 'Error interno: ' . $e->getMessage());
}

// Emitir JSON UNA sola vez al final, descartando HTML basura
ob_end_clean();
echo json_encode($response !== null ? $response : array('result' => false, 'msjError' => 'Error interno'));
?>
```

### 6. `link_google_map` puede estar NULL

Al leer coordenadas de prospectos, verificar SIEMPRE con `if (!lat || !lng) return;`
antes de crear el marker de Leaflet. 52 de 200 prospectos no tienen coordenadas.

### 7. Nombres de campos en la API

Los prospectos devueltos por `api/prospectos.php` tienen el nombre real en
el campo `prospecto`, NO en `nombre` ni `DebtorName`. Patrón defensivo:

```javascript
var nombre = p.prospecto || p.nombre || p.DebtorName || 'Sin nombre';
```

---

## BACKUPS Y RECUPERACIÓN

### Backups nocturnos

```
Ubicación: /respaldo-nfs/dump/erp/erpdistribucion_YYYY-MM-DD_02-00-01.tar.gz
Formato: tar.gz del /data2/html
```

### Restauración desde backup

```bash
cd /tmp
tar -xzf /respaldo-nfs/dump/erp/erpdistribucion_2026-04-14_02-00-01.tar.gz
# Cuidado con el symlink /var/www/html → /data2/html
cp -r tmp/[ruta_extraida] /data2/html/erpdistribucion/
```

### Rollback rápido de un deploy

```bash
cd /var/www/html/prospectos
git revert HEAD
git push origin main   # si se puede desde el server, sino:
# volver a máquina local y pushear
```

### Rollback del feature cambio_etapa

Cambiar `soloParaProspecto: 31136` a `soloParaProspecto: 0` en `assets/app.js`,
commitear y pushear. Feature desactivado para todos en 1 línea.

---

## ENDPOINTS DISPONIBLES

### `api/prospectos.php`
| Option | Descripción |
|---|---|
| `TraerKPIs` | Total, calificados, visitas hoy, vencidos |
| `TraerEstatus` | Catálogo de etapas (prospect_status) |
| `TraerProspectos` | Lista con filtro/búsqueda/paginación |
| `GuardarActividad` | Passthrough al ERP |
| `GuardarCambioEstatus` | Passthrough al ERP con validación de transición |

### `api/agenda.php`
| Option | Descripción |
|---|---|
| `TraerAgenda` | Actividades por rango de fecha |
| `TraerHistorial` | Últimas 50 actividades de un prospecto (sin filtro vendedor) |
| `TraerTiposActividad` | Catálogo de tipos (oportunidad_tipo) |
| `ProspectosNecesitanAtencion` | Prospectos con >30 días o sin actividad |

### `api/sync.php`
Acciones soportadas (campo `action` del payload):
| Action | Descripción |
|---|---|
| `nueva_actividad` | Inserta en tasks_movimientos |
| `cambio_estatus` | UPDATE simple de idstatus (legacy, incompleto) |
| `cambio_etapa` | UPDATE completo (idstatus + salesman + fecha) con validación |
| `registrar_visita_gps` | INSERT en royalRoute |
| `nuevo_prospecto` | Usa modelo del ERP |
| `enviar_mensaje` | INSERT en chat_erp |

### `api/geo.php`
- `RegistrarPosicion` (lat, lng)

---

## COMANDOS ÚTILES

### Desarrollo local

```bash
cd ~/Escritorio/prospectos-pwa
php -S 0.0.0.0:8080
# Celular: http://TU_IP:8080/index-local.html
```

### Deploy

```bash
# Local
git add -A
git commit -m "feat/fix: descripcion"
git push origin main

# Server
cd /var/www/html/prospectos
git pull
# Si hay conflictos:
git checkout -- .
git pull
```

### Debug en browser

```javascript
// Ver estado general
console.log('Prospectos:', PWA.state.prospectos.length);
console.log('Con coords:', PWA.state.prospectos.filter(p => p.link_google_map).length);

// Ver sesión
console.log(PWA.session);

// Ver cambio de etapa disponible
console.log(PWA.CambiarEtapa.transicionesPermitidas);

// Test de endpoint
fetch('api/agenda.php', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({ opcion: 'TraerHistorial', u_movimiento: 31136 })
}).then(r => r.text()).then(t => console.log(t.substring(0, 200)));
```

### Ver logs del server

```bash
tail -f /var/log/httpd/error_log | grep -i "PWA"

# Específico del feature cambio de etapa
tail -f /var/log/httpd/error_log | grep "CambiarEtapa\|cambio_etapa"
```

### Verificar BD

```sql
-- Estado de un prospecto específico
SELECT u_movimiento, idstatus, fecha_compromiso, salesman
FROM prospect_movimientos
WHERE u_movimiento = 31136;

-- Actividades de un prospecto
SELECT u_movimiento, fecha_compromiso, hora, concepto, titulo, idstatus
FROM tasks_movimientos
WHERE u_prospecto = 31136
ORDER BY fecha_compromiso DESC
LIMIT 10;
```

---

## ROADMAP

### 🔴 Inmediato (siguiente sesión)
- [ ] Rollout total de cambio_etapa (quitar feature flag `31136`)
- [ ] Abrir modal completo desde el detalle (migrar panel ERP al mobile):
      - Etapa A: datos del prospecto (nombre, tel, dirección, sector, coordenadas)
      - Etapa B: visita al sitio (encargado, productos estimados, tiempo de vida)
      - Etapa C: cotización (ver/modificar/solicitar autorización)
      - Etapa D: timbres y facturación

### 🟡 Pendiente no urgente
- [ ] Pulir UX del historial:
      - Agrupar badge VENCIDA solo en la más reciente
      - Paginación "Ver más" si hay >50 actividades
      - Agrupar por mes con separadores
- [ ] Chat funcional (actualmente stub)
- [ ] Pull to refresh en lista
- [ ] Swipe left en cards → acciones rápidas

### 🟢 Features nuevas (sprints futuros)
- [ ] **Cámara:** foto del prospecto desde la app
      - getUserMedia + canvas compression
      - IndexedDB para fotos offline
      - Upload multipart al ERP
- [ ] **Push notifications:** VAPID keys + server endpoint
- [ ] **Iconos PWA reales** con logo ROGMAI

---

## PREFERENCIAS DE ESTILO

- **Comentarios en español.**
- **Indentación:** 2 espacios en JS, 4 espacios en PHP.
- **Cadenas:** comillas simples (`'`) preferidas en ambos lenguajes.
- **SQL:** directo con `addslashes`/`intval` — no hay ORM ni prepared statements.
- **Manejo de errores:** siempre try/catch en PHP, siempre callback con `(err, data)` en JS.
- **Features en producción:** siempre feature flag para nuevos cambios críticos.
- **Cambios destructivos:** siempre backup previo antes de probar.

---

## NOTAS FINALES

- Jozet prefiere **sed directo en server** sobre scripts complejos.
- Jozet requiere **exact byte-match confirmation** antes de find-and-replace.
- Producción es frágil. El server es "abuelito senil" — no se reinicia.
- El tolerancia a downtime es mínima. Cambios quirúrgicos, feature flags, rollback listo.
# PROMPT SIGUIENTE — PWA Prospectos ROGMAI
# Generado: 2026-04-15 — sesión Agenda + Install Prompt
# Último commit: ver `git log --oneline -3`

---

## LO QUE SE HIZO EN ESTA SESIÓN

### 1. Install Prompt PWA (TAREA 0)
- **Nuevo archivo:** `prospectos/install-prompt.js`
- Android/Chrome: captura `beforeinstallprompt`, muestra banner inferior con botón Instalar.
  Se suprime 7 días tras cerrar (`localStorage pwa_install_dismissed`).
- iOS Safari: detecta no-standalone + Safari, muestra banner manual con instrucciones
  "Compartir → Añadir a pantalla de inicio" con 2 segundos de delay.
- **Inyectado en:** `includes/footer.inc` (ambas ramas ShowIndex==0 y ==1) y
  `prospectos/index.php` (después de app.js).
- Registra el SW `/prospectos/sw.js` desde cualquier página del ERP.

### 2. Agenda — ícono vacío (TAREA 1B)
- Reemplazado `📅` (mostraba "July 17" en iOS/Android base) por SVG inline neutro
  con subtítulo "Aquí aparecerán tus visitas y llamadas programadas".

### 3. Agenda — sección "Requieren atención" (TAREA 1A)
- **Backend:** nuevo `case 'ProspectosNecesitanAtencion':` en `api/agenda.php`.
  Devuelve ≤20 prospectos activos con tarea vencida / >30 días sin actividad / sin actividad.
  Ordenados: sin-actividad primero, luego días-desc, luego valor-desc.
- **Backend fix:** `ProspectosAgendaWhereVendedor()` ahora verifica con
  `COUNT(*) FROM salesman WHERE usersales=?` antes de aplicar filtro. Sin registro → sin filtro.
- **Frontend:** `PWA.Agenda.cargarNecesitanAtencion(el)` carga lazy tras `el.innerHTML = html`.
  Sección "⚡ Requieren atención" con cards rojas, botón 📞 y botón + actividad.

---

## ESTADO ACTUAL DE FEATURES

| Feature | Estado | Notas |
|---------|--------|-------|
| app.js carga | ✅ | Sin SyntaxError |
| Panel KPIs | ✅ | Filtro vendedor robusto |
| Lista prospectos | ✅ | nombres reales, búsqueda, filtros |
| Detalle prospecto | ✅ | badge etapa, acciones, historial |
| Mapa GPS | ✅ | punto azul, tiles OSM |
| Mapa pins | 🔧 | lat/lng en SELECT, falta render en map.js |
| Agenda strip | ✅ | español, ícono vacío corregido |
| Agenda "Requieren atención" | ✅ | lazy-load, cards vencidas/inactivas |
| Google Calendar | ✅ | integrado |
| Instalar PWA — Android | ✅ | banner beforeinstallprompt en ERP |
| Instalar PWA — iOS | ✅ | banner manual con instrucciones |
| Iconos PWA | ✅ | placeholder PNG, sin 404 |
| Offline sync | 🔧 | estructura lista, pendiente probar |
| Cámara/fotos | ❌ | no iniciado |
| Push notifications | ❌ | no iniciado |

---

## PRÓXIMOS PASOS — ORDEN DE PRIORIDAD

### 🔴 1. Verificar en producción después del deploy

```bash
# Deploy
git push origin main
# Servidor:
cd /var/www/html/erpdistribucion && git pull origin main
```

Verificar:
1. Abrir ERP en Chrome Android → ver banner "Instalar ROGMAI Prospectos"
2. Abrir en iOS Safari → ver banner con instrucciones Compartir
3. Ir a Agenda PWA → sección "Requieren atención" aparece al fondo
4. Prospectos con >30 días sin actividad aparecen en la sección

Para probar `ProspectosNecesitanAtencion` desde consola:
```javascript
fetch('/prospectos/api/agenda.php', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  credentials: 'same-origin',
  body: JSON.stringify({ opcion: 'ProspectosNecesitanAtencion' })
}).then(r => r.json()).then(d => console.log('total:', d.contenido && d.contenido.length, d.contenido && d.contenido[0]));
```

### 🟡 2. Pins en mapa

Los campos `latitude` y `longitude` ya llegan de `TraerProspectos`.
Solo falta usarlos en `map.js` con Leaflet markers.

```javascript
// En PWA.Mapa (map.js), añadir función:
PWA.Mapa.pintarProspectos = function(prospectos) {
  if (!PWA.Mapa.map) return;
  prospectos.forEach(function(p) {
    if (!p.latitude || !p.longitude) return;
    var nombre = p.prospecto || 'Sin nombre';
    L.circleMarker([p.latitude, p.longitude], {
      radius: 8, color: '#4f8ef7', fillColor: '#4f8ef7', fillOpacity: 0.7
    }).bindPopup('<b>' + nombre + '</b><br>' + (p.etapa || '')).addTo(PWA.Mapa.map);
  });
};
// Llamar desde PWA.Lista.cargarMas() cuando termina, o desde PWA.Mapa.init()
```

### 🟡 3. Nueva actividad funcional (verificar)

El botón "+ Agendar" llama `PWA.NuevaActividad.abrir(u_movimiento, nombre)`.
Verificar que el POST a `ProspectV2Modelo.php` con `option=GuardarActividad` funciona.

Los parámetros que espera el modelo legacy:
```
txtMovimiento         = u_movimiento
cmbTipoActividad      = TipoMovimientoId
txtTituloActividad    = titulo
txtFechaActividad     = YYYY-MM-DD
txtHoraActividad      = HH:MM:SS
txtDescripcionActividad = concepto
```

### 🟢 4. Cambio de etapa desde el detalle

Agregar en la vista detalle un select o pills para cambiar `idstatus`.
Usar `option=GuardarCambioEstatus` del modelo legacy con:
```
u_movimiento, cmbCambiarEstatus, cmbVendedor03, fechacompromiso
```

### 🟢 5. Cámara y fotos

Ver sección "Cámara y fotos" en PLAN COMPLETO del CONTEXTO_MAESTRO.

---

## ARCHIVOS CLAVE MODIFICADOS ESTA SESIÓN

```
prospectos/install-prompt.js     ← NUEVO — banner instalación PWA
includes/footer.inc              ← inyección del script en ERP
prospectos/index.php             ← agrega <script src="install-prompt.js">
prospectos/api/agenda.php        ← ProspectosNecesitanAtencion + fix WhereVendedor
prospectos/assets/app.js         ← empty state + cargarNecesitanAtencion
```

---

## RUTAS Y STACK

```
Local:    ~/ERP-GITHUB-VERSIONADO/erpdistribucion/
Servidor: /var/www/html/erpdistribucion/
URL:      https://erprogmai.portalito.com/prospectos/

PHP 5 — addslashes(), DB_query(), DB_fetch_array(), session.inc
Vanilla JS ES6 — sin npm, sin frameworks
PathPrefix desde prospectos/api/ = '../../'
NUNCA tocar: modelo/ProspectV2Modelo.php, modelo/ChatModelo.php
NO hacer git push — Jozet lo hace manualmente
```

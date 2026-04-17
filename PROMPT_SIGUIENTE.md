# PROMPT SIGUIENTE — PWA Prospectos ROGMAI
**Generado:** 2026-04-17
**Sesión:** Pins mapa + Cambiar etapa + Historial timeline + Fix SecurityFunctions
**Último commit:** ver `git log --oneline -5`

---

## RESUMEN EJECUTIVO DE LA ÚLTIMA SESIÓN

Se cerraron 5 features y un bug escondido hace semanas, todo en una sesión
de trabajo intensa. La PWA ya permite que un vendedor opere 100% desde móvil
sin abrir el ERP web.

---

## LO QUE SE HIZO

### 1. Fix pins en mapa (TAREA 🔴 de la sesión anterior)
- **Archivo:** `assets/map.js`
- `cargarProspectosEnMapa()` ahora tiene fallback de 3 niveles:
  1. `PWA.state.prospectos` si hay datos.
  2. Cache offline (`SyncDB.leerProspectosCache`).
  3. Fetch directo a `api/prospectos.php`.
- `pintarPins()` corregido: `fitBounds` sale del `forEach` (se ejecutaba 148 veces).
- Campo de nombre correcto: `p.prospecto` (no `p.nombre`).
- **Resultado:** 148 pins visibles con colores por estado (azul nuevo,
  rojo vencido, amarillo hoy, verde al corriente).

### 2. Cambiar etapa desde el detalle (NUEVA FEATURE MAYOR)
- **Frontend:** Nuevo módulo `PWA.CambiarEtapa` en `assets/app.js`.
  - Bottom sheet con botones grandes de colores por etapa.
  - Matriz de transiciones permitidas (A→B→C→D→V + retroceso libre + S laterales + E/X/V terminales).
  - Confirmación nativa (`confirm()`) para etapas terminales.
  - Feature flag activo solo para `u_movimiento=31136`.
- **Backend online:** Nuevo `case 'GuardarCambioEstatus'` en `api/prospectos.php`.
  - Validación de feature flag.
  - Validación de parámetros (u_movimiento, idstatus, fecha YYYY-MM-DD).
  - Validación de transición permitida (matriz server-side, duplicada del frontend).
  - Passthrough al ERP: `include(ProspectV2Modelo.php)` ejecuta el UPDATE real.
  - Logs en `error_log` con tag `[PWA CambiarEtapa]`.
- **Backend offline:** Nuevo `case 'cambio_etapa'` en `api/sync.php`.
  - Replica la misma validación server-side.
  - UPDATE directo (no incluye el modelo del ERP por eficiencia en batch).
  - Logs con tag `[PWA SYNC cambio_etapa]`.
- **IMPORTANTE:** El `case 'cambio_estatus'` viejo (singular, incompleto) sigue
  en paralelo. NO se tocó para no romper código que lo use.

### 3. Historial con timeline (TAREA 🟡 del roadmap)
- **Backend:** Fix de `case 'TraerHistorial'` en `api/agenda.php`.
  - Quitado filtro `ProspectosAgendaWhereVendedor()` (historial es agnóstico).
  - Agregados campos: `u_task`, `titulo`, `TipoMovimientoId`, `usuario`, `es_final`.
  - `LIMIT 50` en vez de 5.
- **Frontend:** Nueva versión de `PWA.cargarHistorialDetalle()`.
  - Timeline con línea vertical y puntos de colores.
  - Íconos por tipo de actividad (📞 llamada, 🚗 visita, 🔍 investigación, etc.).
  - Colores reales de `oportunidad_tipo`.
  - Badge "VENCIDA" en rojo para actividades pasadas activas.
  - Badge "✓ Completada" para actividades en estatus final.
  - Oculta descripción cuando es redundante con el tipo.

### 4. Nueva actividad con título opcional
- **Frontend:** `PWA.NuevaActividad.abrir()` y `.guardar()` en `assets/app.js`.
- Label cambió a "Título (opcional)" con placeholder "Ej: Segundo intento, no contestó".
- Si el título está vacío, se auto-genera usando el nombre del tipo seleccionado.

### 5. BUG CRÍTICO RESUELTO: SecurityFunctions.inc
- **Síntoma:** `api/agenda.php` devolvía HTML de error mezclado con JSON,
  rompiendo todos los endpoints de la agenda en navegación sin sesión previa del ERP.
- **Causa raíz:** `SecurityFunctions.inc` ejecuta una query al momento del include
  que falla con SQL malformado (`FP.functionid= AND FuxP.active=1`), imprime HTML
  de error y hace `exit()`. Ningún `ob_start/ob_end_clean` puede atrapar el exit.
- **Solución:** Eliminar el `include(SecurityFunctions.inc)` de `api/agenda.php`.
  La autenticación la maneja el login de la PWA que pone `$_SESSION['UserID']`.
- **Otros archivos:** Se confirmó que `prospectos.php`, `sync.php`, `geo.php`,
  `chat.php` NO incluyen `SecurityFunctions.inc`, están limpios.

---

## ESTADO ACTUAL DE FEATURES

| Feature | Estado | Notas |
|---|---|---|
| Login PWA | ✅ | Robusto |
| Panel KPIs | ✅ | |
| Lista prospectos | ✅ | Búsqueda, filtros, paginación scroll |
| Detalle prospecto completo | ✅ | Llamar/WA/Mapa + historial + nueva act + cambiar etapa |
| Mapa GPS + pins | ✅ | 148 pins con colores, GPS activo |
| Agenda + Requieren atención | ✅ | |
| Historial timeline | ✅ | **NUEVO** Con íconos, colores, badges |
| Cambiar etapa | ✅ | **NUEVO** Feature flag activo para 31136 |
| Nueva actividad funcional | ✅ | Título ahora opcional |
| Offline (SW + IndexedDB) | ✅ | Incluye cola cambio_etapa |
| Google Calendar | ✅ | |
| Install prompt Android/iOS | ✅ | |
| Chat | ❌ | stub |
| Cámara | ❌ | |
| Push notifications | ❌ | |
| Panel completo por etapas (A/B/C/D) | ❌ | **Siguiente sprint** |

---

## PRÓXIMOS PASOS — ORDEN DE PRIORIDAD

### 🔴 1. Rollout total de cambio_etapa

Actualmente el feature solo funciona para `u_movimiento=31136`. Para que todos
los vendedores puedan cambiar etapas, cambiar 3 constantes a `null`:

```javascript
// assets/app.js (buscar "soloParaProspecto")
PWA.CambiarEtapa.soloParaProspecto: null  // era 31136
```

```php
// api/prospectos.php (buscar "FEATURE_FLAG_PROSPECTO_PRUEBA")
$FEATURE_FLAG_PROSPECTO_PRUEBA = null;  // era 31136

// api/sync.php (buscar "FEATURE_FLAG_PROSPECTO_PRUEBA")
$FEATURE_FLAG_PROSPECTO_PRUEBA = null;  // era 31136
```

**Pruebas antes del rollout:**
- Verificar que el feature funciona con 31136 (ya confirmado).
- Verificar que el aviso de pruebas 🧪 se muestra para otros prospectos.
- Verificar que el handler offline (sync.php) procesa items correctamente.

**Rollback rápido:** Volver `null` a `31136` en las 3 constantes.

### 🟡 2. Modal completo del panel por etapas (GRAN TAREA)

**Contexto:** El panel original del ERP en
`http://erprogmai.portalito.com/erpdistribucion/paneldecontrolprospectos.php`
muestra al abrir un prospecto un modal gigante con 4 pestañas:

- **Etapa A (Prospecto):** ~15 campos (nombre, teléfono, dirección, estado,
  municipio, colonia, CP, email, sector comercial, vendedor, fuente de contacto,
  coagente, comentarios, coordenadas). Upload de imágenes múltiples.
- **Etapa B (Visita Sitio):** Tabs Información / Productos / Tiempo de Vida.
  - Información: encargado, teléfono, correo, KM planta, tiempo dedicado, descripción.
  - Productos: catálogo con búsqueda, cantidades, precios.
  - Tiempo de Vida: cálculos.
- **Etapa C (Información Visita):** Lógica de cotización (ver/modificar/solicitar).
- **Etapa D (Cotización Entregada):** Timbres, facturación, PDFs.

**Tarea:** Jozet quiere migrar esto a la PWA mobile. No todo de golpe, sino
por capas. El primer paso es abrir el modal completo desde el detalle actual
con el botón "⇆ Cambiar" extendido o un botón nuevo "Ver panel completo".

**Preguntar a Jozet antes de empezar:**
- ¿Qué etapa quieres atacar primero (sugiero A porque es la de datos básicos)?
- ¿Campos editables o solo lectura en fase 1?
- ¿Imágenes y productos se incluyen o solo los datos básicos primero?

Jozet dijo en la última sesión: *"quiero casi casi migrar todo el panel de
control de prospectos a la app"*. Es un proyecto grande (3-5 sprints).

### 🟡 3. Pulir UX del historial

- Actualmente muestra badge VENCIDA en todas las actividades pasadas, lo cual
  abruma visualmente. Mejor: solo en la más reciente, o agrupar.
- Paginación si hay >50 actividades (ahora corta en 50 sin aviso).
- Agrupar actividades por mes con separadores visuales.

### 🟢 4. Cámara

Feature de alta demanda típica en vendedores. Stack:
- `getUserMedia` para capturar.
- Canvas + `toBlob` con compresión JPEG ~70% calidad.
- IndexedDB nuevo store `fotos_offline` para casos sin conexión.
- Upload multipart al ERP (endpoint por verificar).
- UI: botón "📷 Tomar foto" en el detalle, thumbnails en una galería.

### 🟢 5. Push notifications

- VAPID keys en el server.
- Endpoint `api/subscribe.php` para guardar subscriptions.
- Service Worker con `push` event handler.
- Notificaciones para: nueva actividad asignada, prospecto vencido, etc.

---

## ARCHIVOS CLAVE MODIFICADOS ESTA SESIÓN

```
assets/app.js              ← + PWA.CambiarEtapa, + historial timeline, título opcional
assets/map.js              ← fix fitBounds fuera del forEach, nombre correcto
api/prospectos.php         ← + case 'GuardarCambioEstatus' con validación
api/sync.php               ← + case 'cambio_etapa' con validación
api/agenda.php             ← fix TraerHistorial (sin filtro vendedor, más campos),
                             - include(SecurityFunctions.inc) eliminado
                             + patrón $response acumulado y echo único
CONTEXTO_MAESTRO.md        ← actualizado con todo el contexto nuevo
PROMPT_SIGUIENTE.md        ← este archivo
```

---

## ARCHIVOS QUE NO SE TOCARON (OJO)

```
/var/www/html/erpdistribucion/     ← ERP legacy — NUNCA TOCAR
api/chat.php                       ← stub, no se usa aún
api/geo.php                        ← ya funciona bien
install-prompt.js                  ← estable
sw.js                              ← sin cambios, considerar bumpear versión de cache
assets/app.css                     ← estable
```

---

## BUGS CONOCIDOS / PENDIENTES DE VERIFICAR

1. **Fecha de compromiso al cambiar etapa:** Siempre se guarda la fecha del día.
   Si el vendedor quiere agendar a futuro, debe usar el date picker del bottom sheet.
   Verificar que el UI sea claro.

2. **Sincronización silenciosa:** El handler offline `cambio_etapa` nunca se
   probó con un item real en la cola porque no simulamos offline en producción.
   Pendiente validación con caso real.

3. **Service Worker viejo:** Algunos usuarios pueden tener la versión anterior
   cacheada. Considerar bumpear versión en `sw.js` para forzar update.

---

## COMANDOS ÚTILES PARA LA SIGUIENTE SESIÓN

### Retomar estado

```bash
cd ~/Escritorio/prospectos-pwa
git log --oneline -10       # ver commits recientes
git status                  # ver si hay cambios locales
```

### Test rápido de endpoints

```javascript
// Con la PWA abierta en el browser

// Test historial
fetch('api/agenda.php', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({ opcion: 'TraerHistorial', u_movimiento: 31136 })
}).then(r => r.text()).then(t => console.log(t.substring(0, 200)));

// Test tipos de actividad
fetch('api/agenda.php', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({ opcion: 'TraerTiposActividad' })
}).then(r => r.json()).then(d => console.log(d));

// Ver estado del feature cambiar etapa
console.log('Flag:', PWA.CambiarEtapa.soloParaProspecto);
console.log('Transiciones:', PWA.CambiarEtapa.transicionesPermitidas);
```

### Monitorear logs de producción

```bash
tail -f /var/log/httpd/error_log | grep -E "PWA|CambiarEtapa|cambio_etapa"
```

---

## TONO Y ESTILO DE JOZET

Cuando retomes esta conversación:

- Jozet es desarrollador experimentado, habla directo, usa mexicanismos
  ("simon", "chingón", "wey", "jaja"). Responde en el mismo tono relajado.
- Prefiere `sed` y comandos shell directos sobre scripts Python.
- Pide confirmación byte-exact antes de find-and-replace en producción.
- Trabaja directamente en producción con downtime mínimo. Todo es quirúrgico.
- Valora feature flags y rollbacks simples.
- Le gusta entender el "por qué" detrás de un fix, no solo el "qué".

---

## ÚLTIMA PREGUNTA PENDIENTE DE JOZET

> "hay que habilitar las cosas de los modals, no solo que sea cambio de etapas,
> ahorita te explico"

Jozet quiere expandir el feature `Cambiar Etapa` para que al cambiar, no solo
actualice `idstatus` sino que abra el modal completo de cada etapa (como lo
hace el ERP original). Es decir: cambiar a etapa B → abre modal con campos de
"Visita Sitio" (encargado, productos, tiempo de vida).

Esto es equivalente al punto 2 del roadmap pero integrado con el flujo de cambio
de etapa. Jozet iba a explicar mejor en la siguiente sesión.

**Acción:** Al retomar, pedirle a Jozet que explique exactamente qué quiere.
Probablemente decidirá entre:

- (A) Botón "Ver panel completo" independiente del cambio de etapa.
- (B) Cambio de etapa abre automáticamente el modal de la etapa destino.
- (C) Dos acciones: "Solo cambiar etapa" (rápido) + "Cambiar y llenar datos".
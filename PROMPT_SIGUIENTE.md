# PROMPT SIGUIENTE — Handoff para otra IA (Wizard A-D Prospectos PWA)

## Contexto operativo
- Proyecto: `prospectos-pwa`
- PWA en: `/var/www/html/prospectos`
- ERP legacy (NO TOCAR): `/var/www/html/erpdistribucion`
- Objetivo: que PWA use la misma lógica/datos del ERP de prospectos vía bridge, sin modificar ERP.

## Estado actual (ya hecho)
1. Bridge backend:
   - `api/prospectos.php` ampliado para passthrough de opciones ERP A-D.
2. UI:
   - `assets/app.js` muestra card para abrir Wizard A-D desde detalle.
   - Se removió botón manual de “Cambiar etapa”; queda sólo etiqueta visual de etapa.
3. Wizard:
   - `assets/wizard-prospecto.js` creado:
     - tabs A/B/C/D
     - Etapa A con cámara + galería + subida
     - Etapa B con productos + tiempo de vida (puntaje)
     - Etapa C con productos/totales/acciones cotización
     - Etapa D con cierre
4. Estilos:
   - `assets/app.css` actualizado mobile-first para wizard.
   - Ajustes de scroll global/modal.
5. Viewport:
   - `index.php` actualizado a `viewport-fit=cover` sin bloqueo de escala.
6. Testing docs:
   - `TEST_CURL_WIZARD_AD.md` con batería completa curl.

## Problemas pendientes prioritarios
1. Validar por qué horizontal (landscape) no se siente del todo correcto en algunos móviles/tablets.
2. Confirmar que scroll del wizard y de vistas principales sea consistente en portrait/landscape.
3. Verificar que cambio de etapa ahora ocurra sólo vía guardado de wizard (sin botón manual).
4. Hacer testing completo end-to-end UI + API.

## Archivos críticos a revisar
- `index.php`
- `assets/app.js`
- `assets/wizard-prospecto.js`
- `assets/app.css`
- `api/prospectos.php`
- `TEST_CURL_WIZARD_AD.md`
- `TODO.md`

## Tareas concretas para continuar
1. **Landscape/Responsive**
   - Añadir media queries por orientación (`@media (orientation: landscape)`) para wizard:
     - mejor distribución tabs
     - tamaños de inputs/buttons
     - alto útil de modal
   - Validar iOS Safari + Chrome Android.
2. **Scroll QA**
   - Confirmar no hay doble scroll conflictivo (body/mainContent/modal).
   - Ajustar `overscroll-behavior` y contenedores según hallazgos.
3. **Wizard UX legacy-like**
   - Afinar look para parecer más al modal ERP legacy (stepper/tabs/tabla TV).
4. **Testing Thorough**
   - UI completa: panel/lista/detalle/agenda/mapa/perfil + wizard A-D.
   - API curl con `TEST_CURL_WIZARD_AD.md`.
   - Registrar hallazgos y corregir.

## Criterios de aceptación
- Wizard usable en móvil/tablet portrait y landscape.
- Scroll funcional en todo el flujo, sin bloqueos.
- No existe botón manual “Cambiar etapa” fuera del wizard.
- Guardados A/B/C/D funcionan mediante bridge ERP.
- Sin cambios en código del ERP legacy.

## Notas importantes
- Mantener compatibilidad JS legacy (sin sintaxis moderna riesgosa).
- Cambios quirúrgicos; priorizar estabilidad en producción.
- Documentar cada ajuste en `TODO.md` (checkbox + nota breve).

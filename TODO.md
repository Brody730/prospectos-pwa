# TODO — Integración módulo Prospectos ERP -> PWA (flujo completo)

## 1) Implementación
- [x] Analizar endpoints actuales de PWA para mapear qué ya consume del ERP
- [x] Diseñar estrategia de “misma fuente de datos ERP sin tocar ERP”
- [x] Extender `api/prospectos.php` para passthrough A-D (sin tocar ERP legacy)
- [ ] Extender `api/agenda.php`/`api/sync.php` si hace falta para persistencia compatible
- [x] Implementar en `assets/app.js` acceso al wizard A-D desde detalle
- [x] Crear `assets/wizard-prospecto.js` con flujo base A/B/C/D
- [x] Integrar captura de cámara en Etapa A (mobile/tablet)
- [ ] Integrar guardado de evaluación/seguimiento en actividades
- [x] Ajustar UI/estilos en `assets/app.css` para wizard A-D (mobile-first)
- [x] Quitar botón manual “Cambiar etapa” en detalle (dejar solo etiqueta visual)
- [x] Ajustar viewport para permitir mejor soporte horizontal en mobile/tablet
- [x] Ajustar scroll general y scroll interno del modal wizard

## 2) Testing (Thorough + flujo completo)
- [ ] Probar navegación completa de vistas: panel, lista, detalle, agenda, mapa, perfil
- [ ] Probar formularios y botones de cada vista
- [ ] Probar cambio automático de etapa al guardar desde wizard (sin botón manual)
- [ ] Probar nueva actividad (online/offline)
- [ ] Probar wizard A-D completo (captura/cálculo/guardado)
- [ ] Probar cámara en Etapa A (Android/iOS, portrait/landscape)
- [ ] Probar scroll en toda la app + modal wizard (portrait/landscape)
- [ ] Probar sincronización offline queue completa
- [ ] Probar consistencia de datos mostrados vs ERP
- [ ] Ejecutar pruebas API con curl (happy path, errores y edge cases) usando `TEST_CURL_WIZARD_AD.md`

## 3) Cierre
- [ ] Corregir hallazgos de pruebas
- [ ] Validación final end-to-end
- [ ] Entrega de resumen técnico con cambios y resultados de pruebas

## Bitácora de acciones realizadas por IA (para handoff)
- [x] Se amplió passthrough en `api/prospectos.php` para opciones ERP A-D (bridge sin tocar ERP).
- [x] Se agregó card “WIZARD A-D (ERP)” en detalle (`assets/app.js`).
- [x] Se creó `assets/wizard-prospecto.js` con:
  - carga de oportunidad (`ObtenerOportunidad`)
  - tabs A/B/C/D
  - cámara + galería + subida de adjuntos (`GuardarAdjuntos`) en Etapa A
  - tiempo de vida con puntaje en Etapa B
  - productos B/C (agregar/editar/eliminar)
  - guardados `GuardarEtapaB`, `GuardarEtapaC`/`ModificarEtapaC`, `GuardarEtapaD`
  - acciones cotización (`SolicitarAutorizarCotizacion`, `AutorizarCotizacion`, `ObtenerDocAdmin`)
- [x] Se inyectó script `assets/wizard-prospecto.js` en `index.php`.
- [x] Se mejoró UI mobile wizard en `assets/app.css` (header, tabs con step badge, cards suaves, footer, responsive).
- [x] Se corrigió sanitización de strings en `wizard-prospecto.js` (escape HTML).
- [x] Se removió botón manual “⇆ Cambiar” y se dejó sólo etiqueta de etapa visual en detalle (`assets/app.js`).
- [x] Se ajustó viewport en `index.php` para mejor soporte horizontal (`viewport-fit=cover` y sin bloqueo de escala).
- [x] Se ajustó scroll en `assets/app.css` para evitar bloqueo (body/mainContent/modal-sheet).
- [x] Se agregó scroll lock (`body-modal-open` en `<html>`) al abrir/cerrar cualquier modal (wizard + detalle + actividad + etapa).
- [x] Se agregaron media queries `@media (orientation: landscape)` para wizard: tabs 4-en-fila, modal centrado, tamaños reducidos en móvil landscape (max-height: 500px) y tablet landscape.

## Decisión confirmada
- [x] Alcance funcional: migración visual/funcional del wizard A-D usando bridge/Passthrough a ERP.
- [x] Restricción: **NO tocar ERP legacy** (`/var/www/html/erpdistribucion`).

# TODO — Integración módulo Prospectos ERP -> PWA (flujo completo)

## 1) Implementación
- [x] Analizar endpoints actuales de PWA para mapear qué ya consume del ERP
- [x] Diseñar estrategia de “misma fuente de datos ERP sin tocar ERP”
- [x] Extender `api/prospectos.php` para exponer datos necesarios de etapa B (si faltan)
- [ ] Extender `api/agenda.php`/`api/sync.php` si hace falta para persistencia compatible
- [ ] Implementar en `assets/app.js` wizard A-D (Información / Productos / Tiempo de Vida / Cierre)
- [ ] Integrar captura de cámara en Etapa A (mobile/tablet)
- [ ] Integrar guardado de evaluación/seguimiento en actividades
- [ ] Ajustar UI/estilos en `assets/app.css` para wizard A-D

## 2) Testing (Thorough + flujo completo)
- [ ] Probar navegación completa de vistas: panel, lista, detalle, agenda, mapa, perfil
- [ ] Probar formularios y botones de cada vista
- [ ] Probar cambio de etapa (online/offline)
- [ ] Probar nueva actividad (online/offline)
- [ ] Probar módulo etapa B completo (captura/cálculo/guardado)
- [ ] Probar sincronización offline queue completa
- [ ] Probar consistencia de datos mostrados vs ERP
- [ ] Ejecutar pruebas API con curl (happy path, errores y edge cases)

## 3) Cierre
- [ ] Corregir hallazgos de pruebas
- [ ] Validación final end-to-end
- [ ] Entrega de resumen técnico con cambios y resultados de pruebas

## Decisión confirmada
- [x] Alcance funcional: **persistencia completa de Etapa B** (productos + checklist tiempo de vida) mediante bridge/Passthrough a lógica ERP existente (`GuardarEtapaB`) sin tocar código del ERP legacy.

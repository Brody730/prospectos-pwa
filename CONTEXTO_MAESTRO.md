# CONTEXTO MAESTRO — PWA Prospectos ROGMAI
**Última actualización:** 2026-04-17  
**Autor:** Jozet Ramirez (user server jmendoza)  
**Repo:** https://github.com/Brody730/prospectos-pwa

---

## QUIÉN SOY
Soy Jozet, desarrollador del ERP ROGMAI.  
Estoy construyendo una PWA mobile-first para vendedores de campo para operar sin abrir el ERP web desde el celular.

---

## RUTAS — MUY IMPORTANTE

```bash
# Máquina local (VS Code)
/home/jozet/desktop/erp/pwa-app

# Servidor producción
/var/www/html/erpdistribucion/   # ERP legacy (NO TOCAR)
/var/www/html/prospectos/        # PWA independiente (este repo)
```

URLs:
- https://erprogmai.portalito.com/prospectos/ (PWA)
- https://erprogmai.portalito.com/erpdistribucion/prospectos/ (legacy)

---

## RESUMEN TÉCNICO ACTUAL (SESIÓN)

### Objetivo de esta sesión
Migrar experiencia del modal de prospectos ERP a PWA con enfoque mobile/tablet y mantener lógica de negocio en ERP sin tocar código legacy.

### Restricción clave
✅ **NO tocar ERP legacy** (`/var/www/html/erpdistribucion`).  
Todo se hace por puente en `/var/www/html/prospectos`.

### Cambios implementados

#### 1) UI / flujo wizard A-D
- Se agregó acceso desde detalle en `assets/app.js`:
  - Card “WIZARD A-D (ERP)” + botón Abrir.
- Se creó `assets/wizard-prospecto.js` con flujo base A/B/C/D:
  - Carga de datos: `ObtenerOportunidad`
  - Etapa A: edición datos + cámara/galería + subida adjuntos (`GuardarAdjuntos`)
  - Etapa B: productos + tiempo de vida + puntaje + guardado (`GuardarEtapaB`)
  - Etapa C: productos/totales + guardar/modificar cotización (`GuardarEtapaC` / `ModificarEtapaC`) + solicitar/autorizar
  - Etapa D: cierre (`GuardarEtapaD`)
  - Docs: `ObtenerDocAdmin`

#### 2) Estética mobile/tablet
- `assets/app.css` actualizado con estilos de wizard:
  - header/subtitle/close
  - tabs con step badges A/B/C/D
  - cards internas suaves
  - footer del wizard
  - responsive base mobile/tablet

#### 3) Scroll
- Se ajustó en `assets/app.css`:
  - `html, body` con `overflow-y: auto`
  - `#mainContent` con `overflow-y: auto`
  - `.modal-sheet` con mejor altura y `overscroll-behavior`

#### 4) Cambio de etapa manual retirado
- En `assets/app.js` se removió botón “⇆ Cambiar”.
- Se dejó solo etiqueta visual de etapa.
- La intención es que etapa cambie por guardado desde wizard.

#### 5) Viewport / horizontal
- En `index.php`:
  - Se cambió meta viewport a:
    - `width=device-width, initial-scale=1, viewport-fit=cover`
  - Se quitó `maximum-scale=1, user-scalable=no`.

#### 6) Pruebas API documentadas
- `TEST_CURL_WIZARD_AD.md` creado con batería de curl:
  - happy path, errores y edge cases para wizard + agenda + sync.

---

## ARCHIVOS CLAVE TOCADOS EN ESTA SESIÓN

- `assets/app.js`
- `assets/app.css`
- `assets/wizard-prospecto.js` (nuevo)
- `index.php`
- `TODO.md` (actualizado con bitácora IA)
- `PROMPT_SIGUIENTE.md` (handoff a siguiente IA)
- `TEST_CURL_WIZARD_AD.md` (pruebas curl)

---

## PENDIENTES PRIORITARIOS

1. Validar y terminar ajuste de orientación horizontal en mobile/tablet.
2. Confirmar scroll estable en portrait/landscape en toda la app y dentro del wizard.
3. Validar comportamiento completo de guardado A-D y reflejo de etapa.
4. Ejecutar testing thorough UI + API en entorno con PHP/Apache real.
5. Afinar look visual para acercarlo más al modal ERP legacy (sin romper mobile-first).

---

## ESTADO DE TESTING

- Hecho: revisión por diff/código de cambios.
- Pendiente: testing funcional exhaustivo runtime real.
- Batería recomendada: `TEST_CURL_WIZARD_AD.md`.

---

## ESTILO / COMPATIBILIDAD

- Mantener JS compatible con entorno legacy.
- Comentarios/textos en español.
- Cambios quirúrgicos, sin romper producción.
- Feature behavior controlado desde PWA bridge.

---

## NOTA PARA SIGUIENTE AGENTE

Usar `PROMPT_SIGUIENTE.md` como guía de continuación:  
incluye tareas concretas de landscape, scroll, testing end-to-end y criterios de aceptación.

# Batería de pruebas CURL — Wizard A-D Prospectos PWA

> Ejecutar en servidor donde sí existe PHP/Apache y sesión ERP válida.
> Ruta esperada del proyecto: `/var/www/html/prospectos`

## 0) Preparación de sesión (cookie jar)

```bash
cd /var/www/html/prospectos
COOKIE_JAR=/tmp/prospectos_cookie.txt
BASE_URL="https://erprogmai.portalito.com/prospectos"
```

Si ya tienes sesión activa en navegador, toma cookie de sesión y usa `-b`.
Si no, primero autentica desde navegador y reutiliza cookie.

---

## 1) Smoke test de sesión

```bash
curl -k -s -b "$COOKIE_JAR" -H "Content-Type: application/json" \
  -d '{"option":"TraerEstatus"}' \
  "$BASE_URL/api/prospectos.php"
```

Esperado: `{"result":true,...}`

---

## 2) Obtener prospecto de prueba (u_movimiento)

```bash
curl -k -s -b "$COOKIE_JAR" -H "Content-Type: application/json" \
  -d '{"option":"TraerProspectos","limit":1,"offset":0}' \
  "$BASE_URL/api/prospectos.php"
```

Guardar `u_movimiento` del primer elemento como `UMOV`.

```bash
UMOV=31136
```

---

## 3) Endpoint puente A→D (read endpoints)

### 3.1 ObtenerOportunidad
```bash
curl -k -s -b "$COOKIE_JAR" -H "Content-Type: application/json" \
  -d "{\"option\":\"ObtenerOportunidad\",\"u_movimiento\":\"$UMOV\"}" \
  "$BASE_URL/api/prospectos.php"
```

### 3.2 obtenerCheckTiempoVida
```bash
curl -k -s -b "$COOKIE_JAR" -H "Content-Type: application/json" \
  -d '{"option":"obtenerCheckTiempoVida"}' \
  "$BASE_URL/api/prospectos.php"
```

### 3.3 ModalBuscarProductos
```bash
curl -k -s -b "$COOKIE_JAR" -H "Content-Type: application/json" \
  -d '{"option":"ModalBuscarProductos","filtro":"bache"}' \
  "$BASE_URL/api/prospectos.php"
```

### 3.4 ObtenerDocAdmin
```bash
curl -k -s -b "$COOKIE_JAR" -H "Content-Type: application/json" \
  -d "{\"option\":\"ObtenerDocAdmin\",\"idOportunidad\":\"$UMOV\"}" \
  "$BASE_URL/api/prospectos.php"
```

---

## 4) Guardado Etapa B (persistencia completa)

> Ajusta `idContacto`, `cmbVendedor`, etc. con datos reales de `ObtenerOportunidad`.

```bash
curl -k -s -b "$COOKIE_JAR" -H "Content-Type: application/json" \
  -d "{
    \"option\":\"GuardarEtapaB\",
    \"u_movimientoID\":\"$UMOV\",
    \"idContacto\":\"1\",
    \"soloGuardar\":\"false\",
    \"txtNombreEncargado\":\"QA Encargado\",
    \"txtTelefonoEncargado\":\"4420000000\",
    \"txtCorreoEncargado\":\"qa@correo.com\",
    \"txtKmPlanta\":\"10\",
    \"txtAreaTotal\":\"100\",
    \"txtTiempoDedicado\":\"120\",
    \"txtComentarios\":\"Prueba curl etapa B\",
    \"txtNecesidadesCliente\":\"Necesidades QA\",
    \"txtValorEstimado\":\"1500\",
    \"txtPuntosTV\":\"80\",
    \"txtMesesPuntosTV\":\"18\",
    \"contactsmensid\":\"1\",
    \"productos\":\"[{\\\"stockid\\\":\\\"BACHEO_C\\\",\\\"precio\\\":1,\\\"cantidad\\\":100}]\",
    \"tiempovida\":\"[{\\\"idconcepto\\\":1,\\\"idsuperficie\\\":5,\\\"puntos\\\":20},{\\\"idconcepto\\\":2,\\\"idsuperficie\\\":5,\\\"puntos\\\":20},{\\\"idconcepto\\\":3,\\\"idsuperficie\\\":5,\\\"puntos\\\":20},{\\\"idconcepto\\\":4,\\\"idsuperficie\\\":5,\\\"puntos\\\":20}]\",
    \"imagenesconvertidas\":\"[]\"
  }" \
  "$BASE_URL/api/prospectos.php"
```

---

## 5) Guardado Etapa C (crear o modificar cotización)

### 5.1 GuardarEtapaC
```bash
curl -k -s -b "$COOKIE_JAR" -H "Content-Type: application/json" \
  -d "{
    \"option\":\"GuardarEtapaC\",
    \"u_movimientoID\":\"$UMOV\",
    \"idContacto\":\"1\",
    \"cmbUnidadesNegocio\":\"1\",
    \"cmbVendedor\":\"1\",
    \"subtotal\":\"1000\",
    \"iva\":\"160\",
    \"total\":\"1160\",
    \"txtCondicionesComerciales\":\"Condiciones QA curl\",
    \"productosC\":\"[{\\\"stockid\\\":\\\"BACHEO_C\\\",\\\"precio\\\":1,\\\"cantidad\\\":1000,\\\"iva\\\":0.16,\\\"descripcion\\\":\\\"Bacheo QA\\\",\\\"bandera\\\":0,\\\"descuento1\\\":0}]\"
  }" \
  "$BASE_URL/api/prospectos.php"
```

### 5.2 ModificarEtapaC
```bash
curl -k -s -b "$COOKIE_JAR" -H "Content-Type: application/json" \
  -d "{
    \"option\":\"ModificarEtapaC\",
    \"u_movimientoID\":\"$UMOV\",
    \"idContacto\":\"1\",
    \"txtIdOrderNo\":\"4121\",
    \"cmbUnidadesNegocio\":\"1\",
    \"cmbVendedor\":\"1\",
    \"subtotal\":\"1200\",
    \"iva\":\"192\",
    \"total\":\"1392\",
    \"txtCondicionesComerciales\":\"Condiciones QA modificadas\",
    \"productosC\":\"[{\\\"stockid\\\":\\\"BACHEO_C\\\",\\\"precio\\\":1.2,\\\"cantidad\\\":1000,\\\"iva\\\":0.16,\\\"descripcion\\\":\\\"Bacheo QA mod\\\",\\\"bandera\\\":0,\\\"descuento1\\\":0}]\"
  }" \
  "$BASE_URL/api/prospectos.php"
```

---

## 6) Etapa D

```bash
curl -k -s -b "$COOKIE_JAR" -H "Content-Type: application/json" \
  -d "{\"option\":\"GuardarEtapaD\",\"u_movimiento\":\"$UMOV\",\"dtFechaCierre\":\"2026-05-20\",\"txtComentariosCierre\":\"Cierre QA curl\"}" \
  "$BASE_URL/api/prospectos.php"
```

---

## 7) Cotización (solicitar/autorizar)

```bash
curl -k -s -b "$COOKIE_JAR" -H "Content-Type: application/json" \
  -d "{\"option\":\"SolicitarAutorizarCotizacion\",\"u_movimiento\":\"$UMOV\"}" \
  "$BASE_URL/api/prospectos.php"

curl -k -s -b "$COOKIE_JAR" -H "Content-Type: application/json" \
  -d "{\"option\":\"AutorizarCotizacion\",\"u_movimiento\":\"$UMOV\"}" \
  "$BASE_URL/api/prospectos.php"
```

---

## 8) Adjuntos (base64)

```bash
IMG_B64=$(base64 -w 0 /ruta/imagen.jpg)
curl -k -s -b "$COOKIE_JAR" -H "Content-Type: application/json" \
  -d "{
    \"option\":\"GuardarAdjuntos\",
    \"u_oportunidad\":\"$UMOV\",
    \"imagenesconvertidas\":\"[{\\\"cadena\\\":\\\"data:image/jpeg;base64,$IMG_B64\\\",\\\"nombre\\\":\\\"qa_curl.jpg\\\",\\\"tipo\\\":\\\"image/jpeg\\\"}]\"
  }" \
  "$BASE_URL/api/prospectos.php"
```

---

## 9) Agenda y Sync (thorough API)

### 9.1 TraerAgenda
```bash
curl -k -s -b "$COOKIE_JAR" -H "Content-Type: application/json" \
  -d '{"opcion":"TraerAgenda","fecha":"2026-04-17"}' \
  "$BASE_URL/api/agenda.php"
```

### 9.2 TraerHistorial
```bash
curl -k -s -b "$COOKIE_JAR" -H "Content-Type: application/json" \
  -d "{\"opcion\":\"TraerHistorial\",\"u_movimiento\":\"$UMOV\"}" \
  "$BASE_URL/api/agenda.php"
```

### 9.3 Sync queue (nueva actividad + cambio etapa)
```bash
curl -k -s -b "$COOKIE_JAR" -H "Content-Type: application/json" \
  -d "{
    \"queue\":[
      {
        \"action\":\"nueva_actividad\",
        \"timestamp\":1713350000000,
        \"payload\":{
          \"u_movimiento\":\"$UMOV\",
          \"fecha\":\"2026-04-20\",
          \"hora\":\"10:00\",
          \"concepto\":\"Actividad sync QA\",
          \"titulo\":\"Actividad sync QA\",
          \"descripcion\":\"Prueba cola offline\",
          \"tipo\":1
        }
      },
      {
        \"action\":\"cambio_etapa\",
        \"timestamp\":1713350001000,
        \"payload\":{
          \"u_movimiento\":\"$UMOV\",
          \"cmbCambiarEstatus\":2,
          \"cmbVendedor03\":1,
          \"fechacompromiso\":\"2026-04-21\"
        }
      }
    ]
  }" \
  "$BASE_URL/api/sync.php"
```

---

## 10) Casos de error / edge

1. Sin sesión (sin cookie) → debe regresar `No autorizado`.
2. `u_movimiento` inválido o faltante en endpoints críticos.
3. Fechas inválidas (`GuardarCambioEstatus`, `cambio_etapa`).
4. `GuardarEtapaB` con `productos=[]` y/o `tiempovida=[]`.
5. `GuardarEtapaC` sin `productosC`.
6. `sync.php` con acción desconocida.

---

## 11) Criterio de aceptación

- Todos los endpoints deben responder JSON válido.
- `result=true` en happy paths.
- Cambios visibles al volver a consultar `ObtenerOportunidad` y `TraerHistorial`.
- Sin errores HTML mezclados en respuesta JSON.
- `sync.php` debe reportar `synced` y `errors` coherentes.

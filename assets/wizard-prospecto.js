(function() {
  var Wizard = {
    data: null,
    uMovimiento: '',
    checksTiempoVida: [],
    productosB: [],
    productosC: [],
    imagenesPendientes: [],
    bEditable: false,   // true solo si idstatus < 2 (stage A, antes del primer guardado de B)

    abrir: function(uMovimiento) {
      this.uMovimiento = String(uMovimiento || '');
      if (!this.uMovimiento) {
        PWA.toast('Prospecto inválido', 'warn');
        return;
      }

      var backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop open';
      backdrop.id = 'wizardProspectoBackdrop';
      backdrop.innerHTML = [
        '<div class="modal-sheet wizard-sheet">',
          '<div class="modal-handle"></div>',
          '<div class="wizard-header">',
            '<div class="wizard-title-wrap">',
              '<div class="modal-title" style="margin-bottom:4px">Prospecto A-D</div>',
              '<div class="wizard-subtitle">Flujo móvil integrado al ERP</div>',
            '</div>',
            '<button class="wizard-close" type="button" onclick="PWA.WizardProspecto.cerrar()">✕</button>',
          '</div>',
          '<div id="wizardProspectoContent"><div class="spinner"></div></div>',
        '</div>'
      ].join('');

      backdrop.addEventListener('click', function(e) {
        if (e.target === backdrop) Wizard.cerrar();
      });

      document.body.appendChild(backdrop);
      document.documentElement.classList.add('body-modal-open');
      this.cargarDatos();
    },

    cerrar: function() {
      var bd = document.getElementById('wizardProspectoBackdrop');
      if (bd) bd.parentNode.removeChild(bd);
      if (!document.querySelector('.modal-backdrop.open')) {
        document.documentElement.classList.remove('body-modal-open');
      }
    },

    api: function(payload, cb) {
      PWA.apiPost('api/prospectos.php', payload, cb);
    },

    cargarDatos: function() {
      var self = this;
      self.api({
        option: 'ObtenerOportunidad',
        u_movimiento: self.uMovimiento
      }, function(err, data) {
        if (err || !data || !data.result || !data.contenido || !data.contenido[0]) {
          self.renderError('No se pudo cargar información del prospecto');
          return;
        }

        self.data = data.contenido[0];
        // Productos de B solo editables si idstatus < 2 (aún en stage A, sin guardar B)
        self.bEditable = parseInt(self.data.idstatus || 0, 10) < 2;

        self.productosB = (self.data.productos || []).map(function(p) {
          return {
            stockid: p.stockid,
            descripcion: p.description || '',
            precio: parseFloat(p.precio || 0),
            cantidad: parseFloat(p.cantidad || 0),
            units: p.units || ''
          };
        });

        self.productosC = (self.data.productosC || []).map(function(p) {
          return {
            stockid: p.stockid,
            descripcion: p.narrative || p.description || '',
            precio: parseFloat(p.precio || 0),
            cantidad: parseFloat(p.cantidad || 0),
            taxrate: parseFloat(p.taxrate || 0)
          };
        });

        self.cargarChecksTiempoVida();
      });
    },

    cargarChecksTiempoVida: function() {
      var self = this;
      self.api({ option: 'obtenerCheckTiempoVida' }, function(err, data) {
        if (!err && data && data.result) {
          self.checksTiempoVida = data.contenido || [];
        }
        self.render();
      });
    },

    renderError: function(msg) {
      var cont = document.getElementById('wizardProspectoContent');
      if (!cont) return;
      cont.innerHTML = '<div class="card2" style="color:var(--pwa-danger)">' + msg + '</div>';
    },

    render: function() {
      var cont = document.getElementById('wizardProspectoContent');
      if (!cont || !this.data) return;

      var d = this.data;
      var idstatus = parseInt(d.idstatus || 0, 10);
      var etapaLabel = idstatus <= 1 ? 'A' : idstatus === 2 ? 'B' : idstatus === 3 ? 'C' : idstatus >= 4 ? 'D' : '?';
      var etapaColores = { A: 'var(--pwa-primary)', B: 'var(--pwa-warn)', C: 'var(--pwa-ok)', D: 'var(--pwa-muted)' };
      var etapaColor = etapaColores[etapaLabel] || 'var(--pwa-muted)';

      var html = '';
      html += '<div style="padding:6px 16px 0;display:flex;align-items:center;gap:6px">';
      html += '<div style="font-size:11px;color:var(--pwa-muted)">Etapa actual:</div>';
      html += '<div style="font-size:11px;font-weight:700;color:' + etapaColor + ';background:rgba(0,0,0,0.15);border-radius:4px;padding:2px 8px">' + etapaLabel + ' (status ' + idstatus + ')</div>';
      html += '</div>';
      html += '<div class="wizard-tabs">';
      html += '<button class="wizard-tab active" data-tab="A" onclick="PWA.WizardProspecto.tab(\'A\')"><span class="wizard-step">A</span><span>Prospecto</span></button>';
      html += '<button class="wizard-tab" data-tab="B" onclick="PWA.WizardProspecto.tab(\'B\')"><span class="wizard-step">B</span><span>Visita</span></button>';
      html += '<button class="wizard-tab" data-tab="C" onclick="PWA.WizardProspecto.tab(\'C\')"><span class="wizard-step">C</span><span>Cotización</span></button>';
      html += '<button class="wizard-tab" data-tab="D" onclick="PWA.WizardProspecto.tab(\'D\')"><span class="wizard-step">D</span><span>Cierre</span></button>';
      html += '</div>';

      html += '<div class="wizard-scroll-body">';
      html += '<div id="wizardTabA" class="wizard-pane active">' + this.renderEtapaA(d) + '</div>';
      html += '<div id="wizardTabB" class="wizard-pane">' + this.renderEtapaB(d) + '</div>';
      html += '<div id="wizardTabC" class="wizard-pane">' + this.renderEtapaC(d) + '</div>';
      html += '<div id="wizardTabD" class="wizard-pane">' + this.renderEtapaD(d) + '</div>';
      html += '<div class="wizard-footer"><button class="btn btn-ghost btn-full" onclick="PWA.WizardProspecto.cerrar()">Cerrar</button></div>';
      html += '</div>';

      cont.innerHTML = html;
      this.renderTiempoVidaSeleccion();
      this.recalcularTotalesB();
      this.recalcularTotalesC();
      this.cargarImagenesA();
    },

    cargarImagenesA: function() {
      var self = this;
      self.api({ option: 'obtenerImagenesOportunidad', idOportunidad: self.uMovimiento }, function(err, data) {
        var prev = document.getElementById('wa_preview_a');
        if (!prev) return;
        if (err || !data || !data.result || !data.contenido || !data.contenido.length) {
          prev.textContent = 'Sin imágenes guardadas';
          return;
        }
        var html = '<div style="font-size:11px;color:var(--pwa-muted);margin-bottom:6px">' + data.contenido.length + ' imagen(es) guardada(s):</div>';
        html += '<div style="display:flex;flex-wrap:wrap;gap:8px">';
        data.contenido.forEach(function(img) {
          if (!img.url) return;
          html += '<div style="position:relative">';
          html += '<img src="' + self.e(img.url) + '" alt="' + self.e(img.name) + '" '
               + 'style="width:72px;height:72px;object-fit:cover;border-radius:8px;border:1px solid var(--pwa-border);cursor:pointer" '
               + 'onclick="window.open(\'' + self.e(img.url) + '\',\'_blank\')" '
               + 'onerror="this.parentNode.style.display=\'none\'">';
          html += '<button type="button" '
               + 'style="position:absolute;top:-4px;right:-4px;width:18px;height:18px;border-radius:50%;background:var(--pwa-danger);border:none;color:white;font-size:11px;line-height:1;cursor:pointer" '
               + 'onclick="PWA.WizardProspecto.eliminarImagenA(' + img.iddoc + ',this)">×</button>';
          html += '</div>';
        });
        html += '</div>';
        prev.innerHTML = html;
      });
    },

    eliminarImagenA: function(iddoc, btn) {
      var self = this;
      self.api({ option: 'EliminarImagen', iddoc: iddoc }, function(err, data) {
        if (err || !data || !data.result) {
          PWA.toast('Error al eliminar', 'warn');
          return;
        }
        var thumb = btn && btn.parentNode;
        if (thumb) thumb.parentNode.removeChild(thumb);
        PWA.toast('Imagen eliminada', 'ok');
      });
    },

    tab: function(letra) {
      document.querySelectorAll('.wizard-tab').forEach(function(b) { b.classList.remove('active'); });
      document.querySelectorAll('.wizard-pane').forEach(function(p) { p.classList.remove('active'); });
      var b = document.querySelector('.wizard-tab[data-tab="' + letra + '"]');
      var p = document.getElementById('wizardTab' + letra);
      if (b) b.classList.add('active');
      if (p) p.classList.add('active');
    },

    renderEtapaA: function(d) {
      var nombre = d.prospecto || '';
      var tel = d.telefono_fijo || '';
      var email = d.email || '';
      var dir = d.direccion || '';
      var colonia = d.colonia || '';
      var ciudad = d.ciudad || '';
      var estado = d.estado || '';
      var cp = d.cp || '';
      return [
        '<div class="form-group"><label class="form-label">Nombre prospecto</label><input id="wa_nombre" class="form-input" value="' + this.e(nombre) + '"></div>',
        '<div class="form-group"><label class="form-label">Teléfono</label><input id="wa_tel" class="form-input" value="' + this.e(tel) + '"></div>',
        '<div class="form-group"><label class="form-label">Email</label><input id="wa_email" class="form-input" value="' + this.e(email) + '"></div>',
        '<div class="form-group"><label class="form-label">Dirección</label><input id="wa_dir" class="form-input" value="' + this.e(dir) + '"></div>',
        '<div class="form-group"><label class="form-label">Colonia</label><input id="wa_colonia" class="form-input" value="' + this.e(colonia) + '"></div>',
        '<div class="form-group"><label class="form-label">Ciudad</label><input id="wa_ciudad" class="form-input" value="' + this.e(ciudad) + '"></div>',
        '<div class="form-group"><label class="form-label">Estado</label><input id="wa_estado" class="form-input" value="' + this.e(estado) + '"></div>',
        '<div class="form-group"><label class="form-label">Código postal</label><input id="wa_cp" class="form-input" value="' + this.e(cp) + '"></div>',
        '<div class="card2 wizard-card-soft">',
          '<div style="font-size:12px;color:var(--pwa-muted);margin-bottom:8px">Imágenes Etapa A</div>',
          '<input id="wa_file_gallery" type="file" accept="image/*" multiple style="display:none" onchange="PWA.WizardProspecto.filesSeleccionados(event)">',
          '<input id="wa_file_camera" type="file" accept="image/*" capture="environment" style="display:none" onchange="PWA.WizardProspecto.filesSeleccionados(event)">',
          '<div style="display:flex;gap:8px;flex-wrap:wrap">',
            '<button class="btn btn-ghost" type="button" onclick="document.getElementById(\'wa_file_gallery\').click()">Seleccionar</button>',
            '<button class="btn btn-primary" type="button" onclick="document.getElementById(\'wa_file_camera\').click()">📷 Cámara</button>',
            '<button class="btn btn-ghost" type="button" onclick="PWA.WizardProspecto.subirImagenesA()">Subir imágenes</button>',
          '</div>',
          '<div id="wa_preview_a" style="margin-top:8px;font-size:12px;color:var(--pwa-muted)"></div>',
        '</div>',
        '<div style="margin-top:10px"><button class="btn btn-primary btn-full" type="button" onclick="PWA.WizardProspecto.guardarEtapaA()">Guardar Etapa A</button></div>'
      ].join('');
    },

    renderEtapaB: function(d) {
      return [
        '<div class="form-group"><label class="form-label">Encargado Proyecto</label><input id="wb_encargado" class="form-input" value="' + this.e(d.encargado_proyecto || '') + '"></div>',
        '<div class="form-group"><label class="form-label">Teléfono Encargado</label><input id="wb_tel" class="form-input" value="' + this.e(d.telefono_encargado || '') + '"></div>',
        '<div class="form-group"><label class="form-label">Correo Encargado</label><input id="wb_correo" class="form-input" value="' + this.e(d.correo_encargado || '') + '"></div>',
        '<div class="form-group"><label class="form-label">KM Planta / Lugar</label><input id="wb_km" class="form-input" value="' + this.e(d.km_planta || '') + '"></div>',
        '<div class="form-group"><label class="form-label">Área total</label><input id="wb_area" class="form-input" value="' + this.e(d.area_total || '') + '"></div>',
        '<div class="form-group"><label class="form-label">Tiempo dedicado cliente</label><input id="wb_tded" class="form-input" value="' + this.e(d.tiempo_dedicado || '') + '"></div>',
        '<div class="form-group"><label class="form-label">Descripción/Necesidades</label><textarea id="wb_desc" class="form-textarea">' + this.e(d.descripcion || '') + '</textarea></div>',
        '<div class="form-group"><label class="form-label">Comentarios</label><textarea id="wb_comments" class="form-textarea">' + this.e(d.cometarios || '') + '</textarea></div>',
        '<div class="card2 wizard-card-soft">',
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">',
            '<div style="font-size:12px;color:var(--pwa-muted)">Productos Etapa B</div>',
            (this.bEditable ? '<button class="btn btn-ghost" type="button" onclick="PWA.WizardProspecto.abrirModalBusqueda(\'B\')">+ Producto</button>' : '<span style="font-size:11px;color:var(--pwa-warn)">Solo lectura</span>'),
          '</div>',
          '<div id="wb_productos"></div>',
        '</div>',
        '<div class="card2 wizard-card-soft" style="margin-top:10px">',
          '<div style="font-size:12px;color:var(--pwa-muted);margin-bottom:8px">Tiempo de vida</div>',
          '<div id="wb_tiempovida"></div>',
          '<div style="margin-top:8px;font-weight:700">Puntaje: <span id="wb_puntos">0</span></div>',
          '<div id="wb_alerta" style="margin-top:6px;font-size:12px;color:var(--pwa-muted)"></div>',
        '</div>',
        '<div class="form-group" style="margin-top:10px"><label class="form-label">Valor estimado</label><input id="wb_valor" class="form-input" value="' + this.e(d.cargo || '0') + '"></div>',
        '<div style="margin-top:10px;display:flex;gap:8px"><button class="btn btn-ghost" type="button" onclick="PWA.WizardProspecto.guardarEtapaB(true)" style="flex:1">Solo guardar</button><button class="btn btn-primary" type="button" onclick="PWA.WizardProspecto.guardarEtapaB(false)" style="flex:1">Guardar Etapa B</button></div>'
      ].join('');
    },

    renderEtapaC: function(d) {
      var orderno = (d.cotizaciones && d.cotizaciones[0] && d.cotizaciones[0].orderno) ? d.cotizaciones[0].orderno : '';
      var tagref = (d.cotizaciones && d.cotizaciones[0] && d.cotizaciones[0].tagref) ? d.cotizaciones[0].tagref : '';
      var condiciones = (d.pdftemplates && d.pdftemplates[0] && d.pdftemplates[0].consulta) ? d.pdftemplates[0].consulta : '';
      return [
        '<div class="form-group"><label class="form-label">OrderNo (si existe)</label><input id="wc_orderno" class="form-input" value="' + this.e(orderno) + '"></div>',
        '<div class="form-group"><label class="form-label">Unidad negocio</label><input id="wc_tagref" class="form-input" value="' + this.e(tagref) + '" placeholder="Ej: 1"></div>',
        '<div class="card2 wizard-card-soft">',
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">',
            '<div style="font-size:12px;color:var(--pwa-muted)">Productos Etapa C</div>',
            '<button class="btn btn-ghost" type="button" onclick="PWA.WizardProspecto.abrirModalBusqueda(\'C\')">+ Producto</button>',
          '</div>',
          '<div id="wc_productos"></div>',
          '<div style="margin-top:8px;font-size:12px;color:var(--pwa-muted)">Subtotal: <span id="wc_sub">0.00</span> · IVA: <span id="wc_iva">0.00</span> · Total: <span id="wc_total">0.00</span></div>',
        '</div>',
        '<div class="form-group"><label class="form-label">Condiciones comerciales</label><textarea id="wc_cond" class="form-textarea">' + this.e(condiciones) + '</textarea></div>',
        '<div style="display:flex;gap:8px;flex-wrap:wrap">',
          '<button class="btn btn-primary" type="button" onclick="PWA.WizardProspecto.guardarEtapaC()">Guardar/Actualizar Etapa C</button>',
          '<button class="btn btn-ghost" type="button" onclick="PWA.WizardProspecto.solicitarCotizacion()">Solicitar autorización</button>',
          '<button class="btn btn-ghost" type="button" onclick="PWA.WizardProspecto.autorizarCotizacion()">Autorizar</button>',
          '<button class="btn btn-ghost" type="button" onclick="PWA.WizardProspecto.verDocs()">Ver docs</button>',
        '</div>'
      ].join('');
    },

    renderEtapaD: function(d) {
      var fecha = d.fecha_compromiso ? String(d.fecha_compromiso).substring(0, 10) : PWA.fechaHoy();
      return [
        '<div class="form-group"><label class="form-label">Fecha cierre estimada</label><input id="wd_fecha" type="date" class="form-input" value="' + this.e(fecha) + '"></div>',
        '<div class="form-group"><label class="form-label">Comentarios</label><textarea id="wd_comments" class="form-textarea"></textarea></div>',
        '<button class="btn btn-primary btn-full" type="button" onclick="PWA.WizardProspecto.guardarEtapaD()">Guardar Etapa D</button>'
      ].join('');
    },

    filesSeleccionados: function(ev) {
      var files = (ev.target && ev.target.files) ? Array.prototype.slice.call(ev.target.files) : [];
      if (!files.length) return;
      this.imagenesPendientes = this.imagenesPendientes.concat(files);
      var prev = document.getElementById('wa_preview_a');
      if (prev) prev.textContent = this.imagenesPendientes.length + ' imagen(es) lista(s) para subir';
      // Si viene de la cámara, subir automáticamente sin botón extra
      if (ev.target && ev.target.id === 'wa_file_camera') {
        this.subirImagenesA();
      }
    },

    subirImagenesA: function() {
      var self = this;
      if (!self.imagenesPendientes.length) {
        PWA.toast('No hay imágenes seleccionadas', 'warn');
        return;
      }

      var prev = document.getElementById('wa_preview_a');
      if (prev) prev.textContent = 'Subiendo...';

      var convertidas = [];
      var pendientes = self.imagenesPendientes.length;
      var ext = { 'image/png': '.png', 'image/gif': '.gif', 'image/webp': '.webp' };

      self.imagenesPendientes.forEach(function(file) {
        var reader = new FileReader();
        reader.onload = function() {
          var sufijo = ext[file.type] || '.jpg';
          convertidas.push({
            cadena: reader.result,
            nombre: 'pwa_' + Date.now() + '_' + Math.floor(Math.random() * 10000) + sufijo,
            tipo: file.type || 'image/jpeg'
          });
          pendientes--;
          if (pendientes === 0) {
            self.api({
              option: 'GuardarAdjuntos',
              u_oportunidad: self.uMovimiento,
              imagenesconvertidas: JSON.stringify(convertidas)
            }, function(err, data) {
              if (err || !data || !data.result) {
                var msg = (data && data.msjError) ? data.msjError : 'Error al subir imágenes';
                if (prev) prev.textContent = 'Error: ' + msg;
                PWA.toast(msg, 'warn');
                return;
              }
              self.imagenesPendientes = [];
              var g = data.guardadas || convertidas.length;
              if (prev) prev.textContent = g + ' imagen(es) guardada(s) ✓';
              PWA.toast('Imágenes guardadas ✓', 'ok');
            });
          }
        };
        reader.readAsDataURL(file);
      });
    },

    guardarEtapaA: function() {
      var d = this.data || {};
      var payload = {
        option: d.debtorno ? 'modificarEtapaA' : 'insertarEtapaA',
        idOportunidad: this.uMovimiento,
        idProspecto: d.debtorno || '',
        aPaterno: document.getElementById('wa_nombre').value,
        email: document.getElementById('wa_email').value,
        telefonoFijo: document.getElementById('wa_tel').value,
        direccion: document.getElementById('wa_dir').value,
        colonia: document.getElementById('wa_colonia').value,
        ciudad: document.getElementById('wa_ciudad').value,
        estado: document.getElementById('wa_estado').value,
        cp: document.getElementById('wa_cp').value,
        cmbVendedor: d.salesman || '',
        txtComentarios: d.cometarios || '',
        txtLinkMapa_pros: d.link_google_map || '',
        SectComClId: d.SectComClId || '',
        CustLeadSourceId: d.fuente_contacto || 1
      };

      this.api(payload, function(err, data) {
        if (err || !data || !data.result) {
          PWA.toast('Error al guardar Etapa A', 'warn');
          return;
        }
        PWA.toast('Etapa A guardada ✓', 'ok');
      });
    },

    renderTiempoVidaSeleccion: function() {
      var cont = document.getElementById('wb_tiempovida');
      if (!cont) return;
      var selected = {};
      (this.data.tiempovida || []).forEach(function(t) {
        selected[String(t.idConcepto)] = String(t.idSuperficie);
      });

      var html = '<div class="tv-grid"><div></div><div>Pésimo</div><div>Malo</div><div>Regular</div><div>Bueno</div><div>Excelente</div>';
      (this.checksTiempoVida || []).forEach(function(c) {
        html += '<div class="tv-label">' + c.descripcion + '</div>';
        var vals = [c.pesimo, c.malo, c.regular, c.bueno, c.excelente];
        for (var i = 0; i < 5; i++) {
          var sup = String(i + 1);
          var ck = selected[String(c.id)] === sup ? 'checked' : '';
          html += '<div><input type="radio" name="tv_' + c.id + '" data-idconcepto="' + c.id + '" data-idsuperficie="' + sup + '" data-val="' + vals[i] + '" ' + ck + ' onchange="PWA.WizardProspecto.recalcularTV()"></div>';
        }
      });
      html += '</div>';
      cont.innerHTML = html;
      this.recalcularTV();
      this.renderProductosB();
      this.renderProductosC();
    },

    recalcularTV: function() {
      var radios = document.querySelectorAll('#wb_tiempovida input[type=radio]:checked');
      var total = 0;
      radios.forEach(function(r) { total += parseFloat(r.getAttribute('data-val') || 0); });
      var puntos = document.getElementById('wb_puntos');
      if (puntos) puntos.textContent = total.toFixed(2);
      var alerta = document.getElementById('wb_alerta');
      if (alerta) alerta.textContent = this.getTVText(total);
    },

    getTVText: function(total) {
      if (total <= 19) return 'Pésimo · 1 Mes';
      if (total <= 39) return 'Malo · 3 Meses';
      if (total <= 59) return 'Regular · 6 Meses';
      if (total <= 79) return 'Bueno · 12 Meses';
      return 'Excelente · 18 Meses';
    },

    getTVMeses: function(total) {
      if (total <= 19) return '1';
      if (total <= 39) return '3';
      if (total <= 59) return '6';
      if (total <= 79) return '12';
      return '18';
    },

    renderProductosB: function() {
      var cont = document.getElementById('wb_productos');
      if (!cont) return;
      var editable = this.bEditable;
      var html = '';
      if (!this.productosB.length) {
        html = '<div style="font-size:12px;color:var(--pwa-muted)">Sin productos</div>';
      } else {
        html = '<table class="w-table"><thead><tr><th>Código</th><th>Descripción</th><th>Cant</th><th>P.U.</th><th>Total</th>' + (editable ? '<th></th>' : '') + '</tr></thead><tbody>';
        this.productosB.forEach(function(p, i) {
          var total = (parseFloat(p.cantidad || 0) * parseFloat(p.precio || 0)).toFixed(2);
          html += '<tr>';
          html += '<td>' + p.stockid + '</td>';
          html += '<td>' + p.descripcion + '</td>';
          if (editable) {
            html += '<td><input class="form-input w-sm" value="' + p.cantidad + '" onchange="PWA.WizardProspecto.editarProductoB(' + i + ', this.value)"></td>';
          } else {
            html += '<td>' + p.cantidad + '</td>';
          }
          html += '<td>' + p.precio.toFixed(2) + '</td>';
          html += '<td>' + total + '</td>';
          if (editable) {
            html += '<td><button class="btn btn-ghost" type="button" onclick="PWA.WizardProspecto.borrarProductoB(' + i + ')">×</button></td>';
          }
          html += '</tr>';
        });
        html += '</tbody></table>';
      }
      cont.innerHTML = html;
      this.recalcularTotalesB();
    },

    editarProductoB: function(i, val) {
      this.productosB[i].cantidad = parseFloat(val || 0);
      this.renderProductosB();
    },

    borrarProductoB: function(i) {
      this.productosB.splice(i, 1);
      this.renderProductosB();
    },

    recalcularTotalesB: function() {
      var total = 0;
      this.productosB.forEach(function(p) {
        total += (parseFloat(p.cantidad || 0) * parseFloat(p.precio || 0));
      });
      var v = document.getElementById('wb_valor');
      if (v && (!v.value || parseFloat(v.value) === 0)) v.value = total.toFixed(2);
    },

    renderProductosC: function() {
      var cont = document.getElementById('wc_productos');
      if (!cont) return;
      var html = '';
      if (!this.productosC.length) {
        html = '<div style="font-size:12px;color:var(--pwa-muted)">Sin productos</div>';
      } else {
        html = '<table class="w-table"><thead><tr><th>Código</th><th>Descripción</th><th>Cant</th><th>P.U.</th><th>IVA</th><th>Total</th><th></th></tr></thead><tbody>';
        this.productosC.forEach(function(p, i) {
          var subtotal = parseFloat(p.cantidad || 0) * parseFloat(p.precio || 0);
          var total = subtotal * (1 + parseFloat(p.taxrate || 0));
          html += '<tr>';
          html += '<td>' + p.stockid + '</td>';
          html += '<td>' + p.descripcion + '</td>';
          html += '<td><input class="form-input w-sm" value="' + p.cantidad + '" onchange="PWA.WizardProspecto.editarProductoC(' + i + ',\'cantidad\', this.value)"></td>';
          html += '<td><input class="form-input w-sm" value="' + p.precio + '" onchange="PWA.WizardProspecto.editarProductoC(' + i + ',\'precio\', this.value)"></td>';
          html += '<td>' + (parseFloat(p.taxrate || 0) * 100).toFixed(0) + '%</td>';
          html += '<td>' + total.toFixed(2) + '</td>';
          html += '<td><button class="btn btn-ghost" type="button" onclick="PWA.WizardProspecto.borrarProductoC(' + i + ')">x</button></td>';
          html += '</tr>';
        });
        html += '</tbody></table>';
      }
      cont.innerHTML = html;
      this.recalcularTotalesC();
    },

    editarProductoC: function(i, campo, val) {
      this.productosC[i][campo] = parseFloat(val || 0);
      this.renderProductosC();
    },

    borrarProductoC: function(i) {
      this.productosC.splice(i, 1);
      this.renderProductosC();
    },

    recalcularTotalesC: function() {
      var sub = 0, iva = 0, total = 0;
      this.productosC.forEach(function(p) {
        var s = parseFloat(p.cantidad || 0) * parseFloat(p.precio || 0);
        var iv = s * parseFloat(p.taxrate || 0);
        sub += s;
        iva += iv;
        total += (s + iv);
      });
      var eSub = document.getElementById('wc_sub');
      var eIva = document.getElementById('wc_iva');
      var eTot = document.getElementById('wc_total');
      if (eSub) eSub.textContent = sub.toFixed(2);
      if (eIva) eIva.textContent = iva.toFixed(2);
      if (eTot) eTot.textContent = total.toFixed(2);
    },

    abrirModalBusqueda: function(etapa) {
      var viejo = document.getElementById('wBusqBackdrop');
      if (viejo) viejo.parentNode.removeChild(viejo);

      var bd = document.createElement('div');
      bd.id = 'wBusqBackdrop';
      bd.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:flex-end';
      bd.innerHTML = [
        '<div id="wBusqSheet" style="width:100%;height:80vh;background:var(--pwa-card);border-radius:18px 18px 0 0;display:flex;flex-direction:column;overflow:hidden">',
          '<div style="padding:16px 16px 0">',
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">',
              '<div style="font-weight:700;font-size:15px;flex:1">Agregar producto · Etapa ' + etapa + '</div>',
              '<button type="button" id="wBusqClose" style="background:var(--pwa-card2);border:1px solid var(--pwa-border);border-radius:8px;color:var(--pwa-text);width:32px;height:32px;font-size:16px;cursor:pointer;flex-shrink:0">✕</button>',
            '</div>',
            '<input id="wBusqInput" class="form-input" placeholder="Filtrar por nombre o código..." style="width:100%;box-sizing:border-box;margin-bottom:10px">',
            '<div id="wBusqConteo" style="font-size:11px;color:var(--pwa-muted);margin-bottom:6px"></div>',
          '</div>',
          '<div id="wBusqResultados" style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:0 16px 16px"></div>',
        '</div>'
      ].join('');

      bd.addEventListener('click', function(e) { if (e.target === bd) bd.remove(); });
      bd.querySelector('#wBusqClose').addEventListener('click', function() { bd.remove(); });
      document.body.appendChild(bd);

      var inp = document.getElementById('wBusqInput');
      inp.focus();

      // Cargar todos los productos al abrir
      PWA.WizardProspecto.ejecutarBusqueda(etapa);

      // Filtrado en tiempo real con debounce
      var timer;
      inp.addEventListener('input', function() {
        clearTimeout(timer);
        timer = setTimeout(function() {
          PWA.WizardProspecto.ejecutarBusqueda(etapa);
        }, 300);
      });
      inp.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') { clearTimeout(timer); PWA.WizardProspecto.ejecutarBusqueda(etapa); }
      });
    },

    ejecutarBusqueda: function(etapa) {
      var self = this;
      var input = document.getElementById('wBusqInput');
      var filtro = input ? input.value.trim() : '';
      var cont = document.getElementById('wBusqResultados');
      var conteo = document.getElementById('wBusqConteo');
      if (cont) cont.innerHTML = '<div style="text-align:center;padding:24px"><div class="spinner" style="margin:0 auto"></div></div>';
      if (conteo) conteo.textContent = '';

      self.api({ option: 'ModalBuscarProductos', filtro: filtro }, function(err, data) {
        if (!cont) return;
        if (err || !data || !data.result) {
          cont.innerHTML = '<div style="color:var(--pwa-danger);padding:12px">Error al cargar productos</div>';
          return;
        }
        var lista = data.contenido || [];
        if (conteo) conteo.textContent = lista.length + ' producto(s)' + (filtro ? ' para "' + filtro + '"' : '');
        if (!lista.length) {
          cont.innerHTML = '<div style="font-size:13px;color:var(--pwa-muted);padding:24px;text-align:center">Sin resultados' + (filtro ? ' para "' + self.e(filtro) + '"' : '') + '</div>';
          return;
        }
        var html = '';
        lista.forEach(function(p) {
          var pJson = JSON.stringify(p).replace(/'/g, '&#39;');
          html += '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--pwa-border)">';
          html += '<div style="flex:1;min-width:0">';
          html += '<div style="font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + self.e(p.description) + '</div>';
          html += '<div style="font-size:11px;color:var(--pwa-muted);margin-top:2px">' + self.e(p.stockid) + ' · $' + p.price + ' · ' + self.e(p.units || '') + '</div>';
          html += '</div>';
          html += '<button class="btn btn-primary" type="button" style="flex-shrink:0;padding:6px 12px;font-size:12px" '
               + 'onclick="PWA.WizardProspecto.seleccionarProducto(\'' + etapa + '\',' + pJson + ')">Agregar</button>';
          html += '</div>';
        });
        cont.innerHTML = html;
      });
    },

    seleccionarProducto: function(etapa, p) {
      var cantidadBase = parseFloat((document.getElementById('wb_area') || {}).value || 1) || 1;
      if (etapa === 'B') {
        this.productosB.push({
          stockid: p.stockid,
          descripcion: p.description,
          precio: parseFloat(p.price || 0),
          cantidad: cantidadBase,
          units: p.units || ''
        });
        this.renderProductosB();
      } else {
        this.productosC.push({
          stockid: p.stockid,
          descripcion: p.description,
          precio: parseFloat(p.price || 0),
          cantidad: 1,
          taxrate: parseFloat(p.taxrate || 0)
        });
        this.renderProductosC();
      }
      var bd = document.getElementById('wBusqBackdrop');
      if (bd) bd.remove();
      PWA.toast(p.description + ' agregado', 'ok');
    },

    guardarEtapaB: function(soloGuardar) {
      var radios = document.querySelectorAll('#wb_tiempovida input[type=radio]:checked');
      var tv = [];
      radios.forEach(function(r) {
        tv.push({
          idconcepto: r.getAttribute('data-idconcepto'),
          idsuperficie: r.getAttribute('data-idsuperficie'),
          puntos: r.getAttribute('data-val')
        });
      });

      var puntos = parseFloat((document.getElementById('wb_puntos') || { textContent: '0' }).textContent || 0);
      var payload = {
        option: 'GuardarEtapaB',
        u_movimientoID: this.uMovimiento,
        idContacto: this.data.id_contacto || '',
        soloGuardar: soloGuardar ? 'true' : 'false',
        txtNombreEncargado: (document.getElementById('wb_encargado') || { value: '' }).value,
        txtTelefonoEncargado: (document.getElementById('wb_tel') || { value: '' }).value,
        txtCorreoEncargado: (document.getElementById('wb_correo') || { value: '' }).value,
        txtKmPlanta: (document.getElementById('wb_km') || { value: '' }).value,
        txtAreaTotal: (document.getElementById('wb_area') || { value: '' }).value,
        txtTiempoDedicado: (document.getElementById('wb_tded') || { value: '' }).value,
        txtComentarios: (document.getElementById('wb_comments') || { value: '' }).value,
        txtNecesidadesCliente: (document.getElementById('wb_desc') || { value: '' }).value,
        txtValorEstimado: (document.getElementById('wb_valor') || { value: '0' }).value,
        txtPuntosTV: puntos.toFixed(2),
        txtMesesPuntosTV: this.getTVMeses(puntos),
        productos: JSON.stringify(this.productosB.map(function(p) {
          return { stockid: p.stockid, precio: p.precio, cantidad: p.cantidad };
        })),
        tiempovida: JSON.stringify(tv),
        imagenesconvertidas: '[]',
        contactsmensid: this.data.medio_contacto || ''
      };

      this.api(payload, function(err, data) {
        if (err || !data || !data.result) {
          PWA.toast('Error al guardar Etapa B', 'warn');
          return;
        }
        PWA.toast('Etapa B guardada ✓', 'ok');
      });
    },

    guardarEtapaC: function() {
      var subtotal = 0, iva = 0, total = 0;
      this.productosC.forEach(function(p) {
        var s = parseFloat(p.cantidad || 0) * parseFloat(p.precio || 0);
        var i = s * parseFloat(p.taxrate || 0);
        subtotal += s; iva += i; total += (s + i);
      });

      var orderno = (document.getElementById('wc_orderno') || { value: '' }).value;
      var payload = {
        option: orderno ? 'ModificarEtapaC' : 'GuardarEtapaC',
        u_movimientoID: this.uMovimiento,
        idContacto: this.data.id_contacto || '',
        txtIdOrderNo: orderno,
        cmbUnidadesNegocio: (document.getElementById('wc_tagref') || { value: '' }).value,
        cmbVendedor: this.data.salesman || '',
        subtotal: subtotal.toFixed(2),
        iva: iva.toFixed(2),
        total: total.toFixed(2),
        txtCondicionesComerciales: (document.getElementById('wc_cond') || { value: '' }).value,
        productosC: JSON.stringify(this.productosC.map(function(p) {
          return {
            stockid: p.stockid,
            precio: p.precio,
            cantidad: p.cantidad,
            iva: p.taxrate,
            descripcion: p.descripcion,
            bandera: 0,
            descuento1: 0
          };
        }))
      };

      this.api(payload, function(err, data) {
        if (err || !data || !data.result) {
          PWA.toast('Error al guardar Etapa C', 'warn');
          return;
        }
        PWA.toast('Etapa C guardada ✓', 'ok');
      });
    },

    guardarEtapaD: function() {
      var payload = {
        option: 'GuardarEtapaD',
        u_movimiento: this.uMovimiento,
        dtFechaCierre: (document.getElementById('wd_fecha') || { value: PWA.fechaHoy() }).value,
        txtComentariosCierre: (document.getElementById('wd_comments') || { value: '' }).value
      };

      this.api(payload, function(err, data) {
        if (err || !data || !data.result) {
          PWA.toast('Error al guardar Etapa D', 'warn');
          return;
        }
        PWA.toast('Etapa D guardada ✓', 'ok');
      });
    },

    solicitarCotizacion: function() {
      this.api({ option: 'SolicitarAutorizarCotizacion', u_movimiento: this.uMovimiento }, function(err, data) {
        if (err || !data || !data.result) {
          PWA.toast('No se pudo solicitar autorización', 'warn');
          return;
        }
        PWA.toast('Solicitud enviada ✓', 'ok');
      });
    },

    autorizarCotizacion: function() {
      this.api({ option: 'AutorizarCotizacion', u_movimiento: this.uMovimiento }, function(err, data) {
        if (err || !data || !data.result) {
          PWA.toast('No se pudo autorizar', 'warn');
          return;
        }
        PWA.toast('Cotización autorizada ✓', 'ok');
      });
    },

    verDocs: function() {
      this.api({ option: 'ObtenerDocAdmin', idOportunidad: this.uMovimiento }, function(err, data) {
        if (err || !data || !data.result) {
          PWA.toast('No se pudieron cargar documentos', 'warn');
          return;
        }
        var c = data.contenido && data.contenido[0] ? data.contenido[0] : { cotizaciones: [], timbres: [] };
        PWA.toast('Docs: ' + (c.cotizaciones || []).length + ' cotización(es), ' + (c.timbres || []).length + ' timbre(s)', 'ok');
      });
    },

    e: function(v) {
      return String(v || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
        .replace(/'/g, '&#39;');
    }
  };

  PWA.WizardProspecto = Wizard;
})();

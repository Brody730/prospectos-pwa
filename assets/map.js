/* ============================================================
   map.js — Leaflet + GPS
   PWA Prospectos ROGMAI
   ============================================================ */

var PWA = PWA || {};

PWA.Geo = {
  registrarPosicion: function(lat, lng) {
    if (!navigator.onLine) return;
    fetch('api/geo.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opcion: 'RegistrarPosicion', lat: lat, lng: lng })
    }).catch(function() { /* silencioso */ });
  }
};

PWA.Mapa = {
  map:          null,
  markersLayer: null,
  miPosicion:   null,
  watchId:      null,

  cargar: function() {
    var el = document.getElementById('view-mapa');

    if (!document.getElementById('mapaLeaflet')) {
      el.innerHTML = [
        '<div id="mapaLeaflet" style="flex:1;min-height:0"></div>',
        '<div class="mapa-lista" id="mapaLista">',
          '<p class="section-title">Prospectos cercanos</p>',
          '<div id="mapaListaItems"><div class="spinner"></div></div>',
        '</div>'
      ].join('');
    }

    // Inicializar Leaflet solo una vez
    if (!PWA.Mapa.map) {
      // Centro por defecto: Querétaro
      PWA.Mapa.map = L.map('mapaLeaflet', {
        center: [20.5888, -100.3899],
        zoom: 12,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(PWA.Mapa.map);

      PWA.Mapa.markersLayer = L.layerGroup().addTo(PWA.Mapa.map);
    }

    // Leaflet necesita invalidateSize cuando el contenedor se muestra
    setTimeout(function() {
      if (PWA.Mapa.map) PWA.Mapa.map.invalidateSize();
    }, 100);

    // Long-press en mapa (en area sin pin) → crear nuevo prospecto con esas coords
    PWA.Mapa._cablearLongPress();

    PWA.Mapa.obtenerMiPosicion();
    PWA.Mapa.cargarProspectosEnMapa();
  },

  /* ── Long-press (600ms) en mapa vacio → NuevoProspecto con coords ── */
  _tempMarker: null,
  _longPressTimer: null,

  _cablearLongPress: function() {
    if (!PWA.Mapa.map || PWA.Mapa._longPressCableado) return;
    PWA.Mapa._longPressCableado = true;

    var map = PWA.Mapa.map;

    // Android/iOS: contextmenu dispara con long-press
    map.on('contextmenu', function(e) {
      PWA.Mapa._abrirNuevoEnCoord(e.latlng);
    });

    // Fallback para navegadores que no emiten contextmenu bien en touch:
    // detectar mousedown/touchstart y medir duracion
    var startPos = null;
    map.on('mousedown', function(e) {
      // Ignorar si toco un pin (Leaflet los maneja aparte)
      if (e.originalEvent && e.originalEvent.target &&
          e.originalEvent.target.closest('.leaflet-marker-icon')) return;

      startPos = e.latlng;
      clearTimeout(PWA.Mapa._longPressTimer);
      PWA.Mapa._longPressTimer = setTimeout(function() {
        if (startPos) PWA.Mapa._abrirNuevoEnCoord(startPos);
      }, 600);
    });

    map.on('mouseup',    function() { clearTimeout(PWA.Mapa._longPressTimer); });
    map.on('mousemove',  function() { clearTimeout(PWA.Mapa._longPressTimer); });
    map.on('dragstart',  function() { clearTimeout(PWA.Mapa._longPressTimer); });
    map.on('movestart',  function() { clearTimeout(PWA.Mapa._longPressTimer); });
  },

  _abrirNuevoEnCoord: function(latlng) {
    if (!latlng) return;
    var lat = latlng.lat.toFixed(6);
    var lng = latlng.lng.toFixed(6);

    // Marker temporal para feedback visual
    if (PWA.Mapa._tempMarker) {
      PWA.Mapa.map.removeLayer(PWA.Mapa._tempMarker);
    }
    PWA.Mapa._tempMarker = L.marker([lat, lng], {
      icon: L.divIcon({
        html: '<div style="width:18px;height:18px;border-radius:50%;background:#f59e0b;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);animation:mapaTempPin 1.2s ease-in-out infinite"></div>',
        className: '',
        iconSize:   [18, 18],
        iconAnchor: [9, 9]
      })
    }).addTo(PWA.Mapa.map);

    // Abrir NuevoProspecto con coords precargadas
    if (PWA.NuevoProspecto && typeof PWA.NuevoProspecto.abrir === 'function') {
      PWA.NuevoProspecto.abrir({ lat: lat, lng: lng });
    } else {
      // Si aun no existe la funcion que acepta coords, usar la API existente
      // y esperar que el form aparezca para llenar el campo.
      if (PWA.NuevoProspecto && PWA.NuevoProspecto.abrir) {
        PWA.NuevoProspecto.abrir();
      }
      setTimeout(function() {
        var el = document.getElementById('np_linkMapa');
        if (el) {
          el.value = lat + ',' + lng;
          // Disparar reverseGeocode si existe
          if (PWA.NuevoProspecto && typeof PWA.NuevoProspecto._llenarDireccionDesdeInput === 'function') {
            PWA.NuevoProspecto._llenarDireccionDesdeInput(false);
          }
        }
      }, 300);
    }
  },

  colorPorEstado: function(prospecto) {
    var hoy = new Date().toISOString().split('T')[0];
    var fa  = (prospecto.fecha_actividad || '').substring(0, 10);
    if (!fa)        return '#4f8ef7'; // nuevo — azul
    if (fa < hoy)   return '#ef4444'; // vencido — rojo
    if (fa === hoy) return '#f59e0b'; // hoy — amarillo
    return '#34d399';                 // al corriente — verde
  },

  crearPin: function(color) {
    return L.divIcon({
      html: '<div style="width:14px;height:14px;border-radius:50%;background:' + color +
            ';border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.5)"></div>',
      className: '',
      iconSize:   [14, 14],
      iconAnchor: [7, 7]
    });
  },

  /* ── Trazar ruta en Google Maps (origen = GPS actual, destino = prospecto) ── */
  trazarRuta: function(destLat, destLng) {
    destLat = parseFloat(destLat);
    destLng = parseFloat(destLng);
    if (!destLat || !destLng) {
      if (PWA && PWA.toast) PWA.toast('Coordenadas invalidas', 'warn');
      return;
    }

    function abrirConOrigen(origLat, origLng) {
      var base = 'https://www.google.com/maps/dir/?api=1';
      var url;
      if (origLat && origLng) {
        url = base + '&origin=' + origLat + ',' + origLng +
                     '&destination=' + destLat + ',' + destLng +
                     '&travelmode=driving';
      } else {
        // Sin origen → Google Maps tomara la ubicacion del dispositivo
        url = base + '&destination=' + destLat + ',' + destLng +
                     '&travelmode=driving';
      }
      window.open(url, '_blank');
    }

    // 1) Si ya tenemos un marker con mi posicion, usar ese
    if (PWA.Mapa.miPosicion) {
      var ll = PWA.Mapa.miPosicion.getLatLng();
      if (ll) { abrirConOrigen(ll.lat, ll.lng); return; }
    }

    // 2) Pedir GPS fresco (rapido, sin bloquear)
    if (navigator.geolocation) {
      if (PWA && PWA.toast) PWA.toast('Obteniendo ubicacion...', 'ok');
      navigator.geolocation.getCurrentPosition(function(pos) {
        abrirConOrigen(pos.coords.latitude, pos.coords.longitude);
      }, function() {
        // Sin GPS → abrir sin origen
        abrirConOrigen(null, null);
      }, {
        enableHighAccuracy: true,
        maximumAge:         60000,
        timeout:            8000
      });
    } else {
      abrirConOrigen(null, null);
    }
  },

  obtenerMiPosicion: function() {
    if (!navigator.geolocation) return;
    if (PWA.Mapa.watchId !== null) return; // ya activo

    PWA.Mapa.watchId = navigator.geolocation.watchPosition(function(pos) {
      var latlng = [pos.coords.latitude, pos.coords.longitude];

      // Guardar posición en royalRoute
      PWA.Geo.registrarPosicion(pos.coords.latitude, pos.coords.longitude);

      if (PWA.Mapa.miPosicion) {
        PWA.Mapa.miPosicion.setLatLng(latlng);
      } else {
        PWA.Mapa.miPosicion = L.circleMarker(latlng, {
          radius:      9,
          fillColor:   '#4f8ef7',
          color:       'white',
          weight:      2,
          fillOpacity: 1
        }).bindPopup('Tu ubicación').addTo(PWA.Mapa.map);

        // Centrar mapa en posición real al primer fix
        PWA.Mapa.map.setView(latlng, 14);
      }

      PWA.Mapa.actualizarListaCercanos(pos.coords.latitude, pos.coords.longitude);
    }, function(err) {
      console.warn('GPS error:', err.message);
    }, {
      enableHighAccuracy: true,
      maximumAge:         30000,
      timeout:            15000
    });
  },

  cargarProspectosEnMapa: function() {
  // 1. Ya hay datos en state → usarlos directo
  if (PWA.state.prospectos && PWA.state.prospectos.length > 0) {
    console.log('[Mapa] Usando prospectos desde state:', PWA.state.prospectos.length);
    PWA.Mapa.pintarPins(PWA.state.prospectos);
    return;
  }

  // 2. Intentar cache offline (IndexedDB)
  SyncDB.leerProspectosCache(function(items) {
    if (items && items.length > 0) {
      console.log('[Mapa] Usando prospectos desde cache offline:', items.length);
      PWA.state.prospectos = items; // hidrata el state para próximas vistas
      PWA.Mapa.pintarPins(items);
      return;
    }

    // 3. Último recurso: fetch directo a la API
    console.log('[Mapa] Cache vacío, cargando desde API...');
    PWA.apiPost('api/prospectos.php', {
      option: 'TraerProspectos',
      filtro: 'todos',
      limit: 200
    }, function(err, data) {
      if (err) {
        console.error('[Mapa] Error al cargar prospectos:', err);
        return;
      }
      if (data && data.result && data.contenido && data.contenido.length > 0) {
        console.log('[Mapa] Prospectos cargados desde API:', data.contenido.length);
        PWA.state.prospectos = data.contenido;
        SyncDB.guardarProspectosCache(data.contenido);
        PWA.Mapa.pintarPins(data.contenido);
      } else {
        console.warn('[Mapa] API no devolvió prospectos');
      }
    });
  });
},

  pintarPins: function(prospectos) {
  if (!PWA.Mapa.markersLayer) return;
  PWA.Mapa.markersLayer.clearLayers();

  var pintados = 0;

  prospectos.forEach(function(p) {
    var lat = 0, lng = 0;
    if (p.latitude && p.longitude) {
      lat = parseFloat(p.latitude);
      lng = parseFloat(p.longitude);
    } else if (p.link_google_map) {
      var coords = p.link_google_map.split(',');
      lat = parseFloat(coords[0]);
      lng = parseFloat(coords[1]);
    }
    if (!lat || !lng) return;

    var color = PWA.Mapa.colorPorEstado(p);
    var pin   = PWA.Mapa.crearPin(color);
    var nombre = p.prospecto || p.nombre || p.DebtorName || 'Prospecto';

    // Escapar nombre para contexto HTML (atributo title / contenido)
    var nombreHtml = nombre
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/'/g, '&#39;');

    var popupHtml = ''
      + '<div style="min-width:170px">'
      +   '<strong>' + nombreHtml + '</strong>'
      +   '<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">'
      +     '<button onclick="PWA.Detalle.abrir(\'' + p.u_movimiento + '\')" '
      +       'style="flex:1;min-width:70px;padding:5px 8px;background:#4f8ef7;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px">Ver detalle</button>'
      +     '<button onclick="PWA.Mapa.trazarRuta(' + lat + ',' + lng + ')" '
      +       'style="flex:1;min-width:70px;padding:5px 8px;background:#34d399;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px">🧭 Trazar ruta</button>'
      +   '</div>'
      + '</div>';

    L.marker([lat, lng], { icon: pin })
      .bindPopup(popupHtml)
      .addTo(PWA.Mapa.markersLayer);

    pintados++;
  });

  console.log('[Mapa] Pins pintados:', pintados, 'de', prospectos.length);

  // fitBounds UNA SOLA VEZ al final, solo si hay pins y aún no hay GPS fijado
  if (pintados > 0 && !PWA.Mapa.miPosicion) {
    var bounds = L.featureGroup(PWA.Mapa.markersLayer.getLayers()).getBounds();
    PWA.Mapa.map.fitBounds(bounds.pad(0.1));
  }
},

  actualizarListaCercanos: function(miLat, miLng) {
    var listEl = document.getElementById('mapaListaItems');
    if (!listEl) return;

    var prospectos = PWA.state.prospectos;
    if (!prospectos || prospectos.length === 0) return;

    // Calcular distancia (fórmula Haversine simplificada)
    function distKm(lat1, lng1, lat2, lng2) {
      var R  = 6371;
      var dL = (lat2 - lat1) * Math.PI / 180;
      var dG = (lng2 - lng1) * Math.PI / 180;
      var a  = Math.sin(dL/2) * Math.sin(dL/2) +
               Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
               Math.sin(dG/2) * Math.sin(dG/2);
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }

    var conGeo = prospectos.filter(function(p) {
      return (parseFloat(p.latitude) && parseFloat(p.longitude)) || !!p.link_google_map;
    }).map(function(p) {
      var coords2 = (p.link_google_map || '').split(',');
      var lat = parseFloat(p.latitude) || parseFloat(coords2[0]);
      var lng = parseFloat(p.longitude) || parseFloat(coords2[1]);
      return { p: p, dist: distKm(miLat, miLng, lat, lng) };
    }).sort(function(a, b) { return a.dist - b.dist; }).slice(0, 5);

    if (conGeo.length === 0) {
      listEl.innerHTML = '<div style="color:var(--pwa-muted);font-size:13px">Sin prospectos con ubicación registrada</div>';
      return;
    }

    var html = '';
    conGeo.forEach(function(item) {
      var p      = item.p;
      var dist   = item.dist < 1 ? Math.round(item.dist * 1000) + ' m' : item.dist.toFixed(1) + ' km';
      var nombre = p.prospecto || p.nombre || p.DebtorName || 'Prospecto';
      html += '<div class="card2" onclick="PWA.Detalle.abrir(\'' + p.u_movimiento + '\')" style="cursor:pointer;margin-bottom:6px">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center">';
      html += '<span style="font-size:13px;font-weight:600">' + nombre + '</span>';
      html += '<span style="font-size:11px;color:var(--pwa-accent)">' + dist + '</span>';
      html += '</div></div>';
    });
    listEl.innerHTML = html;
  }
};

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

    PWA.Mapa.obtenerMiPosicion();
    PWA.Mapa.cargarProspectosEnMapa();
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
      var nombre = p.nombre || p.DebtorName || 'Prospecto';

      var marker = L.marker([lat, lng], { icon: pin })
        .bindPopup('<strong>' + nombre + '</strong><br><button onclick="PWA.Detalle.abrir(\'' + p.u_movimiento + '\')" style="margin-top:6px;padding:4px 10px;background:#4f8ef7;color:white;border:none;border-radius:6px;cursor:pointer">Ver detalle</button>')
        .addTo(PWA.Mapa.markersLayer);
    });
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
      var nombre = p.nombre || p.DebtorName || 'Prospecto';
      html += '<div class="card2" onclick="PWA.Detalle.abrir(\'' + p.u_movimiento + '\')" style="cursor:pointer;margin-bottom:6px">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center">';
      html += '<span style="font-size:13px;font-weight:600">' + nombre + '</span>';
      html += '<span style="font-size:11px;color:var(--pwa-accent)">' + dist + '</span>';
      html += '</div></div>';
    });
    listEl.innerHTML = html;
  }
};

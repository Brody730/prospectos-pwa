(function() {
  var deferredPrompt = null;
  var STORAGE_KEY = 'pwa_install_dismissed';
  var DISMISSED_TTL = 7 * 24 * 60 * 60 * 1000;

  // Detectar si ya esta instalada como PWA
  var yaInstalada = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;

  if (yaInstalada) return; // Ya esta instalada, no mostrar nada

  // Verificar si fue descartada recientemente
  var dismissed = localStorage.getItem(STORAGE_KEY);
  if (dismissed && (Date.now() - parseInt(dismissed, 10)) < DISMISSED_TTL) return;

  // Detectar iOS
  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  // Registrar Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/erpdistribucion/prospectos/sw.js', {
      scope: '/erpdistribucion/prospectos/'
    }).catch(function() {});
  }

  // Capturar evento de instalacion si Chrome lo dispara
  window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    deferredPrompt = e;
    // Actualizar boton si el banner ya esta visible
    var btn = document.getElementById('pwa-install-btn');
    if (btn) {
      btn.textContent = 'Instalar';
      btn.onclick = function() {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function(result) {
          deferredPrompt = null;
          var banner = document.getElementById('pwa-install-banner');
          if (banner) banner.remove();
          if (result.outcome === 'accepted') {
            localStorage.setItem(STORAGE_KEY, String(Date.now()));
          }
        });
      };
    }
  });

  window.addEventListener('appinstalled', function() {
    var banner = document.getElementById('pwa-install-banner');
    if (banner) banner.remove();
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  });

  // Mostrar banner al cargar — sin esperar beforeinstallprompt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(mostrar, 800);
    });
  } else {
    setTimeout(mostrar, 800);
  }

  function mostrar() {
    if (isIOS && isSafari) {
      mostrarBannerIOS();
    } else {
      mostrarBannerAndroid();
    }
  }

  function mostrarBannerAndroid() {
    if (document.getElementById('pwa-install-banner')) return;

    var banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.style.cssText = [
      'position:fixed', 'bottom:0', 'left:0', 'right:0',
      'background:#1a1d27',
      'border-top:1px solid rgba(255,255,255,0.12)',
      'padding:12px 16px',
      'display:flex', 'align-items:center', 'gap:12px',
      'z-index:99999',
      'box-shadow:0 -4px 24px rgba(0,0,0,0.5)',
      'font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif'
    ].join(';');

    banner.innerHTML = [
      '<div style="display:flex;align-items:center;gap:12px;flex:1">',
        '<div style="width:44px;height:44px;border-radius:12px;background:#4f8ef7;',
             'display:flex;align-items:center;justify-content:center;',
             'font-size:22px;font-weight:bold;color:white;flex-shrink:0">R</div>',
        '<div>',
          '<div style="font-weight:700;font-size:14px;color:#f1f5f9">ROGMAI Prospectos</div>',
          '<div style="font-size:12px;color:#8892a4">App para vendedores de campo</div>',
        '</div>',
      '</div>',
      '<div style="display:flex;gap:8px;flex-shrink:0">',
        '<button id="pwa-install-btn" style="',
          'background:#4f8ef7;color:white;border:none;border-radius:8px;',
          'padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer">',
          'Instalar',
        '</button>',
        '<button id="pwa-dismiss-btn" style="',
          'background:transparent;color:#8892a4;',
          'border:1px solid rgba(255,255,255,0.15);border-radius:8px;',
          'padding:8px 12px;font-size:13px;cursor:pointer">',
          '\u2715',
        '</button>',
      '</div>'
    ].join('');

    document.body.appendChild(banner);

    document.getElementById('pwa-install-btn').addEventListener('click', function() {
      if (deferredPrompt) {
        // Chrome tiene el prompt nativo disponible
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function(result) {
          deferredPrompt = null;
          banner.remove();
          if (result.outcome === 'accepted') {
            localStorage.setItem(STORAGE_KEY, String(Date.now()));
          }
        });
      } else {
        // Chrome aun no dio el prompt — mostrar instrucciones manuales
        var btn = document.getElementById('pwa-install-btn');
        if (btn) {
          btn.style.display = 'none';
        }
        var info = document.createElement('div');
        info.style.cssText = 'font-size:12px;color:#f1f5f9;text-align:right;max-width:160px';
        info.innerHTML = 'Toca <strong style="color:#4f8ef7">&#8942;</strong> menu &rarr; <strong style="color:#4f8ef7">A&ntilde;adir a pantalla</strong>';
        banner.querySelector('div:last-child').insertBefore(info, banner.querySelector('#pwa-dismiss-btn'));
      }
    });

    document.getElementById('pwa-dismiss-btn').addEventListener('click', function() {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
      banner.remove();
    });
  }

  function mostrarBannerIOS() {
    if (document.getElementById('pwa-ios-banner')) return;

    var banner = document.createElement('div');
    banner.id = 'pwa-ios-banner';
    banner.style.cssText = [
      'position:fixed', 'bottom:0', 'left:0', 'right:0',
      'background:#1a1d27',
      'border-top:1px solid rgba(255,255,255,0.12)',
      'padding:16px', 'z-index:99999',
      'font-family:-apple-system,sans-serif',
      'text-align:center',
      'box-shadow:0 -4px 24px rgba(0,0,0,0.5)'
    ].join(';');

    banner.innerHTML = [
      '<div style="font-weight:700;color:#f1f5f9;margin-bottom:6px;font-size:15px">',
        'Instalar ROGMAI Prospectos',
      '</div>',
      '<div style="font-size:13px;color:#8892a4;margin-bottom:12px">',
        'Toca <strong style="color:#4f8ef7">Compartir</strong> &#8593; y luego ',
        '<strong style="color:#4f8ef7">&ldquo;A&ntilde;adir a pantalla de inicio&rdquo;</strong>',
      '</div>',
      '<button onclick="localStorage.setItem(\'pwa_ios_dismissed\',\'1\');this.parentElement.remove()" ',
        'style="background:rgba(255,255,255,0.1);color:#8892a4;border:none;',
        'border-radius:8px;padding:8px 20px;font-size:13px;cursor:pointer">',
        'Entendido',
      '</button>'
    ].join('');

    document.body.appendChild(banner);
  }

})();

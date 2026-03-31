const CACHE_PREFIX = 'pcm-mcr-cache-';
const CACHE_VERSION = CACHE_PREFIX + 'v14';

const APP_SHELL = [
  './',
  './PCM_MCR_v5.html',
  './assets/env-loader.js',
  './assets/pcm_mcr.css',
  './assets/pcm_mcr_constants.js',
  './assets/pcm_storage.js',
  './assets/toast.js',
  './assets/pcm_auth.js',
  './assets/pcm_mcr_utils.js',
  './assets/pcm_mcr/pcm_globals.js',
  './assets/pcm_mcr/pcm_realtime.js',
  './assets/pcm_mcr/pcm_init.js',
  './assets/pcm_mcr/pcm_sync_push.js',
  './assets/pcm_mcr/pcm_pdf_import.js',
  './assets/pcm_mcr/pcm_ui.js',
  './assets/pcm_mcr/pcm_atividade.js',
  './assets/pcm_mcr/pcm_desvios.js',
  './assets/pcm_mcr/pcm_checklist.js',
  './assets/pcm_mcr/pcm_materiais.js',
  './assets/pcm_mcr/pcm_finalizar.js',
  './assets/pcm_mcr/pcm_pdf_gerar.js',
  './assets/sync_engine.js',
  './assets/app_bootstrap.js',
  './assets/vendor/pdf.min.js',
  './assets/vendor/pdf.worker.min.js',
  './assets/vendor/jspdf.umd.min.js',
  './assets/vendor/jspdf.plugin.autotable.min.js',
  './assets/vendor/xlsx.full.min.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './manifest.webmanifest'
];

const CACHEABLE_DESTINATIONS = ['script', 'style', 'image', 'font', 'manifest', 'worker'];
const NON_CRITICAL_ASSETS = ['./assets/icons/icon-192.png', './assets/icons/icon-512.png'];
const API_TIMEOUT_MS = 12000;
const BG_SYNC_TAG = 'pcm-sync-pending';

const APP_SHELL_PATHS = APP_SHELL.map(function (p) {
  return new URL(p, self.location.href).pathname;
});

function normalizePath(path) {
  if (!path) return '/';
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1);
  return path;
}

function isAppShellRequest(url) {
  return APP_SHELL_PATHS.indexOf(url.pathname) !== -1;
}

function isMechanicNavigation(url, request) {
  if (request.mode !== 'navigate') return false;
  var scopePath = normalizePath(new URL(self.registration.scope).pathname.toLowerCase());
  var path = normalizePath(url.pathname.toLowerCase());
  return path === scopePath || path === scopePath + '/pcm_mcr_v5.html' || path.endsWith('/pcm_mcr_v5.html');
}

function putInCache(request, response) {
  if (!response || !response.ok) return Promise.resolve();
  return caches.open(CACHE_VERSION).then(function (cache) {
    return cache.put(request, response.clone());
  }).catch(function () {});
}

function fetchWithTimeout(request, timeoutMs) {
  if (typeof AbortController === 'undefined') return fetch(request);
  var ctrl = new AbortController();
  var timer = setTimeout(function () { ctrl.abort(); }, timeoutMs || API_TIMEOUT_MS);
  var req = new Request(request, { signal: ctrl.signal });
  return fetch(req).finally(function () { clearTimeout(timer); });
}

function notifyClientsSyncNow() {
  return self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(function (clients) {
    clients.forEach(function (client) {
      client.postMessage({ type: 'SW_SYNC_NOW', tag: BG_SYNC_TAG, ts: Date.now() });
    });
  }).catch(function () {});
}

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function (cache) {
      return Promise.all(
        APP_SHELL.map(function (asset) {
          return cache.add(asset).catch(function (err) {
            if (NON_CRITICAL_ASSETS.indexOf(asset) !== -1) return;
            throw err || new Error('Falha ao cachear asset crítico: ' + asset);
          });
        })
      );
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names.filter(function (name) {
          return name.indexOf(CACHE_PREFIX) === 0 && name !== CACHE_VERSION;
        }).map(function (name) {
          return caches.delete(name);
        })
      );
    }).then(function () {
      return self.clients.claim();
    }).then(function () {
      return self.clients.matchAll({ includeUncontrolled: true });
    }).then(function (clients) {
      clients.forEach(function (client) {
        client.postMessage({ type: 'SW_UPDATED' });
      });
    })
  );
});

self.addEventListener('sync', function (event) {
  if (!event || event.tag !== BG_SYNC_TAG) return;
  event.waitUntil(notifyClientsSyncNow());
});

self.addEventListener('fetch', function (event) {
  var request = event.request;
  var url = new URL(request.url);

  if (request.method !== 'GET') return;

  /* Admin panel não é PWA — SW não deve interceptar nada do admin */
  var isAdmin = url.pathname.indexOf('admin_soberano') !== -1 ||
                url.pathname.indexOf('assets_admin') !== -1;
  if (isAdmin) return;

  var isAPI = url.pathname.indexOf('/rest/') !== -1 ||
              url.pathname.indexOf('/auth/') !== -1 ||
              url.pathname.indexOf('/storage/') !== -1 ||
              url.hostname.indexOf('supabase') !== -1;

  if (isAPI) {
    event.respondWith(
      fetchWithTimeout(request, API_TIMEOUT_MS).catch(function () {
        return new Response(JSON.stringify({ error: 'offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  var isExternal = url.hostname.indexOf('fonts.googleapis') !== -1 ||
                   url.hostname.indexOf('fonts.gstatic') !== -1 ||
                   url.hostname.indexOf('cdnjs.cloudflare') !== -1 ||
                   url.hostname.indexOf('cdn.jsdelivr') !== -1;

  if (isExternal) {
    event.respondWith(
      caches.match(request).then(function (cached) {
        if (cached) {
          fetch(request).then(function (resp) {
            putInCache(request, resp);
          }).catch(function () {});
          return cached;
        }
        return fetch(request).then(function (resp) {
          putInCache(request, resp);
          return resp;
        }).catch(function () {
          return new Response('', { status: 503 });
        });
      })
    );
    return;
  }

  if (isMechanicNavigation(url, request)) {
    event.respondWith(
      fetch(request).then(function (resp) {
        putInCache(request, resp);
        return resp;
      }).catch(function () {
        return caches.match('./PCM_MCR_v5.html');
      })
    );
    return;
  }

  var shouldHandleAsset = isAppShellRequest(url) || CACHEABLE_DESTINATIONS.indexOf(request.destination) !== -1;

  if (!shouldHandleAsset) return;

  var shouldPreferNetwork =
    request.destination === 'script' ||
    request.destination === 'style' ||
    isAppShellRequest(url);

  if (shouldPreferNetwork) {
    event.respondWith(
      fetch(request).then(function (resp) {
        putInCache(request, resp);
        return resp;
      }).catch(function () {
        return caches.match(request).then(function (cached) {
          if (cached) return cached;
          return new Response('', { status: 503 });
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(function (cached) {
      if (cached) {
        fetch(request).then(function (resp) {
          putInCache(request, resp);
        }).catch(function () {});
        return cached;
      }
      return fetch(request).then(function (resp) {
        putInCache(request, resp);
        return resp;
      }).catch(function () {
        return new Response('', { status: 503 });
      });
    })
  );
});

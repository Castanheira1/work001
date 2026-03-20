(function (w) {
  'use strict';

  var DEFAULT_ENV = {
    SUPABASE_URL: '',
    SUPABASE_ANON_KEY: '',
    SENHA_FISCAL: '',
    NODE_ENV: 'production',
    APP_URL: '',
    SYNC_ENDPOINT: '/api/sync',
    SYNC_SHARED_SECRET: ''
  };

  function applyEnv(source) {
    var bootstrap = (w.__PCM_BOOTSTRAP_ENV__ && typeof w.__PCM_BOOTSTRAP_ENV__ === 'object') ? w.__PCM_BOOTSTRAP_ENV__ : {};
    w.ENV = Object.assign({}, DEFAULT_ENV, bootstrap, source || {});
    w.SUPABASE_URL = w.ENV.SUPABASE_URL || '';
    w.SUPABASE_ANON_KEY = w.ENV.SUPABASE_ANON_KEY || '';
    w.SENHA_FISCAL = w.ENV.SENHA_FISCAL || '';
    w.SYNC_ENDPOINT = w.ENV.SYNC_ENDPOINT || '/api/sync';
    return w.ENV;
  }

  function fireReady() {
    try {
      w.dispatchEvent(new CustomEvent('pcm:env-ready', { detail: w.ENV }));
    } catch (e) {}
  }

  function loadConfig() {
    var url = './config.json?v=' + Date.now();
    return fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    }).then(function (resp) {
      if (!resp.ok) throw new Error('HTTP ' + resp.status + ' ao carregar config.json');
      return resp.json();
    }).then(function (cfg) {
      if (!cfg || typeof cfg !== 'object') throw new Error('config.json inválido');
      applyEnv(cfg);
      console.log('[ENV] configuração carregada de /config.json');
      fireReady();
      return w.ENV;
    }).catch(function (err) {
      if (!w.ENV || !w.ENV.SUPABASE_URL || !w.ENV.SUPABASE_ANON_KEY) {
        w.__PCM_ENV_ERROR = 'Falha ao carregar configuração obrigatória';
        console.error('[ENV] Falha ao carregar /config.json e não há bootstrap síncrono válido.', err);
      } else {
        console.warn('[ENV] Falha ao carregar /config.json. Mantendo bootstrap síncrono.', err);
      }
      fireReady();
      return w.ENV;
    });
  }

  applyEnv();
  console.log('[ENV] Loader ativo');

  if (typeof fetch === 'function') {
    loadConfig();
  } else {
    fireReady();
  }
})(window);

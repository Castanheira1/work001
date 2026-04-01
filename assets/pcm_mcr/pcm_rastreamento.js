/**
 * PCM Rastreamento — Módulo de envio de localização GPS em tempo real
 * Integrado ao PCM_MCR_v5.html (tela dos mecânicos/equipes de campo)
 *
 * Funcionamento:
 *  - Ao iniciar, solicita permissão de geolocalização ao usuário
 *  - A cada INTERVALO_MS milissegundos, envia a posição atual ao Supabase
 *  - Inclui dados da OM ativa, nome do operador, equipe e nível de bateria
 *  - Usa UPSERT por device_id (apenas 1 linha por dispositivo)
 *
 * Dependências globais esperadas:
 *  - window.supabase (biblioteca Supabase)
 *  - window._sharedSbClient (client compartilhado, criado por pcm_realtime.js)
 *  - window.SUPABASE_URL, window.SUPABASE_ANON_KEY
 *  - window.deviceId (definido em pcm_globals.js)
 *  - window.currentOM (OM ativa, pode ser null)
 *  - localStorage: pcm_operador_nome, pcm_operador_role
 */

(function() {
  'use strict';

  const INTERVALO_MS   = 15000;
  const TIMEOUT_OFFLINE = 120000;

  let _watchId        = null;
  let _intervalId     = null;
  let _ultimaPos      = null;
  let _ativo          = false;
  let _sbClient       = null;
  let _tentativas     = 0;
  const MAX_TENTATIVAS = 3;

  function init() {
    if (!navigator.geolocation) {
      console.warn('[RASTR] Geolocalização não suportada neste dispositivo.');
      return;
    }

    const role = (localStorage.getItem('pcm_operador_role') || '').toLowerCase();
    if (role === 'fiscal') {
      console.info('[RASTR] Rastreamento desativado para perfil fiscal.');
      return;
    }

    var aguardarSupabase = setInterval(function() {
      if (window._sharedSbClient || (window.supabase && (window.SUPABASE_URL || (window.ENV && window.ENV.SUPABASE_URL)))) {
        clearInterval(aguardarSupabase);
        _iniciarRastreamento();
      }
    }, 500);

    setTimeout(function() { clearInterval(aguardarSupabase); }, 10000);
  }

  function _obterCliente() {
    if (window._sharedSbClient) return window._sharedSbClient;
    try {
      var url = (window.ENV && window.ENV.SUPABASE_URL) || window.SUPABASE_URL;
      var key = (window.ENV && window.ENV.SUPABASE_ANON_KEY) || window.SUPABASE_ANON_KEY;
      if (!url || !key) return null;
      if (!window._sharedSbClient) {
        window._sharedSbClient = window.supabase.createClient(url, key, {
          realtime: { params: { eventsPerSecond: 2 } }
        });
      }
      return window._sharedSbClient;
    } catch(e) {
      console.error('[RASTR] Erro ao obter cliente Supabase:', e);
      return null;
    }
  }

  function _iniciarRastreamento() {
    _sbClient = _obterCliente();
    if (!_sbClient) {
      console.warn('[RASTR] Supabase indisponível, rastreamento desativado.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      function(pos) {
        _ultimaPos = pos;
        _ativo = true;
        _enviarLocalizacao();
        _iniciarWatch();
        _iniciarIntervalo();
        console.info('[RASTR] Rastreamento iniciado. Posição inicial obtida.');
      },
      function(err) {
        console.warn('[RASTR] Permissão de geolocalização negada ou erro:', err.message);
        setTimeout(_iniciarRastreamento, 30000);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  }

  function _iniciarWatch() {
    if (_watchId !== null) {
      navigator.geolocation.clearWatch(_watchId);
    }
    _watchId = navigator.geolocation.watchPosition(
      function(pos) { _ultimaPos = pos; },
      function(err) { console.warn('[RASTR] watchPosition erro:', err.message); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }

  function _iniciarIntervalo() {
    if (_intervalId) clearInterval(_intervalId);
    _intervalId = setInterval(_enviarLocalizacao, INTERVALO_MS);
  }

  async function _enviarLocalizacao() {
    if (!_ultimaPos || !_sbClient) return;
    if (!navigator.onLine) return;

    var coords   = _ultimaPos.coords;
    var deviceId = window.deviceId || _getDeviceId();
    var operador = localStorage.getItem('pcm_operador_nome') || 'Desconhecido';
    var equipe   = _getEquipe();
    var om       = _obterOMAtivaParaRastreamento();

    var bateria = null;
    try {
      if (navigator.getBattery) {
        var batt = await navigator.getBattery();
        bateria = Math.round(batt.level * 100);
      }
    } catch(e) {}

    var statusAtual = (om && typeof om.statusAtual === 'string') ? om.statusAtual.trim() : '';
    var estadoFluxo = (om && typeof om.estado_fluxo === 'string') ? om.estado_fluxo.trim() : '';

    var payload = {
      device_id  : deviceId,
      equipe     : equipe,
      operador   : operador,
      latitude   : coords.latitude,
      longitude  : coords.longitude,
      precisao   : coords.accuracy || null,
      om_num     : om ? (om.num || null) : null,
      om_status  : om ? (statusAtual || estadoFluxo || null) : null,
      om_titulo  : om ? (om.titulo || null) : null,
      bateria    : bateria,
      velocidade : coords.speed ? Math.round(coords.speed * 3.6) : null,
      online     : true,
      updated_at : new Date().toISOString()
    };

    try {
      var result = await _sbClient
        .from('equipe_localizacao')
        .upsert(payload, { onConflict: 'device_id' });

      if (result.error) {
        _tentativas++;
        console.warn('[RASTR] Erro ao enviar localização:', result.error.message, '(tentativa', _tentativas, ')');
        if (_tentativas >= MAX_TENTATIVAS) {
          console.error('[RASTR] Máximo de tentativas atingido. Pausando por 60s.');
          clearInterval(_intervalId);
          setTimeout(function() {
            _tentativas = 0;
            _iniciarIntervalo();
          }, 60000);
        }
      } else {
        _tentativas = 0;
        _atualizarIndicadorUI(true, coords);
      }
    } catch(e) {
      console.error('[RASTR] Exceção ao enviar localização:', e);
    }
  }

  function _obterOMAtivaParaRastreamento() {
    return (window.currentOM && typeof window.currentOM === 'object') ? window.currentOM : null;
  }

  function _getDeviceId() {
    var id = localStorage.getItem('pcm_device_id_v4');
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substr(2, 12) + '_' + Date.now();
      localStorage.setItem('pcm_device_id_v4', id);
    }
    return id;
  }

  function _getEquipe() {
    if (window.currentOM && window.currentOM.equipe) return window.currentOM.equipe;
    var stored = localStorage.getItem('pcm_equipe');
    if (stored) return stored;
    var operador = localStorage.getItem('pcm_operador_nome') || '';
    return operador || 'Equipe Campo';
  }

  function _atualizarIndicadorUI(ok, coords) {
    var dot = document.getElementById('gps-dot');
    var lbl = document.getElementById('gps-label');
    if (dot) {
      dot.style.background = ok ? '#4caf50' : '#dc3545';
    }
    if (lbl && coords) {
      lbl.textContent = ok
        ? 'GPS ativo (' + Math.round(coords.accuracy || 0) + 'm)'
        : 'GPS erro';
    }
  }

  function parar() {
    if (_watchId !== null) {
      navigator.geolocation.clearWatch(_watchId);
      _watchId = null;
    }
    if (_intervalId) {
      clearInterval(_intervalId);
      _intervalId = null;
    }
    _ativo = false;

    if (_sbClient && window.deviceId) {
      _sbClient.from('equipe_localizacao')
        .update({ online: false, updated_at: new Date().toISOString() })
        .eq('device_id', window.deviceId || _getDeviceId())
        .then(function() { console.info('[RASTR] Marcado como offline.'); })
        .catch(function(e) { console.warn('[RASTR] Erro ao marcar offline:', e); });
    }
  }

  window.PCMRastreamento = {
    init   : init,
    parar  : parar,
    isAtivo: function() { return _ativo; },
    getPos : function() { return _ultimaPos; }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 2000);
  }

})();

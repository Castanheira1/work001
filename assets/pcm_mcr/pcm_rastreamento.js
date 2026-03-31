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
 *  - window.supabase (cliente Supabase já criado)
 *  - window.SUPABASE_URL, window.SUPABASE_ANON_KEY
 *  - window.deviceId (definido em pcm_globals.js)
 *  - window.currentOM (OM ativa, pode ser null)
 *  - localStorage: pcm_operador_nome, pcm_operador_role
 */

(function() {
  'use strict';

  const INTERVALO_MS   = 15000;  // Enviar localização a cada 15 segundos
  const TIMEOUT_OFFLINE = 120000; // Marcar offline após 2 min sem envio

  let _watchId        = null;
  let _intervalId     = null;
  let _ultimaPos      = null;
  let _ativo          = false;
  let _sbClient       = null;
  let _tentativas     = 0;
  const MAX_TENTATIVAS = 3;

  // ──────────────────────────────────────────────
  // Inicialização
  // ──────────────────────────────────────────────
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

    // Aguarda o Supabase estar disponível
    const aguardarSupabase = setInterval(function() {
      if (window.supabase && (window.SUPABASE_URL || (window.ENV && window.ENV.SUPABASE_URL))) {
        clearInterval(aguardarSupabase);
        _iniciarRastreamento();
      }
    }, 500);

    // Timeout de 10s para não aguardar indefinidamente
    setTimeout(function() { clearInterval(aguardarSupabase); }, 10000);
  }

  function _criarCliente() {
    try {
      const url = (window.ENV && window.ENV.SUPABASE_URL) || window.SUPABASE_URL;
      const key = (window.ENV && window.ENV.SUPABASE_ANON_KEY) || window.SUPABASE_ANON_KEY;
      if (!url || !key) return null;
      return window.supabase.createClient(url, key);
    } catch(e) {
      console.error('[RASTR] Erro ao criar cliente Supabase:', e);
      return null;
    }
  }

  function _iniciarRastreamento() {
    _sbClient = _criarCliente();
    if (!_sbClient) {
      console.warn('[RASTR] Supabase indisponível, rastreamento desativado.');
      return;
    }

    // Solicitar permissão e iniciar watch de posição
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
        // Tenta novamente após 30s (usuário pode ter negado acidentalmente)
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

  // ──────────────────────────────────────────────
  // Envio de localização ao Supabase
  // ──────────────────────────────────────────────
  async function _enviarLocalizacao() {
    if (!_ultimaPos || !_sbClient) return;
    if (!navigator.onLine) return;

    const coords   = _ultimaPos.coords;
    const deviceId = window.deviceId || _getDeviceId();
    const operador = localStorage.getItem('pcm_operador_nome') || 'Desconhecido';
    const equipe   = _getEquipe();
    const om       = _obterOMAtivaParaRastreamento();

    // Nível de bateria (API experimental, pode não estar disponível)
    let bateria = null;
    try {
      if (navigator.getBattery) {
        const batt = await navigator.getBattery();
        bateria = Math.round(batt.level * 100);
      }
    } catch(e) { /* ignorar */ }

    const statusAtual = (om && typeof om.statusAtual === 'string') ? om.statusAtual.trim() : '';
    const estadoFluxo = (om && typeof om.estado_fluxo === 'string') ? om.estado_fluxo.trim() : '';

    const payload = {
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
      velocidade : coords.speed ? Math.round(coords.speed * 3.6) : null,  // m/s → km/h
      online     : true,
      updated_at : new Date().toISOString()
    };

    try {
      const { error } = await _sbClient
        .from('equipe_localizacao')
        .upsert(payload, { onConflict: 'device_id' });

      if (error) {
        _tentativas++;
        console.warn('[RASTR] Erro ao enviar localização:', error.message, '(tentativa', _tentativas, ')');
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
        // Atualizar indicador visual se existir
        _atualizarIndicadorUI(true, coords);
      }
    } catch(e) {
      console.error('[RASTR] Exceção ao enviar localização:', e);
    }
  }


  function _obterOMAtivaParaRastreamento() {
    return (window.currentOM && typeof window.currentOM === 'object') ? window.currentOM : null;
  }



  // ──────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────
  function _getDeviceId() {
    let id = localStorage.getItem('pcm_device_id_v4');
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substr(2, 12) + '_' + Date.now();
      localStorage.setItem('pcm_device_id_v4', id);
    }
    return id;
  }

  function _getEquipe() {
    // Tenta obter da OM ativa, depois do localStorage, depois usa o nome do operador
    if (window.currentOM && window.currentOM.equipe) return window.currentOM.equipe;
    const stored = localStorage.getItem('pcm_equipe');
    if (stored) return stored;
    const operador = localStorage.getItem('pcm_operador_nome') || '';
    return operador || 'Equipe Campo';
  }

  function _atualizarIndicadorUI(ok, coords) {
    // Atualiza o indicador de GPS na UI se existir
    const dot = document.getElementById('gps-dot');
    const lbl = document.getElementById('gps-label');
    if (dot) {
      dot.style.background = ok ? '#4caf50' : '#dc3545';
    }
    if (lbl && coords) {
      lbl.textContent = ok
        ? 'GPS ativo (' + Math.round(coords.accuracy || 0) + 'm)'
        : 'GPS erro';
    }
  }

  // ──────────────────────────────────────────────
  // Parar rastreamento (ex: ao fazer logout)
  // ──────────────────────────────────────────────
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

    // Marcar como offline no Supabase
    if (_sbClient && window.deviceId) {
      _sbClient.from('equipe_localizacao')
        .update({ online: false, updated_at: new Date().toISOString() })
        .eq('device_id', window.deviceId || _getDeviceId())
        .then(function() { console.info('[RASTR] Marcado como offline.'); })
        .catch(function(e) { console.warn('[RASTR] Erro ao marcar offline:', e); });
    }
  }

  // ──────────────────────────────────────────────
  // Expor API pública
  // ──────────────────────────────────────────────
  window.PCMRastreamento = {
    init   : init,
    parar  : parar,
    isAtivo: function() { return _ativo; },
    getPos : function() { return _ultimaPos; }
  };

  // Auto-iniciar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // Aguardar um pouco para garantir que outros módulos carregaram
    setTimeout(init, 2000);
  }

})();

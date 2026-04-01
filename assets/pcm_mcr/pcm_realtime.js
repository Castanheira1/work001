// ==========================
        // REALTIME
        // ==========================
        let _rtClient = null;
        let _rtChannel = null;
        let _rtDebounce = null;
        let _rtReconnectTimer = null;

        function _rtAtualizar() {
            clearTimeout(_rtDebounce);
            _rtDebounce = setTimeout(function() {
                const escopo = _getEscopoSalvo();
                if (!_escopoValidoParaPuxar(escopo)) {
                    if (currentOM && currentOM.num) _verificarAdminUnlock();
                    carregarOMs();
                } else if (window.PCMSync && window.PCMSync.puxarOMs) {
                    window.PCMSync.puxarOMs(escopo).then(function() {
                        if (currentOM && currentOM.num) _verificarAdminUnlock();
                        carregarOMs();
                    }).catch(function() {});
                } else {
                    if (currentOM && currentOM.num) _verificarAdminUnlock();
                    filtrarOMs();
                }
                _rtPiscarDot();
            }, 600);
        }

        function _rtPiscarDot() {
            const dot = $('rtDot');
            if (!dot) return;
            dot.style.background = '#f5a623';
            setTimeout(function() { dot.style.background = '#4caf50'; }, 700);
        }

        function _rtSetStatus(status) {
            const dot = $('rtDot');
            const lbl = $('rtLabel');
            if (status === 'online') {
                if (dot) dot.style.background = '#4caf50';
                if (lbl) lbl.textContent = 'ao vivo';
            } else if (status === 'offline') {
                if (dot) dot.style.background = '#888';
                if (lbl) lbl.textContent = 'offline';
            } else if (status === 'erro') {
                if (dot) dot.style.background = '#dc3545';
                if (lbl) lbl.textContent = 'reconectando...';
            }
        }

        function _getSharedSbClient() {
            if (!window._sharedSbClient) {
                window._sharedSbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                    realtime: { params: { eventsPerSecond: 2 } }
                });
            }
            return window._sharedSbClient;
        }

        function _rtConectar() {
            if (!navigator.onLine) { _rtSetStatus('offline'); return; }
            if (!window.supabase) return;
            try {
                if (_rtChannel) {
                    try { _rtClient.removeChannel(_rtChannel); } catch(e) {}
                    _rtChannel = null;
                }
                _rtClient = _getSharedSbClient();
                _rtChannel = _rtClient.channel('campo_oms_rt_' + deviceId)
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'oms' }, function(payload) {
                        const num = payload.new && payload.new.num;
                        const minhaOM = num && oms.some(function(o) { return o.num === num; });
                        const omAtiva = currentOM && currentOM.num === num;
                        if (minhaOM || omAtiva) _rtAtualizar();
                    })
                    .subscribe(function(status) {
                        if (status === 'SUBSCRIBED') {
                            _rtSetStatus('online');
                        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                            _rtSetStatus('erro');
                            clearTimeout(_rtReconnectTimer);
                            _rtReconnectTimer = setTimeout(_rtConectar, 8000);
                        } else if (status === 'CLOSED') {
                            _rtSetStatus('offline');
                        }
                    });
            } catch(e) {
                _rtSetStatus('erro');
                clearTimeout(_rtReconnectTimer);
                _rtReconnectTimer = setTimeout(_rtConectar, 8000);
            }
        }

        function _rtDesconectar() {
            clearTimeout(_rtReconnectTimer);
            clearTimeout(_rtDebounce);
            if (_rtClient && _rtChannel) { try { _rtClient.removeChannel(_rtChannel); } catch(e) {} }
            _rtChannel = null;
            _rtSetStatus('offline');
        }

        window.addEventListener('online',  function() { _rtConectar(); });
        window.addEventListener('offline', function() { _rtDesconectar(); _rtSetStatus('offline'); });

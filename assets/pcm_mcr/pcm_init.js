        async function limparHistoricoAntigo() {
            var historico = JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORICO) || '[]');
            var hojeISO  = new Date().toISOString().split('T')[0];
            var hojePTBR = new Date().toLocaleDateString('pt-BR');
            var DIAS_RETENCAO_PDF = 30;

            function ehHoje(dataOM) {
                if(!dataOM) return false;
                if(dataOM.includes('T')) return dataOM.split('T')[0] === hojeISO;
                return dataOM.includes(hojeISO) || dataOM.includes(hojePTBR);
            }
            function diasDesde(dataOM) {
                if(!dataOM) return 999;
                try { return (Date.now() - new Date(dataOM).getTime()) / 86400000; }
                catch(e) { return 999; }
            }

            var antigos = historico.filter(function(om) {
                return !om.dataFinalizacao || !ehHoje(om.dataFinalizacao);
            });

            var delPromises = [];
            antigos.forEach(function(om) {
                var sincronizado = !!om._pdfSynced;
                var expirado     = diasDesde(om.dataFinalizacao) > DIAS_RETENCAO_PDF;
                if(sincronizado || expirado) {
                    var sfx = om.execTs ? '_' + om.execTs : '';
                    ['rel_','ck_','nc_','dev_'].forEach(function(p){
                        delPromises.push(PdfDB.del(p + om.num + sfx));
                        if(sfx) delPromises.push(PdfDB.del(p + om.num));
                    });
                }
            });
            try { await Promise.all(delPromises); } catch(e){ console.warn('[PCM] Erro ao limpar PDFs antigos:', e); }

            var historicoManter = historico.filter(function(om) {
                if(!om.dataFinalizacao) return false;
                if(ehHoje(om.dataFinalizacao)) return true;
                if(om.temDesvio && !om.reaberta && !om.canceladaDefinitivo) return true;
                var sincronizado = !!om._pdfSynced;
                var expirado     = diasDesde(om.dataFinalizacao) > DIAS_RETENCAO_PDF;
                return !(sincronizado || expirado);
            });
            localStorage.setItem(STORAGE_KEY_HISTORICO, JSON.stringify(historicoManter));
        }

        var __pcmAppStarted = false;
        function _carregarScriptDinamico(src) {
            return new Promise(function(resolve, reject) {
                try {
                    var s = document.createElement('script');
                    s.src = src;
                    s.async = true;
                    s.onload = function() { resolve(true); };
                    s.onerror = function() { reject(new Error('Falha ao carregar script: ' + src)); };
                    (document.head || document.documentElement).appendChild(s);
                } catch(e) { reject(e); }
            });
        }

        async function _garantirSyncPushDisponivel() {
            if(typeof carregarOMAtual === 'function' && typeof _obterEstadoServidorOM === 'function') return true;
            if(window.__pcmSyncPushLoadingPromise) return window.__pcmSyncPushLoadingPromise;
            var cacheBust = 'v=force_' + Date.now();
            var src = 'assets/pcm_mcr/pcm_sync_push.js?' + cacheBust;
            window.__pcmSyncPushLoadingPromise = _carregarScriptDinamico(src)
                .then(function() {
                    var ok = (typeof carregarOMAtual === 'function' && typeof _obterEstadoServidorOM === 'function');
                    if(!ok) console.error('[PCM] pcm_sync_push.js carregado, mas funções esperadas não foram expostas globalmente.');
                    return ok;
                })
                .catch(function(e) {
                    console.error('[PCM] Não foi possível recarregar pcm_sync_push.js dinamicamente:', e);
                    return false;
                })
                .finally(function() {
                    window.__pcmSyncPushLoadingPromise = null;
                });
            return window.__pcmSyncPushLoadingPromise;
        }
        window._garantirSyncPushDisponivel = _garantirSyncPushDisponivel;

        async function _inicializarAppComEnv() {
            if(__pcmAppStarted) return;
            __pcmAppStarted = true;
            if(!verificarDependencias()) return;
            limparHistoricoAntigo();
            initDeviceId();
            _atualizarLabelEscopo(_getEscopoSalvo());
            await carregarMateriais();
            await sincronizarConfig();
            await _garantirSyncPushDisponivel();
            carregarOMs();
            if(typeof carregarOMAtual === 'function') {
                carregarOMAtual();
            } else {
                console.error('[PCM] Dependência ausente: carregarOMAtual(). Verifique o carregamento de assets/pcm_mcr/pcm_sync_push.js antes da inicialização.');
                return;
            }
            if(navigator.onLine) _rtConectar();
        }

        window.addEventListener('load', function() {
            if (window.__PCM_ENV_READY__) {
                _inicializarAppComEnv();
                return;
            }
            var fallbackTimer = setTimeout(function(){
                console.warn('[MCR] Timeout aguardando evento pcm:env-ready; inicializando com ENV atual.');
                _inicializarAppComEnv();
            }, 4000);
            window.addEventListener('pcm:env-ready', function() {
                clearTimeout(fallbackTimer);
                _inicializarAppComEnv();
            }, { once: true });
        });

        function initDeviceId() {
            deviceId = localStorage.getItem(STORAGE_KEY_DEVICE);
            if(!deviceId) {
                deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem(STORAGE_KEY_DEVICE, deviceId);
            }
        }

        async function carregarMateriais() {
            const cached = localStorage.getItem(STORAGE_KEY_MATERIAIS);
            if(cached) {
                try { priceList = JSON.parse(cached); } catch(e) { console.warn('[PCM] Cache de pricelist corrompido:', e); }
            }
            await sincronizarMateriais();
        }

        async function sincronizarMateriais() {
            try {
                var allRows = [];
                var pageSize = 1000;
                var offset = 0;
                while(true) {
                    var resp = await fetch(
                        SUPABASE_URL + '/rest/v1/' + SUPABASE_TABLE_MATERIAIS + '?select=*',
                        {
                            headers: {
                                'apikey': SUPABASE_ANON_KEY,
                                'Authorization': 'Bearer ' + ((window.PCMAuth && window.PCMAuth.getToken()) || SUPABASE_ANON_KEY),
                                'Range': offset + '-' + (offset + pageSize - 1)
                            }
                        }
                    );
                    if(!resp.ok) throw new Error('HTTP ' + resp.status);
                    var rows = await resp.json();
                    if(!rows.length) break;
                    allRows = allRows.concat(rows);
                    if(rows.length < pageSize) break;
                    offset += pageSize;
                }
                priceList = {};
                allRows.forEach(function(row, idx) {
                    priceList[String(idx + 1)] = {
                        item: String(row['ITEM'] || idx + 1),
                        descricao: row['DESCRIÇÃO'] || row['DESCRICAO'] || '',
                        unidade: row['UNIDADE'] || 'UN',
                        preco: parseFloat(row['PREÇO REAJUSTADO (R$)'] || 0)
                    };
                });
                localStorage.setItem(STORAGE_KEY_MATERIAIS, JSON.stringify(priceList));
                console.log('Materiais carregados: ' + allRows.length);
            } catch(e) {
                console.warn('Supabase indisponível, usando cache local:', e.message);
            }
        }

        async function sincronizarConfig() {
            try {
                var cached = localStorage.getItem(STORAGE_KEY_CONFIG);
                if(cached) {
                    var c = JSON.parse(cached);
                    if(c.bdi) configBDI = parseFloat(c.bdi) || 18.8256;
                    if(c.bm) configBM = c.bm;
                    if(c.tipo) configTipoSolicitacao = c.tipo;
                }
                var _t = (window.PCMAuth && window.PCMAuth.getToken()) || SUPABASE_ANON_KEY;
                var resp = await fetch(SUPABASE_URL + '/rest/v1/config?select=*', {
                    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + _t }
                });
                if(!resp.ok) return;
                var rows = await resp.json();
                var map = {};
                rows.forEach(function(r) { map[r.chave] = r.valor; });
                if(map.bdi_percentual) configBDI = parseFloat(map.bdi_percentual) || 18.8256;
                configBM = {
                    numero: map.bm_numero || '',
                    dataInicio: map.bm_data_inicio || '',
                    dataFim: map.bm_data_fim || ''
                };
                if(map.tipo_solicitacao) configTipoSolicitacao = map.tipo_solicitacao;
                localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify({
                    bdi: configBDI, bm: configBM, tipo: configTipoSolicitacao, ts: Date.now()
                }));
            } catch(e) { console.warn('Config sync falhou:', e.message); }
        }

        function carregarOMs() {
            const saved = localStorage.getItem(STORAGE_KEY_OMS);
            if(saved) {
                try {
                    const loaded = JSON.parse(saved);
                    oms.length = 0;
                    oms.push(...loaded);
                    autoSincronizar();
                    filtrarOMs();
                } catch(e) {
                    console.error('Erro ao carregar OMs:', e);
                }
            }
        }

        function salvarOMs() {
            localStorage.setItem(STORAGE_KEY_OMS, JSON.stringify(oms));
        }


        var _escopoLabels = {
            'geral': '📋 Geral',
            'preventiva_usina': '🏭 Prev. Usina',
            'preventiva_mina': '⛏️ Prev. Mina',
            'preventiva_turno': '🔄 Prev. Turno',
            'corretiva': '🔧 Corretiva'
        };

        function _escopoValidoParaPuxar(escopo) {
            return escopo === 'preventiva_usina'
                || escopo === 'preventiva_mina'
                || escopo === 'preventiva_turno'
                || escopo === 'corretiva';
        }

        function _getEscopoSalvo() {
            return localStorage.getItem('pcm_escopo_filtro') || '';
        }

        function _atualizarLabelEscopo(escopo) {
            var el = $('escopoAtualLabel');
            if(!el) return;
            if(!_escopoValidoParaPuxar(escopo)) { el.style.display = 'none'; return; }
            el.style.display = 'block';
            el.textContent = 'FILTRO: ' + (_escopoLabels[escopo] || escopo).toUpperCase();
        }

        function mostrarEscopoPuxar() {
            $('popupEscopo').style.display = 'flex';
        }

        async function executarPuxarOMs(escopo) {
            if(!_escopoValidoParaPuxar(escopo)) {
                alert('Selecione um escopo específico para puxar OMs.');
                return;
            }
            $('popupEscopo').style.display = 'none';
            localStorage.setItem('pcm_escopo_filtro', escopo);
            _atualizarLabelEscopo(escopo);
            var btn = $('btnPuxarOMs');
            if (btn) { btn.disabled = true; btn.textContent = '... Atualizando...'; }
            try {
                if (window.PCMSync && typeof window.PCMSync.sync === 'function') {
                    await window.PCMSync.sync();
                }
                if (window.PCMSync && window.PCMSync.puxarOMs) {
                    await window.PCMSync.puxarOMs(escopo);
                }
                if (currentOM && currentOM.num) {
                    await _verificarAdminUnlock();
                }
                carregarOMs();
            } catch(e) {
                alert('Erro ao atualizar: ' + e.message);
            }
            if (btn) { btn.disabled = false; btn.textContent = '⬇ PUXAR OMs'; }
        }

        async function puxarOMsManual() {
            var escopo = _getEscopoSalvo();
            if(!_escopoValidoParaPuxar(escopo)) {
                mostrarEscopoPuxar();
                return;
            }
            await executarPuxarOMs(escopo);
        }

        function autoSincronizar() {
            var paraRemover = [];
            oms.forEach(function(om, idx) {
                if(om.finalizada && !om.pendenteAssinatura) {
                    moverParaHistorico(om, 'ATENDIDO');
                    paraRemover.push(idx);
                }
                if(om.cancelada && !om.pendenteAssinatura && om.assinaturaCliente) {
                    moverParaHistorico(om, 'CANCELADO');
                    paraRemover.push(idx);
                }
            });
            for(var i = paraRemover.length - 1; i >= 0; i--) {
                oms.splice(paraRemover[i], 1);
            }
            if(paraRemover.length > 0) salvarOMs();
        }

        window.puxarOMsManual = puxarOMsManual;
        window.carregarOMs = carregarOMs;
        window.salvarOMs = salvarOMs;

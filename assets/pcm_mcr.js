try {
  if (typeof pdfjsLib !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
    var _w = 'assets/vendor/pdf.worker.min.js';
    if (pdfjsLib.GlobalWorkerOptions.workerSrc !== _w) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = _w;
    }
  }
} catch (e) {}
function verificarDependencias() {
  var erros = [];

  if (typeof pdfjsLib === 'undefined') erros.push('pdf.js');
  if (!window.jspdf || !window.jspdf.jsPDF) erros.push('jsPDF');
  if (typeof XLSX === 'undefined') erros.push('XLSX');

  var hasAutoTable = !!(window.jspdf && window.jspdf.jsPDF && window.jspdf.jsPDF.API && window.jspdf.jsPDF.API.autoTable);
  if (!hasAutoTable) erros.push('jsPDF-AutoTable');

  var hasPdfDB = !!(window.PdfDB && typeof PdfDB.put === 'function' && typeof PdfDB.get === 'function' && typeof PdfDB.del === 'function' && typeof PdfDB.keys === 'function');
  if (!hasPdfDB) erros.push('PdfDB');
  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) erros.push('Credenciais Supabase (SUPABASE_URL, SUPABASE_ANON_KEY)');
  if (!window.ENV || Object.keys(window.ENV).length === 0) erros.push('Variáveis de ambiente (window.ENV)');

  if (erros.length > 0) {
    var msg = '⚠️ BIBLIOTECAS NÃO CARREGARAM: ' + erros.join(', ') + '\n\n';
    msg += 'Abra DIRETAMENTE no navegador (Chrome/Edge/Safari).\n';
    msg += 'Não funciona em pré-visualização.\n\n';
    msg += 'Faça o DOWNLOAD e abra no navegador.';
    alert(msg);

    var el = $('omList');
    if (el) {
      el.innerHTML =
        '<div style="padding:30px;text-align:center;color:#c00;font-size:14px;">' +
        '<b>⚠️ Erro de carregamento</b><br><br>' +
        'Faça o DOWNLOAD deste arquivo e abra no navegador (Chrome/Edge).<br>' +
        'A pré-visualização não suporta as bibliotecas necessárias.' +
        '</div>';
    }
    return false;
  }
  return true;
}

        var _elCache = {};
        function $(id) { return _elCache[id] || (_elCache[id] = document.getElementById(id)); }

        function _calcHH(hist) {
            var nEx = (hist.executantes || []).length || 1;
            var hhAtiv = hist.hhAtividade || 0;
            var hhDesl = hist.hhDeslocamento || 0;
            hist.hhEquipe = hhAtiv * nEx;
            hist.hhDeslocEquipe = hhDesl * nEx;
            hist.hhTotal = hist.hhEquipe + hist.hhDeslocEquipe;
            return hist;
        }

        function _h(s) {
            if (s == null) return '';
            return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
        }

        function _setBtns(map) {
            for (var id in map) {
                var el = $(id);
                if (el) el.style.display = map[id] ? (typeof map[id] === 'string' ? map[id] : 'block') : 'none';
            }
        }

        function _aplicarModoChecklistFoco(ativo) {
            var tela = $('detailScreen');
            if(!tela) return;
            if(ativo) tela.classList.add('checklist-focus');
            else tela.classList.remove('checklist-focus');
        }

        function _aplicarModoOficinaMinimal(ativo) {
            var tela = $('detailScreen');
            if(!tela) return;
            if(ativo) tela.classList.add('oficina-minimal');
            else tela.classList.remove('oficina-minimal');
        }

        function _btnOficinaCk() {
            if (currentOM.retornouOficina && !currentOM.devolvendoEquipamento) {
                _setBtns({ btnOficina:0, btnDevolverEquip:1, btnChecklist:0 });
            } else if (currentOM.devolvendoEquipamento) {
                _setBtns({ btnOficina:0, btnDevolverEquip:0, btnChecklist:0 });
            } else if (currentOM.planoCod || currentOM.checklistCorretiva) {
                _setBtns({ btnOficina:1, btnDevolverEquip:0, btnChecklist:0 });
            } else {
                _setBtns({ btnOficina:0, btnDevolverEquip:0, btnChecklist:1 });
            }
        }

        function _uiAtividade(skipChecklistAuto) {
            _setBtns({
                btnDeslocamento:0, btnIniciar:0, btnGroupAtividade:'flex',
                btnRowExecOficina:'flex', btnFinalizar:1,
                btnCancelar:0, btnExcluir:0, btnCancelarDesvio:0,
                timerAtividade:1
            });
            _btnOficinaCk();
            if (!skipChecklistAuto && (currentOM.planoCod || currentOM.checklistCorretiva)) _mostrarChecklistUI(false);
        }


        var configBDI = 18.8256;
        var configBM = { numero: '', dataInicio: '', dataFim: '' };
        var configTipoSolicitacao = 'Climatização e Refrigeração';
        var MATERIAL_VALE_ITEMS = ['99901', '99902'];

        (function validarBootstrapMCR() {
            var required = [
                'SENHA_FISCAL', 'STORAGE_KEY_OMS', 'STORAGE_KEY_CURRENT', 'STORAGE_KEY_MATERIAIS',
                'STORAGE_KEY_DEVICE', 'STORAGE_KEY_HISTORICO', 'STORAGE_KEY_DESVIOS',
                'STORAGE_KEY_DESVIOS_ACUM', 'STORAGE_KEY_DASHBOARD', 'STORAGE_KEY_CONFIG',
                'SUPABASE_TABLE_OMS', 'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_TABLE_MATERIAIS',
                'sc', 'arrayBufferToBase64', 'base64ToArrayBuffer', 'base64ToBlob'
            ];
            var faltando = required.filter(function (k) { return typeof window[k] === 'undefined'; });
            if (faltando.length) {
                console.error('[PCM] Bootstrap incompleto. Arquivos ausentes ou fora de ordem:', faltando);
                alert('⚠️ Falha ao inicializar o PCM: arquivos JS ausentes ou carregados fora de ordem.\n\nItens: ' + faltando.join(', '));
            }
        })();

        let priceList = {};
        const oms = [];
        let uploadedFiles = [];
        let currentOM = null;
        let deslocamentoInicio = null;
        let atividadeInicio = null;
        let deslocamentoMinutos = 0;
        let deslocamentoSegundos = 0;
        let numExecutantes = 0;
        let timerInterval = null;
        let timerAtividadeInterval = null;
        let canvas, ctx, isDrawing = false;
        let executantesNomes = [];
        let tempoPausadoTotal = 0;
        let pausaInicio = null;
        let materiaisUsados = [];
        let omAssinada = false;
        let clickCount = 0;
        let clickTimeout = null;
        let omPendenteParaAssinar = null;
        let atividadeJaIniciada = false;
        let deviceId = '';
        let isCancelamento = false;
        let checklistFotos = {};
        let fotoAtualItem = '';
        let fotoAtualTipo = '';
        let atividadeSegundos = 0;
        let _materiaisListaExpandida = false;

        // ==========================
        // REALTIME
        // ==========================
        var _rtClient = null;
        var _rtChannel = null;
        var _rtDebounce = null;
        var _rtReconnectTimer = null;

        function _rtAtualizar() {
            clearTimeout(_rtDebounce);
            _rtDebounce = setTimeout(function() {
                var escopo = _getEscopoSalvo();
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
            var dot = $('rtDot');
            if (!dot) return;
            dot.style.background = '#f5a623';
            setTimeout(function() { dot.style.background = '#4caf50'; }, 700);
        }

        function _rtSetStatus(status) {
            var dot = $('rtDot');
            var lbl = $('rtLabel');
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

        function _rtConectar() {
            if (!navigator.onLine) { _rtSetStatus('offline'); return; }
            if (!window.supabase) return;
            try {
                if (_rtClient) {
                    try { _rtClient.removeAllChannels(); } catch(e) {}
                }
                _rtClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                    realtime: { params: { eventsPerSecond: 2 } }
                });
                _rtChannel = _rtClient.channel('campo_oms_rt_' + deviceId)
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'oms' }, function(payload) {
                        var num = payload.new && payload.new.num;
                        var minhaOM = num && oms.some(function(o) { return o.num === num; });
                        var omAtiva = currentOM && currentOM.num === num;
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
            if (_rtClient) { try { _rtClient.removeAllChannels(); } catch(e) {} _rtClient = null; }
            _rtSetStatus('offline');
        }

        window.addEventListener('online',  function() { _rtConectar(); });
        window.addEventListener('offline', function() { _rtDesconectar(); _rtSetStatus('offline'); });

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
            try { await Promise.all(delPromises); } catch(e){}

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
        async function _inicializarAppComEnv() {
            if(__pcmAppStarted) return;
            __pcmAppStarted = true;
            if(!verificarDependencias()) return;
            limparHistoricoAntigo();
            initDeviceId();
            _atualizarLabelEscopo(_getEscopoSalvo());
            await carregarMateriais();
            await sincronizarConfig();
            carregarOMs();
            carregarOMAtual();
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
                try { priceList = JSON.parse(cached); } catch(e) {}
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

        async function carregarOMAtual() {
            var saved = localStorage.getItem(STORAGE_KEY_CURRENT);

            if(!saved) {
                try {
                    var backup = await PdfDB.get('current_om_state');
                    if(backup) {
                        saved = JSON.stringify(backup);
                        console.log('Estado da OM recuperado do IndexedDB (localStorage estava vazio)');
                    }
                } catch(e) {}
            }

            if(!saved) return;
            try {
                const estado = JSON.parse(saved);
                const omIndex = oms.findIndex(om => om.num === estado.omNum);
                if(omIndex < 0) {
                    localStorage.removeItem(STORAGE_KEY_CURRENT);
                    try { PdfDB.del('current_om_state').catch(function(){}); } catch(e){}
                    return;
                }
                currentOM = oms[omIndex];
                if(currentOM && Array.isArray(currentOM.historicoExecucao) && currentOM.historicoExecucao.length > 0) {
                    var ultimoAberto = currentOM.historicoExecucao[currentOM.historicoExecucao.length - 1];
                    if(ultimoAberto && Array.isArray(ultimoAberto.executantes) && ultimoAberto.executantes.length) {
                        executantesNomes = ultimoAberto.executantes.slice();
                        numExecutantes = executantesNomes.length;
                        currentOM.primeiroExecutante = executantesNomes[0] || currentOM.primeiroExecutante || '';
                    }
                }

                var emDeslocamento = estado.statusAtual === 'em_deslocamento';

                if(!emDeslocamento) {
                    if(!currentOM.historicoExecucao || currentOM.historicoExecucao.length === 0) {
                        localStorage.removeItem(STORAGE_KEY_CURRENT);
                        try { PdfDB.del('current_om_state').catch(function(){}); } catch(e){}
                        currentOM = null;
                        return;
                    }
                    var ultimo = currentOM.historicoExecucao[currentOM.historicoExecucao.length - 1];
                    if(ultimo.dataFim) {
                        localStorage.removeItem(STORAGE_KEY_CURRENT);
                        try { PdfDB.del('current_om_state').catch(function(){}); } catch(e){}
                        currentOM = null;
                        return;
                    }
                }

                if(estado.materiaisUsados) materiaisUsados = estado.materiaisUsados;
                if(estado.deslocamentoSegundos !== undefined) {
                    deslocamentoSegundos = estado.deslocamentoSegundos;
                    deslocamentoMinutos = Math.floor(deslocamentoSegundos / 60);
                } else if(estado.deslocamentoMinutos) {
                    deslocamentoMinutos = estado.deslocamentoMinutos;
                    deslocamentoSegundos = deslocamentoMinutos * 60;
                }
                if(estado.tempoPausadoTotal !== undefined) tempoPausadoTotal = estado.tempoPausadoTotal;
                if(estado.deslocHoraInicio) currentOM._deslocHoraInicio = estado.deslocHoraInicio;
                if(estado.deslocHoraFim) currentOM._deslocHoraFim = estado.deslocHoraFim;
                if(estado.statusAtual) currentOM.statusAtual = estado.statusAtual;
                if(estado.primeiroExecutante) currentOM.primeiroExecutante = estado.primeiroExecutante;
                if(estado.deslocamentoInicioTS) deslocamentoInicio = new Date(estado.deslocamentoInicioTS);
            } catch(e) {
                console.error('Erro ao carregar OM atual:', e);
                localStorage.removeItem(STORAGE_KEY_CURRENT);
                try { PdfDB.del('current_om_state').catch(function(){}); } catch(e2){}
            }
        }

        function salvarOMAtual() {
            if(!currentOM) {
                localStorage.removeItem(STORAGE_KEY_CURRENT);
                try { PdfDB.del('current_om_state').catch(function(){}); } catch(e){}
                return;
            }
            const estado = {
                omNum: currentOM.num,
                materiaisUsados: materiaisUsados,
                deslocamentoMinutos: deslocamentoMinutos,
                deslocamentoSegundos: deslocamentoSegundos,
                tempoPausadoTotal: tempoPausadoTotal,
                deslocHoraInicio: currentOM._deslocHoraInicio || null,
                deslocHoraFim: currentOM._deslocHoraFim || null,
                statusAtual: currentOM.statusAtual || null,
                primeiroExecutante: currentOM.primeiroExecutante || null,
                deslocamentoInicioTS: deslocamentoInicio ? deslocamentoInicio.toISOString() : null
            };
            localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(estado));
            try { PdfDB.put('current_om_state', estado).catch(function(e){
                console.warn('Backup IndexedDB falhou:', e);
            }); } catch(e){}
            salvarOMs();
        }

        function _buildOMPayload(om) {
            function _parseBRDate(s) {
                if(!s || s.indexOf('--') === 0) return null;
                var m = s.match(/(\d{2})\/(\d{2})\/(\d{4})/);
                if(!m) return null;
                try { return new Date(m[3],m[2]-1,m[1],0,0,0).toISOString(); } catch(e){ return null; }
            }
            var execArr = (om.historicoExecucao && om.historicoExecucao.length > 0)
                ? (om.historicoExecucao[om.historicoExecucao.length-1].executantes || [])
                : [];
            var statusMap = {
                'em_deslocamento': 'em_execucao',
                'iniciada': 'em_execucao',
                'pausada': 'em_execucao',
                'reprogramada': 'reprogramada'
            };
            var statusFinal = statusMap[om.statusAtual] || om.statusAtual || 'enviada';
            if(om.emOficina) statusFinal = 'em_oficina';
            if(om.pendenteAssinatura) statusFinal = 'pendente_assinatura';
            if(om.finalizada) statusFinal = 'finalizada';
            if(om.cancelada) statusFinal = 'cancelada';

            var _hhTotal = 0;
            var _hist = om.historicoExecucao || [];
            for(var _i=0; _i<_hist.length; _i++) _hhTotal += (_hist[_i].hhTotal || 0);

            var _matTotal = 0;
            var _mats = om.materiaisUsados || [];
            for(var _j=0; _j<_mats.length; _j++) _matTotal += (_mats[_j].total || 0);

            var _temMaterial = _mats.length > 0;
            var _clienteAssinou = !!(om.assinaturaCliente && om.finalizada && !om.pendenteAssinatura && !om.cancelada);
            var _estadoFluxo;
            if(om.cancelada) {
                _estadoFluxo = 'cancelada';
            } else if(om.emOficina) {
                _estadoFluxo = 'em_oficina';
            } else if(om.pendenteAssinatura || om.finalizada) {
                _estadoFluxo = _temMaterial ? 'executada' : 'pendente_fiscal';
            } else {
                _estadoFluxo = 'executada';
            }

            return {
                num: om.num,
                titulo: om.titulo || '',
                status: statusFinal,
                finalizada: !!om.finalizada,
                cancelada: !!om.cancelada,
                pendente_assinatura: !!om.pendenteAssinatura,
                cliente_assinou: _clienteAssinou,
                hh_total: _hhTotal,
                materiais_total: _matTotal,
                has_checklist: !!(om.planoCod || om.checklistCorretiva),
                has_fotos: !!(om.checklistFotos && Object.keys(om.checklistFotos || {}).length > 0),
                has_nc: !!(om._hasNcPdf || (om.checklistFotos && Object.keys(om.checklistFotos || {}).some(function(k){ return (om.checklistFotos[k]||{}).antes; }))),
                estado_fluxo: _estadoFluxo,
                lock_device_id: om.lockDeviceId || null,
                primeiro_executante: om.primeiroExecutante || null,
                operador: execArr.join(', ') || om.primeiroExecutante || '',
                executantes: execArr,
                historico_execucao: om.historicoExecucao || [],
                materiais_usados: om.materiaisUsados || [],
                deslocamento_segundos: om._deslocSegundosSnapshot || deslocamentoSegundos || 0,
                desloc_hora_inicio: om._deslocHoraInicio || null,
                desloc_hora_fim: om._deslocHoraFim || null,
                equipe: om.equipe || '',
                cc: om.cc || '',
                equipamento: om.equipamento || '',
                local_instalacao: om.local || '',
                desc_local: om.descLocal || '',
                plano_cod: om.planoCod || '',
                admin_unlock: false,
                tipo_checklist: om.tipoChecklist || '',
                motivo_reprogramacao: om.motivoReprogramacao || '',
                data_finalizacao: om.dataFinalizacao || null,
                data_execucao: om.dataFinalizacao || null,
                escopo: om.escopo || 'geral',
                data_inicio_prevista: _parseBRDate(om.inicio) || om.data_inicio_prevista || null,
                data_fim_prevista: _parseBRDate(om.fim) || om.data_fim_prevista || null,
                updated_at: new Date().toISOString()
            };
        }

        var _pushPendentes = [];

        function _salvarPushPendentes() {
            try { localStorage.setItem('pcm_push_pendentes', JSON.stringify(_pushPendentes)); } catch(e) {}
        }
        function _carregarPushPendentes() {
            try { var r = localStorage.getItem('pcm_push_pendentes'); if(r) _pushPendentes = JSON.parse(r); } catch(e) {}
        }

        function _ehStatusTerminalPayload(payload) {
            if(!payload) return false;
            return !!(
                payload.finalizada ||
                payload.cancelada ||
                payload.pendente_assinatura ||
                payload.status === 'finalizada' ||
                payload.status === 'cancelada' ||
                payload.status === 'pendente_assinatura'
            );
        }

        async function _removerOrigemOMServidor(omNum) {
            if(!omNum || !navigator.onLine) return false;
            try {
                var _token = (window.PCMAuth && window.PCMAuth.getToken()) || SUPABASE_ANON_KEY;
                var resp = await fetch(SUPABASE_URL + '/storage/v1/object/pcm-files/originais/' + omNum + '.pdf', {
                    method: 'DELETE',
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': 'Bearer ' + _token
                    }
                });
                if(!resp.ok && resp.status !== 404) {
                    var txt = await resp.text().catch(function(){ return ''; });
                    throw new Error('HTTP ' + resp.status + ' ' + txt.substring(0, 200));
                }
                try { await PdfDB.del('orig_' + omNum); } catch(e) {}
                return true;
            } catch(e) {
                console.warn('Falha ao remover original da OM ' + omNum + ':', e.message);
                return false;
            }
        }

        async function _executarPush(payload) {
            var _authToken = (window.PCMAuth && window.PCMAuth.getToken()) || SUPABASE_ANON_KEY;
            var _hdrs = {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': 'Bearer ' + _authToken,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation,count=exact'
            };
            var resp = await _fetchComTimeout(
                SUPABASE_URL + '/rest/v1/' + SUPABASE_TABLE_OMS + '?num=eq.' + encodeURIComponent(payload.num),
                { method: 'PATCH', headers: _hdrs, body: JSON.stringify(payload) },
                12000
            );
            if(resp.ok) {
                var contentRange = resp.headers.get('Content-Range') || '';
                var matched = contentRange ? parseInt(contentRange.split('/')[1] || '0', 10) : -1;
                if(matched === 0) {
                    console.warn('[PUSH] PATCH OM ' + payload.num + ' — 0 linhas afetadas, tentando upsert');
                    var _hdrsUpsert = Object.assign({}, _hdrs, { 'Prefer': 'resolution=merge-duplicates,return=minimal' });
                    var upsertResp = await _fetchComTimeout(
                        SUPABASE_URL + '/rest/v1/' + SUPABASE_TABLE_OMS,
                        { method: 'POST', headers: _hdrsUpsert, body: JSON.stringify(payload) },
                        12000
                    );
                    if(!upsertResp.ok) {
                        var upsertErr = await upsertResp.text().catch(function(){ return ''; });
                        throw new Error('Upsert HTTP ' + upsertResp.status + ' — ' + upsertErr.substring(0, 300));
                    }
                }
                if(_ehStatusTerminalPayload(payload)) {
                    try { await _removerOrigemOMServidor(payload.num); } catch(e) {}
                }
                return true;
            }
            var errBody = await resp.text().catch(function(){ return ''; });
            console.error('[PUSH] PATCH falhou HTTP ' + resp.status + ':', errBody);
            throw new Error('HTTP ' + resp.status + ' — ' + errBody.substring(0, 300));
        }

        async function _pushOMStatusSupabase(om, _tentativa) {
            if(!om || !om.num) return;
            _tentativa = _tentativa || 1;
            var payload = _buildOMPayload(om);
            try {
                await _executarPush(payload);
            } catch(e) {
                console.warn('[PUSH] OM ' + om.num + ' tentativa ' + _tentativa + ' falhou:', e.message);
                if(_tentativa < 4) {
                    var delay = Math.min(20000, 3000 * Math.pow(2, _tentativa - 1));
                    setTimeout(function() { _pushOMStatusSupabase(om, _tentativa + 1); }, delay);
                } else {
                    _pushPendentes.push({ payload: payload, ts: Date.now() });
                    _salvarPushPendentes();
                    if(window.showToast) window.showToast('⚠️ OM ' + om.num + ' salva localmente — sync pendente', 'warn', 6000);
                }
            }
        }

        async function _processarPushPendentes() {
            if(_pushPendentes.length === 0) return;
            if(!navigator.onLine) return;
            var total = _pushPendentes.length;
            var falhas = [];
            for(var i = 0; i < total; i++) {
                try {
                    await _executarPush(_pushPendentes[i].payload);
                } catch(e) {
                    falhas.push(_pushPendentes[i]);
                }
            }
            _pushPendentes = falhas;
            _salvarPushPendentes();
            if(falhas.length === 0 && total > 0) {
                if(window.showToast) window.showToast('✅ ' + total + ' OM(s) sincronizada(s)', 'success');
            }
        }

        _carregarPushPendentes();
        setInterval(_processarPushPendentes, 45000);
        window.addEventListener('online', function() { setTimeout(_processarPushPendentes, 3000); });

        async function _uploadPDFRelatorio(omNum, _tentativa) {
            if(!window.PdfDB || !omNum) return;
            _tentativa = _tentativa || 1;

            async function _getPdfByPrefix(prefix) {
                var key = prefix + omNum;
                var data = await window.PdfDB.get(key).catch(function() { return null; });
                if(!data && typeof window.PdfDB.keys === 'function') {
                    var allKeys = await window.PdfDB.keys().catch(function() { return []; });
                    var pref = key + '_';
                    var matches = (allKeys || []).filter(function(k) { return typeof k === 'string' && k.indexOf(pref) === 0; });
                    if(matches.length) { matches.sort(); data = await window.PdfDB.get(matches[matches.length - 1]).catch(function() { return null; }); }
                }
                return data;
            }

            async function _uploadBlob(pdfBase64, path) {
                if(!pdfBase64) return false;
                var raw = pdfBase64.indexOf(',') >= 0 ? pdfBase64.split(',')[1] : pdfBase64;
                var bin = atob(raw);
                var bytes = new Uint8Array(bin.length);
                for(var _i=0; _i<bin.length; _i++) bytes[_i] = bin.charCodeAt(_i);
                var blob = new Blob([bytes], {type:'application/pdf'});
                var _token = (window.PCMAuth && window.PCMAuth.getToken()) || SUPABASE_ANON_KEY;
                var resp = await fetch(SUPABASE_URL + '/storage/v1/object/pcm-files/' + path, {
                    method: 'POST',
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': 'Bearer ' + _token,
                        'Content-Type': 'application/pdf',
                        'x-upsert': 'true'
                    },
                    body: blob
                });
                if(!resp.ok) {
                    var txt = '';
                    try { txt = await resp.text(); } catch(_e) {}
                    throw new Error('Upload HTTP ' + resp.status + ' em ' + path + (txt ? ' — ' + txt : ''));
                }
                return true;
            }

            try {
                var _token = (window.PCMAuth && window.PCMAuth.getToken()) || SUPABASE_ANON_KEY;
                var patch = {};

                var relPdf = await _getPdfByPrefix('rel_');
                if(relPdf) { var ok = await _uploadBlob(relPdf, 'reports/OM_' + omNum + '.pdf'); if(ok) patch.has_relatorio = true; }

                var ckPdf = await _getPdfByPrefix('ck_');
                if(ckPdf) { var ok2 = await _uploadBlob(ckPdf, 'reports/CK_' + omNum + '.pdf'); if(ok2) patch.has_checklist = true; }

                var ncPdf = await _getPdfByPrefix('nc_');
                if(ncPdf) { var ok3 = await _uploadBlob(ncPdf, 'reports/NC_' + omNum + '.pdf'); if(ok3) patch.has_nc = true; }

                var devPdf = await _getPdfByPrefix('dev_');
                if(devPdf) { await _uploadBlob(devPdf, 'desvios/DEV_' + omNum + '.pdf'); }

                if(Object.keys(patch).length > 0) {
                    var _patchHdrs = {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': 'Bearer ' + _token,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    };
                    var _patchUrl = SUPABASE_URL + '/rest/v1/oms?num=eq.' + omNum;
                    try {
                        var patchResp = await fetch(_patchUrl, { method: 'PATCH', headers: _patchHdrs, body: JSON.stringify(patch) });
                        if(!patchResp.ok) {
                            var patchTxt = '';
                            try { patchTxt = await patchResp.text(); } catch(_e) {}
                            throw new Error('PATCH HTTP ' + patchResp.status + (patchTxt ? ' — ' + patchTxt : ''));
                        }
                    } catch(e) {
                        var keys = Object.keys(patch);
                        for(var _pk = 0; _pk < keys.length; _pk++) {
                            var _single = {};
                            _single[keys[_pk]] = patch[keys[_pk]];
                            var patchSingleResp = await fetch(_patchUrl, { method: 'PATCH', headers: _patchHdrs, body: JSON.stringify(_single) });
                            if(!patchSingleResp.ok) {
                                var patchSingleTxt = '';
                                try { patchSingleTxt = await patchSingleResp.text(); } catch(_e2) {}
                                throw new Error('PATCH HTTP ' + patchSingleResp.status + (patchSingleTxt ? ' — ' + patchSingleTxt : ''));
                            }
                        }
                    }
                }
            } catch(e) {
                console.warn('_uploadPDFRelatorio tentativa ' + _tentativa + ' falhou:', e.message);
                if(_tentativa < 5) {
                    var delay = Math.min(30000, 5000 * _tentativa);
                    if(window.showToast) window.showToast('⚠️ PDF não enviado — tentando novamente em ' + Math.round(delay/1000) + 's', 'warn');
                    setTimeout(function() { _uploadPDFRelatorio(omNum, _tentativa + 1); }, delay);
                } else {
                    if(window.showToast) window.showToast('❌ PDF da OM ' + omNum + ' não enviado. Verifique conexão e tente Puxar OMs.', 'error', 8000);
                }
            }
        }

        async function _fetchComTimeout(url, options, timeoutMs) {
            timeoutMs = timeoutMs || 10000;
            if(typeof AbortController === 'undefined') return fetch(url, options || {});
            var ctrl = new AbortController();
            var timer = setTimeout(function() { ctrl.abort(); }, timeoutMs);
            var opts = options ? Object.assign({}, options) : {};
            opts.signal = ctrl.signal;
            try {
                return await fetch(url, opts);
            } finally {
                clearTimeout(timer);
            }
        }

        async function _verificarAdminUnlock() {
            if(!currentOM || !currentOM.num) return;
            try {
                var resp = await _fetchComTimeout(
                    SUPABASE_URL + '/rest/v1/' + SUPABASE_TABLE_OMS +
                    '?num=eq.' + currentOM.num + '&select=admin_unlock,admin_unlock_ts,lock_device_id',
                    {
                        headers: {
                            'apikey': SUPABASE_ANON_KEY,
                            'Authorization': 'Bearer ' + ((window.PCMAuth && window.PCMAuth.getToken()) || SUPABASE_ANON_KEY)
                        }
                    },
                    8000
                );
                if(!resp.ok) return;
                var rows = await resp.json();
                if(!rows || !rows.length) return;
                var row = rows[0];
                if(row.admin_unlock && row.lock_device_id === null) {
                    var agora = new Date().toISOString();
                    // Fechar entrada anterior sem HH — tempo perdido com falha não conta
                    if(currentOM.historicoExecucao && currentOM.historicoExecucao.length > 0) {
                        var hAberto = currentOM.historicoExecucao[currentOM.historicoExecucao.length - 1];
                        if(hAberto.dataInicio && !hAberto.dataFim) {
                            hAberto.dataFim = agora;
                            hAberto.hhAtividade = 0;
                            hAberto.hhEquipe = 0;
                            hAberto.hhTotal = 0;
                            hAberto.deslocamentoSegundos = 0;
                            hAberto.hhDeslocamento = 0;
                            hAberto.tag = 'FALHA DISPOSITIVO — RETOMADA ADMIN';
                            hAberto.falhaDispositivo = true;
                        }
                    }
                    // Nova entrada de execução a partir da liberação
                    if(!currentOM.historicoExecucao) currentOM.historicoExecucao = [];
                    var _execsRetomada = Array.isArray(executantesNomes) && executantesNomes.length ? executantesNomes.slice() : [];
                    if(!_execsRetomada.length && currentOM.historicoExecucao.length > 0) {
                        for(var _hi = currentOM.historicoExecucao.length - 1; _hi >= 0; _hi--) {
                            var _hPrev = currentOM.historicoExecucao[_hi];
                            if(_hPrev && Array.isArray(_hPrev.executantes) && _hPrev.executantes.length) {
                                _execsRetomada = _hPrev.executantes.slice();
                                executantesNomes = _execsRetomada.slice();
                                numExecutantes = _execsRetomada.length;
                                break;
                            }
                        }
                    }
                    currentOM.historicoExecucao.push({
                        executantes: _execsRetomada,
                        data: new Date().toLocaleDateString('pt-BR'),
                        dataInicio: agora,
                        dataFim: null,
                        admin_unlock_ts: row.admin_unlock_ts,
                        deslocamentoSegundos: 0,
                        hhDeslocamento: 0, hhAtividade: 0, hhEquipe: 0, hhTotal: 0
                    });
                    deslocamentoSegundos = 0;
                    deslocamentoMinutos = 0;
                    tempoPausadoTotal = 0;
                    currentOM.lockDeviceId = deviceId;
                    currentOM.admin_unlock_ts = row.admin_unlock_ts;
                    _pushOMStatusSupabase(currentOM);
                    salvarOMs();
                    filtrarOMs();
                }
            } catch(e) {}
        }

        async function _verificarAdminUnlockParaOM(omNum) {
            try {
                var resp = await _fetchComTimeout(
                    SUPABASE_URL + '/rest/v1/' + SUPABASE_TABLE_OMS +
                    '?num=eq.' + omNum + '&select=admin_unlock,admin_unlock_ts,historico_execucao,deslocamento_segundos,desloc_hora_inicio,desloc_hora_fim,executantes,materiais_usados',
                    {
                        headers: {
                            'apikey': SUPABASE_ANON_KEY,
                            'Authorization': 'Bearer ' + ((window.PCMAuth && window.PCMAuth.getToken()) || SUPABASE_ANON_KEY)
                        }
                    },
                    8000
                );
                if(!resp.ok) return null;
                var rows = await resp.json();
                if(!rows || !rows.length) return null;
                return rows[0];
            } catch(e) { return null; }
        }

        async function _obterEstadoServidorOM(omNum) {
            if(!omNum || !navigator.onLine) return null;
            try {
                var resp = await _fetchComTimeout(
                    SUPABASE_URL + '/rest/v1/' + SUPABASE_TABLE_OMS +
                    '?num=eq.' + omNum + '&select=num,lock_device_id,admin_unlock,status',
                    {
                        headers: {
                            'apikey': SUPABASE_ANON_KEY,
                            'Authorization': 'Bearer ' + ((window.PCMAuth && window.PCMAuth.getToken()) || SUPABASE_ANON_KEY)
                        }
                    },
                    8000
                );
                if(!resp.ok) return null;
                var rows = await resp.json();
                if(!rows || !rows.length) return null;
                return rows[0];
            } catch(e) {
                return null;
            }
        }

        $('fileInput').addEventListener('change', async function(e) {
            const files = Array.from(e.target.files);
            
            for(let file of files) {
                const arrayBuffer = await file.arrayBuffer();
                const base64 = arrayBufferToBase64(arrayBuffer);
                
                uploadedFiles.push({
                    file: file,
                    nome: file.name,
                    base64: base64
                });
            }
            
            renderFilesList();
            $('btnProcessar').style.display = 'block';
        });

        function renderFilesList() {
            const list = $('filesList');
            list.innerHTML = '';
            uploadedFiles.forEach((fileObj, idx) => {
                const div = document.createElement('div');
                div.className = 'file-item';
                div.innerHTML = `
                    <div class="file-info">
                        <div class="file-name">📄 ${fileObj.nome}</div>
                        <div class="file-status">Pronto para processar</div>
                    </div>
                    <button class="remove-btn" onclick="removerArquivo(${idx})">✕</button>
                `;
                list.appendChild(div);
            });
        }

        function removerArquivo(idx) {
            uploadedFiles.splice(idx, 1);
            if(uploadedFiles.length === 0) {
                $('btnProcessar').style.display = 'none';
            }
            renderFilesList();
        }

        async function processarPDFs() {
            if(uploadedFiles.length === 0) return;
            if(typeof pdfjsLib === 'undefined') {
                alert('⚠️ pdf.js não carregou!\n\nFaça o DOWNLOAD do arquivo e abra no navegador.');
                return;
            }
            
            var btn = $('btnProcessar');
            btn.textContent = '⏳ PROCESSANDO...';
            btn.disabled = true;
            
            const pdfPromises = [];
            var processados = 0;
            var errosProc = 0;
            
            for(let fileIdx = 0; fileIdx < uploadedFiles.length; fileIdx++) {
                const fileObj = uploadedFiles[fileIdx];
                try {
                    const arrayBuffer = base64ToArrayBuffer(fileObj.base64);
                    const pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise;
                    var p;
                    if(pdf.numPages >= 2) {
                        p = await pdf.getPage(2);
                    } else {
                        p = await pdf.getPage(1);
                    }
                    const c = await p.getTextContent();
                    const txt = c.items.map(i => i.str).join(" ");
                    
                    var pdfItems = c.items.filter(function(i){ return i.str.trim(); }).map(function(i){
                        return { str: i.str.trim(), x: i.transform[4], y: Math.round(i.transform[5]*10)/10 };
                    });
                    pdfItems.sort(function(a,b){ return b.y - a.y || a.x - b.x; });
                    var txtLines = '';
                    var prevY = null;
                    for(var li=0; li<pdfItems.length; li++){
                        var itm = pdfItems[li];
                        if(prevY !== null && Math.abs(itm.y - prevY) > 2){ txtLines += '\n'; }
                        else if(prevY !== null){ txtLines += ' '; }
                        txtLines += itm.str;
                        prevY = itm.y;
                    }
                    
                    const dados = extrairDados(txt, txtLines);
                    
                    var omNum = dados.om;
                    if(omNum === '---') {
                        omNum = fileObj.nome.replace(/\.pdf$/i, '');
                    }
                    
                    if(omNum !== '---') {
                        var existIdx = oms.findIndex(function(o){ return o.num === omNum; });
                        if(existIdx >= 0) {
                            var existOM = oms[existIdx];
                            var temAtiva = existOM.historicoExecucao && existOM.historicoExecucao.some(function(h){ return !h.dataFim; });
                            if(temAtiva || existOM.lockDeviceId) {
                                continue;
                            }
                            oms.splice(existIdx, 1);
                            var savedCurrent = localStorage.getItem(STORAGE_KEY_CURRENT);
                            if(savedCurrent) {
                                try {
                                    var est = JSON.parse(savedCurrent);
                                    if(est.omNum === omNum) localStorage.removeItem(STORAGE_KEY_CURRENT);
                                } catch(e) {}
                            }
                        }
                    }
                    
                    const om = {
                        num: omNum,
                        titulo: dados.tituloCurto,
                        cc: dados.centroCusto,
                        equipamento: dados.numEquip,
                        local: dados.local,
                        status: dados.badgesHTML,
                        descricao: dados.descCompleta,
                        inicio: dados.inicio,
                        fim: dados.fim,
                        planoCod: dados.planoCod,
                        equipe: dados.equipe,
                        descLocal: dados.descLocal,
                        descLocalSup: dados.descLocalSup,
                        caracteristicas: dados.caracteristicas,
                        criticidade: dados.criticidade,
                        tipoManut: dados.tipoManut,
                        tagIdentificacao: dados.tagIdentificacao || '',
                        historicoExecucao: [],
                        materiaisUsados: [],
                        finalizada: false,
                        cancelada: false,
                        pendenteAssinatura: false,
                        arquivo: fileObj.nome,
                        lockDeviceId: null
                    };
                    
                    oms.push(om);
                    _gravarDashboardLog('PROGRAMADO', om);
                    pdfPromises.push(PdfDB.put('orig_' + omNum, fileObj.base64));

                    // Upload para Supabase Storage para acesso cross-device
                    (function(num, b64) {
                        try {
                            var byteStr = atob(b64.split(',').pop());
                            var ab = new ArrayBuffer(byteStr.length);
                            var ia = new Uint8Array(ab);
                            for (var i = 0; i < byteStr.length; i++) ia[i] = byteStr.charCodeAt(i);
                            var blob = new Blob([ab], { type: 'application/pdf' });
                            var token = (window.PCMAuth && window.PCMAuth.getToken()) || SUPABASE_ANON_KEY;
                            fetch(SUPABASE_URL + '/storage/v1/object/pcm-files/originais/' + num + '.pdf', {
                                method: 'POST',
                                headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/pdf', 'x-upsert': 'true' },
                                body: blob
                            }).then(function(resp) {
                                if(!resp.ok) {
                                    return resp.text().then(function(txt) {
                                        throw new Error('HTTP ' + resp.status + (txt ? ' — ' + txt : ''));
                                    });
                                }
                            }).catch(function(e) { console.warn('[Upload] Storage falhou para ' + num + ':', e.message); });
                        } catch(e) { console.warn('[Upload] Erro ao preparar blob ' + num + ':', e.message); }
                    })(omNum, fileObj.base64);

                    processados++;
                } catch(e) {
                    errosProc++;
                    console.error('Erro processando ' + fileObj.nome + ':', e);
                }
            }
            
            await Promise.all(pdfPromises);
            
            uploadedFiles = [];
            $('filesList').innerHTML = '';
            btn.textContent = '🔍 PROCESSAR OMs';
            btn.disabled = false;
            btn.style.display = 'none';
            salvarOMs();
            filtrarOMs();
            
            var msg = '✅ ' + processados + ' OM(s) processada(s)!';
            if(errosProc > 0) msg += '\n❌ ' + errosProc + ' arquivo(s) com erro.';
            alert(msg);
        }

        function _extrairOM(txt) {
            var m = txt.match(/\b(20\d{10})\b/);
            return m ? m[1] : '---';
        }

        function _extrairTitulo(txtLines) {
            var titulo = 'MANUTENÇÃO';
            if (!txtLines) return titulo;
            var tLines = txtLines.split('\n');
            for (var i = 0; i < Math.min(tLines.length, 15); i++) {
                var tl = tLines[i].trim();
                var omInLine = tl.match(/OM\s+(20\d{10})/);
                if (omInLine) {
                    var t = tl.replace(/OM\s+20\d{10}/, '').trim();
                    if (t.length > 3 && !t.match(/^Adm\./i) && !t.match(/^VALE$/i)) return t;
                }
            }
            for (var i2 = 0; i2 < Math.min(tLines.length, 20); i2++) {
                if (tLines[i2].trim().match(/^EQUIPAMENTO/i) && i2 > 0) {
                    var prev = tLines[i2 - 1].trim().replace(/OM\s+20\d{10}/, '').trim();
                    if (prev.length > 3 && !prev.match(/^Adm\./i) && !prev.match(/^VALE$/i)) return prev;
                    break;
                }
            }
            return titulo;
        }

        function _extrairDescricao(txt) {
            var ini = txt.indexOf('DETALHAMENTO DA ORDEM');
            if (ini === -1) return '';
            var fim = txt.indexOf('DURAÇÃO DA TAREFA');
            if (fim !== -1 && fim > ini) return txt.substring(ini + 21, fim).trim();
            return txt.substring(ini + 21).replace(/\d+\s+de\s+\d+\s*$/, '').trim();
        }

        function _extrairCentroCusto(txt, txtLines, om, numEquip) {
            function limpar(v) { return String(v || '').replace(/\s+/g, ' ').replace(/^[\s:|\-]+/, '').replace(/[\s|:.-]+$/, '').trim(); }
            function escRgx(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
            function extrairPorRotulo(texto, rotulo, proximos) {
                var labels = (proximos || []).map(escRgx).join('|');
                var rgx = new RegExp(escRgx(rotulo) + '\s*[:|]?\s*([\s\S]*?)(?=' + (labels ? labels : '$') + '|$)', 'i');
                var m = texto.match(rgx);
                return (m && m[1]) ? limpar(m[1]) : '';
            }
            var porCampo = extrairPorRotulo(txt, 'Centro de Custo', [
                'Criticidade', 'Tipo Contador', 'T[eé]rmino da Garantia', 'Fonte radioativa',
                'N[ºo] Identifica[cç][aã]o T[eé]cnica', 'Local de Instala[cç][aã]o',
                'Descri[cç][aã]o do Local de Instala[cç][aã]o', 'Local de Instala[cç][aã]o Superior',
                'Descri[cç][aã]o do Local de Instala[cç][aã]o Superior',
                'Caracter[ií]sticas do Equipamento', 'ORDEM DE MANUTEN'
            ]);
            if (porCampo) { var mC = porCampo.match(/\b\d{6,10}\b/); if (mC && mC[0] !== om) return mC[0]; }
            if (txtLines) {
                var linhas = txtLines.split('\n').map(function(l){ return limpar(l); }).filter(Boolean);
                for (var i = 0; i < linhas.length; i++) {
                    if (/Centro de Custo/i.test(linhas[i])) {
                        var mIn = linhas[i].match(/Centro de Custo\s*[:|]?\s*(\d{6,10})/i);
                        if (mIn && mIn[1] !== om) return mIn[1];
                        for (var j = i + 1; j < Math.min(i + 4, linhas.length); j++) {
                            if (/^(Criticidade|Tipo Contador|T[eé]rmino da Garantia|Fonte radioativa|N[ºo] Identifica)/i.test(linhas[j])) break;
                            var mL = linhas[j].match(/\b\d{6,10}\b/);
                            if (mL && mL[0] !== om) return mL[0];
                        }
                    }
                }
            }
            var blocoEquip = extrairPorRotulo(txt, 'EQUIPAMENTO', ['ORDEM DE MANUTEN']);
            if (blocoEquip) {
                var cands = blocoEquip.match(/\b\d{6,10}\b/g) || [];
                for (var c = 0; c < cands.length; c++) { if (cands[c] !== om && cands[c] !== numEquip) return cands[c]; }
            }
            return '---';
        }

        function _extrairDatas(txt) {
            var m = txt.match(/(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2})\s+(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2})/);
            return m ? { inicio: m[1] + ' ' + m[2], fim: m[3] + ' ' + m[4] } : { inicio: '--/--/-- --:--', fim: '--/--/-- --:--' };
        }

        function _extrairStatus(txt) {
            var statusMatch = txt.match(/Status Sistema Ordem([\s\S]*?)(?=Status Sistema Operação|Status Usuário)/i);
            var validStatus = ['LIB','IMPR','CAPC','CCOP','DMNV','SCDM','EXEC','URGT','VPTS','NOLQ','AGDO'];
            if (!statusMatch) return 'LIB';
            var clean = statusMatch[1].replace(/Status Sistema Ordem/gi, '').trim();
            var found = clean.split(/\s+/).filter(function(s){ return validStatus.indexOf(s) !== -1; });
            return found.length > 0 ? found.join(' ') : 'LIB';
        }

        function _extrairLocalEquipe(txt, txtLines) {
            var planoMatch = txt.match(/\b(1[89]\d{5})\b/);
            var locMatch = txt.match(/(INFN-[A-Z0-9-]+)/);
            var eqMatch = txt.match(/(S11[A-Z0-9]+)/);
            var descLocal = '---', descLocalSup = '---', caracteristicas = '---';
            var local = locMatch ? locMatch[1] : '---';
            if (txtLines) {
                var lines = txtLines.split('\n');
                var firstINFN = -1, secondINFN = -1, ordemLine = -1;
                for (var li = 0; li < lines.length; li++) {
                    var ln = lines[li].trim();
                    if (ln.match(/INFN-[A-Z0-9-]+/)) {
                        if (firstINFN === -1) firstINFN = li;
                        else if (secondINFN === -1) secondINFN = li;
                    }
                    if (ln.match(/ORDEM DE MANUTEN/i) && ordemLine === -1) { ordemLine = li; break; }
                }
                if (firstINFN !== -1) {
                    var m1 = lines[firstINFN].trim().match(/INFN-[A-Z0-9-]+\s*(.*)/);
                    if (m1 && m1[1].trim()) descLocal = m1[1].trim();
                }
                if (secondINFN !== -1) {
                    var m2 = lines[secondINFN].trim().match(/INFN-[A-Z0-9-]+\s*(.*)/);
                    if (m2 && m2[1].trim()) descLocalSup = m2[1].trim();
                    if (ordemLine !== -1 && ordemLine > secondINFN + 1) {
                        var cLines = [];
                        for (var ci = secondINFN + 1; ci < ordemLine; ci++) {
                            var cl = lines[ci].trim();
                            if (cl && !cl.match(/^N[ãa]o$/i) && !cl.match(/Caracter/i)) cLines.push(cl);
                        }
                        if (cLines.length > 0) caracteristicas = cLines.join(' ').trim();
                    }
                }
            }
            return { planoCod: planoMatch ? planoMatch[1] : '', local: local, equipe: eqMatch ? eqMatch[1] : 'S11MCR1', descLocal: descLocal, descLocalSup: descLocalSup, caracteristicas: caracteristicas };
        }

        function _extrairCriticidade(txt) {
            var cMatch = txt.match(/Criticidade\s*[\|\n\r]\s*([A-C])\b/);
            var tMatch = txt.match(/Tipo de Manutenção\s*[\|\n\r]+\s*([^\n\r|]+)/);
            return { criticidade: cMatch ? cMatch[1] : '', tipoManut: tMatch ? tMatch[1].trim() : '' };
        }

        function _extrairTag(txt, txtLines, tituloCurto) {
            var tag = '';
            if (!txtLines) return tag;
            var tagLines = txtLines.split('\n');
            for (var tg = 0; tg < Math.min(tagLines.length, 25); tg++) {
                var tgl = tagLines[tg].trim();
                var identMatch = tgl.match(/Identifica[çc][ãa]o\s+T[eé]cnica\s+(M\d{2,5})/i);
                if (identMatch) return identMatch[1];
                var mTag = tgl.match(/\b(M\s*\d{2,5})\b/);
                if (mTag && tgl.match(/Identifica/i)) return mTag[1].replace(/\s+/g, '');
            }
            var tituloTag = tituloCurto.match(/\b(M\d{2,5})\b/);
            if (tituloTag) return tituloTag[1];
            var txtTag = txt.match(/(?:TAG|Identifica)\s*[:\s]*\b(M\d{2,5})\b/i);
            if (txtTag) return txtTag[1];
            return tag;
        }

        function extrairDados(txt, txtLines) {
            var om = _extrairOM(txt);
            var tituloCurto = _extrairTitulo(txtLines);
            var descCompleta = _extrairDescricao(txt);
            var equipMatch = txt.match(/\b(1\d{7})\b/);
            var numEquip = equipMatch ? equipMatch[1] : '---';
            var centroCusto = _extrairCentroCusto(txt, txtLines, om, numEquip);
            var datas = _extrairDatas(txt);
            var badgesHTML = _extrairStatus(txt);
            var locEq = _extrairLocalEquipe(txt, txtLines);
            var crit = _extrairCriticidade(txt);
            var tagIdentificacao = _extrairTag(txt, txtLines, tituloCurto);
            return {
                om: om, numEquip: numEquip, centroCusto: centroCusto, descCompleta: descCompleta,
                tituloCurto: tituloCurto, planoCod: locEq.planoCod, inicio: datas.inicio, fim: datas.fim,
                local: locEq.local, equipe: locEq.equipe, badgesHTML: badgesHTML,
                descLocal: locEq.descLocal, descLocalSup: locEq.descLocalSup,
                caracteristicas: locEq.caracteristicas, criticidade: crit.criticidade,
                tipoManut: crit.tipoManut, tagIdentificacao: tagIdentificacao
            };
        }

        window.PCMExtrair = extrairDados;
        window.puxarOMsManual = puxarOMsManual;
        window.filtrarOMs = filtrarOMs;
        window.carregarOMs = carregarOMs;
        window.salvarOMs = salvarOMs;

        function filtrarOMs() {
            const lista = $('omList');
            lista.innerHTML = '';
            
            if(oms.length === 0) {
                lista.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📋</div>
                        <div class="empty-state-title">Nenhuma OM carregada</div>
                        <div class="empty-state-text">Clique no botão 📂 para carregar PDFs</div>
                    </div>`;
                return;
            }
            
            var frag = document.createDocumentFragment();
            oms.forEach((om, idx) => {
                let statusClass = 'pendente', statusText = 'DISPONÍVEL';
                let clickAction = () => showDetail(idx);
                var bloqueadaOutraEquipe = !!(om.lockDeviceId && om.lockDeviceId !== deviceId);
                
                if(bloqueadaOutraEquipe) {
                    if(om.statusAtual === 'em_deslocamento') {
                        statusClass = 'bloqueada';
                        statusText = '🚗 EM DESLOCAMENTO';
                    } else if(om.statusAtual === 'iniciada') {
                        statusClass = 'bloqueada';
                        statusText = '⚡ EM EXECUÇÃO' + (om.primeiroExecutante ? ' — ' + om.primeiroExecutante : '');
                    } else {
                        statusClass = 'bloqueada';
                        statusText = 'EM USO';
                    }
                    clickAction = () => alert('⚠️ OM em uso por outro operador!');
                } else if(om.lockDeviceId && om.lockDeviceId === deviceId) {
                    if(om.statusAtual === 'em_deslocamento') {
                        statusClass = 'em-deslocamento';
                        statusText = '🚗 EM DESLOCAMENTO';
                        clickAction = () => showDetail(idx);
                    } else if(om.statusAtual === 'iniciada') {
                        statusClass = 'em-execucao';
                        statusText = '⚡ EM EXECUÇÃO' + (om.primeiroExecutante ? ' — ' + om.primeiroExecutante : '');
                        clickAction = () => showDetail(idx);
                    }
                } else if(om.pendenteAssinatura) {
                    statusClass = 'pendente-assinatura';
                    statusText = 'PENDENTE ASSINATURA';
                    clickAction = () => handleClickPendenteAssinatura(idx);
                } else if(om.pausada) {
                    statusClass = 'pendente';
                    statusText = '🔄 TROCA DE TURNO — Aguardando equipe';
                    clickAction = () => showRetomar(idx);
                } else if(om.desvioApontado) {
                    statusClass = 'pendente';
                    var dvLabel = '';
                    if(om.desviosRegistrados && om.desviosRegistrados.length > 0) {
                        var lastDv = om.desviosRegistrados[om.desviosRegistrados.length - 1];
                        dvLabel = ' — ' + (lastDv.tipoCod || '') + ' ' + (lastDv.tipoLabel || '');
                    }
                    statusText = 'DESVIO' + dvLabel;
                    clickAction = () => showDetail(idx);
                } else if(om.finalizada) {
                    statusClass = 'finalizada';
                    statusText = 'EXECUTADA';
                    clickAction = () => verPDFGerado(om.num + (om.execTs ? '_' + om.execTs : ''));
                } else if(om.cancelada) {
                    if(om.pendenteAssinatura) {
                        statusClass = 'pendente-assinatura';
                        statusText = 'CANCELADA - PENDENTE ASSINATURA';
                        clickAction = () => handleClickPendenteAssinatura(idx);
                    } else {
                        statusClass = 'cancelada';
                        statusText = 'CANCELADA';
                        clickAction = () => verPDFGerado(om.num + (om.execTs ? '_' + om.execTs : ''));
                    }
                }
                
                const div = document.createElement('div');
                div.className = 'om-item' + (om.lockDeviceId && om.lockDeviceId !== deviceId ? ' bloqueada' : '');
                
                if(clickAction) {
                    div.onclick = clickAction;
                }
                
                var icone = om.pendenteAssinatura ? '✍️'
                    : om.cancelada ? '❌'
                    : om.finalizada ? '✅'
                    : om.desvioApontado ? '⚠️'
                    : om.emOficina ? '🔧'
                    : (om.statusAtual === 'em_deslocamento') ? '🚗'
                    : (om.statusAtual === 'iniciada') ? '⚡'
                    : bloqueadaOutraEquipe ? '🔒'
                    : '📄';
                
                var _escopoBadge = '';
                if(om.escopo && om.escopo !== 'geral') {
                    _escopoBadge = '<span style="display:inline-block;font-size:9px;font-weight:800;padding:1px 6px;border-radius:4px;margin-left:4px;background:#e3f2fd;color:#1565c0;vertical-align:middle;">' + (_escopoLabels[om.escopo] || _h(om.escopo)) + '</span>';
                }
                
                div.innerHTML = `
                    <div class="pdf-icon">${icone}</div>
                    <div class="om-info">
                        <h3>${_h(om.titulo)}${om.emOficina ? '<span class="oficina-tag">OFICINA</span>' : ''}${_escopoBadge}</h3>
                        <p>OM: ${_h(om.num)} | MCR | ${_h(om.inicio)}</p>
                        <div class="om-cc">CC: ${_h(om.cc)} | CT: ${_h(om.equipe)}</div>
                        <span class="status ${statusClass}">${statusText}</span>
                    </div>
                `;
                frag.appendChild(div);
            });
            lista.appendChild(frag);
        }

        async function showDetail(idx) {
            if (currentOM && (currentOM.statusAtual === 'em_deslocamento' || currentOM.statusAtual === 'iniciada') && currentOM.num !== oms[idx].num) {
                alert('⚠️ Você já tem a OM ' + currentOM.num + ' em andamento no aparelho!\nPor favor, finalize ou cancele a atual antes de iniciar outra.');
                return;
            }

            var alvoOM = oms[idx];
            if(!alvoOM) return;
            if(navigator.onLine) {
                var estadoServidor = await _obterEstadoServidorOM(alvoOM.num);
                if(estadoServidor && estadoServidor.lock_device_id && estadoServidor.lock_device_id !== deviceId && !estadoServidor.admin_unlock) {
                    alvoOM.lockDeviceId = estadoServidor.lock_device_id;
                    salvarOMs();
                    filtrarOMs();
                    alert('⚠️ OM em uso por outro operador!');
                    return;
                }
            }
            currentOM = alvoOM;
            
            if(currentOM.lockDeviceId && currentOM.lockDeviceId !== deviceId) {
                var rec = await _verificarAdminUnlockParaOM(currentOM.num);
                if(rec && rec.admin_unlock) {
                    currentOM.lockDeviceId = deviceId;
                    if(rec.historico_execucao && rec.historico_execucao.length > 0) currentOM.historicoExecucao = rec.historico_execucao;
                    if(rec.deslocamento_segundos) deslocamentoSegundos = rec.deslocamento_segundos;
                    if(rec.desloc_hora_inicio) currentOM._deslocHoraInicio = rec.desloc_hora_inicio;
                    if(rec.desloc_hora_fim) currentOM._deslocHoraFim = rec.desloc_hora_fim;
                    if(rec.materiais_usados) materiaisUsados = rec.materiais_usados;
                    salvarOMs();
                } else {
                    alert('⚠️ OM em uso por outro operador!');
                    return;
                }
            }
            if(!currentOM.lockDeviceId && navigator.onLine) {
                currentOM.lockDeviceId = deviceId;
                _pushOMStatusSupabase(currentOM);
            }
            
            omAssinada = false;
            atividadeJaIniciada = false;
            isCancelamento = false;
            
            $('detailTitulo').textContent = currentOM.titulo;
            $('detailOM').textContent = 'Nº OM: ' + currentOM.num;
            $('detailCC').textContent = currentOM.cc;
            $('detailEquipamento').textContent = currentOM.equipamento;
            $('detailLocal').textContent = currentOM.local;
            $('detailDescLocal').textContent = currentOM.descLocal || '-';
            $('detailDescLocalSup').textContent = currentOM.descLocalSup || '-';
            $('detailCaracteristicas').textContent = currentOM.caracteristicas || '---';
            $('detailStatus').textContent = currentOM.status;
            $('detailDesc').textContent = currentOM.descricao;
            
            $('checklistSection').style.display = 'none';
            $('checklistContent').innerHTML = '';
            $('checklistActions').style.display = 'none';
            _aplicarModoChecklistFoco(false);
            _aplicarModoOficinaMinimal(false);
            _materiaisListaExpandida = false;
            
            renderHistoricoExecucao();
            renderMateriaisUsados();
            
            $('detailScreen').classList.add('active');
            
            if (currentOM.statusAtual === 'em_deslocamento') {
                $('btnDeslocamento').style.display = 'none';
                $('btnIniciar').style.display = 'block';
                $('btnIniciar').disabled = false;
                $('btnCancelar').style.display = 'none';
                $('btnExcluir').style.display = 'none';
                $('timerDisplay').style.display = 'block';
                
                if(!deslocamentoInicio && currentOM._deslocHoraInicio) {
                    deslocamentoInicio = new Date(currentOM._deslocHoraInicio);
                }
                
                var infoDiv = $('timerDateInfo');
                if(infoDiv && deslocamentoInicio) {
                    infoDiv.style.display = 'block'; 
                    infoDiv.textContent = '🚗 Início: ' + deslocamentoInicio.toLocaleDateString('pt-BR') + ' ' + deslocamentoInicio.toLocaleTimeString('pt-BR'); 
                }
                
                if(timerInterval) clearInterval(timerInterval);
                timerInterval = setInterval(() => {
                    const diff = Math.floor((new Date() - deslocamentoInicio) / 1000);
                    const m = Math.floor(diff / 60);
                    const s = diff % 60;
                    $('timerDisplay').textContent = 
                        String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
                    deslocamentoSegundos = diff;
                    deslocamentoMinutos = m;
                    $('hhDeslocamento').textContent = (diff < 60 ? (diff + ' s') : (m + ' min'));
                }, 1000);
                
            } else if(currentOM.historicoExecucao && currentOM.historicoExecucao.length > 0) {
                const ultimoHistorico = currentOM.historicoExecucao[currentOM.historicoExecucao.length - 1];
                if(!ultimoHistorico.dataFim) {
                    retomarDoEstadoSalvo(ultimoHistorico);
                } else {
                    resetTimers();
                }
            } else {
                resetTimers();
            }
            
            if(currentOM.emOficina) {
                _aplicarModoOficinaMinimal(true);
                if(currentOM.checklistFotos) checklistFotos = currentOM.checklistFotos;
                $('btnDeslocamento').style.display = 'none';
                $('btnIniciar').style.display = 'block';
                $('btnIniciar').disabled = false;
                $('btnCancelar').style.display = 'none';
                $('btnExcluir').style.display = 'none';
                if(currentOM.planoCod || currentOM.checklistCorretiva) {
                    _mostrarChecklistUI(true);
                }
            }

            if(currentOM.desvioApontado) {
                $('btnCancelarDesvio').style.display = 'block';
            }
        }

        function classificarHoras(horaInicioISO, horaFimISO) {
            if(!horaInicioISO || !horaFimISO) return { normal: 0, extra: 0, noturno: 0 };
            var ini = new Date(horaInicioISO);
            var fim = new Date(horaFimISO);
            if(fim <= ini) return { normal: 0, extra: 0, noturno: 0 };

            var INTERVALOS = [
                [0,    360,  'noturno'],
                [360,  440,  'extra'],
                [440,  1040, 'normal'],
                [1040, 1080, 'extra'],
                [1080, 1440, 'noturno']
            ];

            var normalMin = 0, extraMin = 0, noturnoMin = 0;
            var cursor = new Date(ini);

            while(cursor < fim) {
                var meiaNoite = new Date(cursor);
                meiaNoite.setHours(24, 0, 0, 0);
                var fimSegmento = new Date(Math.min(fim.getTime(), meiaNoite.getTime()));

                var inicioDia = new Date(cursor);
                inicioDia.setHours(0, 0, 0, 0);
                var inicioMin = (cursor - inicioDia) / 60000;
                var fimMin    = (fimSegmento - inicioDia) / 60000;

                INTERVALOS.forEach(function(iv) {
                    var sobreposicao = Math.max(0, Math.min(fimMin, iv[1]) - Math.max(inicioMin, iv[0]));
                    if(iv[2] === 'normal')  normalMin  += sobreposicao;
                    else if(iv[2] === 'extra')   extraMin   += sobreposicao;
                    else                         noturnoMin += sobreposicao;
                });

                cursor = meiaNoite;
            }

            return {
                normal:  +(normalMin  / 60).toFixed(2),
                extra:   +(extraMin   / 60).toFixed(2),
                noturno: +(noturnoMin / 60).toFixed(2)
            };
        }

        function renderHistoricoExecucao() {
            const historicoList = $('historicoList');
            if(!currentOM || !currentOM.emOficina) {
                $('historicoSection').style.display = 'none';
                historicoList.innerHTML = '';
                return;
            }
            $('historicoSection').style.display = 'block';
            var histArr = Array.isArray(currentOM.historicoExecucao) ? currentOM.historicoExecucao : [];
            var execSet = {};
            for(var i = 0; i < histArr.length; i++) {
                var execs = Array.isArray(histArr[i].executantes) ? histArr[i].executantes : [];
                for(var j = 0; j < execs.length; j++) if(execs[j]) execSet[execs[j]] = true;
            }
            var execNames = Object.keys(execSet);
            var dataOf = currentOM.dataEnvioOficina || null;
            if(!dataOf) {
                for(var k = histArr.length - 1; k >= 0; k--) {
                    if(histArr[k] && histArr[k].tag === 'OFICINA') { dataOf = histArr[k].dataFim || histArr[k].dataInicio || null; break; }
                }
            }
            var dataTxt = dataOf ? new Date(dataOf).toLocaleString('pt-BR') : '--';
            var htmlMin = '<div class="historico-dia oficina-min-resumo">';
            htmlMin += '<div style="font-weight:800;color:#1A5276;">📅 Enviada para oficina: ' + dataTxt + '</div>';
            htmlMin += '<div style="margin-top:6px;font-size:13px;color:#234;">👷 Executantes: ' + (execNames.length ? execNames.join(', ') : '---') + '</div>';
            htmlMin += '</div>';
            historicoList.innerHTML = htmlMin;
        }

        function renderMateriaisUsados() {
            const materialList = $('materialList');
            const materiaisSection = $('materiaisSection');
            
            if(materiaisUsados.length === 0) {
                _materiaisListaExpandida = false;
                materiaisSection.style.display = 'none';
                materiaisSection.classList.remove('toggle-btn');
                materiaisSection.onclick = null;
                materialList.style.display = 'none';
                materialList.innerHTML = '';
                return;
            }
            
            materiaisSection.style.display = 'block';
            materiaisSection.classList.add('toggle-btn');
            materiaisSection.onclick = toggleMateriaisLista;
            materiaisSection.textContent = _materiaisListaExpandida ? '💰 Materiais Utilizados ▲' : '💰 Materiais Utilizados ▼';
            materialList.style.display = _materiaisListaExpandida ? 'block' : 'none';
            var itensHtml = '';
            materiaisUsados.forEach(function(m) {
                itensHtml += `
                    <div class="material-item">
                        <div class="material-header">
                            <span class="material-name">[${m.codigo}] ${sc(m.nome)}</span>
                            <span class="material-price">R$ ${m.total.toFixed(2)}</span>
                        </div>
                        <div style="font-size:13px;color:#666;">
                            ${m.qtd} ${m.unidade} × R$ ${m.precoUnit.toFixed(2)}
                        </div>
                    </div>
                `;
            });
            materialList.innerHTML = itensHtml;
        }

        function toggleMateriaisLista() {
            if(!materiaisUsados || materiaisUsados.length === 0) return;
            _materiaisListaExpandida = !_materiaisListaExpandida;
            renderMateriaisUsados();
        }

        function retomarDoEstadoSalvo(historico) {
            executantesNomes = Array.isArray(historico.executantes) ? historico.executantes.slice() : [];
            numExecutantes = executantesNomes.length;
            atividadeInicio = new Date(historico.dataInicio);
            deslocamentoMinutos = historico.deslocamentoMinutos || 0;
            deslocamentoSegundos = (historico.deslocamentoSegundos !== undefined) ? historico.deslocamentoSegundos : (deslocamentoMinutos * 60);
            tempoPausadoTotal = historico.tempoPausadoTotal || 0;
            atividadeJaIniciada = true;
            
            if(historico.materiaisUsados) materiaisUsados = historico.materiaisUsados;
            
            _uiAtividade();
            $('hhDeslocamento').textContent = (deslocamentoSegundos < 60 ? (deslocamentoSegundos + ' s') : (deslocamentoMinutos + ' min'));

            iniciarCronometroAtividade();
        }

        function resetTimers() {
            if(timerInterval) clearInterval(timerInterval);
            if(timerAtividadeInterval) clearInterval(timerAtividadeInterval);
            
            deslocamentoInicio = null;
            atividadeInicio = null;
            deslocamentoMinutos = 0;
            tempoPausadoTotal = 0;
            pausaInicio = null;
            materiaisUsados = [];
            _materiaisListaExpandida = false;
            atividadeJaIniciada = false;
            
            $('timerDisplay').style.display = 'none';
            $('timerAtividade').style.display = 'none';
            var tdi = $('timerDateInfo'); if(tdi) tdi.style.display = 'none';
            var tai = $('timerAtivDateInfo'); if(tai) tai.style.display = 'none';
            $('materiaisSection').style.display = 'none';
            $('materialList').style.display = 'none';
            $('hhAtividade').textContent = '0.00h';
            $('hhDeslocamento').textContent = '0 min';
            $('hhTotal').textContent = '0.00h';
            
            _setBtns({
                btnDeslocamento:1, btnIniciar:0, btnGroupAtividade:0,
                btnChecklist:0, btnRowExecOficina:0, btnFinalizar:0,
                btnDevolverEquip:0, btnCancelar:0, btnCancelarDesvio:0, btnExcluir:1
            });
            checklistFotos = {};
        }

        function hideDetail() {
            $('detailScreen').classList.remove('active');
            _aplicarModoChecklistFoco(false);
            _aplicarModoOficinaMinimal(false);
            salvarOMAtual();
            salvarOMs();
            filtrarOMs();
        }

        function excluirOM() {
            if(!currentOM) return;
            if(!confirm('🗑️ EXCLUIR OM ' + currentOM.num + '?\n\nTodos os dados desta OM serão removidos.\nEsta ação não pode ser desfeita.')) return;
            var omNum = currentOM.num;
            var idx = oms.findIndex(function(o){ return o.num === omNum; });
            if(idx >= 0) oms.splice(idx, 1);
            var pdfsOriginais_del = ['orig_','rel_','ck_','nc_'];
            pdfsOriginais_del.forEach(function(p){ PdfDB.del(p + omNum); });
            var savedCurrent = localStorage.getItem(STORAGE_KEY_CURRENT);
            if(savedCurrent) {
                try {
                    var est = JSON.parse(savedCurrent);
                    if(est.omNum === omNum) localStorage.removeItem(STORAGE_KEY_CURRENT);
                } catch(e) {}
            }
            currentOM = null;
            if(timerInterval) clearInterval(timerInterval);
            if(timerAtividadeInterval) clearInterval(timerAtividadeInterval);
            salvarOMs();
            $('detailScreen').classList.remove('active');
            _aplicarModoChecklistFoco(false);
            _aplicarModoOficinaMinimal(false);
            filtrarOMs();
            alert('✅ OM ' + omNum + ' excluída.');
        }

        function iniciarDeslocamento() {
            currentOM.lockDeviceId = deviceId;
            currentOM.statusAtual = 'em_deslocamento';
            $('checklistSection').style.display = 'none';
            $('checklistContent').style.display = 'none';
            $('checklistActions').style.display = 'none';
            _aplicarModoChecklistFoco(false);
            _aplicarModoOficinaMinimal(false);
            salvarOMs();
            filtrarOMs();
            
            deslocamentoInicio = new Date();
            currentOM._deslocHoraInicio = deslocamentoInicio.toISOString();
            
            $('btnDeslocamento').style.display = 'none';
            $('btnIniciar').style.display = 'block';
            $('btnIniciar').disabled = false;
            $('btnCancelar').style.display = 'none';
            $('btnExcluir').style.display = 'none';
            $('btnCancelarDesvio').style.display = 'none';
            if(currentOM.desvioApontado) currentOM.desvioApontado = false;
            $('timerDisplay').style.display = 'block';
            var infoDiv = $('timerDateInfo');
            if(infoDiv) { infoDiv.style.display = 'block'; infoDiv.textContent = '🚗 Início: ' + deslocamentoInicio.toLocaleDateString('pt-BR') + ' ' + deslocamentoInicio.toLocaleTimeString('pt-BR'); }
            
            timerInterval = setInterval(() => {
                const diff = Math.floor((new Date() - deslocamentoInicio) / 1000);
                const m = Math.floor(diff / 60);
                const s = diff % 60;
                $('timerDisplay').textContent = 
                    String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
                deslocamentoSegundos = diff;
                deslocamentoMinutos = m;
                $('hhDeslocamento').textContent = (diff < 60 ? (diff + ' s') : (m + ' min'));
            }, 1000);
            salvarOMAtual();
            _pushOMStatusSupabase(currentOM);
        }

        function showExecutantes() {
            if(currentOM && currentOM.emOficina) {
                deslocamentoSegundos = 0;
                deslocamentoMinutos = 0;
                currentOM._deslocHoraInicio = null;
                currentOM._deslocHoraFim = null;
            } else {
                if(timerInterval) clearInterval(timerInterval);
                deslocamentoSegundos = Math.floor((new Date() - deslocamentoInicio) / 1000);
                deslocamentoMinutos = Math.floor(deslocamentoSegundos / 60);
                currentOM._deslocHoraFim = new Date().toISOString();
            }
            $('timerDisplay').style.display = 'none';
            
            const list = $('executantesList');
            list.innerHTML = `
                <input type="text" placeholder="Nome completo do executante" class="exec-input">
                <input type="text" placeholder="Nome completo do executante" class="exec-input">
            `;
            
            $('popupExecutantes').classList.add('active');
        }

        function hideExecutantes() {
            $('popupExecutantes').classList.remove('active');
        }

        function addExecutante() {
            const list = $('executantesList');
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'Nome completo do executante';
            input.className = 'exec-input';
            list.appendChild(input);
        }

        function salvarExecutantes() {
            const inputs = document.querySelectorAll('.exec-input');
            numExecutantes = 0;
            executantesNomes = [];
            
            inputs.forEach(input => {
                if(input.value.trim()) {
                    numExecutantes++;
                    executantesNomes.push(input.value.trim());
                }
            });
            
            if(numExecutantes === 0) {
                alert('⚠️ Adicione pelo menos 1 executante!');
                return;
            }
            
            atividadeInicio = new Date();
            tempoPausadoTotal = 0;
            atividadeJaIniciada = true;
            
            if(currentOM.emOficina) {
                currentOM.emOficina = false;
                currentOM.retornouOficina = true;
                deslocamentoMinutos = 0;
            }
            
            if(!currentOM.historicoExecucao) currentOM.historicoExecucao = [];
            
            var ultimoHist = currentOM.historicoExecucao.length > 0 ? currentOM.historicoExecucao[currentOM.historicoExecucao.length - 1] : null;
            if(ultimoHist && !ultimoHist.dataFim) {
                ultimoHist.executantes = [...executantesNomes];
                ultimoHist.deslocamentoMinutos = deslocamentoMinutos;
                ultimoHist.deslocamentoSegundos = deslocamentoSegundos;
                ultimoHist.deslocamentoHoraInicio = currentOM._deslocHoraInicio || ultimoHist.deslocamentoHoraInicio || null;
                ultimoHist.deslocamentoHoraFim = currentOM._deslocHoraFim || ultimoHist.deslocamentoHoraFim || null;
            } else {
                currentOM.historicoExecucao.push({
                    data: new Date().toLocaleDateString('pt-BR'),
                    executantes: [...executantesNomes],
                    dataInicio: atividadeInicio.toISOString(),
                    deslocamentoMinutos: deslocamentoMinutos,
                    deslocamentoSegundos: deslocamentoSegundos,
                    deslocamentoHoraInicio: currentOM._deslocHoraInicio || null,
                    deslocamentoHoraFim: currentOM._deslocHoraFim || null,
                    tempoPausadoTotal: 0,
                    materiaisUsados: []
                });
            }
            
            _uiAtividade();

            iniciarCronometroAtividade();
            renderHistoricoExecucao();
            hideExecutantes();
            currentOM.statusAtual = 'iniciada';
            currentOM.primeiroExecutante = executantesNomes[0] || '';
            salvarOMAtual();
            _pushOMStatusSupabase(currentOM);
            
            alert(`✅ Atividade iniciada!\n${numExecutantes} executante(s)`);
        }

        function editarExecutantes() {
            if(omAssinada) {
                alert('⚠️ OM já assinada! Não é possível editar.');
                return;
            }
            
            const list = $('executantesList');
            list.innerHTML = '';
            
            executantesNomes.forEach(nome => {
                const input = document.createElement('input');
                input.type = 'text';
                input.value = nome;
                input.className = 'exec-input';
                list.appendChild(input);
            });
            
            $('popupExecutantes').classList.add('active');
        }

        function iniciarCronometroAtividade() {
            var ativInfoDiv = $('timerAtivDateInfo');
            if(ativInfoDiv) {
                ativInfoDiv.style.display = 'block';
                ativInfoDiv.textContent = '⏱️ Início: ' + atividadeInicio.toLocaleDateString('pt-BR') + ' ' + atividadeInicio.toLocaleTimeString('pt-BR');
            }
            var deslocInfoDiv = $('timerDateInfo');
            if(deslocInfoDiv && currentOM._deslocHoraInicio) {
                deslocInfoDiv.style.display = 'block';
                var di = new Date(currentOM._deslocHoraInicio);
                var df = currentOM._deslocHoraFim ? new Date(currentOM._deslocHoraFim) : null;
                deslocInfoDiv.textContent = '🚗 ' + di.toLocaleTimeString('pt-BR') + (df ? ' → ' + df.toLocaleTimeString('pt-BR') : '');
            }
            timerAtividadeInterval = setInterval(() => {
                const diff = Math.floor((new Date() - atividadeInicio) / 1000) - tempoPausadoTotal;
                const h = Math.floor(diff / 3600);
                const m = Math.floor((diff % 3600) / 60);
                const s = diff % 60;
                
                $('timerAtividade').textContent = 
                    '⏱️ ' + String(h).padStart(2, '0') + ':' + 
                    String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
                
                const atividadeHoras = (diff / 3600).toFixed(2);
                $('hhAtividade').textContent = atividadeHoras + 'h × ' + numExecutantes + ' = ' + (atividadeHoras * numExecutantes).toFixed(2) + 'h';
                
                const hhEquipe = (atividadeHoras * numExecutantes).toFixed(2);
                const hhDeslocRaw = deslocamentoSegundos / 3600;
                const hhDeslocEquipe = (hhDeslocRaw * numExecutantes).toFixed(2);
                const hhTotal = (parseFloat(hhEquipe) + parseFloat(hhDeslocEquipe)).toFixed(2);
                
                $('hhDeslocamento').textContent = 
                    (deslocamentoSegundos < 60 ? (deslocamentoSegundos + ' s') : (deslocamentoMinutos + ' min')) +
                    ' × ' + numExecutantes + ' = ' + hhDeslocEquipe + 'h';
                $('hhTotal').textContent = hhTotal + 'h';
            }, 1000);
        }

        function showPausarMenu() {
            showMenuDesvios();
        }

        function toggleChecklistCorretiva() {
            if(currentOM.planoCod) return;
            if(currentOM.checklistCorretiva) return;
            if(!confirm('⚠️ Habilitar checklist nesta OM corretiva?\n\nApós habilitar, o checklist ficará disponível e não poderá ser desativado.')) return;
            currentOM.checklistCorretiva = true;
            $('btnChecklist').style.display = 'none';
            $('btnOficina').style.display = 'block';
            _mostrarChecklistUI(true);
            salvarOMAtual();
        }

        var _desvioFotoBase64 = null;
        var _desativarFotoBase64 = null;
        var _omNumCancelDesvio = null;
        var _desvioTipoAtual = null;

        var DESVIO_TIPOS = {
            '3.1': { cod: '3.1', label: 'Local Fechado', icon: '🔒' },
            '3.2': { cod: '3.2', label: 'Local Obstruído por Móvel', icon: '🪑' },
            '3.3': { cod: '3.3', label: 'Sala em Reforma', icon: '🔨' },
            '3.4': { cod: '3.4', label: 'Sala utilizada para Reunião ou Treinamento', icon: '👥' },
            '3.5': { cod: '3.5', label: 'Sem Acesso à Área', icon: '🚫' }
        };

        function showMenuDesvios() {
            var emOficina = !!(currentOM && currentOM.emOficina);
            var itensRestritos = document.querySelectorAll('#popupMenuDesvios .btn-desvio-oficina-restrito');
            for(var i = 0; i < itensRestritos.length; i++) {
                itensRestritos[i].style.display = emOficina ? 'none' : 'block';
            }
            $('popupMenuDesvios').classList.add('active');
        }
        function hideMenuDesvios() { $('popupMenuDesvios').classList.remove('active'); }
        function selecionarDesvio(tipo) {
            hideMenuDesvios();
            if(DESVIO_TIPOS[tipo]) { showDesvioGenerico(tipo); return; }
            if(tipo === '0018') { confirmarTrocaTurno(); return; }
            if(tipo === 'reprogramar') { executarReprogramar(); return; }
            if(tipo === 'desativar') { showDesvioDesativar(); return; }
        }

        function _salvarHistoricoAtual(tag) {
            if(timerAtividadeInterval) clearInterval(timerAtividadeInterval);
            if(currentOM.historicoExecucao && currentOM.historicoExecucao.length > 0) {
                var h = currentOM.historicoExecucao[currentOM.historicoExecucao.length - 1];
                if(h.dataInicio && !h.dataFim) {
                    var diff = Math.floor((new Date() - new Date(h.dataInicio)) / 1000) - tempoPausadoTotal;
                    h.dataFim = new Date().toISOString();
                    h.hhAtividade = diff / 3600;
                    h.hhDeslocamento = (h.deslocamentoSegundos || 0) / 3600;
                    _calcHH(h);
                    h.tempoPausadoTotal = tempoPausadoTotal;
                    h.materiaisUsados = [...materiaisUsados];
                    h.tag = tag;
                }
            }
        }
        function _salvarDesvioLocal(rec) {
            var d = JSON.parse(localStorage.getItem(STORAGE_KEY_DESVIOS) || '[]');
            d.push(rec);
            localStorage.setItem(STORAGE_KEY_DESVIOS, JSON.stringify(d));
        }

        function _gravarDashboardLog(tipo, om) {
            var log = JSON.parse(localStorage.getItem(STORAGE_KEY_DASHBOARD) || '[]');
            var tag = om.tagIdentificacao || om.equipamento || '---';
            var periodo = om.inicio || '';
            var fimPeriodo = om.fim || '';
            var noPrazo = false;
            if(tipo === 'ATENDIDO' && fimPeriodo) {
                try { noPrazo = new Date() <= new Date(fimPeriodo.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1')); } catch(e){}
            }
            var entry = {
                omNum: om.num,
                tagEquipamento: tag,
                titulo: om.titulo || '',
                equipe: om.equipe || '',
                cc: om.cc || '',
                local: om.local || '',
                descLocal: om.descLocal || '',
                tipoManut: om.tipoManut || '',
                planoCod: om.planoCod || '',
                periodoInicio: periodo,
                periodoFim: fimPeriodo,
                data: new Date().toISOString(),
                mesRef: new Date().toISOString().substring(0, 7),
                tipo: tipo,
                programado: true,
                atendido: tipo === 'ATENDIDO',
                noPrazo: noPrazo,
                comAtraso: tipo === 'ATENDIDO' && !noPrazo,
                cancelado: tipo === 'CANCELADO',
                desativado: tipo === 'DESATIVADO',
                desvioApontado: tipo === 'DESVIO',
                importado: tipo === 'PROGRAMADO',
                desvioMotivo: tipo === 'DESVIO' ? (om.desviosRegistrados && om.desviosRegistrados.length > 0 ? om.desviosRegistrados[om.desviosRegistrados.length-1].tipo : '') : '',
                nomeFiscal: om.nomeFiscal || '',
                tipoChecklist: om.tipoChecklist || '',
                totalHH: 0,
                materiaisTotal: 0
            };
            if(om.historicoExecucao) {
                for(var i=0;i<om.historicoExecucao.length;i++) entry.totalHH += (om.historicoExecucao[i].hhTotal || 0);
            }
            if(om.materiaisUsados) {
                for(var i=0;i<om.materiaisUsados.length;i++) entry.materiaisTotal += (om.materiaisUsados[i].total || 0);
            }
            log.push(entry);
            localStorage.setItem(STORAGE_KEY_DASHBOARD, JSON.stringify(log));
        }

        function _removerDesvioAcumulado(omNum) {
            var acum = JSON.parse(localStorage.getItem(STORAGE_KEY_DESVIOS_ACUM) || '[]');
            acum = acum.filter(function(d) { return d.omNum !== omNum; });
            localStorage.setItem(STORAGE_KEY_DESVIOS_ACUM, JSON.stringify(acum));
        }

        function _acumularDadosExcel(om) {
            var matList = JSON.parse(localStorage.getItem('pcm_excel_materiais') || '[]');
            var mats = om.materiaisUsados || [];
            var tag = om.tagIdentificacao || om.equipamento || '---';
            for(var i=0; i<mats.length; i++) {
                matList.push({
                    omNum: om.num, tagEquipamento: tag, titulo: om.titulo || '',
                    tipoSolicitacao: configTipoSolicitacao,
                    cc: mats[i].cc || om.cc || '',
                    ct2: mats[i].tipo || 'Pricelist',
                    codigo: mats[i].codigo || '', descricao: mats[i].nome || '',
                    unidade: mats[i].unidade || '', qtd: mats[i].qtd || 0,
                    vlUnit: mats[i].precoUnit || 0,
                    bdiPercentual: mats[i].bdiPercentual || 0,
                    bdiValor: mats[i].bdiValor || 0,
                    vlTotal: mats[i].total || 0,
                    bmNumero: configBM.numero || '',
                    bmDataInicio: configBM.dataInicio || '',
                    bmDataFim: configBM.dataFim || '',
                    data: new Date().toISOString(), mesRef: new Date().toISOString().substring(0,7)
                });
            }
            localStorage.setItem('pcm_excel_materiais', JSON.stringify(matList));

            var iw44 = JSON.parse(localStorage.getItem('pcm_excel_iw44') || '[]');
            var hist = om.historicoExecucao || [];
            for(var h=0; h<hist.length; h++) {
                var hx = hist[h];
                var execs = hx.executantes || [];
                for(var e=0; e<execs.length; e++) {
                    iw44.push({
                        omNum: om.num, tagEquipamento: tag, titulo: om.titulo || '',
                        cc: om.cc || '', equipe: om.equipe || '',
                        executante: execs[e],
                        nomeFiscal: om.nomeFiscal || '',
                        dataInicio: hx.dataInicio ? new Date(hx.dataInicio).toLocaleDateString('pt-BR') : '',
                        horaInicio: hx.dataInicio ? new Date(hx.dataInicio).toLocaleTimeString('pt-BR') : '',
                        dataFim: hx.dataFim ? new Date(hx.dataFim).toLocaleDateString('pt-BR') : '',
                        horaFim: hx.dataFim ? new Date(hx.dataFim).toLocaleTimeString('pt-BR') : '',
                        hhDeslocamento: (hx.hhDeslocamento || 0).toFixed(4),
                        hhAtividade: (hx.hhAtividade || 0).toFixed(4),
                        hhTotal: (hx.hhTotal || 0).toFixed(4),
                        desvio: hx.desvio ? 'SIM' : '',
                        tipoChecklist: om.tipoChecklist || '',
                        data: new Date().toISOString(), mesRef: new Date().toISOString().substring(0,7)
                    });
                }
            }
            localStorage.setItem('pcm_excel_iw44', JSON.stringify(iw44));
        }
        function _encerrarOMDesvio() {
            var idx = oms.findIndex(function(o){ return o.num === currentOM.num; });
            if(idx >= 0) oms.splice(idx, 1);
            localStorage.removeItem(STORAGE_KEY_CURRENT);
            salvarOMs();
            hideDetail();
            filtrarOMs();
        }

        function _calcTempoDesvio() {
            var seg = 0;
            if(currentOM.historicoExecucao && currentOM.historicoExecucao.length > 0) {
                var h = currentOM.historicoExecucao[currentOM.historicoExecucao.length - 1];
                if(h.dataInicio) {
                    seg = Math.floor((new Date() - new Date(h.dataInicio)) / 1000) - tempoPausadoTotal;
                    seg += (h.deslocamentoSegundos || deslocamentoSegundos || 0);
                }
            }
            return seg > 0 ? seg : 0;
        }

        function showDesvioGenerico(tipo) {
            _desvioTipoAtual = tipo;
            _desvioFotoBase64 = null;
            var info = DESVIO_TIPOS[tipo];
            $('desvioTituloPopup').textContent = info.icon + ' ' + info.cod + ' — ' + info.label;
            var tagEquip = currentOM.tagIdentificacao || currentOM.equipamento || '---';
            var localTxt = currentOM.local || '---';
            var descTxt = currentOM.descLocal || '';
            $('desvioTagInfo').innerHTML =
                '<div><strong>OM:</strong> ' + currentOM.num + '</div>' +
                '<div><strong>TAG:</strong> ' + tagEquip + '</div>' +
                '<div><strong>Local:</strong> ' + localTxt + (descTxt ? ' — ' + descTxt : '') + '</div>';
            $('d3Obs').value = '';
            $('d3FotoPreview').style.display = 'none';
            $('d3FotoPreview').src = '';
            $('d3FotoBtn').textContent = '📷 Tirar Foto (obrigatório)';
            $('d3FotoBtn').style.background = '#e53935';
            $('btnConfirmarDesvio').textContent = '✅ Confirmar Desvio ' + info.cod;
            $('popupDesvioD3').classList.add('active');
        }
        function hideDesvioLocalFechado() { $('popupDesvioD3').classList.remove('active'); _desvioTipoAtual = null; }
        function d3CapturarFoto() { $('inputFotoDesvioD3').click(); }
        function d3HandleFoto(event) {
            var file = event.target.files[0]; if(!file) return;
            var reader = new FileReader();
            reader.onload = function(e) {
                comprimirImagem(e.target.result, function(comp) {
                    _desvioFotoBase64 = comp;
                    $('d3FotoPreview').src = comp;
                    $('d3FotoPreview').style.display = 'block';
                    $('d3FotoBtn').textContent = '✔ Foto capturada';
                    $('d3FotoBtn').style.background = '#388e3c';
                });
            };
            reader.readAsDataURL(file); event.target.value = '';
        }
        function _enviarDesvioSupabase(payload) {
            var _tok = (window.PCMAuth && window.PCMAuth.getToken()) || SUPABASE_ANON_KEY;
            fetch(SUPABASE_URL + '/rest/v1/desvios', {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': 'Bearer ' + _tok,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(payload)
            }).then(function(resp) {
                if (!resp.ok) throw new Error('HTTP ' + resp.status);
            }).catch(function(e) {
                console.warn('[DESVIO] Falha ao enviar, enfileirando:', e.message);
                if (window.PCMOffline && typeof window.PCMOffline.enqueue === 'function') {
                    window.PCMOffline.enqueue('desvio_registrado', payload);
                }
            });
        }

        function confirmarDesvioD3() {
            if(!_desvioTipoAtual || !DESVIO_TIPOS[_desvioTipoAtual]) { alert('⚠️ Tipo de desvio inválido.'); return; }
            if(!_desvioFotoBase64) { alert('⚠️ A foto é obrigatória.'); return; }
            var tagEquip = currentOM.tagIdentificacao || currentOM.equipamento || '---';
            var obs = $('d3Obs').value.trim();
            var info = DESVIO_TIPOS[_desvioTipoAtual];

            if(timerAtividadeInterval) clearInterval(timerAtividadeInterval);
            if(currentOM.historicoExecucao && currentOM.historicoExecucao.length > 0) {
                var hLast = currentOM.historicoExecucao[currentOM.historicoExecucao.length - 1];
                if(hLast.dataInicio && !hLast.dataFim) hLast.dataFim = new Date().toISOString();
                hLast.deslocamentoSegundos = 0;
                hLast.hhDeslocamento = 0;
                hLast.hhAtividade = 0;
                hLast.hhEquipe = 0;
                hLast.hhTotal = 0;
                hLast.tempoPausadoTotal = 0;
                hLast.tag = info.cod + ' - ' + info.label;
                hLast.desvio = true;
            }
            var tempoTotalDesvio = 0;

            var rec = {
                omNum: currentOM.num, omTitulo: currentOM.titulo,
                tipo: info.cod + ' - ' + info.label,
                tipoCod: info.cod, tipoLabel: info.label,
                tagEquipamento: tagEquip,
                localInstalacao: currentOM.local || '',
                descLocal: currentOM.descLocal || '',
                observacao: obs, foto: _desvioFotoBase64,
                data: new Date().toISOString(),
                executantes: executantesNomes.slice(),
                tempoSegundos: tempoTotalDesvio,
                mesRef: new Date().toISOString().substring(0, 7)
            };

            _salvarDesvioLocal(rec);
            if(!currentOM.desviosRegistrados) currentOM.desviosRegistrados = [];
            currentOM.desviosRegistrados.push(rec);
            _gerarPDFDesvio(rec, info.cod + ' - ' + info.label.toUpperCase());

            var acum = JSON.parse(localStorage.getItem(STORAGE_KEY_DESVIOS_ACUM) || '[]');
            acum.push(rec);
            localStorage.setItem(STORAGE_KEY_DESVIOS_ACUM, JSON.stringify(acum));

            _enviarDesvioSupabase({
                om_num: rec.omNum,
                om_titulo: rec.omTitulo || '',
                tipo: rec.tipo,
                tipo_cod: rec.tipoCod,
                tipo_label: rec.tipoLabel,
                tag_equipamento: rec.tagEquipamento || '',
                local_instalacao: rec.localInstalacao || '',
                desc_local: rec.descLocal || '',
                observacao: rec.observacao || '',
                executantes: rec.executantes || [],
                cc: currentOM.cc || '',
                equipe: currentOM.equipe || '',
                data: rec.data,
                mes_ref: rec.mesRef,
                tem_foto: !!rec.foto,
                tempo_segundos: rec.tempoSegundos || 0,
                registrado_por: deviceId || '',
                origem: 'campo'
            });

            _gravarDashboardLog('DESVIO', currentOM);

            currentOM.desvioApontado = true;
            currentOM.statusAtual = null;
            currentOM.lockDeviceId = null;
            deslocamentoSegundos = 0;
            atividadeSegundos = 0;
            tempoPausadoTotal = 0;
            executantesNomes = [];
            materiaisUsados = [];
            atividadeJaIniciada = false;
            localStorage.removeItem(STORAGE_KEY_CURRENT);
            salvarOMs();
            _pushOMStatusSupabase(currentOM);

            hideDesvioLocalFechado();
            alert('⚠️ Desvio ' + info.cod + ' registrado.\n\nTAG: ' + tagEquip + '\nTempo: ' + _formatarTempo(tempoTotalDesvio) + '\n\nOM disponível para nova tentativa.');
            hideDetail();
            filtrarOMs();
        }

        function cancelarComDesvio() {
            if(!currentOM || !currentOM.desvioApontado) return;
            var lastDv = (currentOM.desviosRegistrados && currentOM.desviosRegistrados.length > 0) ? currentOM.desviosRegistrados[currentOM.desviosRegistrados.length - 1] : null;
            var dvInfo = lastDv ? (lastDv.tipoCod || '') + ' — ' + (lastDv.tipoLabel || '') : 'Desvio registrado';
            var escolha = confirm('❌ CANCELAR OM COM DESVIO\n\nDesvio: ' + dvInfo + '\n\nDeseja solicitar assinatura do fiscal?\n\n[OK] = Com assinatura fiscal\n[Cancelar] = Sem assinatura (pendente)');
            
            currentOM.cancelada = true;
            currentOM.desvio = dvInfo;
            currentOM.dataCancelamento = new Date().toLocaleString('pt-BR');
            currentOM.dataFinalizacao = new Date().toISOString();
            currentOM.lockDeviceId = null;
            currentOM.desvioApontado = false;
            currentOM.execTs = Date.now();
            currentOM.materiaisUsados = materiaisUsados.length > 0 ? [...materiaisUsados] : currentOM.materiaisUsados || [];
            isCancelamento = true;
            localStorage.removeItem(STORAGE_KEY_CURRENT);

            if(escolha) {
                currentOM.pendenteAssinatura = true;
                salvarOMs();
                _pushOMStatusSupabase(currentOM);
                _gravarDashboardLog('CANCELADO_DESVIO', currentOM);
                alert('❌ OM CANCELADA\n\nDesvio: ' + dvInfo + '\n\nAguardando assinatura do fiscal.');
                hideDetail();
                filtrarOMs();
            } else {
                currentOM.pendenteAssinatura = false;
                gerarEArmazenarPDF();
                salvarOMs();
                _pushOMStatusSupabase(currentOM);
                setTimeout(function() { _uploadPDFRelatorio(currentOM.num); }, 800);
                _gravarDashboardLog('CANCELADO_DESVIO', currentOM);
                alert('❌ OM CANCELADA SEM ASSINATURA\n\nDesvio: ' + dvInfo + '\n\nRelatório gerado e enviado.');
                hideDetail();
                filtrarOMs();
            }
        }

        function executarReprogramar() {
            $('reprogramarMotivo').value = '';
            $('popupReprogramar').classList.add('active');
        }

        function confirmarTrocaTurno() {
            if(!confirm('🔄 TROCA DE TURNO\n\nA OM será pausada e ficará disponível para a próxima equipe.\n\nConfirmar?')) return;

            if(timerAtividadeInterval) clearInterval(timerAtividadeInterval);

            var atividadeSeg = 0;
            if(currentOM.historicoExecucao && currentOM.historicoExecucao.length > 0) {
                var hExec = currentOM.historicoExecucao[currentOM.historicoExecucao.length - 1];
                if(hExec.dataInicio && !hExec.dataFim) {
                    atividadeSeg = Math.floor((new Date() - new Date(hExec.dataInicio)) / 1000) - tempoPausadoTotal;
                    if(atividadeSeg < 0) atividadeSeg = 0;
                    hExec.dataFim = new Date().toISOString();
                    hExec.hhAtividade = atividadeSeg / 3600;
                    hExec.hhDeslocamento = (hExec.deslocamentoSegundos || 0) / 3600;
                    _calcHH(hExec);
                    hExec.tempoPausadoTotal = tempoPausadoTotal;
                    hExec.tag = 'TROCA DE TURNO';
                }
            }

            currentOM.pausada = true;
            currentOM.pausaMotivo = '0018 - Troca de Turno';
            currentOM.pausaTrocaTurno = true;
            currentOM.pausaInicio = new Date().toISOString();
            currentOM.pausaDeslocSeg = deslocamentoSegundos || 0;
            currentOM.pausaExecutantes = executantesNomes.slice();
            currentOM.pausaMateriaisUsados = [...materiaisUsados];
            currentOM.statusAtual = 'pausada';
            currentOM.lockDeviceId = null;

            deslocamentoSegundos = 0;
            atividadeSegundos = 0;
            tempoPausadoTotal = 0;
            executantesNomes = [];
            atividadeJaIniciada = false;
            localStorage.removeItem(STORAGE_KEY_CURRENT);
            salvarOMs();
            _pushOMStatusSupabase(currentOM);

            alert('🔄 TROCA DE TURNO registrada.\n\nOM disponível para a próxima equipe.');
            hideDetail();
            filtrarOMs();
        }

        var _retomarExecs = [];
        var _retomarMesmaEquipe = true;

        function showRetomar(idx) {
            currentOM = oms[idx];
            _retomarExecs = [];
            _retomarMesmaEquipe = true;
            $('retomarInfo').innerHTML =
                '<b>OM:</b> ' + currentOM.num + '<br>' +
                '<b>Título:</b> ' + (currentOM.titulo || '') + '<br>' +
                '<b>Motivo pausa:</b> ' + (currentOM.pausaMotivo || '---') + '<br>' +
                '<b>Pausada em:</b> ' + new Date(currentOM.pausaInicio).toLocaleString('pt-BR') + '<br>' +
                (currentOM.pausaExecutantes && currentOM.pausaExecutantes.length > 0 ? '<b>Equipe anterior:</b> ' + currentOM.pausaExecutantes.join(', ') : '');
            $('retomarEquipeDiv').style.display = 'none';
            $('retomarLocalLabel').style.display = 'none';
            $('retomarLocalDiv').style.display = 'none';
            $('retomarExecLista').innerHTML = '';
            $('popupRetomar').classList.add('active');
        }
        function hideRetomar() { $('popupRetomar').classList.remove('active'); }

        function retomarMesmaEquipe(sim) {
            _retomarMesmaEquipe = sim;
            if(sim) {
                _retomarExecs = currentOM.pausaExecutantes ? currentOM.pausaExecutantes.slice() : [];
                $('retomarEquipeDiv').style.display = 'none';
            } else {
                _retomarExecs = [];
                $('retomarEquipeDiv').style.display = 'block';
                $('retomarExecInput').value = '';
                $('retomarExecLista').innerHTML = '';
                setTimeout(function(){ $('retomarExecInput').focus(); }, 200);
            }
            $('retomarLocalLabel').style.display = 'block';
            $('retomarLocalDiv').style.display = 'flex';
        }

        function retomarAddExec() {
            var nome = $('retomarExecInput').value.trim();
            if(!nome) return;
            _retomarExecs.push(nome);
            $('retomarExecInput').value = '';
            $('retomarExecLista').innerHTML = _retomarExecs.map(function(n,i){
                return '<span style="display:inline-block;background:#e8f5e9;padding:3px 8px;border-radius:12px;margin:2px;font-size:12px;">' + n + ' <span onclick="_retomarRemExec(' + i + ')" style="cursor:pointer;color:#c00;">✕</span></span>';
            }).join('');
            $('retomarExecInput').focus();
        }
        function _retomarRemExec(i) {
            _retomarExecs.splice(i, 1);
            $('retomarExecLista').innerHTML = _retomarExecs.map(function(n,j){
                return '<span style="display:inline-block;background:#e8f5e9;padding:3px 8px;border-radius:12px;margin:2px;font-size:12px;">' + n + ' <span onclick="_retomarRemExec(' + j + ')" style="cursor:pointer;color:#c00;">✕</span></span>';
            }).join('');
        }

        function retomarNoLocal(jaNoLocal) {
            if(!_retomarMesmaEquipe && _retomarExecs.length === 0) {
                alert('⚠️ Adicione ao menos um executante.');
                return;
            }

            hideRetomar();

            currentOM.pausada = false;
            currentOM.statusAtual = null;
            currentOM.lockDeviceId = deviceId;

            executantesNomes = _retomarExecs.slice();
            materiaisUsados = currentOM.pausaMateriaisUsados ? [...currentOM.pausaMateriaisUsados] : [...materiaisUsados];
            currentOM.primeiroExecutante = executantesNomes[0] || '';

            if(jaNoLocal) {
                deslocamentoSegundos = 0;
                atividadeJaIniciada = false;
                currentOM.statusAtual = 'em_deslocamento';
                currentOM._deslocHoraInicio = new Date().toISOString();
                salvarOMs();
                _retomarIniciarAtividadeDireto();
            } else {
                deslocamentoSegundos = 0;
                currentOM.statusAtual = 'em_deslocamento';
                currentOM._deslocHoraInicio = new Date().toISOString();
                salvarOMs();
                showDetail(oms.indexOf(currentOM));
            }
        }

        function _retomarIniciarAtividadeDireto() {
            deslocamentoSegundos = 0;
            deslocamentoMinutos = 0;
            var hFim = new Date().toISOString();
            currentOM._deslocHoraFim = hFim;

            if(!currentOM.historicoExecucao) currentOM.historicoExecucao = [];
            currentOM.historicoExecucao.push({
                executantes: executantesNomes.slice(),
                data: new Date().toLocaleDateString('pt-BR'),
                dataInicio: new Date().toISOString(),
                dataFim: null,
                deslocamentoSegundos: 0,
                deslocamentoHoraInicio: hFim,
                deslocamentoHoraFim: hFim,
                hhDeslocamento: 0, hhAtividade: 0, hhEquipe: 0, hhDeslocEquipe: 0, hhTotal: 0
            });

            currentOM.statusAtual = 'iniciada';
            atividadeJaIniciada = true;
            tempoPausadoTotal = 0;
            salvarOMs();
            salvarOMAtual();
            showDetail(oms.indexOf(currentOM));
        }

        function hideReprogramar() { $('popupReprogramar').classList.remove('active'); }
        function confirmarReprogramar() {
            var motivo = $('reprogramarMotivo').value.trim();
            if(!motivo) { alert('⚠️ Informe o motivo.'); return; }
            _salvarHistoricoAtual('REPROGRAMAR');
            currentOM.motivoReprogramacao = motivo;
            currentOM.statusDesvio = 'AGUARDANDO REPROGRAMACAO';
            currentOM.lockDeviceId = null;
            currentOM.execTs = Date.now();
            currentOM.observacoes = (currentOM.observacoes || '') + '\nREPROGRAMADA: ' + motivo;
            currentOM.materiaisUsados = materiaisUsados.length > 0 ? [...materiaisUsados] : currentOM.materiaisUsados;
            gerarEArmazenarPDF();
            _gravarDashboardLog('DESVIO', currentOM);
            moverParaHistorico(currentOM, 'REPROGRAMADO');
            _pushOMStatusSupabase(Object.assign({}, currentOM, { statusAtual: 'reprogramada', cancelada: false, motivo_reprogramacao: motivo }));
            hideReprogramar();
            alert('🔄 OM REPROGRAMADA\n\nMotivo: ' + motivo + '\nAguardando liberação do Admin.');
            _encerrarOMDesvio();
        }

        function showDesvioDesativar() {
            _desativarFotoBase64 = null;
            $('desativarObs').value = '';
            $('desativarFotoPreview').style.display = 'none';
            $('desativarFotoPreview').src = '';
            $('desativarFotoBtn').textContent = '📷 Tirar Foto (obrigatório)';
            $('desativarFotoBtn').style.background = '#e53935';
            $('popupDesvioDesativar').classList.add('active');
        }
        function hideDesvioDesativar() { $('popupDesvioDesativar').classList.remove('active'); }
        function desativarCapturarFoto() { $('inputFotoDesativar').click(); }
        function desativarHandleFoto(event) {
            var file = event.target.files[0]; if(!file) return;
            var reader = new FileReader();
            reader.onload = function(e) {
                comprimirImagem(e.target.result, function(comp) {
                    _desativarFotoBase64 = comp;
                    $('desativarFotoPreview').src = comp;
                    $('desativarFotoPreview').style.display = 'block';
                    $('desativarFotoBtn').textContent = '📎 Foto capturada ✓';
                    $('desativarFotoBtn').style.background = '#388e3c';
                });
            };
            reader.readAsDataURL(file); event.target.value = '';
        }
        function confirmarDesativar() {
            if(!_desativarFotoBase64) { alert('⚠️ A foto é obrigatória.'); return; }
            var rec = { omNum: currentOM.num, omTitulo: currentOM.titulo, tipo: 'DESATIVACAO DE EQUIPAMENTO',
                submotivo: 'OM executada - Equipamento desativado',
                observacao: $('desativarObs').value.trim(),
                foto: _desativarFotoBase64, data: new Date().toISOString(),
                executantes: executantesNomes.slice(), status: 'PROVISORIO' };
            _salvarDesvioLocal(rec);
            currentOM.desvioRecord = rec;
            _gravarDashboardLog('DESATIVADO', currentOM);
            hideDesvioDesativar();
            $('btnGroupAtividade').style.display = 'none';
            showFinalizar();
        }

        function reabrirOMDesvio(omNum) {
            var historico = JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORICO) || '[]');
            var idx = historico.findIndex(function(h){ return h.num === omNum && h.temDesvio && !h.canceladaDefinitivo; });
            if(idx < 0) { alert('OM não encontrada.'); return; }
            var omR = historico[idx].omCompleta;
            if(!omR) { alert('Dados não disponíveis para reabrir.'); return; }
            if(!confirm('🔄 Reabrir OM ' + omNum + '?\n\nNova tentativa com novos colaboradores.')) return;
            historico[idx].reaberta = true;
            localStorage.setItem(STORAGE_KEY_HISTORICO, JSON.stringify(historico));
            omR.statusDesvio = null; omR.lockDeviceId = null; omR.emOficina = false;
            omR.desvioApontado = false; omR.statusAtual = null;
            omR.desviosRegistrados = [];
            omR.desvioRecord = null;
            oms.push(omR); salvarOMs();
            fecharHistorico(); filtrarOMs();
            alert('✅ OM ' + omNum + ' reaberta!');
        }

        function showCancelarOMDesvio(omNum) {
            _omNumCancelDesvio = omNum;
            $('cancelDesvioJust').value = '';
            $('cancelDesvioNome').value = '';
            $('popupCancelDesvio').classList.add('active');
        }
        function hideCancelarOMDesvio() {
            $('popupCancelDesvio').classList.remove('active');
            _omNumCancelDesvio = null;
        }
        function confirmarCancelDesvio() {
            var just = $('cancelDesvioJust').value.trim();
            var nome = $('cancelDesvioNome').value.trim();
            if(!just) { alert('⚠️ Justificativa obrigatória.'); return; }
            if(!nome) { alert('⚠️ Nome obrigatório.'); return; }
            var historico = JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORICO) || '[]');
            var idx = historico.findIndex(function(h){ return h.num === _omNumCancelDesvio && h.temDesvio && !h.canceladaDefinitivo; });
            if(idx < 0) { alert('OM não encontrada.'); return; }

            var omComp = historico[idx].omCompleta;
            if(omComp) {
                var prevOM = currentOM;
                var prevCancel = isCancelamento;
                currentOM = omComp;
                currentOM.cancelada = true;
                currentOM.desvio = currentOM.desvio || 'CANCELAMENTO DEFINITIVO';
                currentOM.justificativaCancelamento = just;
                currentOM.nomeFiscal = nome;
                currentOM.execTs = Date.now();
                isCancelamento = true;
                gerarEArmazenarPDF();
                isCancelamento = prevCancel;
                currentOM = prevOM;

                historico[idx].canceladaDefinitivo = true;
                historico[idx].canceladoPor = nome;
                historico[idx].canceladoJust = just;
                historico[idx].dataCancelamento = new Date().toISOString();
                historico[idx].dataFinalizacao = new Date().toISOString();
                historico[idx].tipo = 'CANCELADO';
                historico[idx].temDesvio = false;
                historico[idx].cancelada = true;
                historico[idx].execTs = omComp.execTs;
            } else {
                historico[idx].canceladaDefinitivo = true;
                historico[idx].canceladoPor = nome;
                historico[idx].canceladoJust = just;
                historico[idx].dataCancelamento = new Date().toISOString();
                historico[idx].tipo = 'CANCELADO';
                historico[idx].temDesvio = false;
            }

            localStorage.setItem(STORAGE_KEY_HISTORICO, JSON.stringify(historico));
            hideCancelarOMDesvio(); fecharHistorico(); mostrarHistorico();
            alert('❌ OM ' + _omNumCancelDesvio + ' cancelada.\nRelatório de cancelamento gerado.');
        }

        function _gerarPDFDesvio(rec, titulo) {
            try {
                var jsPDF = window.jspdf.jsPDF;
                var pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                var W = 210, M = 15;
                var y = _pdfHeader(pdf, 'RELATORIO DE DESVIO');

                y = _pdfSection(pdf, y, titulo, 20);
                pdf.autoTable({
                    startY: y,
                    body: [
                        [{ content: 'OM', styles: { fontStyle: 'bold', textColor: [100,100,100], fillColor: [248,248,248] } }, { content: _pdfTextSafe(rec.omNum || '---') }],
                        [{ content: 'Data/Hora', styles: { fontStyle: 'bold', textColor: [100,100,100], fillColor: [248,248,248] } }, { content: new Date(rec.data).toLocaleString('pt-BR') }],
                        [{ content: 'Tipo Desvio', styles: { fontStyle: 'bold', textColor: [100,100,100], fillColor: [248,248,248] } }, { content: _pdfTextSafe(rec.tipoLabel || rec.tipo || '---') }],
                        [{ content: 'TAG Equipamento', styles: { fontStyle: 'bold', textColor: [100,100,100], fillColor: [248,248,248] } }, { content: _pdfTextSafe(rec.tagEquipamento || '---') }],
                        [{ content: 'Local', styles: { fontStyle: 'bold', textColor: [100,100,100], fillColor: [248,248,248] } }, { content: _pdfTextSafe((rec.localInstalacao || '') + (rec.descLocal ? ' - ' + rec.descLocal : '')) }],
                        [{ content: 'Executantes', styles: { fontStyle: 'bold', textColor: [100,100,100], fillColor: [248,248,248] } }, { content: _pdfTextSafe((rec.executantes || []).join(', ') || '---') }],
                        [{ content: 'Observacao', styles: { fontStyle: 'bold', textColor: [100,100,100], fillColor: [248,248,248] } }, { content: _pdfTextSafe(rec.observacao || '---') }]
                    ],
                    theme: 'grid',
                    tableWidth: 180,
                    styles: { fontSize: 6.5, cellPadding: 1.5, textColor: [30,30,30], lineColor: [200,200,200], lineWidth: 0.15, overflow: 'linebreak' },
                    columnStyles: { 0: { cellWidth: 28 }, 1: { cellWidth: 152 } },
                    margin: { left: M, right: M }
                });
                y = pdf.lastAutoTable.finalY + 8;

                if (rec.foto) {
                    y = _pdfSection(pdf, y, 'EVIDENCIA FOTOGRAFICA', 90);
                    y = _pdfEnsureSpace(pdf, y, 86, 20);

                    var boxW = 90, boxH = 65;
                    pdf.setFillColor(248,248,248);
                    pdf.setDrawColor(180,180,180);
                    pdf.setLineWidth(0.2);
                    pdf.rect(M, y, boxW, boxH, 'FD');
                    try { pdf.addImage(rec.foto, 'JPEG', M + 0.5, y + 0.5, boxW - 1, boxH - 1); } catch(e) {}

                    var metaY = y + boxH + 6;
                    var metaList = [
                        'DATA: ' + new Date(rec.data).toLocaleDateString('pt-BR') + ' - ' + (rec.tipoLabel || rec.tipo || '---'),
                        'LOCAL: ' + (rec.localInstalacao || '---') + (rec.descLocal ? ' - ' + rec.descLocal : ''),
                        'TAG: ' + (rec.tagEquipamento || '---')
                    ];

                    pdf.setFontSize(7);
                    pdf.setTextColor(100,100,100);
                    for (var k = 0; k < metaList.length; k++) {
                        var metaInfo = _pdfSplitText(pdf, metaList[k], 180, 3.6);
                        pdf.text(metaInfo.lines, M, metaY);
                        metaY += metaInfo.height + 1;
                    }
                    y = metaY + 2;
                }

                _pdfRodape(pdf, 'RELATORIO DE DESVIO');
                var out = pdf.output('dataurlstring');
                PdfDB.put('dev_' + rec.omNum + '_' + rec.tipoCod, out);
                PdfDB.put('dev_' + rec.omNum, out);
            } catch(e) { console.error('Erro PDF desvio:', e); }
        }

        function _getDesviosDaOM(omNum) {
            var todos = JSON.parse(localStorage.getItem(STORAGE_KEY_DESVIOS) || '[]');
            return todos.filter(function(d) { return d.omNum === omNum && d.tipoCod; });
        }

        async function verPDFDesvio(omNum) {
            var b64 = await PdfDB.get('dev_'+omNum);
            if(!b64){alert('PDF não encontrado!');return;}
            $('popupHistorico').classList.remove('active');
            var viewer = $('pdfGeradoViewer');
            viewer.innerHTML='<p style="text-align:center;padding:40px;color:#fff;">⏳ Carregando...</p>';
            $('pdfGeradoTitle').textContent='⚠️ Relatório de Desvio';
            $('popupPDFGerado').classList.add('active');
            try {
                var ab=base64ToArrayBuffer((b64.split(',')[1]||b64));
                var doc=await pdfjsLib.getDocument({data:ab}).promise;
                viewer.innerHTML=''; var cW=viewer.clientWidth-16;
                for(var pg=1;pg<=doc.numPages;pg++){
                    var page=await doc.getPage(pg);
                    var vpO=page.getViewport({scale:1});
                    var vp=page.getViewport({scale:(cW/vpO.width)*2});
                    var cvs=document.createElement('canvas');
                    cvs.width=vp.width;cvs.height=vp.height;
                    cvs.style.cssText='width:100%;height:auto;display:block;margin-bottom:12px;background:#fff;border-radius:4px;';
                    viewer.appendChild(cvs);
                    await page.render({canvasContext:cvs.getContext('2d'),viewport:vp}).promise;
                }
            }catch(e){viewer.innerHTML='<p style="color:#f00;text-align:center;padding:40px;">Erro: '+e.message+'</p>';}
        }

        var checklistItens = {
            mensal: [
                'Limpeza do filtro e da frente plástica.',
                'Limpeza de bandeja, desobstrução de dreno e conferência do fluxo da água na bandeja e na mangueira.',
                'Verificação dos sensores de degelo e temperatura.',
                'Verificação das tensões e correntes de entrada.',
                'Verificação dos capacitores e contatores, estado de terminais do compressor, engates e bornes.',
                'Verificação da operação do controle remoto e funcionamento da placa eletrônica.'
            ],
            trimestral: [
                'Recolhimento do gás, retirada do equipamento e transportado até a Oficina.',
                'Desmontagem de gabinete, retirada das tampas frontais e laterais, realizar jateamento com água e produto afim de eliminar sujidade das serpentinas, componentes plásticos e metálicos do Evaporador e Condensador.',
                'Verificação da fixação, posição e vibração. Eliminação de todas as folgas e do atrito do aparelho com a parte física do condensador e verificação do estado de fixação das tampas e do estado físico do gabinete.',
                'Retirar motor ventilador do evaporador, realizar limpeza e lubrificar radial e axial.',
                'Realizar na Oficina montagem mecânica e elétrica do equipamento, testar funcionamento, vibração e atrito.',
                'Instalar equipamento, realizar vácuo no sistema, medir superaquecimento.',
                'Medir temperatura de insuflamento do evaporador, medir temperatura de retorno do evaporador e medir temperatura do ambiente.',
                'Verificação estado de conservação dos cabos de alimentação e de interligação das unidades evaporadoras e condensadoras.',
                'Verificação do estado de conservação do isolamento térmico, tubulação e conexão de cobre.'
            ]
        };

        function renderChecklist() {
            var emOficina = currentOM && currentOM.retornouOficina;
            if(currentOM && currentOM.checklistFotos) checklistFotos = currentOM.checklistFotos;
            var html = '<div style="padding: 0 20px 20px;">';
            html += '<div class="toolbar-row">' +
                    '<button type="button" onclick="marcarConformeMensal()" class="toolbar-btn">✅ Conforme MENSAL</button>' +
                    '<button type="button" onclick="marcarConformeTrimestral()" class="toolbar-btn" style="margin-left:8px;">✅ Conforme TRIMESTRAL</button>' +
                    '</div>';
            html += '<div class="checklist-subtitle">MENSAL</div>';
            for(var i = 0; i < checklistItens.mensal.length; i++) {
                html += buildChecklistItem('m' + (i + 1), String(i + 1).padStart(2, '0'), checklistItens.mensal[i], emOficina);
            }
            html += '<div class="checklist-subtitle">TRIMESTRAL EM CASO DE ANOMALIA</div>';
            for(var i = 0; i < checklistItens.trimestral.length; i++) {
                html += buildChecklistItem('t' + (i + 1), String(i + 1).padStart(2, '0'), checklistItens.trimestral[i], emOficina);
            }
            html += '</div>';
            return html;
        }

        function buildChecklistItem(name, num, titulo, emOficina) {
            var foto = checklistFotos[name] || {};
            var savedVal = '';
            var savedObs = '';
            var podeEditar = _podeEditarChecklistAgora();
            if(currentOM && currentOM.checklistDados) {
                var found = currentOM.checklistDados.find(function(c){ return c.titulo === titulo; });
                if(found) { savedVal = found.valor; savedObs = found.obs || ''; }
            }
            var h = '<div class="checklist-item" id="chkItem_' + name + '">';
            h += '<div class="checklist-item-title">' + num + '. ' + titulo + '</div>';
            h += '<div class="checklist-radios">';
            h += '<label><input type="radio" name="' + name + '" value="normal" onchange="onChecklistChange(\'' + name + '\')"' + (savedVal === 'normal' ? ' checked' : '') + (podeEditar ? '' : ' disabled') + '> Normal</label>';
            h += '<label><input type="radio" name="' + name + '" value="anormal" onchange="onChecklistChange(\'' + name + '\')"' + (savedVal === 'anormal' ? ' checked' : '') + (podeEditar ? '' : ' disabled') + '> Anormal</label>';
            h += '</div>';
            h += '<div class="checklist-foto-row" id="fotoRow_' + name + '" style="display:' + (savedVal === 'anormal' || foto.antes ? 'flex' : 'none') + ';">';
            h += '<button class="checklist-foto-btn' + (foto.antes ? ' ok' : '') + '" id="fotoAntesBtn_' + name + '" onclick="capturarFoto(\'' + name + '\',\'antes\')">' + (foto.antes ? '📎 Foto Antes ✓' : '📷 Foto Antes *') + '</button>';
            h += '<button class="checklist-foto-btn depois' + (foto.depois ? ' ok' : '') + '" id="fotoDepoisBtn_' + name + '" onclick="capturarFoto(\'' + name + '\',\'depois\')" style="display:' + (foto.antes ? 'inline-block' : 'none') + ';">' + (foto.depois ? '📎 Foto Depois ✓' : '📷 Foto Depois') + '</button>';
            h += '</div>';
            h += '<input type="text" class="checklist-explicacao" id="explicacao_' + name + '" placeholder="Explicação do problema..." style="display:' + ((savedVal === 'anormal' && foto.antes) ? 'block' : 'none') + ';" value="' + (foto.explicacao || '').replace(/"/g, '&quot;') + '" oninput="salvarExplicacao(\'' + name + '\')"' + (podeEditar ? '' : ' readonly') + '>';
            h += '<input type="text" class="checklist-obs" placeholder="Observações..." value="' + savedObs.replace(/"/g, '&quot;') + '" oninput="salvarChecklistParcial()"' + (podeEditar ? '' : ' readonly') + '>';
            h += '</div>';
            return h;
        }

        function _podeEditarChecklistAgora() {
            if(!currentOM) return false;
            if(!currentOM.emOficina) return true;
            return !!(atividadeJaIniciada || currentOM.statusAtual === 'iniciada' || currentOM.retornouOficina || currentOM.devolvendoEquipamento);
        }

        function onChecklistChange(name) {
            var sel = document.querySelector('input[name="' + name + '"]:checked');
            var fotoRow = document.getElementById('fotoRow_' + name);
            if(sel && sel.value === 'anormal') {
                fotoRow.style.display = 'flex';
                if(!checklistFotos[name] || !checklistFotos[name].antes) {
                    capturarFoto(name, 'antes');
                }
            } else {
                fotoRow.style.display = 'none';
            }
            salvarChecklistParcial();
        }

        var _chkSaveTimer = null;
        function salvarChecklistEFechar() {
            currentOM.checklistDados = coletarChecklistDados();
            currentOM.checklistFotos = checklistFotos;
            salvarOMAtual();
            salvarOMs();
            $('checklistContent').innerHTML = '';
            $('checklistContent').style.display = 'none';
            $('btnSalvarChecklist').style.display = 'none';
            $('btnEditarChecklist').style.display = 'block';
            $('checklistSection').textContent = '📋 Checklist Salvo ✅';

            var fluxoOficina = !!(currentOM && (currentOM.emOficina || currentOM.retornouOficina));
            var fluxoChecklistAtivo = !!(currentOM && (currentOM.planoCod || currentOM.checklistCorretiva) && !currentOM.emOficina && !currentOM.retornouOficina);
            if (fluxoOficina || fluxoChecklistAtivo) {
                _aplicarModoChecklistFoco(false);
                if (fluxoOficina) {
                    $('checklistSection').style.display = 'none';
                    $('checklistActions').style.display = 'none';
                    _aplicarModoOficinaMinimal(true);
                    $('btnIniciar').style.display = 'block';
                    $('btnIniciar').disabled = false;
                    _btnOficinaCk();
                } else {
                    _aplicarModoOficinaMinimal(false);
                    $('checklistSection').style.display = 'block';
                    $('checklistActions').style.display = 'block';
                    $('btnEditarChecklist').style.display = 'block';
                    $('btnSalvarChecklist').style.display = 'none';
                    _uiAtividade(true);
                }
            }

            if(window.showToast) window.showToast('✅ Checklist salvo', 'success', 2000);
        }

        function editarChecklist() {
            $('checklistContent').style.display = 'block';
            $('checklistContent').innerHTML = renderChecklist();
            $('btnSalvarChecklist').style.display = 'block';
            $('btnEditarChecklist').style.display = 'none';
            $('checklistSection').textContent = '📋 Checklist de Manutenção';
        }

        function _mostrarChecklistUI(forcarAberto) {
            _aplicarModoChecklistFoco(true);
            $('checklistSection').style.display = 'block';
            $('checklistActions').style.display = 'block';
            var isOficina = currentOM && (currentOM.emOficina || currentOM.retornouOficina);
            if(isOficina || forcarAberto) {
                $('checklistContent').style.display = 'block';
                $('checklistContent').innerHTML = renderChecklist();
                $('btnSalvarChecklist').style.display = isOficina ? 'none' : 'block';
                $('btnEditarChecklist').style.display = 'none';
            } else if(currentOM.checklistDados && currentOM.checklistDados.length > 0) {
                $('checklistContent').innerHTML = '';
                $('checklistContent').style.display = 'none';
                $('btnSalvarChecklist').style.display = 'none';
                $('btnEditarChecklist').style.display = 'block';
                $('checklistSection').textContent = '📋 Checklist Salvo ✅';
            } else {
                $('checklistContent').style.display = 'block';
                $('checklistContent').innerHTML = renderChecklist();
                $('btnSalvarChecklist').style.display = 'block';
                $('btnEditarChecklist').style.display = 'none';
            }
        }

        function salvarChecklistParcial() {
            try {
                if(!currentOM || (!currentOM.planoCod && !currentOM.checklistCorretiva)) return;
                var secao = $('checklistSection');
                if(!secao || secao.style.display === 'none') return;
                if(_chkSaveTimer) clearTimeout(_chkSaveTimer);
                _chkSaveTimer = setTimeout(function() {
                    try {
                        currentOM.checklistDados = coletarChecklistDados();
                        currentOM.checklistFotos = checklistFotos;
                        salvarOMAtual();
                    } catch(e) {}
                }, 200);
            } catch(e) {}
        }

        function _detectarTipoChecklist() {
            var totalT = checklistItens.trimestral.length;
            var preenchidosT = 0;
            for(var i = 0; i < totalT; i++) {
                var sel = document.querySelector('input[name="t' + (i + 1) + '"]:checked');
                if(sel) preenchidosT++;
            }
            if(preenchidosT === 0) return 'MENSAL';
            if(preenchidosT === totalT) return 'TRIMESTRAL';
            return 'MISTO';
        }

        function _marcarNomesNormal(nomes) {
            for(var n = 0; n < nomes.length; n++) {
                var name = nomes[n];
                var r = document.querySelector('input[name="' + name + '"][value="normal"]');
                if(r) r.checked = true;
                var row = document.getElementById('fotoRow_' + name);
                if(row) row.style.display = 'none';
                var exp = document.getElementById('explicacao_' + name);
                if(exp) exp.style.display = 'none';
            }
            salvarChecklistParcial();
        }

        function marcarConformeMensal() {
            if(!currentOM || (!currentOM.planoCod && !currentOM.checklistCorretiva)) return;
            if(!confirm('Marcar itens MENSAL (m1–m6) como CONFORME?')) return;
            var nomes = [];
            for(var i = 0; i < checklistItens.mensal.length; i++) nomes.push('m' + (i + 1));
            _marcarNomesNormal(nomes);
        }

        function marcarConformeTrimestral() {
            if(!currentOM || (!currentOM.planoCod && !currentOM.checklistCorretiva)) return;
            if(!confirm('Marcar TODOS os itens (Mensal + Trimestral) como CONFORME?')) return;
            var nomes = [];
            for(var i = 0; i < checklistItens.mensal.length; i++) nomes.push('m' + (i + 1));
            for(var j = 0; j < checklistItens.trimestral.length; j++) nomes.push('t' + (j + 1));
            _marcarNomesNormal(nomes);
        }

function capturarFoto(name, tipo) {
            var fotoAtual = (checklistFotos[name] || {})[tipo];
            if(!_podeEditarChecklistAgora()) {
                if(fotoAtual) { visualizarFotoChecklist(fotoAtual); return; }
                alert('⚠️ Inicie a atividade para preencher este item.');
                return;
            }
            if(fotoAtual && !confirm('Já existe foto neste item.\n\nOK para substituir ou Cancelar para visualizar.')) {
                visualizarFotoChecklist(fotoAtual);
                return;
            }
            fotoAtualItem = name;
            fotoAtualTipo = tipo;
            $('inputFotoChecklist').click();
        }

        function visualizarFotoChecklist(base64) {
            if(!base64) return;
            $('fotoChecklistImg').src = base64;
            $('popupFotoChecklist').classList.add('active');
        }

        function fecharFotoChecklist() {
            $('popupFotoChecklist').classList.remove('active');
            $('fotoChecklistImg').src = '';
        }

        function handleFotoCapture(event) {
            var file = event.target.files[0];
            if(!file) return;
            var reader = new FileReader();
            reader.onload = function(e) {
                comprimirImagem(e.target.result, function(compressed) {
                    if(!checklistFotos[fotoAtualItem]) checklistFotos[fotoAtualItem] = {};
                    checklistFotos[fotoAtualItem][fotoAtualTipo] = compressed;
                    currentOM.checklistFotos = checklistFotos;
                    salvarOMAtual();
                    atualizarBotoesFoto(fotoAtualItem);
                    salvarChecklistParcial();
                });
            };
            reader.readAsDataURL(file);
            event.target.value = '';
        }

        function comprimirImagem(base64, callback) {
            var img = new Image();
            img.onload = function() {
                var cvs = document.createElement('canvas');
                var maxW = 1200;
                var scale = Math.min(1, maxW / img.width);
                cvs.width = img.width * scale;
                cvs.height = img.height * scale;
                var ctx2 = cvs.getContext('2d');
                ctx2.drawImage(img, 0, 0, cvs.width, cvs.height);
                callback(cvs.toDataURL('image/jpeg', 0.8));
            };
            img.src = base64;
        }

        function atualizarBotoesFoto(name) {
            var foto = checklistFotos[name] || {};
            var btnAntes = document.getElementById('fotoAntesBtn_' + name);
            if(btnAntes) {
                if(foto.antes) {
                    btnAntes.className = 'checklist-foto-btn ok';
                    btnAntes.textContent = '📎 Foto Antes ✓';
                } else {
                    btnAntes.className = 'checklist-foto-btn';
                    btnAntes.textContent = '📷 Foto Antes *';
                }
            }
            var btnDepois = document.getElementById('fotoDepoisBtn_' + name);
            if(btnDepois) {
                btnDepois.style.display = foto.antes ? 'inline-block' : 'none';
                if(foto.depois) {
                    btnDepois.className = 'checklist-foto-btn depois ok';
                    btnDepois.textContent = '📎 Foto Depois ✓';
                } else {
                    btnDepois.className = 'checklist-foto-btn depois';
                    btnDepois.textContent = '📷 Foto Depois *';
                }
            }
            var explicacao = document.getElementById('explicacao_' + name);
            if(explicacao && foto.antes) {
                explicacao.style.display = 'block';
            }
        }

        function salvarExplicacao(name) {
            var el = document.getElementById('explicacao_' + name);
            if(!el) return;
            if(!checklistFotos[name]) checklistFotos[name] = {};
            checklistFotos[name].explicacao = el.value;
            currentOM.checklistFotos = checklistFotos;
            salvarChecklistParcial();
        }

        async function atualizarListaMateriais() {
            localStorage.removeItem(STORAGE_KEY_MATERIAIS);
            priceList = {};
            var content = $('materiaisContent');
            if(content) content.innerHTML = '<p style="text-align:center;color:#555;padding:20px;">🔄 Atualizando...</p>';
            await sincronizarMateriais();
            renderMateriais();
        }

        function showMateriais() {
            if(omAssinada) { alert('⚠️ OM já assinada! Não é possível editar materiais.'); return; }
            $('searchMaterial').value = '';
            $('materiaisTipoChoice').style.display = 'flex';
            $('materiaisSearchArea').style.display = 'none';
            $('materiaisExtraArea').style.display = 'none';
            renderMateriais();
            $('popupMateriais').classList.add('active');
        }

        function escolherTipoMaterial(tipo) {
            $('materiaisTipoChoice').style.display = 'none';
            if(tipo === 'pricelist') {
                $('materiaisSearchArea').style.display = 'block';
                $('materiaisExtraArea').style.display = 'none';
                $('searchMaterial').value = '';
                $('searchMaterial').focus();
            } else {
                $('materiaisSearchArea').style.display = 'none';
                $('materiaisExtraArea').style.display = 'block';
                $('extraDesc').value = '';
                $('extraValor').value = '';
                $('extraQtd').value = '1';
                $('extraUnidade').value = 'Unidade';
                _calcExtraBDI();
            }
            renderMateriais();
        }

        function voltarEscolhaTipo() {
            $('materiaisTipoChoice').style.display = 'flex';
            $('materiaisSearchArea').style.display = 'none';
            $('materiaisExtraArea').style.display = 'none';
        }

        function _calcExtraBDI() {
            var vl = parseFloat($('extraValor').value) || 0;
            var qt = parseFloat($('extraQtd').value) || 0;
            var bdiVal = vl * (configBDI / 100);
            var total = (vl + bdiVal) * qt;
            var el = $('extraResumo');
            if(el) el.innerHTML = 'BDI ' + configBDI.toFixed(4) + '% = R$ ' + bdiVal.toFixed(2) + '/un &nbsp;|&nbsp; <strong>Total: R$ ' + total.toFixed(2) + '</strong>';
        }

        function adicionarExtraordinario() {
            var desc = $('extraDesc').value.trim();
            var vl = parseFloat($('extraValor').value) || 0;
            var qt = parseFloat($('extraQtd').value) || 0;
            var un = $('extraUnidade').value;
            if(!desc) { alert('⚠️ Informe a descrição do material.'); return; }
            if(vl <= 0) { alert('⚠️ Informe o valor unitário.'); return; }
            if(qt <= 0) { alert('⚠️ Informe a quantidade.'); return; }
            var bdiVal = vl * (configBDI / 100);
            var precoComBDI = vl + bdiVal;
            var total = precoComBDI * qt;
            materiaisUsados.push({
                codigo: 'XX',
                nome: desc,
                unidade: un,
                qtd: qt,
                precoUnit: vl,
                bdiPercentual: configBDI,
                bdiValor: bdiVal,
                precoComBDI: precoComBDI,
                total: total,
                tipo: 'Extraordinário',
                cc: currentOM.cc || ''
            });
            $('extraDesc').value = '';
            $('extraValor').value = '';
            $('extraQtd').value = '1';
            renderMateriais();
            alert('✅ Material extraordinário adicionado!\nTotal: R$ ' + total.toFixed(2));
        }

        function hideMateriais() {
            $('popupMateriais').classList.remove('active');
        }

        function filtrarMateriais() {
            renderMateriais();
        }

        function renderMateriais() {
            var search = $('searchMaterial').value.trim().toLowerCase();
            var content = $('materiaisContent');
            content.innerHTML = '';

            if(materiaisUsados.length > 0) {
                var selTitle = document.createElement('div');
                selTitle.className = 'popup-header-bar';
                selTitle.textContent = '✅ Itens selecionados (' + materiaisUsados.length + ')';
                content.appendChild(selTitle);

                materiaisUsados.forEach(function(m) {
                    var div = document.createElement('div');
                    div.className = 'choice-card ' + (m.tipo === 'Material Vale' ? 'choice-card--warning' : 'choice-card--primary');
                    var badgeClass = m.tipo === 'Extraordinário' ? 'badge-tipo--extraordinario' : (m.tipo === 'Material Vale' ? 'badge-tipo--vale' : 'badge-tipo--pricelist');
                    var badgeTipo = '<span class="badge-tipo ' + badgeClass + '">' + (m.tipo || 'Pricelist') + '</span>';
                    var bdiTxt = m.bdiPercentual > 0 ? ' (BDI ' + m.bdiPercentual.toFixed(2) + '%)' : '';
                    var corTipo = m.tipo === 'Extraordinário' ? '#e67e00' : (m.tipo === 'Material Vale' ? '#dc3545' : '#1A5276');
                    div.innerHTML =
                        '<div class="search-result-text">' +
                            '<div class="material-item-header">[' + m.codigo + '] ' + sc(m.nome) + badgeTipo + '</div>' +
                            '<div class="material-item-price">R$ ' + m.precoUnit.toFixed(2) + ' / ' + m.unidade + bdiTxt + (m.cc ? ' | CC: ' + m.cc : '') + '</div>' +
                        '</div>' +
                        '<input type="number" min="0.01" step="0.01" value="' + m.qtd + '" class="input-inline" ' +
                            'data-codigo="' + m.codigo + '" data-tipo="' + (m.tipo||'') + '" data-nome="' + (m.nome||'').replace(/'/g,'') + '" oninput="editarQtdSelecionado(this)">' +
                        '<span class="material-item-total" style="color:' + corTipo + ';">R$ ' + m.total.toFixed(2) + '</span>' +
                        '<button class="popup-close-btn" onclick="removerMaterialSelecionado(\'' + m.codigo + '\',\'' + (m.tipo||'') + '\',\'' + (m.nome||'').replace(/'/g,'') + '\')" style="background:#fde8ea;">🗑️</button>';
                    content.appendChild(div);
                });

                var totalGeral = materiaisUsados.reduce(function(s, m){ return s + m.total; }, 0);
                var totalDiv = document.createElement('div');
                totalDiv.className = 'total-row';
                totalDiv.textContent = 'Total: R$ ' + totalGeral.toFixed(2);
                content.appendChild(totalDiv);
            }

            if(!search) {
                var hint = document.createElement('p');
                hint.className = 'empty-hint';
                hint.textContent = 'Digite para buscar materiais...';
                content.appendChild(hint);
                return;
            }

            function norm(s) {
                return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            }

            var palavras = norm(search).split(/\s+/).filter(Boolean);

            function levenshtein(a, b) {
                if(Math.abs(a.length - b.length) > 2) return 99;
                var dp = [];
                for(var i = 0; i <= a.length; i++) {
                    dp[i] = [i];
                    for(var j = 1; j <= b.length; j++) {
                        dp[i][j] = i === 0 ? j : Math.min(dp[i-1][j]+1, dp[i][j-1]+1, dp[i-1][j-1]+(a[i-1]!==b[j-1]?1:0));
                    }
                }
                return dp[a.length][b.length];
            }

            var scored = Object.values(priceList).map(function(mat) {
                var haystack = norm(mat.descricao + ' ' + mat.item);
                var haystackWords = haystack.split(/\s+/);
                var score = 0;
                var matched = 0;
                palavras.forEach(function(p) {
                    if(haystack.includes(p)) { score += 10; matched++; return; }
                    if(p.length >= 3) {
                        var found = haystackWords.some(function(hw){ return hw.includes(p) || p.includes(hw) && hw.length >= 3; });
                        if(found) { score += 5; matched++; return; }
                    }
                    if(p.length >= 4) {
                        var fuzzy = haystackWords.some(function(hw){ return levenshtein(p, hw) <= 1; });
                        if(fuzzy) { score += 3; matched++; }
                    }
                });
                if(matched < Math.ceil(palavras.length * 0.5)) score = 0;
                return { mat: mat, score: score };
            }).filter(function(x){ return x.score > 0; });

            scored.sort(function(a,b){ return b.score - a.score; });
            var resultados = scored.map(function(x){ return x.mat; });

            if(resultados.length === 0) {
                var nada = document.createElement('p');
                nada.className = 'empty-notfound';
                nada.textContent = 'Nenhum material encontrado.';
                content.appendChild(nada);
                return;
            }

            var resTitle = document.createElement('div');
            resTitle.className = 'search-result-header';
            resTitle.textContent = 'Resultados (' + resultados.length + ')';
            content.appendChild(resTitle);

            resultados.forEach(function(mat) {
                var jaSelecionado = materiaisUsados.some(function(m){ return m.codigo === mat.item; });
                var isMaterialVale = MATERIAL_VALE_ITEMS.indexOf(mat.item) !== -1;
                var div = document.createElement('div');
                div.className = 'search-result-item ' + (jaSelecionado ? 'search-result-item--selected' : (isMaterialVale ? 'search-result-item--vale' : ''));
                var nomeCor = isMaterialVale ? 'text-danger' : '';
                var tagVale = isMaterialVale ? ' <span class="badge-tipo badge-tipo--vale">MATERIAL VALE</span>' : '';
                div.innerHTML =
                    '<div class="search-result-text">' +
                        '<div class="search-result-name ' + nomeCor + '">[' + mat.item + '] ' + sc(mat.descricao) + tagVale + '</div>' +
                        '<div class="search-result-price ' + (isMaterialVale ? 'text-danger' : '') + '">' + (isMaterialVale ? 'Sem custo' : 'R$ ' + mat.preco.toFixed(2)) + ' / ' + mat.unidade + '</div>' +
                    '</div>' +
                    '<button class="btn-add-material ' + (jaSelecionado ? 'btn-add-material--disabled' : (isMaterialVale ? 'btn-add-material--vale' : 'btn-add-material--primary')) + '" onclick="adicionarMaterialDaBusca(\'' + mat.item + '\')" ' + (jaSelecionado ? 'disabled' : '') + '>' +
                        (jaSelecionado ? '✓ Adicionado' : '+ Adicionar') +
                    '</button>';
                content.appendChild(div);
            });
        }

        function adicionarMaterialDaBusca(codigo) {
            var mat = Object.values(priceList).find(function(m){ return m.item === codigo; });
            if(!mat) return;
            var existente = materiaisUsados.findIndex(function(m){ return m.codigo === codigo; });
            var isMaterialVale = MATERIAL_VALE_ITEMS.indexOf(codigo) !== -1;
            var tipo = isMaterialVale ? 'Material Vale' : 'Pricelist';
            if(existente >= 0) {
                materiaisUsados[existente].qtd += 1;
                materiaisUsados[existente].total = materiaisUsados[existente].qtd * materiaisUsados[existente].precoUnit;
            } else {
                materiaisUsados.push({
                    codigo: mat.item,
                    nome: mat.descricao,
                    unidade: mat.unidade,
                    qtd: 1,
                    precoUnit: mat.preco,
                    total: mat.preco,
                    tipo: tipo,
                    cc: currentOM.cc || '',
                    bdiPercentual: 0,
                    bdiValor: 0
                });
            }
            renderMateriais();
        }

        function editarQtdSelecionado(input) {
            var codigo = input.dataset.codigo;
            var tipo = input.dataset.tipo || '';
            var nome = input.dataset.nome || '';
            var qtd = parseFloat(input.value) || 0;
            var idx = materiaisUsados.findIndex(function(m){
                if(codigo === 'XX') return m.codigo === codigo && m.tipo === tipo && (m.nome||'').replace(/'/g,'') === nome;
                return m.codigo === codigo;
            });
            if(idx < 0) return;
            if(qtd <= 0) {
                materiaisUsados.splice(idx, 1);
            } else {
                materiaisUsados[idx].qtd = qtd;
                if(materiaisUsados[idx].tipo === 'Extraordinário') {
                    var bdiVal = materiaisUsados[idx].precoUnit * (configBDI / 100);
                    materiaisUsados[idx].total = (materiaisUsados[idx].precoUnit + bdiVal) * qtd;
                } else {
                    materiaisUsados[idx].total = qtd * materiaisUsados[idx].precoUnit;
                }
            }
            renderMateriais();
        }

        function removerMaterialSelecionado(codigo, tipo, nome) {
            materiaisUsados = materiaisUsados.filter(function(m){
                if(codigo === 'XX') return !(m.codigo === codigo && m.tipo === (tipo||'') && (m.nome||'').replace(/'/g,'') === (nome||''));
                return m.codigo !== codigo;
            });
            renderMateriais();
        }

        function salvarMateriais() {
            renderMateriaisUsados();
            
            if(currentOM.historicoExecucao && currentOM.historicoExecucao.length > 0) {
                var historicoAtual = currentOM.historicoExecucao[currentOM.historicoExecucao.length - 1];
                historicoAtual.materiaisUsados = [...materiaisUsados];
            }
            
            salvarOMAtual();
            
            const total = materiaisUsados.reduce((sum, m) => sum + m.total, 0);
            if(materiaisUsados.length > 0) {
                alert(`✅ ${materiaisUsados.length} material(is) adicionado(s)\nTotal: R$ ${total.toFixed(2)}`);
            }
            
            hideMateriais();
        }

        function enviarParaOficina() {
            if(!currentOM.planoCod && !currentOM.checklistCorretiva) {
                alert('⚠️ Habilite o checklist primeiro (botão 📋 CHECKLIST).');
                return;
            }
            
            var nomes = ['m1','m2','m3','m4','m5','m6','t1','t2','t3','t4','t5','t6','t7','t8','t9'];
            var temAnormal = false;
            for(var i = 0; i < nomes.length; i++) {
                var sel = document.querySelector('input[name="' + nomes[i] + '"]:checked');
                if(sel && sel.value === 'anormal') {
                    if(!checklistFotos[nomes[i]] || !checklistFotos[nomes[i]].antes) {
                        alert('⚠️ Item ' + nomes[i].toUpperCase() + ' marcado como ANORMAL sem foto do ANTES.\n\nTodos os itens anormais precisam de foto.');
                        return;
                    }
                    temAnormal = true;
                }
            }
            
            if(!temAnormal) {
                alert('⚠️ Nenhum item anormal encontrado.\n\nA oficina só é necessária quando há não conformidades.');
                return;
            }
            
            if(!confirm('🔧 ENVIAR PARA OFICINA?\n\nO HH e deslocamento serão salvos automaticamente.\nA OM ficará com status OFICINA.')) return;
            
            if(timerAtividadeInterval) clearInterval(timerAtividadeInterval);
            
            if(currentOM.historicoExecucao && currentOM.historicoExecucao.length > 0) {
                var historicoAtual = currentOM.historicoExecucao[currentOM.historicoExecucao.length - 1];
                if(historicoAtual.dataInicio && !historicoAtual.dataFim) {
                    var diff = Math.floor((new Date() - new Date(historicoAtual.dataInicio)) / 1000) - tempoPausadoTotal;
                    var atividadeHoras = diff / 3600;
                    historicoAtual.dataFim = new Date().toISOString();
                    historicoAtual.hhAtividade = atividadeHoras;
                    historicoAtual.hhDeslocamento = (((historicoAtual.deslocamentoSegundos !== undefined) ? historicoAtual.deslocamentoSegundos : ((historicoAtual.deslocamentoMinutos || 0) * 60)) / 3600);
                    _calcHH(historicoAtual);
                    historicoAtual.tempoPausadoTotal = tempoPausadoTotal;
                    historicoAtual.materiaisUsados = [...materiaisUsados];
                    historicoAtual.tag = 'OFICINA';
                }
            }
            
            currentOM.checklistDados = coletarChecklistDados();
            currentOM.checklistFotos = checklistFotos;
            currentOM.emOficina = true;
            currentOM.dataEnvioOficina = new Date().toISOString();
            currentOM.lockDeviceId = null;
            currentOM._deslocSegundosSnapshot = deslocamentoSegundos;
            
            localStorage.removeItem(STORAGE_KEY_CURRENT);
            salvarOMs();
            _pushOMStatusSupabase(currentOM);
            setTimeout(function() { _uploadPDFRelatorio(currentOM.num); }, 800);
            
            alert('🔧 OM ENVIADA PARA OFICINA!\n\nHH e dados salvos com sucesso.');
            hideDetail();
            filtrarOMs();
        }

        function devolverEquipamento() {
            var nomes = ['m1','m2','m3','m4','m5','m6','t1','t2','t3','t4','t5','t6','t7','t8','t9'];
            var temAnormal = false;
            for(var i = 0; i < nomes.length; i++) {
                var sel = document.querySelector('input[name="' + nomes[i] + '"]:checked');
                if(sel && sel.value === 'anormal') {
                    temAnormal = true;
                    var foto = checklistFotos[nomes[i]] || {};
                    if(!foto.antes) {
                        alert('⚠️ Item ' + nomes[i].toUpperCase() + ' ANORMAL sem foto do ANTES.\n\nTire a foto do problema encontrado.');
                        return;
                    }
                }
            }
            
            if(!confirm('🔧 DEVOLVER EQUIPAMENTO?\n\nIniciará o deslocamento para montagem.' + (temAnormal ? '\n\nFotos do DEPOIS podem ser adicionadas após retomar.' : ''))) return;
            
            if(timerAtividadeInterval) clearInterval(timerAtividadeInterval);
            
            if(currentOM.historicoExecucao && currentOM.historicoExecucao.length > 0) {
                var historicoAtual = currentOM.historicoExecucao[currentOM.historicoExecucao.length - 1];
                if(historicoAtual.dataInicio && !historicoAtual.dataFim) {
                    var diff = Math.floor((new Date() - new Date(historicoAtual.dataInicio)) / 1000) - tempoPausadoTotal;
                    var atividadeHoras = diff / 3600;
                    historicoAtual.dataFim = new Date().toISOString();
                    historicoAtual.hhAtividade = atividadeHoras;
                    historicoAtual.hhDeslocamento = 0;
                    _calcHH(historicoAtual);
                    historicoAtual.tempoPausadoTotal = tempoPausadoTotal;
                    historicoAtual.materiaisUsados = [...materiaisUsados];
                    historicoAtual.tag = 'OFICINA';
                }
            }
            
            currentOM.checklistDados = coletarChecklistDados();
            currentOM.checklistFotos = checklistFotos;
            currentOM.retornouOficina = true;
            currentOM.devolvendoEquipamento = true;
            
            salvarOMAtual();
            salvarOMs();
            
            deslocamentoInicio = new Date();
            currentOM._deslocHoraInicio = deslocamentoInicio.toISOString();
            currentOM._deslocHoraFim = null;
            $('btnGroupAtividade').style.display = 'none';
            $('btnChecklist').style.display = 'none';
            $('btnRowExecOficina').style.display = 'none';
            _setBtns({
                btnDevolverEquip:0, btnFinalizar:0, timerAtividade:0,
                checklistSection:0, checklistActions:0, timerDisplay:1, btnIniciar:1
            });
            $('btnIniciar').disabled = false;
            
            timerInterval = setInterval(() => {
                const diff = Math.floor((new Date() - deslocamentoInicio) / 1000);
                const m = Math.floor(diff / 60);
                const s = diff % 60;
                $('timerDisplay').textContent = 
                    String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
                deslocamentoMinutos = m;
                $('hhDeslocamento').textContent = m + ' min';
            }, 1000);
            
            alert('🚗 DESLOCAMENTO INICIADO!\n\nApós chegar, clique em INICIAR ATIVIDADE para montar o equipamento.');
        }

        function showFinalizar() {
            var errosChecklist = validarChecklist();
            if(errosChecklist.length > 0) {
                alert('❌ NÃO É POSSÍVEL FINALIZAR\n\n' + errosChecklist.join('\n\n'));
                return;
            }
            if(timerAtividadeInterval) clearInterval(timerAtividadeInterval);
            
            var atividadeHoras = '0.00';
            var hhPorPessoa = '0.00';
            var hhDeslocamento = '0.00';
            var hhTotal = '0.00';
            
            if(currentOM.historicoExecucao && currentOM.historicoExecucao.length > 0) {
                var historicoAtual = currentOM.historicoExecucao[currentOM.historicoExecucao.length - 1];
                if(historicoAtual.dataInicio) {
                    var diff = Math.floor((new Date() - new Date(historicoAtual.dataInicio)) / 1000) - tempoPausadoTotal;
                    atividadeHoras = (diff / 3600).toFixed(2);
                    hhPorPessoa = (atividadeHoras * numExecutantes).toFixed(2);
                    var hhDeslocRaw = deslocamentoSegundos / 3600;
                    hhDeslocamento = hhDeslocRaw.toFixed(2);
                    var hhDeslocEquipe = (hhDeslocRaw * numExecutantes).toFixed(2);
                    hhTotal = (parseFloat(hhPorPessoa) + parseFloat(hhDeslocEquipe)).toFixed(2);
                    historicoAtual.dataFim = new Date().toISOString();
                    historicoAtual.hhAtividade = parseFloat(atividadeHoras);
                    historicoAtual.hhDeslocamento = parseFloat(hhDeslocamento);
                    _calcHH(historicoAtual);
                    historicoAtual.tempoPausadoTotal = tempoPausadoTotal;
                    historicoAtual.materiaisUsados = [...materiaisUsados];
                    historicoAtual.deslocamentoSegundos = deslocamentoSegundos;
                }
            }
            
            $('resumoHHAtividade').textContent = atividadeHoras + 'h';
            $('resumoNumExec').textContent = numExecutantes;
            $('resumoHHPorPessoa').textContent = hhPorPessoa + 'h';
            $('resumoHHDeslocamento').textContent = hhDeslocamento + 'h' + (numExecutantes > 1 ? ' (×' + numExecutantes + ' = ' + (parseFloat(hhDeslocamento) * numExecutantes).toFixed(2) + 'h)' : '');
            $('resumoHHTotal').textContent = hhTotal + 'h';
            $('listaExecFinal').innerHTML = executantesNomes.map((n, i) => (i + 1) + '. ' + n).join('<br>');
            
            renderResumoHistorico();
            
            const totalMat = materiaisUsados.reduce((sum, m) => sum + m.total, 0);
            const financialBox = $('financialSummary');
            
            if(materiaisUsados.length > 0) {
                financialBox.innerHTML = `
                    <div style="font-size:18px;font-weight:800;color:#1A5276;margin-bottom:12px;">💰 Resumo Financeiro</div>
                    <div style="display:flex;justify-content:space-between;margin-bottom:10px;font-size:15px;">
                        <span>📦 Materiais:</span>
                        <strong style="color:#2E86C1;">R$ ${totalMat.toFixed(2)}</strong>
                    </div>
                    <div style="display:flex;justify-content:space-between;font-size:20px;font-weight:900;border-top:3px solid #ffd700;padding-top:12px;margin-top:12px;">
                        <span>💵 TOTAL:</span>
                        <strong style="color:#2E86C1;">R$ ${totalMat.toFixed(2)}</strong>
                    </div>
                `;
            } else {
                financialBox.innerHTML = `
                    <div style="font-size:18px;font-weight:800;color:#1A5276;margin-bottom:12px;">💰 Resumo Financeiro</div>
                    <div style="text-align:center;padding:24px;color:#999;">
                        <div style="font-size:32px;margin-bottom:12px;">🔧</div>
                        <div style="font-weight:700;font-size:15px;">SÓ MÃO DE OBRA</div>
                        <div style="font-size:13px;margin-top:6px;">Nenhum material utilizado</div>
                    </div>
                `;
            }
            
            $('popupFinalizar').classList.add('active');

            var desviosDiv = $('resumoDesviosOM');
            var desviosOM = currentOM.desviosRegistrados || [];
            var desviosLocal = _getDesviosDaOM(currentOM.num);
            var desviosAll = desviosOM.length > 0 ? desviosOM : desviosLocal;
            if(desviosAll.length > 0) {
                var devHtml = '<div style="background:linear-gradient(135deg,#fff3e0,#ffe0b2);border:2px solid #e65100;border-radius:12px;padding:14px;margin-bottom:16px;">';
                devHtml += '<div style="font-size:16px;font-weight:800;color:#e65100;margin-bottom:10px;">⚠️ Desvios Registrados (' + desviosAll.length + ')</div>';
                var totalDevSeg = 0;
                for(var dv = 0; dv < desviosAll.length; dv++) {
                    var dev = desviosAll[dv];
                    totalDevSeg += (dev.tempoSegundos || 0);
                    devHtml += '<div style="background:#fff;border-radius:8px;padding:8px;margin-bottom:6px;border-left:4px solid #e65100;">';
                    devHtml += '<div style="font-weight:800;font-size:13px;color:#e65100;">' + (dev.tipoCod || '') + ' - ' + (dev.tipoLabel || dev.tipo || '') + '</div>';
                    devHtml += '<div style="font-size:12px;color:#555;">TAG: <strong>' + (dev.tagEquipamento || '---') + '</strong> | Local: ' + (dev.localInstalacao || '---') + '</div>';
                    devHtml += '<div style="font-size:12px;color:#555;">Data: ' + new Date(dev.data).toLocaleString('pt-BR') + ' | Tempo: <strong>' + _formatarTempo(dev.tempoSegundos || 0) + '</strong></div>';
                    devHtml += '</div>';
                }
                devHtml += '<div style="text-align:center;padding:8px;background:#e65100;border-radius:8px;color:#fff;font-weight:800;font-size:14px;margin-top:8px;">⏱️ Tempo Total Desvios: ' + _formatarTempo(totalDevSeg) + '</div>';
                devHtml += '</div>';
                desviosDiv.innerHTML = devHtml;
                desviosDiv.style.display = 'block';
            } else {
                desviosDiv.style.display = 'none';
                desviosDiv.innerHTML = '';
            }

            setTimeout(function(){ setupSignaturePad(); }, 300);
        }

        function renderResumoHistorico() {
            const div = $('resumoHistorico');
            
            if(!currentOM.historicoExecucao || currentOM.historicoExecucao.length === 0) {
                div.innerHTML = '';
                return;
            }
            
            let html = '<div style="margin-bottom:20px;"><h4 style="color:#1A5276;margin-bottom:12px;font-size:16px;font-weight:800;">📅 Histórico por Colaborador</h4>';
            
            let hhTotalGeral = 0;
            let hhNormalGeral = 0, hhExtraGeral = 0, hhNoturnoGeral = 0;
            currentOM.historicoExecucao.forEach((hist, idx) => {
                var numExec = hist.executantes ? hist.executantes.length : 1;
                var hhDeslInd = hist.hhDeslocamento || 0;
                var hhAtivInd = hist.hhAtividade || 0;
                var hhIndiv = hhDeslInd + hhAtivInd;
                var deslocIni = hist.deslocamentoHoraInicio ? new Date(hist.deslocamentoHoraInicio).toLocaleTimeString('pt-BR') : '--:--:--';
                var deslocFim = hist.deslocamentoHoraFim ? new Date(hist.deslocamentoHoraFim).toLocaleTimeString('pt-BR') : '--:--:--';
                var ativIni = hist.dataInicio ? new Date(hist.dataInicio).toLocaleTimeString('pt-BR') : '--:--:--';
                var ativFim = hist.dataFim ? new Date(hist.dataFim).toLocaleTimeString('pt-BR') : '--:--:--';
                var classif = classificarHoras(hist.deslocamentoHoraInicio || hist.dataInicio, hist.dataFim);
                
                html += '<div style="margin-bottom:10px;padding:8px;background:#f4f4f4;border-radius:8px;">';
                html += '<div style="font-weight:800;font-size:13px;color:#1A5276;margin-bottom:6px;">Dia ' + (idx + 1) + ' - ' + hist.data + ' | 🚗 ' + deslocIni + '→' + deslocFim + ' | ⏱️ ' + ativIni + '→' + ativFim + '</div>';
                
                for(var e = 0; e < numExec; e++) {
                    var hhPessoa = hhIndiv;
                    hhTotalGeral += hhPessoa;
                    hhNormalGeral += classif.normal;
                    hhExtraGeral += classif.extra;
                    hhNoturnoGeral += classif.noturno;
                    html += '<div style="padding:3px 6px;font-size:12px;border-bottom:1px solid #e0e0e0;">';
                    html += '<strong>' + (hist.executantes[e] || '---') + '</strong> — ';
                    html += '🚗' + hhDeslInd.toFixed(2) + 'h + ⏱️' + hhAtivInd.toFixed(2) + 'h = <strong>' + hhPessoa.toFixed(2) + 'h</strong>';
                    if(classif.normal > 0) html += ' <span style="color:#2E86C1;">N:' + classif.normal + '</span>';
                    if(classif.extra > 0) html += ' <span style="color:#f0ad4e;">E:' + classif.extra + '</span>';
                    if(classif.noturno > 0) html += ' <span style="color:#d9534f;">Not:' + classif.noturno + '</span>';
                    html += '</div>';
                }
                html += '</div>';
            });
            
            html += '<div style="padding:12px;background:linear-gradient(135deg, #e3f2fd, #bbdefb);border-radius:10px;text-align:center;">';
            html += '<div style="font-weight:800;color:#1A5276;font-size:16px;">HH ACUMULADO: ' + hhTotalGeral.toFixed(2) + 'h</div>';
            html += '<div style="font-size:12px;color:#555;margin-top:4px;">';
            if(hhNormalGeral > 0) html += '<span style="color:#2E86C1;">Normal: ' + hhNormalGeral.toFixed(2) + 'h</span> ';
            if(hhExtraGeral > 0) html += '<span style="color:#f0ad4e;">Extra: ' + hhExtraGeral.toFixed(2) + 'h</span> ';
            if(hhNoturnoGeral > 0) html += '<span style="color:#d9534f;">Noturno: ' + hhNoturnoGeral.toFixed(2) + 'h</span>';
            html += '</div></div></div>';
            div.innerHTML = html;
        }

        function hideFinalizar() {
            $('popupFinalizar').classList.remove('active');
        }

        function setupSignaturePad() {
            canvas = $('signatureCanvas');
            if(!canvas) return;
            ctx = canvas.getContext('2d');
            var container = canvas.parentElement;
            var w = container ? container.clientWidth : 280;
            if(w < 100) w = 280;
            canvas.width = w;
            canvas.height = 160;
            canvas.style.width = w + 'px';
            canvas.style.height = '160px';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            canvas.onmousedown = startDrawing;
            canvas.onmousemove = draw;
            canvas.onmouseup = stopDrawing;
            canvas.onmouseout = stopDrawing;
            canvas.ontouchstart = handleTouch;
            canvas.ontouchmove = handleTouch;
            canvas.ontouchend = stopDrawing;
        }

        function startDrawing(e) {
            isDrawing = true;
            const rect = canvas.getBoundingClientRect();
            ctx.beginPath();
            ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
        }

        function draw(e) {
            if(!isDrawing) return;
            const rect = canvas.getBoundingClientRect();
            ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
            ctx.stroke();
        }

        function handleTouch(e) {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            
            if(e.type === 'touchstart') {
                isDrawing = true;
                ctx.beginPath();
                ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
            } else if(e.type === 'touchmove' && isDrawing) {
                ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
                ctx.stroke();
            }
        }

        function stopDrawing() {
            isDrawing = false;
        }

        function clearSignature() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        function validarChecklist() {
            var secao = $('checklistSection');
            if(!secao || secao.style.display === 'none') return [];

            var nomesMensais = [];
            var nomesTodos = [];
            for(var i = 0; i < checklistItens.mensal.length; i++) {
                nomesMensais.push('m' + (i + 1));
                nomesTodos.push('m' + (i + 1));
            }
            for(var j = 0; j < checklistItens.trimestral.length; j++) nomesTodos.push('t' + (j + 1));

            var naoMarcados = [], semFoto = [];
            for(var n = 0; n < nomesMensais.length; n++) {
                var selM = document.querySelector('input[name="' + nomesMensais[n] + '"]:checked');
                if(!selM) naoMarcados.push(nomesMensais[n]);
            }
            for(var x = 0; x < nomesTodos.length; x++) {
                var name = nomesTodos[x];
                var sel = document.querySelector('input[name="' + name + '"]:checked');
                if(!sel) continue;
                if(sel.value === 'anormal') {
                    var foto = checklistFotos[name] || {};
                    if(!foto.antes) semFoto.push(name);
                }
            }
            var erros = [];
            if(naoMarcados.length > 0) erros.push('⚠️ ' + naoMarcados.length + ' item(ns) MENSAL sem marcação: ' + naoMarcados.join(', ').toUpperCase());
            if(semFoto.length > 0) erros.push('📷 ' + semFoto.length + ' item(ns) ANORMAL sem Foto Antes: ' + semFoto.join(', ').toUpperCase());
            return erros;
        }

        function coletarChecklistDados() {
            var itens = [];
            var grupos = [
                {secao: 'MENSAL', prefixo: 'm', total: 6, titulos: [
                    'Limpeza do filtro e da frente plástica.',
                    'Limpeza de bandeja, desobstrução de dreno e conferência do fluxo da água na bandeja e na mangueira.',
                    'Verificação dos sensores de degelo e temperatura.',
                    'Verificação das tensões e correntes de entrada.',
                    'Verificação dos capacitores e contatores, estado de terminais do compressor, engates e bornes.',
                    'Verificação da operação do controle remoto e funcionamento da placa eletrônica.'
                ]},
                {secao: 'TRIMESTRAL EM CASO DE ANOMALIA', prefixo: 't', total: 9, titulos: [
                    'Recolhimento do gás, retirada do equipamento e transportado até a Oficina.',
                    'Desmontagem de gabinete, retirada das tampas frontais e laterais, realizar jateamento com água e produto afim de eliminar sujidade das serpentinas, componentes plásticos e metálicos do Evaporador e Condensador.',
                    'Verificação da fixação, posição e vibração. Eliminação de todas as folgas e do atrito do aparelho com a parte física do condensador e verificação do estado de fixação das tampas e do estado físico do gabinete.',
                    'Retirar motor ventilador do evaporador, realizar limpeza e lubrificar radial e axial.',
                    'Realizar na Oficina montagem mecânica e elétrica do equipamento, testar funcionamento, vibração e atrito.',
                    'Instalar equipamento, realizar vácuo no sistema, medir superaquecimento.',
                    'Medir temperatura de insuflamento do evaporador, medir temperatura de retorno do evaporador e medir temperatura do ambiente.',
                    'Verificação estado de conservação dos cabos de alimentação e de interligação das unidades evaporadoras e condensadoras.',
                    'Verificação do estado de conservação do isolamento térmico, tubulação e conexão de cobre.'
                ]}
            ];
            for(var g = 0; g < grupos.length; g++) {
                var grupo = grupos[g];
                for(var i = 0; i < grupo.total; i++) {
                    var nome = grupo.prefixo + (i + 1);
                    var sel = document.querySelector('input[name="' + nome + '"]:checked');
                    var obsEl = document.querySelectorAll('.checklist-item')[g === 0 ? i : 6 + i];
                    var obs = '';
                    if(obsEl) {
                        var obsInput = obsEl.querySelector('.checklist-obs');
                        if(obsInput) obs = obsInput.value;
                    }
                    itens.push({
                        secao: grupo.secao,
                        num: String(i + 1).padStart(2, '0'),
                        titulo: grupo.titulos[i],
                        valor: sel ? sel.value : '',
                        obs: obs
                    });
                }
            }
            return itens;
        }


        function _pdfTextSafe(valor) {
            return String(valor == null ? '' : valor)
                .replace(/\u00A0/g, ' ')
                .replace(/[–—]/g, '-')
                .replace(/[•·]/g, '-')
                .replace(/[\u2018\u2019]/g, "'")
                .replace(/[\u201C\u201D]/g, '"');
        }


        function _pdfHeader(pdf, tipoDoc) {
            var W = pdf.internal.pageSize.getWidth(), M = 15;
            var titulo = 'DOMO DE FERRO';
            var subtitulo1 = 'MCR - Refrigeração e Climatização';
            var subtitulo2 = _pdfTextSafe((currentOM && currentOM.equipe ? currentOM.equipe : '---') + ' - S11D - Canaã dos Carajás PA');

            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(13);
            pdf.setTextColor(20, 20, 20);
            pdf.text(titulo, M, 11);

            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(7.2);
            pdf.setTextColor(90, 90, 90);
            pdf.text(subtitulo1, M, 15.2);
            pdf.text(subtitulo2, M, 18.6);

            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(11);
            pdf.setTextColor(35, 35, 35);
            pdf.text(_pdfTextSafe(tipoDoc), W - M, 11, { align: 'right' });

            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(7.2);
            pdf.setTextColor(90, 90, 90);
            pdf.text('OM ' + _pdfTextSafe(currentOM.num || '---'), W - M, 15.2, { align: 'right' });

            pdf.setDrawColor(110, 110, 110);
            pdf.setLineWidth(0.35);
            pdf.line(M, 22, W - M, 22);
            return 27;
        }


        function _pdfInfoGrid(pdf, y) {
            var W = pdf.internal.pageSize.getWidth(), M = 15;
            var tituloOM = _pdfTextSafe(currentOM.titulo || currentOM.omTitulo || '---');
            var periodoTxt = _pdfTextSafe((currentOM.inicio || '---') + ' > ' + (currentOM.fim || '---'));
            var localTxt = _pdfTextSafe((currentOM.local || '---') + (currentOM.descLocal ? ' - ' + currentOM.descLocal : ''));

            var body = [
                [
                    { content: 'OM', styles: { fontStyle: 'bold', textColor: [70,70,70] } },
                    { content: _pdfTextSafe(currentOM.num || '---') + '   ' + tituloOM, colSpan: 3, styles: { fontStyle: 'bold' } }
                ],
                [
                    { content: 'C. Trabalho', styles: { fontStyle: 'bold', textColor: [70,70,70] } },
                    { content: _pdfTextSafe(currentOM.equipe || '---') },
                    { content: 'C. Custo', styles: { fontStyle: 'bold', textColor: [70,70,70] } },
                    { content: _pdfTextSafe(currentOM.cc || '---') }
                ],
                [
                    { content: 'Equipamento', styles: { fontStyle: 'bold', textColor: [70,70,70] } },
                    { content: _pdfTextSafe(currentOM.equipamento || '---') },
                    { content: 'TAG', styles: { fontStyle: 'bold', textColor: [70,70,70] } },
                    { content: _pdfTextSafe(currentOM.tagIdentificacao || '---'), styles: { fontStyle: 'bold', textColor: [20,80,160] } }
                ],
                [
                    { content: 'Local Inst.', styles: { fontStyle: 'bold', textColor: [70,70,70] } },
                    { content: localTxt },
                    { content: 'Tipo Manut.', styles: { fontStyle: 'bold', textColor: [70,70,70] } },
                    { content: _pdfTextSafe(currentOM.tipoManut || '---') }
                ],
                [
                    { content: 'Local Sup.', styles: { fontStyle: 'bold', textColor: [70,70,70] } },
                    { content: _pdfTextSafe(currentOM.descLocalSup || '---') },
                    { content: 'Período', styles: { fontStyle: 'bold', textColor: [70,70,70] } },
                    { content: periodoTxt }
                ],
                [
                    { content: 'Plano Manut.', styles: { fontStyle: 'bold', textColor: [70,70,70] } },
                    { content: _pdfTextSafe(currentOM.planoCod || '---'), colSpan: 3 }
                ]
            ];

            if (currentOM.caracteristicas) {
                body.push([
                    { content: 'Caract. Equip.', styles: { fontStyle: 'bold', textColor: [70,70,70] } },
                    { content: _pdfTextSafe(currentOM.caracteristicas), colSpan: 3 }
                ]);
            }

            pdf.autoTable({
                startY: y,
                body: body,
                theme: 'grid',
                tableWidth: 180,
                styles: {
                    fontSize: 7,
                    cellPadding: 1.8,
                    textColor: [25,25,25],
                    lineColor: [185,185,185],
                    lineWidth: 0.2,
                    valign: 'middle',
                    overflow: 'linebreak'
                },
                columnStyles: {
                    0: { cellWidth: 28, fillColor: [245,245,245] },
                    1: { cellWidth: 62 },
                    2: { cellWidth: 28, fillColor: [245,245,245] },
                    3: { cellWidth: 62 }
                },
                margin: { left: M, right: M }
            });
            return pdf.lastAutoTable.finalY;
        }


        function _pdfSecTitle(pdf, y, titulo) {
            var W = pdf.internal.pageSize.getWidth(), M = 15;
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(8);
            pdf.setTextColor(40, 40, 40);
            pdf.text(_pdfTextSafe(titulo), M, y);
            pdf.setDrawColor(140, 140, 140);
            pdf.setLineWidth(0.3);
            pdf.line(M, y + 1.4, W - M, y + 1.4);
            return y + 5.5;
        }

        function _formatarTempo(seg) {
            if(!seg || seg <= 0) return '00:00:00';
            var h = Math.floor(seg / 3600);
            var m = Math.floor((seg % 3600) / 60);
            var s = seg % 60;
            return String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
        }


        function _pdfRodape(pdf, tipoDoc) {
            var H = 297, W = 210, M = 15;
            try { H = pdf.internal.pageSize.getHeight(); } catch(e) { H = (pdf.internal.pageSize.height || 297); }
            try { W = pdf.internal.pageSize.getWidth(); } catch(e) { W = (pdf.internal.pageSize.width || 210); }
            var totalPages = pdf.internal.getNumberOfPages();
            var dtHoje = new Date().toLocaleDateString('pt-BR');
            var lineY = H - 9;
            var textY = H - 5;
            for (var p = 1; p <= totalPages; p++) {
                pdf.setPage(p);
                pdf.setDrawColor(180, 180, 180);
                pdf.setLineWidth(0.2);
                pdf.line(M, lineY, W - M, lineY);
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(6);
                pdf.setTextColor(120, 120, 120);
                pdf.text('DOMO DE FERRO - ' + _pdfTextSafe(tipoDoc) + ' - OM ' + _pdfTextSafe(currentOM.num || '---') + ' - ' + dtHoje, M, textY);
                pdf.text(p + '/' + totalPages, W - M, textY, { align: 'right' });
            }
        }

        function _pdfPageHeight(pdf) {
            try { return pdf.internal.pageSize.getHeight(); } catch(e) { return (pdf.internal.pageSize.height || 297); }
        }

        function _pdfUsableBottom(pdf) {
            return _pdfPageHeight(pdf) - 24;
        }

        function _pdfEnsureSpace(pdf, y, requiredHeight, newPageStartY) {
            var nextStart = (newPageStartY == null ? 20 : newPageStartY);
            if ((y + (requiredHeight || 0)) > _pdfUsableBottom(pdf)) {
                pdf.addPage();
                return nextStart;
            }
            return y;
        }

        function _pdfSplitText(pdf, text, maxWidth, lineHeight) {
            var safe = _pdfTextSafe(text || '---');
            var lines = pdf.splitTextToSize(safe, maxWidth);
            if (!Array.isArray(lines)) lines = [safe];
            return {
                lines: lines,
                height: Math.max(lineHeight || 4, lines.length * (lineHeight || 4))
            };
        }

        function _pdfSection(pdf, y, titulo, minBodyHeight) {
            y = _pdfEnsureSpace(pdf, y, 5.5 + (minBodyHeight || 0), 20);
            return _pdfSecTitle(pdf, y, titulo);
        }

        function _pdfDrawObservationTable(pdf, y, titulo, texto) {
            if (!texto) return y;
            var M = 15;
            y = _pdfSection(pdf, y, titulo, 18);
            pdf.autoTable({
                startY: y,
                body: [[{ content: _pdfTextSafe(texto), styles: { fillColor: [248,248,248] } }]],
                theme: 'grid',
                tableWidth: 180,
                styles: {
                    fontSize: 7.2,
                    cellPadding: 2.4,
                    textColor: [40,40,40],
                    lineColor: [200,200,200],
                    lineWidth: 0.18,
                    overflow: 'linebreak',
                    valign: 'top'
                },
                columnStyles: { 0: { cellWidth: 180 } },
                margin: { left: M, right: M }
            });
            return pdf.lastAutoTable.finalY + 8;
        }

        function _pdfDrawSignatureBlock(pdf, y, tituloAss, opts) {
            opts = opts || {};
            var W = 210, M = 15;
            try { W = pdf.internal.pageSize.getWidth(); } catch(e) { W = (pdf.internal.pageSize.width || 210); }

            var executantes = Array.isArray(opts.executantes) && opts.executantes.length ? opts.executantes.join(', ') : '---';
            var execInfo = _pdfSplitText(pdf, executantes, W - M * 2 - 30, 3.8);
            var signHeight = 26;
            var fiscalExtra = opts.fiscalName ? 8 : 0;
            var totalHeight = 5.5 + execInfo.height + 8 + signHeight + fiscalExtra + 6;

            y = _pdfEnsureSpace(pdf, y, totalHeight, 20);
            y = _pdfSecTitle(pdf, y, tituloAss);

            pdf.setFontSize(7.5);
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(100, 100, 100);
            pdf.text('Executante(s):', M, y);

            pdf.setFont(undefined, 'normal');
            pdf.setTextColor(30, 30, 30);
            pdf.text(execInfo.lines, M + 28, y);
            y += execInfo.height + 6;

            pdf.setDrawColor(180, 180, 180);
            pdf.setLineWidth(0.2);
            pdf.setFillColor(252, 252, 252);
            pdf.rect(M, y, 82, signHeight, 'FD');

            if (opts.assinatura) {
                try { pdf.addImage(opts.assinatura, 'PNG', M + 1, y + 1, 80, signHeight - 2); } catch(e) {}
            }

            var xMeta = M + 88;
            var agora = new Date();
            pdf.setFontSize(7.5);

            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(100, 100, 100);
            pdf.text('Data:', xMeta, y + 7);
            pdf.setFont(undefined, 'normal');
            pdf.setTextColor(30, 30, 30);
            pdf.text(agora.toLocaleDateString('pt-BR'), xMeta + 14, y + 7);

            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(100, 100, 100);
            pdf.text('Hora:', xMeta, y + 13);
            pdf.setFont(undefined, 'normal');
            pdf.setTextColor(30, 30, 30);
            pdf.text(agora.toLocaleTimeString('pt-BR'), xMeta + 14, y + 13);

            if (opts.fiscalName) {
                pdf.setFont(undefined, 'bold');
                pdf.setTextColor(40, 40, 40);
                pdf.setFontSize(7);
                pdf.text('ASSINADO PELO FISCAL: ' + _pdfTextSafe(String(opts.fiscalName).toUpperCase()), M, y + signHeight + 6);
            }

            return y + signHeight + fiscalExtra + 6;
        }

        function gerarPDFChecklist() {
            var jsPDF = window.jspdf.jsPDF;
            var pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            var M = 15;
            var cinzaHdr = [74, 74, 74];
            var tipoChk = _detectarTipoChecklist();
            if(tipoChk === 'MISTO') tipoChk = 'MENSAL';
            var tituloPDF = 'CHECKLIST ' + tipoChk;
            var y = _pdfHeader(pdf, tituloPDF);
            y = _pdfSection(pdf, y, 'INFORMACOES DA ORDEM', 18);
            y = _pdfInfoGrid(pdf, y) + 8;
            y = _pdfSection(pdf, y, 'ITENS DO CHECKLIST', 18);

            var itens = currentOM.checklistDados || coletarChecklistDados();
            var secaoAtual = '';
            var rows = [];
            for (var i = 0; i < itens.length; i++) {
                var item = itens[i];
                if (item.secao !== secaoAtual) {
                    rows.push([{ content: item.secao, colSpan: 4, styles: { fontStyle: 'bold', fillColor: [245,245,245], textColor: [35,35,35], fontSize: 7.5, cellPadding: 2.5 } }]);
                    secaoAtual = item.secao;
                }
                rows.push([
                    { content: item.num || (i + 1).toString(), styles: { halign: 'center', fontSize: 7 } },
                    { content: item.titulo || '' },
                    { content: item.valor === 'normal' ? 'NORMAL' : (item.valor === 'anormal' ? 'ANORMAL' : '—'), styles: { halign: 'center', fontStyle: 'bold' } },
                    { content: item.obs || '' }
                ]);
            }

            pdf.autoTable({
                startY: y,
                head: [['#', 'Item', 'Status', 'Observacao']],
                body: rows,
                theme: 'grid',
                tableWidth: 180,
                headStyles: { fillColor: cinzaHdr, textColor: [255,255,255], fontSize: 6.5, fontStyle: 'bold', cellPadding: 1.8 },
                bodyStyles: { fontSize: 6.5, cellPadding: 1.7, textColor: [30,30,30], lineColor: [205,205,205], lineWidth: 0.15, overflow: 'linebreak' },
                columnStyles: { 0: { cellWidth: 10, halign: 'center' }, 1: { cellWidth: 98 }, 2: { cellWidth: 22, halign: 'center' }, 3: { cellWidth: 50 } },
                didParseCell: function(data) {
                    if (data.column.index === 2 && data.section === 'body') {
                        if(data.cell.text[0] === 'ANORMAL') {
                            data.cell.styles.textColor = [200, 30, 30];
                            data.cell.styles.fillColor = [255, 235, 235];
                        } else if(data.cell.text[0] === '—') {
                            data.cell.styles.textColor = [170, 170, 170];
                        }
                    }
                },
                margin: { left: M, right: M }
            });
            y = pdf.lastAutoTable.finalY + 8;

            var tipoAss = (currentOM.pendenteAssinatura || isCancelamento) ? 'ASSINATURA DO FISCAL' : 'ASSINATURA DO CLIENTE / RESPONSAVEL';
            y = _pdfDrawSignatureBlock(pdf, y, tipoAss, {
                assinatura: currentOM.assinaturaCliente,
                executantes: executantesNomes,
                fiscalName: currentOM.nomeFiscal || ''
            });

            _pdfRodape(pdf, tituloPDF);
            var pdfBase64 = pdf.output('dataurlstring');
            return PdfDB.put('ck_' + currentOM.num + (currentOM.execTs ? '_' + currentOM.execTs : ''), pdfBase64);
        }

        function gerarPDFNaoConformidade() {
            var fotos = currentOM.checklistFotos || {};
            var allTitulos = checklistItens.mensal.concat(checklistItens.trimestral);
            var allNomes = [];
            for (var i = 0; i < 6; i++) allNomes.push('m' + (i + 1));
            for (var j = 0; j < 9; j++) allNomes.push('t' + (j + 1));

            var itensAnormais = [];
            for (var z = 0; z < allNomes.length; z++) {
                var n = allNomes[z];
                if (fotos[n] && fotos[n].antes) {
                    itensAnormais.push({
                        nome: n,
                        titulo: allTitulos[z],
                        antes: fotos[n].antes,
                        depois: fotos[n].depois || null,
                        explicacao: fotos[n].explicacao || ''
                    });
                }
            }
            if (itensAnormais.length === 0) return;

            var jsPDF = window.jspdf.jsPDF;
            var pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            var W = 210, M = 15;

            var y = _pdfHeader(pdf, 'RELATORIO DE NAO CONFORMIDADE');
            y = _pdfSection(pdf, y, 'INFORMACOES DA ORDEM', 18);
            y = _pdfInfoGrid(pdf, y) + 8;
            y = _pdfSection(pdf, y, 'NAO CONFORMIDADES IDENTIFICADAS  (' + itensAnormais.length + ')', 18);

            var resumoBody = itensAnormais.map(function(it, idx) {
                return [
                    { content: (idx + 1).toString(), styles: { halign: 'center' } },
                    { content: it.nome.toUpperCase() },
                    { content: it.titulo }
                ];
            });
            pdf.autoTable({
                startY: y,
                head: [['#', 'Ref.', 'Descricao do Item']],
                body: resumoBody,
                theme: 'grid',
                tableWidth: 180,
                headStyles: { fillColor: [74,74,74], textColor: [255,255,255], fontSize: 6, fontStyle: 'bold', cellPadding: 1.5 },
                bodyStyles: { fontSize: 6.2, cellPadding: 1.55, textColor: [30,30,30], lineColor: [205,205,205], lineWidth: 0.15, overflow: 'linebreak' },
                columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 18 }, 2: { cellWidth: 152 } },
                margin: { left: M, right: M }
            });
            y = pdf.lastAutoTable.finalY + 10;

            for (var i = 0; i < itensAnormais.length; i++) {
                var item = itensAnormais[i];
                var tituloItem = 'NC #' + (i + 1) + ' - ' + item.nome.toUpperCase() + ' - ' + item.titulo;
                var titleInfo = _pdfSplitText(pdf, tituloItem, W - M * 2 - 6, 3.8);
                var headerH = Math.max(10, titleInfo.height + 4);

                y = _pdfEnsureSpace(pdf, y, headerH + 10, 20);

                pdf.setFillColor(246, 246, 246);
                pdf.setDrawColor(140, 140, 140);
                pdf.setLineWidth(0.3);
                pdf.rect(M, y - 1, W - M * 2, headerH, 'FD');
                pdf.setFontSize(8.2);
                pdf.setFont(undefined, 'bold');
                pdf.setTextColor(30, 30, 30);
                pdf.text(titleInfo.lines, M + 3, y + 4);
                y += headerH + 4;

                if (item.explicacao) {
                    pdf.autoTable({
                        startY: y,
                        body: [[
                            { content: 'Descricao / Explicacao', styles: { fontStyle: 'bold', textColor: [100,100,100], fillColor: [246,246,246] } },
                            { content: _pdfTextSafe(item.explicacao) }
                        ]],
                        theme: 'grid',
                        tableWidth: 180,
                        styles: { fontSize: 7, cellPadding: 1.8, textColor: [30,30,30], lineColor: [200,200,200], lineWidth: 0.15, overflow: 'linebreak' },
                        columnStyles: { 0: { cellWidth: 32 }, 1: { cellWidth: 148 } },
                        margin: { left: M, right: M }
                    });
                    y = pdf.lastAutoTable.finalY + 5;
                }

                var imgW = 82, imgH = 58;
                y = _pdfEnsureSpace(pdf, y, imgH + 12, 20);
                pdf.setFontSize(7);
                pdf.setFont(undefined, 'bold');
                pdf.setTextColor(80, 80, 80);
                pdf.text('ANTES', M, y);
                if (item.depois) pdf.text('DEPOIS', M + imgW + 8, y);
                y += 3;

                pdf.setDrawColor(180, 180, 180);
                pdf.setLineWidth(0.2);
                pdf.setFillColor(248, 248, 248);
                pdf.rect(M, y, imgW, imgH, 'FD');
                if (item.antes) {
                    try { pdf.addImage(item.antes, 'JPEG', M + 0.5, y + 0.5, imgW - 1, imgH - 1); } catch(e) {}
                }
                if (item.depois) {
                    pdf.rect(M + imgW + 8, y, imgW, imgH, 'FD');
                    try { pdf.addImage(item.depois, 'JPEG', M + imgW + 8.5, y + 0.5, imgW - 1, imgH - 1); } catch(e) {}
                }
                y += imgH + 14;
            }

            var tituloAss = currentOM.nomeFiscal ? 'ASSINATURA DO FISCAL' : 'ASSINATURA DO RESPONSAVEL';
            y = _pdfDrawSignatureBlock(pdf, y, tituloAss, {
                assinatura: currentOM.assinaturaCliente,
                executantes: executantesNomes,
                fiscalName: currentOM.nomeFiscal || ''
            });

            _pdfRodape(pdf, 'RELATORIO DE NAO CONFORMIDADE');
            var pdfBase64 = pdf.output('dataurlstring');
            return PdfDB.put('nc_' + currentOM.num + (currentOM.execTs ? '_' + currentOM.execTs : ''), pdfBase64);
        }

        function salvarComAssinatura() {
            const imgData = canvas.toDataURL();
            const isCanvasBlank = !ctx.getImageData(0, 0, canvas.width, canvas.height).data.some(c => c !== 0);
            
            if(isCanvasBlank) {
                alert('⚠️ Assinatura obrigatória!\n\nOu clique em "Finalizar Sem Assinatura"');
                return;
            }
            
            if(currentOM.planoCod || currentOM.checklistCorretiva) {
                var faltando = validarChecklist();
                if(faltando.length > 0) {
                    alert('⚠️ CHECKLIST INCOMPLETO!\n\n' + faltando.join('\n\n'));
                    return;
                }
            }

            omAssinada = true;
            const obs = $('observacoes').value;
            
            currentOM.assinaturaCliente = imgData;
            currentOM.observacoes = obs;
            currentOM.materiaisUsados = [...materiaisUsados];
            currentOM.finalizada = true;
            currentOM.pendenteAssinatura = false;
            currentOM.lockDeviceId = null;
            currentOM.dataFinalizacao = new Date().toISOString();
            currentOM._deslocSegundosSnapshot = deslocamentoSegundos;
            currentOM.execTs = Date.now();
            if(currentOM.planoCod || currentOM.checklistCorretiva) {
                var _tc = _detectarTipoChecklist();
                currentOM.tipoChecklist = _tc === 'MISTO' ? 'MENSAL' : _tc;
            }
            
            var _pdfPromises = [];
            _pdfPromises.push(gerarEArmazenarPDF());
            
            if(currentOM.planoCod || currentOM.checklistCorretiva) {
                if(!currentOM.checklistDados) { currentOM.checklistDados = coletarChecklistDados(); }
                if(!currentOM.checklistFotos) currentOM.checklistFotos = checklistFotos;
                _pdfPromises.push(gerarPDFChecklist());
            }

            if(currentOM.checklistFotos && Object.keys(currentOM.checklistFotos).some(function(k){return!!(currentOM.checklistFotos[k]||{}).antes;})) {
                _pdfPromises.push(gerarPDFNaoConformidade());
                currentOM._hasNcPdf = true;
            }

            _removerDesvioAcumulado(currentOM.num);
            var _tipoHist = isCancelamento ? 'CANCELADO' : 'ATENDIDO';
            _gravarDashboardLog(_tipoHist, currentOM);
            _acumularDadosExcel(currentOM);
            
            moverParaHistorico(currentOM, _tipoHist);
            
            const idx = oms.findIndex(om => om.num === currentOM.num);
            if(idx >= 0) {
                oms.splice(idx, 1);
            }
            
            localStorage.removeItem(STORAGE_KEY_CURRENT);
            salvarOMs();
            
            _pushOMStatusSupabase(currentOM);
            Promise.all(_pdfPromises.map(function(p){ return p && p.catch ? p.catch(function(){}) : Promise.resolve(); })).then(function() {
                _uploadPDFRelatorio(currentOM.num);
            });
            
            alert('✅ OM SALVA E SINCRONIZADA!\n\nPDF gerado e armazenado.');
            hideFinalizar();
            hideDetail();
            filtrarOMs();
        }

        function finalizarSemAssinatura() {
            if(currentOM.planoCod || currentOM.checklistCorretiva) {
                var faltando = validarChecklist();
                if(faltando.length > 0) {
                    alert('⚠️ CHECKLIST INCOMPLETO!\n\n' + faltando.join('\n\n'));
                    return;
                }
            }

            if(!confirm('⚠️ Finalizar SEM assinatura?\n\nOM ficará com status PENDENTE ASSINATURA')) {
                return;
            }
            
            omAssinada = false;
            const obs = $('observacoes').value;
            
            currentOM.pendenteAssinatura = true;
            currentOM.materiaisUsados = [...materiaisUsados];
            currentOM.observacoes = obs;
            currentOM.lockDeviceId = null;
            currentOM._deslocSegundosSnapshot = deslocamentoSegundos;
            
            if(currentOM.planoCod || currentOM.checklistCorretiva) {
                currentOM.checklistDados = coletarChecklistDados();
                currentOM.checklistFotos = checklistFotos;
                var _tc2 = _detectarTipoChecklist();
                currentOM.tipoChecklist = _tc2 === 'MISTO' ? 'MENSAL' : _tc2;
            }
            
            localStorage.removeItem(STORAGE_KEY_CURRENT);
            salvarOMs();
            
            var _pdfPromises2 = [];
            _pdfPromises2.push(gerarEArmazenarPDF());

            if(currentOM.planoCod || currentOM.checklistCorretiva) {
                if(!currentOM.checklistDados) currentOM.checklistDados = coletarChecklistDados();
                if(!currentOM.checklistFotos) currentOM.checklistFotos = checklistFotos;
                _pdfPromises2.push(gerarPDFChecklist());
            }

            if(currentOM.checklistFotos && Object.keys(currentOM.checklistFotos).some(function(k){return!!(currentOM.checklistFotos[k]||{}).antes;})) {
                _pdfPromises2.push(gerarPDFNaoConformidade());
                currentOM._hasNcPdf = true;
            }

            _pushOMStatusSupabase(currentOM);
            Promise.all(_pdfPromises2.map(function(p){ return p && p.catch ? p.catch(function(){}) : Promise.resolve(); })).then(function() {
                _uploadPDFRelatorio(currentOM.num);
            });
            
            alert('⚠️ OM PENDENTE ASSINATURA\n\nClique 3x na OM para assinar como fiscal.');
            hideFinalizar();
            hideDetail();
            filtrarOMs();
        }

        function gerarEArmazenarPDF() {
            var jsPDF = window.jspdf.jsPDF;
            var pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            var W = 210, M = 15;
            var tipoDoc = 'RELATORIO DE EXECUCAO';
            if(isCancelamento) tipoDoc = 'RELATORIO DE CANCELAMENTO';
            if(currentOM.statusDesvio === 'AGUARDANDO REPROGRAMACAO') tipoDoc = 'RELATORIO DE REPROGRAMACAO';

            var y = _pdfHeader(pdf, tipoDoc);
            y = _pdfSection(pdf, y, 'INFORMACOES DA ORDEM', 18);
            y = _pdfInfoGrid(pdf, y) + 8;

            if (isCancelamento) {
                y = _pdfSection(pdf, y, 'DADOS DO CANCELAMENTO', 18);
                var cancelBody = [
                    [{ content: 'Codigo de Desvio', styles: { fontStyle: 'bold', textColor: [100,100,100], fillColor: [246,246,246] } }, { content: currentOM.desvio || '---', colSpan: 3 }]
                ];
                if (currentOM.justificativaCancelamento) {
                    cancelBody.push([{ content: 'Justificativa', styles: { fontStyle: 'bold', textColor: [100,100,100], fillColor: [246,246,246] } }, { content: currentOM.justificativaCancelamento, colSpan: 3 }]);
                }
                pdf.autoTable({
                    startY: y,
                    body: cancelBody,
                    theme: 'grid',
                    tableWidth: 180,
                    styles: { fontSize: 6.5, cellPadding: 1.5, textColor: [30,30,30], lineColor: [200,200,200], lineWidth: 0.15, overflow: 'linebreak' },
                    columnStyles: { 0: { cellWidth: 28 }, 1: { cellWidth: 152 } },
                    margin: { left: M, right: M }
                });
                y = pdf.lastAutoTable.finalY + 8;
            }

            if (currentOM.statusDesvio === 'AGUARDANDO REPROGRAMACAO' && currentOM.motivoReprogramacao) {
                y = _pdfSection(pdf, y, 'DADOS DA REPROGRAMACAO', 18);
                var repBody = [
                    [{ content: 'Motivo', styles: { fontStyle: 'bold', textColor: [100,100,100], fillColor: [246,246,246] } }, { content: currentOM.motivoReprogramacao, colSpan: 3 }]
                ];
                pdf.autoTable({
                    startY: y,
                    body: repBody,
                    theme: 'grid',
                    tableWidth: 180,
                    styles: { fontSize: 6.5, cellPadding: 1.5, textColor: [30,30,30], lineColor: [200,200,200], lineWidth: 0.15, overflow: 'linebreak' },
                    columnStyles: { 0: { cellWidth: 28 }, 1: { cellWidth: 152 } },
                    margin: { left: M, right: M }
                });
                y = pdf.lastAutoTable.finalY + 8;
            }

            if (currentOM.historicoExecucao && currentOM.historicoExecucao.length > 0) {
                y = _pdfSection(pdf, y, 'DESLOCAMENTO', 18);
                var deslBody = [];
                var totalDeslSeg = 0;
                var pessoalN = 0;
                for (var h = 0; h < currentOM.historicoExecucao.length; h++) {
                    var hist = currentOM.historicoExecucao[h];
                    var execs = hist.executantes || [];
                    var numExec = execs.length || 1;
                    var deslSeg = (hist.deslocamentoSegundos !== undefined) ? hist.deslocamentoSegundos : ((hist.deslocamentoMinutos || 0) * 60);
                    if((hist.tag === 'OFICINA') || deslSeg <= 0) continue;
                    var dIni = hist.deslocamentoHoraInicio ? new Date(hist.deslocamentoHoraInicio) : null;
                    var dFim = hist.deslocamentoHoraFim ? new Date(hist.deslocamentoHoraFim) : null;
                    var dataIniStr = dIni ? dIni.toLocaleDateString('pt-BR') : '--/--/--';
                    var dataFimStr = dFim ? dFim.toLocaleDateString('pt-BR') : '--/--/--';
                    var horaIniStr = dIni ? dIni.toLocaleTimeString('pt-BR') : '--:--:--';
                    var horaFimStr = dFim ? dFim.toLocaleTimeString('pt-BR') : '--:--:--';
                    var tempoStr = _formatarTempo(deslSeg);
                    var causaStr = '002';
                    for (var e = 0; e < numExec; e++) {
                        pessoalN++;
                        totalDeslSeg += deslSeg;
                        deslBody.push([
                            { content: currentOM.num, styles: { fontSize: 5.5, halign: 'center' } },
                            { content: String(pessoalN), styles: { halign: 'center', fontSize: 6 } },
                            { content: dataIniStr, styles: { halign: 'center', fontSize: 6 } },
                            { content: horaIniStr, styles: { halign: 'center', fontSize: 6 } },
                            { content: dataFimStr, styles: { halign: 'center', fontSize: 6 } },
                            { content: horaFimStr, styles: { halign: 'center', fontSize: 6 } },
                            { content: tempoStr, styles: { halign: 'center', fontStyle: 'bold', fontSize: 6.5 } },
                            { content: causaStr, styles: { halign: 'center', fontSize: 6 } }
                        ]);
                    }
                }
                if(deslBody.length === 0) {
                    deslBody.push([
                        { content: currentOM.num, styles: { fontSize: 5.5, halign: 'center' } },
                        { content: '-', styles: { halign: 'center', fontSize: 6 } },
                        { content: '--/--/--', styles: { halign: 'center', fontSize: 6 } },
                        { content: '--:--:--', styles: { halign: 'center', fontSize: 6 } },
                        { content: '--/--/--', styles: { halign: 'center', fontSize: 6 } },
                        { content: '--:--:--', styles: { halign: 'center', fontSize: 6 } },
                        { content: 'SEM DESLOCAMENTO', styles: { halign: 'center', fontStyle: 'bold', fontSize: 6.5 } },
                        { content: '-', styles: { halign: 'center', fontSize: 6 } }
                    ]);
                }
                var stlTot = { halign: 'center', fontStyle: 'bold', fontSize: 7, fillColor: [90,90,90], textColor: [255,255,255] };
                deslBody.push([
                    { content: '', styles: stlTot }, { content: '', styles: stlTot }, { content: '', styles: stlTot }, { content: '', styles: stlTot },
                    { content: '', styles: stlTot }, { content: '', styles: stlTot }, { content: _formatarTempo(totalDeslSeg), styles: stlTot }, { content: '', styles: stlTot }
                ]);
                pdf.autoTable({
                    startY: y,
                    head: [['OM', 'N\u00ba Pessoal', 'Inic. Exec', 'Inic. Exec', 'Fim Exec', 'Fim Exec', 'Tempo', 'Causa']],
                    body: deslBody,
                    theme: 'grid',
                    tableWidth: 180,
                    headStyles: { fillColor: [70,70,70], textColor: [255,255,255], fontSize: 5.5, fontStyle: 'bold', cellPadding: 1.5, halign: 'center' },
                    bodyStyles: { fontSize: 6.1, cellPadding: 1.5, textColor: [30,30,30], lineColor: [205,205,205], lineWidth: 0.15, overflow: 'linebreak' },
                    columnStyles: { 0: { cellWidth: 24 }, 1: { cellWidth: 16 }, 2: { cellWidth: 22 }, 3: { cellWidth: 20 }, 4: { cellWidth: 22 }, 5: { cellWidth: 20 }, 6: { cellWidth: 42 }, 7: { cellWidth: 14 } },
                    margin: { left: M, right: M }
                });
                y = pdf.lastAutoTable.finalY + 6;

                y = _pdfSection(pdf, y, 'ETAPAS DA EXECUCAO', 18);
                var etapasBody = [];
                for (var eh = 0; eh < currentOM.historicoExecucao.length; eh++) {
                    var hx = currentOM.historicoExecucao[eh] || {};
                    var ei = hx.dataInicio ? new Date(hx.dataInicio) : null;
                    var ef = hx.dataFim ? new Date(hx.dataFim) : null;
                    var tagEt = hx.tag || 'ATIVIDADE';
                    var execLabel = (hx.executantes && hx.executantes.length) ? hx.executantes.join(', ') : '---';
                    etapasBody.push([
                        { content: String(eh + 1), styles: { halign: 'center', fontSize: 6 } },
                        { content: tagEt, styles: { halign: 'center', fontSize: 6, fontStyle: 'bold' } },
                        { content: execLabel, styles: { fontSize: 6 } },
                        { content: ei ? ei.toLocaleDateString('pt-BR') + ' ' + ei.toLocaleTimeString('pt-BR') : '--', styles: { halign: 'center', fontSize: 6 } },
                        { content: ef ? ef.toLocaleDateString('pt-BR') + ' ' + ef.toLocaleTimeString('pt-BR') : '--', styles: { halign: 'center', fontSize: 6 } },
                        { content: (Number(hx.hhAtividade || 0)).toFixed(2) + 'h', styles: { halign: 'center', fontSize: 6 } },
                        { content: (Number(hx.hhDeslocamento || 0)).toFixed(2) + 'h', styles: { halign: 'center', fontSize: 6 } }
                    ]);
                }
                if(etapasBody.length === 0) {
                    etapasBody.push([{ content: 'Sem etapas registradas', colSpan: 7, styles: { halign: 'center', fontSize: 6.2, textColor: [110,110,110] } }]);
                }
                pdf.autoTable({
                    startY: y,
                    head: [['#', 'Etapa', 'Executantes', 'Início', 'Fim', 'HH Ativ.', 'HH Desl.']],
                    body: etapasBody,
                    theme: 'grid',
                    tableWidth: 180,
                    headStyles: { fillColor: [70,70,70], textColor: [255,255,255], fontSize: 6, fontStyle: 'bold', cellPadding: 1.5, halign: 'center' },
                    bodyStyles: { fontSize: 6.1, cellPadding: 1.5, textColor: [30,30,30], lineColor: [205,205,205], lineWidth: 0.15, overflow: 'linebreak' },
                    columnStyles: { 0: { cellWidth: 8 }, 1: { cellWidth: 20 }, 2: { cellWidth: 45 }, 3: { cellWidth: 34 }, 4: { cellWidth: 34 }, 5: { cellWidth: 19.5 }, 6: { cellWidth: 19.5 } },
                    margin: { left: M, right: M }
                });
                y = pdf.lastAutoTable.finalY + 6;

                y = _pdfSection(pdf, y, 'ATIVIDADE', 18);
                var ativBody = [];
                var totalAtivSeg = 0;
                var pessoalNA = 0;
                for (var h2 = 0; h2 < currentOM.historicoExecucao.length; h2++) {
                    var hist2 = currentOM.historicoExecucao[h2];
                    var execs2 = hist2.executantes || [];
                    var numExec2 = execs2.length || 1;
                    var aIni = hist2.dataInicio ? new Date(hist2.dataInicio) : null;
                    var aFim = hist2.dataFim ? new Date(hist2.dataFim) : null;
                    var ativSeg = 0;
                    if (aIni && aFim && !hist2.desvio) ativSeg = Math.floor((aFim - aIni) / 1000) - (hist2.tempoPausadoTotal || 0);
                    var dataIniStr2 = aIni ? aIni.toLocaleDateString('pt-BR') : '--/--/--';
                    var dataFimStr2 = aFim ? aFim.toLocaleDateString('pt-BR') : '--/--/--';
                    var horaIniStr2 = aIni ? aIni.toLocaleTimeString('pt-BR') : '--:--:--';
                    var horaFimStr2 = aFim ? aFim.toLocaleTimeString('pt-BR') : '--:--:--';
                    var tempoStr2 = _formatarTempo(ativSeg);
                    for (var e2 = 0; e2 < numExec2; e2++) {
                        pessoalNA++;
                        totalAtivSeg += ativSeg;
                        ativBody.push([
                            { content: currentOM.num, styles: { fontSize: 6, halign: 'center' } },
                            { content: String(pessoalNA), styles: { halign: 'center', fontSize: 6 } },
                            { content: dataIniStr2, styles: { halign: 'center', fontSize: 6 } },
                            { content: horaIniStr2, styles: { halign: 'center', fontSize: 6 } },
                            { content: dataFimStr2, styles: { halign: 'center', fontSize: 6 } },
                            { content: horaFimStr2, styles: { halign: 'center', fontSize: 6 } },
                            { content: tempoStr2, styles: { halign: 'center', fontStyle: 'bold', fontSize: 6.5 } }
                        ]);
                    }
                }
                ativBody.push([
                    { content: '', styles: stlTot }, { content: '', styles: stlTot }, { content: '', styles: stlTot }, { content: '', styles: stlTot },
                    { content: '', styles: stlTot }, { content: '', styles: stlTot }, { content: _formatarTempo(totalAtivSeg), styles: stlTot }
                ]);
                pdf.autoTable({
                    startY: y,
                    head: [['OM', 'N\u00ba Pessoal', 'Inic. Exec', 'Inic. Exec', 'Fim Exec', 'Fim Exec', 'Tempo']],
                    body: ativBody,
                    theme: 'grid',
                    tableWidth: 180,
                    headStyles: { fillColor: [70,70,70], textColor: [255,255,255], fontSize: 6, fontStyle: 'bold', cellPadding: 1.5, halign: 'center' },
                    bodyStyles: { fontSize: 6.2, cellPadding: 1.55, textColor: [30,30,30], lineColor: [205,205,205], lineWidth: 0.15, overflow: 'linebreak' },
                    columnStyles: { 0: { cellWidth: 26 }, 1: { cellWidth: 18 }, 2: { cellWidth: 26 }, 3: { cellWidth: 22 }, 4: { cellWidth: 26 }, 5: { cellWidth: 22 }, 6: { cellWidth: 40 } },
                    margin: { left: M, right: M }
                });
                y = pdf.lastAutoTable.finalY + 6;

                var totalGeralSeg = totalDeslSeg + totalAtivSeg;
                var classifGeral = { normal: 0, extra: 0, noturno: 0 };
                for (var h3 = 0; h3 < currentOM.historicoExecucao.length; h3++) {
                    var hist3 = currentOM.historicoExecucao[h3];
                    var numExec3 = (hist3.executantes || []).length || 1;
                    var cl = classificarHoras(hist3.deslocamentoHoraInicio || hist3.dataInicio, hist3.dataFim);
                    classifGeral.normal += cl.normal * numExec3;
                    classifGeral.extra += cl.extra * numExec3;
                    classifGeral.noturno += cl.noturno * numExec3;
                }
                var _devOM = currentOM.desviosRegistrados || [];
                var _devLocal = _getDesviosDaOM(currentOM.num);
                var _devAll = _devOM.length > 0 ? _devOM : _devLocal;
                var totalDevSegResumo = 0;
                for (var dd = 0; dd < _devAll.length; dd++) totalDevSegResumo += (_devAll[dd].tempoSegundos || 0);
                var totalComDesvio = totalGeralSeg + totalDevSegResumo;
                var resumoBody = [[
                    { content: _formatarTempo(totalDeslSeg), styles: { halign: 'center', fontStyle: 'bold', fontSize: 6 } },
                    { content: _formatarTempo(totalAtivSeg), styles: { halign: 'center', fontStyle: 'bold', fontSize: 6 } },
                    { content: _formatarTempo(totalDevSegResumo), styles: { halign: 'center', fontStyle: 'bold', fontSize: 6, textColor: totalDevSegResumo > 0 ? [180,0,0] : [30,30,30] } },
                    { content: String(pessoalN || pessoalNA || 0), styles: { halign: 'center', fontStyle: 'bold', fontSize: 6 } },
                    { content: _formatarTempo(totalComDesvio), styles: { halign: 'center', fontStyle: 'bold', fontSize: 6.5 } },
                    { content: classifGeral.normal.toFixed(2) + 'h', styles: { halign: 'center', fontStyle: 'bold', fontSize: 6, textColor: [30,30,30] } },
                    { content: classifGeral.extra.toFixed(2) + 'h', styles: { halign: 'center', fontStyle: 'bold', fontSize: 6, textColor: [30,30,30] } },
                    { content: classifGeral.noturno.toFixed(2) + 'h', styles: { halign: 'center', fontStyle: 'bold', fontSize: 6, textColor: [30,30,30] } }
                ]];
                pdf.autoTable({
                    startY: y,
                    head: [['Desloc.', 'Ativid.', 'Desvios', 'N\u00ba Pess.', 'TOTAL', 'Normal', 'Extra', 'Noturno']],
                    body: resumoBody,
                    theme: 'grid',
                    tableWidth: 180,
                    headStyles: { fillColor: [70,70,70], textColor: [255,255,255], fontSize: 6.2, fontStyle: 'bold', cellPadding: 1.6, halign: 'center' },
                    bodyStyles: { fontSize: 6.3, cellPadding: 1.8, textColor: [30,30,30], lineColor: [205,205,205], lineWidth: 0.15, overflow: 'linebreak' },
                    columnStyles: { 0: { cellWidth: 22 }, 1: { cellWidth: 22 }, 2: { cellWidth: 22 }, 3: { cellWidth: 18 }, 4: { cellWidth: 24 }, 5: { cellWidth: 24 }, 6: { cellWidth: 24 }, 7: { cellWidth: 24 } },
                    margin: { left: M, right: M }
                });
                y = pdf.lastAutoTable.finalY + 8;
            }

            var mats = currentOM.materiaisUsados || materiaisUsados || [];
            if(!mats || mats.length === 0) {
                var histM = Array.isArray(currentOM.historicoExecucao) ? currentOM.historicoExecucao : [];
                var agg = {};
                for (var hm = 0; hm < histM.length; hm++) {
                    var arrM = Array.isArray(histM[hm].materiaisUsados) ? histM[hm].materiaisUsados : [];
                    for (var mm = 0; mm < arrM.length; mm++) {
                        var im = arrM[mm] || {};
                        var kM = [im.codigo || '', im.nome || '', im.unidade || '', im.precoUnit || 0, im.tipo || ''].join('|');
                        if(!agg[kM]) agg[kM] = { codigo: im.codigo || '', nome: im.nome || '', unidade: im.unidade || '', precoUnit: Number(im.precoUnit || 0), qtd: 0, total: 0, tipo: im.tipo || 'Pricelist', bdiPercentual: Number(im.bdiPercentual || 0), bdiValor: Number(im.bdiValor || 0) };
                        agg[kM].qtd += Number(im.qtd || 0);
                        agg[kM].total += Number(im.total || 0);
                    }
                }
                mats = Object.keys(agg).map(function(k){ return agg[k]; });
            }
            if (mats.length > 0 || true) {
                y = _pdfSection(pdf, y, 'MATERIAIS UTILIZADOS', 18);
                var tituloMat = currentOM.titulo || '';
                var matBody = [];
                var totalMat = 0;
                var bmLabel = configBM.numero ? ('BM ' + configBM.numero + (configBM.dataInicio ? ' - ' + configBM.dataInicio + ' a ' + configBM.dataFim : '')) : '';
                if (bmLabel) {
                    pdf.setFontSize(6);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text(bmLabel, M, y);
                    y += 4;
                }
                for (var m = 0; m < mats.length; m++) {
                    var mat = mats[m];
                    var vlTotal = mat.total || 0;
                    totalMat += vlTotal;
                    var ct2 = mat.tipo || 'Pricelist';
                    var bdiStr = mat.bdiPercentual > 0 ? mat.bdiValor.toFixed(2) : '';
                    matBody.push([
                        { content: currentOM.num, styles: { halign: 'center', fontSize: 5.6, textColor: [10,10,10], fontStyle: 'bold' } },
                        { content: tituloMat, styles: { fontSize: 4.9, textColor: [10,10,10] } },
                        { content: configTipoSolicitacao, styles: { fontSize: 4.9, textColor: [10,10,10] } },
                        { content: mat.codigo || '—', styles: { halign: 'center', fontSize: 5.8, textColor: [10,10,10], fontStyle: 'bold' } },
                        { content: ct2, styles: { halign: 'center', fontSize: 4.9, fontStyle: 'bold', textColor: ct2 === 'Material Vale' ? [200,0,0] : (ct2 === 'Extraordinário' ? [190,90,0] : [10,10,10]) } },
                        { content: mat.nome || '---', styles: { fontSize: 4.9, textColor: [10,10,10] } },
                        { content: mat.unidade || '—', styles: { halign: 'center', fontSize: 5.4, textColor: [10,10,10] } },
                        { content: (mat.qtd || 0).toString(), styles: { halign: 'center', fontSize: 5.4, textColor: [10,10,10] } },
                        { content: mat.precoUnit > 0 ? 'R$ ' + (mat.precoUnit || 0).toFixed(2) : '0', styles: { halign: 'right', fontSize: 5.4, textColor: [10,10,10] } },
                        { content: bdiStr, styles: { halign: 'right', fontSize: 5.3, textColor: [10,10,10] } },
                        { content: vlTotal > 0 ? 'R$ ' + vlTotal.toFixed(2) : '', styles: { halign: 'right', fontStyle: 'bold', fontSize: 5.6, textColor: [0,0,0] } }
                    ]);
                }
                if (mats.length > 0) {
                    matBody.push([
                        { content: 'TOTAL GERAL', colSpan: 10, styles: { fontStyle: 'bold', halign: 'right', fillColor: [55,55,55], textColor: [255,255,255], fontSize: 6.2 } },
                        { content: 'R$ ' + totalMat.toFixed(2), styles: { fontStyle: 'bold', halign: 'right', fillColor: [55,55,55], textColor: [255,255,255], fontSize: 7.2 } }
                    ]);
                }
                var matHead = [['OM', 'Descrição OM', 'Tipo de Solicitação', 'Código', 'Ct2', 'Descrição Material', 'Um', 'Qtd', 'VL. Unit.', 'BDI\n' + configBDI.toFixed(4) + '%', 'VL. Total']];
                pdf.autoTable({
                    startY: y,
                    head: matHead,
                    body: matBody.length > 0 ? matBody : [[{ content: '— Sem materiais —', colSpan: 11, styles: { halign: 'center', fontSize: 6.2, textColor: [110,110,110] } }]],
                    theme: 'grid',
                    tableWidth: 180,
                    headStyles: { fillColor: [45,45,45], textColor: [255,255,255], fontSize: 5.9, fontStyle: 'bold', cellPadding: 1.7, lineColor: [95,95,95], lineWidth: 0.22, halign: 'center', valign: 'middle' },
                    bodyStyles: { fontSize: 5.95, cellPadding: 1.55, textColor: [12,12,12], lineColor: [170,170,170], lineWidth: 0.18, overflow: 'linebreak', valign: 'middle' },
                    alternateRowStyles: { fillColor: [248,248,248] },
                    columnStyles: {
                        0: { cellWidth: 17.5 }, 1: { cellWidth: 22 }, 2: { cellWidth: 18 }, 3: { cellWidth: 10 },
                        4: { cellWidth: 16 }, 5: { cellWidth: 30 }, 6: { cellWidth: 8.5, halign: 'center' },
                        7: { cellWidth: 8.5, halign: 'center' }, 8: { cellWidth: 16, halign: 'right' },
                        9: { cellWidth: 14, halign: 'right' }, 10: { cellWidth: 19.5, halign: 'right' }
                    },
                    margin: { left: M, right: M },
                    didParseCell: function(data) {
                        if (data.section === 'body' && data.row && data.row.raw && data.row.raw.length === 11) {
                            if (data.column.index === 5) data.cell.styles.fontStyle = 'normal';
                        }
                    }
                });
                y = pdf.lastAutoTable.finalY + 8;
            }

            var obs = currentOM.observacoes;
            var desviosOM = currentOM.desviosRegistrados || [];
            var desviosLocal = _getDesviosDaOM(currentOM.num);
            var desviosAll = desviosOM.length > 0 ? desviosOM : desviosLocal;
            if (desviosAll.length > 0) {
                y = _pdfSection(pdf, y, 'DESVIOS REGISTRADOS', 18);
                var devBody = [];
                var totalDevSeg = 0;
                for (var dv = 0; dv < desviosAll.length; dv++) {
                    var dev = desviosAll[dv];
                    totalDevSeg += (dev.tempoSegundos || 0);
                    devBody.push([
                        { content: dev.tipoCod || '---', styles: { halign: 'center', fontSize: 7, fontStyle: 'bold' } },
                        { content: dev.tipoLabel || dev.tipo || '---', styles: { fontSize: 7 } },
                        { content: dev.tagEquipamento || '---', styles: { halign: 'center', fontSize: 7, fontStyle: 'bold' } },
                        { content: dev.localInstalacao || '---', styles: { fontSize: 7 } },
                        { content: new Date(dev.data).toLocaleDateString('pt-BR'), styles: { halign: 'center', fontSize: 7 } },
                        { content: _formatarTempo(dev.tempoSegundos || 0), styles: { halign: 'center', fontStyle: 'bold', fontSize: 7 } }
                    ]);
                }
                var stlDevTot = { halign: 'center', fontStyle: 'bold', fontSize: 8, fillColor: [70,70,70], textColor: [255,255,255] };
                devBody.push([
                    { content: 'TOTAL', colSpan: 5, styles: stlDevTot },
                    { content: _formatarTempo(totalDevSeg), styles: stlDevTot }
                ]);
                pdf.autoTable({
                    startY: y,
                    head: [['Cod.', 'Tipo Desvio', 'TAG', 'Local', 'Data', 'Tempo']],
                    body: devBody,
                    theme: 'grid',
                    tableWidth: 180,
                    headStyles: { fillColor: [70,70,70], textColor: [255,255,255], fontSize: 6, fontStyle: 'bold', cellPadding: 1.5, halign: 'center' },
                    bodyStyles: { fontSize: 6.2, cellPadding: 1.55, textColor: [30,30,30], lineColor: [205,205,205], lineWidth: 0.15, overflow: 'linebreak' },
                    columnStyles: { 0: { cellWidth: 14 }, 1: { cellWidth: 52 }, 2: { cellWidth: 32 }, 3: { cellWidth: 38 }, 4: { cellWidth: 22 }, 5: { cellWidth: 22 } },
                    margin: { left: M, right: M }
                });
                y = pdf.lastAutoTable.finalY + 8;
            }

            y = _pdfDrawObservationTable(pdf, y, 'OBSERVACOES', obs);

            var tipoAss = (isCancelamento || currentOM.pendenteAssinatura) ? 'ASSINATURA DO FISCAL' : 'ASSINATURA DO CLIENTE / RESPONSAVEL';
            y = _pdfDrawSignatureBlock(pdf, y, tipoAss, {
                assinatura: currentOM.assinaturaCliente,
                executantes: executantesNomes,
                fiscalName: (isCancelamento || currentOM.pendenteAssinatura) ? (currentOM.nomeFiscal || '') : ''
            });

            _pdfRodape(pdf, tipoDoc);
            var pdfBase64 = pdf.output('dataurlstring');
            var _ts = currentOM.execTs || '';
            return PdfDB.put('rel_' + currentOM.num + (_ts ? '_' + _ts : ''), pdfBase64);
        }

        function moverParaHistorico(om, tipo) {
            tipo = tipo || 'ATENDIDO';
            var historico = JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORICO) || '[]');
            var entry = {
                num: om.num,
                titulo: om.titulo || '',
                dataFinalizacao: om.dataFinalizacao || new Date().toISOString(),
                execTs: om.execTs || '',
                tipo: tipo,
                cancelada: om.cancelada || false,
                temDesvio: tipo === 'DESVIO' || tipo === 'REPROGRAMADO' || tipo === 'DESATIVADO',
                statusDesvio: null,
                temChecklist: !!om.planoCod || !!om.checklistCorretiva,
                temNC: !!om.retornouOficina,
                reaberta: false,
                canceladaDefinitivo: false,
                desviosRegistrados: om.desviosRegistrados || [],
                nomeFiscal: om.nomeFiscal || '',
                tagEquipamento: om.tagIdentificacao || om.equipamento || '---',
                equipe: om.equipe || '',
                cc: om.cc || '',
                omCompleta: null
            };
            if(tipo === 'DESVIO' || tipo === 'REPROGRAMADO') {
                entry.statusDesvio = om.statusDesvio || tipo;
                entry.omCompleta = JSON.parse(JSON.stringify(om));
            }
            if(tipo === 'CANCELADO') {
                entry.cancelada = true;
            }
            historico.push(entry);
            localStorage.setItem(STORAGE_KEY_HISTORICO, JSON.stringify(historico));
        }

        function showCancelar() {
            $('desvioSelect').value = '';
            $('justificativaCancelamento').value = '';
            $('btnConfirmarCancel').disabled = true;
            $('popupCancelar').classList.add('active');
        }

        function hideCancelar() {
            $('popupCancelar').classList.remove('active');
        }

        function confirmarCancelamento() {
            const desvio = $('desvioSelect').value;
            const just = $('justificativaCancelamento').value.trim();
            
            if(!desvio) {
                alert('⚠️ Selecione um código de desvio!');
                return;
            }
            
            if(timerAtividadeInterval) clearInterval(timerAtividadeInterval);
            if(currentOM.historicoExecucao && currentOM.historicoExecucao.length > 0) {
                var hLast = currentOM.historicoExecucao[currentOM.historicoExecucao.length - 1];
                if(hLast.dataInicio && !hLast.dataFim) {
                    var aSeg = Math.floor((new Date() - new Date(hLast.dataInicio)) / 1000) - tempoPausadoTotal;
                    if(aSeg < 0) aSeg = 0;
                    hLast.dataFim = new Date().toISOString();
                    hLast.hhAtividade = aSeg / 3600;
                    hLast.hhDeslocamento = (hLast.deslocamentoSegundos || 0) / 3600;
                    _calcHH(hLast);
                    hLast.tempoPausadoTotal = tempoPausadoTotal;
                }
            }
            
            currentOM.cancelada = true;
            currentOM.desvio = desvio;
            currentOM.justificativaCancelamento = just;
            currentOM.dataCancelamento = new Date().toLocaleString('pt-BR');
            currentOM.lockDeviceId = null;
            currentOM.pendenteAssinatura = true;
            currentOM.materiaisUsados = materiaisUsados.length > 0 ? [...materiaisUsados] : currentOM.materiaisUsados;
            isCancelamento = true;
            
            _gravarDashboardLog('CANCELADO', currentOM);
            salvarOMs();
            hideCancelar();
            
            alert('❌ OM CANCELADA\n\nDesvio: ' + desvio + '\n\nAguardando assinatura do cliente ou fiscal.');
            
            showFinalizar();
        }

        $('desvioSelect').addEventListener('change', function() {
            const btn = $('btnConfirmarCancel');
            btn.disabled = !this.value;
        });

        function handleClickPendenteAssinatura(idx) {
            clickCount++;
            
            if(clickTimeout) clearTimeout(clickTimeout);
            
            if(clickCount >= 3) {
                clickCount = 0;
                omPendenteParaAssinar = oms[idx];
                showSenhaFiscal();
            } else {
                clickTimeout = setTimeout(() => {
                    clickCount = 0;
                }, 1000);
            }
        }

        function showSenhaFiscal() {
            $('senhaFiscal').value = '';
            $('popupSenhaFiscal').classList.add('active');
        }

        function hideSenhaFiscal() {
            $('popupSenhaFiscal').classList.remove('active');
            omPendenteParaAssinar = null;
        }

        function verificarSenhaFiscal() {
            var senha = $('senhaFiscal').value;
            if(senha !== SENHA_FISCAL) {
                alert('Senha incorreta!');
                return;
            }
            var targetOM = omPendenteParaAssinar;
            hideSenhaFiscal();
            if(!targetOM) {
                alert('⚠️ Nenhuma OM pendente selecionada.');
                return;
            }
            currentOM = targetOM;
            materiaisUsados = currentOM.materiaisUsados || [];
            isCancelamento = currentOM.cancelada || false;
            if(currentOM.historicoExecucao && currentOM.historicoExecucao.length > 0) {
                var ultimo = currentOM.historicoExecucao[currentOM.historicoExecucao.length - 1];
                executantesNomes = ultimo.executantes || [];
                numExecutantes = executantesNomes.length;
            }
            var lastFiscal = localStorage.getItem('pcm_ultimo_fiscal') || '';
            $('inputNomeFiscal').value = lastFiscal;
            $('popupNomeFiscal').classList.add('active');
            setTimeout(function(){ $('inputNomeFiscal').focus(); }, 200);
        }
        function confirmarNomeFiscal() {
            var nome = $('inputNomeFiscal').value.trim();
            if(!nome) { alert('⚠️ Informe o nome do fiscal.'); return; }
            localStorage.setItem('pcm_ultimo_fiscal', nome);
            currentOM.nomeFiscal = nome;
            $('popupNomeFiscal').classList.remove('active');
            showAssinaturaFiscal();
        }
        function hideNomeFiscal() {
            $('popupNomeFiscal').classList.remove('active');
            omPendenteParaAssinar = null;
        }

        function showAssinaturaFiscal() {
            $('popupFinalizar').classList.add('active');
            
            if(currentOM.historicoExecucao && currentOM.historicoExecucao.length > 0) {
                const ultimoHistorico = currentOM.historicoExecucao[currentOM.historicoExecucao.length - 1];
                
                $('resumoHHAtividade').textContent = (ultimoHistorico.hhAtividade || 0).toFixed(2) + 'h';
                $('resumoNumExec').textContent = ultimoHistorico.executantes.length;
                $('resumoHHPorPessoa').textContent = (ultimoHistorico.hhEquipe || 0).toFixed(2) + 'h';
                $('resumoHHDeslocamento').textContent = (ultimoHistorico.hhDeslocamento || 0).toFixed(2) + 'h';
                $('resumoHHTotal').textContent = (ultimoHistorico.hhTotal || 0).toFixed(2) + 'h';
                
                $('listaExecFinal').innerHTML = ultimoHistorico.executantes.map((n, i) => (i + 1) + '. ' + n).join('<br>');
                
                renderResumoHistorico();
            } else {
                $('resumoHHAtividade').textContent = '0.00h';
                $('resumoNumExec').textContent = '0';
                $('resumoHHPorPessoa').textContent = '0.00h';
                $('resumoHHDeslocamento').textContent = '0.00h';
                $('resumoHHTotal').textContent = '0.00h';
                $('listaExecFinal').innerHTML = '-';
                $('resumoHistorico').innerHTML = '';
            }
            
            const totalMat = materiaisUsados.reduce((sum, m) => sum + m.total, 0);
            const financialBox = $('financialSummary');
            
            if(totalMat > 0) {
                financialBox.innerHTML = `
                    <div style="font-size:18px;font-weight:800;color:#1A5276;margin-bottom:12px;">💰 Resumo Financeiro</div>
                    <div style="display:flex;justify-content:space-between;margin-bottom:10px;font-size:15px;">
                        <span>📦 Materiais:</span>
                        <strong style="color:#2E86C1;">R$ ${totalMat.toFixed(2)}</strong>
                    </div>
                    <div style="display:flex;justify-content:space-between;font-size:20px;font-weight:900;border-top:3px solid #ffd700;padding-top:12px;margin-top:12px;">
                        <span>💵 TOTAL:</span>
                        <strong style="color:#2E86C1;">R$ ${totalMat.toFixed(2)}</strong>
                    </div>
                `;
            } else {
                financialBox.innerHTML = `
                    <div style="font-size:18px;font-weight:800;color:#1A5276;margin-bottom:12px;">💰 Resumo Financeiro</div>
                    <div style="text-align:center;padding:24px;color:#999;">
                        <div style="font-size:32px;margin-bottom:12px;">🔧</div>
                        <div style="font-weight:700;font-size:15px;">SÓ MÃO DE OBRA</div>
                        <div style="font-size:13px;margin-top:6px;">Nenhum material utilizado</div>
                    </div>
                `;
            }
            
            $('observacoes').value = currentOM.observacoes || '';
            
            setTimeout(function(){ setupSignaturePad(); }, 300);
        }

        async function verPDFOriginal() {
            var viewer = $('pdfOriginalViewer');
            viewer.innerHTML = '<p style="text-align:center;padding:40px;color:#fff;font-size:16px;">⏳ Carregando PDF...</p>';
            $('popupPDFOriginal').classList.add('active');

            var pdfBase64 = await PdfDB.get('orig_' + currentOM.num);
            var pdfData = null;

            if (pdfBase64) {
                // Local IndexedDB
                var byteStr = atob(pdfBase64.split(',').pop());
                var ab = new ArrayBuffer(byteStr.length);
                var ia = new Uint8Array(ab);
                for (var i = 0; i < byteStr.length; i++) ia[i] = byteStr.charCodeAt(i);
                pdfData = ab;
            } else {
                // Tenta Supabase Storage
                try {
                    var token = (window.PCMAuth && window.PCMAuth.getToken()) || SUPABASE_ANON_KEY;
                    var resp = await fetch(SUPABASE_URL + '/storage/v1/object/pcm-files/originais/' + currentOM.num + '.pdf', {
                        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + token }
                    });
                    if (!resp.ok) throw new Error('Não encontrado no servidor');
                    pdfData = await resp.arrayBuffer();
                } catch(e) {
                    viewer.innerHTML = '<p style="text-align:center;color:#ff6b6b;padding:40px;">PDF original não encontrado.<br><small>' + e.message + '</small></p>';
                    return;
                }
            }

            try {
                var pdfDoc = await pdfjsLib.getDocument({data: pdfData}).promise;
                viewer.innerHTML = '';
                var containerW = viewer.clientWidth - 16;
                for(var pg = 1; pg <= pdfDoc.numPages; pg++) {
                    var page = await pdfDoc.getPage(pg);
                    var vpOrig = page.getViewport({scale: 1});
                    var scale = (containerW / vpOrig.width) * 2;
                    var vp = page.getViewport({scale: scale});
                    var cvs = document.createElement('canvas');
                    cvs.width = vp.width;
                    cvs.height = vp.height;
                    cvs.style.width = '100%';
                    cvs.style.height = 'auto';
                    cvs.style.display = 'block';
                    cvs.style.marginBottom = '12px';
                    cvs.style.borderRadius = '4px';
                    cvs.style.boxShadow = '0 2px 12px rgba(0,0,0,0.4)';
                    cvs.style.backgroundColor = '#fff';
                    viewer.appendChild(cvs);
                    await page.render({canvasContext: cvs.getContext('2d'), viewport: vp}).promise;
                }
            } catch(err) {
                viewer.innerHTML = '<p style="text-align:center;color:#ff6b6b;padding:40px;">Erro: ' + err.message + '</p>';
            }
        }

        function fecharPDFOriginal() {
            $('popupPDFOriginal').classList.remove('active');
            $('pdfOriginalViewer').innerHTML = '';
        }

        async function verPDFGerado(omNum) {
            var pdfBase64 = await PdfDB.get('rel_' + omNum);
            if(!pdfBase64) { pdfBase64 = await PdfDB.get('rel_' + omNum.split('_')[0]); }
            if(!pdfBase64) { alert('PDF não encontrado!'); return; }
            var displayNum = omNum.split('_')[0];
            $('popupHistorico').classList.remove('active');
            $('pdfGeradoTitle').textContent = 'OM_' + displayNum + '.pdf';
            var viewer = $('pdfGeradoViewer');
            viewer.innerHTML = '<p style="text-align:center;padding:40px;color:#fff;font-size:16px;">⏳ Carregando PDF...</p>';
            $('popupPDFGerado').classList.add('active');
            try {
                var raw = pdfBase64.indexOf(',') > -1 ? pdfBase64.split(',')[1] : pdfBase64;
                var ab = base64ToArrayBuffer(raw);
                var pdfDoc = await pdfjsLib.getDocument({data: ab}).promise;
                viewer.innerHTML = '';
                var containerW = viewer.clientWidth - 16;
                for(var pg = 1; pg <= pdfDoc.numPages; pg++) {
                    var page = await pdfDoc.getPage(pg);
                    var vpOrig = page.getViewport({scale: 1});
                    var scale = (containerW / vpOrig.width) * 2;
                    var vp = page.getViewport({scale: scale});
                    var cvs = document.createElement('canvas');
                    cvs.width = vp.width;
                    cvs.height = vp.height;
                    cvs.style.width = '100%';
                    cvs.style.height = 'auto';
                    cvs.style.display = 'block';
                    cvs.style.marginBottom = '12px';
                    cvs.style.borderRadius = '4px';
                    cvs.style.boxShadow = '0 2px 12px rgba(0,0,0,0.4)';
                    cvs.style.backgroundColor = '#fff';
                    viewer.appendChild(cvs);
                    await page.render({canvasContext: cvs.getContext('2d'), viewport: vp}).promise;
                }
            } catch(err) {
                viewer.innerHTML = '<p style="text-align:center;color:#ff6b6b;padding:40px;">Erro ao carregar PDF</p>';
            }
        }

        function fecharPDFGerado() {
            $('popupPDFGerado').classList.remove('active');
            $('pdfGeradoViewer').innerHTML = '';
        }

        async function mostrarHistorico() {
            var historico = JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORICO) || '[]');
            var hojeISO = new Date().toISOString().split('T')[0];
            var hojePTBR = new Date().toLocaleDateString('pt-BR');

            function ehHoje(d) {
                if(!d) return false;
                if(d.includes('T')) return d.split('T')[0] === hojeISO;
                return d.includes(hojeISO) || d.includes(hojePTBR);
            }

            var historicoHoje = historico.filter(function(om) {
                if(!om.dataFinalizacao) return false;
                if(om.temDesvio) return false;
                return ehHoje(om.dataFinalizacao);
            });

            var historicoDesvios = historico.filter(function(om) {
                return om.temDesvio && !om.canceladaDefinitivo;
            });

            var allKeys = [];
            try { allKeys = await PdfDB.keys(); } catch(e){}
            var lista = $('historicoOMsList');

            if(historicoHoje.length === 0 && historicoDesvios.length === 0) {
                lista.innerHTML = '<p style="text-align:center;color:#999;padding:30px;">Nenhuma OM finalizada hoje</p>';
            } else {
                lista.innerHTML = '';

                var arr = historicoHoje.slice().reverse();
                for(var i = 0; i < arr.length; i++) {
                    var om = arr[i];
                    var sfx = om.execTs ? '_' + om.execTs : '';
                    var temPDF = allKeys.indexOf('rel_' + om.num + sfx) >= 0 || allKeys.indexOf('rel_' + om.num) >= 0;
                    var temCheck = allKeys.indexOf('ck_' + om.num + sfx) >= 0 || allKeys.indexOf('ck_' + om.num) >= 0;
                    var temNCpdf = allKeys.indexOf('nc_' + om.num + sfx) >= 0 || allKeys.indexOf('nc_' + om.num) >= 0;
                    var pdfKey = om.execTs ? om.num + '_' + om.execTs : om.num;
                    var div = document.createElement('div');
                    div.className = 'file-item';
                    div.style.flexDirection = 'column';
                    div.style.alignItems = 'stretch';
                    var dataExibicao = om.dataFinalizacao;
                    try { if(dataExibicao.includes('T')) dataExibicao = new Date(dataExibicao).toLocaleString('pt-BR'); } catch(e){}
                    var iconeStatus = om.tipo === 'CANCELADO' ? '❌' : '✅';
                    var h = '<div class="file-info" style="margin-bottom:' + (temPDF ? '10' : '0') + 'px;">';
                    h += '<div class="file-name">' + iconeStatus + ' OM ' + om.num + '</div>';
                    h += '<div class="file-status">' + (om.titulo || '') + '</div>';
                    h += '<div class="file-status">' + (om.tipo || 'ATENDIDO') + ' — ' + dataExibicao + '</div></div>';
                    if(temPDF) {
                        h += '<button onclick="verPDFGerado(\'' + pdfKey + '\')" style="width:100%;padding:10px 14px;background:linear-gradient(135deg,#1A5276,#154360);color:#fff;border:none;border-radius:8px;font-weight:700;font-size:13px;cursor:pointer;display:flex;align-items:center;gap:8px;justify-content:center;margin-bottom:6px;">📄 Relatório OM_' + om.num + '.pdf</button>';
                    }
                    if(temCheck) {
                        h += '<button onclick="verPDFChecklist(\'' + pdfKey + '\')" style="width:100%;padding:10px 14px;background:linear-gradient(135deg,#333,#555);color:#fff;border:none;border-radius:8px;font-weight:700;font-size:13px;cursor:pointer;display:flex;align-items:center;gap:8px;justify-content:center;margin-bottom:6px;">📋 Checklist OM_' + om.num + '.pdf</button>';
                    }
                    if(temNCpdf) {
                        h += '<button onclick="verPDFNC(\'' + pdfKey + '\')" style="width:100%;padding:10px 14px;background:linear-gradient(135deg,#dc3545,#b02a37);color:#fff;border:none;border-radius:8px;font-weight:700;font-size:13px;cursor:pointer;display:flex;align-items:center;gap:8px;justify-content:center;">⚠️ Não Conformidade OM_' + om.num + '.pdf</button>';
                    }
                    div.innerHTML = h;
                    lista.appendChild(div);
                }

                if(historicoDesvios.length > 0) {
                    var dvSec = document.createElement('div');
                    dvSec.style.cssText = 'font-size:12px;font-weight:800;color:#e53935;text-transform:uppercase;letter-spacing:.5px;margin:16px 0 8px;padding-top:8px;border-top:2px solid #fde8ea;';
                    dvSec.textContent = '⚠️ OMs com Desvio / Reprogramação';
                    lista.appendChild(dvSec);
                    for(var d=0;d<historicoDesvios.length;d++){
                        var dv=historicoDesvios[d];
                        var dvDiv=document.createElement('div');
                        dvDiv.className='file-item';
                        dvDiv.style.cssText='flex-direction:column;align-items:stretch;border-left:4px solid #e53935;';
                        var dvData = dv.dataFinalizacao;
                        try { if(dvData && dvData.includes('T')) dvData = new Date(dvData).toLocaleString('pt-BR'); } catch(e){}
                        var temDevPDF = allKeys.indexOf('dev_'+dv.num)>=0;
                        var tipoLabel = dv.statusDesvio || dv.tipo || 'DESVIO';
                        var dvH='<div class="file-info" style="margin-bottom:8px;">';
                        dvH+='<div class="file-name">⚠️ OM '+dv.num+(dv.reaberta?' 🔄':'')+'</div>';
                        dvH+='<div class="file-status">'+(dv.titulo||'')+'</div>';
                        dvH+='<div class="file-status" style="color:#e53935;font-weight:700;">'+tipoLabel+' — '+dvData+'</div></div>';
                        if(temDevPDF){
                            dvH+='<button onclick="verPDFDesvio(\''+dv.num+'\')" style="width:100%;padding:9px;background:linear-gradient(135deg,#e53935,#b71c1c);color:#fff;border:none;border-radius:8px;font-weight:700;font-size:13px;cursor:pointer;margin-bottom:6px;">📄 Relatório Desvio</button>';
                        }
                        if(!dv.reaberta){
                            dvH+='<button onclick="reabrirOMDesvio(\''+dv.num+'\')" style="width:100%;padding:9px;background:linear-gradient(135deg,#1565c0,#0d47a1);color:#fff;border:none;border-radius:8px;font-weight:700;font-size:13px;cursor:pointer;margin-bottom:6px;">🔄 Reabrir OM</button>';
                        }
                        dvH+='<button onclick="showCancelarOMDesvio(\''+dv.num+'\')" style="width:100%;padding:9px;background:linear-gradient(135deg,#333,#555);color:#fff;border:none;border-radius:8px;font-weight:700;font-size:13px;cursor:pointer;">❌ Cancelar Definitivo</button>';
                        dvDiv.innerHTML=dvH;
                        lista.appendChild(dvDiv);
                    }
                }
            }
            $('popupHistorico').classList.add('active');
        }

        async function verPDFChecklist(omNum) {
            var pdfBase64 = await PdfDB.get('ck_' + omNum);
            if(!pdfBase64) { pdfBase64 = await PdfDB.get('ck_' + omNum.split('_')[0]); }
            if(!pdfBase64) { alert('PDF Checklist não encontrado!'); return; }
            $('popupHistorico').classList.remove('active');
            var viewer = $('pdfGeradoViewer');
            viewer.innerHTML = '<p style="text-align:center;padding:40px;color:#fff;font-size:16px;">⏳ Carregando Checklist...</p>';
            $('popupPDFGerado').classList.add('active');
            try {
                var dataStr = pdfBase64.split(',')[1] || pdfBase64;
                var ab = base64ToArrayBuffer(dataStr);
                var pdfDoc = await pdfjsLib.getDocument({data: ab}).promise;
                viewer.innerHTML = '';
                var containerW = viewer.clientWidth - 16;
                for(var pg = 1; pg <= pdfDoc.numPages; pg++) {
                    var page = await pdfDoc.getPage(pg);
                    var vpOrig = page.getViewport({scale: 1});
                    var scale = (containerW / vpOrig.width) * 2;
                    var vp = page.getViewport({scale: scale});
                    var cvs = document.createElement('canvas');
                    cvs.width = vp.width;
                    cvs.height = vp.height;
                    cvs.style.width = '100%';
                    cvs.style.height = 'auto';
                    cvs.style.display = 'block';
                    cvs.style.marginBottom = '12px';
                    cvs.style.borderRadius = '4px';
                    cvs.style.boxShadow = '0 2px 12px rgba(0,0,0,0.4)';
                    cvs.style.backgroundColor = '#fff';
                    viewer.appendChild(cvs);
                    await page.render({canvasContext: cvs.getContext('2d'), viewport: vp}).promise;
                }
            } catch(e) {
                viewer.innerHTML = '<p style="color:#f00;text-align:center;padding:40px;">Erro ao carregar checklist: ' + e.message + '</p>';
            }
        }

        async function verPDFNC(omNum) {
            var pdfBase64 = await PdfDB.get('nc_' + omNum);
            if(!pdfBase64) { pdfBase64 = await PdfDB.get('nc_' + omNum.split('_')[0]); }
            if(!pdfBase64) { alert('PDF Não Conformidade não encontrado!'); return; }
            $('popupHistorico').classList.remove('active');
            var viewer = $('pdfGeradoViewer');
            viewer.innerHTML = '<p style="text-align:center;padding:40px;color:#fff;font-size:16px;">⏳ Carregando NC...</p>';
            $('popupPDFGerado').classList.add('active');
            try {
                var dataStr = pdfBase64.split(',')[1] || pdfBase64;
                var ab = base64ToArrayBuffer(dataStr);
                var pdfDoc = await pdfjsLib.getDocument({data: ab}).promise;
                viewer.innerHTML = '';
                var containerW = viewer.clientWidth - 16;
                for(var pg = 1; pg <= pdfDoc.numPages; pg++) {
                    var page = await pdfDoc.getPage(pg);
                    var vpOrig = page.getViewport({scale: 1});
                    var scale = (containerW / vpOrig.width) * 2;
                    var vp = page.getViewport({scale: scale});
                    var cvs = document.createElement('canvas');
                    cvs.width = vp.width;
                    cvs.height = vp.height;
                    cvs.style.width = '100%';
                    cvs.style.height = 'auto';
                    cvs.style.display = 'block';
                    cvs.style.marginBottom = '12px';
                    cvs.style.borderRadius = '4px';
                    cvs.style.boxShadow = '0 2px 12px rgba(0,0,0,0.4)';
                    cvs.style.backgroundColor = '#fff';
                    viewer.appendChild(cvs);
                    await page.render({canvasContext: cvs.getContext('2d'), viewport: vp}).promise;
                }
            } catch(e) {
                viewer.innerHTML = '<p style="color:#f00;text-align:center;padding:40px;">Erro ao carregar NC: ' + e.message + '</p>';
            }
        }

        function fecharHistorico() {
            $('popupHistorico').classList.remove('active');
        }

        async function resetHistoricoLocal() {
            if(!confirm('⚠️ RESET COMPLETO\n\nIsso vai apagar:\n• Histórico de OMs\n• Desvios acumulados\n• Dashboard log\n• Dados Excel (IW44 + Materiais)\n• Todos os PDFs gerados\n\nContinuar?')) return;
            if(!confirm('🔴 TEM CERTEZA? Esta ação é irreversível!')) return;
            localStorage.removeItem(STORAGE_KEY_HISTORICO);
            localStorage.removeItem(STORAGE_KEY_DESVIOS);
            localStorage.removeItem(STORAGE_KEY_DESVIOS_ACUM);
            localStorage.removeItem(STORAGE_KEY_DASHBOARD);
            localStorage.removeItem('pcm_excel_materiais');
            localStorage.removeItem('pcm_excel_iw44');
            try {
                var keys = await PdfDB.keys();
                for(var i=0;i<keys.length;i++){
                    if(keys[i].match(/^(rel_|ck_|nc_|dev_)/)) await PdfDB.del(keys[i]);
                }
            } catch(e){}
            fecharHistorico();
            alert('✅ Histórico local resetado.');
        }

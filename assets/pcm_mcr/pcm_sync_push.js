        async function carregarOMAtual() {
            var saved = localStorage.getItem(STORAGE_KEY_CURRENT);

            if(!saved) {
                try {
                    var backup = await PdfDB.get('current_om_state');
                    if(backup) {
                        saved = JSON.stringify(backup);
                        console.log('Estado da OM recuperado do IndexedDB (localStorage estava vazio)');
                    }
                } catch(e) { console.warn('[PCM] Backup IndexedDB indisponível:', e); }
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
            try { localStorage.setItem('pcm_push_pendentes', JSON.stringify(_pushPendentes)); } catch(e) { console.warn('[PCM] Erro ao salvar push pendentes:', e); }
        }
        function _carregarPushPendentes() {
            try { var r = localStorage.getItem('pcm_push_pendentes'); if(r) _pushPendentes = JSON.parse(r); } catch(e) { console.warn('[PCM] Erro ao ler push pendentes:', e); }
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
                try { await PdfDB.del('orig_' + omNum); } catch(e) { console.warn('[PCM] Erro ao limpar PDF original:', e); }
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
            function _payloadCompatEstadoFluxo(p){
                if(!p) return p;
                var out = Object.assign({}, p);
                if(out.estado_fluxo === 'em_oficina') {
                    out.estado_fluxo = 'executada';
                }
                return out;
            }
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
                    try { await _removerOrigemOMServidor(payload.num); } catch(e) { console.warn('[PCM] Falha ao remover origem OM do servidor:', e); }
                }
                return true;
            }
            var errBody = await resp.text().catch(function(){ return ''; });
            if(resp.status === 400 && /oms_estado_fluxo_check/.test(errBody || '')) {
                var payloadCompat = _payloadCompatEstadoFluxo(payload);
                if(JSON.stringify(payloadCompat) !== JSON.stringify(payload)) {
                    console.warn('[PUSH] estado_fluxo incompatível no servidor para OM ' + payload.num + ' — aplicando fallback compatível');
                    var respCompat = await _fetchComTimeout(
                        SUPABASE_URL + '/rest/v1/' + SUPABASE_TABLE_OMS + '?num=eq.' + encodeURIComponent(payload.num),
                        { method: 'PATCH', headers: _hdrs, body: JSON.stringify(payloadCompat) },
                        12000
                    );
                    if(respCompat.ok) return true;
                    var errCompat = await respCompat.text().catch(function(){ return ''; });
                    console.error('[PUSH] PATCH fallback falhou HTTP ' + respCompat.status + ':', errCompat);
                }
            }
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
            } catch(e) { console.warn('[PCM] Falha ao verificar admin unlock:', e); }
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

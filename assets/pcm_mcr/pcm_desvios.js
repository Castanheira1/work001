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
            var naOficinaAtiva = emOficina && currentOM.etapaOficina === ETAPA_OFICINA.OFICINA;
            var itensRestritos = document.querySelectorAll('#popupMenuDesvios .btn-desvio-oficina-restrito');
            for(var i = 0; i < itensRestritos.length; i++) {
                itensRestritos[i].style.display = emOficina ? 'none' : 'block';
            }
            // Mostrar/esconder botao de finalizar oficina
            var btnFinOficMenu = document.getElementById('btnFinalizarOficinaMenu');
            if(btnFinOficMenu) {
                btnFinOficMenu.style.display = naOficinaAtiva ? 'block' : 'none';
            }
            $('popupMenuDesvios').classList.add('active');
        }
        function hideMenuDesvios() { $('popupMenuDesvios').classList.remove('active'); }
        function selecionarDesvio(tipo) {
            hideMenuDesvios();
            if(DESVIO_TIPOS[tipo]) { showDesvioGenerico(tipo); return; }
            if(tipo === '0018') {
                // Se estiver na oficina, usar troca de turno de oficina
                if(currentOM && currentOM.emOficina && currentOM.etapaOficina === ETAPA_OFICINA.OFICINA) {
                    confirmarTrocaTurnoOficina();
                } else {
                    confirmarTrocaTurno();
                }
                return;
            }
            if(tipo === 'finalizar_oficina') { finalizarOficina(); return; }
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
                hLast.tempoPausadoTotal = tempoPausadoTotal;
                var _totalSeg = (hLast.dataInicio && hLast.dataFim) ? Math.max(0, Math.floor((new Date(hLast.dataFim) - new Date(hLast.dataInicio)) / 1000) - (tempoPausadoTotal || 0)) : 0;
                var _deslOriginal = hLast.deslocamentoSegundos || 0;
                hLast.deslocamentoSegundos = _deslOriginal + _totalSeg;
                if(!hLast.deslocamentoHoraInicio) hLast.deslocamentoHoraInicio = hLast.dataInicio;
                hLast.deslocamentoHoraFim = hLast.dataFim;
                hLast.hhDeslocamento = hLast.deslocamentoSegundos / 3600;
                hLast.hhAtividade = 0;
                _calcHH(hLast);
                hLast.tag = info.cod + ' - ' + info.label;
                hLast.desvio = true;
            }
            var tempoTotalDesvio = (typeof hLast !== 'undefined' && hLast && hLast.dataInicio && hLast.dataFim)
                ? Math.max(0, Math.floor((new Date(hLast.dataFim) - new Date(hLast.dataInicio)) / 1000) - (tempoPausadoTotal || 0))
                : (atividadeSegundos || 0);

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
                tipo: rec.tipo,
                tipo_cod: rec.tipoCod,
                tipo_label: rec.tipoLabel,
                tag_equipamento: rec.tagEquipamento || '',
                local_instalacao: rec.localInstalacao || '',
                desc_local: rec.descLocal || '',
                observacao: rec.observacao || '',
                executantes: rec.executantes || [],
                mes_ref: rec.mesRef,
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
                var execAnterior = window._retomarModoOficina ? (currentOM.oficinaPausaExecutantes || []) : (currentOM.pausaExecutantes || []);
                _retomarExecs = execAnterior.slice();
                $('retomarEquipeDiv').style.display = 'none';
            } else {
                _retomarExecs = [];
                $('retomarEquipeDiv').style.display = 'block';
                $('retomarExecInput').value = '';
                $('retomarExecLista').innerHTML = '';
                setTimeout(function(){ $('retomarExecInput').focus(); }, 200);
            }
            // Na oficina, nao precisa perguntar se ja esta no local
            if(window._retomarModoOficina) {
                $('retomarLocalLabel').style.display = 'none';
                $('retomarLocalDiv').style.display = 'none';
                // Mostrar botao de confirmar direto
                var divLocal = $('retomarLocalDiv');
                divLocal.style.display = 'flex';
                divLocal.innerHTML = '<button onclick="retomarNoLocal(true)" style="flex:1;padding:12px;background:#1A5276;color:#fff;border:none;border-radius:10px;font-weight:800;font-size:14px;cursor:pointer;">✅ INICIAR NA OFICINA</button>';
                $('retomarLocalLabel').style.display = 'block';
                $('retomarLocalLabel').textContent = 'Confirmar retomada na oficina?';
            } else {
                $('retomarLocalLabel').style.display = 'block';
                $('retomarLocalLabel').textContent = 'Já está no local?';
                $('retomarLocalDiv').style.display = 'flex';
            }
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

            // Se estiver retomando oficina, usar fluxo de oficina
            if(window._retomarModoOficina) {
                retomarOficina();
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
                    try { pdf.addImage(rec.foto, 'JPEG', M + 0.5, y + 0.5, boxW - 1, boxH - 1); } catch(e) { console.warn('[PCM] Falha ao inserir imagem no PDF:', e.message || e); }

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

        async function _renderizarPDFNoViewer(viewer, pdfBase64) {
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
                    cvs.style.cssText = 'width:100%;height:auto;display:block;margin-bottom:12px;border-radius:4px;box-shadow:0 2px 12px rgba(0,0,0,0.4);background:#fff;';
                    viewer.appendChild(cvs);
                    await page.render({canvasContext: cvs.getContext('2d'), viewport: vp}).promise;
                }
            } catch(e) {
                viewer.innerHTML = '<p style="text-align:center;color:#ff6b6b;padding:40px;">Erro ao carregar PDF: ' + (e.message || e) + '</p>';
            }
        }

        async function verPDFDesvio(omNum) {
            var b64 = await PdfDB.get('dev_'+omNum);
            if(!b64) { alert('PDF não encontrado!'); return; }
            $('popupHistorico').classList.remove('active');
            var viewer = $('pdfGeradoViewer');
            viewer.innerHTML = '<p style="text-align:center;padding:40px;color:#fff;">⏳ Carregando...</p>';
            $('pdfGeradoTitle').textContent = '⚠️ Relatório de Desvio';
            $('popupPDFGerado').classList.add('active');
            await _renderizarPDFNoViewer(viewer, b64);
        }

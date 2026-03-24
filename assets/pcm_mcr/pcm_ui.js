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
                } else if(om.statusOficina === 'aguardando_devolucao') {
                    statusClass = 'em-execucao';
                    statusText = '🔧 AGUARDANDO DEVOLUÇÃO';
                    clickAction = () => showDetail(idx);
                } else if(om.emOficina && !om.lockDeviceId) {
                    statusClass = 'em-execucao';
                    statusText = '🔧 OFICINA — Disponível';
                    clickAction = () => showDetail(idx);
                } else if(om.oficinaPausada) {
                    statusClass = 'pendente';
                    statusText = '🔧 OFICINA — Troca de Turno';
                    clickAction = () => showRetomarOficina(idx);
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
            
            if(typeof STATUS_OFICINA !== 'undefined' && currentOM.statusOficina === STATUS_OFICINA.AGUARDANDO_DEVOLUCAO) {
                // Aguardando devolucao: mostrar botao de iniciar montagem
                _aplicarModoOficinaMinimal(true);
                if(currentOM.checklistFotos) checklistFotos = currentOM.checklistFotos;
                if(timerInterval) clearInterval(timerInterval);
                if(timerAtividadeInterval) clearInterval(timerAtividadeInterval);
                _setBtns({
                    btnDeslocamento:0, btnIniciar:0, btnCancelar:0, btnExcluir:0,
                    timerDisplay:0, timerAtividade:0, btnGroupAtividade:0, btnRowExecOficina:0,
                    btnFinalizar:0, btnDevolverEquip:0, btnOficina:0, btnFinalizarOficina:0,
                    btnIniciarMontagem:1
                });
                renderHistoricoExecucao();
            } else if(currentOM.emOficina) {
                _aplicarModoOficinaMinimal(true);
                if(currentOM.checklistFotos) checklistFotos = currentOM.checklistFotos;
                if(timerInterval) clearInterval(timerInterval);
                if(timerAtividadeInterval) clearInterval(timerAtividadeInterval);
                $('btnDeslocamento').style.display = 'none';
                $('btnIniciar').style.display = 'block';
                $('btnIniciar').disabled = false;
                $('btnCancelar').style.display = 'none';
                $('btnExcluir').style.display = 'none';
                $('timerDisplay').style.display = 'none';
                $('timerAtividade').style.display = 'none';
                $('timerDateInfo').style.display = 'none';
                $('timerAtivDateInfo').style.display = 'none';
                _btnOficinaCk();
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
            var historicoList = $('historicoList');
            if(!currentOM || (!currentOM.emOficina && !currentOM.statusOficina && !currentOM.etapaOficina)) {
                $('historicoSection').style.display = 'none';
                historicoList.innerHTML = '';
                return;
            }
            $('historicoSection').style.display = 'block';
            var histArr = Array.isArray(currentOM.historicoExecucao) ? currentOM.historicoExecucao : [];

            // Agrupar por etapa
            var htmlMin = '';
            var etapas = {};
            for(var i = 0; i < histArr.length; i++) {
                var tag = histArr[i].tag || 'ATIVIDADE';
                var etapa = 'CAMPO';
                if(tag === 'OFICINA' || tag === 'OFICINA_FIM' || tag === 'OFICINA_TROCA_TURNO') etapa = 'OFICINA';
                else if(tag === 'MONTAGEM') etapa = 'MONTAGEM';
                if(!etapas[etapa]) etapas[etapa] = [];
                etapas[etapa].push(histArr[i]);
            }

            var ordem = ['CAMPO', 'OFICINA', 'MONTAGEM'];
            var cores = { CAMPO: '#1A5276', OFICINA: '#e65100', MONTAGEM: '#2e7d32' };
            var icones = { CAMPO: '📍', OFICINA: '🔧', MONTAGEM: '🔩' };

            for(var oi = 0; oi < ordem.length; oi++) {
                var etpNome = ordem[oi];
                var etpArr = etapas[etpNome];
                if(!etpArr || etpArr.length === 0) continue;

                var execSet = {};
                var hhTotal = 0;
                for(var j = 0; j < etpArr.length; j++) {
                    var execs = Array.isArray(etpArr[j].executantes) ? etpArr[j].executantes : [];
                    for(var k = 0; k < execs.length; k++) if(execs[k]) execSet[execs[k]] = true;
                    hhTotal += (etpArr[j].hhAtividade || 0);
                }

                var dataIni = etpArr[0].dataInicio ? new Date(etpArr[0].dataInicio).toLocaleString('pt-BR') : '--';
                var dataFim = etpArr[etpArr.length-1].dataFim ? new Date(etpArr[etpArr.length-1].dataFim).toLocaleString('pt-BR') : 'em andamento';

                htmlMin += '<div class="historico-dia" style="border-left:4px solid ' + cores[etpNome] + ';margin-bottom:8px;padding:8px 12px;background:#f9f9f9;border-radius:8px;">';
                htmlMin += '<div style="font-weight:800;color:' + cores[etpNome] + ';font-size:14px;">' + icones[etpNome] + ' ' + etpNome + '</div>';
                htmlMin += '<div style="font-size:12px;color:#555;margin-top:4px;">Inicio: ' + dataIni + ' | Fim: ' + dataFim + '</div>';
                htmlMin += '<div style="font-size:12px;color:#234;margin-top:4px;">👷 ' + Object.keys(execSet).join(', ') + '</div>';
                htmlMin += '<div style="font-size:12px;color:#234;margin-top:2px;">⏱️ HH: ' + hhTotal.toFixed(2) + 'h</div>';
                htmlMin += '</div>';
            }

            if(!htmlMin) {
                var dataOf = currentOM.dataEnvioOficina || null;
                var dataTxt = dataOf ? new Date(dataOf).toLocaleString('pt-BR') : '--';
                htmlMin = '<div class="historico-dia oficina-min-resumo">';
                htmlMin += '<div style="font-weight:800;color:#1A5276;">📅 Enviada para oficina: ' + dataTxt + '</div>';
                htmlMin += '</div>';
            }

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
                } catch(e) { console.warn('[PCM] Estado inválido em excluirOM:', e); }
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

        window.filtrarOMs = filtrarOMs;

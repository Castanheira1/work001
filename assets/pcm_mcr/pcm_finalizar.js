
        function _obterValorChecklistItem(nome) {
            var sel = document.querySelector('input[name="' + nome + '"]:checked');
            if (sel && sel.value) return sel.value;
            if (!currentOM || !Array.isArray(currentOM.checklistDados)) return '';
            var idxNum = parseInt(String(nome).slice(1), 10) || 0;
            var secao = nome.charAt(0) === 'm' ? 'MENSAL' : 'TRIMESTRAL EM CASO DE ANOMALIA';
            for (var i = 0; i < currentOM.checklistDados.length; i++) {
                var item = currentOM.checklistDados[i];
                if (!item) continue;
                if (item.secao === secao && Number(item.num || 0) === idxNum) {
                    return item.valor || '';
                }
            }
            return '';
        }

        var _nomesChecklist = ['m1','m2','m3','m4','m5','m6','t1','t2','t3','t4','t5','t6','t7','t8','t9'];

        function enviarParaOficina() {
            if(!currentOM.planoCod && !currentOM.checklistCorretiva) {
                alert('⚠️ Habilite o checklist primeiro (botão 📋 CHECKLIST).');
                return;
            }
            
            var temAnormal = false;
            for(var i = 0; i < _nomesChecklist.length; i++) {
                var nomeItem = _nomesChecklist[i];
                var valorItem = _obterValorChecklistItem(nomeItem);
                if(valorItem === 'anormal') {
                    if(!checklistFotos[nomeItem] || !checklistFotos[nomeItem].antes) {
                        alert('⚠️ Item ' + nomeItem.toUpperCase() + ' marcado como ANORMAL sem foto do ANTES.\n\nTodos os itens anormais precisam de foto.');
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
            if(timerInterval) clearInterval(timerInterval);
            
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
            
            if(document.querySelector('#checklistContent input[type="radio"]')) currentOM.checklistDados = coletarChecklistDados();
            currentOM.checklistFotos = checklistFotos;
            currentOM.emOficina = true;
            currentOM.retornouOficina = false;
            currentOM.devolvendoEquipamento = false;
            currentOM.dataEnvioOficina = new Date().toISOString();
            currentOM.lockDeviceId = null;
            currentOM._deslocSegundosSnapshot = deslocamentoSegundos;

            // Fluxo v2: status de oficina e snapshot
            currentOM.statusOficina = STATUS_OFICINA.EM_OFICINA;
            currentOM.etapaOficina = ETAPA_OFICINA.CAMPO;
            currentOM.hhSnapshotOficina = {
                hh: currentOM.historicoExecucao ? currentOM.historicoExecucao.slice() : [],
                efetivo: executantesNomes.slice(),
                deslocamento: deslocamentoSegundos
            };

            localStorage.removeItem(STORAGE_KEY_CURRENT);
            salvarOMs();
            _pushOMStatusSupabase(currentOM);
            setTimeout(function() { _uploadPDFRelatorio(currentOM.num); }, 800);

            alert('🔧 ENVIADO PARA OFICINA!\n\nHH pausado. OM disponível para qualquer equipe iniciar na oficina.');
            hideDetail();
            filtrarOMs();
        }

        // --- Fluxo v2: Finalizar atividade na oficina ---
        function finalizarOficina() {
            if(!confirm('🔧 FINALIZAR ATIVIDADE NA OFICINA?\n\nO HH será pausado.\nA OM ficará com status AGUARDANDO DEVOLUÇÃO.')) return;

            if(timerAtividadeInterval) clearInterval(timerAtividadeInterval);
            if(timerInterval) clearInterval(timerInterval);

            if(currentOM.historicoExecucao && currentOM.historicoExecucao.length > 0) {
                var historicoAtual = currentOM.historicoExecucao[currentOM.historicoExecucao.length - 1];
                if(historicoAtual.dataInicio && !historicoAtual.dataFim) {
                    var diff = Math.floor((new Date() - new Date(historicoAtual.dataInicio)) / 1000) - tempoPausadoTotal;
                    historicoAtual.dataFim = new Date().toISOString();
                    historicoAtual.hhAtividade = diff / 3600;
                    historicoAtual.hhDeslocamento = 0;
                    _calcHH(historicoAtual);
                    historicoAtual.tempoPausadoTotal = tempoPausadoTotal;
                    historicoAtual.materiaisUsados = materiaisUsados.slice();
                    historicoAtual.tag = 'OFICINA_FIM';
                }
            }

            if(document.querySelector('#checklistContent input[type="radio"]')) currentOM.checklistDados = coletarChecklistDados();
            currentOM.checklistFotos = checklistFotos;

            // Mudar para aguardando devolucao
            currentOM.statusOficina = STATUS_OFICINA.AGUARDANDO_DEVOLUCAO;
            currentOM.etapaOficina = ETAPA_OFICINA.OFICINA;
            currentOM.dataFimOficina = new Date().toISOString();
            currentOM.lockDeviceId = null;
            currentOM.statusAtual = null;

            deslocamentoSegundos = 0;
            tempoPausadoTotal = 0;
            executantesNomes = [];
            atividadeJaIniciada = false;
            localStorage.removeItem(STORAGE_KEY_CURRENT);
            salvarOMs();
            _pushOMStatusSupabase(currentOM);

            alert('🔧 OFICINA FINALIZADA!\n\nHH pausado. Status: AGUARDANDO DEVOLUÇÃO.\nQualquer equipe pode iniciar a montagem.');
            hideDetail();
            filtrarOMs();
        }

        // --- Troca de turno na oficina ---
        function confirmarTrocaTurnoOficina() {
            if(!confirm('🔄 TROCA DE TURNO NA OFICINA\n\nA OM será pausada e ficará disponível para a próxima equipe na oficina.\n\nConfirmar?')) return;

            if(timerAtividadeInterval) clearInterval(timerAtividadeInterval);

            if(currentOM.historicoExecucao && currentOM.historicoExecucao.length > 0) {
                var hExec = currentOM.historicoExecucao[currentOM.historicoExecucao.length - 1];
                if(hExec.dataInicio && !hExec.dataFim) {
                    var atividadeSeg = Math.floor((new Date() - new Date(hExec.dataInicio)) / 1000) - tempoPausadoTotal;
                    if(atividadeSeg < 0) atividadeSeg = 0;
                    hExec.dataFim = new Date().toISOString();
                    hExec.hhAtividade = atividadeSeg / 3600;
                    hExec.hhDeslocamento = 0;
                    _calcHH(hExec);
                    hExec.tempoPausadoTotal = tempoPausadoTotal;
                    hExec.tag = 'OFICINA_TROCA_TURNO';
                }
            }

            if(document.querySelector('#checklistContent input[type="radio"]')) currentOM.checklistDados = coletarChecklistDados();
            currentOM.checklistFotos = checklistFotos;

            currentOM.oficinaPausada = true;
            currentOM.oficinaTrocaTurno = true;
            currentOM.oficinaPausaInicio = new Date().toISOString();
            currentOM.oficinaPausaExecutantes = executantesNomes.slice();
            currentOM.oficinaPausaMateriaisUsados = materiaisUsados.slice();
            currentOM.lockDeviceId = null;
            currentOM.statusAtual = null;

            deslocamentoSegundos = 0;
            tempoPausadoTotal = 0;
            executantesNomes = [];
            atividadeJaIniciada = false;
            localStorage.removeItem(STORAGE_KEY_CURRENT);
            salvarOMs();
            _pushOMStatusSupabase(currentOM);

            alert('🔄 TROCA DE TURNO registrada na oficina.\n\nOM disponível para a próxima equipe.');
            hideDetail();
            filtrarOMs();
        }

        function devolverEquipamento() {
            var temAnormal = false;
            for(var i = 0; i < _nomesChecklist.length; i++) {
                var nomeItem = _nomesChecklist[i];
                var valorItem = _obterValorChecklistItem(nomeItem);
                if(valorItem === 'anormal') {
                    temAnormal = true;
                    var foto = checklistFotos[nomeItem] || {};
                    if(!foto.antes) {
                        alert('⚠️ Item ' + nomeItem.toUpperCase() + ' ANORMAL sem foto do ANTES.\n\nTire a foto do problema encontrado.');
                        return;
                    }
                    if(foto.antes && !foto.depois) {
                        alert('⚠️ Item ' + nomeItem.toUpperCase() + ' tem Foto ANTES mas falta a Foto DEPOIS.\n\nTire a foto após o reparo antes de devolver.');
                        return;
                    }
                }
            }
            
            if(!confirm('🔧 DEVOLVER EQUIPAMENTO?\n\nIniciará o deslocamento para montagem.')) return;
            
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
            
            if(document.querySelector('#checklistContent input[type="radio"]')) currentOM.checklistDados = coletarChecklistDados();
            currentOM.checklistFotos = checklistFotos;
            currentOM.retornouOficina = true;
            currentOM.devolvendoEquipamento = true;
            
            salvarOMAtual();

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
            var div = $('resumoHistorico');

            if(!currentOM.historicoExecucao || currentOM.historicoExecucao.length === 0) {
                div.innerHTML = '';
                return;
            }

            var temOficina = !!(currentOM.hhSnapshotOficina || currentOM.dataEnvioOficina || currentOM.etapaOficina);

            // Se tem oficina, mostrar timeline resumida
            var htmlTimeline = '';
            if(temOficina) {
                var etapas = { CAMPO: [], OFICINA: [], MONTAGEM: [] };
                for(var tli = 0; tli < currentOM.historicoExecucao.length; tli++) {
                    var tlH = currentOM.historicoExecucao[tli];
                    var tlTag = tlH.tag || 'ATIVIDADE';
                    var etapa = 'CAMPO';
                    if(tlTag === 'OFICINA' || tlTag === 'OFICINA_FIM' || tlTag === 'OFICINA_TROCA_TURNO') etapa = 'OFICINA';
                    else if(tlTag === 'MONTAGEM') etapa = 'MONTAGEM';
                    etapas[etapa].push(tlH);
                }
                var cores = { CAMPO: '#1A5276', OFICINA: '#e65100', MONTAGEM: '#2e7d32' };
                var icones = { CAMPO: '📍', OFICINA: '🔧', MONTAGEM: '🔩' };
                htmlTimeline = '<div style="margin-bottom:16px;padding:12px;background:linear-gradient(135deg,#f0f4f8,#e3ecf5);border-radius:12px;border:1px solid #c5d5e4;">';
                htmlTimeline += '<div style="font-size:15px;font-weight:800;color:#1A5276;margin-bottom:10px;">📊 Timeline do Fluxo</div>';
                var ordemEt = ['CAMPO', 'OFICINA', 'MONTAGEM'];
                for(var oi = 0; oi < ordemEt.length; oi++) {
                    var eNome = ordemEt[oi];
                    var eArr = etapas[eNome];
                    if(!eArr || eArr.length === 0) continue;
                    var eHH = 0;
                    for(var j = 0; j < eArr.length; j++) eHH += (eArr[j].hhAtividade || 0);
                    htmlTimeline += '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #d0dce8;">';
                    htmlTimeline += '<span style="font-size:18px;">' + icones[eNome] + '</span>';
                    htmlTimeline += '<span style="font-weight:800;color:' + cores[eNome] + ';font-size:13px;min-width:70px;">' + eNome + '</span>';
                    htmlTimeline += '<span style="font-size:12px;color:#555;">HH: <strong>' + eHH.toFixed(2) + 'h</strong></span>';
                    htmlTimeline += '</div>';
                }
                htmlTimeline += '</div>';
            }

            var html = htmlTimeline + '<div style="margin-bottom:20px;"><h4 style="color:#1A5276;margin-bottom:12px;font-size:16px;font-weight:800;">📅 Histórico por Colaborador</h4>';
            
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

            function _valorChecklist(nomeItem) {
                var sel = document.querySelector('input[name="' + nomeItem + '"]:checked');
                if(sel) return sel.value;
                if(!currentOM || !Array.isArray(currentOM.checklistDados)) return '';
                var sec = nomeItem.charAt(0) === 'm' ? 'MENSAL' : 'TRIMESTRAL EM CASO DE ANOMALIA';
                var idx = parseInt(nomeItem.slice(1), 10);
                if(!idx) return '';
                var num = String(idx).padStart(2, '0');
                for(var c = 0; c < currentOM.checklistDados.length; c++) {
                    var item = currentOM.checklistDados[c];
                    if(item && item.secao === sec && String(item.num || '') === num) {
                        return item.valor || '';
                    }
                }
                return '';
            }

            var naoMarcadosMensal = [], naoMarcadosTri = [], semFoto = [];
            var preenchidosMensal = 0, preenchidosTri = 0;
            for(var n = 0; n < nomesMensais.length; n++) {
                var valorM = _valorChecklist(nomesMensais[n]);
                if(valorM) preenchidosMensal++;
                else naoMarcadosMensal.push(nomesMensais[n]);
            }
            for(var t = 0; t < checklistItens.trimestral.length; t++) {
                var nomeT = 't' + (t + 1);
                var valorT = _valorChecklist(nomeT);
                if(valorT) preenchidosTri++;
                else naoMarcadosTri.push(nomeT);
            }
            for(var x = 0; x < nomesTodos.length; x++) {
                var name = nomesTodos[x];
                var valor = _valorChecklist(name);
                if(!valor) continue;
                if(valor === 'anormal') {
                    var foto = checklistFotos[name] || {};
                    if(!foto.antes) semFoto.push(name);
                }
            }
            var erros = [];
            if(preenchidosMensal === 0 && preenchidosTri === 0) {
                erros.push('⚠️ ' + naoMarcadosMensal.length + ' item(ns) MENSAL sem marcação: ' + naoMarcadosMensal.join(', ').toUpperCase());
            } else {
                if(naoMarcadosMensal.length > 0) erros.push('⚠️ ' + naoMarcadosMensal.length + ' item(ns) MENSAL sem marcação: ' + naoMarcadosMensal.join(', ').toUpperCase());
                if(preenchidosTri > 0 && naoMarcadosTri.length > 0) erros.push('⚠️ ' + naoMarcadosTri.length + ' item(ns) TRIMESTRAL sem marcação: ' + naoMarcadosTri.join(', ').toUpperCase());
            }
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

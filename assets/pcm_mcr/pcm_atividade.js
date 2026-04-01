// --- Helpers internos ---

        function _lerInputsExecutantes() {
            var inputs = document.querySelectorAll('.exec-input');
            var nomes = [];
            inputs.forEach(function(input) { if(input.value.trim()) nomes.push(input.value.trim()); });
            return nomes;
        }

        function _iniciarTimerDeslocamento() {
            if(timerInterval) clearInterval(timerInterval);
            deslocamentoInicio = new Date();
            currentOM._deslocHoraInicio = deslocamentoInicio.toISOString();
            currentOM._deslocHoraFim = null;
            $('timerDisplay').style.display = 'block';
            var infoDiv = $('timerDateInfo');
            if(infoDiv) {
                infoDiv.style.display = 'block';
                infoDiv.textContent = '🚗 Início: ' + deslocamentoInicio.toLocaleDateString('pt-BR') + ' ' + deslocamentoInicio.toLocaleTimeString('pt-BR');
            }
            timerInterval = setInterval(function() {
                var diff = Math.floor((new Date() - deslocamentoInicio) / 1000);
                $('timerDisplay').textContent = _fmtDuracaoRelogio(diff);
                deslocamentoSegundos = diff;
                deslocamentoMinutos = Math.floor(diff / 60);
                $('hhDeslocamento').textContent = _fmtDeslocResumo(diff);
            }, 1000);
        }

        function _pushHistoricoExecucao(tag, opts) {
            opts = opts || {};
            if(!currentOM.historicoExecucao) currentOM.historicoExecucao = [];
            currentOM.historicoExecucao.push({
                data: new Date().toLocaleDateString('pt-BR'),
                executantes: executantesNomes.slice(),
                dataInicio: atividadeInicio.toISOString(),
                dataFim: null,
                deslocamentoMinutos: opts.semDeslocamento ? 0 : deslocamentoMinutos,
                deslocamentoSegundos: opts.semDeslocamento ? 0 : deslocamentoSegundos,
                deslocamentoHoraInicio: opts.semDeslocamento ? null : (currentOM._deslocHoraInicio || null),
                deslocamentoHoraFim: opts.semDeslocamento ? null : (currentOM._deslocHoraFim || null),
                tempoPausadoTotal: 0,
                materiaisUsados: [],
                tag: tag
            });
        }

        // --- Deslocamento campo ---

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

            deslocamentoSegundos = 0;
            deslocamentoMinutos = 0;
            _setBtns({ btnDeslocamento:0, btnIniciar:1, btnCancelar:0, btnExcluir:0, btnCancelarDesvio:0 });
            $('btnIniciar').disabled = false;

            if(currentOM.desvioApontado) {
                if(typeof _registrarEventoDesvio === 'function') {
                    _registrarEventoDesvio('NOVA_TENTATIVA_INICIADA', {
                        ultimoDesvioCod: currentOM.ultimoDesvioCod || null,
                        ultimoDesvioLabel: currentOM.ultimoDesvioLabel || null
                    });
                }
                currentOM.desvioApontado = false;
                currentOM.novaTentativaPendente = false;
                currentOM.novaTentativaIniciadaEm = new Date().toISOString();
            }
            $('timerDisplay').style.display = 'block';
            const infoDiv = $('timerDateInfo');
            if(infoDiv) { infoDiv.style.display = 'block'; infoDiv.textContent = '🚗 Início: ' + deslocamentoInicio.toLocaleDateString('pt-BR') + ' ' + deslocamentoInicio.toLocaleTimeString('pt-BR'); }
            
            timerInterval = setInterval(() => {
                const diff = Math.floor((new Date() - deslocamentoInicio) / 1000);
                $('timerDisplay').textContent = _fmtDuracaoRelogio(diff);
                deslocamentoSegundos = diff;
                deslocamentoMinutos = Math.floor(diff / 60);
                $('hhDeslocamento').textContent = _fmtDeslocResumo(diff);
            }, 1000);
            salvarOMAtual();
            _pushOMStatusSupabase(currentOM);
        }

        // --- Popup executantes ---

        function showExecutantes() {
            if(window._modoExecutantesOficina || window._modoExecutantesMontagem) return;

            if(currentOM && currentOM.desvioMesmaEquipe && currentOM.desvioProxExecs && currentOM.desvioProxExecs.length > 0) {
                executantesNomes = currentOM.desvioProxExecs.slice();
                currentOM.desvioProxExecs = null;
                currentOM.desvioMesmaEquipe = false;
            }

            if(currentOM && currentOM.emOficina) {
                deslocamentoSegundos = 0;
                deslocamentoMinutos = 0;
                currentOM._deslocHoraInicio = null;
                currentOM._deslocHoraFim = null;
            } else if(currentOM && currentOM.desvioProxSemDesl) {
                if(timerInterval) clearInterval(timerInterval);
                deslocamentoSegundos = 0;
                deslocamentoMinutos = 0;
                const _agora = new Date().toISOString();
                currentOM._deslocHoraInicio = _agora;
                currentOM._deslocHoraFim = _agora;
                currentOM.desvioProxSemDesl = false;
            } else {
                if(timerInterval) clearInterval(timerInterval);
                deslocamentoSegundos = Math.floor((new Date() - deslocamentoInicio) / 1000);
                deslocamentoMinutos = Math.floor(deslocamentoSegundos / 60);
                currentOM._deslocHoraFim = new Date().toISOString();
            }
            $('timerDisplay').style.display = 'none';

            const list = $('executantesList');
            if(executantesNomes.length > 0) {
                list.innerHTML = executantesNomes.map(function(n) {
                    return '<input type="text" class="exec-input" value="' + n.replace(/"/g, '&quot;') + '">';
                }).join('');
            } else {
                list.innerHTML = '<input type="text" placeholder="Nome completo do executante" class="exec-input">' +
                    '<input type="text" placeholder="Nome completo do executante" class="exec-input">';
            }
            $('popupExecutantes').classList.add('active');
        }

        function hideExecutantes() {
            $('popupExecutantes').classList.remove('active');
            window._modoExecutantesOficina = false;
            window._modoExecutantesMontagem = false;
        }

        function addExecutante() {
            var input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'Nome completo do executante';
            input.className = 'exec-input';
            $('executantesList').appendChild(input);
        }

        function salvarExecutantes() {
            if(window._salvandoExecutantes) return;
            window._salvandoExecutantes = true;
            setTimeout(function(){ window._salvandoExecutantes = false; }, 1200);

            if(window._modoExecutantesOficina) {
                window._modoExecutantesOficina = false;
                salvarExecutantesOficina();
                return;
            }
            if(window._modoExecutantesMontagem) {
                window._modoExecutantesMontagem = false;
                salvarExecutantesMontagem();
                return;
            }

            const inputs = document.querySelectorAll('.exec-input');
            numExecutantes = 0;
            executantesNomes = [];

            inputs.forEach(function(input) {
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
            
            const ultimoHist = currentOM.historicoExecucao.length > 0 ? currentOM.historicoExecucao[currentOM.historicoExecucao.length - 1] : null;
            if(ultimoHist && !ultimoHist.dataFim) {
                ultimoHist.executantes = executantesNomes.slice();
                ultimoHist.deslocamentoMinutos = deslocamentoMinutos;
                ultimoHist.deslocamentoSegundos = deslocamentoSegundos;
                ultimoHist.deslocamentoHoraInicio = currentOM._deslocHoraInicio || ultimoHist.deslocamentoHoraInicio || null;
                ultimoHist.deslocamentoHoraFim = currentOM._deslocHoraFim || ultimoHist.deslocamentoHoraFim || null;
            } else {
                _pushHistoricoExecucao('CAMPO');
            }

            currentOM.statusAtual = 'iniciada';
            currentOM.primeiroExecutante = executantesNomes[0] || '';
            _uiAtividade();
            iniciarCronometroAtividade();
            renderHistoricoExecucao();
            hideExecutantes();
            salvarOMAtual();
            _pushOMStatusSupabase(currentOM);
            alert('✅ Atividade iniciada!\n' + numExecutantes + ' executante(s)');
        }

        function editarExecutantes() {
            if(omAssinada) { alert('⚠️ OM já assinada! Não é possível editar.'); return; }
            var list = $('executantesList');
            list.innerHTML = '';
            executantesNomes.forEach(function(nome) {
                var input = document.createElement('input');
                input.type = 'text';
                input.value = nome;
                input.className = 'exec-input';
                list.appendChild(input);
            });
            $('popupExecutantes').classList.add('active');
        }

        // --- Cronômetro de atividade ---

        function iniciarCronometroAtividade() {
            const ativInfoDiv = $('timerAtivDateInfo');
            if(ativInfoDiv) {
                ativInfoDiv.style.display = 'block';
                ativInfoDiv.textContent = '⏱️ Início: ' + atividadeInicio.toLocaleDateString('pt-BR') + ' ' + atividadeInicio.toLocaleTimeString('pt-BR');
            }
            const deslocInfoDiv = $('timerDateInfo');
            if(deslocInfoDiv && currentOM._deslocHoraInicio) {
                deslocInfoDiv.style.display = 'block';
                const di = new Date(currentOM._deslocHoraInicio);
                const df = currentOM._deslocHoraFim ? new Date(currentOM._deslocHoraFim) : null;
                deslocInfoDiv.textContent = '🚗 ' + di.toLocaleTimeString('pt-BR') + (df ? ' → ' + df.toLocaleTimeString('pt-BR') : '');
            }
            if(timerAtividadeInterval) clearInterval(timerAtividadeInterval);
            timerAtividadeInterval = setInterval(function() {
                var diff = Math.floor((new Date() - atividadeInicio) / 1000) - tempoPausadoTotal;
                var h = Math.floor(diff / 3600);
                var m = Math.floor((diff % 3600) / 60);
                var s = diff % 60;
                $('timerAtividade').textContent = '⏱️ ' + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
                var atividadeHoras = (diff / 3600).toFixed(2);
                $('hhAtividade').textContent = atividadeHoras + 'h × ' + numExecutantes + ' = ' + (atividadeHoras * numExecutantes).toFixed(2) + 'h';
                var hhDeslocRaw = deslocamentoSegundos / 3600;
                var hhDeslocEquipe = (hhDeslocRaw * numExecutantes).toFixed(2);
                var hhTotal = (parseFloat((atividadeHoras * numExecutantes).toFixed(2)) + parseFloat(hhDeslocEquipe)).toFixed(2);
                $('hhDeslocamento').textContent = _fmtDeslocResumo(deslocamentoSegundos) + ' × ' + numExecutantes + ' = ' + hhDeslocEquipe + 'h';
                $('hhTotal').textContent = hhTotal + 'h';
            }, 1000);
        }

        function showPausarMenu() { showMenuDesvios(); }

        function toggleChecklistCorretiva() {
            if(currentOM.planoCod || currentOM.checklistCorretiva) {
                _mostrarChecklistUI(true);
                return;
            }
            if(!confirm('⚠️ Habilitar checklist nesta OM corretiva?\n\nApós habilitar, o checklist ficará disponível e não poderá ser desativado.')) return;
            currentOM.checklistCorretiva = true;
            $('btnChecklist').style.display = 'none';
            $('btnOficina').style.display = 'block';
            if(atividadeJaIniciada || currentOM.statusAtual === 'iniciada') {
                _mostrarChecklistUI(true);
            } else {
                alert('✅ Checklist habilitado!\nInicie a atividade para preenchê-lo.');
            }
            salvarOMAtual();
        }

        // --- Fluxo Oficina ---

        function showExecutantesOficina() {
            if(atividadeJaIniciada || (currentOM.statusAtual === 'iniciada' && currentOM.etapaOficina === ETAPA_OFICINA.OFICINA)) return;
            deslocamentoSegundos = 0;
            deslocamentoMinutos = 0;
            currentOM._deslocHoraInicio = null;
            currentOM._deslocHoraFim = null;

            const list = $('executantesList');
            list.innerHTML = '<input type="text" placeholder="Nome completo do executante" class="exec-input">' +
                             '<input type="text" placeholder="Nome completo do executante" class="exec-input">';
            // Mudar botao de confirmar para modo oficina
            window._modoExecutantesOficina = true;
            $('popupExecutantes').classList.add('active');
        }

        function salvarExecutantesOficina() {
            const inputs = document.querySelectorAll('.exec-input');
            numExecutantes = 0;
            executantesNomes = [];
            inputs.forEach(function(input) {
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
            currentOM.statusAtual = 'iniciada';
            currentOM.primeiroExecutante = executantesNomes[0] || '';

            currentOM.etapaOficina = ETAPA_OFICINA.OFICINA;
            currentOM.dataInicioOficina = atividadeInicio.toISOString();
            currentOM.lockDeviceId = deviceId;
            currentOM.oficinaPausada = false;
            currentOM.retornouOficina = false;
            currentOM.devolvendoEquipamento = false;

            _pushHistoricoExecucao('OFICINA', { semDeslocamento: true });

            _uiAtividade();
            _setBtns({ btnOficina:0, btnFinalizarOficina:1, btnIniciarMontagem:0, btnDevolverEquip:0 });
            iniciarCronometroAtividade();
            renderHistoricoExecucao();
            hideExecutantes();
            salvarOMAtual();
            _pushOMStatusSupabase(currentOM);

            if(currentOM.planoCod || currentOM.checklistCorretiva) _mostrarChecklistUI(false);
            alert('✅ Atividade na OFICINA iniciada!\n' + numExecutantes + ' executante(s)\nSem deslocamento.');
        }

        // --- Fluxo Devolução / Montagem ---

        function iniciarDevolucao() {
            if(!confirm('🚗 INICIAR DEVOLUÇÃO?\n\nO tempo de deslocamento será contado.\nApós chegar, clique em INICIAR MONTAGEM para informar o efetivo.')) return;

            deslocamentoSegundos = 0;
            deslocamentoMinutos = 0;
            deslocamentoInicio = new Date();
            currentOM._deslocHoraInicio = deslocamentoInicio.toISOString();
            currentOM._deslocHoraFim = null;
            currentOM.etapaOficina = ETAPA_OFICINA.MONTAGEM;
            currentOM.statusOficina = null;
            currentOM.emOficina = false;
            currentOM.retornouOficina = true;
            currentOM.devolvendoEquipamento = true;
            currentOM.dataInicioMontagem = new Date().toISOString();
            currentOM.lockDeviceId = deviceId;

            _setBtns({
                btnDeslocamento:0, btnIniciar:0, btnMateriais:0, btnRowExecOficina:0,
                btnFinalizar:0, btnDevolverEquip:0, btnFinalizarOficina:0, btnIniciarMontagem:0,
                timerDisplay:1, btnCancelar:0, btnExcluir:0
            });
            $('btnIniciar').disabled = false;
            $('btnIniciar').textContent = '🔧 INICIAR MONTAGEM';
            $('btnIniciar').onclick = function() { showExecutantesMontagem(); };
            _aplicarModoOficinaMinimal(false);

            timerInterval = setInterval(function() {
                const diff = Math.floor((new Date() - deslocamentoInicio) / 1000);
                $('timerDisplay').textContent = _fmtDuracaoRelogio(diff);
                deslocamentoSegundos = diff;
                deslocamentoMinutos = Math.floor(diff / 60);
                $('hhDeslocamento').textContent = _fmtDeslocResumo(diff);
            }, 1000);

            currentOM.statusAtual = 'em_deslocamento';
            salvarOMAtual();
            _pushOMStatusSupabase(currentOM);
        }

        function showExecutantesMontagem() {
            currentOM._deslocHoraFim = new Date().toISOString();

            const list = $('executantesList');
            list.innerHTML = '<input type="text" placeholder="Nome completo do executante" class="exec-input">' +
                             '<input type="text" placeholder="Nome completo do executante" class="exec-input">';
            window._modoExecutantesMontagem = true;
            $('popupExecutantes').classList.add('active');
        }

        function salvarExecutantesMontagem() {
            const inputs = document.querySelectorAll('.exec-input');
            numExecutantes = 0;
            executantesNomes = [];
            inputs.forEach(function(input) {
                if(input.value.trim()) {
                    numExecutantes++;
                    executantesNomes.push(input.value.trim());
                }
            });
            if(numExecutantes === 0) {
                alert('⚠️ Adicione pelo menos 1 executante!');
                return;
            }

            if(timerInterval) clearInterval(timerInterval);

            atividadeInicio = new Date();
            tempoPausadoTotal = 0;
            atividadeJaIniciada = true;
            currentOM.devolvendoEquipamento = false;
            currentOM.statusAtual = 'iniciada';
            currentOM.primeiroExecutante = executantesNomes[0] || '';

            _pushHistoricoExecucao('MONTAGEM');

            hideExecutantes();
            $('btnIniciar').textContent = '▶️ INICIAR ATIVIDADE';
            $('btnIniciar').onclick = null;

            _uiAtividade(true);
            $('checklistSection').style.display = 'none';
            $('checklistActions').style.display = 'none';
            $('checklistContent').style.display = 'none';
            $('checklistContent').innerHTML = '';
            _aplicarModoChecklistFoco(false);

            iniciarCronometroAtividade();
            renderHistoricoExecucao();
            salvarOMAtual();
            _pushOMStatusSupabase(currentOM);
            alert('✅ MONTAGEM INICIADA!\n\n' + numExecutantes + ' executante(s)\nDeslocamento (devolução): ' + deslocamentoMinutos + ' min');
        }

        // --- Retomar oficina (troca de turno) ---

        function showRetomarOficina(idx) {
            currentOM = oms[idx];
            _retomarExecs = [];
            _retomarMesmaEquipe = true;
            $('retomarInfo').innerHTML =
                '<b>OM:</b> ' + currentOM.num + '<br>' +
                '<b>Título:</b> ' + (currentOM.titulo || '') + '<br>' +
                '<b>Motivo pausa:</b> Troca de Turno (Oficina)<br>' +
                '<b>Pausada em:</b> ' + (currentOM.oficinaPausaInicio ? new Date(currentOM.oficinaPausaInicio).toLocaleString('pt-BR') : '--') + '<br>' +
                (currentOM.oficinaPausaExecutantes && currentOM.oficinaPausaExecutantes.length > 0 ? '<b>Equipe anterior:</b> ' + currentOM.oficinaPausaExecutantes.join(', ') : '');
            $('retomarEquipeDiv').style.display = 'none';
            $('retomarLocalLabel').style.display = 'none';
            $('retomarLocalDiv').style.display = 'none';
            $('retomarExecLista').innerHTML = '';
            window._retomarModoOficina = true;
            $('popupRetomar').classList.add('active');
        }

        function retomarOficina() {
            if(!_retomarMesmaEquipe && _retomarExecs.length === 0) {
                alert('⚠️ Adicione ao menos um executante.');
                return;
            }
            hideRetomar();
            window._retomarModoOficina = false;

            currentOM.oficinaPausada = false;
            currentOM.lockDeviceId = deviceId;
            executantesNomes = _retomarExecs.slice();
            materiaisUsados = currentOM.oficinaPausaMateriaisUsados ? currentOM.oficinaPausaMateriaisUsados.slice() : materiaisUsados.slice();
            currentOM.primeiroExecutante = executantesNomes[0] || '';

            numExecutantes = executantesNomes.length;
            atividadeInicio = new Date();
            tempoPausadoTotal = 0;
            atividadeJaIniciada = true;
            deslocamentoSegundos = 0;
            deslocamentoMinutos = 0;

            _pushHistoricoExecucao('OFICINA', { semDeslocamento: true });

            currentOM.statusAtual = 'iniciada';
            salvarOMAtual();
            showDetail(oms.indexOf(currentOM));
        }

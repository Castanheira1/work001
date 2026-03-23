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

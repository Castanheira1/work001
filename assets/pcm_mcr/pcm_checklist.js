const checklistItens = {
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
            const emOficina = currentOM && currentOM.retornouOficina;
            if(currentOM && currentOM.checklistFotos) checklistFotos = currentOM.checklistFotos;
            let html = '<div style="padding: 0 20px 20px;">';
            html += '<div class="toolbar-row">' +
                    '<button type="button" onclick="marcarConformeMensal()" class="toolbar-btn">✅ Conforme MENSAL</button>' +
                    '<button type="button" onclick="marcarConformeTrimestral()" class="toolbar-btn" style="margin-left:8px;">✅ Conforme TRIMESTRAL</button>' +
                    '</div>';
            html += '<div class="checklist-subtitle">MENSAL</div>';
            for(let i = 0; i < checklistItens.mensal.length; i++) {
                html += buildChecklistItem('m' + (i + 1), String(i + 1).padStart(2, '0'), checklistItens.mensal[i], emOficina);
            }
            html += '<div class="checklist-subtitle">TRIMESTRAL EM CASO DE ANOMALIA</div>';
            for(let i = 0; i < checklistItens.trimestral.length; i++) {
                html += buildChecklistItem('t' + (i + 1), String(i + 1).padStart(2, '0'), checklistItens.trimestral[i], emOficina);
            }
            html += '</div>';
            return html;
        }

        function buildChecklistItem(name, num, titulo, emOficina) {
            const foto = checklistFotos[name] || {};
            let savedVal = '';
            let savedObs = '';
            const podeEditar = _podeEditarChecklistAgora();
            if(currentOM && currentOM.checklistDados) {
                const found = currentOM.checklistDados.find(function(c){ return c.titulo === titulo; });
                if(found) { savedVal = found.valor; savedObs = found.obs || ''; }
            }
            let h = '<div class="checklist-item" id="chkItem_' + name + '">';
            h += '<div class="checklist-item-title">' + num + '. ' + titulo + '</div>';
            h += '<div class="checklist-radios">';
            h += '<label><input type="radio" name="' + name + '" value="normal" onchange="onChecklistChange(\'' + name + '\')"' + (savedVal === 'normal' ? ' checked' : '') + (podeEditar ? '' : ' disabled') + '> Normal</label>';
            h += '<label><input type="radio" name="' + name + '" value="anormal" onchange="onChecklistChange(\'' + name + '\')"' + (savedVal === 'anormal' ? ' checked' : '') + (podeEditar ? '' : ' disabled') + '> Anormal</label>';
            h += '</div>';
            h += '<div class="checklist-foto-row" id="fotoRow_' + name + '" style="display:' + (savedVal === 'anormal' || foto.antes ? 'flex' : 'none') + ';">';
            h += '<button class="checklist-foto-btn' + (foto.antes ? ' ok' : '') + '" id="fotoAntesBtn_' + name + '" onclick="capturarFoto(\'' + name + '\',\'antes\')">' + (foto.antes ? '📎 Foto Antes ✓' : '📷 Foto Antes *') + '</button>';
            h += '<button class="checklist-foto-btn depois' + (foto.depois ? ' ok' : '') + '" id="fotoDepoisBtn_' + name + '" onclick="capturarFoto(\'' + name + '\',\'depois\')" style="display:' + (foto.antes ? 'inline-block' : 'none') + ';">' + (foto.depois ? '📎 Foto Depois ✓' : '📷 Foto Depois') + '</button>';
            h += '</div>';
            h += '<input type="text" class="checklist-explicacao" id="explicacao_' + name + '" placeholder="Explicação do problema..." style="display:' + (savedVal === 'anormal' ? 'block' : 'none') + ';" value="' + (foto.explicacao || '').replace(/"/g, '&quot;') + '" oninput="salvarExplicacao(\'' + name + '\')"' + (podeEditar ? '' : ' readonly') + '>';
            h += '<input type="text" class="checklist-obs" placeholder="Observações..." value="' + savedObs.replace(/"/g, '&quot;') + '" oninput="salvarChecklistParcial()"' + (podeEditar ? '' : ' readonly') + '>';
            h += '</div>';
            return h;
        }

        function _podeEditarChecklistAgora() {
            if(!currentOM) return false;
            // Oficina: só edita se a atividade foi iniciada na etapa OFICINA
            if(currentOM.emOficina) {
                if(currentOM.etapaOficina === ETAPA_OFICINA.OFICINA) {
                    return !!(atividadeJaIniciada || currentOM.statusAtual === 'iniciada');
                }
                return false; // emOficina mas ainda aguardando inicio (etapa CAMPO)
            }
            // Montagem (retornou da oficina): edita somente se atividade iniciada
            if(currentOM.retornouOficina || currentOM.devolvendoEquipamento) {
                return !!(atividadeJaIniciada || currentOM.statusAtual === 'iniciada');
            }
            // Fluxo campo normal
            return true;
        }

        function onChecklistChange(name) {
            const sel = document.querySelector('input[name="' + name + '"]:checked');
            const fotoRow = document.getElementById('fotoRow_' + name);
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

        let _chkSaveTimer = null;
        function _temPassoOficinaNaOM() {
            if(!currentOM) return false;
            if(currentOM.emOficina || currentOM.retornouOficina || currentOM.devolvendoEquipamento) return true;
            if(currentOM.statusOficina) return true;
            var hist = Array.isArray(currentOM.historicoExecucao) ? currentOM.historicoExecucao : [];
            for(var i = 0; i < hist.length; i++) {
                var tag = String((hist[i] && hist[i].tag) || '').toUpperCase();
                if(tag.indexOf('OFICINA') >= 0) return true;
            }
            return false;
        }

        function salvarChecklistEFechar() {
            // Foto Depois não é validada aqui — será exigida em showFinalizar (validarChecklist)
            // somente se a OM for finalizada sem passar pelo fluxo de oficina.
            currentOM.checklistDados = coletarChecklistDados();
            currentOM.checklistFotos = checklistFotos;
            salvarOMAtual();
            $('checklistContent').innerHTML = '';
            $('checklistContent').style.display = 'none';
            $('btnSalvarChecklist').style.display = 'none';
            $('checklistSection').textContent = '📋 Checklist Salvo ✅';
            // Atualizar texto do btnChecklist para "EDITAR CHECKLIST"
            var _bc = $('btnChecklist'); if(_bc) _bc.innerHTML = '📋 EDITAR CHECKLIST';

            const emEtapaOficina = !!(currentOM && currentOM.emOficina);
            const emEtapaMontagem = !!(currentOM && currentOM.retornouOficina);
            const fluxoOficinaAtiva = emEtapaOficina && currentOM.etapaOficina === ETAPA_OFICINA.OFICINA && (atividadeJaIniciada || currentOM.statusAtual === 'iniciada');
            const fluxoChecklistAtivo = !!(currentOM && (currentOM.planoCod || currentOM.checklistCorretiva) && !emEtapaOficina && !emEtapaMontagem);
            if (fluxoOficinaAtiva) {
                _aplicarModoChecklistFoco(false);
                $('checklistSection').style.display = 'block';
                $('checklistActions').style.display = 'none';
                _uiAtividade(true);
                _setBtns({ btnFinalizarOficina:1, btnOficina:0, btnDevolverEquip:0, btnIniciarMontagem:0 });
            } else if (emEtapaMontagem) {
                _aplicarModoChecklistFoco(false);
                _aplicarModoOficinaMinimal(false);
                $('checklistSection').style.display = 'block';
                $('checklistActions').style.display = 'none';
                _uiAtividade(true);
            } else if (emEtapaOficina || fluxoChecklistAtivo) {
                _aplicarModoChecklistFoco(false);
                if (emEtapaOficina) {
                    $('checklistSection').style.display = 'none';
                    $('checklistActions').style.display = 'none';
                    _aplicarModoOficinaMinimal(true);
                    $('btnIniciar').style.display = 'block';
                    $('btnIniciar').disabled = false;
                    _btnOficinaCk();
                } else {
                    _aplicarModoOficinaMinimal(false);
                    $('checklistSection').style.display = 'block';
                    $('checklistActions').style.display = 'none';
                    _uiAtividade(true);
                }
            }

            if(window.showToast) window.showToast('✅ Checklist salvo', 'success', 2000);
        }

        function editarChecklist() {
            _mostrarChecklistUI(true);
            $('checklistSection').textContent = '📋 Checklist de Manutenção';
        }

        function _mostrarChecklistUI(forcarAberto) {
            const isOficina = currentOM && currentOM.emOficina && !currentOM.retornouOficina && !currentOM.devolvendoEquipamento;
            const atividadeAtiva = atividadeJaIniciada || (currentOM && currentOM.statusAtual === 'iniciada');
            _aplicarModoChecklistFoco(true);
            // oficina-minimal só na fase PRÉ-atividade: exibe btnIniciar e VOLTAR ao lado do checklist.
            // Com atividade já iniciada, .controls fica completamente oculto pelo checklist-focus.
            _aplicarModoOficinaMinimal(isOficina && !atividadeAtiva);
            // Redundância de segurança: garantir btnIniciar oculto caso CSS conflite.
            if(isOficina && atividadeAtiva) {
                var _btnIn = $('btnIniciar');
                if(_btnIn) _btnIn.style.setProperty('display', 'none', 'important');
            }
            $('checklistSection').style.display = 'block';
            $('checklistActions').style.display = 'block';
            $('checklistContent').style.display = 'block';
            $('checklistContent').innerHTML = renderChecklist();
            var _showSalvar = true;
            if(isOficina || forcarAberto) {
                _showSalvar = true;
            } else if(currentOM.checklistDados && currentOM.checklistDados.length > 0) {
                _showSalvar = _podeEditarChecklistAgora();
                $('checklistSection').textContent = '📋 Checklist de Manutenção (continuando...)';
            }
            $('btnSalvarChecklist').style.display = _showSalvar ? 'block' : 'none';
            $('checklistActions').style.display = _showSalvar ? 'block' : 'none';
            var _bc = $('btnChecklist'); if(_bc) _bc.innerHTML = '📋 CHECKLIST';
        }

        function salvarChecklistParcial() {
            try {
                if(!currentOM || (!currentOM.planoCod && !currentOM.checklistCorretiva)) return;
                const secao = $('checklistSection');
                if(!secao || secao.style.display === 'none') return;
                if(_chkSaveTimer) clearTimeout(_chkSaveTimer);
                _chkSaveTimer = setTimeout(function() {
                    try {
                        currentOM.checklistDados = coletarChecklistDados();
                        currentOM.checklistFotos = checklistFotos;
                        salvarOMAtual();
                    } catch(e) { console.warn('[PCM] Falha no autosave do checklist:', e); }
                }, 200);
            } catch(e) { console.warn('[PCM] Erro inesperado no autosave:', e); }
        }

        function _detectarTipoChecklist() {
            const totalT = checklistItens.trimestral.length;
            let preenchidosT = 0;
            for(let i = 0; i < totalT; i++) {
                const sel = document.querySelector('input[name="t' + (i + 1) + '"]:checked');
                if(sel) preenchidosT++;
            }
            if(preenchidosT === 0) return 'MENSAL';
            if(preenchidosT === totalT) return 'TRIMESTRAL';
            return 'MISTO';
        }

        function _marcarNomesNormal(nomes) {
            for(let n = 0; n < nomes.length; n++) {
                const name = nomes[n];
                const r = document.querySelector('input[name="' + name + '"][value="normal"]');
                if(r) r.checked = true;
                const row = document.getElementById('fotoRow_' + name);
                if(row) row.style.display = 'none';
                const exp = document.getElementById('explicacao_' + name);
                if(exp) exp.style.display = 'none';
            }
            salvarChecklistParcial();
        }

        function marcarConformeMensal() {
            if(!currentOM || (!currentOM.planoCod && !currentOM.checklistCorretiva)) return;
            if(!confirm('Marcar itens MENSAL (m1–m6) como CONFORME?')) return;
            const nomes = [];
            for(let i = 0; i < checklistItens.mensal.length; i++) nomes.push('m' + (i + 1));
            _marcarNomesNormal(nomes);
        }

        function marcarConformeTrimestral() {
            if(!currentOM || (!currentOM.planoCod && !currentOM.checklistCorretiva)) return;
            if(!confirm('Marcar TODOS os itens (Mensal + Trimestral) como CONFORME?')) return;
            const nomes = [];
            for(let i = 0; i < checklistItens.mensal.length; i++) nomes.push('m' + (i + 1));
            for(let j = 0; j < checklistItens.trimestral.length; j++) nomes.push('t' + (j + 1));
            _marcarNomesNormal(nomes);
        }

function capturarFoto(name, tipo) {
            const fotoAtual = (checklistFotos[name] || {})[tipo];
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
            const file = event.target.files[0];
            if(!file) return;
            const reader = new FileReader();
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
            const img = new Image();
            img.onload = function() {
                const cvs = document.createElement('canvas');
                const maxW = 1200;
                const scale = Math.min(1, maxW / img.width);
                cvs.width = img.width * scale;
                cvs.height = img.height * scale;
                const ctx2 = cvs.getContext('2d');
                ctx2.drawImage(img, 0, 0, cvs.width, cvs.height);
                callback(cvs.toDataURL('image/jpeg', 0.8));
            };
            img.src = base64;
        }

        function atualizarBotoesFoto(name) {
            const foto = checklistFotos[name] || {};
            const btnAntes = document.getElementById('fotoAntesBtn_' + name);
            if(btnAntes) {
                if(foto.antes) {
                    btnAntes.className = 'checklist-foto-btn ok';
                    btnAntes.textContent = '📎 Foto Antes ✓';
                } else {
                    btnAntes.className = 'checklist-foto-btn';
                    btnAntes.textContent = '📷 Foto Antes *';
                }
            }
            const btnDepois = document.getElementById('fotoDepoisBtn_' + name);
            const selChk = document.querySelector('input[name="' + name + '"]:checked');
            const isAnorm = selChk && selChk.value === 'anormal';
            if(btnDepois) {
                btnDepois.style.display = (foto.antes || isAnorm) ? 'inline-block' : 'none';
                if(foto.depois) {
                    btnDepois.className = 'checklist-foto-btn depois ok';
                    btnDepois.textContent = '📎 Foto Depois ✓';
                } else {
                    btnDepois.className = 'checklist-foto-btn depois';
                    btnDepois.textContent = '📷 Foto Depois *';
                }
            }
            const explicacao = document.getElementById('explicacao_' + name);
            if(explicacao && foto.antes) {
                explicacao.style.display = 'block';
            }
        }

        function salvarExplicacao(name) {
            const el = document.getElementById('explicacao_' + name);
            if(!el) return;
            if(!checklistFotos[name]) checklistFotos[name] = {};
            checklistFotos[name].explicacao = el.value;
            currentOM.checklistFotos = checklistFotos;
            salvarChecklistParcial();
        }

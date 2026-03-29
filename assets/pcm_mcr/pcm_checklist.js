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
            // Fluxo v2 oficina: permitir edicao quando atividade esta iniciada na oficina
            if(currentOM.emOficina && currentOM.etapaOficina === ETAPA_OFICINA.OFICINA) {
                return !!(atividadeJaIniciada || currentOM.statusAtual === 'iniciada');
            }
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
            $('checklistContent').innerHTML = '';
            $('checklistContent').style.display = 'none';
            $('btnSalvarChecklist').style.display = 'none';
            $('btnEditarChecklist').style.display = 'block';
            $('checklistSection').textContent = '📋 Checklist Salvo ✅';

            var fluxoOficina = !!(currentOM && (currentOM.emOficina || currentOM.retornouOficina));
            var fluxoOficinaAtiva = !!(currentOM && currentOM.emOficina && currentOM.etapaOficina === ETAPA_OFICINA.OFICINA && atividadeJaIniciada);
            var fluxoChecklistAtivo = !!(currentOM && (currentOM.planoCod || currentOM.checklistCorretiva) && !currentOM.emOficina && !currentOM.retornouOficina);
            if (fluxoOficinaAtiva) {
                // Na oficina com atividade ja iniciada - manter controles de atividade
                _aplicarModoChecklistFoco(false);
                $('checklistSection').style.display = 'block';
                $('checklistActions').style.display = 'block';
                $('btnEditarChecklist').style.display = 'block';
                $('btnSalvarChecklist').style.display = 'none';
                _uiAtividade(true);
                _setBtns({ btnFinalizarOficina:1, btnOficina:0, btnDevolverEquip:0, btnIniciarMontagem:0 });
            } else if (fluxoOficina || fluxoChecklistAtivo) {
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
            var isOficina = currentOM && currentOM.emOficina && !currentOM.retornouOficina && !currentOM.devolvendoEquipamento;
            _aplicarModoChecklistFoco(true);
            _aplicarModoOficinaMinimal(isOficina);
            $('checklistSection').style.display = 'block';
            $('checklistActions').style.display = 'block';
            if(isOficina || forcarAberto) {
                $('checklistContent').style.display = 'block';
                $('checklistContent').innerHTML = renderChecklist();
                $('btnSalvarChecklist').style.display = _podeEditarChecklistAgora() ? 'block' : 'none';
                $('btnEditarChecklist').style.display = 'none';
            } else if(currentOM.checklistDados && currentOM.checklistDados.length > 0) {
                $('checklistContent').style.display = 'none';
                $('checklistContent').innerHTML = '';
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
                    } catch(e) { console.warn('[PCM] Falha no autosave do checklist:', e); }
                }, 200);
            } catch(e) { console.warn('[PCM] Erro inesperado no autosave:', e); }
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

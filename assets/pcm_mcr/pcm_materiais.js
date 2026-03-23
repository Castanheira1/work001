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

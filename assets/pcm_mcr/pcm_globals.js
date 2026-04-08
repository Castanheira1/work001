try {
  if (typeof pdfjsLib !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
    const _w = 'assets/vendor/pdf.worker.min.js';
    if (pdfjsLib.GlobalWorkerOptions.workerSrc !== _w) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = _w;
    }
  }
} catch (e) { console.error('[PDF.js] Worker init falhou:', e); }
function verificarDependencias() {
  const erros = [];

  if (typeof pdfjsLib === 'undefined') erros.push('pdf.js');
  if (!window.jspdf || !window.jspdf.jsPDF) erros.push('jsPDF');
  if (typeof XLSX === 'undefined') erros.push('XLSX');

  const hasAutoTable = !!(window.jspdf && window.jspdf.jsPDF && window.jspdf.jsPDF.API && window.jspdf.jsPDF.API.autoTable);
  if (!hasAutoTable) erros.push('jsPDF-AutoTable');

  const hasPdfDB = !!(window.PdfDB && typeof PdfDB.put === 'function' && typeof PdfDB.get === 'function' && typeof PdfDB.del === 'function' && typeof PdfDB.keys === 'function');
  if (!hasPdfDB) erros.push('PdfDB');
  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) erros.push('Credenciais Supabase (SUPABASE_URL, SUPABASE_ANON_KEY)');
  if (!window.ENV || Object.keys(window.ENV).length === 0) erros.push('Variáveis de ambiente (window.ENV)');

  if (erros.length > 0) {
    let msg = '⚠️ BIBLIOTECAS NÃO CARREGARAM: ' + erros.join(', ') + '\n\n';
    msg += 'Abra DIRETAMENTE no navegador (Chrome/Edge/Safari).\n';
    msg += 'Não funciona em pré-visualização.\n\n';
    msg += 'Faça o DOWNLOAD e abra no navegador.';
    alert(msg);

    const el = $('omList');
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

        const _elCache = {};
        function $(id) { return _elCache[id] || (_elCache[id] = document.getElementById(id)); }

        function _calcHH(hist) {
            const nEx = (hist.executantes || []).length || 1;
            const hhAtiv = hist.hhAtividade || 0;
            const hhDesl = hist.hhDeslocamento || 0;
            hist.hhEquipe = hhAtiv * nEx;
            hist.hhDeslocEquipe = hhDesl * nEx;
            hist.hhTotal = hist.hhEquipe + hist.hhDeslocEquipe;
            return hist;
        }

        function _h(s) {
            if (s == null) return '';
            return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
        }

        function _fmtDuracaoRelogio(segundos) {
            var total = Math.max(0, Math.floor(Number(segundos) || 0));
            var h = Math.floor(total / 3600);
            var m = Math.floor((total % 3600) / 60);
            var s = total % 60;
            if(h > 0) return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
            return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
        }

        function _fmtDeslocResumo(segundos) {
            var total = Math.max(0, Math.floor(Number(segundos) || 0));
            if(total < 60) return total + ' s';
            if(total < 3600) return Math.floor(total / 60) + ' min';
            var h = Math.floor(total / 3600);
            var m = Math.floor((total % 3600) / 60);
            return h + 'h ' + String(m).padStart(2, '0') + 'min';
        }

        function _dedupHistoricoExecucao(om) {
            if(!om || !Array.isArray(om.historicoExecucao) || om.historicoExecucao.length < 2) return 0;
            const seen = {};
            const novo = [];
            let removidos = 0;
            for(let i = 0; i < om.historicoExecucao.length; i++) {
                const h = om.historicoExecucao[i] || {};
                const key = [
                    h.tag || '',
                    h.dataInicio || '',
                    h.dataFim || '',
                    Array.isArray(h.executantes) ? h.executantes.join('|') : '',
                    h.deslocamentoSegundos || 0,
                    h.hhAtividade || 0,
                    h.hhDeslocamento || 0
                ].join('||');
                if(seen[key]) {
                    removidos++;
                    continue;
                }
                seen[key] = 1;
                novo.push(h);
            }
            if(removidos > 0) om.historicoExecucao = novo;
            return removidos;
        }

        // --- Funções centralizadas (refatoração código legado) ---

        /**
         * Fecha o último registro de historicoExecucao aberto (sem dataFim).
         * Centraliza o padrão que estava duplicado 9+ vezes no código.
         * @param {string} tag - Tag da etapa (ex: 'TROCA DE TURNO', 'OFICINA_FIM', etc.)
         * @param {object} opts - Opções:
         *   zerarDeslocamento: boolean - setar hhDeslocamento=0 (oficina)
         *   skipMateriais: boolean - não sobrescrever materiaisUsados do registro
         *   marcarDesvio: boolean - setar h.desvio=true
         * @returns {object|null} O registro de histórico fechado, ou null se não havia registro aberto.
         */
        function _fecharHistoricoAtual(tag, opts) {
            opts = opts || {};
            if(timerAtividadeInterval) clearInterval(timerAtividadeInterval);
            if(!currentOM || !currentOM.historicoExecucao || currentOM.historicoExecucao.length === 0) return null;
            var h = currentOM.historicoExecucao[currentOM.historicoExecucao.length - 1];
            if(!h.dataInicio || h.dataFim) return h;

            var diff = Math.floor((new Date() - new Date(h.dataInicio)) / 1000) - (tempoPausadoTotal || 0);
            if(diff < 0) diff = 0;
            h.dataFim = new Date().toISOString();
            h.tempoPausadoTotal = tempoPausadoTotal || 0;

            if(opts.zerarDeslocamento) {
                h.hhDeslocamento = 0;
            } else {
                var _deslSeg = h.deslocamentoSegundos !== undefined ? h.deslocamentoSegundos : ((h.deslocamentoMinutos || 0) * 60);
                h.hhDeslocamento = _deslSeg / 3600;
            }

            h.hhAtividade = diff / 3600;
            _calcHH(h);
            if(!opts.skipMateriais) h.materiaisUsados = [...materiaisUsados];
            if(tag) h.tag = tag;

            if(opts.marcarDesvio) h.desvio = true;

            return h;
        }

        /**
         * Reseta o estado global de execução. Centraliza o padrão repetido em 6+ funções.
         * @param {object} opts - Opções:
         *   manterExecutantes: boolean - não limpar executantesNomes
         *   manterMateriais: boolean - não limpar materiaisUsados
         */
        function _resetEstadoExecucao(opts) {
            opts = opts || {};
            deslocamentoSegundos = 0;
            atividadeSegundos = 0;
            tempoPausadoTotal = 0;
            atividadeJaIniciada = false;
            if(!opts.manterExecutantes) executantesNomes = [];
            if(!opts.manterMateriais) materiaisUsados = [];
            localStorage.removeItem(STORAGE_KEY_CURRENT);
            try { PdfDB.del('current_om_state').catch(function(){}); } catch(e){}
        }

        /**
         * Renderiza a seção de desvios no popup de assinatura/finalização.
         * Centraliza a lógica que existia apenas em showFinalizar e faltava em showAssinaturaFiscal.
         * @param {HTMLElement} containerEl - Elemento DOM onde renderizar
         * @param {object} omObj - Objeto da OM
         * @returns {boolean} true se renderizou desvios, false caso contrário
         */
        function _renderDesviosResumo(containerEl, omObj) {
            if(!containerEl) return false;
            var desviosAll = (omObj.desviosRegistrados || []).slice();
            var totalDesviosOriginais = desviosAll.length;
            desviosAll = desviosAll.filter(_ehDesvioExibivelNaAssinatura);
            if(totalDesviosOriginais !== desviosAll.length) {
                console.info('[PCM] Resumo de assinatura: desvios de desativação ocultados.', {
                    om: omObj && omObj.num ? omObj.num : null,
                    ocultados: totalDesviosOriginais - desviosAll.length
                });
            }
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
                containerEl.innerHTML = devHtml;
                containerEl.style.display = 'block';
                return true;
            } else {
                containerEl.style.display = 'none';
                containerEl.innerHTML = '';
                return false;
            }
        }

        /**
         * Verifica itens anormais do checklist de forma centralizada.
         * Substitui as 3+ verificações duplicadas em enviarParaOficina, finalizarOficina, devolverEquipamento.
         * @param {object} opts - Opções:
         *   verificarDepois: boolean - verificar se foto "depois" existe para itens anormais com foto "antes"
         * @returns {object} { temAnormal, semFotoAntes: [], semFotoDepois: [] }
         */
        function _verificarItensAnormais(opts) {
            opts = opts || {};
            var result = { temAnormal: false, semFotoAntes: [], semFotoDepois: [] };
            var nomes = ['m1','m2','m3','m4','m5','m6','t1','t2','t3','t4','t5','t6','t7','t8','t9'];
            for(var i = 0; i < nomes.length; i++) {
                var nm = nomes[i];
                var valor = typeof _obterValorChecklistItem === 'function' ? _obterValorChecklistItem(nm) : '';
                if(valor === 'anormal') {
                    result.temAnormal = true;
                    var foto = (checklistFotos || {})[nm] || {};
                    if(!foto.antes) result.semFotoAntes.push(nm.toUpperCase());
                    if(opts.verificarDepois && foto.antes && !foto.depois) result.semFotoDepois.push(nm.toUpperCase());
                }
            }
            return result;
        }

        // --- Fim funções centralizadas ---

        function _setBtns(map) {
            for (const id in map) {
                const el = $(id);
                if (el) el.style.display = map[id] ? (typeof map[id] === 'string' ? map[id] : 'block') : 'none';
            }
        }

        function _aplicarModoChecklistFoco(ativo) {
            const tela = $('detailScreen');
            if(!tela) return;
            if(ativo) tela.classList.add('checklist-focus');
            else tela.classList.remove('checklist-focus');
        }

        function _aplicarModoOficinaMinimal(ativo) {
            const tela = $('detailScreen');
            if(!tela) return;
            if(ativo) tela.classList.add('oficina-minimal');
            else tela.classList.remove('oficina-minimal');
        }

        function _btnOficinaCk() {
            // Fluxo v2: aguardando devolucao - mostrar botao de iniciar montagem
            if (currentOM.statusOficina === STATUS_OFICINA.AGUARDANDO_DEVOLUCAO) {
                _setBtns({ btnOficina:0, btnDevolverEquip:0, btnChecklist:0, btnFinalizarOficina:0, btnIniciarMontagem:1 });
                return;
            }
            // Fluxo v2: em oficina - só mostra "Finalizar na oficina" após atividade iniciada
            const emEtapaOficina = currentOM.etapaOficina === ETAPA_OFICINA.OFICINA;
            const atividadeOficinaIniciada = emEtapaOficina && (currentOM.statusAtual === 'iniciada' || atividadeJaIniciada);
            if (currentOM.emOficina && !currentOM.devolvendoEquipamento) {
                _setBtns({ btnOficina:0, btnDevolverEquip:0, btnChecklist:0, btnFinalizarOficina: atividadeOficinaIniciada ? 1 : 0, btnIniciarMontagem:0 });
            } else if (currentOM.retornouOficina && !currentOM.devolvendoEquipamento && currentOM.statusAtual !== 'iniciada') {
                const checklistHabilitado = !!(currentOM.planoCod || currentOM.checklistCorretiva);
                _setBtns({ btnOficina:0, btnDevolverEquip:1, btnChecklist: checklistHabilitado ? 1 : 0, btnFinalizarOficina:0, btnIniciarMontagem:0 });
            } else if (currentOM.retornouOficina && !currentOM.devolvendoEquipamento && currentOM.statusAtual === 'iniciada') {
                // Montagem com atividade iniciada: apenas FINALIZAR visível; checklist via seção dedicada
                _setBtns({ btnIniciar:0, btnOficina:0, btnDevolverEquip:0, btnChecklist:0, btnFinalizarOficina:0, btnIniciarMontagem:0 });
            } else if (currentOM.devolvendoEquipamento) {
                _setBtns({ btnOficina:0, btnDevolverEquip:0, btnChecklist:0, btnFinalizarOficina:0, btnIniciarMontagem:0 });
            } else if (currentOM.planoCod || currentOM.checklistCorretiva) {
                _setBtns({ btnOficina:1, btnDevolverEquip:0, btnChecklist:1, btnFinalizarOficina:0, btnIniciarMontagem:0 });
            } else {
                _setBtns({ btnOficina:0, btnDevolverEquip:0, btnChecklist:1, btnFinalizarOficina:0, btnIniciarMontagem:0 });
            }
        }

        function _uiAtividade(skipChecklistAuto) {
            const naOficina = !!(currentOM && currentOM.emOficina && currentOM.etapaOficina === ETAPA_OFICINA.OFICINA);
            const emFluxoOficina = !!(currentOM && (
                currentOM.emOficina ||
                currentOM.devolvendoEquipamento ||
                (currentOM.retornouOficina && currentOM.statusAtual !== 'iniciada')
            ));
            _setBtns({
                btnDeslocamento:0, btnIniciar:0, btnMateriais:1,
                btnRowExecOficina:'flex', btnFinalizar: emFluxoOficina ? 0 : 1,
                btnCancelar:0, btnExcluir:0, btnCancelarDesvio:0,
                timerAtividade:1, timerDisplay:0,
                btnFinalizarOficina: naOficina ? 1 : 0,
                btnIniciarMontagem:0
            });
            _btnOficinaCk();
            if (!skipChecklistAuto && (currentOM.planoCod || currentOM.checklistCorretiva) && !(currentOM.checklistDados && currentOM.checklistDados.length > 0)) _mostrarChecklistUI(false);
        }


        let configBDI = 18.8256;
        let configBM = { numero: '', dataInicio: '', dataFim: '' };
        let configTipoSolicitacao = 'Climatização e Refrigeração';
        const MATERIAL_VALE_ITEMS = ['99901', '99902'];

        (function validarBootstrapMCR() {
            const required = [
                'SENHA_FISCAL', 'STORAGE_KEY_OMS', 'STORAGE_KEY_CURRENT', 'STORAGE_KEY_MATERIAIS',
                'STORAGE_KEY_DEVICE', 'STORAGE_KEY_HISTORICO', 'STORAGE_KEY_DESVIOS',
                'STORAGE_KEY_DESVIOS_ACUM', 'STORAGE_KEY_DASHBOARD', 'STORAGE_KEY_CONFIG',
                'SUPABASE_TABLE_OMS', 'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_TABLE_MATERIAIS',
                'sc', 'arrayBufferToBase64', 'base64ToArrayBuffer'
            ];
            const faltando = required.filter(function (k) { return typeof window[k] === 'undefined'; });
            if (faltando.length) {
                console.error('[PCM] Bootstrap incompleto. Arquivos ausentes ou fora de ordem:', faltando);
                alert('⚠️ Falha ao inicializar o PCM: arquivos JS ausentes ou carregados fora de ordem.\n\nItens: ' + faltando.join(', '));
            }
        })();

        let priceList = {};
        const oms = [];
        let uploadedFiles = [];
        var currentOM = null;
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
        var deviceId = '';
        let isCancelamento = false;
        let checklistFotos = {};
        let fotoAtualItem = '';
        let fotoAtualTipo = '';
        let atividadeSegundos = 0;
        let _materiaisListaExpandida = false;

        // --- Fluxo Oficina v2 ---
        // Etapas do fluxo de oficina
        const ETAPA_OFICINA = {
            CAMPO: 'CAMPO',
            OFICINA: 'OFICINA',
            MONTAGEM: 'MONTAGEM'
        };
        const STATUS_OFICINA = {
            EM_OFICINA: 'em_oficina',
            AGUARDANDO_DEVOLUCAO: 'aguardando_devolucao'
        };

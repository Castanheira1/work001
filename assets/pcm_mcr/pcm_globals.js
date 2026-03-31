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
                _setBtns({ btnOficina:1, btnDevolverEquip:0, btnChecklist:0, btnFinalizarOficina:0, btnIniciarMontagem:0 });
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
                timerAtividade:1,
                btnFinalizarOficina: naOficina ? 1 : 0,
                btnIniciarMontagem:0
            });
            _btnOficinaCk();
            if (!skipChecklistAuto && (currentOM.planoCod || currentOM.checklistCorretiva) && !(currentOM.checklistDados && currentOM.checklistDados.length > 0)) _mostrarChecklistUI(false);
        }


        const configBDI = 18.8256;
        const configBM = { numero: '', dataInicio: '', dataFim: '' };
        const configTipoSolicitacao = 'Climatização e Refrigeração';
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
        let currentOM = null;
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
        let deviceId = '';
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

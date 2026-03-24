        $('fileInput').addEventListener('change', async function(e) {
            const files = Array.from(e.target.files);
            
            for(let file of files) {
                const arrayBuffer = await file.arrayBuffer();
                const base64 = arrayBufferToBase64(arrayBuffer);
                
                uploadedFiles.push({
                    file: file,
                    nome: file.name,
                    base64: base64
                });
            }
            
            renderFilesList();
            $('btnProcessar').style.display = 'block';
        });

        function renderFilesList() {
            const list = $('filesList');
            list.innerHTML = '';
            uploadedFiles.forEach((fileObj, idx) => {
                const div = document.createElement('div');
                div.className = 'file-item';
                div.innerHTML = `
                    <div class="file-info">
                        <div class="file-name">📄 ${fileObj.nome}</div>
                        <div class="file-status">Pronto para processar</div>
                    </div>
                    <button class="remove-btn" onclick="removerArquivo(${idx})">✕</button>
                `;
                list.appendChild(div);
            });
        }

        function removerArquivo(idx) {
            uploadedFiles.splice(idx, 1);
            if(uploadedFiles.length === 0) {
                $('btnProcessar').style.display = 'none';
            }
            renderFilesList();
        }

        async function processarPDFs() {
            if(uploadedFiles.length === 0) return;
            if(typeof pdfjsLib === 'undefined') {
                alert('⚠️ pdf.js não carregou!\n\nFaça o DOWNLOAD do arquivo e abra no navegador.');
                return;
            }
            
            var btn = $('btnProcessar');
            btn.textContent = '⏳ PROCESSANDO...';
            btn.disabled = true;
            
            const pdfPromises = [];
            var processados = 0;
            var errosProc = 0;
            
            for(let fileIdx = 0; fileIdx < uploadedFiles.length; fileIdx++) {
                const fileObj = uploadedFiles[fileIdx];
                try {
                    const arrayBuffer = base64ToArrayBuffer(fileObj.base64);
                    const pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise;
                    var p;
                    if(pdf.numPages >= 2) {
                        p = await pdf.getPage(2);
                    } else {
                        p = await pdf.getPage(1);
                    }
                    const c = await p.getTextContent();
                    const txt = c.items.map(i => i.str).join(" ");
                    
                    var pdfItems = c.items.filter(function(i){ return i.str.trim(); }).map(function(i){
                        return { str: i.str.trim(), x: i.transform[4], y: Math.round(i.transform[5]*10)/10 };
                    });
                    pdfItems.sort(function(a,b){ return b.y - a.y || a.x - b.x; });
                    var txtLines = '';
                    var prevY = null;
                    for(var li=0; li<pdfItems.length; li++){
                        var itm = pdfItems[li];
                        if(prevY !== null && Math.abs(itm.y - prevY) > 2){ txtLines += '\n'; }
                        else if(prevY !== null){ txtLines += ' '; }
                        txtLines += itm.str;
                        prevY = itm.y;
                    }
                    
                    const dados = extrairDados(txt, txtLines);
                    
                    var omNum = dados.om;
                    if(omNum === '---') {
                        omNum = fileObj.nome.replace(/\.pdf$/i, '');
                    }
                    
                    if(omNum !== '---') {
                        var existIdx = oms.findIndex(function(o){ return o.num === omNum; });
                        if(existIdx >= 0) {
                            var existOM = oms[existIdx];
                            var temAtiva = existOM.historicoExecucao && existOM.historicoExecucao.some(function(h){ return !h.dataFim; });
                            if(temAtiva || existOM.lockDeviceId) {
                                continue;
                            }
                            oms.splice(existIdx, 1);
                            var savedCurrent = localStorage.getItem(STORAGE_KEY_CURRENT);
                            if(savedCurrent) {
                                try {
                                    var est = JSON.parse(savedCurrent);
                                    if(est.omNum === omNum) localStorage.removeItem(STORAGE_KEY_CURRENT);
                                } catch(e) { console.warn('[PCM] Estado atual corrompido ao processar OM:', e); }
                            }
                        }
                    }

                    const om = {
                        num: omNum,
                        titulo: dados.tituloCurto,
                        cc: dados.centroCusto,
                        equipamento: dados.numEquip,
                        local: dados.local,
                        status: dados.badgesHTML,
                        descricao: dados.descCompleta,
                        inicio: dados.inicio,
                        fim: dados.fim,
                        planoCod: dados.planoCod,
                        equipe: dados.equipe,
                        descLocal: dados.descLocal,
                        descLocalSup: dados.descLocalSup,
                        caracteristicas: dados.caracteristicas,
                        criticidade: dados.criticidade,
                        tipoManut: dados.tipoManut,
                        tagIdentificacao: dados.tagIdentificacao || '',
                        historicoExecucao: [],
                        materiaisUsados: [],
                        finalizada: false,
                        cancelada: false,
                        pendenteAssinatura: false,
                        arquivo: fileObj.nome,
                        lockDeviceId: null
                    };
                    
                    oms.push(om);
                    _gravarDashboardLog('PROGRAMADO', om);
                    pdfPromises.push(PdfDB.put('orig_' + omNum, fileObj.base64));

                    // Upload para Supabase Storage para acesso cross-device
                    (function(num, b64) {
                        try {
                            var byteStr = atob(b64.split(',').pop());
                            var ab = new ArrayBuffer(byteStr.length);
                            var ia = new Uint8Array(ab);
                            for (var i = 0; i < byteStr.length; i++) ia[i] = byteStr.charCodeAt(i);
                            var blob = new Blob([ab], { type: 'application/pdf' });
                            var token = (window.PCMAuth && window.PCMAuth.getToken()) || SUPABASE_ANON_KEY;
                            fetch(SUPABASE_URL + '/storage/v1/object/pcm-files/originais/' + num + '.pdf', {
                                method: 'POST',
                                headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/pdf', 'x-upsert': 'true' },
                                body: blob
                            }).then(function(resp) {
                                if(!resp.ok) {
                                    return resp.text().then(function(txt) {
                                        throw new Error('HTTP ' + resp.status + (txt ? ' — ' + txt : ''));
                                    });
                                }
                            }).catch(function(e) { console.warn('[Upload] Storage falhou para ' + num + ':', e.message); });
                        } catch(e) { console.warn('[Upload] Erro ao preparar blob ' + num + ':', e.message); }
                    })(omNum, fileObj.base64);

                    processados++;
                } catch(e) {
                    errosProc++;
                    console.error('Erro processando ' + fileObj.nome + ':', e);
                }
            }
            
            await Promise.all(pdfPromises);
            
            uploadedFiles = [];
            $('filesList').innerHTML = '';
            btn.textContent = '🔍 PROCESSAR OMs';
            btn.disabled = false;
            btn.style.display = 'none';
            salvarOMs();
            filtrarOMs();
            
            var msg = '✅ ' + processados + ' OM(s) processada(s)!';
            if(errosProc > 0) msg += '\n❌ ' + errosProc + ' arquivo(s) com erro.';
            alert(msg);
        }

        function _extrairOM(txt) {
            var m = txt.match(/\b(20\d{10})\b/);
            return m ? m[1] : '---';
        }

        function _extrairTitulo(txtLines) {
            var titulo = 'MANUTENÇÃO';
            if (!txtLines) return titulo;
            var tLines = txtLines.split('\n');
            for (var i = 0; i < Math.min(tLines.length, 15); i++) {
                var tl = tLines[i].trim();
                var omInLine = tl.match(/OM\s+(20\d{10})/);
                if (omInLine) {
                    var t = tl.replace(/OM\s+20\d{10}/, '').trim();
                    if (t.length > 3 && !t.match(/^Adm\./i) && !t.match(/^VALE$/i)) return t;
                }
            }
            for (var i2 = 0; i2 < Math.min(tLines.length, 20); i2++) {
                if (tLines[i2].trim().match(/^EQUIPAMENTO/i) && i2 > 0) {
                    var prev = tLines[i2 - 1].trim().replace(/OM\s+20\d{10}/, '').trim();
                    if (prev.length > 3 && !prev.match(/^Adm\./i) && !prev.match(/^VALE$/i)) return prev;
                    break;
                }
            }
            return titulo;
        }

        function _extrairDescricao(txt) {
            var ini = txt.indexOf('DETALHAMENTO DA ORDEM');
            if (ini === -1) return '';
            var fim = txt.indexOf('DURAÇÃO DA TAREFA');
            if (fim !== -1 && fim > ini) return txt.substring(ini + 21, fim).trim();
            return txt.substring(ini + 21).replace(/\d+\s+de\s+\d+\s*$/, '').trim();
        }

        function _extrairCentroCusto(txt, txtLines, om, numEquip) {
            function limpar(v) { return String(v || '').replace(/\s+/g, ' ').replace(/^[\s:|\-]+/, '').replace(/[\s|:.-]+$/, '').trim(); }
            function escRgx(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
            function extrairPorRotulo(texto, rotulo, proximos) {
                var labels = (proximos || []).map(escRgx).join('|');
                var rgx = new RegExp(escRgx(rotulo) + '\\s*[:|]?\\s*([\\s\\S]*?)(?=' + (labels ? labels : '$') + '|$)', 'i');
                var m = texto.match(rgx);
                return (m && m[1]) ? limpar(m[1]) : '';
            }
            var porCampo = extrairPorRotulo(txt, 'Centro de Custo', [
                'Criticidade', 'Tipo Contador', 'T[eé]rmino da Garantia', 'Fonte radioativa',
                'N[ºo] Identifica[cç][aã]o T[eé]cnica', 'Local de Instala[cç][aã]o',
                'Descri[cç][aã]o do Local de Instala[cç][aã]o', 'Local de Instala[cç][aã]o Superior',
                'Descri[cç][aã]o do Local de Instala[cç][aã]o Superior',
                'Caracter[ií]sticas do Equipamento', 'ORDEM DE MANUTEN'
            ]);
            if (porCampo) { var mC = porCampo.match(/\b\d{6,10}\b/); if (mC && mC[0] !== om && mC[0] !== numEquip) return mC[0]; }
            if (txtLines) {
                var linhas = txtLines.split('\n').map(function(l){ return limpar(l); }).filter(Boolean);
                for (var i = 0; i < linhas.length; i++) {
                    if (/Centro de Custo/i.test(linhas[i])) {
                        var mIn = linhas[i].match(/Centro de Custo\s*[:|]?\s*(\d{6,10})/i);
                        if (mIn && mIn[1] !== om && mIn[1] !== numEquip) return mIn[1];
                        for (var j = i + 1; j < Math.min(i + 4, linhas.length); j++) {
                            if (/^(Criticidade|Tipo Contador|T[eé]rmino da Garantia|Fonte radioativa|N[ºo] Identifica)/i.test(linhas[j])) break;
                            var mL = linhas[j].match(/\b\d{6,10}\b/);
                            if (mL && mL[0] !== om && mL[0] !== numEquip) return mL[0];
                        }
                    }
                }
            }
            var blocoEquip = extrairPorRotulo(txt, 'EQUIPAMENTO', ['ORDEM DE MANUTEN']);
            if (blocoEquip) {
                var cands = blocoEquip.match(/\b\d{6,10}\b/g) || [];
                for (var c = 0; c < cands.length; c++) { if (cands[c] !== om && cands[c] !== numEquip) return cands[c]; }
            }
            return '---';
        }

        function _extrairDatas(txt) {
            var m = txt.match(/(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2})\s+(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2})/);
            return m ? { inicio: m[1] + ' ' + m[2], fim: m[3] + ' ' + m[4] } : { inicio: '--/--/-- --:--', fim: '--/--/-- --:--' };
        }

        function _extrairStatus(txt) {
            var statusMatch = txt.match(/Status Sistema Ordem([\s\S]*?)(?=Status Sistema Operação|Status Usuário)/i);
            var validStatus = ['LIB','IMPR','CAPC','CCOP','DMNV','SCDM','EXEC','URGT','VPTS','NOLQ','AGDO'];
            if (!statusMatch) return 'LIB';
            var clean = statusMatch[1].replace(/Status Sistema Ordem/gi, '').trim();
            var found = clean.split(/\s+/).filter(function(s){ return validStatus.indexOf(s) !== -1; });
            return found.length > 0 ? found.join(' ') : 'LIB';
        }

        function _extrairLocalEquipe(txt, txtLines) {
            var planoMatch = txt.match(/\b(1[89]\d{5})\b/);
            var locMatch = txt.match(/(INFN-[A-Z0-9-]+)/);
            var eqMatch = txt.match(/(S11[A-Z0-9]+)/);
            var descLocal = '---', descLocalSup = '---', caracteristicas = '---';
            var local = locMatch ? locMatch[1] : '---';
            if (txtLines) {
                var lines = txtLines.split('\n');
                var firstINFN = -1, secondINFN = -1, ordemLine = -1;
                for (var li = 0; li < lines.length; li++) {
                    var ln = lines[li].trim();
                    if (ln.match(/INFN-[A-Z0-9-]+/)) {
                        if (firstINFN === -1) firstINFN = li;
                        else if (secondINFN === -1) secondINFN = li;
                    }
                    if (ln.match(/ORDEM DE MANUTEN/i) && ordemLine === -1) { ordemLine = li; break; }
                }
                if (firstINFN !== -1) {
                    var m1 = lines[firstINFN].trim().match(/INFN-[A-Z0-9-]+\s*(.*)/);
                    if (m1 && m1[1].trim()) descLocal = m1[1].trim();
                }
                if (secondINFN !== -1) {
                    var m2 = lines[secondINFN].trim().match(/INFN-[A-Z0-9-]+\s*(.*)/);
                    if (m2 && m2[1].trim()) descLocalSup = m2[1].trim();
                    if (ordemLine !== -1 && ordemLine > secondINFN + 1) {
                        var cLines = [];
                        for (var ci = secondINFN + 1; ci < ordemLine; ci++) {
                            var cl = lines[ci].trim();
                            if (cl && !cl.match(/^N[ãa]o$/i) && !cl.match(/Caracter/i)) cLines.push(cl);
                        }
                        if (cLines.length > 0) caracteristicas = cLines.join(' ').trim();
                    }
                }
            }
            return { planoCod: planoMatch ? planoMatch[1] : '', local: local, equipe: eqMatch ? eqMatch[1] : 'S11MCR1', descLocal: descLocal, descLocalSup: descLocalSup, caracteristicas: caracteristicas };
        }

        function _extrairCriticidade(txt) {
            var cMatch = txt.match(/Criticidade\s*[\|\n\r]\s*([A-C])\b/);
            var tMatch = txt.match(/Tipo de Manutenção\s*[\|\n\r]+\s*([^\n\r|]+)/);
            return { criticidade: cMatch ? cMatch[1] : '', tipoManut: tMatch ? tMatch[1].trim() : '' };
        }

        function _extrairTag(txt, txtLines, tituloCurto) {
            var tag = '';
            if (!txtLines) {
                var txtTag = txt.match(/(?:TAG|Identifica[çc][ãa]o)\s*[:\s]*\b(M\d{2,5})\b/i);
                return txtTag ? txtTag[1] : '';
            }
            var tagLines = txtLines.split('\n');
            // 1) Buscar na linha de "Identificação Técnica" (com ou sem "Nº" antes)
            for (var tg = 0; tg < tagLines.length; tg++) {
                var tgl = tagLines[tg].trim();
                if (/Identifica[çc][ãa]o/i.test(tgl)) {
                    // TAG na mesma linha
                    var identMatch = tgl.match(/\b(M\d{2,5})\b/);
                    if (identMatch) return identMatch[1];
                    // TAG na próxima linha (quando PDF separa rótulo do valor)
                    if (tg + 1 < tagLines.length) {
                        var nextLine = tagLines[tg + 1].trim();
                        var nextMatch = nextLine.match(/^(M\d{2,5})\b/);
                        if (nextMatch) return nextMatch[1];
                    }
                }
            }
            // 2) Buscar na linha de "Características do Equipamento"
            for (var ck = 0; ck < tagLines.length; ck++) {
                if (/Caracter[ií]sticas/i.test(tagLines[ck])) {
                    for (var cl = ck; cl < Math.min(ck + 3, tagLines.length); cl++) {
                        var caracMatch = tagLines[cl].match(/\b(M\d{2,5})\b/);
                        if (caracMatch) return caracMatch[1];
                    }
                    break;
                }
            }
            // 3) Buscar no título da OM
            var tituloTag = tituloCurto.match(/\b(M\d{2,5})\b/);
            if (tituloTag) return tituloTag[1];
            // 4) Buscar no texto completo perto de TAG ou Identificação
            var txtTag2 = txt.match(/(?:TAG|Identifica[çc][ãa]o)\s*[:\s]*\b(M\d{2,5})\b/i);
            if (txtTag2) return txtTag2[1];
            return tag;
        }

        function extrairDados(txt, txtLines) {
            var om = _extrairOM(txt);
            var tituloCurto = _extrairTitulo(txtLines);
            var descCompleta = _extrairDescricao(txt);
            var equipMatch = txt.match(/\b(1\d{7})\b/);
            var numEquip = equipMatch ? equipMatch[1] : '---';
            var centroCusto = _extrairCentroCusto(txt, txtLines, om, numEquip);
            var datas = _extrairDatas(txt);
            var badgesHTML = _extrairStatus(txt);
            var locEq = _extrairLocalEquipe(txt, txtLines);
            var crit = _extrairCriticidade(txt);
            var tagIdentificacao = _extrairTag(txt, txtLines, tituloCurto);
            return {
                om: om, numEquip: numEquip, centroCusto: centroCusto, descCompleta: descCompleta,
                tituloCurto: tituloCurto, planoCod: locEq.planoCod, inicio: datas.inicio, fim: datas.fim,
                local: locEq.local, equipe: locEq.equipe, badgesHTML: badgesHTML,
                descLocal: locEq.descLocal, descLocalSup: locEq.descLocalSup,
                caracteristicas: locEq.caracteristicas, criticidade: crit.criticidade,
                tipoManut: crit.tipoManut, tagIdentificacao: tagIdentificacao
            };
        }

        window.PCMExtrair = extrairDados;

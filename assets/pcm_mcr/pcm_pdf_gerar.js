
        function _pdfTextSafe(valor) {
            return String(valor == null ? '' : valor)
                .replace(/\u00A0/g, ' ')
                .replace(/[–—]/g, '-')
                .replace(/[•·]/g, '-')
                .replace(/[\u2018\u2019]/g, "'")
                .replace(/[\u201C\u201D]/g, '"');
        }


        function _pdfHeader(pdf, tipoDoc) {
            var W = pdf.internal.pageSize.getWidth(), M = 15;
            var titulo = 'DOMO DE FERRO';
            var subtitulo1 = 'MCR - Refrigeração e Climatização';
            var subtitulo2 = _pdfTextSafe((currentOM && currentOM.equipe ? currentOM.equipe : '---') + ' - S11D - Canaã dos Carajás PA');

            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(13);
            pdf.setTextColor(20, 20, 20);
            pdf.text(titulo, M, 11);

            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(7.2);
            pdf.setTextColor(90, 90, 90);
            pdf.text(subtitulo1, M, 15.2);
            pdf.text(subtitulo2, M, 18.6);

            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(11);
            pdf.setTextColor(35, 35, 35);
            pdf.text(_pdfTextSafe(tipoDoc), W - M, 11, { align: 'right' });

            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(7.2);
            pdf.setTextColor(90, 90, 90);
            pdf.text('OM ' + _pdfTextSafe(currentOM.num || '---'), W - M, 15.2, { align: 'right' });

            pdf.setDrawColor(110, 110, 110);
            pdf.setLineWidth(0.35);
            pdf.line(M, 22, W - M, 22);
            return 27;
        }


        function _pdfInfoGrid(pdf, y) {
            var W = pdf.internal.pageSize.getWidth(), M = 15;
            var tituloOM = _pdfTextSafe(currentOM.titulo || currentOM.omTitulo || '---');
            var periodoTxt = _pdfTextSafe((currentOM.inicio || '---') + ' > ' + (currentOM.fim || '---'));
            var localTxt = _pdfTextSafe((currentOM.local || '---') + (currentOM.descLocal ? ' - ' + currentOM.descLocal : ''));

            var body = [
                [
                    { content: 'OM', styles: { fontStyle: 'bold', textColor: [70,70,70] } },
                    { content: _pdfTextSafe(currentOM.num || '---') + '   ' + tituloOM, colSpan: 3, styles: { fontStyle: 'bold' } }
                ],
                [
                    { content: 'C. Trabalho', styles: { fontStyle: 'bold', textColor: [70,70,70] } },
                    { content: _pdfTextSafe(currentOM.equipe || '---') },
                    { content: 'C. Custo', styles: { fontStyle: 'bold', textColor: [70,70,70] } },
                    { content: _pdfTextSafe(currentOM.cc || '---') }
                ],
                [
                    { content: 'Equipamento', styles: { fontStyle: 'bold', textColor: [70,70,70] } },
                    { content: _pdfTextSafe(currentOM.equipamento || '---') },
                    { content: 'TAG', styles: { fontStyle: 'bold', textColor: [70,70,70] } },
                    { content: _pdfTextSafe(currentOM.tagIdentificacao || '---'), styles: { fontStyle: 'bold', textColor: [20,80,160] } }
                ],
                [
                    { content: 'Local Inst.', styles: { fontStyle: 'bold', textColor: [70,70,70] } },
                    { content: localTxt },
                    { content: 'Tipo Manut.', styles: { fontStyle: 'bold', textColor: [70,70,70] } },
                    { content: _pdfTextSafe(currentOM.tipoManut || '---') }
                ],
                [
                    { content: 'Local Sup.', styles: { fontStyle: 'bold', textColor: [70,70,70] } },
                    { content: _pdfTextSafe(currentOM.descLocalSup || '---') },
                    { content: 'Período', styles: { fontStyle: 'bold', textColor: [70,70,70] } },
                    { content: periodoTxt }
                ],
                [
                    { content: 'Plano Manut.', styles: { fontStyle: 'bold', textColor: [70,70,70] } },
                    { content: _pdfTextSafe(currentOM.planoCod || '---'), colSpan: 3 }
                ]
            ];

            if (currentOM.caracteristicas) {
                body.push([
                    { content: 'Caract. Equip.', styles: { fontStyle: 'bold', textColor: [70,70,70] } },
                    { content: _pdfTextSafe(currentOM.caracteristicas), colSpan: 3 }
                ]);
            }

            pdf.autoTable({
                startY: y,
                body: body,
                theme: 'grid',
                tableWidth: 180,
                styles: {
                    fontSize: 7,
                    cellPadding: 1.8,
                    textColor: [25,25,25],
                    lineColor: [185,185,185],
                    lineWidth: 0.2,
                    valign: 'middle',
                    overflow: 'linebreak'
                },
                columnStyles: {
                    0: { cellWidth: 28, fillColor: [245,245,245] },
                    1: { cellWidth: 62 },
                    2: { cellWidth: 28, fillColor: [245,245,245] },
                    3: { cellWidth: 62 }
                },
                margin: { left: M, right: M }
            });
            return pdf.lastAutoTable.finalY;
        }


        function _pdfSecTitle(pdf, y, titulo) {
            var W = pdf.internal.pageSize.getWidth(), M = 15;
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(8);
            pdf.setTextColor(40, 40, 40);
            pdf.text(_pdfTextSafe(titulo), M, y);
            pdf.setDrawColor(140, 140, 140);
            pdf.setLineWidth(0.3);
            pdf.line(M, y + 1.4, W - M, y + 1.4);
            return y + 5.5;
        }

        function _formatarTempo(seg) {
            if(!seg || seg <= 0) return '00:00:00';
            var h = Math.floor(seg / 3600);
            var m = Math.floor((seg % 3600) / 60);
            var s = seg % 60;
            return String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
        }


        function _pdfRodape(pdf, tipoDoc) {
            var H = 297, W = 210, M = 15;
            try { H = pdf.internal.pageSize.getHeight(); } catch(e) { H = (pdf.internal.pageSize.height || 297); }
            try { W = pdf.internal.pageSize.getWidth(); } catch(e) { W = (pdf.internal.pageSize.width || 210); }
            var totalPages = pdf.internal.getNumberOfPages();
            var dtHoje = new Date().toLocaleDateString('pt-BR');
            var lineY = H - 9;
            var textY = H - 5;
            for (var p = 1; p <= totalPages; p++) {
                pdf.setPage(p);
                pdf.setDrawColor(180, 180, 180);
                pdf.setLineWidth(0.2);
                pdf.line(M, lineY, W - M, lineY);
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(6);
                pdf.setTextColor(120, 120, 120);
                pdf.text('DOMO DE FERRO - ' + _pdfTextSafe(tipoDoc) + ' - OM ' + _pdfTextSafe(currentOM.num || '---') + ' - ' + dtHoje, M, textY);
                pdf.text(p + '/' + totalPages, W - M, textY, { align: 'right' });
            }
        }

        function _pdfPageHeight(pdf) {
            try { return pdf.internal.pageSize.getHeight(); } catch(e) { return (pdf.internal.pageSize.height || 297); }
        }

        function _pdfUsableBottom(pdf) {
            return _pdfPageHeight(pdf) - 24;
        }

        function _pdfEnsureSpace(pdf, y, requiredHeight, newPageStartY) {
            var nextStart = (newPageStartY == null ? 20 : newPageStartY);
            if ((y + (requiredHeight || 0)) > _pdfUsableBottom(pdf)) {
                pdf.addPage();
                return nextStart;
            }
            return y;
        }

        function _pdfSplitText(pdf, text, maxWidth, lineHeight) {
            var safe = _pdfTextSafe(text || '---');
            var lines = pdf.splitTextToSize(safe, maxWidth);
            if (!Array.isArray(lines)) lines = [safe];
            return {
                lines: lines,
                height: Math.max(lineHeight || 4, lines.length * (lineHeight || 4))
            };
        }

        function _pdfSection(pdf, y, titulo, minBodyHeight) {
            y = _pdfEnsureSpace(pdf, y, 5.5 + (minBodyHeight || 0), 20);
            return _pdfSecTitle(pdf, y, titulo);
        }

        function _pdfDrawObservationTable(pdf, y, titulo, texto) {
            if (!texto) return y;
            var M = 15;
            y = _pdfSection(pdf, y, titulo, 18);
            pdf.autoTable({
                startY: y,
                body: [[{ content: _pdfTextSafe(texto), styles: { fillColor: [248,248,248] } }]],
                theme: 'grid',
                tableWidth: 180,
                styles: {
                    fontSize: 7.2,
                    cellPadding: 2.4,
                    textColor: [40,40,40],
                    lineColor: [200,200,200],
                    lineWidth: 0.18,
                    overflow: 'linebreak',
                    valign: 'top'
                },
                columnStyles: { 0: { cellWidth: 180 } },
                margin: { left: M, right: M }
            });
            return pdf.lastAutoTable.finalY + 8;
        }

        function _pdfDrawSignatureBlock(pdf, y, tituloAss, opts) {
            opts = opts || {};
            var W = 210, M = 15;
            try { W = pdf.internal.pageSize.getWidth(); } catch(e) { W = (pdf.internal.pageSize.width || 210); }

            var executantes = Array.isArray(opts.executantes) && opts.executantes.length ? opts.executantes.join(', ') : '---';
            var execInfo = _pdfSplitText(pdf, executantes, W - M * 2 - 30, 3.8);
            var signHeight = 26;
            var fiscalExtra = opts.fiscalName ? 8 : 0;
            var totalHeight = 5.5 + execInfo.height + 8 + signHeight + fiscalExtra + 6;

            y = _pdfEnsureSpace(pdf, y, totalHeight, 20);
            y = _pdfSecTitle(pdf, y, tituloAss);

            pdf.setFontSize(7.5);
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(100, 100, 100);
            pdf.text('Executante(s):', M, y);

            pdf.setFont(undefined, 'normal');
            pdf.setTextColor(30, 30, 30);
            pdf.text(execInfo.lines, M + 28, y);
            y += execInfo.height + 6;

            pdf.setDrawColor(180, 180, 180);
            pdf.setLineWidth(0.2);
            pdf.setFillColor(252, 252, 252);
            pdf.rect(M, y, 82, signHeight, 'FD');

            if (opts.assinatura) {
                try { pdf.addImage(opts.assinatura, 'PNG', M + 1, y + 1, 80, signHeight - 2); } catch(e) { console.warn('[PCM] Falha ao inserir imagem no PDF:', e.message || e); }
            }

            var xMeta = M + 88;
            var agora = new Date();
            pdf.setFontSize(7.5);

            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(100, 100, 100);
            pdf.text('Data:', xMeta, y + 7);
            pdf.setFont(undefined, 'normal');
            pdf.setTextColor(30, 30, 30);
            pdf.text(agora.toLocaleDateString('pt-BR'), xMeta + 14, y + 7);

            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(100, 100, 100);
            pdf.text('Hora:', xMeta, y + 13);
            pdf.setFont(undefined, 'normal');
            pdf.setTextColor(30, 30, 30);
            pdf.text(agora.toLocaleTimeString('pt-BR'), xMeta + 14, y + 13);

            if (opts.fiscalName) {
                pdf.setFont(undefined, 'bold');
                pdf.setTextColor(40, 40, 40);
                pdf.setFontSize(7);
                pdf.text('ASSINADO PELO FISCAL: ' + _pdfTextSafe(String(opts.fiscalName).toUpperCase()), M, y + signHeight + 6);
            }

            return y + signHeight + fiscalExtra + 6;
        }

        function gerarPDFChecklist() {
            var jsPDF = window.jspdf.jsPDF;
            var pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            var M = 15;
            var cinzaHdr = [74, 74, 74];
            var tipoChk = _detectarTipoChecklist();
            if(tipoChk === 'MISTO') tipoChk = 'MENSAL';
            var tituloPDF = 'CHECKLIST ' + tipoChk;
            var y = _pdfHeader(pdf, tituloPDF);
            y = _pdfSection(pdf, y, 'INFORMACOES DA ORDEM', 18);
            y = _pdfInfoGrid(pdf, y) + 8;
            y = _pdfSection(pdf, y, 'ITENS DO CHECKLIST', 18);

            var itens = currentOM.checklistDados || coletarChecklistDados();
            var secaoAtual = '';
            var rows = [];
            for (var i = 0; i < itens.length; i++) {
                var item = itens[i];
                if (item.secao !== secaoAtual) {
                    rows.push([{ content: item.secao, colSpan: 4, styles: { fontStyle: 'bold', fillColor: [245,245,245], textColor: [35,35,35], fontSize: 7.5, cellPadding: 2.5 } }]);
                    secaoAtual = item.secao;
                }
                rows.push([
                    { content: item.num || (i + 1).toString(), styles: { halign: 'center', fontSize: 7 } },
                    { content: item.titulo || '' },
                    { content: item.valor === 'normal' ? 'NORMAL' : (item.valor === 'anormal' ? 'ANORMAL' : '—'), styles: { halign: 'center', fontStyle: 'bold' } },
                    { content: item.obs || '' }
                ]);
            }

            pdf.autoTable({
                startY: y,
                head: [['#', 'Item', 'Status', 'Observacao']],
                body: rows,
                theme: 'grid',
                tableWidth: 180,
                headStyles: { fillColor: cinzaHdr, textColor: [255,255,255], fontSize: 6.5, fontStyle: 'bold', cellPadding: 1.8 },
                bodyStyles: { fontSize: 6.5, cellPadding: 1.7, textColor: [30,30,30], lineColor: [205,205,205], lineWidth: 0.15, overflow: 'linebreak' },
                columnStyles: { 0: { cellWidth: 10, halign: 'center' }, 1: { cellWidth: 98 }, 2: { cellWidth: 22, halign: 'center' }, 3: { cellWidth: 50 } },
                didParseCell: function(data) {
                    if (data.column.index === 2 && data.section === 'body') {
                        if(data.cell.text[0] === 'ANORMAL') {
                            data.cell.styles.textColor = [200, 30, 30];
                            data.cell.styles.fillColor = [255, 235, 235];
                        } else if(data.cell.text[0] === '—') {
                            data.cell.styles.textColor = [170, 170, 170];
                        }
                    }
                },
                margin: { left: M, right: M }
            });
            y = pdf.lastAutoTable.finalY + 8;

            var tipoAss = (currentOM.pendenteAssinatura || isCancelamento) ? 'ASSINATURA DO FISCAL' : 'ASSINATURA DO CLIENTE / RESPONSAVEL';
            y = _pdfDrawSignatureBlock(pdf, y, tipoAss, {
                assinatura: currentOM.assinaturaCliente,
                executantes: executantesNomes,
                fiscalName: currentOM.nomeFiscal || ''
            });

            _pdfRodape(pdf, tituloPDF);
            var pdfBase64 = pdf.output('dataurlstring');
            return PdfDB.put('ck_' + currentOM.num + (currentOM.execTs ? '_' + currentOM.execTs : ''), pdfBase64);
        }

        function gerarPDFNaoConformidade() {
            var fotos = currentOM.checklistFotos || {};
            var allTitulos = checklistItens.mensal.concat(checklistItens.trimestral);
            var allNomes = [];
            for (var i = 0; i < 6; i++) allNomes.push('m' + (i + 1));
            for (var j = 0; j < 9; j++) allNomes.push('t' + (j + 1));

            var itensAnormais = [];
            for (var z = 0; z < allNomes.length; z++) {
                var n = allNomes[z];
                if (fotos[n] && fotos[n].antes) {
                    itensAnormais.push({
                        nome: n,
                        titulo: allTitulos[z],
                        antes: fotos[n].antes,
                        depois: fotos[n].depois || null,
                        explicacao: fotos[n].explicacao || ''
                    });
                }
            }
            if (itensAnormais.length === 0) return;

            var jsPDF = window.jspdf.jsPDF;
            var pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            var W = 210, M = 15;

            var y = _pdfHeader(pdf, 'RELATORIO DE NAO CONFORMIDADE');
            y = _pdfSection(pdf, y, 'INFORMACOES DA ORDEM', 18);
            y = _pdfInfoGrid(pdf, y) + 8;
            y = _pdfSection(pdf, y, 'NAO CONFORMIDADES IDENTIFICADAS  (' + itensAnormais.length + ')', 18);

            var resumoBody = itensAnormais.map(function(it, idx) {
                return [
                    { content: (idx + 1).toString(), styles: { halign: 'center' } },
                    { content: it.nome.toUpperCase() },
                    { content: it.titulo }
                ];
            });
            pdf.autoTable({
                startY: y,
                head: [['#', 'Ref.', 'Descricao do Item']],
                body: resumoBody,
                theme: 'grid',
                tableWidth: 180,
                headStyles: { fillColor: [74,74,74], textColor: [255,255,255], fontSize: 6, fontStyle: 'bold', cellPadding: 1.5 },
                bodyStyles: { fontSize: 6.2, cellPadding: 1.55, textColor: [30,30,30], lineColor: [205,205,205], lineWidth: 0.15, overflow: 'linebreak' },
                columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 18 }, 2: { cellWidth: 152 } },
                margin: { left: M, right: M }
            });
            y = pdf.lastAutoTable.finalY + 10;

            for (var i = 0; i < itensAnormais.length; i++) {
                var item = itensAnormais[i];
                var tituloItem = 'NC #' + (i + 1) + ' - ' + item.nome.toUpperCase() + ' - ' + item.titulo;
                var titleInfo = _pdfSplitText(pdf, tituloItem, W - M * 2 - 6, 3.8);
                var headerH = Math.max(10, titleInfo.height + 4);

                y = _pdfEnsureSpace(pdf, y, headerH + 10, 20);

                pdf.setFillColor(246, 246, 246);
                pdf.setDrawColor(140, 140, 140);
                pdf.setLineWidth(0.3);
                pdf.rect(M, y - 1, W - M * 2, headerH, 'FD');
                pdf.setFontSize(8.2);
                pdf.setFont(undefined, 'bold');
                pdf.setTextColor(30, 30, 30);
                pdf.text(titleInfo.lines, M + 3, y + 4);
                y += headerH + 4;

                if (item.explicacao) {
                    pdf.autoTable({
                        startY: y,
                        body: [[
                            { content: 'Descricao / Explicacao', styles: { fontStyle: 'bold', textColor: [100,100,100], fillColor: [246,246,246] } },
                            { content: _pdfTextSafe(item.explicacao) }
                        ]],
                        theme: 'grid',
                        tableWidth: 180,
                        styles: { fontSize: 7, cellPadding: 1.8, textColor: [30,30,30], lineColor: [200,200,200], lineWidth: 0.15, overflow: 'linebreak' },
                        columnStyles: { 0: { cellWidth: 32 }, 1: { cellWidth: 148 } },
                        margin: { left: M, right: M }
                    });
                    y = pdf.lastAutoTable.finalY + 5;
                }

                var imgW = 82, imgH = 58;
                y = _pdfEnsureSpace(pdf, y, imgH + 12, 20);
                pdf.setFontSize(7);
                pdf.setFont(undefined, 'bold');
                pdf.setTextColor(80, 80, 80);
                pdf.text('ANTES', M, y);
                if (item.depois) pdf.text('DEPOIS', M + imgW + 8, y);
                y += 3;

                pdf.setDrawColor(180, 180, 180);
                pdf.setLineWidth(0.2);
                pdf.setFillColor(248, 248, 248);
                pdf.rect(M, y, imgW, imgH, 'FD');
                if (item.antes) {
                    try { pdf.addImage(item.antes, 'JPEG', M + 0.5, y + 0.5, imgW - 1, imgH - 1); } catch(e) { console.warn('[PCM] Falha ao inserir imagem no PDF:', e.message || e); }
                }
                if (item.depois) {
                    pdf.rect(M + imgW + 8, y, imgW, imgH, 'FD');
                    try { pdf.addImage(item.depois, 'JPEG', M + imgW + 8.5, y + 0.5, imgW - 1, imgH - 1); } catch(e) { console.warn('[PCM] Falha ao inserir imagem no PDF:', e.message || e); }
                }
                y += imgH + 14;
            }

            var tituloAss = currentOM.nomeFiscal ? 'ASSINATURA DO FISCAL' : 'ASSINATURA DO RESPONSAVEL';
            y = _pdfDrawSignatureBlock(pdf, y, tituloAss, {
                assinatura: currentOM.assinaturaCliente,
                executantes: executantesNomes,
                fiscalName: currentOM.nomeFiscal || ''
            });

            _pdfRodape(pdf, 'RELATORIO DE NAO CONFORMIDADE');
            var pdfBase64 = pdf.output('dataurlstring');
            return PdfDB.put('nc_' + currentOM.num + (currentOM.execTs ? '_' + currentOM.execTs : ''), pdfBase64);
        }

        function salvarComAssinatura() {
            const imgData = canvas.toDataURL();
            const isCanvasBlank = !ctx.getImageData(0, 0, canvas.width, canvas.height).data.some(c => c !== 0);
            
            if(isCanvasBlank) {
                alert('⚠️ Assinatura obrigatória!\n\nOu clique em "Finalizar Sem Assinatura"');
                return;
            }
            
            if(currentOM.planoCod || currentOM.checklistCorretiva) {
                var faltando = validarChecklist();
                if(faltando.length > 0) {
                    alert('⚠️ CHECKLIST INCOMPLETO!\n\n' + faltando.join('\n\n'));
                    return;
                }
            }

            omAssinada = true;
            const obs = $('observacoes').value;
            
            currentOM.assinaturaCliente = imgData;
            currentOM.observacoes = obs;
            currentOM.materiaisUsados = [...materiaisUsados];
            currentOM.finalizada = true;
            currentOM.pendenteAssinatura = false;
            currentOM.lockDeviceId = null;
            currentOM.dataFinalizacao = new Date().toISOString();
            currentOM._deslocSegundosSnapshot = deslocamentoSegundos;
            currentOM.execTs = Date.now();
            if(currentOM.planoCod || currentOM.checklistCorretiva) {
                var _tc = _detectarTipoChecklist();
                currentOM.tipoChecklist = _tc === 'MISTO' ? 'MENSAL' : _tc;
            }
            
            var _pdfPromises = [];
            _pdfPromises.push(gerarEArmazenarPDF());
            
            if(currentOM.planoCod || currentOM.checklistCorretiva) {
                if(!currentOM.checklistDados) { currentOM.checklistDados = coletarChecklistDados(); }
                if(!currentOM.checklistFotos) currentOM.checklistFotos = checklistFotos;
                _pdfPromises.push(gerarPDFChecklist());
            }

            if(currentOM.checklistFotos && Object.keys(currentOM.checklistFotos).some(function(k){return!!(currentOM.checklistFotos[k]||{}).antes;})) {
                _pdfPromises.push(gerarPDFNaoConformidade());
                currentOM._hasNcPdf = true;
            }

            _removerDesvioAcumulado(currentOM.num);
            var _tipoHist = isCancelamento ? 'CANCELADO' : 'ATENDIDO';
            _gravarDashboardLog(_tipoHist, currentOM);
            _acumularDadosExcel(currentOM);
            
            moverParaHistorico(currentOM, _tipoHist);
            
            const idx = oms.findIndex(om => om.num === currentOM.num);
            if(idx >= 0) {
                oms.splice(idx, 1);
            }
            
            localStorage.removeItem(STORAGE_KEY_CURRENT);
            salvarOMs();
            
            _pushOMStatusSupabase(currentOM);
            Promise.all(_pdfPromises.map(function(p){ return p && p.catch ? p.catch(function(){}) : Promise.resolve(); })).then(function() {
                _uploadPDFRelatorio(currentOM.num);
            });
            
            alert('✅ OM SALVA E SINCRONIZADA!\n\nPDF gerado e armazenado.');
            hideFinalizar();
            hideDetail();
            filtrarOMs();
        }

        function finalizarSemAssinatura() {
            if(currentOM.planoCod || currentOM.checklistCorretiva) {
                var faltando = validarChecklist();
                if(faltando.length > 0) {
                    alert('⚠️ CHECKLIST INCOMPLETO!\n\n' + faltando.join('\n\n'));
                    return;
                }
            }

            if(!confirm('⚠️ Finalizar SEM assinatura?\n\nOM ficará com status PENDENTE ASSINATURA')) {
                return;
            }
            
            omAssinada = false;
            const obs = $('observacoes').value;
            
            currentOM.pendenteAssinatura = true;
            currentOM.materiaisUsados = [...materiaisUsados];
            currentOM.observacoes = obs;
            currentOM.lockDeviceId = null;
            currentOM._deslocSegundosSnapshot = deslocamentoSegundos;
            
            if(currentOM.planoCod || currentOM.checklistCorretiva) {
                currentOM.checklistDados = coletarChecklistDados();
                currentOM.checklistFotos = checklistFotos;
                var _tc2 = _detectarTipoChecklist();
                currentOM.tipoChecklist = _tc2 === 'MISTO' ? 'MENSAL' : _tc2;
            }
            
            localStorage.removeItem(STORAGE_KEY_CURRENT);
            salvarOMs();
            
            var _pdfPromises2 = [];
            _pdfPromises2.push(gerarEArmazenarPDF());

            if(currentOM.planoCod || currentOM.checklistCorretiva) {
                if(!currentOM.checklistDados) currentOM.checklistDados = coletarChecklistDados();
                if(!currentOM.checklistFotos) currentOM.checklistFotos = checklistFotos;
                _pdfPromises2.push(gerarPDFChecklist());
            }

            if(currentOM.checklistFotos && Object.keys(currentOM.checklistFotos).some(function(k){return!!(currentOM.checklistFotos[k]||{}).antes;})) {
                _pdfPromises2.push(gerarPDFNaoConformidade());
                currentOM._hasNcPdf = true;
            }

            _pushOMStatusSupabase(currentOM);
            Promise.all(_pdfPromises2.map(function(p){ return p && p.catch ? p.catch(function(){}) : Promise.resolve(); })).then(function() {
                _uploadPDFRelatorio(currentOM.num);
            });
            
            alert('⚠️ OM PENDENTE ASSINATURA\n\nClique 3x na OM para assinar como fiscal.');
            hideFinalizar();
            hideDetail();
            filtrarOMs();
        }

        function gerarEArmazenarPDF() {
            var jsPDF = window.jspdf.jsPDF;
            var pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            var W = 210, M = 15;
            var tipoDoc = 'RELATORIO DE EXECUCAO';
            if(isCancelamento) tipoDoc = 'RELATORIO DE CANCELAMENTO';
            if(currentOM.statusDesvio === 'AGUARDANDO REPROGRAMACAO') tipoDoc = 'RELATORIO DE REPROGRAMACAO';

            var y = _pdfHeader(pdf, tipoDoc);
            y = _pdfSection(pdf, y, 'INFORMACOES DA ORDEM', 18);
            y = _pdfInfoGrid(pdf, y) + 8;

            if (isCancelamento) {
                y = _pdfSection(pdf, y, 'DADOS DO CANCELAMENTO', 18);
                var cancelBody = [
                    [{ content: 'Codigo de Desvio', styles: { fontStyle: 'bold', textColor: [100,100,100], fillColor: [246,246,246] } }, { content: currentOM.desvio || '---', colSpan: 3 }]
                ];
                if (currentOM.justificativaCancelamento) {
                    cancelBody.push([{ content: 'Justificativa', styles: { fontStyle: 'bold', textColor: [100,100,100], fillColor: [246,246,246] } }, { content: currentOM.justificativaCancelamento, colSpan: 3 }]);
                }
                pdf.autoTable({
                    startY: y,
                    body: cancelBody,
                    theme: 'grid',
                    tableWidth: 180,
                    styles: { fontSize: 6.5, cellPadding: 1.5, textColor: [30,30,30], lineColor: [200,200,200], lineWidth: 0.15, overflow: 'linebreak' },
                    columnStyles: { 0: { cellWidth: 28 }, 1: { cellWidth: 152 } },
                    margin: { left: M, right: M }
                });
                y = pdf.lastAutoTable.finalY + 8;
            }

            if (currentOM.statusDesvio === 'AGUARDANDO REPROGRAMACAO' && currentOM.motivoReprogramacao) {
                y = _pdfSection(pdf, y, 'DADOS DA REPROGRAMACAO', 18);
                var repBody = [
                    [{ content: 'Motivo', styles: { fontStyle: 'bold', textColor: [100,100,100], fillColor: [246,246,246] } }, { content: currentOM.motivoReprogramacao, colSpan: 3 }]
                ];
                pdf.autoTable({
                    startY: y,
                    body: repBody,
                    theme: 'grid',
                    tableWidth: 180,
                    styles: { fontSize: 6.5, cellPadding: 1.5, textColor: [30,30,30], lineColor: [200,200,200], lineWidth: 0.15, overflow: 'linebreak' },
                    columnStyles: { 0: { cellWidth: 28 }, 1: { cellWidth: 152 } },
                    margin: { left: M, right: M }
                });
                y = pdf.lastAutoTable.finalY + 8;
            }

            if (currentOM.historicoExecucao && currentOM.historicoExecucao.length > 0) {
                y = _pdfSection(pdf, y, 'DESLOCAMENTO', 18);
                var deslBody = [];
                var totalDeslSeg = 0;
                var pessoalN = 0;
                for (var h = 0; h < currentOM.historicoExecucao.length; h++) {
                    var hist = currentOM.historicoExecucao[h];
                    var execs = hist.executantes || [];
                    var numExec = execs.length || 1;
                    var deslSeg = (hist.deslocamentoSegundos !== undefined) ? hist.deslocamentoSegundos : ((hist.deslocamentoMinutos || 0) * 60);
                    if((hist.tag === 'OFICINA') || hist.desvio || deslSeg <= 0) continue;
                    var dIni = hist.deslocamentoHoraInicio ? new Date(hist.deslocamentoHoraInicio) : null;
                    var dFim = hist.deslocamentoHoraFim ? new Date(hist.deslocamentoHoraFim) : null;
                    var dataIniStr = dIni ? dIni.toLocaleDateString('pt-BR') : '--/--/--';
                    var dataFimStr = dFim ? dFim.toLocaleDateString('pt-BR') : '--/--/--';
                    var horaIniStr = dIni ? dIni.toLocaleTimeString('pt-BR') : '--:--:--';
                    var horaFimStr = dFim ? dFim.toLocaleTimeString('pt-BR') : '--:--:--';
                    var deslHoras = (deslSeg / 3600).toFixed(2) + 'h';
                    var causaStr = '002';
                    for (var e = 0; e < numExec; e++) {
                        pessoalN++;
                        totalDeslSeg += deslSeg;
                        deslBody.push([
                            { content: currentOM.num, styles: { fontSize: 5.5, halign: 'center' } },
                            { content: String(pessoalN), styles: { halign: 'center', fontSize: 6 } },
                            { content: dataIniStr, styles: { halign: 'center', fontSize: 6 } },
                            { content: horaIniStr, styles: { halign: 'center', fontSize: 6 } },
                            { content: dataFimStr, styles: { halign: 'center', fontSize: 6 } },
                            { content: horaFimStr, styles: { halign: 'center', fontSize: 6 } },
                            { content: deslHoras, styles: { halign: 'center', fontStyle: 'bold', fontSize: 6.5 } },
                            { content: causaStr, styles: { halign: 'center', fontSize: 6 } }
                        ]);
                    }
                }
                if(deslBody.length === 0) {
                    deslBody.push([
                        { content: currentOM.num, styles: { fontSize: 5.5, halign: 'center' } },
                        { content: '-', styles: { halign: 'center', fontSize: 6 } },
                        { content: '--/--/--', styles: { halign: 'center', fontSize: 6 } },
                        { content: '--:--:--', styles: { halign: 'center', fontSize: 6 } },
                        { content: '--/--/--', styles: { halign: 'center', fontSize: 6 } },
                        { content: '--:--:--', styles: { halign: 'center', fontSize: 6 } },
                        { content: 'SEM DESLOCAMENTO', styles: { halign: 'center', fontStyle: 'bold', fontSize: 6.5 } },
                        { content: '-', styles: { halign: 'center', fontSize: 6 } }
                    ]);
                }
                var stlTot = { halign: 'center', fontStyle: 'bold', fontSize: 7, fillColor: [90,90,90], textColor: [255,255,255] };
                deslBody.push([
                    { content: '', styles: stlTot }, { content: '', styles: stlTot }, { content: '', styles: stlTot }, { content: '', styles: stlTot },
                    { content: '', styles: stlTot }, { content: '', styles: stlTot }, { content: (totalDeslSeg / 3600).toFixed(2) + 'h', styles: stlTot }, { content: '', styles: stlTot }
                ]);
                pdf.autoTable({
                    startY: y,
                    head: [['OM', 'N\u00ba Pessoal', 'Inic. Exec', 'Inic. Exec', 'Fim Exec', 'Fim Exec', 'Tempo', 'Causa']],
                    body: deslBody,
                    theme: 'grid',
                    tableWidth: 180,
                    headStyles: { fillColor: [70,70,70], textColor: [255,255,255], fontSize: 5.5, fontStyle: 'bold', cellPadding: 1.5, halign: 'center' },
                    bodyStyles: { fontSize: 6.1, cellPadding: 1.5, textColor: [30,30,30], lineColor: [205,205,205], lineWidth: 0.15, overflow: 'linebreak' },
                    columnStyles: { 0: { cellWidth: 24 }, 1: { cellWidth: 16 }, 2: { cellWidth: 22 }, 3: { cellWidth: 20 }, 4: { cellWidth: 22 }, 5: { cellWidth: 20 }, 6: { cellWidth: 42 }, 7: { cellWidth: 14 } },
                    margin: { left: M, right: M }
                });
                y = pdf.lastAutoTable.finalY + 6;

                y = _pdfSection(pdf, y, 'ETAPAS DA EXECUCAO', 18);
                var etapasBody = [];
                var etapasHhAtivTotal = 0;
                var etapasHhDeslTotal = 0;
                var etapaRowSeq = 1;
                // Acumular HH de desvios para somar ao deslocamento das etapas normais
                var _devOM2 = currentOM.desviosRegistrados || [];
                var _devLocal2 = _getDesviosDaOM(currentOM.num);
                var _devAll2 = _devOM2.length > 0 ? _devOM2 : _devLocal2;
                var totalDevSegEtapas = 0;
                for (var dd2 = 0; dd2 < _devAll2.length; dd2++) totalDevSegEtapas += (_devAll2[dd2].tempoSegundos || 0);
                var devHhExtra = totalDevSegEtapas / 3600;
                var devDistribuido = false;
                for (var eh = 0; eh < currentOM.historicoExecucao.length; eh++) {
                    var hx = currentOM.historicoExecucao[eh] || {};
                    if (hx.desvio) continue; // Silenciosamente omitir desvios da tabela
                    var ei = hx.dataInicio ? new Date(hx.dataInicio) : null;
                    var ef = hx.dataFim ? new Date(hx.dataFim) : null;
                    var tagEt = hx.tag || 'ATIVIDADE';
                    var execsEt = (hx.executantes && hx.executantes.length) ? hx.executantes : ['---'];
                    var hhAtivEt = Number(hx.hhAtividade || 0);
                    var hhDeslEt = Number(hx.hhDeslocamento || 0);
                    // Somar HH de desvios ao primeiro deslocamento encontrado
                    if (!devDistribuido && hhDeslEt > 0 && devHhExtra > 0) {
                        hhDeslEt += devHhExtra;
                        devDistribuido = true;
                    }
                    for (var ex = 0; ex < execsEt.length; ex++) {
                        etapasHhAtivTotal += hhAtivEt;
                        etapasHhDeslTotal += hhDeslEt;
                        etapasBody.push([
                            { content: String(etapaRowSeq++), styles: { halign: 'center', fontSize: 6 } },
                            { content: tagEt, styles: { halign: 'center', fontSize: 6, fontStyle: 'bold' } },
                            { content: String(execsEt[ex] || '---'), styles: { fontSize: 6 } },
                            { content: ei ? ei.toLocaleDateString('pt-BR') + ' ' + ei.toLocaleTimeString('pt-BR') : '--', styles: { halign: 'center', fontSize: 6 } },
                            { content: ef ? ef.toLocaleDateString('pt-BR') + ' ' + ef.toLocaleTimeString('pt-BR') : '--', styles: { halign: 'center', fontSize: 6 } },
                            { content: hhAtivEt.toFixed(2) + 'h', styles: { halign: 'center', fontSize: 6 } },
                            { content: hhDeslEt.toFixed(2) + 'h', styles: { halign: 'center', fontSize: 6 } }
                        ]);
                    }
                }
                // Se nenhum deslocamento encontrado, somar desvios ao total diretamente
                if (!devDistribuido && devHhExtra > 0) etapasHhDeslTotal += devHhExtra;
                if(etapasBody.length === 0) {
                    etapasBody.push([{ content: 'Sem etapas registradas', colSpan: 7, styles: { halign: 'center', fontSize: 6.2, textColor: [110,110,110] } }]);
                } else {
                    etapasBody.push([
                        { content: 'TOTAL', colSpan: 5, styles: { halign: 'right', fontSize: 6.4, fontStyle: 'bold', fillColor: [90,90,90], textColor: [255,255,255] } },
                        { content: etapasHhAtivTotal.toFixed(2) + 'h', styles: { halign: 'center', fontSize: 6.4, fontStyle: 'bold', fillColor: [90,90,90], textColor: [255,255,255] } },
                        { content: etapasHhDeslTotal.toFixed(2) + 'h', styles: { halign: 'center', fontSize: 6.4, fontStyle: 'bold', fillColor: [90,90,90], textColor: [255,255,255] } }
                    ]);
                }
                pdf.autoTable({
                    startY: y,
                    head: [['#', 'Etapa', 'Executantes', 'Início', 'Fim', 'HH Ativ.', 'HH Desl.']],
                    body: etapasBody,
                    theme: 'grid',
                    tableWidth: 180,
                    headStyles: { fillColor: [70,70,70], textColor: [255,255,255], fontSize: 6, fontStyle: 'bold', cellPadding: 1.5, halign: 'center' },
                    bodyStyles: { fontSize: 6.1, cellPadding: 1.5, textColor: [30,30,30], lineColor: [205,205,205], lineWidth: 0.15, overflow: 'linebreak' },
                    columnStyles: { 0: { cellWidth: 8 }, 1: { cellWidth: 20 }, 2: { cellWidth: 45 }, 3: { cellWidth: 34 }, 4: { cellWidth: 34 }, 5: { cellWidth: 19.5 }, 6: { cellWidth: 19.5 } },
                    margin: { left: M, right: M }
                });
                y = pdf.lastAutoTable.finalY + 6;


                // --- Timeline Oficina (se OM passou pela oficina) ---
                if(currentOM.hhSnapshotOficina || currentOM.dataEnvioOficina || currentOM.etapaOficina) {
                    y = _pdfSection(pdf, y, 'TIMELINE OFICINA', 18);
                    var tlBody = [];
                    var tlEtapas = [];
                    // Agrupar historico por etapa
                    for(var tl = 0; tl < currentOM.historicoExecucao.length; tl++) {
                        var tlH = currentOM.historicoExecucao[tl];
                        var tlTag = tlH.tag || 'ATIVIDADE';
                        var tlEtapa = 'CAMPO';
                        if(tlTag === 'OFICINA' || tlTag === 'OFICINA_FIM' || tlTag === 'OFICINA_TROCA_TURNO') tlEtapa = 'OFICINA';
                        else if(tlTag === 'MONTAGEM') tlEtapa = 'MONTAGEM';
                        else if(currentOM.etapaOficina === 'MONTAGEM' && tl === currentOM.historicoExecucao.length - 1) tlEtapa = 'MONTAGEM';
                        var tlIni = tlH.dataInicio ? new Date(tlH.dataInicio) : null;
                        var tlFim = tlH.dataFim ? new Date(tlH.dataFim) : null;
                        var tlDur = (tlIni && tlFim) ? Math.max(0, Math.floor((tlFim - tlIni) / 1000) - (tlH.tempoPausadoTotal || 0)) : 0;
                        var tlExecs = (tlH.executantes || []).join(', ') || '---';
                        tlBody.push([
                            { content: tlEtapa, styles: { halign: 'center', fontSize: 6, fontStyle: 'bold', textColor: tlEtapa === 'OFICINA' ? [180,90,0] : (tlEtapa === 'MONTAGEM' ? [0,100,0] : [30,30,30]) } },
                            { content: tlTag, styles: { halign: 'center', fontSize: 5.5 } },
                            { content: tlExecs, styles: { fontSize: 5.5 } },
                            { content: tlIni ? tlIni.toLocaleString('pt-BR') : '--', styles: { halign: 'center', fontSize: 5.5 } },
                            { content: tlFim ? tlFim.toLocaleString('pt-BR') : '--', styles: { halign: 'center', fontSize: 5.5 } },
                            { content: _formatarTempo(tlDur), styles: { halign: 'center', fontStyle: 'bold', fontSize: 6 } }
                        ]);
                    }
                    if(tlBody.length > 0) {
                        pdf.autoTable({
                            startY: y,
                            head: [['Etapa', 'Tag', 'Executantes', 'Inicio', 'Fim', 'Duracao']],
                            body: tlBody,
                            theme: 'grid',
                            tableWidth: 180,
                            headStyles: { fillColor: [50,90,130], textColor: [255,255,255], fontSize: 5.5, fontStyle: 'bold', cellPadding: 1.5, halign: 'center' },
                            bodyStyles: { fontSize: 5.8, cellPadding: 1.3, textColor: [30,30,30], lineColor: [200,200,200], lineWidth: 0.15, overflow: 'linebreak' },
                            columnStyles: { 0: { cellWidth: 22 }, 1: { cellWidth: 28 }, 2: { cellWidth: 40 }, 3: { cellWidth: 34 }, 4: { cellWidth: 34 }, 5: { cellWidth: 22 } },
                            margin: { left: M, right: M }
                        });
                        y = pdf.lastAutoTable.finalY + 6;
                    }
                }

                y = _pdfSection(pdf, y, 'ATIVIDADE', 18);
                var ativBody = [];
                var totalAtivSeg = 0;
                var pessoalNA = 0;
                for (var h2 = 0; h2 < currentOM.historicoExecucao.length; h2++) {
                    var hist2 = currentOM.historicoExecucao[h2];
                    if (hist2.desvio) continue;
                    var execs2 = hist2.executantes || [];
                    var numExec2 = execs2.length || 1;
                    var aIni = hist2.dataInicio ? new Date(hist2.dataInicio) : null;
                    var aFim = hist2.dataFim ? new Date(hist2.dataFim) : null;
                    var ativSeg = 0;
                    if (aIni && aFim) ativSeg = Math.floor((aFim - aIni) / 1000) - (hist2.tempoPausadoTotal || 0);
                    var dataIniStr2 = aIni ? aIni.toLocaleDateString('pt-BR') : '--/--/--';
                    var dataFimStr2 = aFim ? aFim.toLocaleDateString('pt-BR') : '--/--/--';
                    var horaIniStr2 = aIni ? aIni.toLocaleTimeString('pt-BR') : '--:--:--';
                    var horaFimStr2 = aFim ? aFim.toLocaleTimeString('pt-BR') : '--:--:--';
                    var ativHoras = (ativSeg / 3600).toFixed(2) + 'h';
                    for (var e2 = 0; e2 < numExec2; e2++) {
                        pessoalNA++;
                        totalAtivSeg += ativSeg;
                        ativBody.push([
                            { content: currentOM.num, styles: { fontSize: 6, halign: 'center' } },
                            { content: String(pessoalNA), styles: { halign: 'center', fontSize: 6 } },
                            { content: dataIniStr2, styles: { halign: 'center', fontSize: 6 } },
                            { content: horaIniStr2, styles: { halign: 'center', fontSize: 6 } },
                            { content: dataFimStr2, styles: { halign: 'center', fontSize: 6 } },
                            { content: horaFimStr2, styles: { halign: 'center', fontSize: 6 } },
                            { content: ativHoras, styles: { halign: 'center', fontStyle: 'bold', fontSize: 6.5 } }
                        ]);
                    }
                }
                ativBody.push([
                    { content: '', styles: stlTot }, { content: '', styles: stlTot }, { content: '', styles: stlTot }, { content: '', styles: stlTot },
                    { content: '', styles: stlTot }, { content: '', styles: stlTot }, { content: (totalAtivSeg / 3600).toFixed(2) + 'h', styles: stlTot }
                ]);
                pdf.autoTable({
                    startY: y,
                    head: [['OM', 'N\u00ba Pessoal', 'Inic. Exec', 'Inic. Exec', 'Fim Exec', 'Fim Exec', 'Tempo']],
                    body: ativBody,
                    theme: 'grid',
                    tableWidth: 180,
                    headStyles: { fillColor: [70,70,70], textColor: [255,255,255], fontSize: 6, fontStyle: 'bold', cellPadding: 1.5, halign: 'center' },
                    bodyStyles: { fontSize: 6.2, cellPadding: 1.55, textColor: [30,30,30], lineColor: [205,205,205], lineWidth: 0.15, overflow: 'linebreak' },
                    columnStyles: { 0: { cellWidth: 26 }, 1: { cellWidth: 18 }, 2: { cellWidth: 26 }, 3: { cellWidth: 22 }, 4: { cellWidth: 26 }, 5: { cellWidth: 22 }, 6: { cellWidth: 40 } },
                    margin: { left: M, right: M }
                });
                y = pdf.lastAutoTable.finalY + 6;

                var totalGeralSeg = totalDeslSeg + totalAtivSeg;
                var classifGeral = { normal: 0, extra: 0, noturno: 0 };
                for (var h3 = 0; h3 < currentOM.historicoExecucao.length; h3++) {
                    var hist3 = currentOM.historicoExecucao[h3];
                    var numExec3 = (hist3.executantes || []).length || 1;
                    var cl = classificarHoras(hist3.deslocamentoHoraInicio || hist3.dataInicio, hist3.dataFim);
                    classifGeral.normal += cl.normal * numExec3;
                    classifGeral.extra += cl.extra * numExec3;
                    classifGeral.noturno += cl.noturno * numExec3;
                }
                // Somar desvios ao deslocamento silenciosamente no resumo
                var _devOMr = currentOM.desviosRegistrados || [];
                var _devLocalr = _getDesviosDaOM(currentOM.num);
                var _devAllr = _devOMr.length > 0 ? _devOMr : _devLocalr;
                var totalDevSegResumo = 0;
                for (var dd = 0; dd < _devAllr.length; dd++) totalDevSegResumo += (_devAllr[dd].tempoSegundos || 0);
                var totalDeslComDesvio = totalDeslSeg + totalDevSegResumo;
                var totalGeralComDesvio = totalDeslComDesvio + totalAtivSeg;
                var resumoBody = [[
                    { content: (totalDeslComDesvio / 3600).toFixed(2) + 'h', styles: { halign: 'center', fontStyle: 'bold', fontSize: 6 } },
                    { content: (totalAtivSeg / 3600).toFixed(2) + 'h', styles: { halign: 'center', fontStyle: 'bold', fontSize: 6 } },
                    { content: String(pessoalN || pessoalNA || 0), styles: { halign: 'center', fontStyle: 'bold', fontSize: 6 } },
                    { content: (totalGeralComDesvio / 3600).toFixed(2) + 'h', styles: { halign: 'center', fontStyle: 'bold', fontSize: 6.5 } },
                    { content: classifGeral.normal.toFixed(2) + 'h', styles: { halign: 'center', fontStyle: 'bold', fontSize: 6, textColor: [30,30,30] } },
                    { content: classifGeral.extra.toFixed(2) + 'h', styles: { halign: 'center', fontStyle: 'bold', fontSize: 6, textColor: [30,30,30] } },
                    { content: classifGeral.noturno.toFixed(2) + 'h', styles: { halign: 'center', fontStyle: 'bold', fontSize: 6, textColor: [30,30,30] } }
                ]];
                pdf.autoTable({
                    startY: y,
                    head: [['Desloc.', 'Ativid.', 'N\u00ba Pess.', 'TOTAL', 'Normal', 'Extra', 'Noturno']],
                    body: resumoBody,
                    theme: 'grid',
                    tableWidth: 180,
                    headStyles: { fillColor: [70,70,70], textColor: [255,255,255], fontSize: 6.2, fontStyle: 'bold', cellPadding: 1.6, halign: 'center' },
                    bodyStyles: { fontSize: 6.3, cellPadding: 1.8, textColor: [30,30,30], lineColor: [205,205,205], lineWidth: 0.15, overflow: 'linebreak' },
                    columnStyles: { 0: { cellWidth: 26 }, 1: { cellWidth: 26 }, 2: { cellWidth: 20 }, 3: { cellWidth: 26 }, 4: { cellWidth: 28 }, 5: { cellWidth: 26 }, 6: { cellWidth: 28 } },
                    margin: { left: M, right: M }
                });
                y = pdf.lastAutoTable.finalY + 8;
            }

            var mats = currentOM.materiaisUsados || materiaisUsados || [];
            if(!mats || mats.length === 0) {
                var histM = Array.isArray(currentOM.historicoExecucao) ? currentOM.historicoExecucao : [];
                var agg = {};
                for (var hm = 0; hm < histM.length; hm++) {
                    var arrM = Array.isArray(histM[hm].materiaisUsados) ? histM[hm].materiaisUsados : [];
                    for (var mm = 0; mm < arrM.length; mm++) {
                        var im = arrM[mm] || {};
                        var kM = [im.codigo || '', im.nome || '', im.unidade || '', im.precoUnit || 0, im.tipo || ''].join('|');
                        if(!agg[kM]) agg[kM] = { codigo: im.codigo || '', nome: im.nome || '', unidade: im.unidade || '', precoUnit: Number(im.precoUnit || 0), qtd: 0, total: 0, tipo: im.tipo || 'Pricelist', bdiPercentual: Number(im.bdiPercentual || 0), bdiValor: Number(im.bdiValor || 0) };
                        agg[kM].qtd += Number(im.qtd || 0);
                        agg[kM].total += Number(im.total || 0);
                    }
                }
                mats = Object.keys(agg).map(function(k){ return agg[k]; });
            }
            if (mats.length > 0 || true) {
                y = _pdfSection(pdf, y, 'MATERIAIS UTILIZADOS', 18);
                var tituloMat = currentOM.titulo || '';
                var matBody = [];
                var totalMat = 0;
                var bmLabel = configBM.numero ? ('BM ' + configBM.numero + (configBM.dataInicio ? ' - ' + configBM.dataInicio + ' a ' + configBM.dataFim : '')) : '';
                if (bmLabel) {
                    pdf.setFontSize(6);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text(bmLabel, M, y);
                    y += 4;
                }
                for (var m = 0; m < mats.length; m++) {
                    var mat = mats[m];
                    var vlTotal = mat.total || 0;
                    totalMat += vlTotal;
                    var ct2 = mat.tipo || 'Pricelist';
                    var bdiStr = mat.bdiPercentual > 0 ? mat.bdiValor.toFixed(2) : '';
                    matBody.push([
                        { content: currentOM.num, styles: { halign: 'center', fontSize: 5.6, textColor: [10,10,10], fontStyle: 'bold' } },
                        { content: tituloMat, styles: { fontSize: 4.9, textColor: [10,10,10] } },
                        { content: configTipoSolicitacao, styles: { fontSize: 4.9, textColor: [10,10,10] } },
                        { content: mat.codigo || '—', styles: { halign: 'center', fontSize: 5.8, textColor: [10,10,10], fontStyle: 'bold' } },
                        { content: ct2, styles: { halign: 'center', fontSize: 4.9, fontStyle: 'bold', textColor: ct2 === 'Material Vale' ? [200,0,0] : (ct2 === 'Extraordinário' ? [190,90,0] : [10,10,10]) } },
                        { content: mat.nome || '---', styles: { fontSize: 4.9, textColor: [10,10,10] } },
                        { content: mat.unidade || '—', styles: { halign: 'center', fontSize: 5.4, textColor: [10,10,10] } },
                        { content: (mat.qtd || 0).toString(), styles: { halign: 'center', fontSize: 5.4, textColor: [10,10,10] } },
                        { content: mat.precoUnit > 0 ? 'R$ ' + (mat.precoUnit || 0).toFixed(2) : '0', styles: { halign: 'right', fontSize: 5.4, textColor: [10,10,10] } },
                        { content: bdiStr, styles: { halign: 'right', fontSize: 5.3, textColor: [10,10,10] } },
                        { content: vlTotal > 0 ? 'R$ ' + vlTotal.toFixed(2) : '', styles: { halign: 'right', fontStyle: 'bold', fontSize: 5.6, textColor: [0,0,0] } }
                    ]);
                }
                if (mats.length > 0) {
                    matBody.push([
                        { content: 'TOTAL GERAL', colSpan: 10, styles: { fontStyle: 'bold', halign: 'right', fillColor: [55,55,55], textColor: [255,255,255], fontSize: 6.2 } },
                        { content: 'R$ ' + totalMat.toFixed(2), styles: { fontStyle: 'bold', halign: 'right', fillColor: [55,55,55], textColor: [255,255,255], fontSize: 7.2 } }
                    ]);
                }
                var matHead = [['OM', 'Descrição OM', 'Tipo de Solicitação', 'Código', 'Ct2', 'Descrição Material', 'Um', 'Qtd', 'VL. Unit.', 'BDI\n' + configBDI.toFixed(4) + '%', 'VL. Total']];
                pdf.autoTable({
                    startY: y,
                    head: matHead,
                    body: matBody.length > 0 ? matBody : [[{ content: '— Sem materiais —', colSpan: 11, styles: { halign: 'center', fontSize: 6.2, textColor: [110,110,110] } }]],
                    theme: 'grid',
                    tableWidth: 180,
                    headStyles: { fillColor: [45,45,45], textColor: [255,255,255], fontSize: 5.9, fontStyle: 'bold', cellPadding: 1.7, lineColor: [95,95,95], lineWidth: 0.22, halign: 'center', valign: 'middle' },
                    bodyStyles: { fontSize: 5.95, cellPadding: 1.55, textColor: [12,12,12], lineColor: [170,170,170], lineWidth: 0.18, overflow: 'linebreak', valign: 'middle' },
                    alternateRowStyles: { fillColor: [248,248,248] },
                    columnStyles: {
                        0: { cellWidth: 17.5 }, 1: { cellWidth: 22 }, 2: { cellWidth: 18 }, 3: { cellWidth: 10 },
                        4: { cellWidth: 16 }, 5: { cellWidth: 30 }, 6: { cellWidth: 8.5, halign: 'center' },
                        7: { cellWidth: 8.5, halign: 'center' }, 8: { cellWidth: 16, halign: 'right' },
                        9: { cellWidth: 14, halign: 'right' }, 10: { cellWidth: 19.5, halign: 'right' }
                    },
                    margin: { left: M, right: M },
                    didParseCell: function(data) {
                        if (data.section === 'body' && data.row && data.row.raw && data.row.raw.length === 11) {
                            if (data.column.index === 5) data.cell.styles.fontStyle = 'normal';
                        }
                    }
                });
                y = pdf.lastAutoTable.finalY + 8;
            }

            var obs = currentOM.observacoes;
            y = _pdfDrawObservationTable(pdf, y, 'OBSERVACOES', obs);

            var tipoAss = (isCancelamento || currentOM.pendenteAssinatura) ? 'ASSINATURA DO FISCAL' : 'ASSINATURA DO CLIENTE / RESPONSAVEL';
            y = _pdfDrawSignatureBlock(pdf, y, tipoAss, {
                assinatura: currentOM.assinaturaCliente,
                executantes: executantesNomes,
                fiscalName: (isCancelamento || currentOM.pendenteAssinatura) ? (currentOM.nomeFiscal || '') : ''
            });

            _pdfRodape(pdf, tipoDoc);
            var pdfBase64 = pdf.output('dataurlstring');
            var _ts = currentOM.execTs || '';
            return PdfDB.put('rel_' + currentOM.num + (_ts ? '_' + _ts : ''), pdfBase64);
        }

        function moverParaHistorico(om, tipo) {
            tipo = tipo || 'ATENDIDO';
            var historico = JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORICO) || '[]');
            var entry = {
                num: om.num,
                titulo: om.titulo || '',
                dataFinalizacao: om.dataFinalizacao || new Date().toISOString(),
                execTs: om.execTs || '',
                tipo: tipo,
                cancelada: om.cancelada || false,
                temDesvio: tipo === 'DESVIO' || tipo === 'REPROGRAMADO' || tipo === 'DESATIVADO',
                statusDesvio: null,
                temChecklist: !!om.planoCod || !!om.checklistCorretiva,
                temNC: !!om.retornouOficina,
                reaberta: false,
                canceladaDefinitivo: false,
                desviosRegistrados: om.desviosRegistrados || [],
                nomeFiscal: om.nomeFiscal || '',
                tagEquipamento: om.tagIdentificacao || om.equipamento || '---',
                equipe: om.equipe || '',
                cc: om.cc || '',
                materiaisUsados: om.materiaisUsados || [],
                historicoExecucao: om.historicoExecucao || [],
                omCompleta: null
            };
            if(tipo === 'DESVIO' || tipo === 'REPROGRAMADO') {
                entry.statusDesvio = om.statusDesvio || tipo;
                entry.omCompleta = JSON.parse(JSON.stringify(om));
            }
            if(tipo === 'CANCELADO') {
                entry.cancelada = true;
            }
            historico.push(entry);
            localStorage.setItem(STORAGE_KEY_HISTORICO, JSON.stringify(historico));
        }

        function showCancelar() {
            $('desvioSelect').value = '';
            $('justificativaCancelamento').value = '';
            $('btnConfirmarCancel').disabled = true;
            $('popupCancelar').classList.add('active');
        }

        function hideCancelar() {
            $('popupCancelar').classList.remove('active');
        }

        function confirmarCancelamento() {
            const desvio = $('desvioSelect').value;
            const just = $('justificativaCancelamento').value.trim();
            
            if(!desvio) {
                alert('⚠️ Selecione um código de desvio!');
                return;
            }
            
            if(timerAtividadeInterval) clearInterval(timerAtividadeInterval);
            if(currentOM.historicoExecucao && currentOM.historicoExecucao.length > 0) {
                var hLast = currentOM.historicoExecucao[currentOM.historicoExecucao.length - 1];
                if(hLast.dataInicio && !hLast.dataFim) {
                    var aSeg = Math.floor((new Date() - new Date(hLast.dataInicio)) / 1000) - tempoPausadoTotal;
                    if(aSeg < 0) aSeg = 0;
                    hLast.dataFim = new Date().toISOString();
                    hLast.hhAtividade = aSeg / 3600;
                    hLast.hhDeslocamento = (hLast.deslocamentoSegundos || 0) / 3600;
                    _calcHH(hLast);
                    hLast.tempoPausadoTotal = tempoPausadoTotal;
                }
            }
            
            currentOM.cancelada = true;
            currentOM.desvio = desvio;
            currentOM.justificativaCancelamento = just;
            currentOM.dataCancelamento = new Date().toLocaleString('pt-BR');
            currentOM.lockDeviceId = null;
            currentOM.pendenteAssinatura = true;
            currentOM.materiaisUsados = materiaisUsados.length > 0 ? [...materiaisUsados] : currentOM.materiaisUsados;
            isCancelamento = true;

            // Criar registro de desvio e salvar no banco
            var dvParts = desvio.split(' - ');
            var dvTempoSeg = (typeof hLast !== 'undefined' && hLast && hLast.hhAtividade)
                ? Math.round(hLast.hhAtividade * 3600) : 0;
            var dvRec = {
                omNum: currentOM.num,
                tipo: desvio,
                tipoCod: dvParts[0] || desvio,
                tipoLabel: dvParts.slice(1).join(' - ') || desvio,
                tagEquipamento: currentOM.tagIdentificacao || currentOM.equipamento || '---',
                localInstalacao: currentOM.local || '',
                descLocal: currentOM.descLocal || '',
                observacao: just || '',
                executantes: executantesNomes.slice(),
                data: new Date().toISOString(),
                mesRef: new Date().toISOString().substring(0, 7),
                tempoSegundos: dvTempoSeg
            };
            if (!currentOM.desviosRegistrados) currentOM.desviosRegistrados = [];
            currentOM.desviosRegistrados.push(dvRec);
            _enviarDesvioSupabase({
                om_num: dvRec.omNum,
                tipo: dvRec.tipo,
                tipo_cod: dvRec.tipoCod,
                tipo_label: dvRec.tipoLabel,
                tag_equipamento: dvRec.tagEquipamento || '',
                local_instalacao: dvRec.localInstalacao || '',
                desc_local: dvRec.descLocal || '',
                observacao: dvRec.observacao || '',
                executantes: dvRec.executantes || [],
                mes_ref: dvRec.mesRef,
                tempo_segundos: dvRec.tempoSegundos || 0,
                registrado_por: deviceId || '',
                origem: 'campo'
            });

            _gravarDashboardLog('CANCELADO', currentOM);
            salvarOMs();
            hideCancelar();
            
            alert('❌ OM CANCELADA\n\nDesvio: ' + desvio + '\n\nAguardando assinatura do cliente ou fiscal.');
            
            showFinalizar();
        }

        $('desvioSelect').addEventListener('change', function() {
            const btn = $('btnConfirmarCancel');
            btn.disabled = !this.value;
        });

        function handleClickPendenteAssinatura(idx) {
            clickCount++;
            
            if(clickTimeout) clearTimeout(clickTimeout);
            
            if(clickCount >= 3) {
                clickCount = 0;
                omPendenteParaAssinar = oms[idx];
                showSenhaFiscal();
            } else {
                clickTimeout = setTimeout(() => {
                    clickCount = 0;
                }, 1000);
            }
        }

        function showSenhaFiscal() {
            $('senhaFiscal').value = '';
            $('popupSenhaFiscal').classList.add('active');
        }

        function hideSenhaFiscal() {
            $('popupSenhaFiscal').classList.remove('active');
            omPendenteParaAssinar = null;
        }

        function verificarSenhaFiscal() {
            var senha = $('senhaFiscal').value;
            if(senha !== SENHA_FISCAL) {
                alert('Senha incorreta!');
                return;
            }
            var targetOM = omPendenteParaAssinar;
            hideSenhaFiscal();
            if(!targetOM) {
                alert('⚠️ Nenhuma OM pendente selecionada.');
                return;
            }
            currentOM = targetOM;
            materiaisUsados = currentOM.materiaisUsados || [];
            isCancelamento = currentOM.cancelada || false;
            if(currentOM.historicoExecucao && currentOM.historicoExecucao.length > 0) {
                var ultimo = currentOM.historicoExecucao[currentOM.historicoExecucao.length - 1];
                executantesNomes = ultimo.executantes || [];
                numExecutantes = executantesNomes.length;
            }
            var lastFiscal = localStorage.getItem('pcm_ultimo_fiscal') || '';
            $('inputNomeFiscal').value = lastFiscal;
            $('popupNomeFiscal').classList.add('active');
            setTimeout(function(){ $('inputNomeFiscal').focus(); }, 200);
        }
        function confirmarNomeFiscal() {
            var nome = $('inputNomeFiscal').value.trim();
            if(!nome) { alert('⚠️ Informe o nome do fiscal.'); return; }
            localStorage.setItem('pcm_ultimo_fiscal', nome);
            currentOM.nomeFiscal = nome;
            $('popupNomeFiscal').classList.remove('active');
            showAssinaturaFiscal();
        }
        function hideNomeFiscal() {
            $('popupNomeFiscal').classList.remove('active');
            omPendenteParaAssinar = null;
        }

        function showAssinaturaFiscal() {
            $('popupFinalizar').classList.add('active');
            
            if(currentOM.historicoExecucao && currentOM.historicoExecucao.length > 0) {
                const ultimoHistorico = currentOM.historicoExecucao[currentOM.historicoExecucao.length - 1];
                
                $('resumoHHAtividade').textContent = (ultimoHistorico.hhAtividade || 0).toFixed(2) + 'h';
                $('resumoNumExec').textContent = ultimoHistorico.executantes.length;
                $('resumoHHPorPessoa').textContent = (ultimoHistorico.hhEquipe || 0).toFixed(2) + 'h';
                $('resumoHHDeslocamento').textContent = (ultimoHistorico.hhDeslocamento || 0).toFixed(2) + 'h';
                $('resumoHHTotal').textContent = (ultimoHistorico.hhTotal || 0).toFixed(2) + 'h';
                
                $('listaExecFinal').innerHTML = ultimoHistorico.executantes.map((n, i) => (i + 1) + '. ' + n).join('<br>');
                
                renderResumoHistorico();
            } else {
                $('resumoHHAtividade').textContent = '0.00h';
                $('resumoNumExec').textContent = '0';
                $('resumoHHPorPessoa').textContent = '0.00h';
                $('resumoHHDeslocamento').textContent = '0.00h';
                $('resumoHHTotal').textContent = '0.00h';
                $('listaExecFinal').innerHTML = '-';
                $('resumoHistorico').innerHTML = '';
            }
            
            const totalMat = materiaisUsados.reduce((sum, m) => sum + m.total, 0);
            const financialBox = $('financialSummary');
            
            if(totalMat > 0) {
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
            
            $('observacoes').value = currentOM.observacoes || '';
            
            setTimeout(function(){ setupSignaturePad(); }, 300);
        }

        async function verPDFOriginal() {
            var viewer = $('pdfOriginalViewer');
            viewer.innerHTML = '<p style="text-align:center;padding:40px;color:#fff;font-size:16px;">⏳ Carregando PDF...</p>';
            $('popupPDFOriginal').classList.add('active');

            var pdfBase64 = await PdfDB.get('orig_' + currentOM.num);
            var pdfData = null;

            if (pdfBase64) {
                // Local IndexedDB
                var byteStr = atob(pdfBase64.split(',').pop());
                var ab = new ArrayBuffer(byteStr.length);
                var ia = new Uint8Array(ab);
                for (var i = 0; i < byteStr.length; i++) ia[i] = byteStr.charCodeAt(i);
                pdfData = ab;
            } else {
                // Tenta Supabase Storage
                try {
                    var token = (window.PCMAuth && window.PCMAuth.getToken()) || SUPABASE_ANON_KEY;
                    var resp = await fetch(SUPABASE_URL + '/storage/v1/object/pcm-files/originais/' + currentOM.num + '.pdf', {
                        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + token }
                    });
                    if (!resp.ok) throw new Error('Não encontrado no servidor');
                    pdfData = await resp.arrayBuffer();
                } catch(e) {
                    viewer.innerHTML = '<p style="text-align:center;color:#ff6b6b;padding:40px;">PDF original não encontrado.<br><small>' + e.message + '</small></p>';
                    return;
                }
            }

            try {
                var pdfDoc = await pdfjsLib.getDocument({data: pdfData}).promise;
                viewer.innerHTML = '';
                var containerW = viewer.clientWidth - 16;
                for(var pg = 1; pg <= pdfDoc.numPages; pg++) {
                    var page = await pdfDoc.getPage(pg);
                    var vpOrig = page.getViewport({scale: 1});
                    var scale = (containerW / vpOrig.width) * 2;
                    var vp = page.getViewport({scale: scale});
                    var cvs = document.createElement('canvas');
                    cvs.width = vp.width;
                    cvs.height = vp.height;
                    cvs.style.width = '100%';
                    cvs.style.height = 'auto';
                    cvs.style.display = 'block';
                    cvs.style.marginBottom = '12px';
                    cvs.style.borderRadius = '4px';
                    cvs.style.boxShadow = '0 2px 12px rgba(0,0,0,0.4)';
                    cvs.style.backgroundColor = '#fff';
                    viewer.appendChild(cvs);
                    await page.render({canvasContext: cvs.getContext('2d'), viewport: vp}).promise;
                }
            } catch(err) {
                viewer.innerHTML = '<p style="text-align:center;color:#ff6b6b;padding:40px;">Erro: ' + err.message + '</p>';
            }
        }

        function fecharPDFOriginal() {
            $('popupPDFOriginal').classList.remove('active');
            $('pdfOriginalViewer').innerHTML = '';
        }

        async function verPDFGerado(omNum) {
            var pdfBase64 = await PdfDB.get('rel_' + omNum);
            if(!pdfBase64) { pdfBase64 = await PdfDB.get('rel_' + omNum.split('_')[0]); }
            if(!pdfBase64) { alert('PDF não encontrado!'); return; }
            var displayNum = omNum.split('_')[0];
            $('popupHistorico').classList.remove('active');
            $('pdfGeradoTitle').textContent = 'OM_' + displayNum + '.pdf';
            var viewer = $('pdfGeradoViewer');
            viewer.innerHTML = '<p style="text-align:center;padding:40px;color:#fff;font-size:16px;">⏳ Carregando PDF...</p>';
            $('popupPDFGerado').classList.add('active');
            await _renderizarPDFNoViewer(viewer, pdfBase64);
        }

        function fecharPDFGerado() {
            $('popupPDFGerado').classList.remove('active');
            $('pdfGeradoViewer').innerHTML = '';
        }

        async function mostrarHistorico() {
            var historico = JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORICO) || '[]');
            var hojeISO = new Date().toISOString().split('T')[0];
            var hojePTBR = new Date().toLocaleDateString('pt-BR');

            function ehHoje(d) {
                if(!d) return false;
                if(d.includes('T')) return d.split('T')[0] === hojeISO;
                return d.includes(hojeISO) || d.includes(hojePTBR);
            }

            var historicoHoje = historico.filter(function(om) {
                if(!om.dataFinalizacao) return false;
                if(om.temDesvio) return false;
                return ehHoje(om.dataFinalizacao);
            });

            var historicoDesvios = historico.filter(function(om) {
                return om.temDesvio && !om.canceladaDefinitivo;
            });

            var allKeys = [];
            try { allKeys = await PdfDB.keys(); } catch(e) { console.warn('[PCM] Falha ao listar PDFs:', e); }
            var lista = $('historicoOMsList');

            if(historicoHoje.length === 0 && historicoDesvios.length === 0) {
                lista.innerHTML = '<p style="text-align:center;color:#999;padding:30px;">Nenhuma OM finalizada hoje</p>';
            } else {
                lista.innerHTML = '';

                var arr = historicoHoje.slice().reverse();
                for(var i = 0; i < arr.length; i++) {
                    var om = arr[i];
                    var sfx = om.execTs ? '_' + om.execTs : '';
                    var temPDF = allKeys.indexOf('rel_' + om.num + sfx) >= 0 || allKeys.indexOf('rel_' + om.num) >= 0;
                    var temCheck = allKeys.indexOf('ck_' + om.num + sfx) >= 0 || allKeys.indexOf('ck_' + om.num) >= 0;
                    var temNCpdf = allKeys.indexOf('nc_' + om.num + sfx) >= 0 || allKeys.indexOf('nc_' + om.num) >= 0;
                    var pdfKey = om.execTs ? om.num + '_' + om.execTs : om.num;
                    var div = document.createElement('div');
                    div.className = 'file-item';
                    div.style.flexDirection = 'column';
                    div.style.alignItems = 'stretch';
                    var dataExibicao = om.dataFinalizacao;
                    try { if(dataExibicao.includes('T')) dataExibicao = new Date(dataExibicao).toLocaleString('pt-BR'); } catch(e){}
                    var iconeStatus = om.tipo === 'CANCELADO' ? '❌' : '✅';
                    var h = '<div class="file-info" style="margin-bottom:' + (temPDF ? '10' : '0') + 'px;">';
                    h += '<div class="file-name">' + iconeStatus + ' OM ' + om.num + '</div>';
                    h += '<div class="file-status">' + (om.titulo || '') + '</div>';
                    h += '<div class="file-status">' + (om.tipo || 'ATENDIDO') + ' — ' + dataExibicao + '</div></div>';
                    if(temPDF) {
                        h += '<button onclick="verPDFGerado(\'' + pdfKey + '\')" style="width:100%;padding:10px 14px;background:linear-gradient(135deg,#1A5276,#154360);color:#fff;border:none;border-radius:8px;font-weight:700;font-size:13px;cursor:pointer;display:flex;align-items:center;gap:8px;justify-content:center;margin-bottom:6px;">📄 Relatório OM_' + om.num + '.pdf</button>';
                    }
                    if(temCheck) {
                        h += '<button onclick="verPDFChecklist(\'' + pdfKey + '\')" style="width:100%;padding:10px 14px;background:linear-gradient(135deg,#333,#555);color:#fff;border:none;border-radius:8px;font-weight:700;font-size:13px;cursor:pointer;display:flex;align-items:center;gap:8px;justify-content:center;margin-bottom:6px;">📋 Checklist OM_' + om.num + '.pdf</button>';
                    }
                    if(temNCpdf) {
                        h += '<button onclick="verPDFNC(\'' + pdfKey + '\')" style="width:100%;padding:10px 14px;background:linear-gradient(135deg,#dc3545,#b02a37);color:#fff;border:none;border-radius:8px;font-weight:700;font-size:13px;cursor:pointer;display:flex;align-items:center;gap:8px;justify-content:center;">⚠️ Não Conformidade OM_' + om.num + '.pdf</button>';
                    }
                    div.innerHTML = h;
                    lista.appendChild(div);
                }

                if(historicoDesvios.length > 0) {
                    var dvSec = document.createElement('div');
                    dvSec.style.cssText = 'font-size:12px;font-weight:800;color:#e53935;text-transform:uppercase;letter-spacing:.5px;margin:16px 0 8px;padding-top:8px;border-top:2px solid #fde8ea;';
                    dvSec.textContent = '⚠️ OMs com Desvio / Reprogramação';
                    lista.appendChild(dvSec);
                    for(var d=0;d<historicoDesvios.length;d++){
                        var dv=historicoDesvios[d];
                        var dvDiv=document.createElement('div');
                        dvDiv.className='file-item';
                        dvDiv.style.cssText='flex-direction:column;align-items:stretch;border-left:4px solid #e53935;';
                        var dvData = dv.dataFinalizacao;
                        try { if(dvData && dvData.includes('T')) dvData = new Date(dvData).toLocaleString('pt-BR'); } catch(e){}
                        var temDevPDF = allKeys.indexOf('dev_'+dv.num)>=0;
                        var tipoLabel = dv.statusDesvio || dv.tipo || 'DESVIO';
                        var dvH='<div class="file-info" style="margin-bottom:8px;">';
                        dvH+='<div class="file-name">⚠️ OM '+dv.num+(dv.reaberta?' 🔄':'')+'</div>';
                        dvH+='<div class="file-status">'+(dv.titulo||'')+'</div>';
                        dvH+='<div class="file-status" style="color:#e53935;font-weight:700;">'+tipoLabel+' — '+dvData+'</div></div>';
                        if(temDevPDF){
                            dvH+='<button onclick="verPDFDesvio(\''+dv.num+'\')" style="width:100%;padding:9px;background:linear-gradient(135deg,#e53935,#b71c1c);color:#fff;border:none;border-radius:8px;font-weight:700;font-size:13px;cursor:pointer;margin-bottom:6px;">📄 Relatório Desvio</button>';
                        }
                        if(!dv.reaberta){
                            dvH+='<button onclick="reabrirOMDesvio(\''+dv.num+'\')" style="width:100%;padding:9px;background:linear-gradient(135deg,#1565c0,#0d47a1);color:#fff;border:none;border-radius:8px;font-weight:700;font-size:13px;cursor:pointer;margin-bottom:6px;">🔄 Reabrir OM</button>';
                        }
                        dvH+='<button onclick="showCancelarOMDesvio(\''+dv.num+'\')" style="width:100%;padding:9px;background:linear-gradient(135deg,#333,#555);color:#fff;border:none;border-radius:8px;font-weight:700;font-size:13px;cursor:pointer;">❌ Cancelar Definitivo</button>';
                        dvDiv.innerHTML=dvH;
                        lista.appendChild(dvDiv);
                    }
                }
            }
            $('popupHistorico').classList.add('active');
        }

        async function verPDFChecklist(omNum) {
            var pdfBase64 = await PdfDB.get('ck_' + omNum);
            if(!pdfBase64) { pdfBase64 = await PdfDB.get('ck_' + omNum.split('_')[0]); }
            if(!pdfBase64) { alert('PDF Checklist não encontrado!'); return; }
            $('popupHistorico').classList.remove('active');
            var viewer = $('pdfGeradoViewer');
            viewer.innerHTML = '<p style="text-align:center;padding:40px;color:#fff;font-size:16px;">⏳ Carregando Checklist...</p>';
            $('popupPDFGerado').classList.add('active');
            await _renderizarPDFNoViewer(viewer, pdfBase64);
        }

        async function verPDFNC(omNum) {
            var pdfBase64 = await PdfDB.get('nc_' + omNum);
            if(!pdfBase64) { pdfBase64 = await PdfDB.get('nc_' + omNum.split('_')[0]); }
            if(!pdfBase64) { alert('PDF Não Conformidade não encontrado!'); return; }
            $('popupHistorico').classList.remove('active');
            var viewer = $('pdfGeradoViewer');
            viewer.innerHTML = '<p style="text-align:center;padding:40px;color:#fff;font-size:16px;">⏳ Carregando NC...</p>';
            $('popupPDFGerado').classList.add('active');
            await _renderizarPDFNoViewer(viewer, pdfBase64);
        }

        function fecharHistorico() {
            $('popupHistorico').classList.remove('active');
        }

        async function resetHistoricoLocal() {
            if(!confirm('⚠️ RESET COMPLETO\n\nIsso vai apagar:\n• Histórico de OMs\n• Desvios acumulados\n• Dashboard log\n• Dados Excel (IW44 + Materiais)\n• Todos os PDFs gerados\n\nContinuar?')) return;
            if(!confirm('🔴 TEM CERTEZA? Esta ação é irreversível!')) return;
            localStorage.removeItem(STORAGE_KEY_HISTORICO);
            localStorage.removeItem(STORAGE_KEY_DESVIOS);
            localStorage.removeItem(STORAGE_KEY_DESVIOS_ACUM);
            localStorage.removeItem(STORAGE_KEY_DASHBOARD);
            localStorage.removeItem('pcm_excel_materiais');
            localStorage.removeItem('pcm_excel_iw44');
            try {
                var keys = await PdfDB.keys();
                for(var i=0;i<keys.length;i++){
                    if(keys[i].match(/^(rel_|ck_|nc_|dev_)/)) await PdfDB.del(keys[i]);
                }
            } catch(e) { console.warn('[PCM] Falha ao limpar PDFs:', e); }
            fecharHistorico();
            alert('✅ Histórico local resetado.');
        }

async function removerOriginalStorage(num){var cli=ensureSupabaseClient();var result=await cli.storage.from("pcm-files").remove([safeStorageOriginalPath(num)]);if(result&&result.error){var msg=String(result.error.message||"Falha ao remover original");if(!/not found|object not found|not exist|não encontrado|404/i.test(msg))throw new Error(msg);}return true;}
async function excluirOmComOriginal(num){var cli=ensureSupabaseClient();var omNum=safeNum(num);await removerOriginalStorage(omNum);var del=await cli.from("oms").delete().eq("num",omNum);if(del&&del.error)throw new Error(del.error.message||"Falha ao excluir OM");}

async function carregarPricelist(){
  try{
    var cli=ensureSupabaseClient();
    var all=[],offset=0,PAGE=1000;
    while(true){
      var{data,error}=await cli.from("pricelist2026").select("*").range(offset,offset+PAGE-1);
      if(error)throw error;
      if(!data||!data.length)break;
      all=all.concat(data);
      if(data.length<PAGE)break;
      offset+=PAGE;
    }
    _adminPricelist=all.map(function(row,idx){
      return{item:String(row["ITEM"]||idx+1),descricao:row["DESCRIÇÃO"]||row["DESCRICAO"]||"",unidade:row["UNIDADE"]||"UN",preco:parseFloat(row["PREÇO REAJUSTADO (R$)"]||0)};
    });
    console.log("Pricelist admin carregada: "+_adminPricelist.length+" itens");
  }catch(e){console.warn("Erro ao carregar pricelist:",e.message);_adminPricelist=[];}
}

async function carregarBMsPeriodo(){
  try{
    var cli=ensureSupabaseClient();
    var{data:matBMs}=await cli.from("bm_materiais").select("bm_numero,bm_data_inicio,bm_data_fim").order("bm_numero",{ascending:false});
    var{data:hhBMs}=await cli.from("bm_hh").select("bm_numero,bm_data_inicio,bm_data_fim").order("bm_numero",{ascending:false});
    var bmMap={};
    (matBMs||[]).concat(hhBMs||[]).forEach(function(r){
      if(r.bm_numero&&!bmMap[r.bm_numero])bmMap[r.bm_numero]={num:r.bm_numero,di:r.bm_data_inicio||"",df:r.bm_data_fim||""};
    });
    var sel=$("filterBM");if(!sel)return;
    var cur=sel.value;
    sel.innerHTML='<option value="">Atual (ao vivo)</option>';
    Object.keys(bmMap).sort(function(a,b){return Number(b)-Number(a);}).forEach(function(k){
      var bm=bmMap[k];
      var label="BM "+bm.num+(bm.di?" ("+bm.di+" a "+bm.df+")":"");
      sel.innerHTML+='<option value="'+bm.num+'"'+(cur===bm.num?" selected":"")+'>'+label+'</option>';
    });
  }catch(e){console.warn("Erro ao carregar BMs:",e);}
}

async function onBMFilterChange(){
  _selectedBM=$("filterBM").value;
  if(typeof clearGlobalFilters==="function")clearGlobalFilters();
  if(!_selectedBM){
    $("bmPeriodoLabel").textContent="Dados ao vivo do Supabase";
    loadDashboard();
    return;
  }
  $("bmPeriodoLabel").textContent="⏳ Carregando BM "+_selectedBM+"...";
  try{
    var cli=ensureSupabaseClient();
    var hhRes=await cli.from("bm_hh").select("*").eq("bm_numero",_selectedBM);
    var matRes=await cli.from("bm_materiais").select("*").eq("bm_numero",_selectedBM);
    if(hhRes.error)throw hhRes.error;
    if(matRes.error)throw matRes.error;
    var hhRows=hhRes.data||[];
    var matRows=matRes.data||[];
    var omMap={};
    hhRows.forEach(function(r){
      if(!omMap[r.om_num]){
        omMap[r.om_num]={
          num:r.om_num,titulo:r.titulo_om||"",cc:r.cc||"",equipe:r.equipe||"",escopo:r.escopo||"geral",
          status:r.status||"finalizada",hh_total:Number(r.hh_total||0),materiais_total:Number(r.materiais_total||0),
          has_relatorio:false,has_checklist:false,has_nc:false,has_fotos:false,primeiro_executante:r.executante||"",
          materiais_usados:[],updated_at:r.created_at||null
        };
      }
    });
    matRows.forEach(function(r){
      if(!omMap[r.om_num]){
        omMap[r.om_num]={
          num:r.om_num,titulo:r.titulo_om||"",cc:r.cc||"",equipe:"",escopo:"geral",status:"finalizada",hh_total:0,materiais_total:0,
          has_relatorio:false,has_checklist:false,has_nc:false,has_fotos:false,primeiro_executante:"",
          materiais_usados:[],updated_at:r.created_at||null
        };
      }
      omMap[r.om_num].materiais_usados.push({
        codigo:r.codigo,nome:r.descricao,descricao:r.descricao,tipo:r.ct2,unidade:r.unidade,qtd:r.qtd,
        precoUnit:r.vl_unitario,preco:r.vl_unitario,total:r.vl_total,bdiPercentual:r.bdi_percentual,bdiValor:r.bdi_valor,cc:r.cc
      });
    });
    var nums=Object.keys(omMap),liveOms=[],liveDesvios=[];
    if(nums.length){
      var liveRes=await cli.from("oms").select("*").in("num",nums);
      if(liveRes.error)throw liveRes.error;
      liveOms=liveRes.data||[];
      var desvRes=await cli.from("desvios").select("*").in("om_num",nums).order("created_at",{ascending:false});
      if(desvRes.error)throw desvRes.error;
      liveDesvios=desvRes.data||[];
    }
    var liveByNum={};liveOms.forEach(function(o){liveByNum[String(o.num)]=o;});
    var omsVirtuais=nums.map(function(num){
      var base=omMap[num],live=liveByNum[String(num)]||{};
      return Object.assign({},live,base,{
        status:live.status||base.status||"finalizada",
        has_relatorio:!!live.has_relatorio,has_checklist:!!live.has_checklist,has_nc:!!live.has_nc,has_fotos:!!live.has_fotos,
        materiais_total:recalcOmMateriaisTotal(base)
      });
    });
    dashboardData.oms=omsVirtuais;
    dashboardData.reports=omsVirtuais.filter(function(o){return(o.status==="finalizada"||o.status==="cancelada")&&o.has_relatorio;});
    dashboardData.desvios=liveDesvios;
    populateEquipeFilter();
    renderAll();
    var bmInfo=hhRows[0]||matRows[0]||null;
    $("bmPeriodoLabel").textContent="BM "+_selectedBM+(bmInfo?" | "+(bmInfo.bm_data_inicio||"")+" a "+(bmInfo.bm_data_fim||""):"")+" | "+omsVirtuais.length+" OMs | "+hhRows.length+" HH | "+matRows.length+" materiais";
  }catch(e){$("bmPeriodoLabel").textContent="Erro: "+e.message;console.error(e);}
}

function buscarMaterialPricelist(termo){
  if(!termo||termo.length<2)return[];
  var t=termo.toLowerCase();
  return _adminPricelist.filter(function(m){
    return(m.descricao&&m.descricao.toLowerCase().indexOf(t)>=0)||(m.item&&m.item.indexOf(t)>=0);
  }).slice(0,10);
}

function selecionarMaterialPricelist(idx,mat){
  _matEditData[idx].codigo=mat.item;
  _matEditData[idx].nome=mat.descricao;
  _matEditData[idx].descricao=mat.descricao;
  _matEditData[idx].unidade=mat.unidade;
  _matEditData[idx].precoUnit=mat.preco;
  _matEditData[idx].preco=mat.preco;
  _matEditData[idx].tipo="Pricelist";
  renderMatEditModal();
}

async function loadDashboard(silent){
  if(_selectedBM){renderAll();return;}
  $("refreshDot").className="refresh-dot loading";$("refreshLabel").textContent="atualizando";
  try{
    const cli=ensureSupabaseClient();
    const[{data:oms,error:omsError},{data:desvios,error:desviosError}]=await Promise.all([
      cli.from("oms").select("*").order("updated_at",{ascending:false}),
      cli.from("desvios").select("*").order("created_at",{ascending:false})
    ]);
    if(omsError)throw omsError;
    if(desviosError)throw desviosError;
    dashboardData.oms=(oms||[]).map(function(o){o.materiais_total=recalcOmMateriaisTotal(o);return o;});
    dashboardData.reports=(oms||[]).filter(function(o){return o.status==="finalizada"||o.status==="cancelada";});
    dashboardData.desvios=desvios||[];
    populateEquipeFilter();
  }catch(e){console.error("Falha ao carregar dashboard:",e);dashboardData={oms:[],reports:[],desvios:[]};}
  $("refreshDot").className="refresh-dot";$("refreshLabel").textContent="ao vivo";
  renderAll();
}

async function carregarConfig(){
  try{
    const{data}=await sb.from("config").select("*");
    if(!data)return;
    var map={};data.forEach(function(r){map[r.chave]=r.valor;});
    if(map.bdi_percentual)$("cfgBdi").value=map.bdi_percentual;
    if(map.bm_numero)$("cfgBmNumero").value=map.bm_numero;
    if(map.bm_data_inicio)$("cfgBmInicio").value=map.bm_data_inicio;
    if(map.bm_data_fim)$("cfgBmFim").value=map.bm_data_fim;
    if(map.tipo_solicitacao)$("cfgTipoSol").value=map.tipo_solicitacao;
    atualizarBmPreview();
  }catch(e){adminToast("Erro ao carregar config: "+e.message,"error");}
}

async function loadBMConfig(){
  try{
    var cli=ensureSupabaseClient();
    var{data}=await cli.from("config").select("*");
    if(!data)return;
    var map={};data.forEach(function(r){map[r.chave]=r.valor;});
    _bmConfig={numero:map.bm_numero||"",di:map.bm_data_inicio||"",df:map.bm_data_fim||""};
  }catch(e){console.warn("loadBMConfig error:",e);}
}

async function salvarConfigBM(){
  var n=$("cfgBmNumero").value.trim();
  if(!n){adminToast("Informe o N° BM","warn");return;}
  try{
    await sb.from("config").upsert({chave:"bm_numero",valor:n,updated_at:new Date().toISOString()});
    await sb.from("config").upsert({chave:"bm_data_inicio",valor:$("cfgBmInicio").value,updated_at:new Date().toISOString()});
    await sb.from("config").upsert({chave:"bm_data_fim",valor:$("cfgBmFim").value,updated_at:new Date().toISOString()});
    adminToast("BM "+n+" salvo","success");
  }catch(e){adminToast("Erro: "+e.message,"error");}
}

async function salvarConfigBDI(){
  var bdi=$("cfgBdi").value.trim(),tipo=$("cfgTipoSol").value.trim();
  if(!bdi||isNaN(parseFloat(bdi))){adminToast("Informe o BDI válido","warn");return;}
  try{
    await sb.from("config").upsert({chave:"bdi_percentual",valor:bdi,updated_at:new Date().toISOString()});
    if(tipo)await sb.from("config").upsert({chave:"tipo_solicitacao",valor:tipo,updated_at:new Date().toISOString()});
    adminToast("BDI "+bdi+"% salvo","success");
  }catch(e){adminToast("Erro: "+e.message,"error");}
}

async function exportarBmExcel(){
  var bmNum=(($("filterBM")&&$("filterBM").value)||$("cfgBmNumero").value||"").trim();
  if(!bmNum){adminToast("Configure ou selecione o N° BM primeiro","warn");return;}
  if(typeof XLSX==="undefined"){adminToast("XLSX lib não carregada","error");return;}
  try{
    var cfgRes=await sb.from("config").select("*");
    if(cfgRes.error)throw cfgRes.error;
    var cfgRows=cfgRes.data||[];
    var cfgMap={};cfgRows.forEach(function(r){cfgMap[r.chave]=r.valor;});
    var configBDI=parseFloat(cfgMap.bdi_percentual||0);
    var configTipoSol=cfgMap.tipo_solicitacao||"Climatização e Refrigeração";
    var bmDi=cfgMap.bm_data_inicio||"",bmDf=cfgMap.bm_data_fim||"";
    var oms=[];
    if(_selectedBM&&String(_selectedBM)===String(bmNum)&&(dashboardData.oms||[]).length){
      oms=JSON.parse(JSON.stringify(dashboardData.oms));
    }else{
      var omsRes=await sb.from("oms").select("*").order("updated_at",{ascending:false});
      if(omsRes.error)throw omsRes.error;
      oms=(omsRes.data||[]).filter(function(om){
        var d=getOmBaseDate(om);
        if(!bmDi&&!bmDf)return true;
        if(!d)return false;
        if(bmDi&&d<new Date(bmDi+"T00:00:00"))return false;
        if(bmDf&&d>new Date(bmDf+"T23:59:59"))return false;
        return true;
      });
    }
    oms=oms.map(function(om){om.materiais_total=recalcOmMateriaisTotal(om);return om;});
    if(!oms.length){adminToast("Nenhuma OM encontrada para o BM informado","warn");return;}
    function fmtTempo(seg){if(!seg||seg<=0)return"00:00:00";var h=Math.floor(seg/3600);var m=Math.floor((seg%3600)/60);var s=Math.floor(seg%60);return String(h).padStart(2,"0")+":"+String(m).padStart(2,"0")+":"+String(s).padStart(2,"0");}
    function fmtDtBR(dt){if(!dt)return"";return dt.toLocaleDateString("pt-BR");}
    function fmtHr(dt){if(!dt)return"";return dt.toLocaleTimeString("pt-BR");}
    function parseHist(om){return getOmHistorico(om);}
    function parseMats(om){return getOmMateriais(om);}
    var _hdrStyle={font:{bold:true,color:{rgb:"FFFFFF"},sz:11,name:"Calibri"},fill:{fgColor:{rgb:"1A5276"}},alignment:{horizontal:"center",vertical:"center",wrapText:true},border:{top:{style:"thin",color:{rgb:"0D3B56"}},bottom:{style:"thin",color:{rgb:"0D3B56"}},left:{style:"thin",color:{rgb:"0D3B56"}},right:{style:"thin",color:{rgb:"0D3B56"}}}};
    var _totStyle={font:{bold:true,color:{rgb:"FFFFFF"},sz:11,name:"Calibri"},fill:{fgColor:{rgb:"2E86C1"}},alignment:{horizontal:"center",vertical:"center"},border:{top:{style:"thin",color:{rgb:"1A5276"}},bottom:{style:"thin",color:{rgb:"1A5276"}},left:{style:"thin",color:{rgb:"1A5276"}},right:{style:"thin",color:{rgb:"1A5276"}}}};
    var _bodyStyle={font:{sz:10,name:"Calibri"},border:{top:{style:"hair",color:{rgb:"CCCCCC"}},bottom:{style:"hair",color:{rgb:"CCCCCC"}},left:{style:"hair",color:{rgb:"CCCCCC"}},right:{style:"hair",color:{rgb:"CCCCCC"}}}};
    var _altStyle={font:{sz:10,name:"Calibri"},fill:{fgColor:{rgb:"F2F7FB"}},border:{top:{style:"hair",color:{rgb:"CCCCCC"}},bottom:{style:"hair",color:{rgb:"CCCCCC"}},left:{style:"hair",color:{rgb:"CCCCCC"}},right:{style:"hair",color:{rgb:"CCCCCC"}}}};
    function _styleSheet(ws,headerCount,rowCount){
      var range=XLSX.utils.decode_range(ws["!ref"]||"A1");
      for(var c=range.s.c;c<=range.e.c;c++){var ref=XLSX.utils.encode_cell({r:0,c:c});if(ws[ref])ws[ref].s=_hdrStyle;}
      for(var r=1;r<=rowCount;r++){for(var c2=range.s.c;c2<=range.e.c;c2++){var ref2=XLSX.utils.encode_cell({r:r,c:c2});if(ws[ref2]){ws[ref2].s=r%2===0?_altStyle:_bodyStyle;}}}
    }
    function _styleTotalRow(ws,row){
      var range=XLSX.utils.decode_range(ws["!ref"]||"A1");
      for(var c=range.s.c;c<=range.e.c;c++){var ref=XLSX.utils.encode_cell({r:row,c:c});if(ws[ref])ws[ref].s=_totStyle;}
    }
    var wb=XLSX.utils.book_new();
    // ABA 1: DESLOCAMENTO
    var deslData=[["OM","Nº Pessoal","Iníc. Exec","Iníc. Exec","Fim Exec","Fim Exec","Tempo","Causa"]];
    var totalDeslSeg=0,pessoalN=0;
    oms.forEach(function(om){
      var hist=parseHist(om);
      hist.forEach(function(hx){
        var execs=Array.isArray(hx.executantes)?hx.executantes:[];
        var numExec=execs.length||1;
        var deslSeg=(hx.deslocamentoSegundos!==undefined)?hx.deslocamentoSegundos:((hx.deslocamentoMinutos||0)*60);
        var dIni=hx.deslocamentoHoraInicio?new Date(hx.deslocamentoHoraInicio):null;
        var dFim=hx.deslocamentoHoraFim?new Date(hx.deslocamentoHoraFim):null;
        for(var e=0;e<numExec;e++){
          pessoalN++;totalDeslSeg+=deslSeg;
          deslData.push([om.num||"",pessoalN,dIni?fmtDtBR(dIni):"",dIni?fmtHr(dIni):"",dFim?fmtDtBR(dFim):"",dFim?fmtHr(dFim):"",fmtTempo(deslSeg),"002"]);
        }
      });
    });
    deslData.push([]);
    deslData.push(["","","","","","",fmtTempo(totalDeslSeg),""]);
    var wsDesl=XLSX.utils.aoa_to_sheet(deslData);
    wsDesl["!cols"]=[{wch:16},{wch:12},{wch:14},{wch:12},{wch:14},{wch:12},{wch:14},{wch:10}];
    wsDesl["!autofilter"]={ref:"A1:H1"};
    _styleSheet(wsDesl,8,pessoalN);
    if(pessoalN>0)_styleTotalRow(wsDesl,pessoalN+2);
    XLSX.utils.book_append_sheet(wb,wsDesl,"Deslocamento");
    // ABA 2: ATIVIDADE
    var ativData=[["OM","Nº Pessoal","Iníc. Exec","Iníc. Exec","Fim Exec","Fim Exec","Tempo"]];
    var totalAtivSeg=0,pessoalNA=0;
    oms.forEach(function(om){
      var hist=parseHist(om);
      hist.forEach(function(hx){
        var execs=Array.isArray(hx.executantes)?hx.executantes:[];
        var numExec=execs.length||1;
        var aIni=hx.dataInicio?new Date(hx.dataInicio):null;
        var aFim=hx.dataFim?new Date(hx.dataFim):null;
        var ativSeg=0;
        if(aIni&&aFim&&!hx.desvio)ativSeg=Math.floor((aFim-aIni)/1000)-(hx.tempoPausadoTotal||0);
        for(var e=0;e<numExec;e++){
          pessoalNA++;totalAtivSeg+=ativSeg;
          ativData.push([om.num||"",pessoalNA,aIni?fmtDtBR(aIni):"",aIni?fmtHr(aIni):"",aFim?fmtDtBR(aFim):"",aFim?fmtHr(aFim):"",fmtTempo(ativSeg)]);
        }
      });
    });
    ativData.push([]);
    ativData.push(["","","","","","",fmtTempo(totalAtivSeg)]);
    var wsAtiv=XLSX.utils.aoa_to_sheet(ativData);
    wsAtiv["!cols"]=[{wch:16},{wch:12},{wch:14},{wch:12},{wch:14},{wch:12},{wch:14}];
    wsAtiv["!autofilter"]={ref:"A1:G1"};
    _styleSheet(wsAtiv,7,pessoalNA);
    if(pessoalNA>0)_styleTotalRow(wsAtiv,pessoalNA+2);
    XLSX.utils.book_append_sheet(wb,wsAtiv,"Atividade");
    // ABA 3: MATERIAIS
    var bdiLabel="BDI "+configBDI.toFixed(4)+"%";
    var matData=[["OM","Descrição OM","Tipo de Solicitação","Código","Ct2","Descrição Material","Um","Qtd","VL. Unit.",bdiLabel,"VL. Total"]];
    var totalMat=0,matCount=0;
    var bmMatRows=[];
    oms.forEach(function(om){
      var mats=parseMats(om);
      mats.forEach(function(m){
        var qtd=parseFloat(m.qtd||m.quantidade||0);
        var vUnit=parseFloat(m.precoUnit||m.preco||m.valor_unitario||0);
        var bdiP=parseFloat(m.bdiPercentual||0);
        var bdiV=vUnit*(bdiP/100);
        var vlTotal=getMaterialTotal(m);
        if(!vlTotal)vlTotal=qtd*(vUnit+bdiV);
        totalMat+=vlTotal;matCount++;
        matData.push([om.num||"",om.titulo||"",configTipoSol,m.codigo||"",m.tipo||"Pricelist",m.nome||m.descricao||"",m.unidade||"UN",qtd,vUnit>0?vUnit:0,bdiV>0?bdiV:0,vlTotal>0?vlTotal:0]);
        bmMatRows.push({bm_numero:bmNum,bm_data_inicio:bmDi,bm_data_fim:bmDf,om_num:om.num||"",titulo_om:om.titulo||"",tipo_solicitacao:configTipoSol,codigo:m.codigo||"",ct2:m.tipo||"Pricelist",descricao:m.nome||m.descricao||"",unidade:m.unidade||"UN",qtd:qtd,vl_unitario:vUnit,bdi_percentual:bdiP,bdi_valor:bdiV,vl_total:vlTotal,cc:m.cc||om.cc||""});
      });
    });
    matData.push([]);
    matData.push(["","","","","","","","","","TOTAL GERAL",totalMat]);
    var wsMat=XLSX.utils.aoa_to_sheet(matData);
    wsMat["!cols"]=[{wch:16},{wch:28},{wch:22},{wch:10},{wch:14},{wch:34},{wch:8},{wch:6},{wch:14},{wch:14},{wch:16}];
    wsMat["!autofilter"]={ref:"A1:K1"};
    for(var mi=1;mi<=matCount;mi++){["H","I","J","K"].forEach(function(c){var ref=c+(mi+1);if(wsMat[ref]&&typeof wsMat[ref].v==="number"){wsMat[ref].t="n";if(c==="H")wsMat[ref].z="0";else wsMat[ref].z="#,##0.00";}});}
    if(matCount>0){var totRef="K"+(matCount+3);if(wsMat[totRef]){wsMat[totRef].t="n";wsMat[totRef].z="#,##0.00";}}
    _styleSheet(wsMat,11,matCount);
    if(matCount>0)_styleTotalRow(wsMat,matCount+2);
    XLSX.utils.book_append_sheet(wb,wsMat,"Materiais");
    if(pessoalN===0&&pessoalNA===0&&matCount===0){
      console.warn("[BM_EXPORT] Arquivo sem linhas de dados. Verifique se as OMs possuem historico_execucao/materiais_usados (snake_case) ou historicoExecucao/materiaisUsados (camelCase).");
      adminToast("Exportado sem linhas (somente cabeçalho). Verifique dados de histórico/materiais das OMs.","warn",4500);
    }
    // SALVAR bm_materiais NO BANCO
    if(bmMatRows.length){
      try{
        await sb.from("bm_materiais").delete().eq("bm_numero",bmNum);
        var chunks=[];for(var ci=0;ci<bmMatRows.length;ci+=50)chunks.push(bmMatRows.slice(ci,ci+50));
        for(var ch=0;ch<chunks.length;ch++){var ins=await sb.from("bm_materiais").insert(chunks[ch]);if(ins.error)console.error("bm_materiais insert error:",ins.error);}
      }catch(e){console.error("Erro bm_materiais:",e);}
    }
    // SALVAR bm_hh NO BANCO
    var bmHHRows=[];
    oms.forEach(function(om){
      var hist=parseHist(om);
      var pN=0;
      hist.forEach(function(hx){
        var execs=Array.isArray(hx.executantes)?hx.executantes:[];var numExec=execs.length||1;
        var deslSeg=(hx.deslocamentoSegundos!==undefined)?hx.deslocamentoSegundos:((hx.deslocamentoMinutos||0)*60);
        var dIni=hx.deslocamentoHoraInicio?new Date(hx.deslocamentoHoraInicio):null;
        var dFim=hx.deslocamentoHoraFim?new Date(hx.deslocamentoHoraFim):null;
        var aIni=hx.dataInicio?new Date(hx.dataInicio):null;
        var aFim=hx.dataFim?new Date(hx.dataFim):null;
        var ativSeg=0;if(aIni&&aFim&&!hx.desvio)ativSeg=Math.floor((aFim-aIni)/1000)-(hx.tempoPausadoTotal||0);
        for(var e=0;e<numExec;e++){
          pN++;
          var execNome=execs[e]||"";
          bmHHRows.push({bm_numero:bmNum,bm_data_inicio:bmDi,bm_data_fim:bmDf,om_num:om.num||"",titulo_om:om.titulo||"",cc:om.cc||"",equipe:om.equipe||"",escopo:om.escopo||"geral",executante:execNome,pessoal_n:pN,tipo:"deslocamento",data_exec:dIni?fmtDtBR(dIni):"",hora_inicio:dIni?fmtHr(dIni):"",hora_fim:dFim?fmtHr(dFim):"",tempo_seg:deslSeg,tempo_fmt:fmtTempo(deslSeg),causa:hx.tag==="OFICINA"?"OFICINA":"002",tag:hx.tag||"",status:om.status||"",hh_total:Number(om.hh_total||0),materiais_total:Number(om.materiais_total||0)});
          bmHHRows.push({bm_numero:bmNum,bm_data_inicio:bmDi,bm_data_fim:bmDf,om_num:om.num||"",titulo_om:om.titulo||"",cc:om.cc||"",equipe:om.equipe||"",escopo:om.escopo||"geral",executante:execNome,pessoal_n:pN,tipo:"atividade",data_exec:aIni?fmtDtBR(aIni):"",hora_inicio:aIni?fmtHr(aIni):"",hora_fim:aFim?fmtHr(aFim):"",tempo_seg:ativSeg,tempo_fmt:fmtTempo(ativSeg),causa:"",tag:hx.tag||"",status:om.status||"",hh_total:Number(om.hh_total||0),materiais_total:Number(om.materiais_total||0)});
        }
      });
    });
    if(bmHHRows.length){
      try{
        await sb.from("bm_hh").delete().eq("bm_numero",bmNum);
        var hChunks=[];for(var hi=0;hi<bmHHRows.length;hi+=50)hChunks.push(bmHHRows.slice(hi,hi+50));
        for(var hc=0;hc<hChunks.length;hc++){var hIns=await sb.from("bm_hh").insert(hChunks[hc]);if(hIns.error)console.error("bm_hh insert error:",hIns.error);}
      }catch(e){console.error("Erro bm_hh:",e);}
    }
    adminToast("BM "+bmNum+" — "+bmHHRows.length+" HH + "+bmMatRows.length+" materiais salvos no banco","success",3000);
    var filename="BM_"+bmNum+"_"+new Date().toISOString().slice(0,10)+".xlsx";
    var wbOut=XLSX.write(wb,{bookType:"xlsx",type:"array"});
    forceDownloadBlob(new Blob([wbOut],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}),filename);
    adminToast("BM "+bmNum+" — Desloc: "+pessoalN+" | Ativ: "+pessoalNA+" | Mat: "+matCount+" — Excel gerado","success",5000);
  }catch(e){adminToast("Erro: "+e.message,"error");}
}

async function limparTodosPDFs(){
  var msg=$("limpezaMsg");
  if(!confirm("⚠️ ATENÇÃO\n\nIsso apagará TODOS os PDFs do Storage (originais, relatórios, NCs e desvios).\n\nOs dados de HH, materiais e deslocamento permanecem no banco.\n\nEssa ação não pode ser desfeita. Confirma?"))return;
  msg.style.display="block";msg.style.background="#eaf0fb";msg.style.color="#1A5276";
  msg.textContent="⏳ Listando arquivos...";
  try{
    var total=0,deletados=0;
    for(var pasta of["originais","reports","desvios"]){
      var offset=0,PAGE=1000;
      while(true){
        var{data:lista,error:errList}=await sb.storage.from("pcm-files").list(pasta,{limit:PAGE,offset:offset});
        if(errList||!lista||!lista.length)break;
        var paths=lista.map(function(f){return pasta+"/"+f.name;});
        total+=paths.length;
        msg.textContent="⏳ Deletando "+pasta+"/ ("+total+" arquivos até agora)...";
        var{error}=await sb.storage.from("pcm-files").remove(paths);
        if(!error)deletados+=paths.length;
        if(lista.length<PAGE)break;
        offset+=PAGE;
      }
    }
    msg.textContent="⏳ Resetando flags de relatório nas OMs...";
    var{error:updErr}=await sb.from("oms").update({has_relatorio:false,has_checklist:false,has_nc:false,has_fotos:false}).neq("status","placeholder_never");
    if(updErr)console.warn("Erro ao resetar flags:",updErr);
    msg.style.background="#eafaf1";msg.style.color="#1e8449";
    msg.textContent="✅ "+deletados+" de "+total+" PDFs deletados + flags resetadas. Banco intacto.";
    loadDashboard();
  }catch(e){msg.style.background="#fde8ea";msg.style.color="#c0392b";msg.textContent="Erro: "+e.message;}
}

async function handleUploadFiles(files){
  var cli=ensureSupabaseClient();
  var escopoSel=(($("uploadEscopo")||{}).value||"").trim();
  var modoUpload=(($("uploadModo")||{}).value||"novo").trim();
  if(!escopoSel||escopoSel==="geral"){
    adminToast("Selecione um escopo obrigatório antes do upload (não é permitido Geral).","error",5000);
    return;
  }
  var zone=$("uploadZone");
  if(zone)zone.innerHTML='<div class="spinner"></div><small style="margin-top:4px;display:block">Enviando '+files.length+' arquivo(s)…</small>';
  
  var ok=0,fail=0,ignorados=[];
  for(var i=0;i<files.length;i++){
    var num=await extrairNumOM(files[i]);
    if(!num){ignorados.push(files[i].name);continue;}
    var existsRes=await cli.from("oms").select("num,status,motivo_reprogramacao").eq("num",num).maybeSingle();
    if(existsRes.error){fail++;adminToast("Erro ao consultar OM "+num+": "+existsRes.error.message,"error");continue;}

    if(modoUpload==="reprogramar"){
      if(!existsRes.data){
        fail++;
        adminToast("OM "+num+" não existe para reprogramação — upload recusado","warn",5000);
        continue;
      }
      if(existsRes.data.status!=="reprogramada" && !existsRes.data.motivo_reprogramacao){
        fail++;
        adminToast("OM "+num+" não está reprogramada (status: "+existsRes.data.status+")","warn",5000);
        continue;
      }
      var pathReprog="originais/"+num+".pdf";
      var uploadResReprog=await cli.storage.from("pcm-files").upload(pathReprog,files[i],{upsert:true});
      if(uploadResReprog.error){fail++;adminToast("Erro OM "+num+": "+uploadResReprog.error.message,"error");continue;}

      var agoraISO=new Date().toISOString();
      var updReprog={
        status:"enviada",
        estado_fluxo:"preliminar",
        escopo:escopoSel,
        motivo_reprogramacao:null,
        lock_device_id:null,
        admin_unlock:false,
        cancelada:false,
        finalizada:false,
        pendente_assinatura:false,
        cliente_assinou:false,
        fiscal_assinou:false,
        status_oficina:null,
        etapa_oficina:null,
        oficina_pausada:false,
        oficina_troca_turno:false,
        data_inicio_oficina:null,
        data_fim_oficina:null,
        updated_at:agoraISO
      };
      var updRes=await cli.from("oms").update(updReprog).eq("num",num);
      if(updRes.error && /column .* does not exist/i.test(String(updRes.error.message||""))){
        var updMin={
          status:"enviada",
          estado_fluxo:"preliminar",
          escopo:escopoSel,
          motivo_reprogramacao:null,
          lock_device_id:null,
          admin_unlock:false,
          cancelada:false,
          finalizada:false,
          pendente_assinatura:false,
          cliente_assinou:false,
          fiscal_assinou:false,
          updated_at:agoraISO
        };
        updRes=await cli.from("oms").update(updMin).eq("num",num);
      }
      if(updRes.error){
        fail++;
        adminToast("Erro ao reprogramar OM "+num+": "+updRes.error.message,"error");
      }else{
        ok++;
        adminToast("OM "+num+" reprogramada e reenviada ✓","success");
      }
      continue;
    }

    if(existsRes.data){adminToast("OM "+num+" já existe (status: "+existsRes.data.status+") — upload recusado","warn",5000);fail++;continue;}
    var path="originais/"+num+".pdf";
    var uploadRes=await cli.storage.from("pcm-files").upload(path,files[i],{upsert:true});
    if(uploadRes.error){fail++;adminToast("Erro OM "+num+": "+uploadRes.error.message,"error");continue;}
    var insertRes=await cli.from("oms").insert({num:num,titulo:"OM "+num,status:"enviada",estado_fluxo:"preliminar",escopo:escopoSel,cancelada:false,finalizada:false,pendente_assinatura:false,admin_unlock:false,admin_validou_material:false,admin_modificou_material:false,cliente_assinou:false,fiscal_assinou:false,has_checklist:false,has_nc:false,has_relatorio:false});
    if(insertRes.error){fail++;try{await cli.storage.from("pcm-files").remove([path]);}catch(_e){console.warn('[ADMIN] Cleanup storage falhou:', _e);}adminToast("Erro DB OM "+num+": "+insertRes.error.message,"error");}
    else{ok++;adminToast("OM "+num+" enviada ✓","success");}
  }
  if(zone)zone.innerHTML='<div class="upload-icon">📁</div><small>Arraste PDFs aqui ou clique para selecionar</small>';
  if(fail>0)adminToast(fail+" arquivo(s) recusado(s)/com erro","error");
  if(ignorados.length)adminToast("Cancelados: "+ignorados.join(", "),"error");
  
  loadDashboard();
}

function viewPDF(num){closeOmModal();return verPDFOficina("OM",num);}

function closePdfViewer(){$("pdfOverlay").classList.remove("show");document.body.style.overflow="";$("pdfViewer").innerHTML="";lastPdfBlob=null;}


async function downloadAllPDFs(num,hasCK,hasNC,hasRelatorio){
  if(!hasRelatorio){
    adminToast("PDF não disponível — relatório não foi sincronizado para o servidor","warn",5000);
    return;
  }
  var prefixes=["OM"];
  if(hasCK)prefixes.push("CK");
  if(hasNC)prefixes.push("NC");
  adminToast("Baixando "+prefixes.length+" PDF(s)…","info");
  var baixados=0;
  for(var i=0;i<prefixes.length;i++){
    var p=prefixes[i];
    var path="reports/"+p+"_"+num+".pdf";
    try{
      var{data,error}=await sb.storage.from("pcm-files").createSignedUrl(path,120);
      if(error||!data||!data.signedUrl)continue;
      var resp=await fetch(data.signedUrl);
      if(!resp.ok)continue;
      forceDownloadBlob(await resp.blob(),p+"_"+num+".pdf");
      baixados++;
      if(i<prefixes.length-1)await new Promise(function(r){setTimeout(r,500);});
    }catch(e){ console.warn('[ADMIN] Falha ao baixar arquivo:', e); }
  }
  if(baixados>0)adminToast(baixados+" PDF(s) baixados","success");
  else adminToast("Nenhum PDF encontrado no servidor para esta OM","warn",5000);
}

async function _mergePDFsToBlob(blobs){
  var jsPDF=window.jspdf&&window.jspdf.jsPDF;
  if(!jsPDF||!blobs.length)return null;
  var doc=new jsPDF({orientation:"p",unit:"mm",format:"a4",compress:true});
  var firstPage=true;
  for(var bi=0;bi<blobs.length;bi++){
    var ab=await blobs[bi].arrayBuffer();
    var pdfDoc=await pdfjsLib.getDocument({data:ab}).promise;
    for(var pg=1;pg<=pdfDoc.numPages;pg++){
      var page=await pdfDoc.getPage(pg);
      var vp1=page.getViewport({scale:1});
      var scale=Math.min(1.5,1400/vp1.width);
      var vp=page.getViewport({scale:scale});
      var cvs=document.createElement("canvas");
      cvs.width=Math.floor(vp.width);cvs.height=Math.floor(vp.height);
      await page.render({canvasContext:cvs.getContext("2d"),viewport:vp}).promise;
      var imgData=cvs.toDataURL("image/jpeg",0.82);
      var pW=210,pH=Math.round(cvs.height*(210/cvs.width));
      if(!firstPage)doc.addPage("a4","p");
      doc.addImage(imgData,"JPEG",0,0,pW,pH,undefined,"FAST");
      firstPage=false;
    }
  }
  return firstPage?null:doc.output("blob");
}

async function baixarZip(){
  var btn=$("btnZip");btn.disabled=true;btn.textContent="Gerando ZIP…";
  var reports=dashboardData.reports;
  if(!reports.length){adminToast("Nenhum relatório disponível","warn");btn.disabled=false;btn.textContent="⬇ Baixar Todos (.zip)";return;}
  if(typeof pdfjsLib==="undefined"||!window.jspdf){adminToast("Bibliotecas PDF não carregadas","error");btn.disabled=false;btn.textContent="⬇ Baixar Todos (.zip)";return;}
  try{
    var zip=new JSZip();var folder=zip.folder("Relatorios_OMs");
    var semPdf=0,adicionados=0;
    var comPdf=reports.filter(function(r){return r.has_relatorio;}).length;
    var processados=0;
    for(var i=0;i<reports.length;i++){
      var r=reports[i];
      if(!r.has_relatorio){semPdf++;continue;}
      processados++;
      btn.textContent="Mesclando "+processados+"/"+comPdf+" (OM "+r.num+")…";
      var prefixes=["OM"];
      if(r.has_checklist)prefixes.push("CK");
      if(r.has_nc)prefixes.push("NC");
      var blobs=[];
      for(var pi=0;pi<prefixes.length;pi++){
        try{
          var{data,error}=await sb.storage.from("pcm-files").createSignedUrl("reports/"+prefixes[pi]+"_"+r.num+".pdf",120);
          if(error||!data||!data.signedUrl)continue;
          var resp=await fetch(data.signedUrl);if(!resp.ok)continue;
          blobs.push(await resp.blob());
        }catch(e){console.warn("[ZIP] falha ao buscar "+prefixes[pi]+"_"+r.num,e);}
      }
      if(!blobs.length)continue;
      var merged=await _mergePDFsToBlob(blobs);
      if(merged){folder.file("OM_"+r.num+"_completo.pdf",merged);adicionados++;}
    }
    if(semPdf>0)adminToast(semPdf+" OM(s) sem PDF no servidor foram ignoradas","warn",4000);
    if(!adicionados){adminToast("Nenhum PDF disponível para baixar","warn");btn.disabled=false;btn.textContent="⬇ Baixar Todos (.zip)";return;}
    btn.textContent="Compactando…";
    forceDownloadBlob(await zip.generateAsync({type:"blob",compression:"DEFLATE",compressionOptions:{level:6}}),"Relatorios_OMs.zip");
  }catch(e){adminToast("Erro ao gerar ZIP: "+e.message,"error");console.error(e);}
  btn.disabled=false;btn.textContent="⬇ Baixar Todos (.zip)";
}

async function deleteOM(num){
  var omNum=safeNum(num);
  if(!confirm("Excluir OM "+omNum+" permanentemente?\n\nEsta ação não pode ser desfeita."))return;
  try{await excluirOmComOriginal(omNum);adminToast("OM "+omNum+" excluída","success");closeOmModal();loadDashboard();}
  catch(e){adminToast("Erro: "+e.message,"error");}
}

async function verPDFOficina(tipo,num){
  var prefixo=tipo==="OM"?"OM":tipo;
  var path="reports/"+prefixo+"_"+num+".pdf";
  var titulo=prefixo+"_"+num+".pdf";
  $("pdfViewerTitle").textContent=titulo;
  $("pdfDlBtn").onclick=function(){if(lastPdfBlob)forceDownloadBlob(lastPdfBlob,titulo);};
  var viewer=$("pdfViewer");
  viewer.innerHTML='<div class="pdf-loading">⏳ Carregando '+prefixo+'...</div>';
  $("pdfOverlay").classList.add("show");document.body.style.overflow="hidden";
  try{
    var{data,error}=await sb.storage.from("pcm-files").createSignedUrl(path,120);
    if(error||!data||!data.signedUrl){viewer.innerHTML='<div class="pdf-loading">PDF '+prefixo+' não disponível.</div>';return;}
    var resp=await fetch(data.signedUrl);
    if(!resp.ok){viewer.innerHTML='<div class="pdf-loading">❌ PDF não disponível.</div>';return;}
    var blob=await resp.blob();lastPdfBlob=blob;
    var pdf=await pdfjsLib.getDocument({data:await blob.arrayBuffer()}).promise;
    viewer.innerHTML="";
    var W=Math.max(320,viewer.clientWidth-40);
    for(var pg=1;pg<=pdf.numPages;pg++){
      var page=await pdf.getPage(pg);var vp1=page.getViewport({scale:1});
      var vp=page.getViewport({scale:(W/vp1.width)*2});
      var cvs=document.createElement("canvas");cvs.width=vp.width;cvs.height=vp.height;
      cvs.style.cssText="width:100%;max-width:"+W+"px;height:auto";
      viewer.appendChild(cvs);
      await page.render({canvasContext:cvs.getContext("2d"),viewport:vp}).promise;
    }
  }catch(e){viewer.innerHTML='<div class="pdf-loading">❌ '+e.message+'</div>';}
}

async function confirmarHabilitarDispositivo(){
  if(!_hdOmNum)return;
  var mesmaEquipe=$("hdMesmaEquipe").checked,novoExec=$("hdNovoExec").value.trim();
  if(!mesmaEquipe&&!novoExec){adminToast("Informe o nome do novo responsável","warn");return;}
  var btn=$("hdBtnConfirmar");btn.disabled=true;btn.textContent="Aguarde…";
  var agora=new Date().toISOString();
  var tempoMin=_hdFalhaInicio?Math.max(0,Math.floor((Date.now()-new Date(_hdFalhaInicio).getTime())/60000)):0;
  try{
    await sb.from("desvios").insert({om_num:_hdOmNum,tipo:"DISPOSITIVO EM FALHA",descricao:"Aparelho falhou. Tempo parado: "+tempoMin+" min.",equipe_mantida:mesmaEquipe,novo_responsavel:mesmaEquipe?null:novoExec,falha_inicio:_hdFalhaInicio,falha_fim:agora,tempo_parado_min:tempoMin,habilitado_por:currentUser,created_at:agora});
    var upd={admin_unlock:true,admin_unlock_ts:agora,lock_device_id:null,updated_at:agora};
    if(!mesmaEquipe&&novoExec)upd.operador=novoExec;
    var{error}=await sb.from("oms").update(upd).eq("num",_hdOmNum);
    if(error)throw new Error(error.message);
    adminToast("Dispositivo habilitado — "+tempoMin+" min registrados","success",5000);
    hideHabilitarDispositivo();loadDashboard();
  }catch(e){adminToast("Erro: "+e.message,"error");}
  btn.disabled=false;btn.textContent="Habilitar";
}

async function salvarMateriaisAdmin(){
  if(!matEditOM)return;
  var btn=document.getElementById("btnSalvarMat");btn.disabled=true;btn.textContent="Salvando…";
  try{
    var normalized=_matEditData.map(function(m){
      var qtd=parseFloat(m.qtd||m.quantidade||1);
      var precoUnit=parseFloat(m.precoUnit||m.preco||m.valor_unitario||0);
      var bdiP=parseFloat(m.bdiPercentual||0);
      var bdiV=precoUnit*(bdiP/100);
      return{nome:m.nome||m.descricao||"",descricao:m.nome||m.descricao||"",codigo:m.codigo||"",qtd:qtd,quantidade:qtd,unidade:m.unidade||"UN",precoUnit:precoUnit,preco:precoUnit,valor_unitario:precoUnit,bdiPercentual:bdiP,bdiValor:bdiV,total:qtd*(precoUnit+bdiV),tipo:m.tipo||"Pricelist",cc:m.cc||""};
    });
    var total=normalized.reduce(function(acc,m){return acc+m.total;},0);
    var totalAnterior=_matEditOriginal.reduce(function(acc,m){return acc+parseFloat(m.total||0);},0);
    var{error}=await sb.from("oms").update({materiais_usados:normalized,materiais_total:total,admin_modificou_material:true,admin_validou_material:true,estado_fluxo:"alterada_admin",updated_at:new Date().toISOString()}).eq("num",matEditOM);
    if(error)throw error;
    await sb.from("desvios").insert({om_num:matEditOM,tipo:"MATERIAL ALTERADO ADMIN",descricao:"Materiais editados pelo admin. Antes: "+_matEditOriginal.length+" itens (R$ "+totalAnterior.toFixed(2)+") → Depois: "+normalized.length+" itens (R$ "+total.toFixed(2)+")",registrado_por:currentUser||"admin",created_at:new Date().toISOString()}).then(function(){}).catch(function(){});
    adminToast("Materiais da OM "+matEditOM+" atualizados — log registrado","success");
    document.getElementById("matEditModal").style.display="none";
    matEditOM=null;
    loadFluxo();
  }catch(e){adminToast("Erro: "+e.message,"error");}
  btn.disabled=false;btn.textContent="Salvar Alterações";
}

async function loadFluxo(){
  try{
    var{data:oms,error}=await sb.from("oms").select("*").eq("cancelada",false);
    if(error)throw error;
    var all=oms||[];
    fluxoData.b1=all.filter(function(o){var mat=Array.isArray(o.materiais_usados)?o.materiais_usados:[];return mat.length>0&&!o.admin_validou_material&&!o.cancelada&&(o.status==="pendente_assinatura"||o.status==="finalizada");});
    fluxoData.b2=all.filter(function(o){return o.admin_modificou_material&&o.estado_fluxo==="alterada_admin"&&!o.cancelada;});
    fluxoData.b3=all.filter(function(o){return o.estado_fluxo==="devolvida_admin";});
    fluxoData.b4=all.filter(function(o){return(o.status==="pendente_assinatura"||o.status==="finalizada")&&!o.cliente_assinou&&!o.cancelada&&!o.fiscal_assinou;});
    fluxoData.b5=all.filter(function(o){return o.status==="em_oficina"||o.estado_fluxo==="em_oficina";});
    fluxoData.b6=all.filter(function(o){return o.status==="reprogramada";});
    ["1","2","3","4","5","6"].forEach(function(n){document.getElementById("fkpi"+n).textContent=fluxoData["b"+n].length;document.getElementById("b"+n+"count").textContent=fluxoData["b"+n].length+" ordens";});
    renderFluxoBlock("fluxoB1",fluxoData.b1,"b1");
    renderFluxoBlock("fluxoB2",fluxoData.b2,"b2");
    renderFluxoBlock("fluxoB3",fluxoData.b3,"b3");
    renderFluxoBlock("fluxoB4",fluxoData.b4,"b4");
    renderFluxoBlockOficina("fluxoB5",fluxoData.b5);
    renderFluxoBlockReprogramadas("fluxoB6",fluxoData.b6);
  }catch(e){adminToast("Erro ao carregar fluxo: "+e.message,"error");}
}

async function validarMaterial(num){
  if(!confirm("Confirmar validação do material da OM "+num+"?"))return;
  try{
    var om=fluxoData.b1.find(function(o){return o.num===num;});
    var upd={admin_validou_material:true,updated_at:new Date().toISOString()};
    upd.estado_fluxo=(om&&om.cliente_assinou)?"arquivada":"pendente_fiscal";
    var{error}=await sb.from("oms").update(upd).eq("num",num);
    if(error)throw error;
    adminToast("OM "+num+" validada"+(upd.estado_fluxo==="arquivada"?" e arquivada":" → enviada ao fiscal"),"success");
    loadFluxo();
  }catch(e){adminToast("Erro: "+e.message,"error");}
}

async function enviarParaFiscalSingle(num,reenvio){
  try{var{error}=await sb.from("oms").update({estado_fluxo:"pendente_fiscal",updated_at:new Date().toISOString()}).eq("num",num);if(error)throw error;adminToast("OM "+num+(reenvio?" reenviada":" enviada")+" ao fiscal","success");loadFluxo();}
  catch(e){adminToast("Erro: "+e.message,"error");}
}

function reenviarParaFiscal(num){return enviarParaFiscalSingle(num,true);}

async function enviarLoteFiscal(){
  var nums=Object.keys(b4Selected);
  if(!nums.length){adminToast("Nenhuma OM selecionada no Bloco 4","warn");return;}
  if(!confirm("Enviar "+nums.length+" OM(s) ao fiscal?"))return;
  try{var{error}=await sb.from("oms").update({estado_fluxo:"pendente_fiscal",updated_at:new Date().toISOString()}).in("num",nums);if(error)throw error;b4Selected={};adminToast(nums.length+" OM(s) enviadas ao fiscal","success");loadFluxo();}
  catch(e){adminToast("Erro: "+e.message,"error");}
}

async function liberarReprogramada(num){
  if(!confirm("Liberar OM "+num+" para nova tentativa?\n\nEla voltará para o mecânico."))return;
  try{
    var{error}=await sb.from("oms").update({status:"enviada",estado_fluxo:"preliminar",motivo_reprogramacao:null,lock_device_id:null,admin_unlock:false,updated_at:new Date().toISOString()}).eq("num",num);
    if(error)throw error;
    adminToast("OM "+num+" liberada para nova tentativa","success");
    loadFluxo();loadDashboard(true);
  }catch(e){adminToast("Erro: "+e.message,"error");}
}

async function excluirReprogramada(num){
  var omNum=safeNum(num);
  if(!confirm("Excluir OM "+omNum+" permanentemente?\n\nEla sumirá do painel do mecânico."))return;
  try{await excluirOmComOriginal(omNum);adminToast("OM "+omNum+" excluída","success");loadFluxo();loadDashboard(true);}
  catch(e){adminToast("Erro: "+e.message,"error");}
}

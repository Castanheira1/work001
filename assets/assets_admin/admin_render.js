/* Variáveis globais definidas em admin_state.js (carregado antes) */

function renderAll(){renderKPIs();renderPipeline();renderResumo();renderEscopoProd();renderList();renderPasta();if($("pg-analytics")&&$("pg-analytics").classList.contains("active"))renderAnalytics();}

function renderKPIs(){
  var all=dashboardData.oms;
  var fin=all.filter(function(o){return o.status==="finalizada";});
  var exec=all.filter(function(o){return o.status==="em_execucao";});
  var hh=fin.reduce(function(s,o){return s+Number(o.hh_total||0);},0);
  var mat=fin.reduce(function(s,o){return s+Number(o.materiais_total||0);},0);
  $("kpiTotal").textContent=all.length;
  $("kpiExec").textContent=exec.length;
  $("kpiHH").textContent=hh.toFixed(1)+"h";
  $("kpiMat").textContent="R$"+(mat>=1000?(mat/1000).toFixed(1)+"k":mat.toFixed(0));
  $("kpiDesvios").textContent=dashboardData.desvios.length;
}

function renderPipeline(){
  var all=dashboardData.oms,h="";
  PIPE_CFG.forEach(function(cfg){
    var n=all.filter(function(o){return o.status===cfg.key;}).length;
    var ac=currentPipe===cfg.key?" active":"";
    h+='<div class="pipe-step'+ac+'" onclick="filterPipe(\''+cfg.key+'\')" style="border-bottom-color:'+(currentPipe===cfg.key?cfg.bar:"transparent")+'">';
    h+='<div class="pipe-icon">'+cfg.icon+'</div>';
    h+='<div class="pipe-count" style="color:'+cfg.color+'">'+n+'</div>';
    h+='<div class="pipe-label">'+cfg.label+(cfg.key==="em_execucao"&&n>0?'<span class="pipe-live"></span>':'')+' </div>';
    h+='</div>';
  });
  $("pipeline").innerHTML=h;
}

function renderResumo(){
  var fin=dashboardData.oms.filter(function(o){return o.status==="finalizada";});
  var total=dashboardData.oms.length;
  if(!total){$("resumo").innerHTML='<div class="empty">Aguardando dados…</div>';return;}
  var hh=fin.reduce(function(s,o){return s+Number(o.hh_total||0);},0);
  var mat=fin.reduce(function(s,o){return s+Number(o.materiais_total||0);},0);
  var taxa=total>0?Math.round((fin.length/total)*100):0;
  var h='<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">';
  h+='<div style="background:var(--bc);padding:14px;border-radius:12px"><div style="font-size:10px;color:var(--c3);font-weight:800;text-transform:uppercase;margin-bottom:4px">HH Executado</div><div style="font-size:26px;font-weight:900;color:var(--b1)">'+hh.toFixed(1)+'h</div></div>';
  h+='<div style="background:var(--lc);padding:14px;border-radius:12px"><div style="font-size:10px;color:var(--c3);font-weight:800;text-transform:uppercase;margin-bottom:4px">Custo Total</div><div style="font-size:26px;font-weight:900;color:var(--lr)">R$'+mat.toFixed(0)+'</div></div>';
  h+='</div><div style="margin-top:12px"><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:11px;font-weight:800;color:var(--c2)">Taxa de Atendimento</span><span style="font-size:11px;font-weight:900;color:var(--vd)">'+taxa+'%</span></div>';
  h+='<div class="progress-bar-wrap"><div class="progress-bar" style="width:'+taxa+'%;background:linear-gradient(90deg,var(--vd),#2ecc71)"></div></div></div>';
  h+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:12px">';
  h+='<div style="background:var(--c6);padding:10px;border-radius:10px;text-align:center"><strong style="font-size:18px;display:block;color:var(--b1)">'+fin.length+'</strong><span style="font-size:10px;color:var(--c3);font-weight:800">Concluídas</span></div>';
  h+='<div style="background:var(--c6);padding:10px;border-radius:10px;text-align:center"><strong style="font-size:18px;display:block;color:var(--az)">'+fin.filter(function(o){return o.has_checklist;}).length+'</strong><span style="font-size:10px;color:var(--c3);font-weight:800">Checklist</span></div>';
  h+='<div style="background:var(--c6);padding:10px;border-radius:10px;text-align:center"><strong style="font-size:18px;display:block;color:var(--lr)">'+fin.filter(function(o){return o.has_fotos;}).length+'</strong><span style="font-size:10px;color:var(--c3);font-weight:800">Fotográfico</span></div>';
  h+='</div>';
  $("resumo").innerHTML=h;
}

function renderEscopoProd(){
  var el=$("chartEscopoProd");if(!el)return;
  var all=dashboardData.oms;
  if(!all.length){el.innerHTML='<div class="empty">Sem dados</div>';return;}
  var escopos=[
    {key:"geral",label:"📋 Geral",color:"#607D8B"},
    {key:"preventiva_usina",label:"🏭 Prev. Usina",color:"#1A5276"},
    {key:"preventiva_mina",label:"⛏️ Prev. Mina",color:"#2E86C1"},
    {key:"preventiva_turno",label:"🔄 Prev. Turno",color:"#E67E22"},
    {key:"corretiva",label:"🔧 Corretiva",color:"#C0392B"}
  ];
  var data=escopos.map(function(e){
    var oms=all.filter(function(o){return(o.escopo||"geral")===e.key;});
    var fin=oms.filter(function(o){return o.status==="finalizada";});
    var exec=oms.filter(function(o){return o.status==="em_execucao";});
    var canc=oms.filter(function(o){return o.status==="cancelada";});
    var hh=fin.reduce(function(s,o){return s+Number(o.hh_total||0);},0);
    var mat=fin.reduce(function(s,o){return s+Number(o.materiais_total||0);},0);
    return{key:e.key,label:e.label,color:e.color,total:oms.length,fin:fin.length,exec:exec.length,canc:canc.length,hh:hh,mat:mat};
  }).filter(function(d){return d.total>0;});
  if(!data.length){el.innerHTML='<div class="empty">Sem OMs com escopo definido</div>';return;}
  var maxTotal=Math.max.apply(null,data.map(function(d){return d.total;}))||1;
  var h='<div style="display:grid;grid-template-columns:130px 1fr 80px 80px 90px;gap:6px 12px;align-items:center;font-size:11px;margin-bottom:8px">';
  h+='<div style="font-weight:800;color:var(--c3);font-size:10px;text-transform:uppercase">Escopo</div>';
  h+='<div style="font-weight:800;color:var(--c3);font-size:10px;text-transform:uppercase">Atendimento</div>';
  h+='<div style="font-weight:800;color:var(--c3);font-size:10px;text-transform:uppercase;text-align:right">HH</div>';
  h+='<div style="font-weight:800;color:var(--c3);font-size:10px;text-transform:uppercase;text-align:right">Custo</div>';
  h+='<div style="font-weight:800;color:var(--c3);font-size:10px;text-transform:uppercase;text-align:center">Status</div>';
  h+='</div>';
  data.forEach(function(d){
    var taxa=d.total>0?Math.round((d.fin/d.total)*100):0;
    var barW=Math.max(3,(d.total/maxTotal)*100);
    var finW=d.total>0?(d.fin/d.total)*barW:0;
    h+='<div style="display:grid;grid-template-columns:130px 1fr 80px 80px 90px;gap:6px 12px;align-items:center;padding:8px 0;border-bottom:1px solid var(--c6)">';
    h+='<div style="font-weight:800;color:'+d.color+'">'+d.label+'<div style="font-size:10px;color:var(--c3);font-weight:600">'+d.total+' OMs</div></div>';
    h+='<div>';
    h+='<div style="display:flex;height:22px;border-radius:6px;overflow:hidden;background:var(--c6);width:'+barW.toFixed(0)+'%">';
    if(d.fin>0)h+='<div style="width:'+finW.toFixed(1)+'%;background:'+d.color+';display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;color:#fff;min-width:20px" title="'+d.fin+' finalizadas">'+d.fin+'</div>';
    if(d.total-d.fin>0)h+='<div style="flex:1;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--c3)">'+(d.total-d.fin)+'</div>';
    h+='</div>';
    h+='<div style="font-size:10px;font-weight:800;color:'+(taxa>=80?'var(--vd)':taxa>=50?'var(--lr)':'var(--vm)')+';margin-top:2px">'+taxa+'% atendimento</div>';
    h+='</div>';
    h+='<div style="text-align:right;font-weight:900;color:var(--b1);font-family:\'JetBrains Mono\',monospace">'+d.hh.toFixed(1)+'h</div>';
    h+='<div style="text-align:right;font-weight:900;color:var(--lr);font-family:\'JetBrains Mono\',monospace">R$'+_fmtNum(d.mat)+'</div>';
    h+='<div style="display:flex;gap:4px;justify-content:center">';
    if(d.exec>0)h+='<span style="background:var(--ac);color:var(--az);padding:2px 6px;border-radius:6px;font-size:9px;font-weight:900">'+d.exec+' exec</span>';
    if(d.canc>0)h+='<span style="background:var(--vmc);color:var(--vm);padding:2px 6px;border-radius:6px;font-size:9px;font-weight:900">'+d.canc+' canc</span>';
    if(d.exec===0&&d.canc===0)h+='<span style="color:var(--c4);font-size:10px">—</span>';
    h+='</div>';
    h+='</div>';
  });
  var totGeral={total:0,fin:0,hh:0,mat:0};
  data.forEach(function(d){totGeral.total+=d.total;totGeral.fin+=d.fin;totGeral.hh+=d.hh;totGeral.mat+=d.mat;});
  var taxaGeral=totGeral.total>0?Math.round((totGeral.fin/totGeral.total)*100):0;
  h+='<div style="display:grid;grid-template-columns:130px 1fr 80px 80px 90px;gap:6px 12px;align-items:center;padding:10px 0;margin-top:4px;border-top:2px solid var(--c5)">';
  h+='<div style="font-weight:900;color:var(--c1)">TOTAL</div>';
  h+='<div style="font-weight:900;color:var(--c1)">'+totGeral.fin+' / '+totGeral.total+' — '+taxaGeral+'%</div>';
  h+='<div style="text-align:right;font-weight:900;color:var(--b1);font-family:\'JetBrains Mono\',monospace">'+totGeral.hh.toFixed(1)+'h</div>';
  h+='<div style="text-align:right;font-weight:900;color:var(--lr);font-family:\'JetBrains Mono\',monospace">R$'+_fmtNum(totGeral.mat)+'</div>';
  h+='<div></div></div>';
  el.innerHTML=h;
}


function getFilteredOms(includeConcluidas){
  var search=($("searchInput")&&$("searchInput").value||"").toLowerCase();
  var eq=$("filterEquipe")?$("filterEquipe").value:"";
  var fia=$("filterFIA")?$("filterFIA").value:"";
  var filtroEscopo=$("filterEscopo")?$("filterEscopo").value:"";
  var dtIni=$("filterDtInicio")?$("filterDtInicio").value:"";
  var dtFim=$("filterDtFim")?$("filterDtFim").value:"";
  var list=dashboardData.oms||[];
  if(currentPipe)list=list.filter(function(o){return o.status===currentPipe;});
  if(eq)list=list.filter(function(o){return(o.equipe||o.primeiro_executante)===eq;});
  if(fia)list=list.filter(function(o){return String(o.fia||o.fia_numero||"")===String(fia);});
  if(filtroEscopo)list=list.filter(function(o){return(o.escopo||'geral')===filtroEscopo;});
  if(search)list=list.filter(function(o){return(o.num||"").toLowerCase().includes(search)||(o.titulo||"").toLowerCase().includes(search)||(o.operador||"").toLowerCase().includes(search)||(o.equipamento||"").toLowerCase().includes(search);});
  function _parseDateSafe(v){
    if(!v)return null;
    if(v instanceof Date && !isNaN(v.getTime()))return v;
    var d=new Date(v);
    if(!isNaN(d.getTime()))return d;
    if(typeof v==="string"){
      var m=v.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
      if(m){
        var hh=parseInt(m[4]||"0",10),mm=parseInt(m[5]||"0",10),ss=parseInt(m[6]||"0",10);
        var d2=new Date(parseInt(m[3],10),parseInt(m[2],10)-1,parseInt(m[1],10),hh,mm,ss);
        if(!isNaN(d2.getTime()))return d2;
      }
    }
    return null;
  }
  function _pickDateOm(o){
    var base=o.updated_at||o.created_at||o.data_execucao||o.data_finalizacao||o.uploaded_at||o.data_upload||"";
    return _parseDateSafe(base);
  }
  if(dtIni){
    var dIni=_parseDateSafe(dtIni+"T00:00:00");
    if(dIni)list=list.filter(function(o){var d=_pickDateOm(o);return d&&d>=dIni;});
  }
  if(dtFim){
    var dFim=_parseDateSafe(dtFim+"T23:59:59");
    if(dFim)list=list.filter(function(o){var d=_pickDateOm(o);return d&&d<=dFim;});
  }
  var statusManual=$("filterStatus")?$("filterStatus").value:"";
  if(!includeConcluidas&&!_showConcluidasPainel&&!currentPipe&&!statusManual){
    list=list.filter(function(o){return o.status!=="finalizada"&&o.status!=="cancelada";});
  }
  return list;
}

function toggleConcluidasPainel(){
  _showConcluidasPainel=!_showConcluidasPainel;
  var btn=$("btnToggleConcluidas");
  if(btn)btn.textContent=_showConcluidasPainel?"Ocultar concluídas":"Mostrar concluídas";
  renderList();
}

function renderOperationalTimeline(){
  var el=$("operationalTimeline");if(!el)return;
  var list=getFilteredOms();
  if(!list.length){el.innerHTML='<div class="empty">Nenhuma OM para o período selecionado.</div>';return;}
  var grouped={};
  list.forEach(function(om){
    var raw=om.updated_at||om.created_at||"";
    var d=raw?new Date(raw):null;
    var key=d&&!isNaN(d.getTime())?d.toISOString().split("T")[0]:"sem-data";
    if(!grouped[key])grouped[key]=[];
    grouped[key].push(om);
  });
  var keys=Object.keys(grouped).sort().reverse().slice(0,14);
  var h="";
  keys.forEach(function(k){
    var arr=grouped[k];
    var label=k==="sem-data"?"Sem data":new Date(k+"T00:00:00").toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"2-digit"});
    h+='<div class="timeline-day"><div class="timeline-day-head"><div class="timeline-day-title">'+label+'</div><div class="timeline-day-count">'+arr.length+' OM(s)</div></div>';
    arr.slice(0,6).forEach(function(om){
      var cfg=(PIPE_CFG.find(function(p){return p.key===om.status;})||{});
      h+='<div class="timeline-item" onclick="onOpenOM(\''+om.num+'\')">';
      h+='<span class="timeline-dot" style="background:'+(cfg.bar||"#9CA3AF")+'"></span>';
      h+='<div style="flex:1;min-width:0"><div class="timeline-label">'+esc(om.num+" • "+(om.titulo||"Sem título"))+'</div><div class="timeline-meta">'+esc((cfg.label||om.status||"Status")+" • "+(om.equipe||om.primeiro_executante||"Sem equipe"))+'</div></div></div>';
    });
    if(arr.length>6)h+='<div class="timeline-meta">+'+(arr.length-6)+' itens</div>';
    h+='</div>';
  });
  el.innerHTML=h;
}

function renderPeriodoInsights(){
  var el=$("painelPeriodoInsights");if(!el)return;
  var list=getFilteredOms();
  if(!list.length){el.innerHTML='<div class="empty" style="padding:10px">Sem dados para o período selecionado.</div>';return;}
  function _pickDate(o){
    var cands=[o.data_upload,o.uploaded_at,o.created_at,o.updated_at,o.data_finalizacao,o.data_execucao];
    for(var i=0;i<cands.length;i++){if(cands[i]){var d=new Date(cands[i]);if(!isNaN(d.getTime()))return d;}}
    return null;
  }
  var datas=list.map(_pickDate).filter(Boolean).sort(function(a,b){return a-b;});
  var ini=datas[0]?datas[0].toLocaleDateString("pt-BR"):"—";
  var fim=datas[datas.length-1]?datas[datas.length-1].toLocaleDateString("pt-BR"):"—";
  var hh=list.reduce(function(s,o){return s+Number(o.hh_total||0);},0);
  var mat=list.reduce(function(s,o){return s+Number(o.materiais_total||0);},0);
  var ccMap={},eqMap={},stMap={};
  list.forEach(function(o){
    var cc=o.cc||"Sem CC";ccMap[cc]=(ccMap[cc]||0)+1;
    var eq=o.equipe||o.primeiro_executante||"Sem equipe";eqMap[eq]=(eqMap[eq]||0)+1;
    var st=o.status||"sem_status";stMap[st]=(stMap[st]||0)+1;
  });
  function top(map){var keys=Object.keys(map);if(!keys.length)return["—",0];keys.sort(function(a,b){return map[b]-map[a];});return[keys[0],map[keys[0]]];}
  var tEq=top(eqMap),tCc=top(ccMap),tSt=top(stMap);
  var h='<div class="periodo-insights-grid">';
  h+='<div class="periodo-insight"><div class="tt">Contexto do período</div><div class="vv">'+ini+' → '+fim+'</div><div class="ss">'+list.length+' OMs filtradas</div></div>';
  h+='<div class="periodo-insight"><div class="tt">HH Total</div><div class="vv">'+hh.toFixed(1)+'h</div><div class="ss">Executado no recorte</div></div>';
  h+='<div class="periodo-insight"><div class="tt">Material</div><div class="vv">R$ '+mat.toFixed(2)+'</div><div class="ss">Custo no recorte</div></div>';
  h+='<div class="periodo-insight"><div class="tt">Equipe destaque</div><div class="vv">'+esc(tEq[0])+'</div><div class="ss">'+tEq[1]+' OMs</div></div>';
  h+='<div class="periodo-insight"><div class="tt">Centro de custo foco</div><div class="vv">'+esc(tCc[0])+'</div><div class="ss">'+tCc[1]+' OMs • '+esc(String(tSt[0]))+'</div></div>';
  h+='</div>';
  el.innerHTML=h;
}

function clearGlobalFilters(){
  if($("searchInput"))$("searchInput").value="";
  if($("filterEquipe"))$("filterEquipe").value="";
  if($("filterFIA"))$("filterFIA").value="";
  if($("filterEscopo"))$("filterEscopo").value="";
  if($("filterStatus"))$("filterStatus").value="";
  if($("filterDtInicio"))$("filterDtInicio").value="";
  if($("filterDtFim"))$("filterDtFim").value="";
  if($("filterQtd"))$("filterQtd").value="20";
  _showConcluidasPainel=false;
  if($("btnToggleConcluidas"))$("btnToggleConcluidas").textContent="Mostrar concluídas";
  currentPipe=null;
  renderPipeline();
  renderList();
}
function filterPipeSelect(){currentPipe=$("filterStatus").value||null;renderPipeline();renderList();}
function filterPipe(k){currentPipe=currentPipe===k?null:k;$("filterStatus").value=currentPipe||"";renderPipeline();renderList();}

function populateEquipeFilter(){
  var equipes=[...new Set(dashboardData.oms.map(function(o){return o.equipe||o.primeiro_executante;}).filter(Boolean))].sort();
  var sel=$("filterEquipe");
  if(sel){
    var cur=sel.value;
    sel.innerHTML='<option value="">Todas as equipes</option>';
    equipes.forEach(function(e){sel.innerHTML+='<option value="'+e+'"'+(e===cur?' selected':'')+'>'+e+'</option>';});
  }
  var fiaSel=$("filterFIA");
  if(fiaSel){
    var curFia=fiaSel.value;
    var fiasa=[...new Set((dashboardData.oms||[]).map(function(o){return o.fia||o.fia_numero;}).filter(Boolean))].sort(function(a,b){return String(a).localeCompare(String(b),"pt-BR",{numeric:true});});
    fiaSel.innerHTML='<option value="">Todos os FIAs</option>';
    fiasa.forEach(function(f){fiaSel.innerHTML+='<option value="'+f+'"'+(String(f)===String(curFia)?' selected':'')+'>FIA '+f+'</option>';});
  }
}

function renderList(){
  var maxQtd=parseInt(($("filterQtd")?$("filterQtd").value:"20"))||0;
  var list=getFilteredOms();
  if($("btnToggleConcluidas"))$("btnToggleConcluidas").textContent=_showConcluidasPainel?"Ocultar concluídas":"Mostrar concluídas";
  var cfg=currentPipe?PIPE_CFG.find(function(p){return p.key===currentPipe;}):null;
  $("listTitle").textContent=cfg?cfg.icon+" "+cfg.label:"Todas as OMs";
  var totalFiltrado=list.length;
  var exibindo=maxQtd>0?Math.min(maxQtd,totalFiltrado):totalFiltrado;
  $("listCount").textContent=exibindo+" de "+totalFiltrado+" ordem(ns)";
  renderOperationalTimeline();
  renderPeriodoInsights();
  if(!list.length){$("omList").innerHTML='<div class="empty">Nenhuma OM encontrada.</div>';$("omPagination").style.display="none";return;}
  var listShow=maxQtd>0?list.slice(0,maxQtd):list;
  var h="";
  var _escopoMap={preventiva_usina:'🏭 Usina',preventiva_mina:'⛏️ Mina',preventiva_turno:'🔄 Turno',corretiva:'🔧 Corretiva'};
  listShow.forEach(function(om,idx){
    var bar=(PIPE_CFG.find(function(p){return p.key===om.status;})||{}).bar||"#ccc";
    var titulo=esc(om.titulo||"—"),equipe=esc(om.equipe||om.primeiro_executante||"—");
    var isExec=om.status==="em_execucao";
    var dtLabel="";
    if(om.updated_at){try{dtLabel=new Date(om.updated_at).toLocaleDateString("pt-BR");}catch(e){}}
    h+='<div class="om-item" style="animation-delay:'+(Math.min(idx,10)*25)+'ms" onclick="onOpenOM(\''+om.num+'\')">';
    h+='<div class="om-bar" style="background:'+bar+'"></div><div class="om-body">';
    h+='<div class="om-num">'+om.num+'</div>';
    h+='<div class="om-titulo">'+(isExec?'<span style="display:inline-block;width:7px;height:7px;background:var(--az);border-radius:50%;margin-right:5px;animation:dotLive 1.5s infinite;vertical-align:middle"></span>':'')+titulo+'</div>';
    h+='<div class="om-equipe">'+equipe+(dtLabel?' <span style="color:var(--c4);font-size:10px">'+dtLabel+'</span>':'')+'</div>';
    if((om.escopo==="preventiva_turno")||om.motivo_reprogramacao)h+='<div style="font-size:10px;font-weight:800;color:#6D28D9;background:#F3E8FF;display:inline-block;padding:1px 6px;border-radius:4px;">↔ Passada turno</div>';
    if(om.escopo&&_escopoMap[om.escopo])h+='<div style="font-size:10px;font-weight:800;color:var(--b1);background:var(--bc);display:inline-block;padding:1px 6px;border-radius:4px;">'+_escopoMap[om.escopo]+'</div>';
    if(om.fia||om.fia_numero)h+='<div style="font-size:10px;font-weight:800;color:var(--c2);background:var(--c6);display:inline-block;padding:1px 6px;border-radius:4px;">FIA '+esc(String(om.fia||om.fia_numero))+'</div>';
    if(om.hh_total>0)h+='<div class="om-hh">'+Number(om.hh_total).toFixed(1)+'h</div>';
    if(om.materiais_total>0)h+='<div class="om-mat">R$'+Number(om.materiais_total).toFixed(0)+'</div>';
    if(isExec)h+='<button onclick="event.stopPropagation();showHabilitarDispositivo(\''+om.num+'\')" style="flex-shrink:0;padding:5px 10px;background:linear-gradient(135deg,#e67e00,#f5a623);color:#fff;border:none;border-radius:8px;font-size:11px;font-weight:900;cursor:pointer">📱 Habilitar</button>';
    h+='<div class="om-docs">';
    h+='<div class="doc-badge" style="background:'+(om.has_relatorio?'var(--bc)':'var(--c6)')+';color:'+(om.has_relatorio?'var(--b1)':'var(--c4)')+'" title="Relatório">R</div>';
    h+='<div class="doc-badge" style="background:'+(om.has_checklist?'var(--ac)':'var(--c6)')+';color:'+(om.has_checklist?'var(--az)':'var(--c4)')+'" title="Checklist">C</div>';
    h+='<div class="doc-badge" style="background:'+(om.has_fotos?'var(--lc)':'var(--c6)')+';color:'+(om.has_fotos?'var(--lr)':'var(--c4)')+'" title="Fotográfico">F</div>';
    h+='</div></div></div>';
  });
  $("omList").innerHTML=h;
  if(maxQtd>0&&totalFiltrado>maxQtd){
    $("omPagination").style.display="block";
    $("omPagination").innerHTML='<span style="font-size:11px;color:var(--c3);font-weight:700">Mostrando '+exibindo+' de '+totalFiltrado+' — aumente o limite ou filtre por período</span>';
  }else{$("omPagination").style.display="none";}
}

function exportarCsvPainel(){
  try{
    var list=getFilteredOms(true);
    if(!list.length){adminToast("Sem dados para exportar no período atual","warn");return;}
    function fmt(v){
      if(v==null)return "";
      var s=String(v).replace(/\r?\n/g," ").trim();
      if(/[;\"\n]/.test(s))s='"'+s.replace(/\"/g,'""')+'"';
      return s;
    }
    function fmtDate(v){
      if(!v)return "";
      var d=new Date(v);
      return isNaN(d.getTime())?String(v):d.toLocaleString("pt-BR");
    }
    var head=["OM","Título","Status","Escopo","Equipe","FIA","CC","HH Total","Materiais Total","Upload","Execução","Finalização","Desvio","Checklist","Fotos","Relatório"];
    var rows=[head.join(";")];
    list.forEach(function(o){
      rows.push([
        o.num,o.titulo,o.status,o.escopo||"geral",o.equipe||o.primeiro_executante||"",
        o.fia||o.fia_numero||"",o.cc||"",Number(o.hh_total||0).toFixed(2),Number(o.materiais_total||0).toFixed(2),
        fmtDate(o.created_at||o.uploaded_at||o.data_upload),fmtDate(o.data_execucao||o.updated_at),fmtDate(o.data_finalizacao),
        o.desvio?"SIM":"NÃO",o.has_checklist?"SIM":"NÃO",o.has_fotos?"SIM":"NÃO",o.has_relatorio?"SIM":"NÃO"
      ].map(fmt).join(";"));
    });
    var csv="\uFEFF"+rows.join("\n");
    var ini=$("filterDtInicio")&&$("filterDtInicio").value||"inicio";
    var fim=$("filterDtFim")&&$("filterDtFim").value||"fim";
    var blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});
    forceDownloadBlob(blob,"painel_oms_"+ini+"_"+fim+".csv");
    adminToast("CSV exportado com "+list.length+" OMs","success");
  }catch(e){
    console.error("Erro ao exportar CSV:",e);
    adminToast("Falha ao gerar CSV: "+(e.message||e),"error");
  }
}

function renderEquipes(){
  var oms=dashboardData.oms;
  var equipeMap={};
  oms.forEach(function(o){
    var eq=_equipeLabel(o);
    if(!equipeMap[eq])equipeMap[eq]={total:0,fin:0,hh:0,mat:0,desvios:0,exec:0,membros:{}};
    equipeMap[eq].total++;
    if(o.status==="finalizada"){equipeMap[eq].fin++;equipeMap[eq].hh+=Number(o.hh_total||0);equipeMap[eq].mat+=Number(o.materiais_total||0);}
    if(o.status==="em_execucao")equipeMap[eq].exec++;
    var execs=safeParseArray(o.executantes);
    execs.forEach(function(n){if(n)equipeMap[eq].membros[n]=true;});
    if(o.primeiro_executante)equipeMap[eq].membros[o.primeiro_executante]=true;
  });
  dashboardData.desvios.forEach(function(d){
    var om=oms.find(function(o){return o.num===d.om_num;});
    var eq=om?_equipeLabel(om):"Sem equipe";
    if(equipeMap[eq])equipeMap[eq].desvios++;
  });
  var equipes=Object.keys(equipeMap).sort();
  if(!equipes.length){$("equipesGrid").innerHTML='<div class="empty">Nenhum dado.</div>';return;}
  var colors=["var(--b1)","var(--az)","var(--lr)","var(--vd)","#6f42c1","#0dcaf0"];
  var h='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px">';
  equipes.forEach(function(eq,i){
    var d=equipeMap[eq];
    var taxa=d.total>0?Math.round((d.fin/d.total)*100):0;
    var col=colors[i%colors.length];
    var membros=Object.keys(d.membros).sort();
    h+='<div class="equipe-card"><div class="equipe-name"><div style="width:10px;height:10px;border-radius:3px;background:'+col+';flex-shrink:0"></div>'+esc(eq)+(d.exec>0?'<span class="pipe-live"></span>':'')+'</div>';
    if(membros.length)h+='<div style="font-size:10px;color:var(--c3);margin:-4px 0 8px;padding-left:16px">'+membros.map(function(m){return esc(m);}).join(", ")+'</div>';
    h+='<div class="equipe-stat"><span class="equipe-stat-label">OMs Finalizadas</span><span class="equipe-stat-val" style="color:var(--vd)">'+d.fin+' / '+d.total+'</span></div>';
    h+='<div class="equipe-stat"><span class="equipe-stat-label">HH Executado</span><span class="equipe-stat-val" style="color:var(--b1)">'+d.hh.toFixed(1)+'h</span></div>';
    h+='<div class="equipe-stat"><span class="equipe-stat-label">Custo Materiais</span><span class="equipe-stat-val" style="color:var(--lr)">R$ '+d.mat.toFixed(2)+'</span></div>';
    h+='<div class="equipe-stat"><span class="equipe-stat-label">Desvios</span><span class="equipe-stat-val" style="color:'+(d.desvios>0?'var(--vm)':'var(--c3)')+'">'+d.desvios+'</span></div>';
    h+='<div class="progress-bar-wrap"><div class="progress-bar" style="width:'+taxa+'%;background:'+col+'"></div></div>';
    h+='<div style="font-size:10px;color:var(--c3);font-weight:800;margin-top:4px;text-align:right">'+taxa+'% atendimento</div></div>';
  });
  h+='</div>';
  $("equipesGrid").innerHTML=h;
}

function renderDesvios(){
  var search=($("searchDesvios").value||"").toLowerCase();
  var tipo=$("filterDesvioTipo").value;
  var list=dashboardData.desvios;
  if(search)list=list.filter(function(d){return(d.om_num||"").toLowerCase().includes(search)||(d.tipo||"").toLowerCase().includes(search);});
  if(tipo)list=list.filter(function(d){return d.tipo===tipo;});
  $("desviosCount").textContent=list.length+" registro(s)";
  if(!list.length){$("desviosList").innerHTML='<div class="empty">Nenhum desvio.</div>';return;}
  var h="";
  list.forEach(function(d,idx){
    var c=DESVIO_COLORS[d.tipo]||["#888","#f5f5f5"];
    var tempo=d.tempo_parado_min?d.tempo_parado_min+" min":"";
    var data=d.created_at?new Date(d.created_at).toLocaleString("pt-BR"):"";
    h+='<div class="desvio-item" style="animation-delay:'+(idx*20)+'ms"><div class="desvio-header">';
    h+='<span class="desvio-badge" style="background:'+c[1]+';color:'+c[0]+'">'+(d.tipo||"DESVIO")+'</span>';
    h+='<span class="mono" style="font-size:11px;font-weight:800;color:var(--b1);background:var(--bc);padding:3px 8px;border-radius:6px">OM '+(d.om_num||"—")+'</span>';
    if(tempo)h+='<span style="font-size:11px;color:var(--vm);font-weight:800">⏱ '+tempo+'</span>';
    h+='</div>';
    if(d.descricao)h+='<div class="desvio-body">'+esc(d.descricao)+'</div>';
    h+='<div class="desvio-meta">';
    if(d.registrado_por||d.habilitado_por)h+='<span>👤 '+(d.registrado_por||d.habilitado_por)+'</span>';
    if(data)h+='<span>📅 '+data+'</span>';
    if(d.novo_responsavel)h+='<span>🔄 Novo: '+d.novo_responsavel+'</span>';
    h+='</div></div>';
  });
  $("desviosList").innerHTML=h;
}

function renderAnalytics(){
  var all=dashboardData.oms;
  var fin=all.filter(function(o){return o.status==="finalizada";});
  var dev=dashboardData.desvios;
  var totalHH=fin.reduce(function(s,o){return s+Number(o.hh_total||0);},0);
  var totalMat=fin.reduce(function(s,o){return s+Number(o.materiais_total||0);},0);
  var hhMedio=fin.length?totalHH/fin.length:0;
  function diaISO(d){try{return new Date(d).toISOString().split("T")[0];}catch(e){return null;}}
  var noPrazo=0,atrasadas=0,semPrazo=0,atrasosDias=[];
  fin.forEach(function(o){
    if(!o.data_fim_prevista||!o.data_finalizacao){semPrazo++;return;}
    var prev=diaISO(o.data_fim_prevista),real=diaISO(o.data_finalizacao);
    if(!prev||!real){semPrazo++;return;}
    if(real<=prev)noPrazo++;
    else{atrasadas++;atrasosDias.push((new Date(real)-new Date(prev))/86400000);}
  });
  var comPrazo=noPrazo+atrasadas;
  var taxaSLA=comPrazo>0?(noPrazo/comPrazo*100):0;
  var atrasoMedio=atrasosDias.length?atrasosDias.reduce(function(s,v){return s+v;},0)/atrasosDias.length:0;
  var leads=[];
  fin.forEach(function(o){if(o.created_at&&o.data_finalizacao){var d=(new Date(o.data_finalizacao)-new Date(o.created_at))/86400000;if(d>=0)leads.push(d);}});
  leads.sort(function(a,b){return a-b;});
  var leadMedian=leads.length?leads[Math.floor(leads.length/2)]:0;
  var vencidas=all.filter(function(o){return o.status!=="finalizada"&&o.status!=="cancelada"&&o.data_fim_prevista&&diaISO(o.data_fim_prevista)<diaISO(new Date().toISOString());});
  var mc=[
    {label:"SLA — No Prazo",val:comPrazo>0?taxaSLA.toFixed(0)+"%":"—",color:comPrazo===0?"var(--c3)":taxaSLA>=80?"var(--vd)":taxaSLA>=50?"var(--lr)":"var(--vm)",bg:comPrazo===0?"var(--c6)":taxaSLA>=80?"#eafaf1":taxaSLA>=50?"var(--lc)":"var(--vmc)",tip:comPrazo>0?noPrazo+" no prazo, "+atrasadas+" atrasadas"+(semPrazo?", "+semPrazo+" sem data SAP":""):"Nenhuma OM com data prevista do PDF"},
    {label:"OMs Finalizadas",val:fin.length+"/"+all.length,color:"var(--vd)",bg:"#eafaf1"},
    {label:"HH Total Medido",val:totalHH.toFixed(1)+"h",color:"var(--b1)",bg:"var(--bc)"},
    {label:"HH Médio / OM",val:hhMedio.toFixed(2)+"h",color:"var(--az)",bg:"var(--ac)"},
    {label:"Custo Materiais",val:"R$"+_fmtNum(totalMat),color:"var(--lr)",bg:"var(--lc)"},
    {label:"Lead Time Mediano",val:leads.length?leadMedian.toFixed(1)+" dias":"—",color:"var(--b1)",bg:"var(--bc)",tip:"Upload admin → Finalização mecânico"},
    {label:"Atraso Médio",val:atrasoMedio>0?atrasoMedio.toFixed(1)+" dias":"—",color:atrasoMedio>3?"var(--vm)":"var(--c2)",bg:atrasoMedio>3?"var(--vmc)":"var(--c6)",tip:"Dias além do prazo SAP (só atrasadas)"},
    {label:"Vencidas em Aberto",val:vencidas.length,color:vencidas.length>0?"var(--vm)":"var(--vd)",bg:vencidas.length>0?"var(--vmc)":"#eafaf1",tip:"OMs não finalizadas que passaram do prazo SAP"}
  ];
  var mh="";
  mc.forEach(function(m){
    mh+='<div style="background:'+m.bg+';padding:14px 16px;border-radius:12px;border:1px solid rgba(0,0,0,.04);cursor:default" '+(m.tip?'title="'+m.tip+'"':'')+' >';
    mh+='<div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.8px;color:var(--c3);margin-bottom:6px">'+m.label+'</div>';
    mh+='<div style="font-size:22px;font-weight:900;color:'+m.color+';font-family:\'JetBrains Mono\',monospace">'+m.val+'</div></div>';
  });
  $("analyticsMetrics").innerHTML=mh;
  _renderDeepOperationalInsights(all);
  _renderDonutStatus(all);_renderDonutEscopo(all);_renderTimeline(all);
  _renderLeadTime(leads,fin,noPrazo,atrasadas,semPrazo);
  _renderBarHH(all);_renderBarMat(all);_renderProdutividade(all);_renderCustoCC();
}

function _renderDeepOperationalInsights(all){
  var el=$("analyticsDeepInsights");if(!el)return;
  if(!all||!all.length){el.innerHTML='<div class="empty">Sem dados para análise avançada.</div>';return;}
  function _hist(om){return safeParseArray(om.historico_execucao);}
  var finalizadas=all.filter(function(o){return o.status==="finalizada"&&o.created_at&&o.data_finalizacao;});
  var tempos=finalizadas.map(function(o){return(new Date(o.data_finalizacao)-new Date(o.created_at))/3600000;}).filter(function(v){return v>=0;});
  var tempoMedio=tempos.length?tempos.reduce(function(s,v){return s+v;},0)/tempos.length:0;
  var deslocPorOM=[],horaPicoMap={},prodHoraMap={},horaExtraMin=0,passadasTurno=0;
  all.forEach(function(om){
    if(om.escopo==="preventiva_turno"||om.motivo_reprogramacao)passadasTurno++;
    var hist=_hist(om),deslocOm=0;
    hist.forEach(function(h){
      var dSeg=Number(h.deslocamentoSegundos!=null?h.deslocamentoSegundos:(Number(h.deslocamentoMinutos||0)*60))||0;
      deslocOm+=dSeg;
      var dIni=h.deslocamentoHoraInicio?new Date(h.deslocamentoHoraInicio):null;
      if(dIni&&!isNaN(dIni.getTime())){
        var hr=dIni.getHours();
        horaPicoMap[hr]=(horaPicoMap[hr]||0)+(dSeg/60);
      }
      var aIni=h.dataInicio?new Date(h.dataInicio):null,aFim=h.dataFim?new Date(h.dataFim):null;
      if(aIni&&aFim&&!isNaN(aIni.getTime())&&!isNaN(aFim.getTime())&&aFim>aIni){
        var mins=(aFim-aIni)/60000;
        var hrA=aIni.getHours();
        prodHoraMap[hrA]=(prodHoraMap[hrA]||0)+mins;
        var isExtra=(hrA<6||hrA>=18);
        if(isExtra)horaExtraMin+=mins;
      }
    });
    if(deslocOm>0)deslocPorOM.push({num:om.num,min:deslocOm/60});
  });
  deslocPorOM.sort(function(a,b){return b.min-a.min;});
  function topHour(map,pickMin){
    var keys=Object.keys(map).map(Number);
    if(!keys.length)return null;
    keys.sort(function(a,b){return pickMin?(map[a]-map[b]):(map[b]-map[a]);});
    return{h:keys[0],v:map[keys[0]]};
  }
  var picoDesloc=topHour(horaPicoMap,false);
  var hrProdMais=topHour(prodHoraMap,false);
  var hrProdMenos=topHour(prodHoraMap,true);
  var modoBM=_selectedBM?("BM "+_selectedBM):"Ao vivo";
  var h='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;margin-bottom:10px">';
  h+='<div style="background:var(--bc);padding:10px;border-radius:8px"><div style="font-size:9px;font-weight:800;color:var(--c3)">ÂNCORA TEMPORAL</div><div style="font-size:13px;font-weight:900;color:var(--b1)">Upload (created_at)</div><div style="font-size:10px;color:var(--c3)">Modo: '+modoBM+'</div></div>';
  h+='<div style="background:var(--c6);padding:10px;border-radius:8px"><div style="font-size:9px;font-weight:800;color:var(--c3)">Tempo médio atendimento</div><div style="font-size:18px;font-weight:900;color:var(--b1)">'+(tempoMedio?tempoMedio.toFixed(1)+'h':'—')+'</div><div style="font-size:10px;color:var(--c3)">Upload → finalização</div></div>';
  h+='<div style="background:var(--lc);padding:10px;border-radius:8px"><div style="font-size:9px;font-weight:800;color:var(--c3)">Hora extra estimada</div><div style="font-size:18px;font-weight:900;color:var(--lr)">'+(horaExtraMin/60).toFixed(1)+'h</div><div style="font-size:10px;color:var(--c3)">Atividade fora 06h–18h</div></div>';
  h+='<div style="background:#F3E8FF;padding:10px;border-radius:8px"><div style="font-size:9px;font-weight:800;color:var(--c3)">Passadas de turno</div><div style="font-size:18px;font-weight:900;color:#6D28D9">'+passadasTurno+'</div><div style="font-size:10px;color:var(--c3)">Escopo turno/reprogramação</div></div>';
  h+='</div>';
  h+='<div style="display:grid;grid-template-columns:1.2fr 1fr;gap:10px">';
  h+='<div style="background:var(--w);border:1px solid var(--c5);border-radius:8px;padding:10px"><div style="font-size:10px;font-weight:800;color:var(--c3);margin-bottom:6px">Top deslocamento por OM</div>';
  if(deslocPorOM.length){deslocPorOM.slice(0,5).forEach(function(d,idx){h+='<div style="display:flex;justify-content:space-between;font-size:11px;padding:4px 0;border-bottom:1px solid var(--c6)"><span style="font-weight:700;color:var(--c2)">'+(idx+1)+'. OM '+d.num+'</span><span style="font-weight:900;color:var(--b1)">'+d.min.toFixed(0)+' min</span></div>';});}
  else h+='<div class="empty" style="padding:8px">Sem deslocamentos</div>';
  h+='</div>';
  h+='<div style="background:var(--w);border:1px solid var(--c5);border-radius:8px;padding:10px"><div style="font-size:10px;font-weight:800;color:var(--c3);margin-bottom:6px">Picos por horário</div>';
  h+='<div style="font-size:11px;margin-bottom:5px"><strong>Deslocamento:</strong> '+(picoDesloc?String(picoDesloc.h).padStart(2,"0")+":00 ("+picoDesloc.v.toFixed(0)+" min)":"—")+'</div>';
  h+='<div style="font-size:11px;margin-bottom:5px"><strong>Mais produtivo:</strong> '+(hrProdMais?String(hrProdMais.h).padStart(2,"0")+":00 ("+(hrProdMais.v/60).toFixed(1)+"h)":"—")+'</div>';
  h+='<div style="font-size:11px"><strong>Menos produtivo:</strong> '+(hrProdMenos?String(hrProdMenos.h).padStart(2,"0")+":00 ("+(hrProdMenos.v/60).toFixed(1)+"h)":"—")+'</div>';
  h+='</div></div>';
  el.innerHTML=h;
}

function _renderDonutStatus(all){
  var counts={};PIPE_CFG.forEach(function(p){counts[p.key]=0;});
  all.forEach(function(o){if(counts[o.status]!==undefined)counts[o.status]++;});
  var segs=[{label:"Enviadas",val:counts.enviada||0,color:"#A0A7B4"},{label:"Execução",val:counts.em_execucao||0,color:"var(--az)"},{label:"Pendentes",val:counts.pendente_assinatura||0,color:"var(--lr)"},{label:"Finalizadas",val:counts.finalizada||0,color:"var(--vd)"},{label:"Canceladas",val:counts.cancelada||0,color:"var(--vm)"}].filter(function(s){return s.val>0;});
  _svgDonut($("chartDonutStatus"),segs,180);
}

function _renderDonutEscopo(all){
  var map={};
  var labels={geral:"Geral",preventiva_usina:"Usina",preventiva_mina:"Mina",preventiva_turno:"Turno",corretiva:"Corretiva"};
  var colors={geral:"#A0A7B4",preventiva_usina:"var(--b1)",preventiva_mina:"var(--az)",preventiva_turno:"var(--lr)",corretiva:"var(--vm)"};
  all.forEach(function(o){var e=o.escopo||"geral";map[e]=(map[e]||0)+1;});
  var segs=Object.keys(map).map(function(k){return{label:labels[k]||k,val:map[k],color:colors[k]||"#888"};}).filter(function(s){return s.val>0;});
  if(!segs.length)segs=[{label:"Geral",val:all.length,color:"#A0A7B4"}];
  _svgDonut($("chartDonutEscopo"),segs,180);
}

function _renderTimeline(all){
  var fin=all.filter(function(o){return o.status==="finalizada"&&o.data_finalizacao;});
  var days=14,buckets=[];
  for(var d=days-1;d>=0;d--){
    var dt=new Date();dt.setDate(dt.getDate()-d);dt.setHours(0,0,0,0);
    var key=dt.toISOString().split("T")[0];
    var label=dt.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"});
    var count=fin.filter(function(o){return o.data_finalizacao&&o.data_finalizacao.split("T")[0]===key;}).length;
    buckets.push({key:key,label:label,val:count});
  }
  var max=Math.max.apply(null,buckets.map(function(b){return b.val;}))||1;
  var W=680,H=160,padL=30,padB=28,padT=10,padR=10;
  var cw=W-padL-padR,ch=H-padT-padB,stepX=cw/(days-1);
  var pts=buckets.map(function(b,i){return{x:padL+i*stepX,y:padT+ch-(b.val/max)*ch};});
  var svg='<svg width="100%" viewBox="0 0 '+W+" "+H+'" style="overflow:visible">';
  for(var g=0;g<=4;g++){var gy=padT+(ch/4)*g;var gv=Math.round(max*(1-g/4));svg+='<line x1="'+padL+'" y1="'+gy+'" x2="'+(W-padR)+'" y2="'+gy+'" stroke="var(--c6)" stroke-width="1"/><text x="'+(padL-6)+'" y="'+(gy+3)+'" text-anchor="end" font-size="9" fill="var(--c3)" font-weight="700">'+gv+"</text>";}
  var areaPath="M "+pts[0].x+" "+(padT+ch);
  pts.forEach(function(p){areaPath+=" L "+p.x+" "+p.y;});
  areaPath+=" L "+pts[pts.length-1].x+" "+(padT+ch)+" Z";
  svg+='<defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--b1)" stop-opacity=".18"/><stop offset="100%" stop-color="var(--b1)" stop-opacity=".02"/></linearGradient></defs>';
  svg+='<path d="'+areaPath+'" fill="url(#areaGrad)"/>';
  var linePath="M "+pts[0].x+" "+pts[0].y;
  for(var lp=1;lp<pts.length;lp++)linePath+=" L "+pts[lp].x+" "+pts[lp].y;
  svg+='<path d="'+linePath+'" fill="none" stroke="var(--b1)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';
  pts.forEach(function(p,i){
    if(buckets[i].val>0){svg+='<circle cx="'+p.x+'" cy="'+p.y+'" r="4" fill="var(--b1)" stroke="#fff" stroke-width="2"/><text x="'+p.x+'" y="'+(p.y-8)+'" text-anchor="middle" font-size="10" font-weight="900" fill="var(--b1)">'+buckets[i].val+"</text>";}
    if(i%2===0||days<=7)svg+='<text x="'+p.x+'" y="'+(H-4)+'" text-anchor="middle" font-size="9" fill="var(--c3)" font-weight="700">'+buckets[i].label+"</text>";
  });
  svg+="</svg>";
  $("chartTimeline").innerHTML=svg;
}

function _renderLeadTime(leads,fin,noPrazo,atrasadas,semPrazo){
  var el=$("chartLeadTime");
  if(!leads.length&&!noPrazo&&!atrasadas){el.innerHTML='<div class="empty">Sem OMs finalizadas com datas válidas</div>';return;}
  var h="";
  var comPrazo=noPrazo+atrasadas;
  if(comPrazo>0){
    var pctOk=(noPrazo/comPrazo*100);
    h+='<div style="margin-bottom:16px"><div style="font-size:11px;font-weight:800;color:var(--c2);margin-bottom:6px">Cumprimento de Prazo SAP — '+comPrazo+' OM(s) com data prevista</div>';
    h+='<div style="display:flex;height:28px;border-radius:8px;overflow:hidden;background:var(--c6)">';
    if(noPrazo>0)h+='<div style="width:'+pctOk+'%;background:var(--vd);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:#fff;min-width:30px" title="'+noPrazo+' no prazo">'+noPrazo+"</div>";
    if(atrasadas>0)h+='<div style="width:'+(100-pctOk)+'%;background:var(--vm);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:#fff;min-width:30px" title="'+atrasadas+' atrasadas">'+atrasadas+"</div>";
    h+="</div>";
    h+='<div style="display:flex;gap:14px;margin-top:5px"><span style="font-size:10px;font-weight:700;color:var(--vd)">● No prazo '+pctOk.toFixed(0)+'%</span><span style="font-size:10px;font-weight:700;color:var(--vm)">● Atrasadas '+(100-pctOk).toFixed(0)+'%</span>'+(semPrazo>0?'<span style="font-size:10px;font-weight:700;color:var(--c3)">'+semPrazo+' sem data SAP</span>':'')+"</div></div>";
  }
  if(leads.length){
    var faixas=[{label:"Mesmo dia",min:0,max:1,color:"var(--vd)"},{label:"1–3 dias",min:1,max:3,color:"var(--az)"},{label:"3–7 dias",min:3,max:7,color:"var(--b1)"},{label:"7–14 dias",min:7,max:14,color:"var(--lr)"},{label:"14+ dias",min:14,max:9999,color:"var(--vm)"}];
    faixas.forEach(function(f){f.count=leads.filter(function(d){return d>=f.min&&d<f.max;}).length;});
    var maxCount=Math.max.apply(null,faixas.map(function(f){return f.count;}))||1;
    var media=leads.reduce(function(s,v){return s+v;},0)/leads.length;
    var mediana=leads[Math.floor(leads.length/2)];
    h+='<div style="font-size:11px;font-weight:800;color:var(--c2);margin-bottom:8px">Lead Time — Upload Admin → Finalização Campo</div>';
    h+='<div style="display:flex;gap:8px;margin-bottom:12px"><div style="background:var(--bc);padding:6px 12px;border-radius:8px;font-size:11px;font-weight:800;color:var(--b1)">Média: '+media.toFixed(1)+' dias</div><div style="background:var(--bc);padding:6px 12px;border-radius:8px;font-size:11px;font-weight:800;color:var(--b1)">Mediana: '+mediana.toFixed(1)+' dias</div><div style="background:var(--c6);padding:6px 12px;border-radius:8px;font-size:11px;font-weight:700;color:var(--c3)">'+leads.length+' OMs</div></div>';
    h+='<div style="display:flex;align-items:flex-end;gap:6px;height:100px;padding-bottom:24px;position:relative">';
    faixas.forEach(function(f){var pct=Math.max(4,(f.count/maxCount)*100);h+='<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;position:relative"><div style="font-size:12px;font-weight:900;color:var(--c1);font-family:\'JetBrains Mono\',monospace">'+f.count+'</div><div style="width:100%;max-width:60px;height:'+pct+'%;background:'+f.color+';border-radius:6px 6px 0 0;transition:height .4s ease;min-height:3px"></div><div style="font-size:9px;font-weight:700;color:var(--c3);text-align:center;position:absolute;bottom:-20px;white-space:nowrap">'+f.label+'</div></div>';});
    h+="</div>";
  }
  el.innerHTML=h;
}

function _renderBarByField(all,field,elId,color,prefix){var fin=all.filter(function(o){return o.status==="finalizada";});var map={};fin.forEach(function(o){var eq=_equipeLabel(o);map[eq]=(map[eq]||0)+Number(o[field]||0);});var sorted=Object.keys(map).map(function(k){return{label:k,val:map[k]};}).sort(function(a,b){return b.val-a.val;}).slice(0,8);_renderHBars($(elId),sorted,color,prefix);}
function _renderBarHH(all){_renderBarByField(all,"hh_total","chartHHEquipe","var(--b1)","h");}
function _renderBarMat(all){_renderBarByField(all,"materiais_total","chartMatEquipe","var(--lr)","R$");}

function _renderHBars(el,data,color,prefix){
  if(!data.length){el.innerHTML='<div class="empty">Sem dados</div>';return;}
  var max=data[0].val||1,h="";
  data.forEach(function(d){var pct=Math.max(2,(d.val/max)*100);var valTxt=prefix==="R$"?"R$ "+_fmtNum(d.val):d.val.toFixed(1)+prefix;h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><div style="width:90px;font-size:11px;font-weight:700;color:var(--c2);text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="'+d.label+'">'+d.label+'</div><div style="flex:1;height:22px;background:var(--c6);border-radius:6px;overflow:hidden"><div style="height:100%;width:'+pct.toFixed(1)+'%;background:'+color+';border-radius:6px;transition:width .6s ease;min-width:2px"></div></div><div style="min-width:60px;font-size:12px;font-weight:900;color:var(--c1);font-family:\'JetBrains Mono\',monospace;text-align:right">'+valTxt+"</div></div>";});
  el.innerHTML=h;
}

function _renderProdutividade(all){
  var fin=all.filter(function(o){return o.status==="finalizada";});
  var map={};
  fin.forEach(function(o){var eq=_equipeLabel(o);if(!map[eq])map[eq]={oms:0,hh:0,mat:0};map[eq].oms++;map[eq].hh+=Number(o.hh_total||0);map[eq].mat+=Number(o.materiais_total||0);});
  var equipes=Object.keys(map).sort(function(a,b){return map[b].oms-map[a].oms;});
  if(!equipes.length){$("chartProdutividade").innerHTML='<div class="empty">Sem dados</div>';return;}
  var maxOms=Math.max.apply(null,equipes.map(function(e){return map[e].oms;}))||1;
  var maxHH=Math.max.apply(null,equipes.map(function(e){return map[e].hh;}))||1;
  var W=680,H=Math.max(140,equipes.length*36+40),padL=90,padR=10,padT=20,padB=30;
  var cw=W-padL-padR,ch=H-padT-padB;
  var barH=Math.min(14,(ch/equipes.length)*0.4),stepY=ch/equipes.length;
  var svg='<svg width="100%" viewBox="0 0 '+W+" "+H+'">';
  for(var g=0;g<=4;g++){var gx=padL+(cw/4)*g;svg+='<line x1="'+gx+'" y1="'+padT+'" x2="'+gx+'" y2="'+(H-padB)+'" stroke="var(--c6)" stroke-width="1"/>';}
  equipes.forEach(function(eq,i){
    var d=map[eq],cy=padT+i*stepY+stepY/2;
    var wOms=(d.oms/maxOms)*(cw*0.9),wHH=(d.hh/maxHH)*(cw*0.9);
    svg+='<text x="'+(padL-6)+'" y="'+(cy+3)+'" text-anchor="end" font-size="10" font-weight="700" fill="var(--c2)">'+eq+"</text>";
    svg+='<rect x="'+padL+'" y="'+(cy-barH-1)+'" width="'+wOms.toFixed(1)+'" height="'+barH+'" rx="3" fill="var(--b1)" opacity=".85"><title>'+d.oms+" OMs</title></rect>";
    svg+='<rect x="'+padL+'" y="'+(cy+1)+'" width="'+wHH.toFixed(1)+'" height="'+barH+'" rx="3" fill="var(--az)" opacity=".7"><title>'+d.hh.toFixed(1)+"h</title></rect>";
    svg+='<text x="'+(padL+Math.max(wOms,wHH)+6)+'" y="'+(cy+4)+'" font-size="10" font-weight="900" fill="var(--c1)" font-family="\'JetBrains Mono\',monospace">'+d.oms+" OMs · "+d.hh.toFixed(1)+"h · R$"+_fmtNum(d.mat)+"</text>";
  });
  svg+='<rect x="'+padL+'" y="'+(H-14)+'" width="10" height="10" rx="2" fill="var(--b1)" opacity=".85"/><text x="'+(padL+14)+'" y="'+(H-5)+'" font-size="9" font-weight="700" fill="var(--c3)">OMs Finalizadas</text>';
  svg+='<rect x="'+(padL+110)+'" y="'+(H-14)+'" width="10" height="10" rx="2" fill="var(--az)" opacity=".7"/><text x="'+(padL+124)+'" y="'+(H-5)+'" font-size="9" font-weight="700" fill="var(--c3)">HH Medido</text>';
  svg+="</svg>";
  $("chartProdutividade").innerHTML=svg;
}

async function _renderCustoCC(){
  var el=$("chartCustoCC");if(!el)return;
  el.innerHTML='<div class="empty">⏳ Carregando custos do banco...</div>';
  try{
    var cli=ensureSupabaseClient();
    var oms;
    if(_selectedBM){
      var{data:matRows,error:mErr}=await cli.from("bm_materiais").select("*").eq("bm_numero",_selectedBM);
      if(mErr)throw mErr;
      var omMap={};
      (matRows||[]).forEach(function(r){
        if(!omMap[r.om_num])omMap[r.om_num]={num:r.om_num,titulo:r.titulo_om||"",cc:r.cc||"",materiais_usados:[]};
        omMap[r.om_num].materiais_usados.push({codigo:r.codigo,nome:r.descricao,descricao:r.descricao,tipo:r.ct2,unidade:r.unidade,qtd:r.qtd,precoUnit:r.vl_unitario,total:r.vl_total});
      });
      oms=Object.values(omMap);
    }else{
      var{data:omsData,error}=await cli.from("oms").select("num,titulo,cc,materiais_usados,materiais_total,status").order("num");
      if(error)throw error;
      oms=omsData||[];
    }
    if(!oms||!oms.length){el.innerHTML='<div class="empty">Nenhum material no '+ (_selectedBM?"BM "+_selectedBM:"banco")+'</div>';return;}
    var ccMap={};
    oms.forEach(function(om){
      var mats=safeParseArray(om.materiais_usados);
      if(!mats.length)return;
      var cc=om.cc||"Sem CC";
      mats.forEach(function(m){
      var tipo=m.tipo||"Pricelist";
      var total=parseFloat(m.total||0);
      if(!ccMap[cc])ccMap[cc]={pricelist:0,extraordinario:0,vale:0,oms:{}};
      if(tipo==="Extraordinário")ccMap[cc].extraordinario+=total;
      else if(tipo==="Material Vale")ccMap[cc].vale+=total;
      else ccMap[cc].pricelist+=total;
      if(!ccMap[cc].oms[om.num])ccMap[cc].oms[om.num]={titulo:om.titulo||"",mats:[]};
      ccMap[cc].oms[om.num].mats.push({cod:m.codigo||"—",desc:m.nome||m.descricao||"—",tipo:tipo,qtd:parseFloat(m.qtd||m.quantidade||0),preco:parseFloat(m.precoUnit||m.preco||0),total:total});
    });
  });
  var ccs=Object.keys(ccMap).sort();
  if(!ccs.length){el.innerHTML='<div class="empty">Nenhum material registrado</div>';return;}
  var h="";
  ccs.forEach(function(cc){
    var d=ccMap[cc];
    var totalCC=d.pricelist+d.extraordinario+d.vale;
    var omKeys=Object.keys(d.oms).sort();
    h+='<div style="background:#f8fafc;border:1.5px solid var(--c5);border-radius:12px;padding:14px;margin-bottom:12px">';
    h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:6px">';
    h+='<div style="font-size:14px;font-weight:900;color:var(--c1);font-family:\'JetBrains Mono\',monospace">CC '+esc(cc)+'</div>';
    h+='<div style="font-size:16px;font-weight:900;color:var(--b1);font-family:\'JetBrains Mono\',monospace">R$ '+totalCC.toFixed(2)+'</div>';
    h+='</div>';
    h+='<div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap">';
    if(d.pricelist>0)h+='<div style="background:var(--bc);padding:6px 12px;border-radius:8px;font-size:11px"><span style="font-weight:800;color:var(--b1)">Pricelist</span> <span style="font-weight:900;font-family:\'JetBrains Mono\',monospace;color:var(--b1)">R$ '+d.pricelist.toFixed(2)+'</span></div>';
    if(d.extraordinario>0)h+='<div style="background:#FFF3E0;padding:6px 12px;border-radius:8px;font-size:11px"><span style="font-weight:800;color:#e67e00">Extraordinário</span> <span style="font-weight:900;font-family:\'JetBrains Mono\',monospace;color:#e67e00">R$ '+d.extraordinario.toFixed(2)+'</span></div>';
    if(d.vale>0)h+='<div style="background:var(--vmc);padding:6px 12px;border-radius:8px;font-size:11px"><span style="font-weight:800;color:var(--vm)">Material Vale</span> <span style="font-weight:900;font-family:\'JetBrains Mono\',monospace;color:var(--vm)">R$ '+d.vale.toFixed(2)+'</span></div>';
    h+='</div>';
    h+='<div style="overflow-x:auto">';
    h+='<table style="width:100%;border-collapse:collapse;font-size:11px">';
    h+='<thead><tr style="background:var(--c6)">';
    h+='<th style="padding:6px 8px;text-align:left;font-size:10px;color:var(--c3);font-weight:800">OM</th>';
    h+='<th style="padding:6px 8px;text-align:left;font-size:10px;color:var(--c3);font-weight:800">Descrição OM</th>';
    h+='<th style="padding:6px 8px;text-align:left;font-size:10px;color:var(--c3);font-weight:800">Cód</th>';
    h+='<th style="padding:6px 8px;text-align:left;font-size:10px;color:var(--c3);font-weight:800">Material</th>';
    h+='<th style="padding:6px 8px;text-align:center;font-size:10px;color:var(--c3);font-weight:800">Tipo</th>';
    h+='<th style="padding:6px 8px;text-align:center;font-size:10px;color:var(--c3);font-weight:800">Qtd</th>';
    h+='<th style="padding:6px 8px;text-align:right;font-size:10px;color:var(--c3);font-weight:800">Unit.</th>';
    h+='<th style="padding:6px 8px;text-align:right;font-size:10px;color:var(--c3);font-weight:800">Total</th>';
    h+='</tr></thead><tbody>';
    omKeys.forEach(function(omNum){
      var omInfo=d.oms[omNum];
      omInfo.mats.forEach(function(m,mi){
        var tipoColor=m.tipo==="Material Vale"?"var(--vm)":m.tipo==="Extraordinário"?"#e67e00":"var(--b1)";
        var bg=mi%2===0?"#fff":"#f8fafc";
        h+='<tr style="background:'+bg+';border-bottom:1px solid var(--c6)">';
        if(mi===0)h+='<td style="padding:5px 8px;font-weight:800;color:var(--b1);font-family:monospace;vertical-align:top" rowspan="'+omInfo.mats.length+'">'+esc(omNum)+'</td><td style="padding:5px 8px;font-weight:600;color:var(--c2);vertical-align:top;max-width:160px" rowspan="'+omInfo.mats.length+'">'+esc(omInfo.titulo)+'</td>';
        h+='<td style="padding:5px 8px;font-family:monospace;font-weight:800;color:var(--c2)">'+esc(m.cod)+'</td>';
        h+='<td style="padding:5px 8px;color:var(--c2)">'+esc(m.desc)+'</td>';
        h+='<td style="padding:5px 8px;text-align:center;font-weight:800;color:'+tipoColor+';font-size:10px">'+esc(m.tipo)+'</td>';
        h+='<td style="padding:5px 8px;text-align:center;font-weight:700">'+m.qtd+'</td>';
        h+='<td style="padding:5px 8px;text-align:right;font-family:monospace">R$ '+m.preco.toFixed(2)+'</td>';
        h+='<td style="padding:5px 8px;text-align:right;font-weight:900;font-family:monospace;color:var(--c1)">R$ '+m.total.toFixed(2)+'</td>';
        h+='</tr>';
      });
    });
    h+='</tbody></table></div></div>';
  });
  el.innerHTML=h;
  }catch(e){el.innerHTML='<div class="empty">Erro: '+esc(e.message)+'</div>';}
}

function renderPasta(){
  var fin=dashboardData.reports;
  if(!fin.length){$("pastaList").innerHTML='<div class="empty">Nenhum relatório.</div>';return;}
  var h="";
  fin.forEach(function(r){
    var tags=[];
    if(r.status==="cancelada")tags.push(["Cancelamento","var(--vmc)","var(--vm)"]);else tags.push(["Execução","var(--bc)","var(--b1)"]);
    if(r.has_checklist)tags.push(["Checklist","var(--ac)","var(--az)"]);
    if(r.has_fotos)tags.push(["Fotográfico","var(--lc)","var(--lr)"]);
    if(r.has_nc)tags.push(["NC","var(--vmc)","var(--vm)"]);
    h+='<div class="pasta-item"><div style="font-size:26px">📄</div><div class="pasta-info"><div class="pasta-name">OM_'+r.num+'.pdf</div><div class="pasta-desc">'+(r.titulo||"")+" — "+(r.equipe||r.operador||"—")+'</div><div class="pasta-tags">';
    tags.forEach(function(t){h+='<span class="pasta-tag" style="background:'+t[1]+';color:'+t[2]+'">'+t[0]+"</span>";});
    h+='</div></div><div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;flex-shrink:0">';
    h+='<button class="btn-dl btn-ver" onclick="verPDFOficina(\'OM\',\''+r.num+'\')">Execução</button>';
    h+='<button class="btn-dl btn-baixar" onclick="downloadAllPDFs(\''+r.num+'\','+JSON.stringify(!!r.has_checklist)+','+JSON.stringify(!!r.has_nc)+','+JSON.stringify(!!r.has_relatorio)+')">⬇ Todos</button>';
    if(r.has_checklist)h+='<button class="btn-dl btn-ver" onclick="verPDFOficina(\'CK\',\''+r.num+'\')" style="background:#e3f2fd;color:#1565c0">CK</button>';
    if(r.has_nc)h+='<button class="btn-dl btn-ver" onclick="verPDFOficina(\'NC\',\''+r.num+'\')" style="background:#fde8ea;color:#c62828">NC</button>';
    h+='</div></div>';
  });
  $("pastaList").innerHTML=h;
}

function onOpenOM(num){var om=dashboardData.oms.find(function(o){return o.num===num;});if(!om)return;showOmModal(om);}

function _buildAdminTimelineHTML(historicoExecucao){
  var COR_ETAPA     = {CAMPO:'#378ADD',OFICINA:'#D85A30',MONTAGEM:'#1D9E75'};
  var COR_ETAPA_TXT = {CAMPO:'#185FA5',OFICINA:'#993C1D',MONTAGEM:'#0F6E56'};
  var etapas=[];
  for(var hi=0;hi<historicoExecucao.length;hi++){
    var h=historicoExecucao[hi];
    if(!h.dataInicio||!h.dataFim)continue;
    var tag=h.tag||'ATIVIDADE';
    var etapa='CAMPO';
    if(tag==='OFICINA'||tag==='OFICINA_FIM'||tag==='OFICINA_TROCA_TURNO'||tag==='OFICINA_DEVOLUCAO')etapa='OFICINA';
    else if(tag==='MONTAGEM')etapa='MONTAGEM';
    var iniMs=new Date(h.dataInicio).getTime();
    var fimMs=new Date(h.dataFim).getTime();
    etapas.push({etapa:etapa,executantes:h.executantes||[],iniMs:iniMs,fimMs:fimMs,
      iniStr:new Date(iniMs).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),
      fimStr:new Date(fimMs).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),
      cor:COR_ETAPA[etapa]||'#378ADD',corTxt:COR_ETAPA_TXT[etapa]||'#185FA5'});
  }
  if(!etapas.length)return '<div style="font-size:11px;color:#aaa;padding:8px 0;">Sem dados de execução.</div>';
  var globalIni=etapas[0].iniMs;
  var globalFim=etapas[etapas.length-1].fimMs;
  var range=globalFim-globalIni||1;
  function fmtMS(ms){var s=Math.round(ms/1000);var m=Math.floor(s/60),ss=s%60;return String(m).padStart(2,'0')+':'+String(ss).padStart(2,'0');}
  function fmtHoraMs(ms){var d=new Date(ms);return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');}
  var totalAtivoMs=0,totalOciosoMs=0;
  for(var ei=0;ei<etapas.length;ei++){
    var e=etapas[ei];
    e.durMs=Math.max(e.fimMs-e.iniMs,0);totalAtivoMs+=e.durMs;
    e.leftPct=((e.iniMs-globalIni)/range*100).toFixed(1);
    e.widthPct=Math.max((e.durMs/range*100),0.8).toFixed(1);
    if(ei<etapas.length-1){var gapMs=etapas[ei+1].iniMs-e.fimMs;if(gapMs>0){totalOciosoMs+=gapMs;e.gapMs=gapMs;e.gapLeft=((e.fimMs-globalIni)/range*100).toFixed(1);e.gapWidth=Math.max((gapMs/range*100),0.5).toFixed(1);}}
  }
  var html='<div class="tl-wrap">';
  html+='<div class="tl-row tl-hdr"><span>Etapa</span><span>Executantes</span><span>Horario</span><span>Timeline</span><span>Duracao</span></div>';
  for(var ri=0;ri<etapas.length;ri++){
    var e=etapas[ri];
    var execHtml=e.executantes.map(function(x){return esc(x);}).join('<br>');
    var barInner='<div class="tl-bar-bg"></div>';
    barInner+='<div class="tl-bar" style="left:'+e.leftPct+'%;width:'+e.widthPct+'%;background:'+e.cor+';"></div>';
    if(e.gapMs)barInner+='<div class="tl-gap" style="left:'+e.gapLeft+'%;width:'+e.gapWidth+'%;"><span>'+fmtMS(e.gapMs)+'</span></div>';
    html+='<div class="tl-row">';
    html+='<span class="tl-etapa" style="color:'+e.corTxt+'">'+e.etapa+'</span>';
    html+='<div class="tl-exec">'+execHtml+'</div>';
    html+='<div><div class="tl-hora">'+e.iniStr+'</div><div class="tl-hora">'+e.fimStr+'</div></div>';
    html+='<div class="tl-bar-wrap">'+barInner+'</div>';
    html+='<span class="tl-dur" style="color:'+e.corTxt+'">'+fmtMS(e.durMs)+'</span>';
    html+='</div>';
  }
  var nTicks=4,ticks='';
  for(var t=0;t<nTicks;t++)ticks+='<span>'+fmtHoraMs(globalIni+(range*t/(nTicks-1)))+'</span>';
  html+='<div class="tl-ticks">'+ticks+'</div>';
  html+='<div class="tl-footer">';
  html+='<div>Ativo: <strong>'+fmtMS(totalAtivoMs)+'</strong></div>';
  html+='<div>Ocioso: <strong>'+fmtMS(totalOciosoMs)+'</strong></div>';
  html+='<div>Total: <strong>'+((totalAtivoMs+totalOciosoMs)/3600000).toFixed(2)+'h</strong></div>';
  html+='</div></div>';
  return html;
}

function showOmModal(om){
  var stMap={enviada:["Enviada","#888"],em_execucao:["Em Execução","var(--az)"],pendente_assinatura:["Pend. Assinatura","var(--lr)"],finalizada:["Finalizada","var(--vd)"],cancelada:["Cancelada","var(--vm)"],em_oficina:["🔧 Em Oficina","#e65100"]};
  var st=stMap[om.status]||[om.status,"#888"];
  var omNum=safeNum(om.num);
  var executantes=safeParseArray(om.executantes);
  var materiais=safeParseArray(om.materiais_usados);
  var desviosOM=dashboardData.desvios.filter(function(d){return d.om_num===om.num;});
  $("modalTitle").innerHTML='<span style="font-family:JetBrains Mono,monospace;color:var(--b1)">'+esc(omNum)+"</span> — "+esc(om.titulo||"—");
  $("modalBtnDelete").onclick=function(){deleteOM(omNum);};
  var h='<div class="modal-section"><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:14px">';
  h+='<span style="background:'+escAttr(st[1])+';color:#fff;padding:5px 12px;border-radius:999px;font-size:11px;font-weight:900">'+esc(st[0])+"</span>";
  if(om.hh_total>0)h+='<span style="background:var(--bc);color:var(--b1);padding:5px 12px;border-radius:999px;font-size:11px;font-weight:900">⏱ '+Number(om.hh_total).toFixed(2)+"h</span>";
  if(om.materiais_total>0)h+='<span style="background:var(--lc);color:var(--lr);padding:5px 12px;border-radius:999px;font-size:11px;font-weight:900">R$ '+Number(om.materiais_total).toFixed(2)+"</span>";
  h+='</div><div class="detail-grid">';
  [["Equipamento",om.equipamento],["CC",om.cc],["Local",om.local_instalacao],["Plano",om.plano_cod],["Equipe",om.equipe||om.primeiro_executante],["Criado em",om.created_at?new Date(om.created_at).toLocaleString("pt-BR"):null]].forEach(function(row){if(row[1])h+='<div class="detail-item"><div class="detail-label">'+esc(row[0])+'</div><div class="detail-value">'+esc(row[1])+"</div></div>";});
  h+="</div></div>";
  if(executantes.length){h+='<div class="modal-section"><div class="modal-section-title">Executantes</div>';executantes.forEach(function(e){h+='<span class="exec-chip">👷 '+esc(e)+"</span>";});h+="</div>";}
  var histExec=safeParseArray(om.historico_execucao);
  if(histExec.length>1||om.em_oficina||om.retornouOficina){
    h+='<div class="modal-section"><div class="modal-section-title">Rastreabilidade do Fluxo</div>';
    h+=_buildAdminTimelineHTML(histExec);
    h+='</div>';
  }
  if(materiais.length){
    h+='<div class="modal-section"><div class="modal-section-title">Materiais Utilizados</div>';
    materiais.forEach(function(m){h+='<div class="mat-row"><span class="mat-nome">'+esc(m.nome||m.descricao||"—")+'</span><span class="mat-qtd">'+esc((m.qtd||0)+" "+(m.unidade||""))+"</span>";if(m.total)h+='<span class="mat-total">R$ '+Number(m.total).toFixed(2)+"</span>";h+="</div>";});
    h+="</div>";
  }
  if(desviosOM.length){
    h+='<div class="modal-section"><div class="modal-section-title">Desvios ('+desviosOM.length+")</div>";
    desviosOM.forEach(function(d){
      var c=DESVIO_COLORS[d.tipo]||["#888","#f5f5f5"];
      h+='<div style="background:'+escAttr(c[1])+';border-radius:10px;padding:10px 12px;margin-bottom:8px"><div style="font-size:11px;font-weight:900;color:'+escAttr(c[0])+'">'+esc(d.tipo||"DESVIO")+"</div>";
      if(d.descricao)h+='<div style="font-size:12px;color:var(--c2);margin-top:3px;font-weight:600">'+esc(d.descricao)+"</div>";
      if(d.tempo_parado_min)h+='<div style="font-size:11px;margin-top:3px;font-weight:700;color:var(--vm)">⏱ '+esc(d.tempo_parado_min)+" min</div>";
      if(d.foto_url){var fotoUrl=safeMediaUrl(d.foto_url);if(fotoUrl)h+='<div style="margin-top:6px"><img src="'+escAttr(fotoUrl)+'" style="max-width:100%;border-radius:8px;border:1px solid #ddd"></div>';}
      h+="</div>";
    });
    h+="</div>";
  }
  if(om.has_relatorio){
    h+='<div style="display:flex;gap:8px;margin-top:4px;flex-wrap:wrap">';
    h+='<button class="btn-a btn-primary" style="flex:1;justify-content:center" onclick="closeOmModal();viewPDF(\''+omNum+'\')">📄 Execução</button>';
    h+='<button class="btn-a btn-ghost" style="flex:1;justify-content:center" onclick="closeOmModal();downloadAllPDFs(\''+omNum+'\','+JSON.stringify(!!om.has_checklist)+','+JSON.stringify(!!om.has_nc)+','+JSON.stringify(!!om.has_relatorio)+')">⬇ Baixar Todos</button>';
    if(om.has_checklist)h+='<button class="btn-a btn-ghost" style="flex:1;justify-content:center;color:#1565c0" onclick="closeOmModal();verPDFOficina(\'CK\',\''+omNum+'\')">📋 Checklist</button>';
    if(om.has_nc)h+='<button class="btn-a btn-ghost" style="flex:1;justify-content:center;color:#c62828" onclick="closeOmModal();verPDFOficina(\'NC\',\''+omNum+'\')">⚠️ NC</button>';
    h+="</div>";
  }
  $("modalBody").innerHTML=h;
  $("omModal").classList.add("show");
}

function closeOmModal(){$("omModal").classList.remove("show");}

function renderFluxoBlock(containerId,oms,blockType){
  var el=document.getElementById(containerId);
  if(!oms||!oms.length){el.innerHTML='<div class="empty">Nenhuma OM.</div>';return;}
  var html='<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="background:var(--c6);">';
  ["OM","CC","Equipe","Executante","Material","Assinatura","Ações"].forEach(function(th){html+='<th style="padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase;color:var(--c3);font-weight:800">'+th+"</th>";});
  html+="</tr></thead><tbody>";
  oms.forEach(function(om,i){
    var mat=safeParseArray(om.materiais_usados);
    var exec=_execLabel(om);
    var hasMat=mat.length>0,hasSig=om.cliente_assinou;
    var bg=i%2===0?"#fff":"#fafafa";
    html+='<tr style="background:'+bg+';border-bottom:1px solid var(--c5);">';
    html+='<td style="padding:8px 10px"><span class="om-num">'+esc(om.num||"—")+"</span></td>";
    html+='<td style="padding:8px 10px;font-weight:700">'+esc(om.cc||"—")+"</td>";
    html+='<td style="padding:8px 10px;font-weight:700">'+esc(om.equipe||"—")+"</td>";
    html+='<td style="padding:8px 10px">'+esc(exec)+"</td>";
    html+='<td style="padding:8px 10px"><span style="font-size:10px;font-weight:900;padding:3px 8px;border-radius:999px;background:'+(hasMat?"#fff3cd":"#e8e8e8")+';color:'+(hasMat?"#856404":"#888")+'">'+(hasMat?"✓ "+mat.length+" item(s)":"Sem mat.")+"</span></td>";
    html+='<td style="padding:8px 10px"><span style="font-size:10px;font-weight:900;padding:3px 8px;border-radius:999px;background:'+(hasSig?"#d1e7dd":"#fde8ea")+';color:'+(hasSig?"#1A8754":"#dc3545")+'">'+(hasSig?"Assinou":"Pendente")+"</span></td>";
    html+='<td style="padding:8px 10px;text-align:right"><div style="display:flex;gap:5px;justify-content:flex-end;flex-wrap:wrap">';
    html+='<button onclick="abrirRelatorioFluxo(\''+om.num+'\')" class="btn-a btn-ghost" style="padding:5px 9px;font-size:10px">Ver</button>';
    if(blockType==="b1"){html+='<button onclick="editarMateriaisAdmin(\''+om.num+'\')" class="btn-a btn-ghost" style="padding:5px 9px;font-size:10px;color:var(--b1)">Editar Mat.</button>';html+='<button onclick="validarMaterial(\''+om.num+'\')" class="btn-a btn-green" style="padding:5px 9px;font-size:10px">Validar</button>';}
    if(blockType==="b2")html+='<button onclick="enviarParaFiscalSingle(\''+om.num+'\')" class="btn-a btn-primary" style="padding:5px 9px;font-size:10px">Enviar Fiscal</button>';
    if(blockType==="b3"){html+='<button onclick="editarMateriaisAdmin(\''+om.num+'\')" class="btn-a btn-ghost" style="padding:5px 9px;font-size:10px;color:var(--b1)">Editar Mat.</button>';html+='<button onclick="reenviarParaFiscal(\''+om.num+'\')" class="btn-a btn-orange" style="padding:5px 9px;font-size:10px">Reenviar</button>';}
    if(blockType==="b4")html+='<button onclick="toggleSelectB4(\''+om.num+'\',this)" class="btn-a btn-ghost" style="padding:5px 9px;font-size:10px" data-b4="'+om.num+'">Selecionar</button>';
    html+="</div></td></tr>";
  });
  html+="</tbody></table></div>";
  el.innerHTML=html;
}

function renderFluxoBlockOficina(containerId,oms){
  var el=document.getElementById(containerId);
  if(!oms||!oms.length){el.innerHTML='<div class="empty">Nenhuma OM em oficina.</div>';return;}
  var html='<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="background:#fff3e0">';
  ["OM","TAG","Equipe/CC","Executante","HH","Docs","Ações"].forEach(function(h){html+='<th style="padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase;color:#e65100;font-weight:800">'+h+"</th>";});
  html+="</tr></thead><tbody>";
  oms.forEach(function(om,i){
    var exec=_execLabel(om);
    var hh=typeof om.hh_total==="number"?om.hh_total.toFixed(2)+"h":"—";
    var bg=i%2===0?"#fffdf7":"#fff8ee";
    var numSafe=escAttr(om.num||"");
    var docBadges="";
    if(om.has_relatorio)docBadges+='<span style="display:inline-block;padding:2px 6px;border-radius:6px;font-size:10px;font-weight:900;background:#e3f2fd;color:#1565c0;margin-right:3px;cursor:pointer" onclick="verPDFOficina(\'OM\',\''+numSafe+'\')" title="Ver Relatório">📄 REL</span>';
    if(om.has_checklist)docBadges+='<span style="display:inline-block;padding:2px 6px;border-radius:6px;font-size:10px;font-weight:900;background:#e8f5e9;color:#2e7d32;margin-right:3px;cursor:pointer" onclick="verPDFOficina(\'CK\',\''+numSafe+'\')" title="Ver Checklist">📋 CK</span>';
    if(om.has_nc)docBadges+='<span style="display:inline-block;padding:2px 6px;border-radius:6px;font-size:10px;font-weight:900;background:#fde8ea;color:#c62828;margin-right:3px;cursor:pointer" onclick="verPDFOficina(\'NC\',\''+numSafe+'\')" title="Não Conformidade">⚠️ NC</span>';
    if(!docBadges)docBadges='<span style="color:#bbb;font-size:10px">Aguardando upload</span>';
    html+='<tr style="background:'+bg+';border-bottom:1px solid #ffe0b2">';
    html+='<td style="padding:8px 10px"><span class="om-num">'+esc(om.num||"—")+'</span><br><span style="font-size:10px;color:#999">'+esc(om.titulo||"")+"</span></td>";
    html+='<td style="padding:8px 10px;font-weight:800;color:#e65100">'+esc(om.local_instalacao||om.equipamento||"—")+"</td>";
    html+='<td style="padding:8px 10px;font-weight:700">'+esc(om.equipe||"—")+'<br><span style="font-size:10px;color:#999">'+esc(om.cc||"")+"</span></td>";
    html+='<td style="padding:8px 10px">'+esc(exec)+"</td>";
    html+='<td style="padding:8px 10px;font-weight:800">'+hh+"</td>";
    html+="<td style=\"padding:8px 10px\">"+docBadges+"</td>";
    html+='<td style="padding:8px 10px;text-align:right"><button onclick="abrirRelatorioFluxo(\''+om.num+'\')" class="btn-a btn-ghost" style="padding:5px 9px;font-size:10px">Detalhes</button></td>';
    html+="</tr>";
  });
  html+="</tbody></table></div>";
  el.innerHTML=html;
}

function renderFluxoBlockReprogramadas(containerId,oms){
  var el=document.getElementById(containerId);
  if(!oms||!oms.length){el.innerHTML='<div class="empty">Nenhuma OM reprogramada.</div>';return;}
  var html='<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="background:#f3e5f5">';
  ["OM","Equipe/CC","Executante","HH Parcial","Motivo","Docs","Ações"].forEach(function(h){html+='<th style="padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase;color:#7b1fa2;font-weight:800">'+h+"</th>";});
  html+="</tr></thead><tbody>";
  oms.forEach(function(om,i){
    var exec=_execLabel(om);
    var hh=typeof om.hh_total==="number"?om.hh_total.toFixed(2)+"h":"—";
    var motivo=esc(om.motivo_reprogramacao||"—");
    var bg=i%2===0?"#fdf5ff":"#f9eefe";
    var numSafe=escAttr(om.num||"");
    var docBadges=om.has_relatorio?'<span style="display:inline-block;padding:2px 6px;border-radius:6px;font-size:10px;font-weight:900;background:#e3f2fd;color:#1565c0;margin-right:3px;cursor:pointer" onclick="verPDFOficina(\'OM\',\''+numSafe+'\')">📄 REL</span>':'<span style="color:#bbb;font-size:10px">—</span>';
    html+='<tr style="background:'+bg+';border-bottom:1px solid #e1bee7">';
    html+='<td style="padding:8px 10px"><span class="om-num">'+esc(om.num||"—")+'</span><br><span style="font-size:10px;color:#999">'+esc(om.titulo||"")+"</span></td>";
    html+='<td style="padding:8px 10px;font-weight:700">'+esc(om.equipe||"—")+'<br><span style="font-size:10px;color:#999">'+esc(om.cc||"")+"</span></td>";
    html+='<td style="padding:8px 10px">'+esc(exec)+"</td>";
    html+='<td style="padding:8px 10px;font-weight:800;color:#7b1fa2">'+hh+"</td>";
    html+='<td style="padding:8px 10px;max-width:200px;word-break:break-word">'+motivo+"</td>";
    html+="<td style=\"padding:8px 10px\">"+docBadges+"</td>";
    html+='<td style="padding:8px 10px;text-align:right"><div style="display:flex;gap:5px;justify-content:flex-end"><button onclick="liberarReprogramada(\''+om.num+'\')" class="btn-a btn-green" style="padding:5px 9px;font-size:10px">▶ Liberar</button><button onclick="excluirReprogramada(\''+om.num+'\')" class="btn-a btn-danger" style="padding:5px 9px;font-size:10px">🗑 Excluir</button></div></td>';
    html+="</tr>";
  });
  html+="</tbody></table></div>";
  el.innerHTML=html;
}

function renderMatEditModal(){
  var el=document.getElementById("matEditRows");
  if(!_matEditData.length){el.innerHTML='<div class="empty">Nenhum material. Clique em + Adicionar.</div>';return;}
  var html='<div style="display:grid;grid-template-columns:60px 1fr 80px 60px 80px 60px 70px 32px;gap:4px;font-size:10px;font-weight:800;color:var(--c3);margin-bottom:6px;padding:0 2px"><div>Código</div><div>Descrição</div><div>Tipo</div><div>Qtd</div><div>VL Unit.</div><div>BDI%</div><div>Total</div><div></div></div>';
  _matEditData.forEach(function(m,i){
    var qtd=parseFloat(m.qtd||m.quantidade||1);
    var preco=parseFloat(m.precoUnit||m.preco||m.valor_unitario||0);
    var bdiP=parseFloat(m.bdiPercentual||0);
    var bdiV=preco*(bdiP/100);
    var total=qtd*(preco+bdiV);
    var tipo=m.tipo||"Pricelist";
    var tipoColor=tipo==="Material Vale"?"var(--vm)":tipo==="Extraordinário"?"#e67e00":"var(--b1)";
    html+='<div style="display:grid;grid-template-columns:60px 1fr 80px 60px 80px 60px 70px 32px;gap:4px;align-items:center;margin-bottom:4px;padding:6px;background:var(--c6);border-radius:8px">';
    html+='<div style="font-size:10px;font-weight:800;color:var(--b1);font-family:monospace">'+(m.codigo||"—")+"</div>";
    html+='<div style="position:relative"><input type="text" value="'+esc(m.nome||m.descricao||"")+'" oninput="_matEditData['+i+'].nome=this.value;_matEditData['+i+'].descricao=this.value;_mostrarSugestoes('+i+',this)" onfocus="_mostrarSugestoes('+i+',this)" placeholder="Buscar material..." style="padding:6px;border:1.5px solid var(--c5);border-radius:6px;font-size:11px;font-family:inherit;outline:none;min-width:0;width:100%;box-sizing:border-box"><div id="matSug_'+i+'" style="display:none;position:absolute;top:100%;left:0;right:0;background:#fff;border:1.5px solid var(--c5);border-radius:0 0 8px 8px;max-height:180px;overflow-y:auto;z-index:100;box-shadow:0 4px 12px rgba(0,0,0,.15)"></div></div>';
    html+='<select onchange="_matEditTipo('+i+',this.value)" style="padding:4px;border:1.5px solid var(--c5);border-radius:6px;font-size:10px;font-weight:800;color:'+tipoColor+';background:#fff"><option value="Pricelist"'+(tipo==="Pricelist"?" selected":"")+'>Pricelist</option><option value="Extraordinário"'+(tipo==="Extraordinário"?" selected":"")+'>Extraord.</option><option value="Material Vale"'+(tipo==="Material Vale"?" selected":"")+'>Mat. Vale</option></select>';
    html+='<input type="number" value="'+qtd+'" oninput="_matEditData['+i+'].qtd=parseFloat(this.value)||1;_matEditData['+i+'].quantidade=parseFloat(this.value)||1;renderMatEditModal()" style="padding:6px;border:1.5px solid var(--c5);border-radius:6px;font-size:11px;font-family:inherit;outline:none;width:100%;box-sizing:border-box">';
    html+='<input type="number" step="0.01" value="'+preco.toFixed(2)+'" oninput="_matEditData['+i+'].precoUnit=parseFloat(this.value)||0;_matEditData['+i+'].preco=parseFloat(this.value)||0;renderMatEditModal()" style="padding:6px;border:1.5px solid var(--c5);border-radius:6px;font-size:11px;font-family:inherit;outline:none;width:100%;box-sizing:border-box">';
    html+='<div style="font-size:10px;font-weight:700;color:var(--c3)">'+(bdiP>0?bdiP.toFixed(2)+"%":"—")+"</div>";
    html+='<div style="font-size:11px;font-weight:900;color:var(--c1);font-family:monospace">R$ '+total.toFixed(2)+"</div>";
    html+='<button onclick="_matEditData.splice('+i+",1);renderMatEditModal()\" style=\"padding:4px 8px;border:none;background:var(--vmc);color:var(--vm);border-radius:6px;cursor:pointer;font-size:12px;font-weight:900\">×</button>";
    html+="</div>";
  });
  var grandTotal=_matEditData.reduce(function(acc,m){var q=parseFloat(m.qtd||m.quantidade||1);var p=parseFloat(m.precoUnit||m.preco||0);var b=p*(parseFloat(m.bdiPercentual||0)/100);return acc+q*(p+b);},0);
  html+='<div style="text-align:right;font-size:14px;font-weight:900;color:var(--b1);margin-top:8px;padding:8px;background:var(--bc);border-radius:8px">TOTAL: R$ '+grandTotal.toFixed(2)+"</div>";
  el.innerHTML=html;
}

function _mostrarSugestoes(idx,input){
  var sug=document.getElementById("matSug_"+idx);
  if(!sug)return;
  var termo=input.value.trim();
  if(termo.length<2){sug.style.display="none";return;}
  _sugResultados=buscarMaterialPricelist(termo);
  if(!_sugResultados.length){sug.style.display="none";return;}
  var h="";
  _sugResultados.forEach(function(m,si){
    h+='<div onclick="_selecionarSug('+idx+','+si+')" style="padding:6px 10px;cursor:pointer;border-bottom:1px solid #f0f0f0;font-size:11px;transition:background .1s" onmouseover="this.style.background=\'#e3f2fd\'" onmouseout="this.style.background=\'#fff\'">';
    h+='<span style="font-weight:800;color:var(--b1);font-family:monospace;margin-right:6px">'+esc(m.item)+'</span>';
    h+='<span style="color:var(--c2)">'+esc(m.descricao)+'</span>';
    h+='<span style="float:right;font-weight:800;color:var(--vd)">R$ '+m.preco.toFixed(2)+'</span>';
    h+="</div>";
  });
  sug.innerHTML=h;
  sug.style.display="block";
}
function _selecionarSug(idx,si){
  var m=_sugResultados[si];if(!m)return;
  selecionarMaterialPricelist(idx,m);
}
function _matEditTipo(idx,val){
  _matEditData[idx].tipo=val;
  if(val==="Extraordinário"){
    var bdiEl=$("cfgBdi");
    var bdi=bdiEl?parseFloat(bdiEl.value||0):0;
    _matEditData[idx].bdiPercentual=bdi;
  }else if(val==="Material Vale"){
    _matEditData[idx].precoUnit=0;_matEditData[idx].preco=0;_matEditData[idx].bdiPercentual=0;
  }else{
    _matEditData[idx].bdiPercentual=0;
  }
  renderMatEditModal();
}

document.addEventListener("click",function(e){
  var sug=document.querySelectorAll("[id^=matSug_]");
  sug.forEach(function(s){if(!s.contains(e.target)&&!e.target.closest("[id^=matSug_]"))s.style.display="none";});
});

function editarMateriaisAdmin(num){
  matEditOM=num;
  var om=(fluxoData.b1.concat(fluxoData.b2,fluxoData.b3)).find(function(o){return o.num===num;});
  _matEditOriginal=om?JSON.parse(JSON.stringify(safeParseArray(om.materiais_usados))):[];
  _matEditData=JSON.parse(JSON.stringify(_matEditOriginal));
  renderMatEditModal();
  document.getElementById("matEditOMNum").textContent=num;
  document.getElementById("matEditModal").style.display="flex";
}

function adicionarMatLinha(){_matEditData.push({nome:"",descricao:"",codigo:"",qtd:1,quantidade:1,precoUnit:0,preco:0,unidade:"UN",tipo:"Pricelist",bdiPercentual:0,bdiValor:0});renderMatEditModal();}

function showHabilitarDispositivo(num){
  var om=dashboardData.oms.find(function(o){return o.num===num;});if(!om)return;
  _hdOmNum=num;_hdFalhaInicio=om.updated_at||null;
  $("hdOmNum").textContent=num;$("hdOmTitulo").textContent=om.titulo||"";
  var execArr=safeParseArray(om.executantes);
  $("hdExecAtual").textContent=execArr.length?execArr.join(", "):"—";
  $("hdTempoParado").textContent=_hdFalhaInicio?Math.max(0,Math.floor((Date.now()-new Date(_hdFalhaInicio).getTime())/60000))+" min parado(s)":"—";
  $("hdMesmaEquipe").checked=true;$("hdNovoExecRow").style.display="none";$("hdNovoExec").value="";
  $("hdModal").style.display="flex";
}

function hideHabilitarDispositivo(){$("hdModal").style.display="none";_hdOmNum=null;_hdFalhaInicio=null;}

function toggleSelectB4(num,btn){
  if(b4Selected[num]){delete b4Selected[num];btn.style.background="";btn.style.color="";btn.textContent="Selecionar";}
  else{b4Selected[num]=true;btn.style.background="var(--b1)";btn.style.color="#fff";btn.textContent="✓ Selecionado";}
}

function abrirRelatorioFluxo(num){
  var om=dashboardData.oms.find(function(o){return o.num===num;});
  if(om){showOmModal(om);return;}
  sb.from("oms").select("*").eq("num",num).single().then(function(res){if(res.data)showOmModal(res.data);});
}

function atualizarBmPreview(){
  var n=$("cfgBmNumero").value.trim(),di=$("cfgBmInicio").value,df=$("cfgBmFim").value;
  if(!n){$("cfgBmPreview").textContent="Informe o N° BM";return;}
  function fmt(d){if(!d)return"?";var p=d.split("-");return p[2]+"/"+p[1]+"/"+p[0];}
  $("cfgBmPreview").textContent="BM "+n+" — "+fmt(di)+" a "+fmt(df);
}

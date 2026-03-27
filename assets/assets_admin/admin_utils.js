function esc(str){if(str==null)return"";return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");}
var escAttr=esc; // alias semântico — mesmos 5 chars escapados, usado em atributos HTML
function safeNum(val){return val==null?"":String(val);}
function safeStorageOriginalPath(num){return"originais/"+safeNum(num)+".pdf";}
function safeMediaUrl(url){if(!url)return"";var s=String(url).trim();if(/^https?:\/\//i.test(s)||/^blob:/i.test(s)||/^data:image\//i.test(s))return s;return"";}
function $(id){return document.getElementById(id);}
function safeParseArray(val){try{return Array.isArray(val)?val:JSON.parse(val||"[]");}catch(e){return[];}}
function getOmHistorico(om){
  return safeParseArray(
    om&&(
      om.historico_execucao!=null?om.historico_execucao:
      om.historicoExecucao!=null?om.historicoExecucao:
      []
    )
  );
}
function getMaterialTotal(m){
  if(!m)return 0;
  var total=Number(
    m.total!=null?m.total:
    m.vl_total!=null?m.vl_total:
    m.valor_total!=null?m.valor_total:
    0
  )||0;
  if(total>0)return total;
  var qtd=Number(
    m.qtd!=null?m.qtd:
    m.quantidade!=null?m.quantidade:
    0
  )||0;
  var unit=Number(
    m.precoUnit!=null?m.precoUnit:
    m.preco!=null?m.preco:
    m.valor_unitario!=null?m.valor_unitario:
    m.vl_unitario!=null?m.vl_unitario:
    0
  )||0;
  var bdiP=Number(
    m.bdiPercentual!=null?m.bdiPercentual:
    m.bdi_percentual!=null?m.bdi_percentual:
    0
  )||0;
  var bdiV=Number(
    m.bdiValor!=null?m.bdiValor:
    m.bdi_valor!=null?m.bdi_valor:
    0
  )||0;
  if(!bdiV&&bdiP>0)bdiV=unit*(bdiP/100);
  return qtd*(unit+bdiV);
}
function getOmMateriais(om){
  var top=safeParseArray(
    om&&(
      om.materiais_usados!=null?om.materiais_usados:
      om.materiaisUsados!=null?om.materiaisUsados:
      []
    )
  );
  if(top.length)return top;
  var all=[];
  getOmHistorico(om).forEach(function(h){
    var mats=Array.isArray(h.materiaisUsados)
      ?h.materiaisUsados
      :safeParseArray(
        h.materiais_usados!=null?h.materiais_usados:
        h.materiaisUsados!=null?h.materiaisUsados:
        []
      );
    (mats||[]).forEach(function(m){all.push(m);});
  });
  return all;
}
function recalcOmMateriaisTotal(om){
  var mats=getOmMateriais(om);
  if(!mats.length)return Number((om&&om.materiais_total)||0)||0;
  return mats.reduce(function(acc,m){return acc+getMaterialTotal(m);},0);
}
function getOmBaseDate(om){
  var raw=(om&&(
    om.created_at||
    om.uploaded_at||
    om.data_upload||
    om.updated_at||
    om.data_execucao||
    om.data_finalizacao
  ))||"";
  if(!raw)return null;
  var d=new Date(raw);
  return isNaN(d.getTime())?null:d;
}
function _fmtNum(n){return n>=1000?(n/1000).toFixed(1)+"k":n.toFixed(0);}
function _equipeLabel(o){return o.equipe||(o.primeiro_executante?"Eq. "+o.primeiro_executante:null)||"Sem equipe";}
function _execLabel(o){var arr=safeParseArray(o.executantes);return arr.length?arr[0]:(o.primeiro_executante||"—");}
function adminToast(msg,type,dur){var ct=$("admin-toast");if(!ct)return;var colors={success:"linear-gradient(135deg,#1A5276,#2E86C1)",error:"linear-gradient(135deg,#dc3545,#e8575f)",warn:"linear-gradient(135deg,#e67e00,#f5a623)",info:"linear-gradient(135deg,#1565c0,#2196f3)"};var el=document.createElement("div");el.className="toast-item";el.style.background=colors[type]||colors.info;var txt=document.createElement("span");txt.style.flex="1";txt.textContent=String(msg==null?"":msg);var close=document.createElement("span");close.style.opacity=".6";close.style.fontSize="16px";close.textContent="×";el.appendChild(txt);el.appendChild(close);el.onclick=function(){el.classList.add("out");setTimeout(function(){if(el.parentNode)el.parentNode.removeChild(el);},300);};ct.appendChild(el);setTimeout(function(){el.classList.add("out");setTimeout(function(){if(el.parentNode)el.parentNode.removeChild(el);},300);},dur||3500);}
function forceDownloadBlob(blob,filename){var url=URL.createObjectURL(blob);var a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();document.body.removeChild(a);setTimeout(function(){URL.revokeObjectURL(url);},800);}
async function extrairNumOM(arquivo){var nomeSemExt=arquivo.name.replace(/\.pdf$/i,"");var match=nomeSemExt.match(/\d{12}/);if(match)return match[0];var num=prompt('Não encontrei o número da OM no nome do arquivo:\n"'+arquivo.name+'"\n\nDigite o número da OM (ex: 202600738291):','');if(!num)return null;num=num.trim().replace(/[^0-9]/g,"");return num.length>=6?num:null;}
function _svgDonut(el,segments,size){var r=size*0.38,cx=size/2,cy=size/2,sw=size*0.09;var total=segments.reduce(function(s,d){return s+d.val;},0);if(!total){el.innerHTML='<div class="empty" style="padding:40px">Sem dados</div>';return;}var svg='<svg width="'+size+'" height="'+size+'" viewBox="0 0 '+size+' '+size+'">';var C=2*Math.PI*r,offset=0;segments.forEach(function(seg){var pct=seg.val/total,dash=pct*C,gap=C-dash;var rot=(offset/total)*360-90;svg+='<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="'+seg.color+'" stroke-width="'+sw+'" stroke-dasharray="'+dash.toFixed(2)+' '+gap.toFixed(2)+'" transform="rotate('+rot.toFixed(1)+' '+cx+' '+cy+')" style="transition:stroke-dasharray .6s ease"/>';offset+=seg.val;});svg+='<text x="'+cx+'" y="'+(cy-4)+'" text-anchor="middle" font-size="'+(size*0.13)+'" font-weight="900" fill="var(--c1)">'+total+'</text>';svg+='<text x="'+cx+'" y="'+(cy+size*0.08)+'" text-anchor="middle" font-size="'+(size*0.055)+'" font-weight="700" fill="var(--c3)">TOTAL</text>';svg+='</svg>';var legend='<div style="display:flex;flex-direction:column;gap:6px;min-width:100px">';segments.forEach(function(seg){var pct=total>0?(seg.val/total*100).toFixed(0):0;legend+='<div style="display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;border-radius:3px;background:'+seg.color+';flex-shrink:0"></span><span style="font-size:11px;font-weight:700;color:var(--c2);flex:1">'+seg.label+'</span><span style="font-size:12px;font-weight:900;font-family:\'JetBrains Mono\',monospace;color:var(--c1)">'+seg.val+'</span><span style="font-size:10px;color:var(--c3);font-weight:700">'+pct+'%</span></div>';});legend+='</div>';el.innerHTML='<div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap;justify-content:center">'+svg+legend+'</div>';}

function goPage(pg,btn){
  document.querySelectorAll(".page").forEach(function(p){p.classList.remove("active");});
  $("pg-"+pg).classList.add("active");
  document.querySelectorAll(".nav-tab").forEach(function(b){b.classList.remove("active");});
  btn.classList.add("active");
  if(pg==="config")carregarConfig();
  if(pg==="equipes")renderEquipes();
  if(pg==="fluxo")loadFluxo();
  if(pg==="desvios")renderDesvios();
  if(pg==="analytics")renderAnalytics();
  if(pg==="bmreport")renderBMReport();
}

const ADMIN_ROUTE="admin_soberano.html";
const FIELD_ROUTE="PCM_MCR_v5.html";

function doLogout(){localStorage.removeItem(SESSION_KEY);window.location.replace(ADMIN_ROUTE);}

async function verificarAdmin(){
  try{
    ensureSupabaseClient();
    const sess=getSession();
    if(!sess){window.location.replace(ADMIN_ROUTE);return;}
    const res=await fetch(SUPABASE_URL+"/rest/v1/profiles?select=role,username&user_id=eq."+sess.user.id,{
      headers:{"apikey":SUPABASE_ANON_KEY,"Authorization":"Bearer "+sess.access_token}
    });
    if(!res.ok)throw new Error("Falha ao consultar perfil admin ("+res.status+")");
    const rows=await res.json();
    const profile=rows&&rows[0]?rows[0]:null;
    if(!profile||profile.role!=="admin"){window.location.replace(ADMIN_ROUTE);return;}
    await sb.auth.setSession({access_token:sess.access_token,refresh_token:sess.refresh_token||""});
    currentUser=profile.username||sess.username||"admin";
    $("app").style.display="block";
    $("userLabel").textContent=currentUser.toUpperCase();
    $("avatarLetter").textContent=currentUser[0].toUpperCase();
    loadDashboard();
    loadBMConfig();
    carregarPricelist();
    carregarBMsPeriodo();
    setInterval(function(){loadDashboard(true);},60000);
    _iniciarRealtime();
  }catch(e){
    console.error("Falha ao validar perfil admin:",e);
    alert("Falha ao validar acesso administrativo. Tente novamente.");
    window.location.replace(ADMIN_ROUTE);
  }
}

function _iniciarRealtime(){
  if(_realtimeChannel){sb.removeChannel(_realtimeChannel);_realtimeChannel=null;}
  _realtimeChannel=sb.channel("admin_oms_rt")
    .on("postgres_changes",{event:"*",schema:"public",table:"oms"},function(){
      clearTimeout(_realtimeDebounce);
      _realtimeDebounce=setTimeout(function(){
        var pg=document.querySelector(".nav-tab.active");
        var pgName=pg?pg.getAttribute("onclick"):"";
        if(pgName&&pgName.indexOf("fluxo")>=0)loadFluxo();
        else if(pgName&&pgName.indexOf("bmreport")>=0){loadDashboard(true);setTimeout(renderBMReport,500);}
        else loadDashboard(true);
        _piscarDotRealtime();
      },400);
    })
    .subscribe(function(status){
      var dot=document.getElementById("refreshDot");
      var lbl=document.getElementById("refreshLabel");
      if(status==="SUBSCRIBED"){if(dot)dot.style.background="#4caf50";if(lbl)lbl.textContent="ao vivo";}
      else if(status==="CHANNEL_ERROR"||status==="TIMED_OUT"){if(dot)dot.style.background="#dc3545";if(lbl)lbl.textContent="reconectando…";setTimeout(_iniciarRealtime,5000);}
    });
}

function _piscarDotRealtime(){
  var dot=document.getElementById("refreshDot");if(!dot)return;
  dot.style.background="#f5a623";dot.style.transform="scale(1.5)";
  setTimeout(function(){dot.style.background="#4caf50";dot.style.transform="";},600);
}

window.addEventListener("DOMContentLoaded",verificarAdmin);

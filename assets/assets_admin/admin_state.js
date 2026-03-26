if(window.pdfjsLib){pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";}

var SESSION_KEY="pcm_auth_session";
var SUPABASE_URL=(window.ENV&&window.ENV.SUPABASE_URL)||window.SUPABASE_URL||"";
var SUPABASE_ANON_KEY=(window.ENV&&window.ENV.SUPABASE_ANON_KEY)||window.SUPABASE_ANON_KEY||"";

function getSession() {
  try {
    var raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch(e) {
    console.warn('[ADMIN] Sessão inválida no storage:', e);
    return null;
  }
}
var sb=null;

function hasSupabaseClient(){return!!(window.supabase&&typeof window.supabase.createClient==="function");}
function ensureSupabaseClient(){if(sb)return sb;if(!SUPABASE_URL||!SUPABASE_ANON_KEY)throw new Error("Configuração Supabase ausente");if(!hasSupabaseClient())throw new Error("Biblioteca Supabase indisponível");sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);return sb;}

var currentUser=null,currentPipe=null;
var dashboardData={oms:[],reports:[],desvios:[]};

var PIPE_CFG=[
  {key:"enviada",icon:"📤",label:"Enviadas",color:"var(--c2)",bar:"#A0A7B4"},
  {key:"em_execucao",icon:"⚡",label:"Execução",color:"var(--az)",bar:"var(--az)"},
  {key:"pendente_assinatura",icon:"✍️",label:"Pendentes",color:"var(--lr)",bar:"var(--lr)"},
  {key:"finalizada",icon:"✅",label:"Finalizadas",color:"var(--vd)",bar:"var(--vd)"},
  {key:"cancelada",icon:"❌",label:"Canceladas",color:"var(--vm)",bar:"var(--vm)"}
];

var DESVIO_COLORS={"DISPOSITIVO EM FALHA":["#e67e00","#fff8e6"],"PAUSA":["#0d6efd","#e8f0fe"],"CANCELAMENTO":["#dc3545","#fde8ea"]};
var fluxoData={b1:[],b2:[],b3:[],b4:[],b5:[],b6:[]};
var matEditOM=null;
var _matEditData=[];
var _matEditOriginal=[];
var b4Selected={};
var lastPdfBlob=null;
var _realtimeChannel=null;
var _realtimeDebounce=null;
var _hdOmNum=null,_hdFalhaInicio=null;
var _adminPricelist=[];
var _selectedBM="";
var _showConcluidasPainel=false;
var _sugResultados=[];
var _currentPage=1;
var _pageSize=25;
var _advancedFiltersOpen=false;
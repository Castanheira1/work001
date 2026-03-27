#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

function read(relPath) {
  return fs.readFileSync(path.resolve(process.cwd(), relPath), "utf8");
}

function assertContains(haystack, needle, label) {
  if (!haystack.includes(needle)) {
    throw new Error("FALHOU: " + label + " (trecho não encontrado: " + needle + ")");
  }
}

function run() {
  const html = read("admin_soberano.html");
  const adminApi = read("assets/assets_admin/admin_api.js");
  const adminUtils = read("assets/assets_admin/admin_utils.js");
  const adminRender = read("assets/assets_admin/admin_render.js");
  const adminCore = read("assets/assets_admin/admin_core.js");
  const desvios = read("assets/pcm_mcr/pcm_desvios.js");
  const globals = read("assets/pcm_mcr/pcm_globals.js");
  const ui = read("assets/pcm_mcr/pcm_ui.js");
  const atividade = read("assets/pcm_mcr/pcm_atividade.js");

  assertContains(html, 'id="uploadModo"', "Filtro de upload no admin");
  assertContains(adminApi, 'modoUpload==="reprogramar"', "Branch de reprogramação no upload");
  assertContains(
    adminApi,
    "/column .* does not exist/i",
    "Fallback de compatibilidade para schema antigo (reprogramação)"
  );
  assertContains(
    adminApi,
    "dashboardData.oms=(oms||[]).map(function(o){o.materiais_total=recalcOmMateriaisTotal(o);return o;});",
    "Recálculo robusto de materiais no loadDashboard"
  );
  assertContains(
    adminApi,
    "var pathReprog=\"originais/\"+num+\".pdf\";",
    "Upload de PDF após validações no modo reprogramar"
  );
  assertContains(
    adminUtils,
    "function getOmHistorico(om)",
    "Helper de histórico da OM"
  );
  assertContains(
    adminUtils,
    "function recalcOmMateriaisTotal(om)",
    "Helper de recálculo de materiais da OM"
  );
  assertContains(
    adminRender,
    "_hdFalhaInicio=om.falha_inicio_dispositivo||om.lock_device_ts||om.updated_at||null;",
    "Fallback mais confiável para início de falha"
  );
  assertContains(
    adminCore,
    "const ADMIN_ROUTE=\"admin_soberano.html\";",
    "Rota padrão do admin"
  );
  assertContains(
    adminCore,
    "window.location.href=ADMIN_ROUTE",
    "Redirects do admin apontando para rota de admin"
  );

  assertContains(desvios, "tentativa_numero", "Tentativa enviada no payload de desvio");
  assertContains(
    desvios,
    "/tentativa_numero/i.test(msg)",
    "Fallback de compatibilidade para coluna tentativa_numero ausente"
  );

  assertContains(
    globals,
    "!(currentOM.checklistDados && currentOM.checklistDados.length > 0)",
    "Checklist não deve autoabrir quando já salvo (fluxo global)"
  );
  assertContains(
    ui,
    "!(currentOM.checklistDados && currentOM.checklistDados.length > 0)",
    "Checklist não deve autoabrir em oficina quando já salvo"
  );
  assertContains(
    atividade,
    "NOVA_TENTATIVA_INICIADA",
    "Rastreabilidade de nova tentativa após desvio"
  );

  console.log("OK: smoke_reprogram_desvio_check passou em todas as validações.");
}

try {
  run();
} catch (e) {
  console.error(String((e && e.message) || e));
  process.exit(1);
}

#!/usr/bin/env node
/**
 * analisar.js — Auditoria estática de código
 * Uso: node analisar.js
 * Gera: relatorio_auditoria.html
 */

const fs   = require('fs');
const path = require('path');

const ROOT = __dirname;

// Arquivos JS a analisar (relativos à raiz)
const JS_FILES = [
  'assets/app_bootstrap.js',
  'assets/env-loader.js',
  'assets/pcm_auth.js',
  'assets/pcm_storage.js',
  'assets/pcm_mcr_utils.js',
  'assets/pcm_mcr_constants.js',
  'assets/sync_engine.js',
  'assets/toast.js',
  'assets/pcm_mcr/pcm_init.js',
  'assets/pcm_mcr/pcm_globals.js',
  'assets/pcm_mcr/pcm_ui.js',
  'assets/pcm_mcr/pcm_sync_push.js',
  'assets/pcm_mcr/pcm_pdf_gerar.js',
  'assets/pcm_mcr/pcm_pdf_import.js',
  'assets/pcm_mcr/pcm_desvios.js',
  'assets/pcm_mcr/pcm_finalizar.js',
  'assets/pcm_mcr/pcm_atividade.js',
  'assets/pcm_mcr/pcm_checklist.js',
  'assets/pcm_mcr/pcm_materiais.js',
  'assets/pcm_mcr/pcm_realtime.js',
  'assets/assets_admin/admin_api.js',
  'assets/assets_admin/admin_core.js',
  'assets/assets_admin/admin_events.js',
  'assets/assets_admin/admin_render.js',
  'assets/assets_admin/admin_state.js',
  'assets/assets_admin/admin_utils.js',
];

const HTML_FILES = [
  'PCM_MCR_v5.html',
  'admin_soberano.html',
  'fiscal_soberano.html',
];

// Globais conhecidas do projeto
const KNOWN_GLOBALS = [
  'currentOM','oms','uploadedFiles','executantesNomes',
  'deslocamentoSegundos','deslocamentoMinutos','checklistFotos',
  'materiaisUsados','_desvioFotoBase64','_desativarFotoBase64',
  '_omNumCancelDesvio','_desvioTipoAtual',
];

// Magic numbers a ignorar (contexto trivial)
const TRIVIAL_NUMBERS = new Set([0,1,2,10,100,1000]);

// ─── Funções de detecção ───────────────────────────────────────────────────

function detectFileSize(lines, file) {
  const issues = [];
  if (lines.length > 800) {
    issues.push({ line: 1, sev: 'alta',   cat: 'Arquivo grande',   msg: `${lines.length} linhas — considere dividir em módulos menores` });
  } else if (lines.length > 400) {
    issues.push({ line: 1, sev: 'media',  cat: 'Arquivo grande',   msg: `${lines.length} linhas — arquivo acima do recomendado (400)` });
  } else if (lines.length > 250) {
    issues.push({ line: 1, sev: 'baixa',  cat: 'Arquivo grande',   msg: `${lines.length} linhas — monitorar crescimento` });
  }
  return issues;
}

function detectLegacyVar(lines) {
  const linesFound = [];
  lines.forEach((l, i) => {
    if (/^\s*var\s+/.test(l) && !/^\s*\/\//.test(l)) linesFound.push(i+1);
  });
  if (linesFound.length === 0) return [];
  const sev = linesFound.length > 30 ? 'alta' : linesFound.length > 10 ? 'media' : 'baixa';
  const examples = linesFound.slice(0, 3).join(', ');
  return [{ line: linesFound[0], sev, cat: 'Legacy var', msg: `${linesFound.length} declarações 'var' (ex: linhas ${examples}) — prefira 'const'/'let'` }];
}

function detectLongFunctions(lines) {
  const issues = [];
  // Detecta abertura de função e conta linhas até fechar o bloco
  const funcStarts = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    // function keyword ou arrow com bloco
    if (/\bfunction\b.*\{/.test(l) || /=>\s*\{/.test(l)) {
      // tenta extrair nome
      const nameMatch = l.match(/function\s+(\w+)/) || l.match(/(?:var|let|const|window\.)\s+(\w+)\s*=/) || l.match(/(\w+)\s*[:=]\s*(?:async\s+)?function/);
      const name = nameMatch ? nameMatch[1] : '(anônima)';
      funcStarts.push({ start: i, name, depth: 0, opens: 0, closes: 0 });
    }
  }

  // Para cada função, contar linhas até fechar o bloco raiz
  funcStarts.forEach(fn => {
    let depth = 0;
    let end = fn.start;
    for (let i = fn.start; i < lines.length; i++) {
      const stripped = lines[i].replace(/(['"`])(?:(?!\1)[^\\]|\\.)*\1/g, '""').replace(/\/\/.*$/, '');
      for (const ch of stripped) {
        if (ch === '{') depth++;
        if (ch === '}') { depth--; if (depth === 0) { end = i; break; } }
      }
      if (depth === 0 && i > fn.start) break;
    }
    const len = end - fn.start + 1;
    if (len > 100) {
      issues.push({ line: fn.start+1, sev: 'alta',  cat: 'Função longa', msg: `'${fn.name}' tem ${len} linhas — refatorar em funções menores` });
    } else if (len > 60) {
      issues.push({ line: fn.start+1, sev: 'media', cat: 'Função longa', msg: `'${fn.name}' tem ${len} linhas — considere extrair trechos` });
    }
  });
  return issues;
}

function detectMagicNumbers(lines) {
  const found = new Map(); // n -> first line
  lines.forEach((l, i) => {
    if (/^\s*\/\//.test(l) || /^\s*\*/.test(l)) return;
    if (/^\s*(?:const|var|let)\s+[A-Z_]+\s*=/.test(l)) return;
    const matches = l.matchAll(/(?<![.\w])(\d{3,})\b/g);
    for (const m of matches) {
      const n = parseInt(m[1]);
      if (!TRIVIAL_NUMBERS.has(n) && !found.has(n)) found.set(n, i+1);
    }
  });
  if (found.size === 0) return [];
  const nums = [...found.entries()].sort((a,b) => a[1]-b[1]).slice(0, 8);
  const sev = found.size > 10 ? 'media' : 'baixa';
  const list = nums.map(([n, l]) => `${n} (linha ${l})`).join(', ');
  return [{ line: nums[0][1], sev, cat: 'Magic number', msg: `${found.size} números sem constante nomeada: ${list}` }];
}

function detectGlobals(lines) {
  const issues = [];
  KNOWN_GLOBALS.forEach(g => {
    lines.forEach((l, i) => {
      if (/^\s*\/\//.test(l)) return;
      // Procura mutação direta: global = ..., global.push, global.splice
      const mutPat = new RegExp(`\\b${g}\\s*=(?!=)|\\b${g}\\.(push|splice|pop|shift|unshift)\\(`);
      if (mutPat.test(l)) {
        issues.push({ line: i+1, sev: 'media', cat: 'Global mutada', msg: `Mutação direta de '${g}' — considere encapsular em módulo`, snippet: l.trim().slice(0,80) });
      }
    });
  });
  return issues;
}

function detectSilentCatch(lines) {
  const issues = [];
  for (let i = 0; i < lines.length; i++) {
    if (/\}\s*catch\s*\(/.test(lines[i]) || /\bcatch\s*\(/.test(lines[i])) {
      // Olhar as próximas 3 linhas
      const body = lines.slice(i+1, i+4).join(' ');
      if (/^\s*\}\s*$/.test(lines[i+1]) || /catch\s*\([^)]+\)\s*\{\s*\}/.test(lines[i]) || /catch\s*\([^)]+\)\s*\{\s*return\s+(null|false|undefined|''|""|0)\s*;?\s*\}/.test(body)) {
        issues.push({ line: i+1, sev: 'alta', cat: 'Erro silenciado', msg: 'catch vazio ou com return trivial — erro descartado silenciosamente', snippet: lines[i].trim() });
      }
    }
  }
  return issues;
}

function detectAsyncWithoutTryCatch(lines) {
  const issues = [];
  for (let i = 0; i < lines.length; i++) {
    if (/\basync\s+function\b|\basync\s+\(/.test(lines[i])) {
      // Verificar se existe try { nos próximos 10 linhas
      const ahead = lines.slice(i+1, i+15).join('\n');
      if (!/\btry\s*\{/.test(ahead)) {
        const nameMatch = lines[i].match(/function\s+(\w+)/) || lines[i].match(/(?:var|let|const)\s+(\w+)\s*=/);
        const name = nameMatch ? nameMatch[1] : '(anônima)';
        issues.push({ line: i+1, sev: 'media', cat: 'Async sem try/catch', msg: `Função async '${name}' sem try/catch visível`, snippet: lines[i].trim().slice(0,80) });
      }
    }
  }
  return issues;
}

function detectFetchWithoutCatch(lines) {
  const issues = [];
  const text = lines.join('\n');
  // Encontra fetch( sem .catch( nas próximas linhas próximas
  lines.forEach((l, i) => {
    if (/\bfetch\s*\(/.test(l) && !/^\s*\/\//.test(l)) {
      const block = lines.slice(i, Math.min(i+15, lines.length)).join('\n');
      if (!/.catch\s*\(/.test(block)) {
        issues.push({ line: i+1, sev: 'media', cat: 'fetch sem .catch()', msg: 'Chamada fetch() sem .catch() próximo — rejeição não tratada', snippet: l.trim().slice(0,80) });
      }
    }
  });
  return issues;
}

function detectInlineHTML(lines) {
  const issues = [];
  lines.forEach((l, i) => {
    if (issues.length >= 4) return;
    if (/^\s*\/\//.test(l)) return;
    if (/`[^`]*<(div|table|style|form|button|span|input|select)\b/.test(l) || /innerHTML\s*[+=]/.test(l)) {
      issues.push({ line: i+1, sev: 'baixa', cat: 'HTML inline em JS', msg: 'HTML embutido em template literal ou innerHTML — dificulta manutenção', snippet: l.trim().slice(0,80) });
    }
  });
  return issues;
}

function detectDebtComments(lines) {
  const issues = [];
  const markers = /\b(TODO|FIXME|HACK|GAMBIARRA|WORKAROUND|XXX|TEMP|v1\b|v2\b|fluxo\s+v\d)/i;
  lines.forEach((l, i) => {
    if (markers.test(l)) {
      issues.push({ line: i+1, sev: 'baixa', cat: 'Comentário de dívida', msg: 'Marcador de dívida técnica encontrado', snippet: l.trim().slice(0,80) });
    }
  });
  return issues;
}

function detectCDNDependencies(lines, file) {
  if (!file.endsWith('.html')) return [];
  const issues = [];
  lines.forEach((l, i) => {
    if (/<script[^>]+src=['"][^'"]*(?:cdnjs|jsdelivr|unpkg|cdn\.)[^'"]*['"]/i.test(l)) {
      const urlMatch = l.match(/src=['"]([^'"]+)['"]/);
      issues.push({ line: i+1, sev: 'baixa', cat: 'CDN externo', msg: `Dependência de CDN externo — risco de indisponibilidade: ${urlMatch ? urlMatch[1].split('/').pop() : ''}`, snippet: l.trim().slice(0,80) });
    }
  });
  return issues;
}

// ─── Detecção de duplicação por hash de blocos ─────────────────────────────

function buildBlockHashes(allFiles) {
  // Extrai blocos de 8+ linhas e agrupa por hash
  const blockMap = {}; // hash -> [{file, startLine}]
  const BLOCK_SIZE = 8;
  allFiles.forEach(({ file, lines }) => {
    for (let i = 0; i <= lines.length - BLOCK_SIZE; i++) {
      const block = lines.slice(i, i + BLOCK_SIZE)
        .map(l => l.trim())
        .filter(l => l && !l.startsWith('//'))
        .join('\n');
      if (block.length < 120) continue; // muito curto
      // Hash simples: djb2
      let h = 5381;
      for (let c = 0; c < block.length; c++) h = ((h << 5) + h) + block.charCodeAt(c);
      h = h >>> 0;
      if (!blockMap[h]) blockMap[h] = [];
      // Evitar duplicar entradas do mesmo arquivo próximas
      const last = blockMap[h][blockMap[h].length - 1];
      if (!last || last.file !== file || (i - last.startLine) > BLOCK_SIZE) {
        blockMap[h].push({ file, startLine: i + 1, preview: block.slice(0, 100) });
      }
    }
  });
  // Retorna apenas hashes com 2+ ocorrências em arquivos diferentes
  const dups = [];
  Object.values(blockMap).forEach(entries => {
    const files = new Set(entries.map(e => e.file));
    if (files.size >= 2) {
      dups.push(entries);
    }
  });
  return dups;
}

// ─── Análise por arquivo ───────────────────────────────────────────────────

function analyzeFile(relPath) {
  const absPath = path.join(ROOT, relPath);
  if (!fs.existsSync(absPath)) return null;
  const src  = fs.readFileSync(absPath, 'utf8');
  const lines = src.split('\n');
  const isHTML = relPath.endsWith('.html');

  let issues = [];
  issues = issues.concat(detectFileSize(lines, relPath));
  if (!isHTML) {
    issues = issues.concat(detectLegacyVar(lines));
    issues = issues.concat(detectLongFunctions(lines));
    issues = issues.concat(detectMagicNumbers(lines));
    issues = issues.concat(detectGlobals(lines));
    issues = issues.concat(detectSilentCatch(lines));
    issues = issues.concat(detectAsyncWithoutTryCatch(lines));
    issues = issues.concat(detectFetchWithoutCatch(lines));
    issues = issues.concat(detectInlineHTML(lines));
    issues = issues.concat(detectDebtComments(lines));
  }
  if (isHTML) {
    issues = issues.concat(detectCDNDependencies(lines, relPath));
    issues = issues.concat(detectDebtComments(lines));
  }

  // Score: 100 - penalidades
  const pen = { alta: 8, media: 3, baixa: 1 };
  const penalty = issues.reduce((s, i) => s + (pen[i.sev] || 0), 0);
  const score = Math.max(0, 100 - penalty);

  return { file: relPath, lines: lines.length, issues, score, src, linesArr: lines };
}

// ─── Main ──────────────────────────────────────────────────────────────────

const allPaths = [...JS_FILES, ...HTML_FILES];
const results = allPaths.map(analyzeFile).filter(Boolean);

// Duplicações
const dups = buildBlockHashes(results.map(r => ({ file: r.file, lines: r.linesArr })));

// Estatísticas globais
const totalIssues = results.reduce((s, r) => s + r.issues.length, 0);
const byCategory = {};
results.forEach(r => r.issues.forEach(i => {
  byCategory[i.cat] = (byCategory[i.cat] || 0) + 1;
}));
const globalScore = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length);

// Top 10 funções mais longas — extrair de results
const longFns = [];
results.forEach(r => {
  r.issues.filter(i => i.cat === 'Função longa').forEach(i => {
    const lenMatch = i.msg.match(/tem (\d+) linhas/);
    longFns.push({ file: r.file, line: i.line, name: i.msg.split("'")[1] || '', len: lenMatch ? parseInt(lenMatch[1]) : 0, sev: i.sev });
  });
});
longFns.sort((a, b) => b.len - a.len);
const top10 = longFns.slice(0, 10);

// ─── Geração do HTML ───────────────────────────────────────────────────────

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function sevBadge(sev) {
  const map = { alta: ['#e74c3c','Alta'], media: ['#e67e22','Média'], baixa: ['#27ae60','Baixa'] };
  const [col, label] = map[sev] || ['#999','?'];
  return `<span style="background:${col};color:#fff;padding:1px 7px;border-radius:10px;font-size:11px;font-weight:700">${label}</span>`;
}

function scoreColor(s) {
  if (s >= 80) return '#27ae60';
  if (s >= 50) return '#e67e22';
  return '#e74c3c';
}

const now = new Date().toLocaleString('pt-BR');

const catOrder = Object.entries(byCategory).sort((a,b) => b[1]-a[1]);
const maxCatCount = catOrder.length ? catOrder[0][1] : 1;

const catBars = catOrder.map(([cat, count]) => {
  const pct = Math.round((count / maxCatCount) * 100);
  return `
    <div style="margin-bottom:6px">
      <div style="display:flex;align-items:center;gap:8px">
        <div style="width:180px;font-size:12px;color:#555;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(cat)}</div>
        <div style="flex:1;background:#eee;border-radius:4px;height:16px">
          <div style="width:${pct}%;background:#2c7be5;height:16px;border-radius:4px;transition:width .3s"></div>
        </div>
        <div style="width:30px;font-size:12px;font-weight:700;color:#333">${count}</div>
      </div>
    </div>`;
}).join('');

const fileCards = results.map(r => {
  if (r.issues.length === 0) return '';
  const issueRows = r.issues.map(i =>
    `<tr class="issue-row" data-sev="${i.sev}" data-cat="${esc(i.cat)}">
      <td style="padding:4px 8px;font-size:12px;color:#777;white-space:nowrap">${i.line}</td>
      <td style="padding:4px 8px">${sevBadge(i.sev)}</td>
      <td style="padding:4px 8px;font-size:12px;color:#2c7be5;font-weight:600;white-space:nowrap">${esc(i.cat)}</td>
      <td style="padding:4px 8px;font-size:12px;color:#333">${esc(i.msg)}${i.snippet ? `<br><code style="font-size:10px;color:#888;background:#f5f5f5;padding:1px 4px;border-radius:3px">${esc(i.snippet)}</code>` : ''}</td>
    </tr>`
  ).join('');

  const alta  = r.issues.filter(i => i.sev==='alta').length;
  const media = r.issues.filter(i => i.sev==='media').length;
  const baixa = r.issues.filter(i => i.sev==='baixa').length;

  return `
  <div class="file-card" style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;margin-bottom:16px;overflow:hidden">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:#f8f9fa;border-bottom:1px solid #e0e0e0;cursor:pointer" onclick="toggleCard(this)">
      <div>
        <span style="font-size:13px;font-weight:700;color:#2c3e50">${esc(r.file)}</span>
        <span style="font-size:11px;color:#888;margin-left:8px">${r.lines} linhas</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        ${alta  ? `<span style="background:#e74c3c;color:#fff;padding:1px 8px;border-radius:10px;font-size:11px">${alta} alta</span>` : ''}
        ${media ? `<span style="background:#e67e22;color:#fff;padding:1px 8px;border-radius:10px;font-size:11px">${media} média</span>` : ''}
        ${baixa ? `<span style="background:#27ae60;color:#fff;padding:1px 8px;border-radius:10px;font-size:11px">${baixa} baixa</span>` : ''}
        <span style="font-size:18px;font-weight:700;color:${scoreColor(r.score)}">${r.score}</span>
        <span style="font-size:11px;color:#888">▼</span>
      </div>
    </div>
    <div class="card-body">
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:#f0f4f8">
          <th style="padding:4px 8px;font-size:11px;color:#888;text-align:left">Linha</th>
          <th style="padding:4px 8px;font-size:11px;color:#888;text-align:left">Sev.</th>
          <th style="padding:4px 8px;font-size:11px;color:#888;text-align:left">Categoria</th>
          <th style="padding:4px 8px;font-size:11px;color:#888;text-align:left">Detalhe</th>
        </tr></thead>
        <tbody>${issueRows}</tbody>
      </table>
    </div>
  </div>`;
}).join('');

const dupSection = dups.length === 0 ? '<p style="color:#888;font-style:italic">Nenhuma duplicação significativa encontrada.</p>' :
  dups.slice(0, 20).map((entries, idx) => {
    const preview = esc(entries[0].preview.slice(0, 120));
    const locs = entries.map(e => `<code>${esc(e.file)}:${e.startLine}</code>`).join(' &nbsp;·&nbsp; ');
    return `<div style="background:#fff;border:1px solid #ffd;border-radius:6px;padding:10px 14px;margin-bottom:10px">
      <div style="font-size:12px;color:#777;margin-bottom:4px">${locs}</div>
      <pre style="margin:0;font-size:11px;background:#fafafa;padding:6px 8px;border-radius:4px;overflow:auto;white-space:pre-wrap;color:#555">${preview}…</pre>
    </div>`;
  }).join('');

const top10Rows = top10.map(f =>
  `<tr>
    <td style="padding:5px 10px;font-size:12px;color:#2c7be5;font-weight:600">${esc(f.name)}</td>
    <td style="padding:5px 10px;font-size:12px;color:#333">${esc(f.file)}</td>
    <td style="padding:5px 10px;font-size:12px;text-align:center">${f.line}</td>
    <td style="padding:5px 10px;font-size:12px;font-weight:700;color:${f.sev==='alta'?'#e74c3c':'#e67e22'}">${f.len}</td>
  </tr>`
).join('');

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Auditoria de Código — Soberano MCR</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f0f4f8;color:#222;padding:24px}
.container{max-width:960px;margin:0 auto}
h1{font-size:22px;font-weight:800;color:#1a2a3a;margin-bottom:4px}
h2{font-size:16px;font-weight:700;color:#2c3e50;margin:24px 0 12px}
.card{background:#fff;border-radius:10px;padding:20px;box-shadow:0 1px 4px rgba(0,0,0,.08);margin-bottom:20px}
.score-big{font-size:52px;font-weight:900;line-height:1}
.meta{font-size:12px;color:#888;margin-bottom:20px}
.stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:20px}
.stat{background:#f8f9fa;border-radius:8px;padding:12px 16px;text-align:center}
.stat .val{font-size:28px;font-weight:800}
.stat .lbl{font-size:11px;color:#888;margin-top:2px}
.card-body{padding:0}
.filters{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
.filters button{padding:4px 12px;border:1px solid #ddd;border-radius:16px;background:#fff;cursor:pointer;font-size:12px}
.filters button.active{background:#2c7be5;color:#fff;border-color:#2c7be5}
pre{white-space:pre-wrap;word-break:break-all}
</style>
</head>
<body>
<div class="container">

<div class="card">
  <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:16px">
    <div>
      <h1>Auditoria de Código</h1>
      <div class="meta">Gerado em ${now} &nbsp;·&nbsp; ${results.length} arquivos analisados &nbsp;·&nbsp; ${totalIssues} issues encontrados</div>
      <div class="stat-grid">
        <div class="stat"><div class="val" style="color:#e74c3c">${results.reduce((s,r)=>s+r.issues.filter(i=>i.sev==='alta').length,0)}</div><div class="lbl">Issues Altas</div></div>
        <div class="stat"><div class="val" style="color:#e67e22">${results.reduce((s,r)=>s+r.issues.filter(i=>i.sev==='media').length,0)}</div><div class="lbl">Issues Médias</div></div>
        <div class="stat"><div class="val" style="color:#27ae60">${results.reduce((s,r)=>s+r.issues.filter(i=>i.sev==='baixa').length,0)}</div><div class="lbl">Issues Baixas</div></div>
        <div class="stat"><div class="val" style="color:#888">${dups.length}</div><div class="lbl">Duplicações</div></div>
      </div>
    </div>
    <div style="text-align:center">
      <div class="score-big" style="color:${scoreColor(globalScore)}">${globalScore}</div>
      <div style="font-size:12px;color:#888;margin-top:4px">Score de Saúde<br>(0–100)</div>
    </div>
  </div>
</div>

<div class="card">
  <h2 style="margin-top:0">Issues por Categoria</h2>
  ${catBars}
</div>

${top10.length > 0 ? `
<div class="card">
  <h2 style="margin-top:0">Top 10 Funções Mais Longas</h2>
  <table style="width:100%;border-collapse:collapse">
    <thead><tr style="background:#f0f4f8">
      <th style="padding:5px 10px;font-size:11px;color:#888;text-align:left">Função</th>
      <th style="padding:5px 10px;font-size:11px;color:#888;text-align:left">Arquivo</th>
      <th style="padding:5px 10px;font-size:11px;color:#888;text-align:center">Linha</th>
      <th style="padding:5px 10px;font-size:11px;color:#888;text-align:center">Linhas</th>
    </tr></thead>
    <tbody>${top10Rows}</tbody>
  </table>
</div>` : ''}

<h2>Issues por Arquivo</h2>
<div class="filters">
  <button class="active" onclick="filterSev('all',this)">Todos</button>
  <button onclick="filterSev('alta',this)" style="color:#e74c3c;border-color:#e74c3c">Alta</button>
  <button onclick="filterSev('media',this)" style="color:#e67e22;border-color:#e67e22">Média</button>
  <button onclick="filterSev('baixa',this)" style="color:#27ae60;border-color:#27ae60">Baixa</button>
</div>
${fileCards || '<p style="color:#888;font-style:italic">Nenhum issue encontrado.</p>'}

<div class="card">
  <h2 style="margin-top:0">Lógica Duplicada (${dups.length} blocos)</h2>
  ${dupSection}
</div>

</div>
<script>
function toggleCard(header) {
  var body = header.nextElementSibling;
  var arrow = header.querySelector('span:last-child');
  if (body.style.display === 'none') { body.style.display = ''; arrow.textContent = '▼'; }
  else { body.style.display = 'none'; arrow.textContent = '▶'; }
}
function filterSev(sev, btn) {
  document.querySelectorAll('.filters button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.issue-row').forEach(row => {
    row.style.display = (sev === 'all' || row.dataset.sev === sev) ? '' : 'none';
  });
}
</script>
</body>
</html>`;

const outPath = path.join(ROOT, 'relatorio_auditoria.html');
fs.writeFileSync(outPath, html, 'utf8');

console.log('');
console.log('╔══════════════════════════════════════════════╗');
console.log('║     Auditoria de Código — Soberano MCR       ║');
console.log('╠══════════════════════════════════════════════╣');
console.log(`║  Arquivos analisados : ${String(results.length).padEnd(21)}║`);
console.log(`║  Total de issues     : ${String(totalIssues).padEnd(21)}║`);
console.log(`║  Score de saúde      : ${String(globalScore + '/100').padEnd(21)}║`);
console.log(`║  Duplicações         : ${String(dups.length).padEnd(21)}║`);
console.log('╠══════════════════════════════════════════════╣');
console.log(`║  Relatório gerado em:                        ║`);
console.log(`║  relatorio_auditoria.html                    ║`);
console.log('╚══════════════════════════════════════════════╝');
console.log('');

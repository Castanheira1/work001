#!/usr/bin/env node
/**
 * Runner simples de revisão orientada por task JSON.
 * Uso:
 *   node scripts/review_runner.js agent_tasks/review.task.example.json
 *
 * Este script valida o contrato e imprime um plano de execução.
 * Execução de comandos fica para o agente, evitando acoplamento e riscos.
 */
const fs = require('fs');
const path = require('path');

function fail(msg) {
  console.error(`[ERROR] ${msg}`);
  process.exit(1);
}

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

const inputPath = process.argv[2];
if (!isNonEmptyString(inputPath)) {
  fail('Informe o caminho do arquivo de task JSON. Ex: node scripts/review_runner.js agent_tasks/review.task.example.json');
}

const fullPath = path.resolve(process.cwd(), inputPath);
if (!fs.existsSync(fullPath)) {
  fail(`Arquivo não encontrado: ${fullPath}`);
}

let task;
try {
  task = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
} catch (err) {
  fail(`JSON inválido: ${err.message}`);
}

if (!isNonEmptyString(task.version)) fail('Campo obrigatório ausente: version');
if (!isNonEmptyString(task.task)) fail('Campo obrigatório ausente: task');
if (!task.scope || !Array.isArray(task.scope.include)) fail('Campo obrigatório inválido: scope.include (array)');
if (!Array.isArray(task.checks) || task.checks.length === 0) fail('Campo obrigatório inválido: checks (array não vazio)');
if (!task.output || !isNonEmptyString(task.output.format)) fail('Campo obrigatório inválido: output.format');

console.log('=== REVIEW TASK PLAN ===');
console.log(`Arquivo: ${fullPath}`);
console.log(`Versão: ${task.version}`);
console.log(`Tipo: ${task.task}`);
console.log('Escopo include:');
for (const p of task.scope.include) console.log(`  - ${p}`);
if (Array.isArray(task.scope.exclude) && task.scope.exclude.length) {
  console.log('Escopo exclude:');
  for (const p of task.scope.exclude) console.log(`  - ${p}`);
}

console.log('\nChecks:');
task.checks.forEach((c, idx) => {
  if (!isNonEmptyString(c.id)) fail(`checks[${idx}].id é obrigatório`);
  if (!Array.isArray(c.commands) || c.commands.length === 0) fail(`checks[${idx}].commands deve ser array não vazio`);

  console.log(`\n[${idx + 1}] ${c.id}`);
  if (isNonEmptyString(c.description)) console.log(`    ${c.description}`);
  for (const cmd of c.commands) console.log(`    $ ${cmd}`);
  console.log(`    on_fail: ${c.on_fail || 'warn'}`);
});

console.log('\nSaída esperada:');
console.log(`  - format: ${task.output.format}`);
if (task.output.write_file) console.log(`  - path: ${task.output.path || '(não informado)'}`);

console.log('\nStatus: contrato válido.');

# Workflow de Revisão sem Prompt Longo

## Problema
Repetir prompt longo para revisão técnica em toda interação.

## Solução
Usar um **arquivo de contrato** (`*.task.json`) que descreve escopo, checks, comandos e formato de saída.

## Passo a passo
1. Copie `agent_tasks/review.task.example.json` para `agent_tasks/review.task.json`.
2. Ajuste escopo e checks.
3. Valide o contrato:
   - `node scripts/review_runner.js agent_tasks/review.task.json`
4. Peça ao agente: **"Execute a revisão usando agent_tasks/review.task.json"**.

## Benefícios
- Menos variação de resposta.
- Menos retrabalho em prompts.
- Processo auditável e versionável no Git.
- Onboarding mais rápido para o time.

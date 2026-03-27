# AGENTS.md

## Objetivo
Reduzir prompts manuais usando um contrato de execução em arquivo (JSON) para revisões e auditorias técnicas.

## Regra principal
Quando o usuário pedir revisão, você **deve priorizar** o arquivo `agent_tasks/review.task.json` (ou outro caminho informado) como fonte de verdade.

## Fluxo obrigatório de revisão
1. Ler o arquivo de tarefa JSON.
2. Validar campos obrigatórios.
3. Montar plano de execução por etapa (`checks`).
4. Executar comandos definidos em `checks[*].commands`.
5. Gerar relatório em Markdown com:
   - resumo executivo
   - achados por severidade
   - evidências (comando + saída)
   - riscos e recomendações
6. Se `output.write_file=true`, salvar em `output.path`.

## Restrições
- Não inventar escopo fora do que está em `scope`.
- Se faltar campo obrigatório, falhar com mensagem clara.
- Não expor segredos encontrados em logs/arquivos.

## Convenção de status
- PASS: verificação ok
- WARN: atenção necessária, sem quebra crítica
- FAIL: quebra funcional, segurança, dados ou compliance

# Plano: Novo Fluxo de Checklist com 3 Regras

## Resumo das 3 Regras

### Regra 1: Checklist Campo (sem oficina)
- OM com plano de manutencao → checklist abre direto ao iniciar atividade
- Mecanico testa funcoes do equipamento em campo
- NAO e obrigado a enviar para oficina
- Pode: identificar itens nao conforme, registrar foto antes/depois, lancar material
- Finaliza normalmente com ou sem assinatura do cliente
- Sem assinatura → pendente, pode ser assinada no celular (3 cliques + fiscal)
- Nao assinada pelo cliente → relatorios assinados em lote no perfil fiscal

### Regra 2: Checklist Campo → Oficina → Montagem
**Etapa 1 - Campo (checklist inicial):**
- Checklist inicial com fotos previas
- Pode enviar para oficina

**Etapa 2 - Envio para oficina:**
- HH e pausado
- OM aparece no status "OFICINA"
- Banco memoriza: HH, efetivo
- OM fica habilitada para QUALQUER equipe iniciar

**Etapa 3 - Inicio na oficina:**
- Ao clicar: pede NOVO efetivo
- Apos efetivo: iniciar atividade na oficina
- NAO contabiliza deslocamento (zero)
- HH comeca a contar na oficina
- Checklist abre DE ONDE PAROU (mesmo checklist original)
- Equipe da oficina pode lancar mais fotos

**Etapa 4 - Pausa/Troca de turno na oficina:**
- Se nao concluiu no dia: opcao de pausar (mudanca de turno)
- Outra equipe pode assumir apos 18:00
- Se outra equipe: pedir novo efetivo, mesmo fluxo
- Se nao teve mudanca: opcao de FINALIZAR ATIVIDADE NA OFICINA

**Etapa 5 - Finalizacao oficina:**
- Para HH
- Status muda para "AGUARDANDO DEVOLUCAO"

**Etapa 6 - Devolucao/Montagem:**
- Ao clicar: comeca a contabilizar HH
- Iniciar atividade de montagem
- Pedir efetivo
- Deslocamento contabilizado em linhas separadas por colaborador (como ja funciona)
- Finalizacao com timeline completa no relatorio

### Regra 3: Relatorio
- Timeline completa sem poluicao
- Pode ter grafico inteligente para OMs com oficina
- Foco no relatorio atual, com melhoria para fluxo oficina

---

## Mudancas Necessarias

### 1. Novos estados de fluxo na OM (`currentOM`)

**Novos campos:**
```
statusOficina: 'em_oficina' | 'aguardando_devolucao' | null
etapaOficina: 'CAMPO' | 'OFICINA' | 'MONTAGEM' | null
hhSnapshotOficina: { hh, efetivo, deslocamento } // snapshot ao enviar
oficinaPausada: boolean
oficinaPausaMotivo: string
oficinaPausaInicio: ISO string
oficinaPausaExecutantes: string[]
oficinaPausaMateriaisUsados: array
oficinaTrocaTurno: boolean
```

### 2. Arquivo `pcm_finalizar.js` - Refatorar `enviarParaOficina()`

- Manter logica atual de validar checklist anormal + fotos
- Salvar snapshot de HH e efetivo no banco
- Desbloquear OM (`lockDeviceId = null`) para qualquer equipe
- Novo status: `statusOficina = 'em_oficina'`
- Push para Supabase

### 3. Arquivo `pcm_ui.js` - Novo status na lista de OMs

- Adicionar status `OFICINA` na listagem (ja existe parcialmente)
- Adicionar status `AGUARDANDO DEVOLUCAO`
- Tornar OMs em oficina clicaveis para QUALQUER equipe
- Ao clicar OM em oficina: fluxo de pedir efetivo → iniciar atividade sem deslocamento

### 4. Arquivo `pcm_atividade.js` - Iniciar atividade na oficina

- Nova funcao `iniciarAtividadeOficina()`:
  - Pede novo efetivo
  - Deslocamento = 0
  - Inicia cronometro HH
  - Abre checklist de onde parou

### 5. Arquivo `pcm_desvios.js` - Pausa/Troca de turno na oficina

- Reutilizar `confirmarTrocaTurno()` adaptado para oficina
- Nova opcao: "Finalizar Atividade na Oficina"
  - Para HH
  - Status → `aguardando_devolucao`
  - OM desbloqueada

### 6. Arquivo `pcm_finalizar.js` - Nova funcao `finalizarOficina()`

- Para HH
- Salva historico com tag 'OFICINA_FIM'
- Status → `aguardando_devolucao`
- Push Supabase

### 7. Fluxo de Devolucao (ja existe parcialmente em `devolverEquipamento()`)

- Adaptar para o novo fluxo:
  - Contabilizar HH
  - Pedir efetivo para montagem
  - Contabilizar deslocamento separado por colaborador
  - Tag 'MONTAGEM'

### 8. Arquivo `pcm_pdf_gerar.js` - Timeline no relatorio

- Adicionar secao de timeline para OMs com oficina
- Mostrar: Campo → Oficina → Montagem
- HH por etapa
- Efetivo por etapa

### 9. Arquivo `pcm_sync_push.js` - Novos campos no payload

- Incluir novos campos no push para Supabase

### 10. Schema SQL - Novos campos (patch)

- `status_oficina` text
- `etapa_oficina` text
- `hh_snapshot_oficina` jsonb
- `oficina_pausada` boolean

---

## Ordem de Implementacao

1. **Schema SQL** - Patch com novos campos
2. **pcm_globals.js** - Novos estados/constantes
3. **pcm_ui.js** - Novos status na lista + click handlers para oficina
4. **pcm_atividade.js** - `iniciarAtividadeOficina()`, fluxo sem deslocamento
5. **pcm_finalizar.js** - Refatorar `enviarParaOficina()`, nova `finalizarOficina()`, adaptar `devolverEquipamento()`
6. **pcm_desvios.js** - Pausa/troca turno na oficina
7. **pcm_checklist.js** - Garantir que checklist retoma de onde parou
8. **pcm_sync_push.js** - Novos campos no payload
9. **pcm_pdf_gerar.js** - Timeline no relatorio para OMs com oficina
10. **PCM_MCR_v5.html** - Novos botoes/popups para fluxo oficina

---

## Arquivos Impactados

| Arquivo | Tipo de Mudanca |
|---------|----------------|
| `schema_supabase_v2.sql` ou novo patch | Novos campos |
| `assets/pcm_mcr/pcm_globals.js` | Novos estados |
| `assets/pcm_mcr/pcm_ui.js` | Novos status, handlers |
| `assets/pcm_mcr/pcm_atividade.js` | Novo fluxo oficina |
| `assets/pcm_mcr/pcm_finalizar.js` | Refatorar oficina |
| `assets/pcm_mcr/pcm_desvios.js` | Pausa oficina |
| `assets/pcm_mcr/pcm_checklist.js` | Retomar checklist |
| `assets/pcm_mcr/pcm_sync_push.js` | Novos campos push |
| `assets/pcm_mcr/pcm_pdf_gerar.js` | Timeline relatorio |
| `PCM_MCR_v5.html` | Novos botoes/popups |

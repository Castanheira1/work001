-- =============================================
-- PATCH: Correções para produção
-- Projeto: Domo de Ferro / SOBERANO MCR
-- Data: 2026-03-09
-- =============================================

-- 1. Fix CHECK constraint - adicionar 'em_oficina'
ALTER TABLE public.oms DROP CONSTRAINT IF EXISTS oms_estado_fluxo_check;
ALTER TABLE public.oms ADD CONSTRAINT oms_estado_fluxo_check CHECK (estado_fluxo IN (
  'executada','preliminar','validada_admin','alterada_admin',
  'pendente_fiscal','devolvida_admin','arquivada','cancelada','em_oficina'
));

-- 2. Colunas ausentes que o código já envia
ALTER TABLE public.oms ADD COLUMN IF NOT EXISTS has_nc BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.oms ADD COLUMN IF NOT EXISTS tipo_checklist TEXT DEFAULT '';
ALTER TABLE public.oms ADD COLUMN IF NOT EXISTS motivo_reprogramacao TEXT DEFAULT '';

-- 3. Coluna escopo
ALTER TABLE public.oms ADD COLUMN IF NOT EXISTS escopo TEXT NOT NULL DEFAULT 'geral';
ALTER TABLE public.oms DROP CONSTRAINT IF EXISTS oms_escopo_check;
ALTER TABLE public.oms ADD CONSTRAINT oms_escopo_check CHECK (escopo IN ('geral','preventiva_usina','preventiva_mina','preventiva_turno','corretiva'));

-- 4. Datas previstas (extraídas do PDF da OM pelo SAP)
ALTER TABLE public.oms ADD COLUMN IF NOT EXISTS data_inicio_prevista TIMESTAMPTZ;
ALTER TABLE public.oms ADD COLUMN IF NOT EXISTS data_fim_prevista TIMESTAMPTZ;

-- 5. Índice para oficina (usado no admin)
CREATE INDEX IF NOT EXISTS idx_oms_em_oficina ON public.oms (estado_fluxo) WHERE estado_fluxo = 'em_oficina';

-- 6. Índice para escopo (filtro do mecânico)
CREATE INDEX IF NOT EXISTS idx_oms_escopo ON public.oms (escopo, status) WHERE finalizada = false AND cancelada = false;

-- =============================================
-- BACKFILL: preencher OMs já existentes
-- =============================================

-- 7. data_finalizacao: OMs finalizadas que nunca tiveram esse campo gravado
--    Usa updated_at como melhor aproximação disponível
UPDATE public.oms
SET data_finalizacao = updated_at
WHERE finalizada = true
  AND data_finalizacao IS NULL;

-- 8. data_execucao: mesmo critério
UPDATE public.oms
SET data_execucao = updated_at
WHERE finalizada = true
  AND data_execucao IS NULL;

-- 9. data_fim_prevista: NÃO pode ser preenchida por SQL.
--    Vem da extração do PDF (página 2, campo "Data Fim" do SAP).
--    Novas OMs serão preenchidas automaticamente quando o mecânico puxar.
--    Para OMs já finalizadas, a data prevista fica NULL (não entra no SLA).

-- 10. Fiscal views - adicionar colunas que o código consulta
CREATE OR REPLACE VIEW public.vw_fiscal_bloco1 AS
  SELECT num, titulo, status, cc, equipe, equipamento,
    primeiro_executante, executantes, materiais_usados, materiais_total,
    estado_fluxo, cliente_assinou, admin_modificou_material, fiscal_assinou,
    cancelada, data_assinatura_fiscal, data_execucao, updated_at
  FROM public.oms
  WHERE COALESCE(jsonb_array_length(materiais_usados), 0) = 0
    AND cliente_assinou = FALSE
    AND cancelada = FALSE
    AND fiscal_assinou = FALSE
    AND estado_fluxo = 'pendente_fiscal';

CREATE OR REPLACE VIEW public.vw_fiscal_bloco2 AS
  SELECT num, titulo, status, cc, equipe, equipamento,
    primeiro_executante, executantes, materiais_usados, materiais_total,
    estado_fluxo, cliente_assinou, admin_validou_material, admin_modificou_material,
    fiscal_assinou, cancelada, data_assinatura_fiscal, data_execucao, updated_at
  FROM public.oms
  WHERE COALESCE(jsonb_array_length(materiais_usados), 0) > 0
    AND estado_fluxo = 'pendente_fiscal'
    AND cancelada = FALSE
    AND fiscal_assinou = FALSE;

CREATE OR REPLACE VIEW public.vw_fiscal_bloco3 AS
  SELECT num, titulo, status, cc, equipe, equipamento,
    primeiro_executante, executantes, materiais_usados, materiais_total,
    estado_fluxo, cliente_assinou, admin_modificou_material,
    fiscal_assinou, cancelada, data_assinatura_fiscal, data_execucao, updated_at
  FROM public.oms
  WHERE admin_modificou_material = TRUE
    AND estado_fluxo = 'pendente_fiscal'
    AND cancelada = FALSE
    AND fiscal_assinou = FALSE;

CREATE OR REPLACE VIEW public.vw_fiscal_bloco4 AS
  SELECT num, titulo, status, cc, equipe, equipamento,
    primeiro_executante, executantes, materiais_usados, materiais_total,
    estado_fluxo, admin_modificou_material, cancelada, fiscal_assinou,
    data_assinatura_fiscal, data_execucao, updated_at
  FROM public.oms
  WHERE cancelada = TRUE
    AND fiscal_assinou = FALSE;

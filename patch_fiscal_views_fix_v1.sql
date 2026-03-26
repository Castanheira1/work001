-- =============================================
-- PATCH: Correção das Views Fiscais
-- Projeto: Domo de Ferro / SOBERANO MCR
-- Data: 2026-03-25
-- Autor: Manus (adequação lógica fiscal)
-- =============================================
-- Problema 1: has_relatorio, has_checklist e has_nc ausentes nas views
--   → Os botões "Ver Relatório", "Ver Checklist" e "Ver NC" no modal fiscal
--     nunca apareciam porque as views não expunham essas colunas.
--
-- Problema 2: Bloco 3 era subconjunto do Bloco 2 (duplicidade)
--   → vw_fiscal_bloco3 filtrava admin_modificou_material=TRUE AND pendente_fiscal,
--     que é exatamente um subconjunto de vw_fiscal_bloco2 (com material + pendente_fiscal).
--     Uma OM com material alterado pelo admin aparecia nos dois blocos simultaneamente.
--   → Correção: vw_fiscal_bloco2 agora exclui OMs com admin_modificou_material=TRUE,
--     garantindo separação clara entre os dois blocos.
-- =============================================

-- Bloco 1: Sem material, sem assinatura do cliente, pendente fiscal
CREATE OR REPLACE VIEW public.vw_fiscal_bloco1 AS
  SELECT
    num, titulo, status, cc, equipe, equipamento,
    primeiro_executante, executantes,
    materiais_usados, materiais_total,
    estado_fluxo, cliente_assinou,
    admin_modificou_material, fiscal_assinou, cancelada,
    has_relatorio, has_checklist, has_nc,
    data_assinatura_fiscal, data_execucao, updated_at
  FROM public.oms
  WHERE COALESCE(jsonb_array_length(materiais_usados), 0) = 0
    AND cliente_assinou = FALSE
    AND cancelada = FALSE
    AND fiscal_assinou = FALSE
    AND estado_fluxo = 'pendente_fiscal';

-- Bloco 2: Com material, SEM alteração pelo admin, pendente fiscal
-- (OMs com material alterado pelo admin ficam exclusivamente no Bloco 3)
CREATE OR REPLACE VIEW public.vw_fiscal_bloco2 AS
  SELECT
    num, titulo, status, cc, equipe, equipamento,
    primeiro_executante, executantes,
    materiais_usados, materiais_total,
    estado_fluxo, cliente_assinou,
    admin_validou_material, admin_modificou_material,
    fiscal_assinou, cancelada,
    has_relatorio, has_checklist, has_nc,
    data_assinatura_fiscal, data_execucao, updated_at
  FROM public.oms
  WHERE COALESCE(jsonb_array_length(materiais_usados), 0) > 0
    AND admin_modificou_material = FALSE   -- exclui alteradas pelo admin (ficam no bloco 3)
    AND estado_fluxo = 'pendente_fiscal'
    AND cancelada = FALSE
    AND fiscal_assinou = FALSE;

-- Bloco 3: Material alterado pelo admin, pendente fiscal
-- (subconjunto exclusivo — não aparece no Bloco 2)
CREATE OR REPLACE VIEW public.vw_fiscal_bloco3 AS
  SELECT
    num, titulo, status, cc, equipe, equipamento,
    primeiro_executante, executantes,
    materiais_usados, materiais_total,
    estado_fluxo, cliente_assinou,
    admin_modificou_material, fiscal_assinou, cancelada,
    has_relatorio, has_checklist, has_nc,
    data_assinatura_fiscal, data_execucao, updated_at
  FROM public.oms
  WHERE admin_modificou_material = TRUE
    AND estado_fluxo = 'pendente_fiscal'
    AND cancelada = FALSE
    AND fiscal_assinou = FALSE;

-- Bloco 4: Canceladas aguardando assinatura fiscal
CREATE OR REPLACE VIEW public.vw_fiscal_bloco4 AS
  SELECT
    num, titulo, status, cc, equipe, equipamento,
    primeiro_executante, executantes,
    materiais_usados, materiais_total,
    estado_fluxo, admin_modificou_material, cancelada, fiscal_assinou,
    has_relatorio, has_checklist, has_nc,
    data_assinatura_fiscal, data_execucao, updated_at
  FROM public.oms
  WHERE cancelada = TRUE
    AND fiscal_assinou = FALSE;

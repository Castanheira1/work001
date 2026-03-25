-- ============================================================
-- PATCH: OM Workflow Refactor v1
-- Data: 2026-03-25
-- Descricao: Adiciona campos para desativacao como encerramento
--            por excecao, tipo_fechamento e separacao analitica
--            no dashboard.
-- ============================================================

-- Adicionar campo tipo_fechamento: 'normal' | 'desativacao' | 'cancelamento'
ALTER TABLE oms ADD COLUMN IF NOT EXISTS tipo_fechamento TEXT DEFAULT 'normal';

-- Flag booleana para equipamentos desativados
ALTER TABLE oms ADD COLUMN IF NOT EXISTS desativada BOOLEAN DEFAULT false;

-- Motivo textual da desativacao
ALTER TABLE oms ADD COLUMN IF NOT EXISTS motivo_desativacao TEXT;

-- HH gasto até o momento da desativacao (para rastreabilidade)
ALTER TABLE oms ADD COLUMN IF NOT EXISTS hh_gasto_desativacao NUMERIC(10,4);

-- Atualizar registros existentes que estejam com estado_fluxo = 'equipamento_desativado'
-- para garantir consistencia com a nova coluna
UPDATE oms
SET tipo_fechamento = 'desativacao', desativada = true
WHERE estado_fluxo = 'equipamento_desativado'
  AND tipo_fechamento IS DISTINCT FROM 'desativacao';

-- Atualizar registros cancelados para consistencia
UPDATE oms
SET tipo_fechamento = 'cancelamento'
WHERE cancelada = true
  AND tipo_fechamento IS DISTINCT FROM 'cancelamento';

-- Comentarios para documentacao
COMMENT ON COLUMN oms.tipo_fechamento IS 'Tipo de fechamento da OM: normal | desativacao | cancelamento';
COMMENT ON COLUMN oms.desativada IS 'Indica que o equipamento foi desativado como excecao operacional';
COMMENT ON COLUMN oms.motivo_desativacao IS 'Motivo registrado pelo executante no momento da desativacao';
COMMENT ON COLUMN oms.hh_gasto_desativacao IS 'HH gasto até o momento da desativacao para rastreabilidade';

-- ============================================================
-- VIEW: Separacao analitica para dashboard
-- ============================================================
CREATE OR REPLACE VIEW vw_dashboard_fechamento AS
SELECT
    num,
    titulo,
    status,
    estado_fluxo,
    tipo_fechamento,
    desativada,
    finalizada,
    cancelada,
    CASE
        WHEN cancelada = true THEN 'Cancelada'
        WHEN desativada = true AND finalizada = true THEN 'Equipamento Desativado'
        WHEN finalizada = true THEN 'Executada'
        ELSE 'Em Andamento'
    END AS status_dashboard,
    hh_total,
    materiais_total,
    equipe,
    cc,
    data_finalizacao,
    data_execucao
FROM oms
WHERE status IN ('finalizada', 'cancelada', 'desativada', 'pendente_assinatura');

COMMENT ON VIEW vw_dashboard_fechamento IS 'View analitica com separacao entre OMs executadas, canceladas e desativadas';

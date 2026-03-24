-- Patch: Novo fluxo de oficina com 3 regras de checklist
-- Data: 2026-03-24

-- Novos campos na tabela oms para suportar o fluxo completo de oficina
ALTER TABLE oms ADD COLUMN IF NOT EXISTS status_oficina text;
-- Valores: 'em_oficina', 'aguardando_devolucao', null
COMMENT ON COLUMN oms.status_oficina IS 'Status do fluxo de oficina: em_oficina, aguardando_devolucao';

ALTER TABLE oms ADD COLUMN IF NOT EXISTS etapa_oficina text;
-- Valores: 'CAMPO', 'OFICINA', 'MONTAGEM', null
COMMENT ON COLUMN oms.etapa_oficina IS 'Etapa atual do fluxo: CAMPO, OFICINA, MONTAGEM';

ALTER TABLE oms ADD COLUMN IF NOT EXISTS hh_snapshot_oficina jsonb;
COMMENT ON COLUMN oms.hh_snapshot_oficina IS 'Snapshot de HH e efetivo ao enviar para oficina';

ALTER TABLE oms ADD COLUMN IF NOT EXISTS oficina_pausada boolean DEFAULT false;
ALTER TABLE oms ADD COLUMN IF NOT EXISTS oficina_pausa_inicio timestamptz;
ALTER TABLE oms ADD COLUMN IF NOT EXISTS oficina_pausa_executantes jsonb;
ALTER TABLE oms ADD COLUMN IF NOT EXISTS oficina_troca_turno boolean DEFAULT false;
ALTER TABLE oms ADD COLUMN IF NOT EXISTS data_inicio_oficina timestamptz;
ALTER TABLE oms ADD COLUMN IF NOT EXISTS data_fim_oficina timestamptz;
ALTER TABLE oms ADD COLUMN IF NOT EXISTS data_inicio_montagem timestamptz;

-- Indice para busca por status_oficina
CREATE INDEX IF NOT EXISTS idx_oms_status_oficina ON oms(status_oficina) WHERE status_oficina IS NOT NULL;

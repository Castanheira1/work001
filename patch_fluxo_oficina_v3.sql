-- Patch: Adicionar 'aguardando_devolucao' ao constraint de estado_fluxo
-- Data: 2026-03-25
-- Motivo: patch_fluxo_oficina_v2 adicionou status_oficina='aguardando_devolucao'
--         mas esqueceu de atualizar o CHECK constraint em estado_fluxo

ALTER TABLE public.oms DROP CONSTRAINT IF EXISTS oms_estado_fluxo_check;
ALTER TABLE public.oms ADD CONSTRAINT oms_estado_fluxo_check CHECK (estado_fluxo IN (
  'executada','preliminar','validada_admin','alterada_admin',
  'pendente_fiscal','devolvida_admin','arquivada','cancelada',
  'em_oficina','aguardando_devolucao'
));

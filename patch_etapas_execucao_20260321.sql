create table if not exists public.om_etapas_execucao (
  id bigserial primary key,
  om_num text not null,
  etapa_seq integer not null,
  etapa_tag text not null default 'ATIVIDADE',
  executantes jsonb not null default '[]'::jsonb,
  data_inicio timestamptz null,
  data_fim timestamptz null,
  hh_atividade numeric(10,4) not null default 0,
  hh_deslocamento numeric(10,4) not null default 0,
  materiais_usados jsonb not null default '[]'::jsonb,
  criado_em timestamptz not null default now()
);

create index if not exists idx_om_etapas_execucao_om_num on public.om_etapas_execucao (om_num);
create index if not exists idx_om_etapas_execucao_data_inicio on public.om_etapas_execucao (data_inicio);

create unique index if not exists uq_om_etapas_execucao_om_seq on public.om_etapas_execucao (om_num, etapa_seq);

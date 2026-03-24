-- ==========================================
-- PCM / MCR - SCHEMA COMPLETO CORRIGIDO
-- Projeto: soberano (xigajcnuwnofbuqzohpg)
-- NÃO inclui pricelist2026 (já existe)
-- ==========================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==========================================
-- TABELAS
-- ==========================================

CREATE TABLE IF NOT EXISTS public.oms (
  num TEXT PRIMARY KEY,
  titulo TEXT,
  status TEXT DEFAULT 'enviada',
  lock_device_id TEXT,
  primeiro_executante TEXT,
  operador TEXT,
  executantes JSONB NOT NULL DEFAULT '[]'::jsonb,
  historico_execucao JSONB NOT NULL DEFAULT '[]'::jsonb,
  materiais_usados JSONB NOT NULL DEFAULT '[]'::jsonb,
  deslocamento_segundos INTEGER NOT NULL DEFAULT 0,
  desloc_hora_inicio TIMESTAMPTZ,
  desloc_hora_fim TIMESTAMPTZ,
  equipe TEXT,
  cc TEXT,
  equipamento TEXT,
  local_instalacao TEXT,
  desc_local TEXT,
  plano_cod TEXT,
  admin_unlock BOOLEAN NOT NULL DEFAULT FALSE,
  admin_unlock_ts TIMESTAMPTZ,
  has_checklist BOOLEAN NOT NULL DEFAULT FALSE,
  has_fotos BOOLEAN NOT NULL DEFAULT FALSE,
  has_relatorio BOOLEAN NOT NULL DEFAULT FALSE,
  hh_total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  materiais_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  cancelada BOOLEAN NOT NULL DEFAULT FALSE,
  finalizada BOOLEAN NOT NULL DEFAULT FALSE,
  pendente_assinatura BOOLEAN NOT NULL DEFAULT FALSE,
  data_finalizacao TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cliente_assinou BOOLEAN NOT NULL DEFAULT FALSE,
  admin_validou_material BOOLEAN NOT NULL DEFAULT FALSE,
  admin_modificou_material BOOLEAN NOT NULL DEFAULT FALSE,
  fiscal_assinou BOOLEAN NOT NULL DEFAULT FALSE,
  estado_fluxo TEXT NOT NULL DEFAULT 'executada' CHECK (estado_fluxo IN (
    'executada','preliminar','validada_admin','alterada_admin',
    'pendente_fiscal','devolvida_admin','arquivada','cancelada','em_oficina'
  )),
  has_nc BOOLEAN NOT NULL DEFAULT FALSE,
  tipo_checklist TEXT DEFAULT '',
  motivo_reprogramacao TEXT DEFAULT '',
  escopo TEXT NOT NULL DEFAULT 'geral' CHECK (escopo IN ('geral','preventiva_usina','preventiva_mina','preventiva_turno','corretiva')),
  data_inicio_prevista TIMESTAMPTZ,
  data_fim_prevista TIMESTAMPTZ,
  data_assinatura_fiscal TIMESTAMPTZ,
  data_execucao TIMESTAMPTZ,
  motivo_devolucao TEXT,
  data_devolucao TIMESTAMPTZ,
  usuario_devolucao TEXT
);

CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'mecanico' CHECK (role IN ('admin', 'mecanico', 'fiscal')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.desvios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  om_num TEXT NOT NULL,
  tipo TEXT,
  tipo_cod TEXT,
  tipo_label TEXT,
  tag_equipamento TEXT,
  local_instalacao TEXT,
  desc_local TEXT,
  foto_path TEXT,
  observacao TEXT,
  descricao TEXT,
  executantes JSONB DEFAULT '[]'::jsonb,
  tempo_segundos INTEGER DEFAULT 0,
  mes_ref TEXT,
  motivo TEXT,
  equipe_mantida BOOLEAN,
  novo_responsavel TEXT,
  falha_inicio TIMESTAMPTZ,
  falha_fim TIMESTAMPTZ,
  tempo_parado_min INTEGER,
  habilitado_por TEXT,
  registrado_por TEXT,
  origem TEXT DEFAULT 'campo',
  data_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.config (
  chave TEXT PRIMARY KEY,
  valor TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bm_materiais (
  id BIGSERIAL PRIMARY KEY,
  bm_numero TEXT NOT NULL,
  bm_data_inicio TEXT,
  bm_data_fim TEXT,
  om_num TEXT NOT NULL,
  titulo_om TEXT,
  tipo_solicitacao TEXT,
  codigo TEXT,
  ct2 TEXT,
  descricao TEXT,
  unidade TEXT DEFAULT 'UN',
  qtd NUMERIC(12,4) DEFAULT 0,
  vl_unitario NUMERIC(12,4) DEFAULT 0,
  bdi_percentual NUMERIC(10,4) DEFAULT 0,
  bdi_valor NUMERIC(12,4) DEFAULT 0,
  vl_total NUMERIC(12,4) DEFAULT 0,
  cc TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bm_hh (
  id BIGSERIAL PRIMARY KEY,
  bm_numero TEXT NOT NULL,
  bm_data_inicio TEXT,
  bm_data_fim TEXT,
  om_num TEXT NOT NULL,
  titulo_om TEXT,
  cc TEXT,
  equipe TEXT,
  escopo TEXT DEFAULT 'geral',
  executante TEXT,
  pessoal_n INTEGER,
  tipo TEXT,
  data_exec TEXT,
  hora_inicio TEXT,
  hora_fim TEXT,
  tempo_seg INTEGER DEFAULT 0,
  tempo_fmt TEXT,
  causa TEXT,
  tag TEXT,
  status TEXT,
  hh_total NUMERIC(10,2) DEFAULT 0,
  materiais_total NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.om_etapas_execucao (
  id BIGSERIAL PRIMARY KEY,
  om_num TEXT NOT NULL,
  etapa_seq INTEGER NOT NULL,
  etapa_tag TEXT NOT NULL DEFAULT 'ATIVIDADE',
  executantes JSONB NOT NULL DEFAULT '[]'::jsonb,
  data_inicio TIMESTAMPTZ,
  data_fim TIMESTAMPTZ,
  hh_atividade NUMERIC(10,4) NOT NULL DEFAULT 0,
  hh_deslocamento NUMERIC(10,4) NOT NULL DEFAULT 0,
  materiais_usados JSONB NOT NULL DEFAULT '[]'::jsonb,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.dashboard_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  om_num TEXT NOT NULL,
  tag_equipamento TEXT,
  titulo TEXT,
  equipe TEXT,
  cc TEXT,
  local_instalacao TEXT,
  desc_local TEXT,
  tipo_manut TEXT,
  plano_cod TEXT,
  periodo_inicio TEXT,
  periodo_fim TEXT,
  mes_ref TEXT,
  tipo TEXT,
  programado BOOLEAN DEFAULT FALSE,
  atendido BOOLEAN DEFAULT FALSE,
  no_prazo BOOLEAN DEFAULT FALSE,
  com_atraso BOOLEAN DEFAULT FALSE,
  cancelado BOOLEAN DEFAULT FALSE,
  desativado BOOLEAN DEFAULT FALSE,
  desvio_apontado BOOLEAN DEFAULT FALSE,
  desvio_motivo TEXT,
  nome_fiscal TEXT,
  total_hh NUMERIC(10,2) DEFAULT 0.00,
  materiais_total NUMERIC(12,2) DEFAULT 0.00,
  data_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- ÍNDICES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_oms_status ON public.oms (status);
CREATE INDEX IF NOT EXISTS idx_oms_updated_at ON public.oms (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_oms_lock_device ON public.oms (lock_device_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_desvios_om ON public.desvios (om_num);
CREATE INDEX IF NOT EXISTS idx_desvios_data ON public.desvios (data_registro DESC);
CREATE INDEX IF NOT EXISTS idx_desvios_mes ON public.desvios (mes_ref);
CREATE INDEX IF NOT EXISTS idx_dashboard_om ON public.dashboard_log (om_num);
CREATE INDEX IF NOT EXISTS idx_dashboard_mes ON public.dashboard_log (mes_ref);
CREATE INDEX IF NOT EXISTS idx_dashboard_tipo ON public.dashboard_log (tipo);

CREATE INDEX IF NOT EXISTS idx_bm_materiais_bm ON public.bm_materiais (bm_numero);
CREATE INDEX IF NOT EXISTS idx_bm_materiais_om ON public.bm_materiais (om_num);
CREATE INDEX IF NOT EXISTS idx_bm_hh_bm ON public.bm_hh (bm_numero);
CREATE INDEX IF NOT EXISTS idx_bm_hh_om ON public.bm_hh (om_num);
CREATE INDEX IF NOT EXISTS idx_om_etapas_om ON public.om_etapas_execucao (om_num);
CREATE INDEX IF NOT EXISTS idx_om_etapas_data ON public.om_etapas_execucao (data_inicio);
CREATE UNIQUE INDEX IF NOT EXISTS uq_om_etapas_om_seq ON public.om_etapas_execucao (om_num, etapa_seq);

-- ==========================================
-- TRIGGER updated_at
-- ==========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_oms_updated ON public.oms;
CREATE TRIGGER trg_oms_updated
BEFORE UPDATE ON public.oms
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_profiles_updated ON public.profiles;
CREATE TRIGGER trg_profiles_updated
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- RLS (Row Level Security)
-- ==========================================
ALTER TABLE public.oms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.desvios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bm_materiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bm_hh ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.om_etapas_execucao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_log ENABLE ROW LEVEL SECURITY;

-- Limpa policies antigas
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('oms','profiles','desvios','dashboard_log','config','bm_materiais','bm_hh','om_etapas_execucao')
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- OMS: leitura e escrita para anon + authenticated
CREATE POLICY "oms_select" ON public.oms FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "oms_insert" ON public.oms FOR INSERT TO anon, authenticated WITH CHECK (TRUE);
CREATE POLICY "oms_update" ON public.oms FOR UPDATE TO anon, authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "oms_delete" ON public.oms FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

-- PROFILES
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- DESVIOS
CREATE POLICY "desvios_select" ON public.desvios FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "desvios_insert" ON public.desvios FOR INSERT TO anon, authenticated WITH CHECK (TRUE);

-- CONFIG
CREATE POLICY "config_select" ON public.config FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "config_insert" ON public.config FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY "config_update" ON public.config FOR UPDATE TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- BM_MATERIAIS
CREATE POLICY "bm_materiais_select" ON public.bm_materiais FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "bm_materiais_insert" ON public.bm_materiais FOR INSERT TO anon, authenticated WITH CHECK (TRUE);
CREATE POLICY "bm_materiais_delete" ON public.bm_materiais FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

-- BM_HH
CREATE POLICY "bm_hh_select" ON public.bm_hh FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "bm_hh_insert" ON public.bm_hh FOR INSERT TO anon, authenticated WITH CHECK (TRUE);
CREATE POLICY "bm_hh_delete" ON public.bm_hh FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

-- OM_ETAPAS_EXECUCAO
CREATE POLICY "om_etapas_select" ON public.om_etapas_execucao FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "om_etapas_insert" ON public.om_etapas_execucao FOR INSERT TO anon, authenticated WITH CHECK (TRUE);
CREATE POLICY "om_etapas_update" ON public.om_etapas_execucao FOR UPDATE TO anon, authenticated USING (TRUE) WITH CHECK (TRUE);

-- DASHBOARD_LOG
CREATE POLICY "dashboard_select" ON public.dashboard_log FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "dashboard_insert" ON public.dashboard_log FOR INSERT TO anon, authenticated WITH CHECK (TRUE);


-- ==========================================
-- ÍNDICES DE FLUXO
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_oms_estado_fluxo    ON public.oms (estado_fluxo);
CREATE INDEX IF NOT EXISTS idx_oms_cliente_assinou ON public.oms (cliente_assinou);
CREATE INDEX IF NOT EXISTS idx_oms_admin_validou   ON public.oms (admin_validou_material);
CREATE INDEX IF NOT EXISTS idx_oms_admin_modif     ON public.oms (admin_modificou_material);
CREATE INDEX IF NOT EXISTS idx_oms_fiscal_assinou  ON public.oms (fiscal_assinou);
CREATE INDEX IF NOT EXISTS idx_oms_fluxo_admin     ON public.oms (estado_fluxo, cancelada);
CREATE INDEX IF NOT EXISTS idx_oms_fluxo_fiscal    ON public.oms (estado_fluxo, fiscal_assinou, cancelada);

-- ==========================================
-- VIEWS — DASHBOARD ADMIN
-- ==========================================
CREATE OR REPLACE VIEW public.vw_fluxo_bloco1 AS
  SELECT num, titulo, status, cc, equipe, equipamento,
    primeiro_executante, executantes, materiais_usados, materiais_total,
    estado_fluxo, cliente_assinou, admin_validou_material, admin_modificou_material,
    data_execucao, updated_at
  FROM public.oms
  WHERE COALESCE(jsonb_array_length(materiais_usados), 0) > 0
    AND admin_validou_material = FALSE
    AND cancelada = FALSE;

CREATE OR REPLACE VIEW public.vw_fluxo_bloco2 AS
  SELECT num, titulo, status, cc, equipe, equipamento,
    primeiro_executante, executantes, materiais_usados, materiais_total,
    estado_fluxo, cliente_assinou, admin_validou_material, admin_modificou_material,
    data_execucao, updated_at
  FROM public.oms
  WHERE admin_modificou_material = TRUE
    AND estado_fluxo = 'alterada_admin'
    AND cancelada = FALSE;

CREATE OR REPLACE VIEW public.vw_fluxo_bloco3 AS
  SELECT num, titulo, status, cc, equipe, equipamento,
    primeiro_executante, executantes, materiais_usados, materiais_total,
    estado_fluxo, cliente_assinou, admin_modificou_material,
    motivo_devolucao, data_devolucao, usuario_devolucao,
    data_execucao, updated_at
  FROM public.oms
  WHERE estado_fluxo = 'devolvida_admin';

CREATE OR REPLACE VIEW public.vw_fluxo_bloco4 AS
  SELECT num, titulo, status, cc, equipe, equipamento,
    primeiro_executante, executantes, materiais_usados, materiais_total,
    estado_fluxo, cliente_assinou, data_execucao, updated_at
  FROM public.oms
  WHERE cliente_assinou = FALSE
    AND cancelada = FALSE;

-- ==========================================
-- VIEWS — DASHBOARD FISCAL
-- ==========================================
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

-- ==========================================
-- STORAGE BUCKET
-- ==========================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('pcm-files', 'pcm-files', true)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pcm_files_insert" ON storage.objects;
DROP POLICY IF EXISTS "pcm_files_update" ON storage.objects;
DROP POLICY IF EXISTS "pcm_files_select" ON storage.objects;
DROP POLICY IF EXISTS "pcm_files_delete" ON storage.objects;

CREATE POLICY "pcm_files_select" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'pcm-files');

CREATE POLICY "pcm_files_insert" ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'pcm-files');

CREATE POLICY "pcm_files_update" ON storage.objects FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'pcm-files') WITH CHECK (bucket_id = 'pcm-files');

CREATE POLICY "pcm_files_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'pcm-files' AND EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'
  ));

-- ==========================================
-- PERFIL ADMIN INICIAL
-- ==========================================
-- 1. Crie o usuário em Authentication > Users (ex: admin@soberano.local / sua_senha)
-- 2. Pegue o UUID gerado
-- 3. Execute:
--
-- INSERT INTO public.profiles (user_id, username, role)
-- VALUES ('COLE_O_UUID_AQUI', 'admin', 'admin')
-- ON CONFLICT (user_id) DO UPDATE SET role = 'admin', updated_at = NOW();

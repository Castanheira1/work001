-- ============================================================
-- PATCH: Rastreamento de Equipes em Tempo Real
-- Versão: v1 — 2026-03-30
-- Descrição: Cria tabela para armazenar localização GPS das
--            equipes em campo e habilita Realtime no Supabase.
-- ============================================================

-- Tabela principal de localização das equipes
CREATE TABLE IF NOT EXISTS public.equipe_localizacao (
  id           BIGSERIAL PRIMARY KEY,
  equipe       TEXT NOT NULL,              -- nome da equipe (ex: "Equipe A")
  device_id    TEXT NOT NULL,              -- ID único do dispositivo
  operador     TEXT,                       -- nome do operador/técnico
  latitude     DOUBLE PRECISION NOT NULL,
  longitude    DOUBLE PRECISION NOT NULL,
  precisao     DOUBLE PRECISION,           -- precisão em metros
  om_num       TEXT,                       -- OM ativa no momento
  om_status    TEXT,                       -- estado_fluxo da OM ativa
  om_titulo    TEXT,                       -- título da OM ativa
  bateria      INTEGER,                    -- nível de bateria (0-100)
  velocidade   DOUBLE PRECISION,           -- velocidade em km/h
  online       BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_equipe_localizacao_equipe
  ON public.equipe_localizacao (equipe);

CREATE INDEX IF NOT EXISTS idx_equipe_localizacao_device_id
  ON public.equipe_localizacao (device_id);

CREATE INDEX IF NOT EXISTS idx_equipe_localizacao_updated_at
  ON public.equipe_localizacao (updated_at DESC);

-- Índice único por device_id (apenas 1 registro por dispositivo)
CREATE UNIQUE INDEX IF NOT EXISTS uq_equipe_localizacao_device
  ON public.equipe_localizacao (device_id);

-- Histórico de localização (trilha de posições)
CREATE TABLE IF NOT EXISTS public.equipe_localizacao_historico (
  id           BIGSERIAL PRIMARY KEY,
  device_id    TEXT NOT NULL,
  equipe       TEXT NOT NULL,
  operador     TEXT,
  latitude     DOUBLE PRECISION NOT NULL,
  longitude    DOUBLE PRECISION NOT NULL,
  precisao     DOUBLE PRECISION,
  om_num       TEXT,
  om_status    TEXT,
  velocidade   DOUBLE PRECISION,
  registrado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equipe_loc_hist_device
  ON public.equipe_localizacao_historico (device_id, registrado_em DESC);

CREATE INDEX IF NOT EXISTS idx_equipe_loc_hist_equipe
  ON public.equipe_localizacao_historico (equipe, registrado_em DESC);

-- ============================================================
-- RLS (Row Level Security) — Leitura pública, escrita autenticada
-- ============================================================
ALTER TABLE public.equipe_localizacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipe_localizacao_historico ENABLE ROW LEVEL SECURITY;

-- Política: qualquer usuário autenticado ou anon pode LER
DROP POLICY IF EXISTS "equipe_localizacao_read" ON public.equipe_localizacao;
CREATE POLICY "equipe_localizacao_read"
  ON public.equipe_localizacao FOR SELECT
  USING (true);

-- Política: qualquer usuário pode INSERIR/ATUALIZAR (dispositivos de campo)
DROP POLICY IF EXISTS "equipe_localizacao_write" ON public.equipe_localizacao;
CREATE POLICY "equipe_localizacao_write"
  ON public.equipe_localizacao FOR ALL
  USING (true)
  WITH CHECK (true);

-- Política: leitura do histórico
DROP POLICY IF EXISTS "equipe_loc_hist_read" ON public.equipe_localizacao_historico;
CREATE POLICY "equipe_loc_hist_read"
  ON public.equipe_localizacao_historico FOR SELECT
  USING (true);

-- Política: escrita do histórico
DROP POLICY IF EXISTS "equipe_loc_hist_write" ON public.equipe_localizacao_historico;
CREATE POLICY "equipe_loc_hist_write"
  ON public.equipe_localizacao_historico FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- Habilitar Realtime nas tabelas
-- (Execute no Supabase Dashboard > Database > Replication)
-- ============================================================
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.equipe_localizacao;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.equipe_localizacao_historico;

-- ============================================================
-- Função para atualizar updated_at automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_update_equipe_localizacao_ts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_equipe_localizacao_updated_at ON public.equipe_localizacao;
CREATE TRIGGER trg_equipe_localizacao_updated_at
  BEFORE UPDATE ON public.equipe_localizacao
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_equipe_localizacao_ts();

-- ============================================================
-- Função UPSERT de localização (usada pelo dispositivo de campo)
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_upsert_localizacao(
  p_device_id   TEXT,
  p_equipe      TEXT,
  p_operador    TEXT,
  p_latitude    DOUBLE PRECISION,
  p_longitude   DOUBLE PRECISION,
  p_precisao    DOUBLE PRECISION DEFAULT NULL,
  p_om_num      TEXT DEFAULT NULL,
  p_om_status   TEXT DEFAULT NULL,
  p_om_titulo   TEXT DEFAULT NULL,
  p_bateria     INTEGER DEFAULT NULL,
  p_velocidade  DOUBLE PRECISION DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.equipe_localizacao
    (device_id, equipe, operador, latitude, longitude, precisao,
     om_num, om_status, om_titulo, bateria, velocidade, online, updated_at)
  VALUES
    (p_device_id, p_equipe, p_operador, p_latitude, p_longitude, p_precisao,
     p_om_num, p_om_status, p_om_titulo, p_bateria, p_velocidade, TRUE, NOW())
  ON CONFLICT (device_id) DO UPDATE SET
    equipe     = EXCLUDED.equipe,
    operador   = EXCLUDED.operador,
    latitude   = EXCLUDED.latitude,
    longitude  = EXCLUDED.longitude,
    precisao   = EXCLUDED.precisao,
    om_num     = EXCLUDED.om_num,
    om_status  = EXCLUDED.om_status,
    om_titulo  = EXCLUDED.om_titulo,
    bateria    = EXCLUDED.bateria,
    velocidade = EXCLUDED.velocidade,
    online     = TRUE,
    updated_at = NOW();

  -- Registrar no histórico a cada atualização
  INSERT INTO public.equipe_localizacao_historico
    (device_id, equipe, operador, latitude, longitude, precisao,
     om_num, om_status, velocidade)
  VALUES
    (p_device_id, p_equipe, p_operador, p_latitude, p_longitude, p_precisao,
     p_om_num, p_om_status, p_velocidade);
END;
$$;

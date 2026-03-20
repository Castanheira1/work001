-- ==========================================
-- PATCH MATERIAIS v2
-- Config (BDI + BM) + Material Vale na pricelist
-- Rodar DEPOIS do schema_supabase.sql e patch_seguranca.sql
-- ==========================================

-- 1) TABELA CONFIG (BDI, BM)
CREATE TABLE IF NOT EXISTS public.config (
  chave TEXT PRIMARY KEY,
  valor TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "config_select" ON public.config;
DROP POLICY IF EXISTS "config_update" ON public.config;
DROP POLICY IF EXISTS "config_insert" ON public.config;

CREATE POLICY "config_select" ON public.config
  FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "config_insert" ON public.config
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));
CREATE POLICY "config_update" ON public.config
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (TRUE);

-- Valores iniciais
INSERT INTO public.config (chave, valor) VALUES
  ('bdi_percentual', '18.8256'),
  ('bm_numero', ''),
  ('bm_data_inicio', ''),
  ('bm_data_fim', ''),
  ('tipo_solicitacao', 'Climatização e Refrigeração')
ON CONFLICT (chave) DO NOTHING;

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_config_updated ON public.config;
CREATE TRIGGER trg_config_updated
BEFORE UPDATE ON public.config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) MATERIAL VALE: 2 gases na pricelist (valor 0, código alto p/ aparecer separado)
-- Usar ITEM 99901 e 99902 para não colidir com itens existentes
INSERT INTO pricelist2026 ("ITEM", "DESCRIÇÃO", "UNIDADE", "PREÇO REAJUSTADO (R$)") VALUES
  (99901, 'GÁS R-32 CILINDRO C 9 KG', 'Kg', 0.00),
  (99902, 'GAS R-32', 'Kg', 0.00)
ON CONFLICT DO NOTHING;

-- 3) TABELA ACUMULATIVO POR BM (dashboard armazena consolidado)
CREATE TABLE IF NOT EXISTS public.bm_materiais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bm_numero TEXT NOT NULL,
  bm_data_inicio TEXT,
  bm_data_fim TEXT,
  om_num TEXT NOT NULL,
  om_titulo TEXT,
  tipo_solicitacao TEXT DEFAULT 'Climatização e Refrigeração',
  codigo TEXT,
  ct2 TEXT,
  descricao_material TEXT,
  unidade TEXT,
  qtd NUMERIC(10,2) DEFAULT 0,
  vl_unit NUMERIC(12,2) DEFAULT 0,
  bdi_percentual NUMERIC(8,4) DEFAULT 0,
  bdi_valor NUMERIC(12,2) DEFAULT 0,
  vl_total NUMERIC(12,2) DEFAULT 0,
  cc TEXT,
  equipamento TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bm_mat_bm ON public.bm_materiais (bm_numero);
CREATE INDEX IF NOT EXISTS idx_bm_mat_om ON public.bm_materiais (om_num);

ALTER TABLE public.bm_materiais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bm_mat_select" ON public.bm_materiais FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "bm_mat_insert" ON public.bm_materiais FOR INSERT TO authenticated WITH CHECK (TRUE);

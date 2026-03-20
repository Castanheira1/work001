-- ==========================================
-- PCM MCR - PATCH DE SEGURANÇA
-- Roda DEPOIS do schema_supabase.sql
-- ==========================================

-- ==========================================
-- 1) LIMPAR POLICIES PERMISSIVAS
-- ==========================================
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('oms','profiles','desvios','dashboard_log','pricelist2026')
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ==========================================
-- 2) POLICIES RESTRITIVAS
-- ==========================================

-- PRICELIST: anon pode LER (app precisa antes do login para cache)
--            authenticated pode LER
ALTER TABLE public.pricelist2026 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pricelist_read" ON public.pricelist2026
  FOR SELECT TO anon, authenticated USING (TRUE);

-- OMS: só authenticated lê e escreve
CREATE POLICY "oms_select" ON public.oms
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "oms_insert" ON public.oms
  FOR INSERT TO authenticated WITH CHECK (TRUE);

CREATE POLICY "oms_update" ON public.oms
  FOR UPDATE TO authenticated USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "oms_delete" ON public.oms
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  ));

-- DESVIOS: só authenticated
CREATE POLICY "desvios_select" ON public.desvios
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "desvios_insert" ON public.desvios
  FOR INSERT TO authenticated WITH CHECK (TRUE);

-- DASHBOARD_LOG: só authenticated
CREATE POLICY "dashboard_select" ON public.dashboard_log
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "dashboard_insert" ON public.dashboard_log
  FOR INSERT TO authenticated WITH CHECK (TRUE);

-- PROFILES: leitura pra authenticated, escrita só admin
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  ) OR NOT EXISTS (SELECT 1 FROM public.profiles));

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  ))
  WITH CHECK (TRUE);

-- ==========================================
-- 3) STORAGE: só authenticated
-- ==========================================
DROP POLICY IF EXISTS "pcm_files_select" ON storage.objects;
DROP POLICY IF EXISTS "pcm_files_insert" ON storage.objects;
DROP POLICY IF EXISTS "pcm_files_update" ON storage.objects;
DROP POLICY IF EXISTS "pcm_files_delete" ON storage.objects;

CREATE POLICY "pcm_files_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'pcm-files');

CREATE POLICY "pcm_files_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'pcm-files');

CREATE POLICY "pcm_files_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'pcm-files')
  WITH CHECK (bucket_id = 'pcm-files');

CREATE POLICY "pcm_files_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'pcm-files' AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  ));

-- ==========================================
-- 4) BUCKET PRIVADO (não público)
-- ==========================================
UPDATE storage.buckets SET public = false WHERE id = 'pcm-files';

-- ==========================================
-- 5) CRIAR USUÁRIOS MECÂNICOS
-- ==========================================
-- No Supabase Dashboard > Authentication > Users, crie:
--
--   Email: equipe1@soberano.local   Senha: mcr2026eq1
--   Email: equipe2@soberano.local   Senha: mcr2026eq2
--   Email: equipe3@soberano.local   Senha: mcr2026eq3
--   Email: admin@soberano.local     Senha: (sua senha)
--
-- Depois, para cada UUID gerado:
--
-- INSERT INTO public.profiles (user_id, username, role) VALUES
--   ('UUID_EQUIPE1', 'equipe1', 'mecanico'),
--   ('UUID_EQUIPE2', 'equipe2', 'mecanico'),
--   ('UUID_EQUIPE3', 'equipe3', 'mecanico'),
--   ('UUID_ADMIN',   'admin',   'admin')
-- ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role, updated_at = NOW();

-- Endurecimento mínimo de permissões para produção.
-- Execute em ambiente controlado e valide o impacto nas telas antes de promover.

begin;

alter table if exists public.profiles enable row level security;
alter table if exists public.desvios enable row level security;
alter table if exists public.dashboard_log enable row level security;
alter table if exists public.config enable row level security;

revoke all on table public.profiles from anon;
revoke all on table public.desvios from anon;
revoke all on table public.dashboard_log from anon;
revoke all on table public.config from anon;

revoke all on table public.profiles from authenticated;
revoke all on table public.dashboard_log from authenticated;

grant select on table public.profiles to authenticated;
grant select, insert on table public.desvios to authenticated;
grant select on table public.config to authenticated;

-- Profiles: cada usuário autenticado lê apenas o próprio perfil.
drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_select_anon on public.profiles;
create policy profiles_select_self
on public.profiles
for select
to authenticated
using (auth.uid() = user_id);

-- Desvios: cliente autenticado pode ler e registrar desvios.
drop policy if exists desvios_select on public.desvios;
drop policy if exists desvios_insert on public.desvios;
create policy desvios_select_auth
on public.desvios
for select
to authenticated
using (true);
create policy desvios_insert_auth
on public.desvios
for insert
to authenticated
with check (true);

-- Dashboard log: bloquear leitura/inserção direta pelo cliente.
drop policy if exists dashboard_select on public.dashboard_log;
drop policy if exists dashboard_insert on public.dashboard_log;

-- Config: manter leitura apenas autenticada.
drop policy if exists config_select_anon on public.config;
drop policy if exists config_select on public.config;
create policy config_select_auth
on public.config
for select
to authenticated
using (true);

commit;

-- ─────────────────────────────────────────────────────────────────────────────
-- [TIMESTAMP]_[descripcion_corta].sql
-- Descripción: Qué hace esta migración y por qué
-- ─────────────────────────────────────────────────────────────────────────────
--
-- REGLAS para ClashPro (MVP)
-- ==========================
-- 1. NUNCA modificar una migración ya aplicada al proyecto remoto.
--    Si necesitas cambiar algo, crea una nueva migración.
--
-- 2. SIEMPRE usar guardas idempotentes:
--    - Tablas nuevas:    CREATE TABLE IF NOT EXISTS
--    - Columnas nuevas:  ALTER TABLE ... ADD COLUMN IF NOT EXISTS
--    - Funciones:        CREATE OR REPLACE FUNCTION
--    - Políticas RLS:    usar bloque DO con manejo de excepción (ver abajo)
--    - Índices nuevos:   CREATE INDEX IF NOT EXISTS
--
-- 3. NUNCA poner datos de seed en migraciones.
--    Los datos iniciales van en supabase/seed.sql (con ON CONFLICT DO NOTHING).
--
-- 4. Nomenclatura de archivo: YYYYMMDDHHmmss_descripcion_snake_case.sql
--    Ejemplo: 20260415120000_add_user_level_column.sql
--
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Tabla nueva ───────────────────────────────────────────────────────────────
create table if not exists public.example_table (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete cascade not null,
  data       jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ── Habilitar RLS (idempotente) ───────────────────────────────────────────────
alter table public.example_table enable row level security;

-- ── Política RLS (idempotente con DO) ────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'example_table'
      and policyname = 'example_table: propietario'
  ) then
    create policy "example_table: propietario"
      on public.example_table
      for all
      using (auth.uid() = user_id);
  end if;
end $$;

-- ── Índice (idempotente) ──────────────────────────────────────────────────────
create index if not exists example_table_user_idx
  on public.example_table (user_id);

-- ── Columna nueva en tabla existente ─────────────────────────────────────────
alter table public.profiles
  add column if not exists example_column text;

-- ── Función PL/pgSQL ──────────────────────────────────────────────────────────
-- CREATE OR REPLACE es siempre idempotente para funciones.
create or replace function public.example_function(p_user_id uuid)
returns json
language plpgsql security definer
as $$
begin
  -- lógica aquí
  return json_build_object('ok', true);
end;
$$;

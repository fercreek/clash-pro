-- ─────────────────────────────────────────────────────────────────────────────
-- 20260421181814_practice_sessions_content.sql
-- Descripción: Historial de sesiones de práctica. La migración anterior
--              (20260421181746_practice_sessions.sql) quedó vacía por error;
--              esta crea la tabla con contenido real de forma idempotente.
--              Feature: quick-practice-roster.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.practice_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  started_at  timestamptz,
  ended_at    timestamptz,
  competitors jsonb not null default '[]'::jsonb,
  iterations  jsonb not null default '[]'::jsonb,
  stats       jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

alter table public.practice_sessions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'practice_sessions'
      and policyname = 'practice_sessions: select own'
  ) then
    create policy "practice_sessions: select own"
      on public.practice_sessions
      for select
      using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'practice_sessions'
      and policyname = 'practice_sessions: insert own'
  ) then
    create policy "practice_sessions: insert own"
      on public.practice_sessions
      for insert
      with check (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'practice_sessions'
      and policyname = 'practice_sessions: update own'
  ) then
    create policy "practice_sessions: update own"
      on public.practice_sessions
      for update
      using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'practice_sessions'
      and policyname = 'practice_sessions: delete own'
  ) then
    create policy "practice_sessions: delete own"
      on public.practice_sessions
      for delete
      using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists practice_sessions_user_created_idx
  on public.practice_sessions (user_id, created_at desc);

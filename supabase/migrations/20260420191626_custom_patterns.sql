-- ─────────────────────────────────────────────────────────────────────────────
-- 20260420191626_custom_patterns.sql
-- Descripción: tabla custom_patterns — patrones rítmicos creados por el usuario
--              (editor step-sequencer + tap-to-record). 16 pasos × 5 instrumentos.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.custom_patterns (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  bpm         int  not null default 90,
  pattern     jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.custom_patterns enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'custom_patterns' and policyname = 'custom_patterns: owner select'
  ) then
    create policy "custom_patterns: owner select"
      on public.custom_patterns for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'custom_patterns' and policyname = 'custom_patterns: owner insert'
  ) then
    create policy "custom_patterns: owner insert"
      on public.custom_patterns for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'custom_patterns' and policyname = 'custom_patterns: owner update'
  ) then
    create policy "custom_patterns: owner update"
      on public.custom_patterns for update
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'custom_patterns' and policyname = 'custom_patterns: owner delete'
  ) then
    create policy "custom_patterns: owner delete"
      on public.custom_patterns for delete
      using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists custom_patterns_user_updated_idx
  on public.custom_patterns (user_id, updated_at desc);

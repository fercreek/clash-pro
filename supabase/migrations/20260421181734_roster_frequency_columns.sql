-- ─────────────────────────────────────────────────────────────────────────────
-- 20260421181734_roster_frequency_columns.sql
-- Descripción: Añade métricas de frecuencia al roster de competidores (bailarines)
--              para poder ordenar el picker por "más frecuentes" en la pantalla
--              de Práctica. Feature: quick-practice-roster.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.competitors
  add column if not exists frequency_count int not null default 0;

alter table public.competitors
  add column if not exists last_danced_at timestamptz;

create index if not exists competitors_frequency_idx
  on public.competitors (frequency_count desc);

create index if not exists competitors_last_danced_idx
  on public.competitors (last_danced_at desc nulls last);

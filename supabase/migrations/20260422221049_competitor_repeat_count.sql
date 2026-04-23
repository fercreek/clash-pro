-- ─────────────────────────────────────────────────────────────────────────────
-- 20260422221049_competitor_repeat_count.sql
-- Descripción: Agrega repeat_count a competitors — número de veces que un bailarín
--              fue el "impar extra" en una sesión de práctica (ronda con número impar
--              de participantes). Usado para distribuir equitativamente quién repite.
--
-- Migración a Opción B (user_dancer_stats per-user) — ver specs/quick-practice-roster/FUTURE_DECISION.md
-- Cuando se implemente B: esta columna pasa a ser respaldo global; el algoritmo
-- leerá de user_dancer_stats.total_repeats en su lugar.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.competitors
  add column if not exists repeat_count int not null default 0;

create index if not exists competitors_repeat_count_idx
  on public.competitors (repeat_count asc);

-- ─────────────────────────────────────────────────────────────────────────────
-- 20260429132747_competitor_level.sql
-- Descripción: TODO — describe qué hace esta migración y por qué
-- ─────────────────────────────────────────────────────────────────────────────
--
-- REGLAS (ver supabase/migrations/TEMPLATE.sql para plantilla completa):
--  · Siempre idempotente: IF NOT EXISTS, CREATE OR REPLACE, ADD COLUMN IF NOT EXISTS
--  · NUNCA modificar migraciones ya aplicadas al remoto
--  · NUNCA poner datos seed aquí — esos van en supabase/seed.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- Add skill level to competitors for level-aware pairing algorithm.
-- null = unassigned (treated as intermedio in pairing cost function).

alter table public.competitors
  add column if not exists level text
  check (level in ('beginner', 'intermedio', 'avanzado'));

-- ─────────────────────────────────────────────────────────────────────────────
-- 20260408165200_upgrade_all_users_to_pro.sql
-- Descripción: Convierte todos los usuarios con plan 'free' o sin plan a 'pro' (early adopter perk)
-- ─────────────────────────────────────────────────────────────────────────────
--
-- REGLAS (ver supabase/migrations/TEMPLATE.sql para plantilla completa):
--  · Siempre idempotente: IF NOT EXISTS, CREATE OR REPLACE, ADD COLUMN IF NOT EXISTS
--  · NUNCA modificar migraciones ya aplicadas al remoto
--  · NUNCA poner datos seed aquí — esos van en supabase/seed.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- Todos los early adopters (plan 'free' o sin plan) pasan a 'pro'.
-- Idempotente: re-ejecutar no afecta usuarios que ya tienen plan = 'pro'.
update public.profiles
set plan = 'pro'
where plan = 'free' or plan is null;

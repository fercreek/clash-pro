-- ─────────────────────────────────────────────────────────────────────────────
-- ClashPro — Seed de datos iniciales
-- ─────────────────────────────────────────────────────────────────────────────
-- Este archivo es idempotente: se puede ejecutar N veces sin error ni duplicados.
--
-- Cuándo aplicar:
--   supabase db reset --linked   →  resetea la DB y aplica migrations + seed
--   O ejecutar manualmente vía Supabase Studio → SQL Editor
--
-- Mis bailarines: la función public.seed_roster_for_user (migración) inserta
-- el roster demo por cuenta. Tras reset, si ya existen perfiles, se rellenan aquí.
-- Los nuevos registros en profiles disparan el trigger on_profile_seed_roster.
-- ─────────────────────────────────────────────────────────────────────────────

select public.seed_roster_for_user(id) from public.profiles;

-- Playlists del sistema (Salsanama oficiales)
insert into public.playlists (name, spotify_uri, spotify_url, is_system) values
  ('SALSANAMÁ MX OFICIAL',
   'spotify:playlist:01ijIUEbfx4JAYP4cdPOX3',
   'https://open.spotify.com/playlist/01ijIUEbfx4JAYP4cdPOX3',
   true),
  ('Salsanama Training 2026',
   'spotify:playlist:7prxrpTaqFEDleRHrT7wbR',
   'https://open.spotify.com/playlist/7prxrpTaqFEDleRHrT7wbR',
   true),
  ('A MI MANERA | SALSANAMA TURKEY',
   'spotify:playlist:7legD3mxgnZxL3sEMtxNsv',
   'https://open.spotify.com/playlist/7legD3mxgnZxL3sEMtxNsv',
   true),
  ('SALSANAMÀ 2020',
   'spotify:playlist:1O1TltOSAfoOpQxfIBc2HT',
   'https://open.spotify.com/playlist/1O1TltOSAfoOpQxfIBc2HT',
   true),
  ('PROPOSALS',
   'spotify:playlist:0J6LUPCOmgErQZAA7mqVID',
   'https://open.spotify.com/playlist/0J6LUPCOmgErQZAA7mqVID',
   true)
on conflict do nothing;

-- Códigos promo iniciales
insert into public.promo_codes (code, plan, max_uses) values
  ('SALSANAMA26', 'pro', 50)
on conflict (code) do nothing;

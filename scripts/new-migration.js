#!/usr/bin/env node
// scripts/new-migration.js
// Usage: node scripts/new-migration.js <nombre_snake_case>
// Or via npm: npm run db:new -- <nombre_snake_case>

import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const name = process.argv[2]

if (!name) {
  console.error('Error: falta el nombre de la migración.')
  console.error('Uso: npm run db:new -- nombre_descriptivo')
  console.error('Ejemplo: npm run db:new -- add_user_level_column')
  process.exit(1)
}

if (!/^[a-z][a-z0-9_]*$/.test(name)) {
  console.error('Error: el nombre debe ser snake_case (solo letras minúsculas, números y guiones bajos).')
  process.exit(1)
}

// Generate YYYYMMDDHHmmss timestamp in local time
const now = new Date()
const pad = (n) => String(n).padStart(2, '0')
const timestamp =
  now.getFullYear().toString() +
  pad(now.getMonth() + 1) +
  pad(now.getDate()) +
  pad(now.getHours()) +
  pad(now.getMinutes()) +
  pad(now.getSeconds())

const filename = `${timestamp}_${name}.sql`
const migrationsDir = join(ROOT, 'supabase', 'migrations')

if (!existsSync(migrationsDir)) {
  mkdirSync(migrationsDir, { recursive: true })
}

const outputPath = join(migrationsDir, filename)

const content = `-- ─────────────────────────────────────────────────────────────────────────────
-- ${filename}
-- Descripción: TODO — describe qué hace esta migración y por qué
-- ─────────────────────────────────────────────────────────────────────────────
--
-- REGLAS (ver supabase/migrations/TEMPLATE.sql para plantilla completa):
--  · Siempre idempotente: IF NOT EXISTS, CREATE OR REPLACE, ADD COLUMN IF NOT EXISTS
--  · NUNCA modificar migraciones ya aplicadas al remoto
--  · NUNCA poner datos seed aquí — esos van en supabase/seed.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- TODO: reemplaza este bloque con el SQL de tu migración

-- Ejemplo — tabla nueva:
-- create table if not exists public.mi_tabla (
--   id         uuid primary key default gen_random_uuid(),
--   user_id    uuid references public.profiles(id) on delete cascade not null,
--   created_at timestamptz not null default now()
-- );
--
-- alter table public.mi_tabla enable row level security;
--
-- do $$
-- begin
--   if not exists (
--     select 1 from pg_policies
--     where schemaname = 'public'
--       and tablename  = 'mi_tabla'
--       and policyname = 'mi_tabla: propietario'
--   ) then
--     create policy "mi_tabla: propietario"
--       on public.mi_tabla
--       for all
--       using (auth.uid() = user_id);
--   end if;
-- end $$;
--
-- create index if not exists mi_tabla_user_idx on public.mi_tabla (user_id);
`

writeFileSync(outputPath, content, 'utf8')

console.log(`Migración creada: supabase/migrations/${filename}`)
console.log()
console.log('Próximos pasos:')
console.log(`  1. Edita el SQL en: ${outputPath}`)
console.log('  2. npm run db:push   ← aplica al proyecto remoto')

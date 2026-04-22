# tasks.md — `quick-practice-roster`

## Fase 1 — Data Layer

- [ ] 1. `npm run db:new roster_frequency_columns`
  - `ALTER TABLE public.competitors ADD COLUMN IF NOT EXISTS frequency_count int DEFAULT 0;`
  - `ALTER TABLE public.competitors ADD COLUMN IF NOT EXISTS last_danced_at timestamptz;`
  - `CREATE INDEX IF NOT EXISTS competitors_frequency_idx ON public.competitors (frequency_count DESC);`
- [ ] 2. `npm run db:new practice_sessions`
  - Seguir `supabase/TEMPLATE.sql`: `CREATE TABLE IF NOT EXISTS public.practice_sessions ( ... )`
  - Columnas: `id uuid PK default gen_random_uuid()`, `user_id uuid references auth.users(id) on delete cascade`, `started_at timestamptz`, `ended_at timestamptz`, `competitors jsonb not null default '[]'::jsonb`, `iterations jsonb not null default '[]'::jsonb`, `stats jsonb not null default '{}'::jsonb`, `created_at timestamptz default now()`
  - `ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;`
  - Políticas idempotentes (bloque DO): select/insert/update/delete con `auth.uid() = user_id`
  - `CREATE INDEX IF NOT EXISTS practice_sessions_user_created_idx ON public.practice_sessions (user_id, created_at DESC);`
- [ ] 3. `npm run db:push`

## Fase 2 — Business Logic

- [ ] 4. `src/utils/nameParser.js`
  - `export function parseNames(str): string[]`
  - Split regex: `/[,;\n\t]+/`
  - Trim + filtro vacíos + dedupe case-insensitive (primer caso gana para casing)
  - Tests inline como pure functions (opcional, documentar con comentario único)
- [ ] 5. `src/utils/practiceRounds.js`
  - `export function generatePracticeRounds(names, seed?)` → `{ rounds, stats }`
  - Si `names.length <= 3`: fallback a `generateRoundRobin(names)` con BYE
  - Si par: round-robin estándar
  - Si impar `>3`: agregar ghost "REPEAT" → al emparejarse con X en ronda R, reemplazar por bailarín `argmin(appearances)` excluyendo quien apareció en R-1 (no consecutivo)
  - Construir `stats.appearances = { name: count }` y `stats.pairs = [[a, b, count], …]` ordenado desc
- [ ] 6. `src/hooks/useRoster.js`
  - `const { roster, loading, addDancer, bumpFrequency } = useRoster()`
  - `roster`: top 24 desc por frequency
  - `addDancer(name)`: insert con `user_id`
  - `bumpFrequency(names)`: select ids por name.in → update en batch incrementando count y set last_danced_at
- [ ] 7. `src/hooks/usePracticeSession.js`
  - `save(session)`, `list()`, `get(id)`

## Fase 3 — UI Components

- [ ] 8. `src/components/BulkNameInput.jsx`
  - Textarea Brand Kit (`bg-zinc-900/60 border border-zinc-800 focus:border-zinc-600 rounded-2xl`)
  - Preview debajo: chips con nombres parseados en tiempo real
  - Botón "Agregar N" (rojo Brand Kit) → onAdd(names[])
- [ ] 9. `src/components/RosterPicker.jsx`
  - Grid de chips: `nombre` + badge `×N` (frequency_count)
  - Seleccionado: `bg-red-500/10 border-red-500/30 text-red-300`; no: `bg-zinc-900/60 border-zinc-800 text-zinc-400`
  - "+ Nuevo" inline prompt
  - Props: `{ roster, selected, onToggle, onAdd }`
- [ ] 10. `src/components/PracticeHistoryScreen.jsx`
  - Lista de sesiones (fecha relativa, # bailarines, # iteraciones)
  - Click → detalle: top 3 apariciones + top pareos
  - Usar `AV_BG` para avatares del top

## Fase 4 — Integration

- [ ] 11. `src/components/SetupScreen.jsx`
  - En modo `practice`: renderizar `<RosterPicker>` arriba + `<BulkNameInput>` debajo
  - Selected + bulk parsed → merged `competitors` array (dedupe)
  - Modo `tournament`: sin cambios
- [ ] 12. `src/App.jsx`
  - Tras última ronda en modo practice, mostrar `<button>Siguiente iteración</button>` + `<button>Terminar práctica</button>`
  - "Siguiente" → acumular stats + llamar `handleNewSession` con nuevo seed
  - "Terminar" → `usePracticeSession.save({ competitors, iterations, stats, started_at, ended_at })` + `useRoster.bumpFrequency(competitors)` → navigate a `/historial-practica`
- [ ] 13. Ruta + menu
  - `src/App.jsx`: agregar `SCREENS.PRACTICE_HISTORY`, handler `goToPracticeHistory`, popstate, pushState(`/historial-practica`)
  - `src/components/HamburgerMenu.jsx`: enlace "Historial práctica"
- [ ] 14. `tests/practice-roster.spec.js` (Playwright)
  - Login mock → Dashboard → "Práctica libre"
  - Click 2 chips + pegar "Pedro, Ana, Luis" → "Agregar 3"
  - Verifica 5 chips seleccionados
  - "Generar" → MatchesScreen con rondas
  - Verifica que aparece botón "Terminar práctica" al cerrar
  - Click "Terminar" → redirect `/historial-practica` → fila visible

## Fase 5 — Docs

- [ ] 15. `specs/quick-practice-roster/FUTURE_DECISION.md` — trade-off global vs per-user (ya creado en Fase 0 junto al spec-kit)
- [ ] 16. `CLAUDE.md` — sección "Spec-kit workflow" + ruta `specs/`

---

## Commits por fase

- `feat(db): roster frequency columns + practice_sessions table`
- `feat(practice): nameParser, practiceRounds, hooks`
- `feat(practice): BulkNameInput, RosterPicker, PracticeHistoryScreen`
- `feat(practice): integrate roster + iteration flow in SetupScreen/App`
- `docs: quick-practice-roster spec-kit + CLAUDE update`

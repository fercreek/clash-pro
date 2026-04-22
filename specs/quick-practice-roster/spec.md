# spec.md — `quick-practice-roster`

## Problem Statement

SetupScreen obliga a teclear participantes uno por uno. Cada sesión de práctica arranca en blanco. No hay métricas de armado (quién bailó cuánto, con quién) ni concepto de iteración continua. Fer va cada semana a la misma peña con los mismos bailarines y pierde tiempo retecleando.

## User Stories

- **Como Fer**, quiero pegar "Juan, Ale, Carlos, María" en un textarea y que se armen las rondas.
- **Como Fer**, quiero ver un roster con los bailarines más frecuentes arriba y marcar con checkbox quiénes vinieron hoy.
- **Como Fer**, si falta alguien, quiero agregarlo inline (se suma al roster global para próximas veces).
- **Como Fer**, al acabar una iteración quiero "siguiente iteración" y que acumule métricas.
- **Como Fer**, quiero un historial por sesión con apariciones y top pareos, sin importar resultados.

## Acceptance Criteria

- [ ] Input bulk con split por `,`, `\n`, `;`, tab.
- [ ] Roster muestra hasta 24 bailarines ordenados por `frequency_count DESC, last_danced_at DESC NULLS LAST`.
- [ ] Checkbox toggle; "+ nuevo" inline crea fila en `competitors` con `user_id = auth.uid()`.
- [ ] Impar → un bailarín repite con regla "no consecutivo"; cuenta doble en `stats.appearances`.
- [ ] Botón "Siguiente iteración" al cerrar rondas → regenera con rotación distinta.
- [ ] "Terminar práctica" guarda `practice_session` + bump `frequency_count` y `last_danced_at`.
- [ ] Pantalla `Historial práctica` lista sesiones: fecha, # bailarines, # iteraciones, top 3 apariciones.
- [ ] Modo torneo **intacto** (no tocar `roundRobin.js`).

## Data Model

| Tabla | Cambio |
|---|---|
| `competitors` (existente) | `ADD COLUMN IF NOT EXISTS frequency_count int DEFAULT 0`, `ADD COLUMN IF NOT EXISTS last_danced_at timestamptz`. Índice `(frequency_count DESC)`. |
| `practice_sessions` (nueva) | `id uuid PK`, `user_id uuid FK profiles`, `started_at timestamptz`, `ended_at timestamptz`, `competitors jsonb` (array de nombres), `iterations jsonb` (array de `{ rounds: [[a,b], …] }`), `stats jsonb` (`{ appearances: {name: n}, pairs: [[a,b,n], …] }`), `created_at timestamptz DEFAULT now()`. RLS `auth.uid() = user_id`. Índice `(user_id, created_at DESC)`. |

## API Contract

Sin endpoint externo. Todo vía `@supabase/supabase-js`:

- `supabase.from('competitors').select('*').order('frequency_count', {ascending:false}).order('last_danced_at',{ascending:false,nullsLast:true}).limit(24)`
- `supabase.from('competitors').insert({ name, user_id: auth.uid() })`
- `supabase.from('competitors').update({ frequency_count: frequency_count+1, last_danced_at: now }).in('name', selectedNames)` (via RPC o select+update in batch).
- `supabase.from('practice_sessions').insert(payload)`
- `supabase.from('practice_sessions').select('*').eq('user_id', uid).order('created_at', {ascending:false})`

## Out of Scope

- Perfiles individuales por bailarín (foto, bio, nivel) — futuro.
- Auth social / multi-tenant con peñas distintas.
- Ranking público cross-user.
- Métricas globales cross-user (ver `FUTURE_DECISION.md`).
- Importar bailarines de redes/CSV.

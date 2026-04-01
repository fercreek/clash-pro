# ClashPro — Plan de trabajo ordenado para versión Pro

> Última actualización: 2026-04-01
> Para ejecutar en Cursor. Cada tarea tiene el prompt listo para pegar.

---

## Visión de la versión Pro

ClashPro Pro agrega las features que un instructor o evento local necesita y que van más allá del uso casual:
historial, estadísticas, vista de público, modo juez multi-dispositivo, y compartir resultados.

**Regla de oro:** cada feature nueva debe funcionar antes de agregar cobro.
Primero construye, luego valida, luego cobra.

---

## Estado actual (base estable)

- [x] Auth username/password (email fake `@clashpro.local`)
- [x] Round Robin automático
- [x] Cronómetro por fases con pausa/reanudar
- [x] Cierre rápido de batalla desde la lista
- [x] Leaderboard en tiempo real
- [x] Compartir ranking por WhatsApp / Web Share
- [x] Persistencia en localStorage + Supabase por usuario
- [x] Spotify Embed Player + PKCE OAuth para playlists personales
- [x] Botón atrás del teléfono (History API)
- [x] PWA instalable (manifest.json)

---

## Fase 1 — Historial y estadísticas (PRIORIDAD ALTA)

> Esta es la feature más fácil de vender: "¿cuántas veces has ganado este mes?"

### Tarea 1.1 — Guardar torneo al finalizar

**Qué hace:** cuando el usuario hace reset o ve el leaderboard final, se guarda el torneo completo
en la tabla `tournaments` + `battles` de Supabase.

**Archivos a modificar:**
- `src/App.jsx` — al hacer reset, llamar a `saveTournamentHistory()`
- `src/hooks/useTournamentHistory.js` — nuevo hook
- `supabase/migrations/` — verificar que tablas `tournaments` y `battles` existan

**Prompt para Cursor:**
```
En ClashPro (React + Supabase), al hacer reset del torneo quiero guardar el historial completo.

Crea el hook `src/hooks/useTournamentHistory.js` con la función `saveTournament({ user, competitors, matches, roundTime })` que:
1. Inserta una fila en `public.tournaments` (name=fecha de hoy, round_time_seconds, created_by=user.id)
2. Para cada match en `matches`, inserta en `public.battles` (tournament_id, competitor_a_id buscando por nombre en competitors, competitor_b_id, result, completed)
3. Devuelve el id del torneo creado

En `src/App.jsx`, en `handleReset()`, llama a esta función antes de clearState() si hay al menos un match completado.

Usa el cliente Supabase de `src/lib/supabase.js`. Maneja errores con console.error silencioso (no romper el flujo del usuario).
```

---

### Tarea 1.2 — Pantalla de historial

**Qué hace:** nueva pantalla que muestra los torneos anteriores del usuario con fecha, participantes y ganador.

**Archivos a crear/modificar:**
- `src/components/HistoryScreen.jsx` — nueva pantalla
- `src/App.jsx` — agregar `SCREENS.HISTORY`, botón en SetupScreen para navegar

**Prompt para Cursor:**
```
En ClashPro, crea la pantalla `src/components/HistoryScreen.jsx` que:
1. Carga los últimos 20 torneos del usuario desde `public.tournaments` (filtrado por `created_by = user.id`, ordenado por `created_at DESC`)
2. Para cada torneo muestra: fecha, cantidad de participantes, nombre del ganador (el que más victorias tuvo en ese torneo según `public.battles`)
3. Al hacer tap en un torneo, muestra el detalle: lista de batallas con resultado A/B/Empate
4. Botón "← Volver" que regresa a SetupScreen

Estilo consistente con el resto de la app: fondo zinc-950, texto blanco, acentos red-500, fuente condensada.
Usa el hook `useAuth` para obtener el usuario. Carga con Supabase client de `src/lib/supabase.js`.

En `src/App.jsx` agrega `HISTORY: 'history'` al enum SCREENS y el link "Ver historial" en SetupScreen.
```

---

### Tarea 1.3 — Estadísticas por bailarín

**Qué hace:** en la pantalla de historial o en el perfil del competidor, mostrar su récord total: victorias, derrotas, empates, racha actual.

**Archivos a crear/modificar:**
- `src/components/StatsScreen.jsx` — nueva
- `src/utils/stats.js` — función `computeStats(matches, competitorName)`

**Prompt para Cursor:**
```
En ClashPro, crea `src/utils/stats.js` con la función `computeStats(matches, name)` que recibe el array de matches de un torneo y el nombre de un competidor, y retorna:
{ wins, losses, draws, played, winRate, currentStreak, bestStreak }

Luego crea `src/components/StatsScreen.jsx` que:
1. Recibe `competitorName` como prop
2. Carga todos los battles de ese competidor desde Supabase (buscando en battles donde competitor_a.name = name OR competitor_b.name = name)
3. Muestra sus stats generales + historial de torneos en los que participó
4. Botón volver

El componente debe manejar el estado de carga con un spinner (lucide-react Loader2).
```

---

## Fase 2 — Vista pública para eventos (PRIORIDAD MEDIA)

> Para eventos locales: proyectar el bracket en una pantalla o compartir un link de solo lectura.

### Tarea 2.1 — Vista de solo lectura vía URL pública

**Qué hace:** generar un URL único (ej. `clash-pro.vercel.app/live/abc123`) donde cualquiera puede ver
el bracket en tiempo real sin poder modificarlo.

**Archivos a crear/modificar:**
- `src/components/PublicView.jsx` — componente de solo lectura
- `supabase/migrations/` — columna `public_id` en `tournaments` + tabla `live_state`
- `src/App.jsx` — botón "Compartir vista en vivo" en MatchesScreen

**Prompt para Cursor:**
```
En ClashPro, implementa una vista pública de solo lectura para el torneo activo.

1. En `public.user_tournament_state` agrega columna `public_id text unique default gen_random_uuid()::text`
2. Crea `src/components/PublicView.jsx` que:
   - Lee el `public_id` de la URL (por ejemplo `/live/:publicId`)
   - Hace polling cada 5 segundos a Supabase: SELECT * FROM user_tournament_state WHERE public_id = :publicId
   - Muestra la lista de matches con sus resultados actuales y el leaderboard parcial
   - Diseño limpio para proyectar: texto grande, fondo negro, sin controles de edición
3. En `src/components/MatchesScreen.jsx` agrega botón "📺 Vista en vivo" que copia el URL público al clipboard

Nota: no necesita router. Detecta `/live/` en `window.location.pathname` al inicio de App.jsx y renderiza PublicView en su lugar.
```

---

### Tarea 2.2 — Compartir resultado como imagen

**Qué hace:** al terminar el torneo, generar una imagen con el podio (1er, 2do, 3er lugar) en formato
vertical tipo Stories (1080×1920) para compartir en Instagram/WhatsApp.

**Archivos a crear/modificar:**
- `src/utils/generateResultImage.js` — Canvas API
- `src/components/LeaderboardScreen.jsx` — botón "Compartir como imagen"

**Prompt para Cursor:**
```
En ClashPro, en `src/components/LeaderboardScreen.jsx`, agrega un botón "📸 Compartir resultado" que genera una imagen con Canvas API y la descarga o comparte via Web Share API.

La imagen debe tener:
- Fondo negro (#09090b)
- Logo "ClashPro" arriba en rojo
- Fecha del torneo
- Top 3 con nombre y puntaje: 🥇 🥈 🥉
- Lista del ranking completo debajo en texto más pequeño
- Tamaño: 1080×1920px (formato Stories)

Crea `src/utils/generateResultImage.js` con la función `generateResultImage({ competitors, matches })` que:
1. Crea un canvas offscreen de 1080×1920
2. Dibuja el diseño descrito
3. Retorna un Blob (image/png)

En LeaderboardScreen, al hacer click en el botón:
- Si `navigator.share` existe y soporta files → usar Web Share API
- Si no → descargar el archivo directamente con un link temporal

Usa `calculateScores` de `src/utils/roundRobin.js` para obtener el ranking.
```

---

## Fase 3 — Modo juez multi-dispositivo (PRIORIDAD BAJA / EVENTO)

> Para eventos más formales donde hay varios jueces votando desde sus teléfonos.

### Tarea 3.1 — Sesión de votación en tiempo real

**Qué hace:** el organizador crea una batalla, genera un QR, los jueces escanean y votan desde sus
teléfonos. El resultado se decide por mayoría.

**Archivos a crear/modificar:**
- `supabase/migrations/` — tabla `judge_votes`
- `src/components/JudgeView.jsx` — vista para el juez (votar A/B/Empate)
- `src/components/BattleScreen.jsx` — modo "multi-juez" con resultados en tiempo real (Supabase Realtime)
- `src/hooks/useJudgeSession.js`

**Prompt para Cursor:**
```
En ClashPro, implementa votación multi-juez usando Supabase Realtime.

Schema SQL nuevo:
  CREATE TABLE public.judge_votes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    battle_id text NOT NULL,
    judge_id text NOT NULL,
    vote text CHECK (vote IN ('A', 'B', 'draw')),
    created_at timestamptz DEFAULT now(),
    UNIQUE(battle_id, judge_id)
  );
  ALTER TABLE public.judge_votes ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "votes: insert público" ON public.judge_votes FOR INSERT WITH CHECK (true);
  CREATE POLICY "votes: lectura pública" ON public.judge_votes FOR SELECT USING (true);

Crea `src/hooks/useJudgeSession.js` con:
- `submitVote(battleId, judgeId, vote)` — inserta/actualiza voto en Supabase
- `subscribeToVotes(battleId, onChange)` — Supabase Realtime subscription

Crea `src/components/JudgeView.jsx`:
- Se activa cuando la URL contiene `/judge/:battleId/:judgeId`
- Muestra los nombres de los dos competidores
- 3 botones grandes: [Nombre A] [Empate] [Nombre B]
- Tras votar muestra "✓ Voto registrado"

En `src/components/BattleScreen.jsx`, en modo multi-juez:
- Mostrar QR del link de juez (usar librería qrcode.react)
- Mostrar conteo de votos en tiempo real: A: 2 | Empate: 0 | B: 1
- Botón "Cerrar votación" que toma el resultado por mayoría
```

---

## Fase 4 — Stripe y planes (HACER AL FINAL)

> Solo cuando las features Pro estén construidas y validadas con usuarios reales.

### Tarea 4.1 — Integrar Stripe Checkout

**Archivos a crear/modificar:**
- `src/components/UpgradeModal.jsx` — modal que aparece al tocar feature bloqueada
- `src/hooks/usePlan.js` — hook para leer el plan del usuario y los límites
- `supabase/migrations/` — columnas `plan`, `plan_expires_at`, `stripe_customer_id` en `profiles`
- Supabase Edge Function `stripe-webhook` — activa plan tras pago exitoso

**Prompt para Cursor:**
```
En ClashPro, integra Stripe para planes Pro ($5/mes) y Evento ($10/uso).

1. Agrega a `public.profiles`:
   ALTER TABLE public.profiles ADD COLUMN plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'event'));
   ALTER TABLE public.profiles ADD COLUMN plan_expires_at timestamptz;
   ALTER TABLE public.profiles ADD COLUMN stripe_customer_id text;

2. Crea `src/hooks/usePlan.js` que lee `profile.plan` y expone:
   { isFree, isPro, maxCompetitors, hasHistory, hasPublicView, hasMultiJudge }

3. Crea `src/components/UpgradeModal.jsx`: modal oscuro con descripción de la feature bloqueada,
   precio, y botón "Actualizar a Pro" que redirige a Stripe Checkout.

4. En los componentes donde aplican límites (SetupScreen para maxCompetitors, HistoryScreen, etc.),
   importa `usePlan` y bloquea con `<UpgradeModal>` si el plan no lo permite.

5. La URL de Stripe Checkout la genera una Supabase Edge Function `create-checkout-session` que
   recibe el userId y el priceId y retorna la URL. Crea el esqueleto de esa función en
   `supabase/functions/create-checkout-session/index.ts`.

No implementes el webhook aún — deja un TODO comentado donde iría.
```

---

## Orden de ejecución recomendado

```
Semana 1-2:  Tarea 1.1 + 1.2  →  Historial de torneos
Semana 3:    Tarea 1.3         →  Estadísticas por bailarín
Semana 4:    Tarea 2.2         →  Compartir resultado como imagen (alta visibilidad)
Semana 5:    Tarea 2.1         →  Vista pública para proyectar
Semana 6-7:  Validar con usuarios reales de Salsanamá
Semana 8:    Tarea 4.1         →  Stripe (solo si hay demanda confirmada)
Semana 9+:   Tarea 3.1         →  Multi-juez (feature avanzada, para eventos grandes)
```

---

## Convenciones que Cursor debe respetar

- **Estilos:** Tailwind CSS únicamente. Fondo `zinc-950`, texto blanco, acentos `red-500`.
  Fuentes condensadas: `font-condensed` (Barlow Condensed o similar) para nombres de competidores.
- **Estado:** todo en `App.jsx` con useState/useCallback. No introducir Redux ni Zustand.
- **Auth:** usar `useAuth()` para obtener `user` y `profile`. El email real es `username@clashpro.local`.
- **Supabase:** usar el cliente de `src/lib/supabase.js`. Siempre verificar errores.
- **Errores:** nunca romper el flujo del usuario. `console.error` silencioso para errores de red.
- **Mobile first:** todos los componentes deben funcionar en pantalla de 375px de ancho.
- **Sin router:** detectar rutas especiales en `window.location.pathname` al inicio de App.jsx.
- **Íconos:** solo de `lucide-react`.
- **Nuevo archivo de hook:** siempre en `src/hooks/`. Nuevo componente: en `src/components/`.
- **Migraciones SQL:** crear archivo nuevo en `supabase/migrations/` con timestamp en el nombre.

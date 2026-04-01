# ClashPro — Contexto completo para Cursor

> Este archivo es la fuente única de verdad sobre el proyecto. Actualízalo cada vez que agregues una feature importante.
> Última actualización: 2026-04-01

---

## 1. Resumen del proyecto

**ClashPro** es una Progressive Web App (PWA) diseñada para gestionar torneos de batallas 1vs1 de improvisación de baile (salsa). El organizador del torneo usa la app en su teléfono durante el evento.

**Flujo principal:**
1. El organizador ingresa los competidores y el tiempo de ronda (30s o 40s).
2. La app genera automáticamente todos los enfrentamientos en formato Round Robin.
3. Por cada batalla, un cronómetro por fases controla el turno de cada bailarín (Ronda 1 → Ronda 2 → Votación).
4. El resultado se registra (Ganador A / Ganador B / Empate) y actualiza el leaderboard en tiempo real.
5. Al terminar todas las batallas, se muestra al campeón y se puede compartir el ranking por WhatsApp.

**Audiencia:** Organizadores de eventos de salsa (inicialmente Salsanamá, Ciudad de México).

**Estado actual (2026-04-01):** Producción. La app está desplegada en Vercel, usa Supabase para auth y persistencia, e integra el Spotify Embed API para reproducir música durante las batallas.

---

## 2. Stack técnico

| Capa | Tecnología |
|---|---|
| UI Framework | React 18.3 |
| Build tool | Vite 5.4 |
| Estilos | Tailwind CSS 3.4 (JIT) |
| Iconos | lucide-react 0.441 |
| Backend / Auth / DB | Supabase (PostgreSQL + Auth + RLS + Realtime) |
| Cliente Supabase | @supabase/supabase-js 2.101 |
| Deploy | Vercel (SPA rewrite via vercel.json) |
| Música | Spotify Embed IFrame API (no SDK de reproducción, solo embed) |
| Auth de Spotify | OAuth 2.0 PKCE — sin backend, flujo puramente cliente |
| Persistencia local | localStorage (`clashpro:v1`) |
| Persistencia remota | Supabase tabla `user_tournament_state` (upsert con debounce 1.5s) |
| Audio beeps | Web Audio API (AudioContext nativo) |
| PWA | manifest.json + meta tags Apple; service worker NO activado aún (código comentado en vite.config.js) |
| Gestión de estado | useState / useCallback / useEffect en App.jsx — sin Redux ni Zustand |
| Routing | Sin router. SCREENS enum (`setup`, `matches`, `battle`, `leaderboard`) + History API para back button |

---

## 3. URLs y credenciales de entorno

> Estas son claves públicas/publicables (anon key de Supabase y Client ID de Spotify). No son secretos de servidor.

Las variables de entorno se definen en `.env.local` (local) y en el dashboard de Vercel (producción):

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...  (anon/public key — segura en cliente)
VITE_SPOTIFY_CLIENT_ID=<tu-client-id-de-spotify>
```

**URLs del proyecto:**
- Producción: `https://clash-pro.vercel.app` (o dominio personalizado)
- Supabase Dashboard: `https://supabase.com/dashboard/project/<project-ref>`
- Spotify Developer Dashboard: `https://developer.spotify.com/dashboard`
- Redirect URI registrado en Spotify: `https://clash-pro.vercel.app` (y `http://localhost:5173` para local)

---

## 4. Arquitectura actual

### Máquina de estados de pantallas

`App.jsx` es el único componente contenedor con estado. No hay router. La pantalla activa se maneja con un enum `SCREENS`:

```
SETUP → MATCHES → BATTLE → MATCHES
                   ↓
              LEADERBOARD
```

La función `goTo(screen)` llama `window.history.pushState(...)` para que el botón físico Atrás (Android, iOS swipe) funcione. El listener `popstate` maneja la navegación hacia atrás.

### Jerarquía de componentes

```
App.jsx
├── SpotifyPlayer        ← montado una sola vez, persiste en todas las pantallas
└── main (overflow-y-auto)
    ├── SetupScreen       (screen === 'setup')
    ├── MatchesScreen     (screen === 'matches')
    ├── BattleScreen      (screen === 'battle', solo si activeMatch existe)
    └── LeaderboardScreen (screen === 'leaderboard')
```

`SpotifyPlayer` está fuera del área de contenido principal para que la música no se interrumpa al cambiar de pantalla. Ocupa la parte superior de la UI (sticky header de facto).

### Flujo de datos

- El estado global (`competitors`, `matches`, `roundTime`, `activeMatchId`, `screen`) vive en `App.jsx`.
- Se persiste en dos capas:
  1. **localStorage** (`clashpro:v1`) — síncrono, para rehidratación instantánea al abrir la app.
  2. **Supabase** (`user_tournament_state`) — debounced 1.5s, para persistencia cross-dispositivo cuando el usuario está autenticado.
- Al autenticarse, `useTournamentPersistence` carga el estado guardado en Supabase y lo aplica si contiene matches activos (prioridad sobre localStorage).

### Auth

- Supabase Auth con email/password. El email se construye internamente como `<username>@clashpro.local` para simplificar el UX (el usuario solo escribe un apodo).
- Google OAuth también disponible pero UI no expuesta actualmente.
- Gate de autenticación: si `!user`, se muestra `AuthScreen` y nada más.
- El hook `useAuth` expone: `user`, `profile`, `loading`, `signInWithEmail`, `signUpWithEmail`, `signInWithGoogle`, `signOut`.

### Spotify

- Integración en dos capas independientes:
  1. **Spotify Embed IFrame API** (`SpotifyPlayer.jsx`): carga el script de Spotify, crea un controlador IFrame, permite reproducir URIs. No requiere auth del usuario — solo requiere que el usuario tenga Spotify abierto en otro dispositivo o la app.
  2. **Spotify Web API con PKCE** (`useSpotifyAuth`, `spotifyAuth.js`, `spotifyApi.js`): flujo OAuth opcional para leer las playlists propias del usuario. El token se guarda en localStorage. El refresh token permite re-autenticar silenciosamente.

---

## 5. Estructura de archivos

```
clash_pro/
├── index.html                        Punto de entrada HTML; meta tags PWA/Apple
├── vite.config.js                    Config Vite; bloque VitePWA comentado
├── postcss.config.js                 Config PostCSS para Tailwind
├── package.json                      Dependencias y scripts npm
├── vercel.json                       Rewrite SPA: todo → index.html
├── public/
│   ├── manifest.json                 Web App Manifest (PWA): iconos, colores, orientación
│   ├── icon.svg                      Favicon SVG
│   ├── icon-192.png                  Icono PWA 192×192
│   ├── icon-512.png                  Icono PWA 512×512
│   └── apple-touch-icon.png          Icono para iOS "Agregar a inicio"
├── src/
│   ├── main.jsx                      Punto de entrada React; ReactDOM.createRoot
│   ├── index.css                     Tailwind @base/@components/@utilities + animación digitPop
│   ├── App.jsx                       Componente raíz; máquina de estados; lógica del torneo
│   ├── components/
│   │   ├── AuthScreen.jsx            Formulario login/registro con email+password
│   │   ├── SetupScreen.jsx           Configurar competidores y tiempo de ronda
│   │   ├── MatchesScreen.jsx         Lista de batallas; cierre rápido; mini leaderboard; vista por rondas
│   │   ├── BattleScreen.jsx          Cronómetro por fases; pausar/reanudar; votación del ganador
│   │   ├── LeaderboardScreen.jsx     Ranking final; compartir por WhatsApp/Web Share API/Clipboard
│   │   └── SpotifyPlayer.jsx         Player Spotify embed + picker de playlists locales/Spotify API
│   ├── hooks/
│   │   ├── useAuth.js                Supabase Auth (sesión, login, signup, Google OAuth)
│   │   ├── useTournamentState.js     Persistencia de torneo en Supabase (carga + upsert debounced)
│   │   ├── useSpotifyAuth.js         OAuth PKCE Spotify; intercambio de code; refresh silencioso
│   │   └── useCountdownBeeps.js      Web Audio API; beeps 3-2-1; control mute con localStorage
│   ├── lib/
│   │   ├── supabase.js               Cliente Supabase singleton (createClient con env vars)
│   │   ├── spotifyAuth.js            PKCE helpers: redirectToLogin, exchangeCode, refreshToken, clearTokens
│   │   └── spotifyApi.js             Llamadas Spotify Web API: getMe, getMyPlaylists, getPlaylistTracks, searchTracks, getLikedTracks
│   └── utils/
│       ├── roundRobin.js             generateRoundRobin(competitors) + calculateScores(competitors, matches)
│       ├── persist.js                loadState/saveState/clearState para localStorage; normalizeHydratedScreen
│       ├── songs.js                  PLAYLISTS hardcodeadas (5 playlists de Salsanamá con URIs de Spotify)
│       └── spotifyUri.js             parseSpotifyTrackUri; CRUD de tracks custom en localStorage
└── supabase/
    └── migrations/
        ├── 20260331000001_initial_schema.sql      Schema principal (ver sección 6)
        └── 20260401000001_user_tournament_state.sql  Tabla de estado de torneo por usuario
```

---

## 6. Base de datos Supabase

Todas las tablas tienen **Row Level Security (RLS) habilitado**.

### `public.profiles`
Extiende `auth.users`. Se crea automáticamente via trigger `on_auth_user_created`.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid PK | Referencia a `auth.users(id)` |
| `name` | text | Nombre del usuario |
| `photo_url` | text | URL foto de perfil |
| `spotify_id` | text | ID de Spotify (no usado actualmente en producción) |
| `spotify_access_token` | text | Token Spotify (no usado; tokens se guardan en localStorage) |
| `spotify_refresh_token` | text | Refresh token Spotify (no usado en DB) |
| `created_at` | timestamptz | Auto |

**Política RLS:** Solo el propietario (`auth.uid() = id`) puede leer/escribir su propio perfil.

---

### `public.competitors`
Registro global de bailarines participantes.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid PK | Auto |
| `name` | text NOT NULL | Nombre del competidor |
| `photo_url` | text | URL foto (aún no implementado en UI) |
| `user_id` | uuid FK → profiles | Opcional, si tiene cuenta |
| `is_active` | boolean | `true` = aparece en setup; default true |
| `created_at` | timestamptz | Auto |

**Políticas RLS:** Lectura pública; escritura solo autenticados.

**Seed inicial:** Daniel Alfaro, Daniel Ambriz, William Daniel, Aly, Sahad, Yi, Fer, Mundo.

> En `App.jsx` se carga la lista de competidores activos de esta tabla cuando el usuario se autentica, para prepoblar `SetupScreen`.

---

### `public.playlists`
Playlists del sistema.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid PK | Auto |
| `name` | text NOT NULL | Nombre visible |
| `spotify_uri` | text NOT NULL | `spotify:playlist:XXX` |
| `spotify_url` | text | URL de open.spotify.com |
| `recommended_by` | uuid FK → profiles | Opcional |
| `is_system` | boolean | Si es playlist oficial; default true |
| `created_at` | timestamptz | Auto |

**Políticas RLS:** Lectura pública; escritura autenticados.

---

### `public.user_favorite_tracks`
Canciones favoritas por usuario (no activamente usada en UI actual).

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid PK | Auto |
| `user_id` | uuid FK → profiles | Propietario |
| `name` | text NOT NULL | Nombre de la canción |
| `artist` | text | Artista |
| `spotify_uri` | text NOT NULL | URI de Spotify |
| `created_at` | timestamptz | Auto |

**Constraint:** `UNIQUE(user_id, spotify_uri)`.
**Política RLS:** Solo el propietario.

---

### `public.tournaments`
Registro histórico de torneos (aún no conectado a la UI de torneo activo).

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid PK | Auto |
| `name` | text NOT NULL | Nombre del torneo |
| `date` | date | Fecha; default `current_date` |
| `round_time_seconds` | integer | Segundos por ronda; default 40 |
| `created_by` | uuid FK → profiles | Organizador |
| `created_at` | timestamptz | Auto |

---

### `public.tournament_competitors`
Relación N:M entre torneos y competidores.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid PK | Auto |
| `tournament_id` | uuid FK → tournaments | |
| `competitor_id` | uuid FK → competitors | |
| `is_active` | boolean | default true |

**Constraint:** `UNIQUE(tournament_id, competitor_id)`.

---

### `public.rounds`
Rondas de un torneo (para la feature de historial, no usada aún en UI).

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid PK | Auto |
| `tournament_id` | uuid FK → tournaments | |
| `round_number` | integer NOT NULL | |
| `created_at` | timestamptz | Auto |

---

### `public.battles`
Batallas individuales (para historial, no usada en UI principal actual).

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid PK | Auto |
| `round_id` | uuid FK → rounds | |
| `competitor_a_id` | uuid FK → competitors | |
| `competitor_b_id` | uuid FK → competitors | |
| `result` | text CHECK `('A','B','draw','bye')` | Resultado |
| `is_bye` | boolean | Descanso |
| `track_uri` | text | URI de Spotify de la canción usada |
| `track_name` | text | Nombre de la canción |
| `completed` | boolean | |
| `created_at` | timestamptz | Auto |

---

### `public.user_tournament_state`
**Esta es la tabla más activa.** Guarda el snapshot completo del torneo en curso del usuario.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid PK | Auto |
| `user_id` | uuid FK → profiles NOT NULL | Un estado por usuario (UNIQUE) |
| `competitors` | jsonb | Array de strings con nombres |
| `matches` | jsonb | Array de objetos match |
| `round_time` | integer | Segundos; default 40 |
| `screen` | text | Pantalla activa: `setup/matches/battle/leaderboard` |
| `active_match_id` | text | ID del match en batalla activa |
| `updated_at` | timestamptz | Auto via trigger `set_updated_at()` |
| `created_at` | timestamptz | Auto |

**Política RLS:** Solo el propietario puede leer/escribir su estado.
**Operación:** Upsert con `onConflict: 'user_id'` — siempre hay máximo 1 fila por usuario.

#### Shape de un match en `matches` (JSONB):
```json
{
  "id": "match-0",
  "round": 1,
  "playerA": "Daniel Alfaro",
  "playerB": "Aly",
  "isBye": false,
  "completed": false,
  "result": null
}
```
`result` puede ser: `"A"` | `"B"` | `"draw"` | `"bye"` | `null`

---

## 7. Features actuales implementadas

- **Auth con email/password** — apodo + contraseña; internamente convierte a email `apodo@clashpro.local`. Incluye modo registro con auto-login.
- **Auth gate** — la app no carga hasta que el usuario esté autenticado.
- **Persistencia dual** — localStorage para rehidratación instantánea + Supabase para sync cross-dispositivo con debounce de 1.5s.
- **Carga de competidores desde Supabase** — al autenticarse, se precarga la lista de `competitors` activos de la DB.
- **Round Robin automático** — genera todos los emparejamientos. Con número impar agrega BYE automático; el BYE se marca como completado automáticamente.
- **Vista de batallas: Lista y Por Ronda** — toggle entre vista plana y agrupada por rondas.
- **Mini leaderboard en MatchesScreen** — muestra top 3 en tiempo real.
- **Cierre rápido de batalla** — botón "Cerrar" en la tarjeta de match expande un panel inline para registrar el resultado sin entrar a la pantalla de batalla.
- **BattleScreen con fases** — ROUND1_READY → ROUND1_RUNNING → ROUND1_DONE → ROUND2_RUNNING → VOTING. Cada fase tiene su label y UI dedicada.
- **Cronómetro visual** — conic-gradient animado que muestra el progreso de tiempo. Se vuelve rojo y pulsa en los últimos 10 segundos.
- **Pausar / Reanudar ronda** — botón en BattleScreen durante las fases de running.
- **Beeps de cuenta regresiva** — 3 beeps en los últimos 3 segundos usando Web Audio API. Controlable con botón mute persistente en localStorage.
- **Votación del ganador** — después de la segunda ronda: Ganador A (3 pts), Ganador B (3 pts), Empate (1 pt c/u).
- **Leaderboard** — ranking calculado en tiempo real con `calculateScores`. Muestra campeón destacado al terminar todas las batallas.
- **Compartir ranking** — Web Share API (nativo), WhatsApp (`wa.me`), y Copiar al portapapeles.
- **Botón Atrás físico (back button)** — History API `pushState` + listener `popstate` para navegación correcta en Android/iOS.
- **Botón Regresar en BattleScreen** — cancela la batalla activa y regresa a Matches.
- **Reset completo** — borra localStorage y la fila en Supabase, regresa a Setup.
- **SpotifyPlayer persistente** — player de Spotify montado una sola vez (fuera del área de contenido), no se interrumpe al cambiar pantalla.
- **Playlists locales hardcodeadas** — 5 playlists de Salsanamá con tracks seleccionados.
- **Tracks custom** — el usuario puede agregar canciones a una playlist local pegando un enlace o URI de Spotify. Se persiste en localStorage.
- **Spotify Web API opcional** — el usuario puede conectar su cuenta de Spotify para ver sus propias playlists y reproducir cualquier canción directamente en el embed.
- **PWA básica** — `manifest.json` con iconos, colores de tema y modo standalone. Sin service worker activo.

---

## 8. Features Pro — Plan de implementación

---

### Feature 1: Modo Juez Multi-dispositivo (Supabase Realtime)

#### Descripción
Permite que múltiples jueces voten la batalla desde sus propios teléfonos. El organizador crea un "canal" de la batalla activa; los jueces se unen escaneando un QR o ingresando un código. Los votos se agregan en tiempo real y el resultado final se calcula por mayoría.

#### Archivos a crear
- `src/components/JudgeScreen.jsx` — pantalla para jueces: muestra los dos competidores y botones de votación
- `src/hooks/useRealtimeBattle.js` — suscripción a Supabase Realtime en el canal de la batalla
- `src/components/QRModal.jsx` — modal con QR generado al iniciar una batalla

#### Archivos a modificar
- `src/App.jsx` — agregar screen `JUDGE` y flujo de unirse a batalla
- `src/components/BattleScreen.jsx` — agregar botón "Convocar jueces" y panel de votos en tiempo real
- `src/components/MatchesScreen.jsx` — mostrar indicador de jueces activos por batalla

#### Schema de DB adicional
```sql
-- Canal de batalla en tiempo real
create table public.battle_sessions (
  id            uuid primary key default gen_random_uuid(),
  match_id      text not null,           -- ID del match del torneo activo
  host_user_id  uuid references public.profiles(id),
  player_a      text not null,
  player_b      text not null,
  status        text default 'waiting',  -- 'waiting' | 'voting' | 'closed'
  created_at    timestamptz default now(),
  expires_at    timestamptz default now() + interval '2 hours'
);

-- Votos individuales de los jueces
create table public.judge_votes (
  id               uuid primary key default gen_random_uuid(),
  session_id       uuid references public.battle_sessions(id) on delete cascade,
  judge_user_id    uuid references public.profiles(id),
  vote             text check (vote in ('A', 'B', 'draw')),
  created_at       timestamptz default now(),
  unique(session_id, judge_user_id)
);

alter table public.battle_sessions enable row level security;
alter table public.judge_votes enable row level security;
-- Políticas: lectura pública dentro de sesión activa; votos solo del propio juez
```

#### Dependencias npm
```
npm install qrcode.react
```

#### Prompt exacto para Cursor

```
Implementa el "Modo Juez Multi-dispositivo" en ClashPro usando Supabase Realtime.

Contexto:
- La app es una SPA en React 18 + Vite + Tailwind. No hay router; la pantalla activa se maneja con el enum SCREENS en App.jsx.
- El cliente Supabase está en src/lib/supabase.js (singleton).
- El schema de DB ya incluye las tablas battle_sessions y judge_votes (ver CURSOR_CONTEXT.md §8 Feature 1).

Tareas:
1. Crea src/hooks/useRealtimeBattle.js que:
   - Reciba sessionId
   - Se suscriba al canal de Supabase Realtime `battle:${sessionId}` (broadcast)
   - Exponga los votos actuales como array y una función `sendVote(vote)`
   - Se desuscriba al desmontar

2. Crea src/components/JudgeScreen.jsx que:
   - Reciba props: sessionId, playerA, playerB, onVoted
   - Use useRealtimeBattle para enviar votos
   - Muestre los dos competidores como botones grandes y un botón de Empate
   - Una vez votado, muestre "Voto registrado" y bloquee el re-votación

3. Crea src/components/QRModal.jsx que:
   - Reciba props: sessionId, onClose
   - Genere la URL `${window.location.origin}?judge=${sessionId}`
   - Renderice el QR con qrcode.react y también muestre el sessionId como código de 6 caracteres

4. Modifica src/components/BattleScreen.jsx para:
   - Agregar botón "Convocar jueces" que crea una battle_session en Supabase y abre QRModal
   - En fase VOTING, mostrar los votos de jueces en tiempo real antes de registrar el resultado oficial

5. Maneja la URL `?judge=SESSION_ID` en App.jsx para mostrar JudgeScreen directamente sin auth gate (o con auth simplificado).

Sigue las convenciones del proyecto: Tailwind zinc/red para dark mode, sin console.log en producción, useCallback para handlers de eventos.
```

---

### Feature 2: Historial de torneos y estadísticas

#### Descripción
Al finalizar un torneo (todos los matches completados), guarda el resultado completo en las tablas `tournaments`, `rounds`, y `battles` de Supabase. Agrega una pantalla de historial donde el organizador puede ver torneos anteriores y las estadísticas acumuladas de cada competidor (victorias, derrotas, empates, puntos totales).

#### Archivos a crear
- `src/components/HistoryScreen.jsx` — listado de torneos pasados con fecha y campeón
- `src/components/TournamentDetailScreen.jsx` — detalle de un torneo: matches y leaderboard final
- `src/hooks/useTournamentHistory.js` — queries a Supabase para historial y stats

#### Archivos a modificar
- `src/App.jsx` — agregar screens HISTORY y TOURNAMENT_DETAIL al enum SCREENS
- `src/components/LeaderboardScreen.jsx` — agregar botón "Guardar torneo" que persiste en DB
- `src/components/MatchesScreen.jsx` — agregar enlace al historial

#### Schema de DB
Las tablas `tournaments`, `rounds`, `battles` y `tournament_competitors` ya existen en el schema. Solo hay que conectarlas a la UI.

#### Prompt exacto para Cursor

```
Implementa el "Historial de torneos" en ClashPro.

Contexto:
- Ver CURSOR_CONTEXT.md para el schema completo. Las tablas tournaments, rounds, battles y tournament_competitors ya existen en Supabase.
- El estado del torneo activo vive en App.jsx: competitors (array de strings), matches (array de objetos con shape: {id, round, playerA, playerB, isBye, completed, result}).
- El usuario autenticado está disponible via useAuth() → { user }.

Tareas:
1. Crea src/hooks/useTournamentHistory.js con:
   - saveTournament(name, competitors, matches, roundTime): inserta en tournaments + rounds + battles + tournament_competitors. Primero busca o crea cada competitor por nombre en la tabla competitors.
   - listTournaments(): retorna torneos del usuario ordenados por fecha desc
   - getTournamentDetail(tournamentId): retorna el torneo con sus rondas y batallas
   - getCompetitorStats(competitorId): retorna stats acumuladas (victorias, derrotas, empates, pts totales)

2. Agrega en src/components/LeaderboardScreen.jsx:
   - Botón "Guardar torneo" visible solo cuando isFinished === true
   - Modal de confirmación con input para el nombre del torneo (default: "Torneo YYYY-MM-DD")
   - Llama a saveTournament al confirmar; muestra spinner y mensaje de éxito

3. Crea src/components/HistoryScreen.jsx:
   - Lista de torneos del usuario con: nombre, fecha, campeón, cantidad de participantes
   - Al tocar un torneo, navega a TournamentDetailScreen
   - Estado vacío con mensaje amigable si no hay torneos

4. Crea src/components/TournamentDetailScreen.jsx:
   - Muestra el leaderboard del torneo seleccionado
   - Lista de batallas agrupadas por ronda

5. Conecta las pantallas en App.jsx agregando HISTORY y TOURNAMENT_DETAIL al enum SCREENS con sus goTo() y back handlers.

Convenciones: Tailwind dark mode (zinc-950 bg, zinc-800 cards), useCallback para handlers, manejo de loading/error states.
```

---

### Feature 3: Perfiles de competidores con foto

#### Descripción
Cada competidor puede tener una foto de perfil que se muestra en BattleScreen, LeaderboardScreen y en el listado de competidores. El organizador puede subir fotos desde SetupScreen. Las fotos se almacenan en Supabase Storage.

#### Archivos a crear
- `src/components/Avatar.jsx` — componente reutilizable Avatar con foto o iniciales como fallback
- `src/hooks/useCompetitors.js` — CRUD de competidores con foto en Supabase

#### Archivos a modificar
- `src/components/SetupScreen.jsx` — mostrar Avatar junto a cada competidor; agregar botón para subir foto
- `src/components/BattleScreen.jsx` — mostrar Avatar de playerA y playerB
- `src/components/LeaderboardScreen.jsx` — mostrar Avatar junto a cada posición del ranking
- `src/components/MatchesScreen.jsx` — mostrar Avatar en las tarjetas de match

#### Schema de DB / Storage
La columna `photo_url` ya existe en `public.competitors`. Solo hay que crear el bucket en Supabase Storage:

```sql
-- En Supabase Dashboard > Storage > New Bucket
-- Nombre: competitor-photos
-- Public: true (las fotos son públicas)

-- Política para subir: solo autenticados
create policy "competitor photos upload"
on storage.objects for insert
with check (bucket_id = 'competitor-photos' and auth.uid() is not null);
```

#### Dependencias npm
Ninguna nueva — se usa el cliente de Supabase existente para `supabase.storage.from('competitor-photos').upload(...)`.

#### Prompt exacto para Cursor

```
Implementa "Perfiles de competidores con foto" en ClashPro.

Contexto:
- La tabla public.competitors tiene columna photo_url (text).
- Supabase Storage tiene un bucket público llamado 'competitor-photos'.
- Los competidores actualmente son strings simples en el estado. La tabla competitors tiene: id, name, photo_url, is_active.
- El cliente Supabase está en src/lib/supabase.js.

Tareas:
1. Crea src/components/Avatar.jsx:
   - Props: name (string), photoUrl (string | null), size ('sm'|'md'|'lg'), className
   - Si hay photoUrl, renderiza <img> con object-cover
   - Fallback: círculo con las iniciales del nombre (hasta 2 caracteres) en bg-zinc-700
   - Tamaños: sm=28px, md=40px, lg=64px

2. Crea src/hooks/useCompetitors.js:
   - fetchCompetitors(): carga todos los competidores activos de Supabase
   - uploadPhoto(competitorId, file): sube el archivo a 'competitor-photos/{competitorId}.jpg', actualiza competitors.photo_url, retorna la URL pública
   - Retorna: { competitors, loading, fetchCompetitors, uploadPhoto }

3. Modifica src/components/SetupScreen.jsx:
   - Si hay datos de la tabla competitors (objetos con id, name, photo_url), mostrar Avatar junto a cada nombre
   - Añadir un <input type="file" accept="image/*"> oculto por competidor, activado al tocar el Avatar
   - Mostrar spinner mientras sube la foto

4. Modifica src/components/BattleScreen.jsx:
   - Mostrar Avatar (size="lg") de playerA y playerB en el header de la batalla
   - El estado de App.jsx tiene competitors como array de strings; busca la foto en la tabla competitors por nombre.

5. Modifica src/components/LeaderboardScreen.jsx:
   - ScoreRow: agregar Avatar (size="sm") antes del nombre del competidor

Nota: El estado interno de App.jsx (competitors como array de strings) NO debe cambiar para no romper roundRobin ni persist. Las fotos se cargan on-demand en los componentes que las necesitan.
```

---

### Feature 4: PWA mejorada — offline + instalable

#### Descripción
Activa el service worker con Workbox via `vite-plugin-pwa` para que la app funcione completamente offline (una vez cargada). La app ya tiene `manifest.json` completo. Esta feature lo completa con precaching de assets y un prompt de instalación.

#### Archivos a crear
- `src/components/InstallBanner.jsx` — banner de instalación que aparece en iOS (que no tiene prompt nativo) y en Android si no está ya instalada

#### Archivos a modificar
- `vite.config.js` — descomentar y completar el bloque `VitePWA`
- `src/App.jsx` — integrar InstallBanner

#### Schema de DB
Ninguno.

#### Dependencias npm
```
npm install -D vite-plugin-pwa
```

#### Prompt exacto para Cursor

```
Activa la PWA completa (offline + instalable) en ClashPro.

Contexto:
- vite.config.js ya tiene el bloque VitePWA comentado. Solo usa @vitejs/plugin-react actualmente.
- public/manifest.json ya está configurado con iconos, colores y display: standalone.
- La app usa Vite 5 + React 18.
- vite-plugin-pwa ya está instalado como devDependency.

Tareas:
1. Modifica vite.config.js para descomentar y completar VitePWA:
   - registerType: 'autoUpdate'
   - manifest: false (ya existe public/manifest.json)
   - workbox.globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
   - workbox.runtimeCaching para las llamadas a Supabase (strategy: NetworkFirst, cacheName: 'supabase-api')
   - workbox.runtimeCaching para open.spotify.com (strategy: NetworkFirst)
   - devOptions.enabled: true para probar en desarrollo

2. Crea src/components/InstallBanner.jsx:
   - Detecta si la app ya está instalada (window.matchMedia('(display-mode: standalone)'))
   - En Android/Chrome: escucha el evento 'beforeinstallprompt', guarda el evento, muestra banner con botón "Instalar app"
   - En iOS/Safari: muestra instrucciones textuales ("Toca el botón compartir → Agregar a inicio")
   - El banner se puede cerrar y la preferencia se guarda en localStorage ('clashpro:installDismissed')
   - Diseño: barra fija en la parte inferior, bg-zinc-900 border-t border-zinc-700, texto pequeño

3. Agrega InstallBanner en src/App.jsx dentro del return principal (justo antes del cierre del div raíz).

4. Asegura que el build generará los archivos sw.js y workbox-*.js en el directorio dist.

Sigue las convenciones: Tailwind dark mode, sin dependencias adicionales más allá de vite-plugin-pwa.
```

---

### Feature 5: Compartir resultado (imagen para redes sociales)

#### Descripción
Genera una imagen estilizada del leaderboard final para compartir en Instagram Stories, WhatsApp o TikTok. La imagen se renderiza en un `<canvas>` oculto con el branding de ClashPro y los colores del tema (zinc oscuro, rojo, ámbar).

#### Archivos a crear
- `src/utils/generateShareImage.js` — renderiza el canvas con el leaderboard y retorna un Blob/DataURL
- `src/components/ShareImagePreview.jsx` — modal que muestra la preview de la imagen antes de descargar/compartir

#### Archivos a modificar
- `src/components/LeaderboardScreen.jsx` — reemplazar/complementar el botón Share2 con la opción de generar imagen

#### Schema de DB
Ninguno.

#### Dependencias npm
Ninguna nueva — se usa Canvas API nativo del browser.

#### Prompt exacto para Cursor

```
Implementa "Compartir resultado como imagen" en ClashPro usando Canvas API.

Contexto:
- src/components/LeaderboardScreen.jsx ya tiene botones de compartir (texto) con Share2, MessageCircle y Copy.
- El leaderboard es un array: [{ name: string, points: number }] ordenado por puntos desc.
- El tema visual de la app: background #09090b (zinc-950), cards #27272a (zinc-800), rojo #ef4444, ámbar #f59e0b, blanco #ffffff, zinc-400 #a1a1aa.
- La fuente del título de la app es "font-black" (Inter o system-ui).

Tareas:
1. Crea src/utils/generateShareImage.js que exporte:
   ```js
   export async function generateShareImage({ leaderboard, tournamentName, date })
   // Retorna Promise<Blob>
   ```
   El canvas debe tener 1080×1920px (formato Stories) y renderizar:
   - Fondo: gradiente vertical de #09090b a #18181b
   - Logo "CLASHPRO" en grande arriba (texto rojo)
   - Nombre del torneo y fecha
   - Top 3 con: posición, nombre, puntos — con tamaños decrecientes y colores ámbar/plata/bronce
   - El resto del leaderboard en una lista compacta
   - Footer "clash-pro.vercel.app" en zinc-500
   Usa solo fillText, fillRect, strokeRect (sin librerías externas).

2. Crea src/components/ShareImagePreview.jsx:
   - Modal fullscreen con overlay negro semitransparente
   - Llama a generateShareImage al montar, muestra spinner mientras genera
   - Muestra la imagen en un <img> escalada al viewport
   - Botones: "Descargar" (crea <a download> y dispara click), "Compartir" (Web Share API con files si disponible), "Cerrar"

3. Modifica src/components/LeaderboardScreen.jsx:
   - Agrega botón con ícono de cámara/imagen junto a los botones de share existentes
   - Al hacer click, muestra <ShareImagePreview> con el leaderboard actual

Nota importante: el canvas debe crearse off-screen (document.createElement('canvas'), no añadirlo al DOM). La función debe ser asíncrona para poder usar document.fonts.ready antes de dibujar el texto.
```

---

## 9. Convenciones de código

### Nombres
- Componentes: PascalCase (`BattleScreen`, `MatchCard`)
- Hooks: camelCase con prefijo `use` (`useAuth`, `useTournamentPersistence`)
- Utils: camelCase (`generateRoundRobin`, `calculateScores`)
- Constantes globales: UPPER_SNAKE_CASE (`SCREENS`, `PHASE`, `PLAYLISTS`)
- Variables de entorno: prefijo `VITE_` (`VITE_SUPABASE_URL`)

### Estructura de componentes
- Un componente por archivo
- Sub-componentes pequeños definidos en el mismo archivo (ej: `MatchCard` dentro de `MatchesScreen.jsx`, `TimerDisplay` dentro de `BattleScreen.jsx`)
- Props tipadas implícitamente (sin TypeScript, sin PropTypes — el proyecto no usa ninguno de los dos)
- Handlers siempre con `useCallback` cuando se pasan como props o se usan en efectos

### Tailwind
- Paleta principal: `zinc-950` (bg app), `zinc-900` (bg cards secundarias), `zinc-800` (bg cards), `zinc-700` (hover states), `zinc-400/500` (texto secundario)
- Color de acento primario: `red-500` / `red-600` (hover)
- Color de acento secundario: `amber-400`/`amber-500` (ranking, winner)
- Color de éxito/Spotify: `green-400`/`green-500`
- Bordes: `border-zinc-700` por defecto, `border-red-500` para estados activos/focus
- Botones principales: `bg-red-500 hover:bg-red-600 active:scale-95 transition-all`
- Botones secundarios: `bg-zinc-800 hover:bg-zinc-700 transition-colors`
- Rounded: `rounded-lg` para elementos pequeños, `rounded-xl` para cards, `rounded-2xl` para botones CTA grandes
- Texto: `font-black` para títulos y CTAs, `font-bold` para subtítulos, `font-semibold` para labels
- Labels de sección: `text-zinc-500 text-xs font-semibold uppercase tracking-widest`
- Padding estándar de pantallas: `p-4 max-w-lg mx-auto`

### Patrones de estado
- Estado global en `App.jsx`, pasado como props a hijos
- No se usa Context API ni Redux
- Efectos de persistencia en `useEffect` con el estado completo como dependencia
- Operaciones asíncronas de Supabase: `.then().catch()` o `async/await` con try/catch
- Formularios: estado local con `useState`, sin librerías de form

### Animaciones CSS
Definidas en `src/index.css`:
- `animate-digitPop`: scale bounce al cambiar el dígito del cronómetro
- Tailwind built-in: `animate-spin`, `animate-bounce`, `animate-pulse`

### Archivos de configuración relevantes
- `postcss.config.js`: solo `tailwindcss` y `autoprefixer`
- `vercel.json`: rewrite de todas las rutas a `index.html` para SPA
- `public/manifest.json`: `display: standalone`, orientación portrait, colores zinc-950

---

## 10. Comandos útiles

### Desarrollo local
```bash
# Instalar dependencias
npm install

# Servidor de desarrollo (http://localhost:5173)
npm run dev

# Build de producción
npm run build

# Preview del build
npm run preview
```

### Variables de entorno locales
Crea `.env.local` en la raíz del proyecto (nunca lo commits):
```
VITE_SUPABASE_URL=https://XXXXXX.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
VITE_SPOTIFY_CLIENT_ID=tu_client_id
```

### Deploy a Vercel
```bash
# Deploy a producción directamente
npm run deploy
# Equivalente a:
vercel --prod

# Deploy preview (crea URL temporal)
vercel
```

### Supabase — Migraciones
```bash
# Instalar Supabase CLI si no lo tienes
brew install supabase/tap/supabase

# Login
supabase login

# Linkear al proyecto remoto (solo primera vez)
supabase link --project-ref <project-ref>

# Aplicar migraciones al proyecto remoto
supabase db push

# Generar nueva migración
supabase migration new nombre_de_la_migracion
# Luego editar el archivo en supabase/migrations/

# Ver el estado de las migraciones
supabase migration list

# Abrir Supabase Studio local
supabase start
supabase studio
```

### Git workflow
```bash
# Rama de feature
git checkout -b feature/nombre-de-la-feature

# Commit
git add src/...
git commit -m "feat: descripción de la feature"

# Push y PR
git push origin feature/nombre-de-la-feature
gh pr create --title "feat: descripción" --body "..."

# Merge a main y deploy automático en Vercel
```

### Spotify — Configurar redirect URI
En el [Spotify Developer Dashboard](https://developer.spotify.com/dashboard):
1. Selecciona tu app
2. Edit Settings
3. En "Redirect URIs" agrega:
   - `http://localhost:5173`
   - `https://clash-pro.vercel.app` (o tu dominio)
4. Save

### Supabase — Habilitar Google OAuth (opcional)
1. Dashboard → Authentication → Providers → Google
2. Ingresa Client ID y Client Secret de Google Cloud Console
3. En Google Cloud Console, agrega `https://<project-ref>.supabase.co/auth/v1/callback` como redirect URI autorizado

### Debugging de Realtime (para Feature 1)
```sql
-- Ver las suscripciones activas en Supabase
select * from pg_stat_activity where application_name ilike '%realtime%';

-- En el Dashboard: Database → Replication → habilitar las tablas que necesiten Realtime
```

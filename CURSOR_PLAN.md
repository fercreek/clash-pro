# ClashPro — Plan de trabajo para Cursor Agent (Two-Mode Framework)

> Actualizado: 2026-04-01
> Arquitectura: PRACTICE MODE (ahora) → TOURNAMENT MODE (futuro) → INTEGRACIÓN

---

## 🎯 Lee esto PRIMERO

**Este proyecto soporta dos modos:**
- **PRACTICE MODE** (actual): timer + música + rotación automática, SIN votación ni puntos
- **TOURNAMENT MODE** (futuro): + votación, puntos, leaderboard, historial, compartir

**Lee `MODE_FRAMEWORK.md` para entender la arquitectura global** de qué características van donde.

---

## Cómo usar este archivo en Cursor

1. **Lee el contexto**: abre `MODE_FRAMEWORK.md` (arquitectura) + `CURSOR_CONTEXT.md` (detalles técnicos)
2. **Activa Cursor Agent**: `Cmd+I` (Mac) o `Ctrl+I` (Windows) → modo **Agent**
3. **Modelo recomendado**:
   - **Haiku 4.5**: Tareas simples (3x más rápido, 4x más barato)
   - **Sonnet 4.6**: Tareas complejas (storage, offline, canvas)
4. **Para cada tarea**: copia el prompt exacto del bloque y pégalo en Agent
5. **Revisa cambios**: siempre comprueba el diff antes de aceptar
6. **Corre**: `npm run dev` → `http://localhost:5173`
7. **Deploy**: `git add -A && git commit && git push` → auto-deploy en Vercel

---

## Variables de entorno

En `.env.local` (ya existe):
```
VITE_SUPABASE_URL=https://gxweakeahiofjxocoavo.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_Pwv0amoK6rJsqEVCdwUiGg_TK-nkujY
VITE_SPOTIFY_CLIENT_ID=37538ceac01a4600bc34087271fe8c7c
```

---

## Estado actual del proyecto

**PRACTICE MODE — Ya implementado:**
- ✅ Auth (username/password + Google OAuth vía Supabase)
- ✅ Setup screen (seleccionar competidores, round time)
- ✅ Round Robin automático (bracket sin votación)
- ✅ Timer con círculo visual (60s → 40s predeterminado)
- ✅ Pausa/resume (tap al círculo)
- ✅ Campana de ring (Web Audio, 1100Hz)
- ✅ Control manual (+10s, reiniciar, terminar ronda, saltar)
- ✅ Cola de canciones (SpotifyPlayer con queue)
- ✅ Mini barra de canción en BattleScreen
- ✅ Cierre rápido de batalla desde lista
- ✅ Persistencia (localStorage + Supabase)
- ✅ Hamburger menu (logout, promo code)
- ✅ Landing page (features + 2 planes: Free/Pro)
- ✅ Feature flags (`usePlan.js`: Free=10 competidores, Pro=ilimitado)
- ✅ Códigos promo (`SALSANAMA26` = Pro)

**TOURNAMENT MODE — No implementado (futuro):**
- ❌ Votación al terminar batalla
- ❌ Puntos/scoring
- ❌ Leaderboard con ranking
- ❌ Historial de torneos
- ❌ Estadísticas (W-L-D, streaks)
- ❌ Compartir resultado (imagen, WhatsApp)

---

# FASE 1 — Consolidar PRACTICE MODE (Inmediato)

**Meta**: Asegurar que el flujo sin votación funciona perfecto, offline, con perfiles de competidores

**Cuándo**: Hoy-mañana
**Orden**: Tarea 1 → Tarea 2 → Tarea 3A (6 quick wins seleccionados)
**Modelo recomendado**: Sonnet para 1 y 2, Haiku para 3A

---

## TAREA 1 — Perfiles de competidores con foto

**Qué construir:**
- Foto de perfil por competidor (cámara o galería)
- Campos: nombre, nivel (Principiante / Intermedio / Avanzado), foto
- La foto aparece: lista de setup, pantalla de batalla, leaderboard
- Supabase Storage para guardar las fotos
- El organizador gestiona los perfiles (no cuentas independientes por ahora)

### 1A — Migración SQL

**Ejecutar en Supabase SQL Editor:**
```sql
-- Supabase Storage bucket para fotos
insert into storage.buckets (id, name, public)
values ('competitor-photos', 'competitor-photos', true)
on conflict (id) do nothing;

-- Policy: lectura pública
create policy "competitor-photos: lectura pública"
  on storage.objects for select
  using (bucket_id = 'competitor-photos');

-- Policy: subida solo autenticados
create policy "competitor-photos: subida autenticada"
  on storage.objects for insert
  with check (bucket_id = 'competitor-photos' and auth.uid() is not null);

-- Policy: borrado solo autenticados
create policy "competitor-photos: borrado autenticado"
  on storage.objects for delete
  using (bucket_id = 'competitor-photos' and auth.uid() is not null);

-- Agregar columna level a competitors
alter table public.competitors
  add column if not exists level text default 'intermedio'
  check (level in ('principiante', 'intermedio', 'avanzado'));
```

### 1B — Prompt para Cursor

```
Tengo una app React + Supabase llamada ClashPro. Lee CURSOR_CONTEXT.md para entender el proyecto.

Quiero implementar perfiles de competidores con foto. Aquí el plan completo:

## Archivos a crear

### `src/components/CompetitorCard.jsx`
Componente reutilizable que muestra un competidor con foto o avatar de iniciales:
- Props: `{ name, photoUrl, level, size }` donde size = 'sm' | 'md' | 'lg'
- Si tiene photoUrl: muestra imagen circular
- Si no: círculo con iniciales (2 letras) en fondo zinc-700
- Badge de nivel: punto de color (verde=principiante, amarillo=intermedio, rojo=avanzado)
- Estilo: fondo zinc-800, borde zinc-700

### `src/components/CompetitorProfileModal.jsx`
Modal para crear/editar perfil de un competidor:
- Props: `{ competitor, onSave, onClose }` (competitor puede ser null para crear nuevo)
- Campos: nombre (input text), nivel (select: Principiante/Intermedio/Avanzado)
- Foto: botón "📷 Tomar foto" (input type=file accept="image/*" capture="environment")
  y "🖼 Subir imagen" (input type=file accept="image/*" sin capture)
- Preview de la foto seleccionada antes de guardar
- Al guardar:
  1. Si hay foto nueva: subirla a Supabase Storage bucket 'competitor-photos'
     con path `{user.id}/{competitorId}.jpg`
  2. Hacer upsert en `public.competitors` (name, level, photo_url, user_id=auth.uid(), is_active=true)
  3. Llamar onSave con el competidor actualizado
- Estilo: modal con overlay oscuro, fondo zinc-900, botón guardar rojo

### `src/hooks/useCompetitors.js`
Hook para gestionar la lista de competidores:
- `useCompetitors(user)` — carga desde Supabase al inicio
- Returns: `{ competitors, loading, addCompetitor, updateCompetitor, toggleActive }`
- competitors: array de `{ id, name, photo_url, level, is_active }`
- `addCompetitor(data)`: insert en Supabase + update local
- `updateCompetitor(id, data)`: update en Supabase + update local
- `toggleActive(id)`: toggle is_active en Supabase

## Archivos a modificar

### `src/components/SetupScreen.jsx`
- En la lista de competidores, reemplazar el chip de nombre plano por `<CompetitorCard size="sm" />`
- Botón "+" al lado de cada competidor para editar su perfil (abre CompetitorProfileModal)
- Botón "Nuevo competidor" que abre CompetitorProfileModal con competitor=null
- Cuando el plan es 'free' y hay 10+ competidores activos: mostrar banner amarillo
  "Límite del plan gratuito (10). Activa Pro para agregar más." con link a upgrade

### `src/components/BattleScreen.jsx`
- En el título de la batalla, mostrar foto/avatar de cada competidor junto a su nombre
- Usar CompetitorCard size="sm" para playerA y playerB
- Necesitas recibir un prop `competitorsMap` = { [name]: { photo_url, level } }
- En App.jsx pasar este mapa a BattleScreen

### `src/components/LeaderboardScreen.jsx`
- En cada fila del ranking, mostrar CompetitorCard size="sm" con foto
- Necesitas recibir `competitorsMap` prop similar al de BattleScreen

### `src/App.jsx`
- Reemplazar el `useEffect` que carga competitors (simple array de nombres) por el nuevo `useCompetitors(user)`
- Construir `competitorsMap` para pasar a BattleScreen y LeaderboardScreen
- Pasar `competitorsMap` a BattleScreen y LeaderboardScreen

Usa el cliente Supabase de `src/lib/supabase.js`.
Usa `useAuth` para obtener user.
Tailwind únicamente para estilos. Fondo zinc-950, acentos red-500.
Iconos de lucide-react.
Mobile first, todo debe funcionar en 375px.
```

---

## TAREA 2 — Modo offline (PWA completa)

**Qué construye:**
- Service worker que precachea toda la app (JS, CSS, HTML, iconos)
- La app carga y funciona sin internet (torneo activo, leaderboard, UI completa)
- Los cambios hechos offline se guardan en localStorage y sincronizan cuando regresa la conexión
- Banner "Sin conexión" cuando no hay red

### 2A — Instalar dependencia

```bash
npm install -D vite-plugin-pwa
```

### 2B — Prompt para Cursor

```
Tengo una PWA en React + Vite llamada ClashPro. Lee CURSOR_CONTEXT.md.

Quiero activar el modo offline completo. Ya tengo vite-plugin-pwa instalado.

## Archivos a modificar

### `vite.config.js`
Reemplazar el bloque comentado de VitePWA con la configuración real:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false, // usamos public/manifest.json
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/gxweakeahiofjxocoavo\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
              networkTimeoutSeconds: 5,
            },
          },
          {
            urlPattern: /^https:\/\/open\.spotify\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'spotify-cache' },
          },
        ],
      },
    }),
  ],
})
```

### `src/hooks/useOnlineStatus.js` (NUEVO)
```js
// Hook que detecta si hay conexión a internet
import { useState, useEffect } from 'react'
export function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on  = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  return online
}
```

### `src/App.jsx`
- Importar `useOnlineStatus`
- Cuando `!online`: mostrar un banner rojo/amarillo fijo en la parte superior:
  `"⚡ Sin conexión — los cambios se guardarán cuando regrese la red"`
- El banner aparece SOLO cuando no hay internet (no permanente)
- Los datos ya están en localStorage así que la app sigue funcionando

Asegúrate de que el `useTournamentPersistence` hook no rompa cuando no hay red:
en su función `save()`, envolver el upsert de Supabase en try/catch silencioso si ya existe.
```

---

## TAREA 3A — Quick wins (PRACTICE MODE)

**Son 3 mejoras pequeñas para consolidar Practice mode. Ejecuta en una sesión.**

### Prompt para Cursor

```
Tengo ClashPro, una app React + Supabase en PRACTICE MODE. Lee CURSOR_CONTEXT.md.

Implementa las siguientes 3 mejoras en una sola sesión. Son independientes entre sí.

---

### QW-3: Número de batalla en BattleScreen

En `src/components/BattleScreen.jsx`:
- Recibir prop `matchNumber` y `totalMatches` (ej. "Batalla 3 de 10")
- Mostrar encima del VS: pequeño texto `"Batalla 3/10"` en zinc-500 text-xs

En `src/App.jsx`:
- Calcular `matchNumber`: índice del activeMatch dentro del array matches + 1
- Pasar `matchNumber={matchIndex + 1}` y `totalMatches={matches.length}` a BattleScreen

### QW-5: Botón "Nueva sesión" al terminar torneo

En `src/components/LeaderboardScreen.jsx`:
- Agregar botón secundario "↺ Nueva sesión (mismos competidores)" junto al botón de reset
- Este botón llama a un nuevo prop `onNewSession`
- No borra los competidores, solo resetea los matches

En `src/App.jsx`:
- Implementar `handleNewSession`: clearState parcial (solo matches y activeMatchId),
  luego genera nuevo Round Robin con los mismos `competitors` y va a SCREENS.MATCHES

---

**Notas para TAREA 3A:**
- Tailwind únicamente para estilos
- Iconos de lucide-react
- Mobile first (375px mínimo)
- NO agregar dependencias nuevas
- Saltar QW-1, QW-2, QW-4, QW-6 (son Tournament mode)
```

---

# FASE 2 — Agregar TOURNAMENT MODE (Futuro)

**Meta**: Habilitar votación, puntos, historial, compartir resultados

**Cuándo**: Después de validar PHASE 1 con usuarios reales
**Orden**: Tarea 3B → Tarea 4 → Tarea 5
**Modelo recomendado**: Haiku para 3B, Sonnet para 4 y 5

---

## TAREA 3B — Quick wins (TOURNAMENT MODE)

**Son 3 mejoras para Tournament mode. Ejecuta en una sesión.**

### Prompt para Cursor

```
Tengo ClashPro, una app React + Supabase en TOURNAMENT MODE. Lee CURSOR_CONTEXT.md y MODE_FRAMEWORK.md.

Implementa las siguientes 3 mejoras para Tournament mode. Son independientes entre sí.

---

### QW-1: Confetti al terminar torneo

En `src/components/LeaderboardScreen.jsx`:
- Instala `npm install canvas-confetti`
- Importa: `import confetti from 'canvas-confetti'`
- Al montar el componente (useEffect una sola vez), lanza confetti:
  ```js
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 },
    colors: ['#ef4444', '#f97316', '#ffffff', '#fbbf24'] })
  ```
- Solo si hay al menos 3 competidores con resultados

---

### QW-2: Estadísticas en el leaderboard (Tournament)

En `src/utils/roundRobin.js`, agrega la función `computeExtendedStats(competitors, matches)` que retorna:
`{ name, wins, losses, draws, played, winRate, currentStreak }`

En `src/components/LeaderboardScreen.jsx`:
- Debajo del nombre en cada fila, mostrar: `"5V · 1D · 2E · 🔥3"`
- Racha positiva en verde, negativa en zinc-500
- Solo aparece este componente en Tournament mode

---

### QW-6: Compartir resultado por WhatsApp

En `src/components/LeaderboardScreen.jsx`:
- Construir texto de ranking:
  ```
  🏆 ClashPro — Resultado de hoy
  1. Daniel Alfaro — 12 pts (4V 0D)
  ...
  clash-pro.vercel.app
  ```
- Botón "📲 Compartir por WhatsApp" → `https://wa.me/?text=...`

---

**Notas para TAREA 3B:**
- Tailwind únicamente para estilos
- Iconos de lucide-react
- NO agregar dependencias salvo canvas-confetti
```

---

## TAREA 4 — Historial de torneos (TOURNAMENT MODE)

**Qué construye:** guardar cada torneo al hacer reset, pantalla de historial con torneos anteriores.

### Prompt para Cursor

```
En ClashPro (React + Supabase), implementa el historial de torneos. Lee CURSOR_CONTEXT.md.

El schema de `public.tournaments` y `public.battles` ya existe en la base de datos.
Confirma las columnas antes de escribir código haciendo referencia a CURSOR_CONTEXT.md sección 6.

## Archivos a crear

### `src/hooks/useTournamentHistory.js`
```js
// Guarda un torneo completo al finalizar
export async function saveTournamentToHistory({ supabase, user, competitors, matches, roundTime }) {
  if (!user || !matches.some(m => m.completed)) return

  const { data: tournament } = await supabase
    .from('tournaments')
    .insert({
      name: new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }),
      date: new Date().toISOString().split('T')[0],
      round_time_seconds: roundTime,
      created_by: user.id,
    })
    .select()
    .single()

  if (!tournament) return

  // Insertar battles
  const battleRows = matches.filter(m => m.completed).map(m => ({
    tournament_id: tournament.id,
    // competitor_a_id y competitor_b_id: buscar en tabla competitors por nombre
    // Si no existe el id (competidor sin cuenta), guardar null y usar los nombres directamente
    result: m.result,
    completed: true,
  }))
  // Nota: la tabla battles tiene campos para nombres directos si no hay UUID
  // Agregar columnas player_a_name y player_b_name como fallback
}
```

**IMPORTANTE**: antes de implementar, agrega estas columnas en Supabase SQL Editor:
```sql
alter table public.battles
  add column if not exists player_a_name text,
  add column if not exists player_b_name text,
  add column if not exists tournament_id_ref uuid references public.tournaments(id) on delete cascade;
```

Luego implementa el hook completo con estas columnas.

### `src/components/HistoryScreen.jsx`
- Carga los últimos 20 torneos del usuario desde Supabase
  (tournaments WHERE created_by = user.id ORDER BY created_at DESC LIMIT 20)
- Para cada torneo: fecha, # de participantes, campeón (quien tuvo más victorias)
- Al tap en un torneo: expandir y mostrar la lista de batallas con resultados
- Botón "← Volver" navega a SetupScreen
- Spinner de carga, estado vacío si no hay historial

## Archivos a modificar

### `src/App.jsx`
- Agregar `SCREENS.HISTORY = 'history'` al enum
- En `handleReset()`: antes de limpiar, llamar a `saveTournamentToHistory(...)`
- Agregar botón "Ver historial" en SetupScreen (o en el hamburger menu)
- Agregar renderizado de HistoryScreen en el main

### `src/components/SetupScreen.jsx`
- Agregar enlace/botón "Historial →" discreto debajo del título o en header

Estilo: consistente con el resto. Fondo zinc-950, acentos red-500, texto zinc-400 para secundario.
```

---

## TAREA 5 — Compartir resultado como imagen (TOURNAMENT MODE)

**Qué construye:** imagen vertical 1080×1920 con el podio, lista para Instagram/WhatsApp Stories.

### Prompt para Cursor

```
En ClashPro, implementa la generación de una imagen de resultado con Canvas API.
Lee CURSOR_CONTEXT.md para el contexto.

## Archivo a crear: `src/utils/generateResultImage.js`

```js
export async function generateResultImage({ competitors, matches }) {
  // Calcular ranking usando calculateScores de roundRobin.js
  // Crear canvas offscreen 1080x1920
  // Dibujar:
  //   - Fondo: #09090b (zinc-950)
  //   - Rectángulo rojo en top: 160px alto
  //   - "CLASHPRO" en blanco, centrado, bold 96px
  //   - Fecha de hoy debajo, zinc-400, 36px
  //   - Podio: 🥇🥈🥉 con nombre y puntos, fuente bold 56/44/36px
  //   - Lista completa debajo: número + nombre + puntos, 32px zinc-300
  //   - Footer: "clash-pro.vercel.app" en zinc-600, 28px
  // Retornar Blob png
}
```

## En `src/components/LeaderboardScreen.jsx`
- Botón "📸 Compartir imagen"
- Al click:
  1. Llamar generateResultImage
  2. Si navigator.canShare({ files: [...] }) → Web Share API con el archivo
  3. Si no → crear link temporal y descargar automáticamente
  4. Mostrar spinner mientras genera
- El botón solo aparece si hay al menos 3 competidores con resultados

Nota: usar fuente del sistema para Canvas (no necesita Google Fonts).
No instalar dependencias extra.
```

---

# FASE 3 — Integración (Ambos modos)

**Meta**: Unificar Practice y Tournament en una sola app con toggles claros

**Cuándo**: Después de validar ambas fases con usuarios
**Tareas**:
- [ ] Crear `useMode.js` hook (determina si estamos en practice o tournament)
- [ ] Agregar toggle "Practice ↔ Tournament" en SetupScreen (oculto por defecto)
- [ ] Adaptar BattleScreen: mostrar votación solo si isTournament
- [ ] Adaptar MatchesScreen: estructura diferente por modo
- [ ] Adaptar LeaderboardScreen: solo aparece si isTournament
- [ ] Validar feature flags (plan + mode = feature access correcto)
- [ ] Testing cross-mode: datos de practice no se mezclen con tournament

---

## Notas para Cursor

- **Antes de cada tarea**: leer `CURSOR_CONTEXT.md` + `MODE_FRAMEWORK.md` completo
- **Para SQL**: ejecutar en Supabase Dashboard → SQL Editor antes de correr
- **Para storage**: verificar Supabase Dashboard → Storage que exista el bucket
- **Si algo no compila**: correr `npm run build` para ver errores exactos
- **El plan Free = 10 competidores** (ya en `usePlan.js`)
- **Código promo**: `SALSANAMA26` (ya en DB)
- **Deploy**: `git push` → Vercel auto-deploya

## Cronología de ejecución recomendada

```
FASE 1 — PRACTICE MODE (Hoy-mañana)
├─ Sesión 1: TAREA 1 (Perfiles + Fotos) — con Sonnet
├─ Sesión 2: TAREA 2 (Offline mode) — con Sonnet
└─ Sesión 3: TAREA 3A (Quick wins Practice) — con Haiku

[Validar con usuarios reales en Practice mode]

FASE 2 — TOURNAMENT MODE (Próxima semana)
├─ Sesión 4: TAREA 3B (Quick wins Tournament) — con Haiku
├─ Sesión 5: TAREA 4 (Historial) — con Sonnet
└─ Sesión 6: TAREA 5 (Imagen compartible) — con Sonnet

[Validar con usuarios reales en Tournament mode]

FASE 3 — INTEGRACIÓN (Dos semanas después)
└─ Sesión 7: Feature flags + toggles + testing
```

---

## Tabla resumen: Qué tarea implementa qué features

| Tarea | Fase | Modo | Features | Dependencias |
|-------|------|------|----------|-------------|
| **1** | 1 | Practice | Perfiles, fotos, niveles | Supabase Storage |
| **2** | 1 | Practice | Offline, sync, banner | vite-plugin-pwa |
| **3A** | 1 | Practice | Número batalla, nueva sesión | Ninguna |
| **3B** | 2 | Tournament | Confetti, estadísticas, WhatsApp | canvas-confetti |
| **4** | 2 | Tournament | Historial de torneos, búsqueda | Supabase (ya existe) |
| **5** | 2 | Tournament | Imagen compartible (1080x1920) | Canvas API nativa |

---

## Status de implementación

**FASE 1 — PRACTICE MODE**
- [ ] Task 1: Perfiles de competidores
- [ ] Task 2: Offline mode (PWA)
- [ ] Task 3A: Quick wins (número batalla, nueva sesión)
- [ ] Validación: usuarios practican sin errores

**FASE 2 — TOURNAMENT MODE**
- [ ] Task 3B: Quick wins (confetti, estadísticas, WhatsApp)
- [ ] Task 4: Historial de torneos
- [ ] Task 5: Compartir imagen
- [ ] Validación: usuarios compiten y comparten resultados

**FASE 3 — INTEGRACIÓN**
- [ ] Crear hook useMode
- [ ] Adaptar componentes por modo
- [ ] Feature flags (plan + mode)
- [ ] Testing cross-mode
- [ ] Deploy a producción

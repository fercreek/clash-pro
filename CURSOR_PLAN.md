# ClashPro — Plan de trabajo para Cursor Agent

> Generado: 2026-04-01
> Ejecutar en orden. Cada tarea es independiente y entregable por separado.

---

## Cómo usar este archivo en Cursor

1. **Abre el proyecto**: `File → Open Folder` → selecciona la carpeta `clash_pro`
2. **Lee el contexto primero**: abre `CURSOR_CONTEXT.md` — contiene la arquitectura completa
3. **Activa Cursor Agent**: `Cmd+I` (Mac) o `Ctrl+I` (Windows) → selecciona modo **Agent**
4. **Modelo recomendado**: Claude Sonnet o Claude Opus para tareas complejas
5. **Para cada tarea**: copia el bloque de prompt exactamente como está y pégalo en el chat del Agent
6. **Antes de continuar**: siempre revisa los cambios en el diff de Cursor antes de aceptar
7. **Corre la app**: `npm run dev` en la terminal integrada (`Ctrl+\``) y abre `http://localhost:5173`
8. **Deploy**: `git add -A && git commit -m "feat: ..." && git push` — Vercel hace auto-deploy

---

## Variables de entorno necesarias

En `.env.local` (ya existe):
```
VITE_SUPABASE_URL=https://gxweakeahiofjxocoavo.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_Pwv0amoK6rJsqEVCdwUiGg_TK-nkujY
VITE_SPOTIFY_CLIENT_ID=37538ceac01a4600bc34087271fe8c7c
```

---

## Estado actual del proyecto

**Ya implementado y funcionando:**
- Auth username/password (Supabase, email fake `@clashpro.local`)
- Round Robin automático con cronómetro por fases
- Pausa, reiniciar fase, +10s, terminar ronda manualmente
- Tap al círculo para pausar
- Campana de ring al iniciar ronda (Web Audio)
- Cierre rápido de batalla desde la lista
- Cola de canciones (queue) en SpotifyPlayer
- Mini barra de canción en BattleScreen
- Leaderboard en tiempo real
- Persistencia localStorage + Supabase por usuario
- Spotify Embed + OAuth PKCE para playlists personales
- Hamburger menu con logout y código promo
- Landing page con features y planes
- `usePlan.js` — feature flags (Free: 10 competidores, Pro: ilimitado)
- Migration SQL para planes y códigos promo (`SALSANAMA26` = Pro)

**Plan Free = 10 competidores. Pro = ilimitado.**

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

## TAREA 3 — Quick wins (hacer en una sola sesión)

**Son 6 mejoras pequeñas. Ejecuta el prompt completo de una vez.**

### Prompt para Cursor

```
Tengo ClashPro, una app React + Supabase. Lee CURSOR_CONTEXT.md para el contexto completo.

Implementa las siguientes 6 mejoras en una sola sesión. Son independientes entre sí.

---

### QW-1: Confetti al declarar ganador

En `src/components/LeaderboardScreen.jsx`:
- Instala `npm install canvas-confetti`
- Importa: `import confetti from 'canvas-confetti'`
- Al montar el componente (useEffect una sola vez), lanza confetti:
  ```js
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 },
    colors: ['#ef4444', '#f97316', '#ffffff', '#fbbf24'] })
  ```
- Solo si hay al menos 1 match completado (no lanzar si no hay resultados)

---

### QW-2: Estadísticas en el leaderboard

En `src/utils/roundRobin.js`, agrega la función `computeExtendedStats(competitors, matches)` que retorna array de:
`{ name, wins, losses, draws, played, winRate, currentStreak }`
- currentStreak: racha actual de victorias (positivo) o derrotas (negativo)

En `src/components/LeaderboardScreen.jsx`:
- Debajo del nombre en cada fila del ranking, mostrar en texto pequeño:
  `"5V · 1D · 2E · Racha: 3🔥"` (victorias, derrotas, empates, racha)
- Si la racha es positiva: mostrar en verde con 🔥
- Si es negativa: mostrar en zinc-500

---

### QW-3: Número de batalla en BattleScreen

En `src/components/BattleScreen.jsx`:
- Recibir prop `matchNumber` y `totalMatches` (ej. "Batalla 3 de 10")
- Mostrar encima del VS: pequeño texto `"Batalla 3/10"` en zinc-500 text-xs

En `src/App.jsx`:
- Calcular `matchNumber`: índice del activeMatch dentro del array matches + 1
- Pasar `matchNumber={matchIndex + 1}` y `totalMatches={matches.length}` a BattleScreen

---

### QW-4: Límite visual Free con CTA de upgrade

En `src/components/SetupScreen.jsx`:
- Importar `usePlan` de `../hooks/usePlan`
- Si `competitors.length >= maxCompetitors && isFree`:
  - Deshabilitar el botón de agregar más competidores
  - Mostrar debajo de la lista: banner amarillo con texto
    `"Límite del plan Gratis (10 competidores). Activa Pro para torneos ilimitados."`
  - El banner tiene un botón pequeño "Ver planes ↗" que hace scroll a la landing
    o muestra un modal simple con los dos planes

---

### QW-5: Botón "Nueva sesión" al terminar torneo

En `src/components/LeaderboardScreen.jsx`:
- Agregar botón secundario "↺ Nueva sesión (mismos competidores)" junto al botón de reset
- Este botón llama a un nuevo prop `onNewSession`
- No borra los competidores, solo resetea los matches

En `src/App.jsx`:
- Implementar `handleNewSession`: clearState parcial (solo matches y activeMatchId),
  luego genera nuevo Round Robin con los mismos `competitors` y va a SCREENS.MATCHES

---

### QW-6: Compartir resultado por WhatsApp

En `src/components/LeaderboardScreen.jsx`:
- Ya existe `calculateScores`. Construir un texto del ranking:
  ```
  🏆 ClashPro — Resultado de hoy

  1. Daniel Alfaro — 12 pts (4V 0D)
  2. Aly — 9 pts (3V 1D)
  3. Fer — 6 pts (2V 2D)
  ...

  clash-pro.vercel.app
  ```
- Botón "📲 Compartir por WhatsApp" que abre:
  `https://wa.me/?text=${encodeURIComponent(texto)}`
- En móvil esto abre WhatsApp directamente para compartir el texto

---

Notas generales:
- Tailwind únicamente para estilos
- Iconos de lucide-react
- Mobile first (375px mínimo)
- No introducir nuevas dependencias excepto canvas-confetti para QW-1
```

---

## TAREA 4 — Historial de torneos

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

## TAREA 5 — Compartir resultado como imagen (Stories)

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

## Notas para Cursor

- **Antes de cada tarea**: leer `CURSOR_CONTEXT.md` completo
- **Para SQL**: ejecutar en Supabase Dashboard → SQL Editor antes de correr la app
- **Para storage**: verificar en Supabase Dashboard → Storage que el bucket existe
- **Si algo no compila**: correr `npm run build` para ver errores exactos
- **El plan Free es 10 competidores** (ya aplicado en `usePlan.js`)
- **Código de acceso Pro para amigos**: `SALSANAMA26` (ya en DB)
- **Deploy**: `git push` → Vercel auto-deploya en ~1 minuto

## Orden sugerido de ejecución

```
Sesión 1: TAREA 3 (Quick wins) — son rápidas, dan mucho valor visual
Sesión 2: TAREA 1 (Perfiles) — requiere SQL + Storage primero
Sesión 3: TAREA 2 (Offline) — instalar vite-plugin-pwa primero
Sesión 4: TAREA 4 (Historial) — requiere SQL antes
Sesión 5: TAREA 5 (Imagen compartible) — independiente
```

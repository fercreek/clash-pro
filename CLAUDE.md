# ClashPro — Guía para Claude

## Qué es este proyecto

App web progresiva (PWA) para torneos y práctica de salsa 1vs1 (formato Salsanama). Sin papel, sin Excel. Los organizadores la usan desde el teléfono durante el evento.

**Estado:** MVP en desarrollo. Un solo ambiente de Supabase (no hay dev/staging separado). Todos los usuarios tienen plan `pro` por defecto (early adopters). Somos nosotros mismos quienes probamos el app.

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| UI | React 18, JSX (sin TypeScript) |
| Build | Vite 5 — requiere **Node ≥ 20** (`nvm use`) |
| Estilos | Tailwind CSS 3 (dark theme, `zinc-950` base, `red-500` acento) |
| Auth + DB | Supabase (`@supabase/supabase-js`) |
| Hosting | Vercel (SPA con rewrite a `/index.html`) |
| Sonido | Web Audio API (sin archivos de audio externos) |
| PWA | `vite-plugin-pwa` con service worker auto-update |
| Íconos | `lucide-react` únicamente |

---

## Arrancar local

```bash
nvm use          # activa Node 20 (hay .nvmrc en el root)
npm install
npm run dev      # http://localhost:5173
```

Las variables de entorno están en `.env.local` (no subir a git). El archivo tiene:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SPOTIFY_CLIENT_ID`

---

## Arquitectura — pantallas

**No hay React Router.** La navegación es con `useState` + `window.history.pushState`.

```
SCREENS = { SETUP, MATCHES, BATTLE, LEADERBOARD, BLOG, BLOG_POST, GUIA }
```

Para agregar una pantalla nueva:
1. Agregar la clave a `SCREENS` en `src/App.jsx`
2. Crear el componente en `src/components/NuevaScreen.jsx`
3. Importarlo en `App.jsx`
4. Renderizarlo en el `<main>` condicional
5. Agregar handler de navegación (`goToNueva`) con `window.history.pushState`
6. Agregar al `popstate` handler para que el botón Back funcione
7. Agregar enlace en `HamburgerMenu.jsx` si va en el menú

---

## Arquitectura — base de datos

**Supabase como único backend.** Toda lectura/escritura va por `supabase` client (`src/lib/supabase.js`).

### Flujo de migraciones

```bash
npm run db:new -- nombre_descriptivo   # crea archivo migration con timestamp
# → editar el SQL generado
npm run db:push                        # aplica al proyecto remoto de Supabase
npm run db:diff                        # compara schema local vs remoto
```

### Reglas SQL para migraciones (siempre idempotentes)

```sql
-- Tabla nueva
CREATE TABLE IF NOT EXISTS public.mi_tabla (...);

-- Columna nueva
ALTER TABLE public.mi_tabla ADD COLUMN IF NOT EXISTS columna text;

-- Función
CREATE OR REPLACE FUNCTION public.mi_funcion() ...

-- Política RLS (usar bloque DO para idempotencia)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE ...) THEN
    CREATE POLICY "nombre" ON public.mi_tabla ...;
  END IF;
END $$;

-- Índice
CREATE INDEX IF NOT EXISTS nombre_idx ON public.mi_tabla (columna);
```

**NUNCA:** modificar migraciones ya aplicadas. Si algo salió mal, crear una nueva migración que lo corrija.

**NUNCA:** poner datos seed en migraciones. Los datos van en `supabase/seed.sql` con `ON CONFLICT DO NOTHING`.

Ver plantilla completa: `supabase/migrations/TEMPLATE.sql`

---

## Arquitectura — planes y features

Los features están gateados por plan en `src/hooks/usePlan.js` y `src/lib/featurePolicy.js`.

```js
const { isPro, hasHistory, maxCompetitors } = usePlan()
```

El default actual es `pro` para todos los usuarios sin plan explícito (early adopters). No mostrar paywalls a nuestro equipo de prueba.

---

## Agregar contenido al blog / base de conocimiento

1. Crear `src/content/blog/mi-articulo.md` con frontmatter YAML:
   ```md
   # Título del artículo
   Contenido en markdown...
   ```
2. Agregar entrada al array `POSTS` en `src/content/blog/index.js`:
   ```js
   { slug: 'mi-articulo', title: '...', date: 'YYYY-MM-DD', category: 'conocimiento' | 'buenas-practicas', excerpt: '...' }
   ```

Categorías disponibles: `conocimiento`, `buenas-practicas`.

---

## Agregar sonidos

Dos categorías, dos patrones distintos:

- **Sonidos UI cortos** (countdown, bell, participant change): Web Audio API procedural en `src/hooks/useCountdownBeeps.js`. Sin archivos.
- **Percusión del secuenciador de ritmos** (clave, conga, cowbell, maracas, bajo): samples WAV CC0 en `src/audio/samples/`. Cargados vía `import.meta.glob` en `src/audio/samples.js`, reproducidos como `AudioBuffer` en `useRhythmEngine.js`. Si un sample falta, cae a la síntesis de `INSTRUMENT_SYNTHS` (`src/data/rhythmPatterns.js`).

Patrón para sonidos UI:
```js
const playMiSonido = useCallback(() => {
  if (muted) return
  const ctx = ensureCtx()
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain); gain.connect(ctx.destination)
  osc.frequency.value = 880
  osc.type = 'sine'
  gain.gain.setValueAtTime(0.3, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.25)
}, [ensureCtx, muted])
```

Sonidos existentes: `playBell` (inicio ronda), `playRoundEnd` (fin ronda), `playParticipantChange` (cambio participante), `playBeep` (cuenta regresiva).

---

## Deploy

```bash
# Solo código (sin cambios de DB)
npm run deploy

# Con cambios de DB (migraciones nuevas)
npm run db:push    # primero aplica migraciones
npm run deploy     # luego despliega el frontend
```

Vercel usa Node 20+ automáticamente. El build (`npm run build`) no funciona local con Node 16 — usar Node 20 (`nvm use`).

---

## Convenciones de código

- **Sin TypeScript** — JSX y JS puro
- **Sin nueva dependencia** sin revisar si ya existe algo en el repo que lo resuelva
- **Tailwind para todo** — no CSS custom salvo casos muy específicos (`.prose-salsa` en `index.css`)
- **`lucide-react` para íconos** — no instalar otras librerías de íconos
- **Funciones pequeñas y directas** — no abstraer antes de que algo se repita 3+ veces
- **Hooks para lógica reutilizable** — si un componente tiene >50 líneas de lógica, considera extraer a un hook
- **No agregar comentarios** salvo donde la lógica no es obvia
- **No error handling especulativo** — solo validar en los límites del sistema (inputs del usuario, APIs externas)

---

## Spec-kit workflow

Features grandes se documentan en `specs/<nombre-feature>/` antes de codear. Patrón:

```
specs/<feature>/
  spec.md     ← contrato: WHAT. Problem, user stories, acceptance criteria, data model, out-of-scope.
  plan.md     ← arquitectura: WHY/HOW. Current state (paths:líneas), decisiones, file tree, risks.
  tasks.md    ← ejecución ordenada por fases con rutas exactas.
  FUTURE_DECISION.md  (opcional) ← decisiones pospuestas con disparador para resolver.
```

Regla: feature nuevo con >3 archivos o cambio de DB arranca con los 3 mds. Commits por fase (`feat(area): descripción`). Ver ejemplo en `specs/quick-practice-roster/`.

---

## Estructura de archivos

```
src/
  App.jsx              ← router principal, state global del torneo
  components/          ← pantallas y componentes UI
  hooks/               ← lógica reutilizable (auth, plan, sounds, rhythm)
  lib/                 ← clientes externos (supabase, spotify, featurePolicy)
  utils/               ← funciones puras (roundRobin, persist, songs, uris)
  data/                ← datos estáticos (practiceRoutines, rhythmPatterns)
  content/blog/        ← artículos markdown + índice POSTS

supabase/
  migrations/          ← archivos SQL numerados por timestamp
  seed.sql             ← datos iniciales idempotentes
  config.toml          ← config del CLI
  TEMPLATE.sql         ← plantilla para nuevas migraciones

scripts/
  new-migration.js     ← generador de migraciones (npm run db:new)

specs/
  <feature>/           ← spec-kit: spec.md + plan.md + tasks.md por feature grande
```

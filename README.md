# ClashPro

PWA para organizar **batallas 1vs1 de improvisación** (salsa / baile social): torneos con round robin, práctica guiada con emparejamiento inteligente por nivel, temporizador, ranking y gestión de bailarines. Mobile-first.

## Características

### Torneos
- Round robin clásico con BYE automático para impar
- Batalla en fases con temporizador, votación (gana A / gana B / empate)
- Leaderboard con campeón y opción de compartir (Web Share / WhatsApp / copiar)
- Historial de torneos guardado en Supabase

### Práctica Guiada
- Emparejamiento por nivel (beginner / intermedio / avanzado): cost function + 2-opt local search que prefiere niveles similares y evita repetir parejas ya vistas
- Soporte para número impar: rotación estricta de repeaters (nadie repite dos veces antes de que todos hayan repetido una)
- Múltiples iteraciones por sesión con historial de pares acumulado
- Descarte de rondas sin afectar estadísticas
- Contador de apariciones en vivo + helper de balance al editar el roster
- Ranking en vivo ordenado por rondas bailadas en la sesión
- Historial de práctica por sesión guardado en Supabase

### Mis Bailarines
- Registro de participantes con nombre, nivel y conteo de rondas bailadas (acumulado entre sesiones)
- Edición inline: nombre, nivel (B/I/A), activar/desactivar
- Los participantes registrados aparecen en RosterPicker con dot de color por nivel

### Otros
- Spotify: reproductor embebido, playlists base + tracks custom por playlist
- Sequenciador de ritmos con samples reales (clave, conga, cowbell, maracas, bajo)
- Práctica Guiada: rutinas predefinidas con patrones de movimiento
- Mis Patrones: guía de patrones de salsa con audio
- Base de Conocimiento y Buenas Prácticas (blog estático)
- Proyección en vivo: URL pública sin auth para pantalla grande en el evento

## Stack

| Área | Tecnología |
|---|---|
| Build | Vite 5 (Node ≥ 20) |
| UI | React 18, JSX (sin TypeScript) |
| Estilos | Tailwind CSS 3 — dark theme `zinc-950` / acento `red-500` |
| Íconos | lucide-react |
| Auth + DB | Supabase (`@supabase/supabase-js`) |
| Hosting | Vercel (SPA rewrite a `/index.html`) |
| Sonido | Web Audio API + samples WAV CC0 |
| PWA | vite-plugin-pwa con service worker auto-update |

## Variables de entorno

Crear `.env.local` (no subir a git):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_SPOTIFY_CLIENT_ID=...
```

## Desarrollo

```bash
nvm use          # Node 20 (.nvmrc en el root)
npm install
npm run dev      # http://localhost:5173
```

## Base de datos

```bash
npm run db:new -- nombre_descriptivo   # nueva migración con timestamp
npm run db:push                        # aplica al proyecto remoto
npm run db:diff                        # compara local vs remoto
```

Las migraciones van en `supabase/migrations/`. Siempre idempotentes (`IF NOT EXISTS`, `CREATE OR REPLACE`). Ver plantilla en `supabase/migrations/TEMPLATE.sql`.

## Deploy

**Requiere confirmación explícita antes de correr.**

```bash
npm run db:push    # si hay migraciones nuevas
npm run deploy     # despliega a Vercel (solo con ok explícito de Fernando)
```

## Estructura del código

```
src/
  App.jsx                        # Router (useState + pushState), state global
  components/
    DashboardScreen.jsx
    SetupScreen.jsx               # Setup torneo y práctica con resume de sesión
    MatchesScreen.jsx             # Lista de batallas + práctica live
    BattleScreen.jsx              # Fases + temporizador + votación
    LeaderboardScreen.jsx
    DancersScreen.jsx             # CRUD de bailarines con niveles
    PracticeHistoryScreen.jsx
    PracticeRosterEditModal.jsx   # Editar roster en práctica + balance helper
    DiscardRoundsModal.jsx        # Confirmar descarte de rondas sin contar stats
    HamburgerMenu.jsx
    RosterPicker.jsx              # Selector de bailarines con dot de nivel
    ...
  hooks/
    useRoster.js                  # CRUD competitors: level, is_active, frequency_count
    useAuth.js
    usePlan.js
    usePracticeSession.js
    useCountdownBeeps.js
    useRhythmEngine.js
  utils/
    practiceRounds.js             # generatePracticeRounds, pairingCost, 2-opt optimizer
    roundRobin.js                 # generateRoundRobin, calculateScores
    persist.js                    # localStorage snapshot v3
  lib/
    supabase.js
    featurePolicy.js
  data/
    practiceRoutines.js
    rhythmPatterns.js
  content/blog/                   # Artículos markdown + índice POSTS

supabase/
  migrations/                     # SQL con timestamp, siempre idempotentes
  seed.sql
  config.toml
  TEMPLATE.sql

specs/                            # Spec-kits por feature (spec + plan + tasks)
```

## Lógica de emparejamiento (práctica)

`src/utils/practiceRounds.js`:

1. Genera round-robin clásico (garantiza cobertura total)
2. Para cada ronda aplica **2-opt local search**: prueba swaps de parejas, guarda si baja el costo total
3. `pairingCost(a, b)` = `|level[a] - level[b]| × 10 + vecesPareados × 3`
   - Diferencia de nivel domina; repetir pareja penaliza levemente
   - Sin nivel asignado → tratado como intermedio (costo mínimo vs cualquier extremo)
4. Para impar: rotación estricta de repeaters (tier mínimo), con preferencia por nivel similar al partner; no puede repetir en rondas consecutivas

## Puntuación (torneos)

| Resultado | Puntos |
|---|---|
| Gana A | A +3 |
| Gana B | B +3 |
| Empate | A +1, B +1 |
| BYE | Sin puntos |

## Licencia

Uso personal / del evento.

# ClashPro

PWA para organizar **batallas 1vs1 de improvisación** (pensada para salsa / baile social): round robin, temporizador por rondas, votación del resultado y ranking. Sin backend: todo el estado vive en el navegador (`localStorage`).

## Características

- **Configuración:** lista de competidores, tiempo por ronda (30s / 40s).
- **Round robin:** emparejamientos con rotación clásica; si el número de participantes es impar, entra **BYE** (descanso automático).
- **Batalla en 5 fases:** ronda 1 (jugador A) → ronda 2 (jugador B) → votación (gana A, gana B o empate con puntuación 3 / 3 / 1+1).
- **Listado de batallas** con vista **Lista** o **Por ronda**; mini–leaderboard en la pantalla de batallas.
- **Leaderboard** con campeón destacado y **compartir** (Web Share, WhatsApp o copiar texto).
- **Spotify:** reproductor embebido (iframe API), playlists definidas en código y **canciones extra por playlist** guardadas en `localStorage`.
- **Persistencia:** al refrescar no se pierde el torneo en curso (política: si estabas en mitad de una batalla, vuelves a la lista de batallas).
- **PWA:** `manifest.json`, iconos e instalación en móvil / escritorio.

## Stack

| Área        | Tecnología                          |
| ----------- | ----------------------------------- |
| Build       | [Vite 5](https://vitejs.dev/)       |
| UI          | [React 18](https://react.dev/)      |
| Estilos     | [Tailwind CSS 3](https://tailwindcss.com/) |
| Iconos      | [lucide-react](https://lucide.dev/)  |
| Datos       | Solo cliente (`localStorage`)      |

## Requisitos

- Node.js **18+** (recomendado 20+)
- npm (o pnpm/yarn si adaptas los comandos)

## Desarrollo

```bash
npm install
npm run dev
```

Por defecto Vite usa el puerto **5173**. Para usar **3000**:

```bash
npm run dev -- --port 3000
```

## Build y preview local

```bash
npm run build
npm run preview
```

## Despliegue (Vercel)

El repo incluye [`vercel.json`](vercel.json) con un rewrite SPA (`/(.*)` → `/index.html`) para rutas futuras en cliente.

1. Conecta el repositorio en [Vercel](https://vercel.com/new) o enlaza el proyecto con la CLI.
2. Ajustes típicos: **Framework Vite**, comando de build `npm run build`, directorio de salida **`dist`**.
3. No hace falta configurar variables de entorno para esta app.

Despliegue manual desde la carpeta del proyecto (requiere [Vercel CLI](https://vercel.com/docs/cli) y sesión iniciada):

```bash
npm run deploy
```

## Estructura del código

```
src/
  App.jsx                 # Pantallas: setup | matches | battle | leaderboard
  main.jsx
  index.css
  components/
    SetupScreen.jsx
    MatchesScreen.jsx     # Toggle Lista / Por ronda
    BattleScreen.jsx      # Fases + temporizador + votación + sonido opcional
    LeaderboardScreen.jsx # Ranking + compartir
    SpotifyPlayer.jsx     # Embed + playlists + tracks personalizados
  hooks/
    useCountdownBeeps.js  # Pitidos últimos segundos (Web Audio)
  utils/
    roundRobin.js         # generateRoundRobin, calculateScores
    persist.js            # Snapshot del torneo en localStorage
    songs.js              # PLAYLISTS por defecto
    spotifyUri.js         # Parse de URIs / URLs + mapa de tracks custom
public/
  manifest.json
  icon.svg, icon-192.png, icon-512.png, apple-touch-icon.png, logo.png
```

## Puntuación

| Resultado | Puntos              |
| --------- | ------------------- |
| Gana A    | A +3                |
| Gana B    | B +3                |
| Empate    | A +1, B +1          |
| BYE       | Sin puntos de batalla |

## Spotify

El reproductor usa la [Spotify iframe API](https://developer.spotify.com/documentation/embeds/references/iframe-api). Reproducir suele requerir **Spotify Premium** y sesión iniciada en el mismo navegador. Las listas base están en [`src/utils/songs.js`](src/utils/songs.js); los temas añadidos desde la UI se guardan bajo la clave `clashpro:customTracks:v1` en `localStorage`.

## Licencia

Uso personal / del evento. Ajusta la licencia si publicas el repo de forma abierta.

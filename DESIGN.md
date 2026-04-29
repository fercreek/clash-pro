# ClashPro — guía de diseño UI

Referencia para mantener consistencia al añadir o retocar pantallas. Stack: **React**, **Tailwind CSS**, **lucide-react**. Revisado contra `DashboardScreen`, `AuthScreen`, `SetupScreen`, `App` (shell), `MatchesScreen`, `DancersScreen`, `LeaderboardScreen`, `PracticeHistoryScreen` y estilos globales en [`src/index.css`](src/index.css).

---

## 1. Principios

- **Fondo**: siempre capa base oscura (`zinc-950` / `#09090b` en `body`).
- **Marca**: logotipo **CLASH** blanco + **PRO** en `red-500` (navbar, hero auth).
- **Acción principal**: botones de confirmación / arranque fuerte en **`bg-red-500`** con hover `red-400`, texto blanco, `font-black` donde aplique.
- **Competición (torneo)**: acento **ámbar** (`amber-400`–`amber-500`, bordes `amber-500/30`, fondos `amber-500/10`).
- **Práctica libre**: acento neutro **zinc** + toques **ámbar** suaves en cards secundarios; modo seleccionado con `ring` zinc o borde `zinc-500`.
- **Jerarquía**: títulos grandes `font-black` y tracking ajustado; etiquetas de sección en mayúsculas pequeñas `text-[10px] font-black tracking-[0.2em]` y `text-zinc-600`.

---

## 2. Paleta (Tailwind)

| Uso | Clases habituales |
|-----|-------------------|
| Fondo app / pantalla | `bg-zinc-950`, contenedores elevados `bg-zinc-900`, `bg-zinc-900/60`, `bg-zinc-900/80` |
| Bordes | `border-zinc-800`, `border-zinc-700`, divisores `bg-zinc-900` (línea 1px) |
| Texto principal | `text-white` |
| Texto secundario | `text-zinc-300`, `text-zinc-400`, `text-zinc-500`, `text-zinc-600` |
| CTA primario | `bg-red-500 hover:bg-red-400`, `text-red-400` para acentos y números |
| Pro / premium | `amber-400`, `amber-500/10`, `border-amber-500/20`–`30` |
| Éxito / lista activa | `emerald-500/20`, `text-emerald-300`, `text-emerald-400` |
| Advertencia / archivo | `amber-500/10`, `text-amber-300`, `text-amber-400` |
| Info / guía | `orange-400`, `blue-400` (tiles dashboard) |
| Peligro duro (borrar) | `border-red-900/50`, `bg-red-950/30`, `text-red-400` |
| Backdrop | `backdrop-blur-sm`, `bg-zinc-950/80`, `bg-zinc-950/95` |

---

## 3. Tipografía

- **Hero / dashboard título**: `text-[28px]`–`text-[38px]` o mayor en landing; `font-black`, `tracking-tight` o `tracking-tighter`.
- **Título pantalla estándar** (setup, etc.): `text-[28px] font-black text-white leading-tight`.
- **Etiqueta de sección** (Modo, Bailarines, Herramientas): `text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600` + línea `flex-1 h-px bg-zinc-900` en flex con el título.
- **Subtítulo contexto**: `text-zinc-500 text-xs` o `text-[11px] text-zinc-500`.
- **Cuerpo / inputs**: `text-sm font-medium`; tablas `text-xs`–`text-sm`.
- **Números / stats**: `tabular-nums`, a menudo `font-black text-red-400` para contadores de rondas.

---

## 4. Layout y contenedores

- **Flujo principal app logada** (dashboard, setup, listas): `max-w-md mx-auto`, márgenes `px-5` (o `px-3 sm:px-4` en tablas anchas), `min-h-full` en raíz de pantalla.
- **Espacio para CTA fijo abajo**: `pb-28` en el scroll principal cuando hay barra sticky (setup “Armar rondas”).
- **Navbar** ([`App.jsx`](src/App.jsx)): fila `flex items-center justify-between`, `border-b border-zinc-700`, `bg-zinc-950/80 backdrop-blur-sm`, `px-3 py-2.5`. Pills nav: `px-1.5 py-1 rounded-md`, activo `text-white bg-zinc-800`, inactivo `text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/70`.
- **Headers sticky en subpantallas** (ej. Dancers): `sticky top-0 z-20`, `bg-zinc-950/95 backdrop-blur border-b border-zinc-900`.

---

## 5. Componentes UI recurrentes

### 5.1 Sección con título

```text
flex items-center gap-3 mb-1
  p: text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600
  div: flex-1 h-px bg-zinc-900
```

### 5.2 Card / panel

- `rounded-xl` o `rounded-2xl`, `border border-zinc-800`, fondo `bg-zinc-900/80` o `bg-zinc-900/60`.
- Pills chips: `rounded-lg` o `rounded-xl`, `border border-zinc-800`, `text-xs font-bold` o `font-black`.

### 5.3 Botón primario (full width)

- `rounded-xl` o `rounded-2xl`, `bg-red-500 hover:bg-red-400`, `font-black`, `active:scale-95` o `active:scale-[0.99]`.

### 5.4 Botón secundario / ghost

- `border border-zinc-700 bg-zinc-800` o `bg-zinc-900/60`, `text-zinc-400 hover:text-zinc-200`.

### 5.5 Toggle modo (práctica vs competición)

- Inactivo: `bg-zinc-900/60 border border-zinc-800 text-zinc-400`.
- Activo práctica: `border-zinc-500 ring-1 ring-zinc-400/30 text-white scale-[1.02]`.
- Activo competición: `bg-amber-500/10 border-amber-500/40 ring-amber-400/30 text-amber-300 scale-[1.02]`.

### 5.6 Input de texto

- `bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white`, focus `focus:border-red-500/50` o `focus:border-zinc-600`, `placeholder-zinc-600`.

### 5.7 Tabla densa (Dancers)

- Contenedor `overflow-x-auto rounded-xl border border-zinc-800/80 bg-zinc-950/50`.
- `thead` sticky con `bg-zinc-950/95 backdrop-blur-sm`, celdas `text-[10px] font-black uppercase text-zinc-500`.

### 5.8 Niveles bailarín (roster / tabla)

- Principiante: `emerald` (`bg-emerald-500/15`, `text-emerald-400`, borde `emerald-500/30`).
- Intermedio: `blue` análogo.
- Avanzado: `red` análogo.

---

## 6. Motion y feedback

- Transiciones cortas: `transition-colors`, `transition-all duration-200`.
- Listas/cards clicables: `active:scale-[0.97]`–`0.99`, hovers suaves en bordes y sombras (`hover:shadow-lg`, `hover:border-zinc-700`).
- Progreso: barras `rounded-full bg-zinc-800` + relleno `bg-red-500`.

---

## 7. Iconografía

- **lucide-react**; tamaños típicos `12`–`20` en UI densa, `26` en iconos de tarjeta grande.
- Color de icono alineado al acento del bloque (`text-red-400`, `text-amber-400`, `text-zinc-600` secundario).

---

## 8. Contenido markdown (blog / guía)

- Clase contenedor artículo: **`prose-salsa`** (definida en [`src/index.css`](src/index.css)): encabezados, links `red-400`, blockquote borde `red-500`, código `zinc`/`orange`.

---

## 9. Mapa pantalla → patrones (mantener alineado)

| Área | Archivo(s) | Notas de diseño |
|------|------------|-----------------|
| Landing / auth | [`AuthScreen.jsx`](src/components/AuthScreen.jsx) | Hero blur rojo, CTA `red-500`, mucho aire |
| Inicio | [`DashboardScreen.jsx`](src/components/DashboardScreen.jsx) | Cards gradient torneo/práctica, grid herramientas 3 cols |
| Nueva sesión | [`SetupScreen.jsx`](src/components/SetupScreen.jsx) | `max-w-md`, secciones con línea, CTA rojo abajo |
| Rondas / matches | [`MatchesScreen.jsx`](src/components/MatchesScreen.jsx) | Cards `zinc-800`, torneo `amber`, primario `red-500` |
| Tabla bailarines | [`DancersScreen.jsx`](src/components/DancersScreen.jsx) | Sticky header, filtros pills, alertas `amber`/`red` |
| Shell | [`App.jsx`](src/App.jsx) | Navbar + badges modo/plan |
| Historial práctica | [`PracticeHistoryScreen.jsx`](src/components/PracticeHistoryScreen.jsx) | `max-w-md`, cards `rounded-2xl border-zinc-800`, vacío con icono `red-500/70` |
| Leaderboard | [`LeaderboardScreen.jsx`](src/components/LeaderboardScreen.jsx) | `min-h-full bg-zinc-950`, podios y badges acorde a torneo |
| Batalla | [`BattleScreen.jsx`](src/components/BattleScreen.jsx) | Timer circular `conic-gradient` naranja/rojo + `ring-red-500` en urgencia; núcleo `zinc-950` |

---

## 10. Checklist al añadir una vista nueva

1. Raíz `min-h-full bg-zinc-950 text-white` (o equivalente).
2. Contenido estrecho: `max-w-md mx-auto px-5` salvo tablas que requieran `min-w` + scroll horizontal.
3. Título + secciones con el patrón etiqueta + `h-px bg-zinc-900`.
4. Un solo color de acento por intención (primario rojo; torneo ámbar; no mezclar sin motivo).
5. CTA destructiva o irreversible: confirmación + estilos `red`/`amber` acordes a [`DancersScreen`](src/components/DancersScreen.jsx).
6. Reutilizar **lucide** existente antes de introducir nuevos pictos.

---

## 11. Documentación relacionada

- Modelo de datos y pantallas → datos: [`docs/data-model.md`](docs/data-model.md) (§0 estándar canónico `MAYÚSCULAS_SNAKE` ↔ tablas Postgres).
- RLS Supabase, audit de deps, checklist: [`docs/supabase-security.md`](docs/supabase-security.md).

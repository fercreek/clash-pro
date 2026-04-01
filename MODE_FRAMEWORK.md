# ClashPro — Mode Framework (Practice vs Tournament)

> Actualizado: 2026-04-01

## Visión: Dos modos, un mismo app

ClashPro soporta dos formas de usar la app:

### **PRACTICE MODE** (Actual, primario)
- **Uso**: Bailarines practican en clase o grupo
- **Flujo**: Setup → Matches (sin votación) → timer → siguiente batalla
- **Scoring**: NO hay. Solo rotación automática
- **Features**: Timer, pausa, música, control manual de tiempo
- **Guardado**: Torneo actual en localStorage + Supabase (para persistencia)
- **Audiencia**: Individual, grupo pequeño, instructor con alumnos

### **TOURNAMENT MODE** (Futuro, opcional)
- **Uso**: Competencia formal, evento, exhibición
- **Flujo**: Setup → Matches → Batalla → Votación → Leaderboard → Share result
- **Scoring**: SÍ. Puntos (3 pts ganador, 1 pt empate), ranking acumulado
- **Features**: Timer, música, VOTACIÓN, historial, estadísticas, compartir
- **Guardado**: Torneo en historia persistente (Supabase)
- **Audiencia**: Evento público, organizador, compartible

---

## Feature Matrix: Qué va dónde

| Feature | Practice | Tournament | Notas |
|---------|----------|-----------|-------|
| **Auth / Profiles** | ✅ | ✅ | Ambos requieren usuario |
| **Setup Screen** | ✅ | ✅ | Seleccionar competidores, round time |
| **Competitor Photos** | ✅ | ✅ | Mostrar en timer |
| **Matches List** | ✅ | ✅ | Pero estructura diferente: Practice = rotación plana, Tournament = bracket formal |
| **Timer Circle** | ✅ | ✅ | Core mechanic en ambos |
| **Bell Sound** | ✅ | ✅ | Al iniciar ronda |
| **Pause/Resume** | ✅ | ✅ | Control manual |
| **+10s / Reiniciar / Terminar ronda** | ✅ | ✅ | Controles flexibles |
| **Music Queue** | ✅ | ✅ | Seleccionar canción por batalla |
| **Voting Screen** | ❌ | ✅ | Solo Tournament: "¿Quién ganó?" |
| **Points / Scoring** | ❌ | ✅ | Solo Tournament: acumular puntos |
| **Leaderboard** | ❌ | ✅ | Solo Tournament: ranking, estadísticas |
| **Confetti** | ❌ | ✅ | Solo Tournament: celebración al terminar |
| **Match History** | ❌ | ✅ | Solo Tournament: guardar torneos pasados |
| **Statistics (W-L-D, streaks)** | ❌ | ✅ | Solo Tournament: análisis detallado |
| **Share Result (Image/WhatsApp)** | ❌ | ✅ | Solo Tournament: compartir podio |
| **Quick Close Battle** | ✅ | ✅ | Pero: Practice = solo retorna al setup, Tournament = registra resultado |
| **New Session** | ✅ | ✅ | Pero: Practice = reinicia matches sin guardar, Tournament = guarda en historial |
| **Reset Button** | ✅ | ✅ | Pero: Practice = limpia todo local, Tournament = archiva y crea nuevo |
| **Offline Support** | ✅ | ⚠️ | Practice funciona offline; Tournament necesita sync |
| **Landing Page** | ✅ | ✅ | Mismo para ambos |

---

## Arquitectura de componentes por modo

### Componentes SHARED (en ambos modos)
```
App.jsx
├── AuthScreen
├── HamburgerMenu
├── SetupScreen
├── MatchesScreen (adaptable)
├── BattleScreen (adaptable)
└── SpotifyPlayer
```

### Componentes PRACTICE-ONLY
- Nada (todo se integra adaptando la lógica)

### Componentes TOURNAMENT-ONLY (nuevas o existentes mejoradas)
```
VotingScreen.jsx → dentro BattleScreen, mostrar solo si mode='tournament'
LeaderboardScreen.jsx → existente, mostrar solo si mode='tournament'
HistoryScreen.jsx → nuevas, modo='tournament'
```

---

## Estado y feature flags por modo

### En `usePlan.js` (existente)
```javascript
export function usePlan() {
  const { profile } = useAuth()
  const plan = profile?.plan ?? 'free'
  return {
    plan, isFree, isPro,
    maxCompetitors: plan === 'free' ? 10 : 999,
    hasHistory: plan === 'pro',        // Tournament mode only
    hasStats: plan === 'pro',          // Tournament mode only
    hasShareImage: plan === 'pro',     // Tournament mode only
  }
}
```

### En `useMode.js` (NUEVO)
```javascript
// Hook que determina si estamos en Practice o Tournament mode
// Por ahora: siempre Practice (opción manual futura)
export function useMode() {
  // Opción 1: por toggle en setup screen
  // Opción 2: por feature flag (isPro → Tournament disponible)
  // Opción 3: por URL param (?mode=tournament)

  return {
    mode: 'practice', // o 'tournament'
    isPractice: true,
    isTournament: false,
  }
}
```

---

## Flujo de pantallas por modo

### PRACTICE MODE
```
AuthScreen
    ↓
SetupScreen (Setup: número competidores, round time)
    ↓
MatchesScreen (lista rotativa, sin bracket formal)
    ↓ click en batalla
BattleScreen (timer, música, SIN votación, vuelve a MatchesScreen automático o manual)
    ↓
Reset → vuelve a SetupScreen
```

### TOURNAMENT MODE
```
AuthScreen
    ↓
SetupScreen (Setup: bracket formal)
    ↓
MatchesScreen (bracket visual, match actual vs bye)
    ↓ click en batalla
BattleScreen (timer, música, + Voting screen al final)
    ↓ vota
MatchesScreen actualizado con resultado
    ↓
LeaderboardScreen (ranking, estadísticas, share)
    ↓
Reset → archiva en historial, vuelve a SetupScreen
    ↓ (Opción) Ver Historial → HistoryScreen
```

---

## Componentes a adaptar por modo

### `BattleScreen.jsx`
```javascript
// Adaptación por modo
if (mode === 'practice') {
  // Ocultar voting screen al final de la fase
  // Auto-avanzar a siguiente batalla
  // No registrar resultado en puntos
} else if (mode === 'tournament') {
  // Mostrar voting screen al terminar fase 2
  // Esperar resultado antes de siguiente
  // Registrar puntos en `battles.result`
}
```

### `MatchesScreen.jsx`
```javascript
// Adaptación por modo
if (mode === 'practice') {
  // Mostrar rotación plana de competidores
  // Botón "Quick Close" no requiere votación
  // Leaderboard botón puede estar oculto o mostrar stats locales
} else if (mode === 'tournament') {
  // Mostrar bracket formal (Round Robin)
  // Indicadores visuales: ✓ completado, ⚬ pendiente
  // Botón "Leaderboard" prominente
}
```

### `LeaderboardScreen.jsx`
```javascript
// Solo aparece en Tournament mode
// Muestra:
// - Ranking con puntos
// - Estadísticas (W-L-D, streaks)
// - Confetti si hay resultado
// - Botones: "Compartir imagen", "Volver", "Nueva sesión"
```

---

## Feature flags en el código

### Nivel 1: `usePlan()` (existente)
- Controla Free vs Pro (acceso a características premium)

### Nivel 2: `useMode()` (nuevo)
- Controla Practice vs Tournament (flujo de la app)

### Ejemplo combinado
```javascript
const { isPro } = usePlan()
const { isTournament } = useMode()

// Feature solo en Pro + Tournament
if (isPro && isTournament) {
  return <ShareResultButton />
}

// Feature solo en Practice
if (!isTournament) {
  return <NextBattleAutoadvance />
}
```

---

## Implementación: Orden de prioridad

### FASE 1: Consolidar PRACTICE MODE (lo actual)
**Meta**: Asegurar que el flujo sin votación funciona perfecto

1. ✅ Auth + Setup + Matches + Battle (ya funciona)
2. ✅ Timer + Bell + Pausa (ya funciona)
3. ✅ Música + Queue (ya funciona)
4. 🔄 **TASK 1**: Perfiles de competidores
5. 🔄 **TASK 2**: Offline mode
6. 🔄 **TASK 3-QW3/QW5**: Número de batalla + Nueva sesión (Practice solo)
7. Omitir QW1, QW2, QW6 (son Tournament-only)

### FASE 2: Agregar TOURNAMENT MODE (futuro)
**Meta**: Habilitar votación, puntos, historial, compartir

8. 🔄 **TASK 3-QW1/QW2**: Confetti + Estadísticas (Tournament solo)
9. 🔄 **TASK 4**: Historial de torneos
10. 🔄 **TASK 5**: Compartir resultado como imagen
11. 🔄 **TASK 3-QW6**: Compartir por WhatsApp

### FASE 3: Integración dual (ambos modos)
12. UI selector de modo (Setup screen)
13. Validación: feature flags correctas por combinación de plan + mode
14. A/B testing con usuarios reales

---

## Cambios a `CURSOR_PLAN.md`

### Reorganizar secciones

**ANTES**: 5 tareas en orden técnico (profiles, offline, quick wins, history, share)

**DESPUÉS**: 3 fases
1. **FASE 1 (PRACTICE - Ahora)**
   - Task 1A: Perfiles + fotos
   - Task 2A: Offline mode
   - Task 3A: Quick wins (solo Practice: QW3 número batalla, QW5 nueva sesión)

2. **FASE 2 (TOURNAMENT - Futuro)**
   - Task 3B: Quick wins (Tournament: QW1 confetti, QW2 estadísticas, QW6 WhatsApp)
   - Task 4: Historial
   - Task 5: Share image

3. **FASE 3 (INTEGRACIÓN)**
   - Selector de modo en UI
   - Validación de feature flags

---

## Decisiones de implementación

### ¿Dónde guardar la preferencia de modo?
- **Opción A**: localStorage (por sesión del usuario)
- **Opción B**: Supabase profile.mode (persistente)
- **Recomendación**: localStorage por ahora, futuro: profile.mode para recordar preferencia

### ¿Cómo transitionar?
- **Ahora (v1)**: Solo Practice mode, código limpio y robusto
- **v1.1**: Agregar botón toggle "Practice ↔ Tournament" en SetupScreen (silenciosamente oculto)
- **v2.0**: Tournament visible si isPro=true

### ¿Qué pasa con usuarios Free?
- Practice mode: acceso completo (10 competidores)
- Tournament mode: bloqueado, ver CTA "Upgrade a Pro"

---

## Validación

Checklist antes de declarar cada fase lista:

### FASE 1 ✓
- [ ] Perfiles de competidores creados y editables
- [ ] Fotos persisten en Supabase Storage
- [ ] App funciona offline (lista, batalla, timer)
- [ ] Banner "Sin conexión" visible cuando no hay red
- [ ] Número de batalla muestra correctamente
- [ ] Nueva sesión reinicia matches sin limpiar competidores
- [ ] Free tier: límite de 10 competidores bloqueado
- [ ] Sin votación, sin leaderboard, sin puntos ✓

### FASE 2 ✓
- [ ] Votación al terminar ronda 2
- [ ] Puntos se calculan correctamente (3-1-1)
- [ ] Leaderboard aparece solo después de ≥1 batalla
- [ ] Confetti celebra al terminar torneo
- [ ] Historial guarda torneos completados
- [ ] Imagen de resultado genera correctamente (1080x1920)
- [ ] Compartir por WhatsApp abre sin errores
- [ ] Estadísticas (W-L-D) calculan correctamente

### FASE 3 ✓
- [ ] Toggle Practice ↔ Tournament en SetupScreen
- [ ] Feature flags funcionan en todas las combinaciones
- [ ] Free users no ven Tournament mode
- [ ] Pro users pueden alternar
- [ ] Datos de Practice no se mezclan con Tournament

---

## Próximos pasos

1. **Hoy**: Actualizar CURSOR_PLAN.md con esta estructura de fases
2. **Sesión siguiente**: Ejecutar FASE 1 con Cursor (Tasks 1 + 2 + 3A)
3. **Validar**: Pedir feedback de usuarios reales en modo Practice
4. **Luego**: Ejecutar FASE 2 si la demanda existe

**Recordar**: Los usuarios YA ESTÁN usando la app en Practice mode. No romper eso.

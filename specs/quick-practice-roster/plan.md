# plan.md — `quick-practice-roster`

## Current State

Archivos existentes relevantes:

- `src/components/SetupScreen.jsx:14-41` — input uno por uno, sin roster
- `src/utils/roundRobin.js:1-37` — `generateRoundRobin(names)` con BYE (NO tocar — torneo lo usa)
- `src/App.jsx:298-304` — `handleNewSession()` regenera con mismos competitors (reutilizable para iteración)
- `src/hooks/useTournamentState.js` — patrón persistencia snapshot Supabase
- `src/hooks/useAuth.js` — provee `user.id` para RLS
- `supabase/migrations/20260331000001_initial_schema.sql` — tabla `competitors` global
- `supabase/migrations/20260401190000_user_tournament_archives.sql` — patrón archivo user-scoped
- `supabase/TEMPLATE.sql` — patrón idempotente obligatorio
- `src/lib/featurePolicy.js` + `src/hooks/useMode.js` — distingue practice vs tournament

## Architecture Decisions

1. **Reusar `competitors`**: tabla global ya existe y está seeded. Agregar 2 columnas vs duplicar concepto con `dancers`.
2. **Nueva `practice_sessions`**: forma distinta a `user_tournament_archives` (iteraciones en vez de resultados). Merece tabla propia.
3. **Separar de `roundRobin.js`**: crear `src/utils/practiceRounds.js` para la lógica "repeat-no-consecutive". No tocar torneo.
4. **Impar → repeat con espacio**:
   - Elegir bailarín con menor `appearances` acumuladas en la iteración.
   - Garantía: no puede aparecer en dos rondas consecutivas.
   - Si `len(names) ≤ 3`: fallback a BYE clásico (imposible no-consecutivo).
5. **Ordenamiento roster**: `ORDER BY frequency_count DESC, last_danced_at DESC NULLS LAST LIMIT 24`.
6. **Bump atómico**: al "Terminar práctica", incrementar `frequency_count` y set `last_danced_at` en un batch update. Si falla, log warn (no romper guardado de `practice_session`).

## File Tree

```
src/
  components/
    SetupScreen.jsx              ← refactor: en modo practice, usar Roster+Bulk; modo tournament intacto
    RosterPicker.jsx             ← nuevo: chips con badge frecuencia, toggle
    BulkNameInput.jsx            ← nuevo: textarea con preview parse + "Agregar N"
    PracticeHistoryScreen.jsx    ← nueva pantalla historial
  utils/
    practiceRounds.js            ← nuevo: generatePracticeRounds(names, seed?) → {rounds, stats}
    nameParser.js                ← nuevo: parseNames(str) → string[]
  hooks/
    usePracticeSession.js        ← nuevo: {save, list, get}
    useRoster.js                 ← nuevo: {roster, loading, addDancer, bumpFrequency}
supabase/migrations/
  NNNN_roster_frequency_columns.sql
  NNNN_practice_sessions.sql
specs/quick-practice-roster/
  spec.md | plan.md | tasks.md | FUTURE_DECISION.md
tests/
  practice-roster.spec.js
```

## Dependencies

Ninguna nueva. Usa stack existente: React 18, `@supabase/supabase-js`, Tailwind, `lucide-react`.

## Risks

- **`frequency_count` nunca decrementa**: vive sumando. Si un bailarín se fue, su número sigue alto. Mitigación: endpoint "reset" manual (fuera de scope inicial).
- **Impar con ≤3 personas**: imposible no-consecutivo. Fallback BYE documentado y probado.
- **Backfill**: `frequency_count DEFAULT 0`. No backfill desde archivo de torneos (práctica ≠ torneo).
- **Concurrent bump**: si el mismo user abre dos pestañas y termina dos sesiones simultáneas → posible race. Aceptable para un solo user; revisar pre-prod.

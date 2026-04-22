# FUTURE_DECISION.md — Alcance de métricas: global vs per-user

## Qué resolver

¿Las métricas del roster (`competitors.frequency_count`, top pareos, `last_danced_at`) son **per-user** o **globales cross-user**?

## Estado actual (MVP Fer solo)

- `practice_sessions.user_id` aísla historial por user (RLS `auth.uid() = user_id`).
- `competitors.frequency_count` es columna global de la tabla global `competitors`. Cualquier user autenticado puede incrementar.
- De facto per-user porque solo Fer usa el app.

## Opciones pre-prod

### A) Per-user (aislado)

- Nueva tabla `user_dancer_stats(user_id uuid, competitor_id uuid, count int, last_danced_at timestamptz, primary key(user_id, competitor_id))`.
- `competitors.frequency_count` se elimina o se deja como cache global opcional.
- Pro: cada peña ve su propio ranking. No contaminación.
- Contra: migración; un bailarín popular en otra peña no te aparece.

### B) Global (compartido)

- Mantener como está. `frequency_count` suma todos los users.
- Pro: cero cambio; "popularidad" global emergente.
- Contra: si dos peñas no se conocen, mezclar frecuencias no tiene sentido.

### C) Mixto

- `competitors.frequency_count` → global (popularidad visible en roster).
- `user_dancer_stats` → per-user (mi historial con Juan).
- Pro: mejor UX, flex.
- Contra: dos fuentes de verdad, más complejidad de queries.

## Disparador para decidir

Antes de abrir registro abierto / lanzamiento oficial fuera del círculo de Fer.

## Criterio sugerido

- **A** si varios users tienen peñas distintas y no se cruzan.
- **B** si es una comunidad única (una sola peña central).
- **C** si queremos ambas señales (popularidad global + historial personal).

## Acciones al decidir

1. Escribir migración de transición.
2. Backfill `user_dancer_stats` desde `practice_sessions.stats.appearances` si vamos a A o C.
3. Revisar queries en `useRoster.js` para usar la fuente correcta.
4. Borrar este archivo o marcar como "RESOLVED: opción X" en la raíz del archivo.

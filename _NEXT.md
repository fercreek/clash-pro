# NEXT — ClashPro
> Update: 2026-04-29

## ⚡ En proceso (retomar aquí)
- [ ] Probar flujo completo en móvil: asignar niveles en DancersScreen → setup práctica → generar rondas → verificar emparejamiento B-B / A-A preferido
- [ ] Verificar que `frequency_count` sube por rondas reales (no plano +1) al finalizar práctica

## 💡 Ideas / backlog
- [ ] DancersScreen: importar lista desde texto (pegar nombres separados por coma/newline)
- [ ] Práctica: mostrar indicador visual de nivel en el roster selector durante el setup (ya hay dot, evaluar si suficiente)
- [ ] Opción de editar tiempo de ronda desde dentro de práctica live (sin volver a setup)
- [ ] Estadísticas de sesión más detalladas: pares que nunca se encontraron
- [ ] Notificación o badge cuando un par ya se repitió 2+ veces en la sesión

## ✅ Entregado esta sesión (2026-04-29)
- Columna `level` en `competitors` (migración aplicada)
- `DancersScreen`: CRUD mobile-first, nivel por bailarín, activar/desactivar
- Navegación `/dancers` + entrada en hamburger menu
- Algoritmo práctica: `pairingCost` + 2-opt `optimizeRoundPairings` por nivel
- `bumpFrequency` con conteos reales por bailarín (no +1 plano)
- Dots de nivel en RosterPicker; badges B/I/A en MatchCard práctica
- Persistencia de participantes entre sesiones (resume de práctica)
- Rotación estricta de repeaters (fairness impar)
- Descarte de rondas sin contar stats + modal confirmación
- Balance helper en PracticeRosterEditModal
- README actualizado

## 🔒 Bloqueado
- Deploy a producción: requiere ok explícito de Fernando antes de `npm run deploy`

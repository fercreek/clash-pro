import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const DEBOUNCE_MS = 1500

/**
 * Persiste el estado del torneo en Supabase (debounced).
 * Carga el estado guardado del usuario al iniciar sesión.
 */
export function useTournamentPersistence({ user, state, onLoaded }) {
  const saveTimer = useRef(null)
  const loadedRef = useRef(false)

  // ── Cargar estado del usuario desde Supabase ───────────────────────────────
  useEffect(() => {
    if (!user || loadedRef.current) return
    loadedRef.current = true

    supabase
      .from('user_tournament_state')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) { console.error('Error cargando torneo:', error); return }
        if (data) {
          onLoaded({
            competitors: data.competitors ?? [],
            matches:     data.matches ?? [],
            roundTime:   data.round_time ?? 40,
            screen:      data.screen ?? 'setup',
            activeMatchId: data.active_match_id ?? null,
          })
        }
      })
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Guardar estado con debounce ────────────────────────────────────────────
  const save = useCallback(
    (nextState) => {
      if (!user) return
      clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(async () => {
        const row = {
          user_id:         user.id,
          competitors:     nextState.competitors,
          matches:         nextState.matches,
          round_time:      nextState.roundTime,
          screen:          nextState.screen,
          active_match_id: nextState.activeMatchId ?? null,
        }
        await supabase
          .from('user_tournament_state')
          .upsert(row, { onConflict: 'user_id' })
      }, DEBOUNCE_MS)
    },
    [user]
  )

  // ── Limpiar torneo del usuario (reset) ─────────────────────────────────────
  const clearRemote = useCallback(async () => {
    if (!user) return
    await supabase
      .from('user_tournament_state')
      .delete()
      .eq('user_id', user.id)
  }, [user])

  return { save, clearRemote }
}

import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { COMPETITION_MODE } from '../lib/featurePolicy'

const DEBOUNCE_MS = 1500

function normalizeLoadedMode(raw, isFree) {
  let m = raw === COMPETITION_MODE.practice || raw === COMPETITION_MODE.tournament ? raw : COMPETITION_MODE.tournament
  if (isFree && m === COMPETITION_MODE.tournament) m = COMPETITION_MODE.practice
  return m
}

export function useTournamentPersistence({ user, isFree, onLoaded }) {
  const saveTimer = useRef(null)
  const loadedRef = useRef(false)
  const isFreeRef = useRef(isFree)
  isFreeRef.current = isFree

  useEffect(() => {
    if (!user || loadedRef.current) return
    loadedRef.current = true

    supabase
      .from('user_tournament_state')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) { return }
        if (data) {
          onLoaded({
            competitors: data.competitors ?? [],
            matches: data.matches ?? [],
            roundTime: data.round_time ?? 40,
            screen: data.screen ?? 'setup',
            activeMatchId: data.active_match_id ?? null,
            competitionMode: normalizeLoadedMode(data.competition_mode, isFreeRef.current),
          })
        }
      })
  }, [user, onLoaded])

  const save = useCallback(
    (nextState) => {
      if (!user) return
      clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(async () => {
        const free = isFreeRef.current
        const mode = free
          ? COMPETITION_MODE.practice
          : (nextState.competitionMode ?? COMPETITION_MODE.tournament)
        const row = {
          user_id: user.id,
          competitors: nextState.competitors,
          matches: nextState.matches,
          round_time: nextState.roundTime,
          screen: nextState.screen,
          active_match_id: nextState.activeMatchId ?? null,
          competition_mode: mode,
        }
        await supabase.from('user_tournament_state').upsert(row, { onConflict: 'user_id' })
      }, DEBOUNCE_MS)
    },
    [user]
  )

  const clearRemote = useCallback(async () => {
    if (!user) return
    await supabase.from('user_tournament_state').delete().eq('user_id', user.id)
  }, [user])

  return { save, clearRemote }
}

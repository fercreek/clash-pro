import { useCallback } from 'react'
import { supabase } from '../lib/supabase'

/**
 * CRUD de sesiones de práctica (tabla `practice_sessions`, RLS por user_id).
 */
export function usePracticeSession() {
  const save = useCallback(async (payload) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No auth user')
    const { data, error } = await supabase
      .from('practice_sessions')
      .insert({
        user_id: user.id,
        started_at: payload.started_at ?? null,
        ended_at: payload.ended_at ?? new Date().toISOString(),
        competitors: payload.competitors ?? [],
        iterations: payload.iterations ?? [],
        stats: payload.stats ?? {},
      })
      .select()
      .single()
    if (error) throw error
    return data
  }, [])

  const list = useCallback(async () => {
    const { data, error } = await supabase
      .from('practice_sessions')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  }, [])

  const get = useCallback(async (id) => {
    const { data, error } = await supabase
      .from('practice_sessions')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  }, [])

  return { save, list, get }
}

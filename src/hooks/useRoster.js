import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const ROSTER_LIMIT = 24

/**
 * Roster global de bailarines (tabla `competitors`).
 * Ordenado por frecuencia desc, last_danced_at desc.
 */
export function useRoster() {
  const [roster, setRoster] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchRoster = useCallback(async () => {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('competitors')
      .select('id, name, photo_url, frequency_count, last_danced_at, user_id')
      .order('frequency_count', { ascending: false })
      .order('last_danced_at', { ascending: false, nullsFirst: false })
      .limit(ROSTER_LIMIT)
    if (err) setError(err)
    else setRoster(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchRoster() }, [fetchRoster])

  const addDancer = useCallback(async (name) => {
    const trimmed = name.trim()
    if (!trimmed) return null
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error: err } = await supabase
      .from('competitors')
      .insert({ name: trimmed, user_id: user?.id ?? null })
      .select()
      .single()
    if (err) { setError(err); return null }
    setRoster((prev) => {
      const exists = prev.find((c) => c.name.toLowerCase() === trimmed.toLowerCase())
      if (exists) return prev
      return [...prev, data]
    })
    return data
  }, [])

  const bumpFrequency = useCallback(async (names) => {
    if (!Array.isArray(names) || names.length === 0) return
    const { data: rows } = await supabase
      .from('competitors')
      .select('id, name, frequency_count')
      .in('name', names)

    const existingByLower = new Map((rows ?? []).map((r) => [r.name.toLowerCase(), r]))
    const now = new Date().toISOString()

    await Promise.all(
      names.map(async (name) => {
        const row = existingByLower.get(name.toLowerCase())
        if (row) {
          await supabase
            .from('competitors')
            .update({
              frequency_count: (row.frequency_count ?? 0) + 1,
              last_danced_at: now,
            })
            .eq('id', row.id)
        } else {
          const { data: { user } } = await supabase.auth.getUser()
          await supabase
            .from('competitors')
            .insert({
              name,
              user_id: user?.id ?? null,
              frequency_count: 1,
              last_danced_at: now,
            })
        }
      })
    )
    await fetchRoster()
  }, [fetchRoster])

  return { roster, loading, error, addDancer, bumpFrequency, refresh: fetchRoster }
}

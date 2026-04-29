import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const ROSTER_LIMIT = 64

export function useRoster() {
  const [roster, setRoster] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchRoster = useCallback(async () => {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('competitors')
      .select('id, name, photo_url, frequency_count, repeat_count, last_danced_at, user_id, level, is_active')
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

  const updateDancer = useCallback(async (id, patch) => {
    const allowed = {}
    if (patch.name != null) allowed.name = String(patch.name).trim()
    if (patch.level !== undefined) allowed.level = patch.level  // null = clear level
    if (patch.is_active !== undefined) allowed.is_active = patch.is_active
    if (Object.keys(allowed).length === 0) return null
    const { data, error: err } = await supabase
      .from('competitors')
      .update(allowed)
      .eq('id', id)
      .select()
      .single()
    if (err) { setError(err); return null }
    setRoster((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)))
    return data
  }, [])

  // Accepts { [name]: count } map — increments frequency_count by the per-dancer count.
  // This makes frequency_count = total rounds danced across all sessions.
  const bumpFrequency = useCallback(async (countMap) => {
    const entries = typeof countMap === 'object' && !Array.isArray(countMap)
      ? Object.entries(countMap)
      : (Array.isArray(countMap) ? countMap.map((n) => [n, 1]) : [])
    if (entries.length === 0) return

    const names = entries.map(([n]) => n)
    const { data: rows } = await supabase
      .from('competitors')
      .select('id, name, frequency_count')
      .in('name', names)

    const existingByLower = new Map((rows ?? []).map((r) => [r.name.toLowerCase(), r]))
    const now = new Date().toISOString()

    await Promise.all(
      entries.map(async ([name, count]) => {
        const delta = Math.max(1, Number(count) || 1)
        const row = existingByLower.get(name.toLowerCase())
        if (row) {
          await supabase
            .from('competitors')
            .update({
              frequency_count: (row.frequency_count ?? 0) + delta,
              last_danced_at: now,
            })
            .eq('id', row.id)
        } else {
          const { data: { user } } = await supabase.auth.getUser()
          await supabase
            .from('competitors')
            .insert({ name, user_id: user?.id ?? null, frequency_count: delta, last_danced_at: now })
        }
      })
    )
    await fetchRoster()
  }, [fetchRoster])

  const bumpRepeatCount = useCallback(async (names) => {
    if (!Array.isArray(names) || names.length === 0) return
    const { data: rows } = await supabase
      .from('competitors')
      .select('id, name, repeat_count')
      .in('name', names)

    const existingByLower = new Map((rows ?? []).map((r) => [r.name.toLowerCase(), r]))

    await Promise.all(
      names.map(async (name) => {
        const row = existingByLower.get(name.toLowerCase())
        if (row) {
          await supabase
            .from('competitors')
            .update({ repeat_count: (row.repeat_count ?? 0) + 1 })
            .eq('id', row.id)
        }
      })
    )
    await fetchRoster()
  }, [fetchRoster])

  return { roster, loading, error, addDancer, updateDancer, bumpFrequency, bumpRepeatCount, refresh: fetchRoster }
}

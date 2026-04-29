import { useCallback, useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { pickCanonicalRow, normalizeDancerNameKey } from '../lib/rosterCanonical'

const ROSTER_LIMIT = 64
const MERGE_FETCH_LIMIT = 500
const COLS_FULL = 'id, name, photo_url, frequency_count, repeat_count, last_danced_at, user_id, level, is_active, deleted_at'
const COLS_NO_DELETED = 'id, name, photo_url, frequency_count, repeat_count, last_danced_at, user_id, level, is_active'

function scopeByUser(q, userId) {
  return q.eq('user_id', userId)
}

export function useRoster() {
  const [roster, setRoster] = useState([])
  const rosterRef = useRef([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    rosterRef.current = roster
  }, [roster])

  const fetchRoster = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) {
      setRoster([])
      setLoading(false)
      return
    }
    let res = await scopeByUser(
      supabase.from('competitors').select(COLS_FULL),
      user.id,
    )
      .order('frequency_count', { ascending: false })
      .order('last_danced_at', { ascending: false, nullsFirst: false })
      .limit(ROSTER_LIMIT)
    const missingDeleted =
      res.error && /deleted_at/i.test(String(res.error.message || ''))
    if (missingDeleted) {
      res = await scopeByUser(
        supabase.from('competitors').select(COLS_NO_DELETED),
        user.id,
      )
        .order('frequency_count', { ascending: false })
        .order('last_danced_at', { ascending: false, nullsFirst: false })
        .limit(ROSTER_LIMIT)
    }
    if (res.error) {
      setError(res.error)
      setRoster([])
    } else {
      setRoster(res.data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchRoster()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchRoster()
    })
    return () => subscription.unsubscribe()
  }, [fetchRoster])

  const addDancer = useCallback(async (name) => {
    const trimmed = name.trim()
    if (!trimmed) return null
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) return null
    let probe = await scopeByUser(
      supabase.from('competitors').select(COLS_FULL),
      user.id,
    ).limit(MERGE_FETCH_LIMIT)
    if (probe.error && /deleted_at/i.test(String(probe.error.message || ''))) {
      probe = await scopeByUser(
        supabase.from('competitors').select(COLS_NO_DELETED),
        user.id,
      ).limit(MERGE_FETCH_LIMIT)
    }
    if (!probe.error) {
      const want = normalizeDancerNameKey(trimmed)
      const hit = (probe.data ?? []).find((r) => normalizeDancerNameKey(r.name) === want)
      if (hit) {
        setError(null)
        setRoster((prev) => (prev.some((p) => p.id === hit.id) ? prev : [...prev, hit]))
        return hit
      }
    }
    const { data, error: err } = await supabase
      .from('competitors')
      .insert({ name: trimmed, user_id: user.id })
      .select()
      .single()
    if (err) { setError(err); return null }
    setRoster((prev) => {
      const want = normalizeDancerNameKey(trimmed)
      const exists = prev.find((c) => normalizeDancerNameKey(c.name) === want)
      if (exists) return prev
      return [...prev, data]
    })
    return data
  }, [])

  const updateDancer = useCallback(async (id, patch) => {
    const allowed = {}
    if (patch.name != null) allowed.name = String(patch.name).trim()
    if (patch.level !== undefined) allowed.level = patch.level
    if (patch.is_active !== undefined) allowed.is_active = patch.is_active
    if (patch.deleted_at !== undefined) allowed.deleted_at = patch.deleted_at
    if (Object.keys(allowed).length === 0) return null
    if (allowed.name != null) {
      const nk = normalizeDancerNameKey(allowed.name)
      if (nk) {
        const clash = rosterRef.current.some(
          (r) => r.id !== id && !r.deleted_at && normalizeDancerNameKey(r.name) === nk,
        )
        if (clash) {
          setError({ message: 'Ya hay otra fila activa con ese nombre. Usa otro nombre, archiva la otra o bórrala.' })
          return null
        }
      }
    }
    setError(null)
    const { data, error: err } = await supabase
      .from('competitors')
      .update(allowed)
      .eq('id', id)
      .select(COLS_FULL)
    if (err) {
      setError(err)
      return null
    }
    const row = Array.isArray(data) ? data[0] : data
    if (!row) {
      setError({ message: 'No se pudo guardar el cambio.' })
      return null
    }
    const merged = { ...rosterRef.current.find((r) => r.id === id), ...row, ...allowed }
    setRoster((prev) => prev.map((r) => (r.id === id ? merged : r)))
    return merged
  }, [])

  const updateVisibilityByNameKey = useCallback(async (displayName, isActive) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) return null
    const key = normalizeDancerNameKey(displayName)
    if (!key) return null
    const ids = rosterRef.current
      .filter((r) => !r.deleted_at && normalizeDancerNameKey(r.name) === key)
      .map((r) => r.id)
    if (ids.length === 0) return null
    setError(null)
    if (ids.length === 1) {
      return updateDancer(ids[0], { is_active: isActive })
    }
    const { data, error: err } = await supabase
      .from('competitors')
      .update({ is_active: isActive })
      .in('id', ids)
      .select(COLS_FULL)
    if (err) {
      setError(err)
      return null
    }
    const byId = new Map((data ?? []).map((row) => [row.id, row]))
    setRoster((prev) =>
      prev.map((r) => {
        if (!ids.includes(r.id)) return r
        const row = byId.get(r.id)
        return row ? { ...r, ...row } : { ...r, is_active: isActive }
      }),
    )
    return data
  }, [updateDancer])

  const bumpFrequency = useCallback(async (countMap) => {
    const entries = typeof countMap === 'object' && !Array.isArray(countMap)
      ? Object.entries(countMap)
      : (Array.isArray(countMap) ? countMap.map((n) => [n, 1]) : [])
    if (entries.length === 0) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) return

    const names = entries.map(([n]) => n)
    const { data: rows } = await scopeByUser(
      supabase.from('competitors').select('id, name, frequency_count'),
      user.id,
    ).in('name', names)

    const existingByLower = new Map()
    for (const r of rows ?? []) {
      const k = normalizeDancerNameKey(r.name)
      const cur = existingByLower.get(k)
      existingByLower.set(k, cur ? pickCanonicalRow(cur, r, user.id) : r)
    }
    const now = new Date().toISOString()

    await Promise.all(
      entries.map(async ([name, count]) => {
        const delta = Math.max(1, Number(count) || 1)
        const row = existingByLower.get(normalizeDancerNameKey(name))
        if (row) {
          await supabase
            .from('competitors')
            .update({
              frequency_count: (row.frequency_count ?? 0) + delta,
              last_danced_at: now,
            })
            .eq('id', row.id)
        } else {
          await supabase
            .from('competitors')
            .insert({ name, user_id: user.id, frequency_count: delta, last_danced_at: now })
        }
      })
    )
    await fetchRoster()
  }, [fetchRoster])

  const bumpRepeatCount = useCallback(async (names) => {
    if (!Array.isArray(names) || names.length === 0) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) return

    const { data: rows } = await scopeByUser(
      supabase.from('competitors').select('id, name, repeat_count'),
      user.id,
    ).in('name', names)

    const existingByLower = new Map()
    for (const r of rows ?? []) {
      const k = normalizeDancerNameKey(r.name)
      const cur = existingByLower.get(k)
      existingByLower.set(k, cur ? pickCanonicalRow(cur, r, user.id) : r)
    }

    await Promise.all(
      names.map(async (name) => {
        const row = existingByLower.get(normalizeDancerNameKey(name))
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

  const deleteDancerPermanent = useCallback(async (id) => {
    const { error: err } = await supabase.from('competitors').delete().eq('id', id)
    if (err) {
      setError(err)
      return false
    }
    setRoster((prev) => prev.filter((r) => r.id !== id))
    setError(null)
    return true
  }, [])

  return {
    roster,
    loading,
    error,
    addDancer,
    updateDancer,
    updateVisibilityByNameKey,
    bumpFrequency,
    bumpRepeatCount,
    deleteDancerPermanent,
    refresh: fetchRoster,
  }
}

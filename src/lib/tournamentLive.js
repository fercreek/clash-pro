import { supabase } from './supabase'

export function randomPublicId() {
  const a = new Uint8Array(16)
  crypto.getRandomValues(a)
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('')
}

const STORAGE_KEY = 'clashpro:livePublicId'

export function getStoredLivePublicId() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) || null
  } catch {
    return null
  }
}

export function setStoredLivePublicId(id) {
  try {
    if (id) sessionStorage.setItem(STORAGE_KEY, id)
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {}
}

export function buildLiveUrl(publicId) {
  if (typeof window === 'undefined' || !publicId) return ''
  return `${window.location.origin}/live/${publicId}`
}

export async function upsertTournamentPublicSnapshot({ userId, publicId, payload }) {
  if (!userId || !publicId) return
  const { error } = await supabase.from('tournament_public_snapshots').upsert(
    { user_id: userId, public_id: publicId, payload },
    { onConflict: 'user_id' }
  )
  if (error) console.error('upsertTournamentPublicSnapshot', error)
}

export async function fetchTournamentPublicSnapshot(publicId) {
  if (!publicId) return null
  const { data, error } = await supabase
    .from('tournament_public_snapshots')
    .select('payload, updated_at')
    .eq('public_id', publicId)
    .maybeSingle()
  if (error) {
    console.error('fetchTournamentPublicSnapshot', error)
    return null
  }
  return data
}

export function subscribeTournamentPublicSnapshot(publicId, onPayload) {
  if (!publicId) return () => {}
  const channel = supabase
    .channel(`public:live:${publicId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tournament_public_snapshots',
        filter: `public_id=eq.${publicId}`,
      },
      (p) => {
        const pl = p.new?.payload
        if (pl != null) onPayload(pl)
      }
    )
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}

// ── Spotify Web API calls ─────────────────────────────────────────────────────
import { getStoredToken, refreshAccessToken } from './spotifyAuth'

async function getToken() {
  let token = getStoredToken()
  if (!token) token = await refreshAccessToken()
  return token
}

async function apiFetch(path, options = {}) {
  const token = await getToken()
  if (!token) throw new Error('Not authenticated with Spotify')

  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  if (res.status === 204) return null
  if (!res.ok) throw new Error(`Spotify API error: ${res.status}`)
  return res.json()
}

// ── User ──────────────────────────────────────────────────────────────────────
export function getMe() {
  return apiFetch('/me')
}

// ── Playlists ─────────────────────────────────────────────────────────────────
export async function getMyPlaylists(limit = 50) {
  const data = await apiFetch(`/me/playlists?limit=${limit}`)
  return data?.items ?? []
}

export async function getPlaylistTracks(playlistId, limit = 50) {
  const data = await apiFetch(
    `/playlists/${playlistId}/tracks?limit=${limit}&fields=items(track(id,name,duration_ms,uri,artists,album(images)))`
  )
  return (data?.items ?? [])
    .map((i) => i.track)
    .filter(Boolean)
    .filter((t) => t.uri)
}

// ── Search ────────────────────────────────────────────────────────────────────
export async function searchTracks(query, limit = 20) {
  const params = new URLSearchParams({ q: query, type: 'track', limit })
  const data = await apiFetch(`/search?${params}`)
  return data?.tracks?.items ?? []
}

// ── Liked songs ───────────────────────────────────────────────────────────────
export async function getLikedTracks(limit = 50) {
  const data = await apiFetch(`/me/tracks?limit=${limit}`)
  return (data?.items ?? []).map((i) => i.track).filter(Boolean)
}

// ── Helpers ───────────────────────────────────────────────────────────────────
export function trackDisplayName(track) {
  if (!track) return ''
  const artists = track.artists?.map((a) => a.name).join(', ') ?? ''
  return `${track.name}${artists ? ` · ${artists}` : ''}`
}

export function msToMin(ms) {
  const s = Math.round(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

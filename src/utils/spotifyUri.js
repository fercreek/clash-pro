export function parseSpotifyTrackUri(input) {
  if (!input || typeof input !== 'string') return null
  const trimmed = input.trim()
  const asUri = trimmed.match(/^spotify:track:([a-zA-Z0-9]+)/)
  if (asUri) return `spotify:track:${asUri[1]}`
  const open = trimmed.match(
    /open\.spotify\.com\/(?:[\w-]+\/)?track\/([a-zA-Z0-9]+)/
  )
  if (open) return `spotify:track:${open[1]}`
  return null
}

const CUSTOM_TRACKS_KEY = 'clashpro:customTracks:v1'

export function loadCustomTracksMap() {
  try {
    const raw = localStorage.getItem(CUSTOM_TRACKS_KEY)
    if (!raw) return {}
    const data = JSON.parse(raw)
    if (typeof data !== 'object' || data === null || Array.isArray(data)) return {}
    return data
  } catch {
    return {}
  }
}

export function saveCustomTracksMap(map) {
  try {
    localStorage.setItem(CUSTOM_TRACKS_KEY, JSON.stringify(map))
  } catch {}
}

export function removeCustomTrack(map, playlistId, uri) {
  const next = { ...map }
  const list = [...(next[playlistId] || [])].filter((t) => t.uri !== uri)
  if (list.length === 0) {
    delete next[playlistId]
  } else {
    next[playlistId] = list
  }
  return next
}

export function addCustomTrack(map, playlistId, track) {
  const next = { ...map }
  const existing = next[playlistId] || []
  if (existing.some((t) => t.uri === track.uri)) return map
  next[playlistId] = [...existing, track]
  return next
}

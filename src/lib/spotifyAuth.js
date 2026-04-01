// ── Spotify PKCE OAuth helpers ────────────────────────────────────────────────
const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID
const REDIRECT_URI = window.location.origin  // https://clash-pro.vercel.app

const SCOPES = [
  'user-read-private',
  'user-read-email',
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-library-read',
].join(' ')

// Storage keys
const STORAGE = {
  TOKEN:    'sp_access_token',
  REFRESH:  'sp_refresh_token',
  EXPIRES:  'sp_expires_at',
  VERIFIER: 'sp_verifier',
}

// ── PKCE utils ────────────────────────────────────────────────────────────────
function randomString(len = 64) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  return Array.from(crypto.getRandomValues(new Uint8Array(len)))
    .map((b) => chars[b % chars.length])
    .join('')
}

async function sha256(plain) {
  const data = new TextEncoder().encode(plain)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// ── Auth flow ─────────────────────────────────────────────────────────────────
export async function redirectToSpotifyLogin() {
  const verifier = randomString(64)
  const challenge = await sha256(verifier)
  localStorage.setItem(STORAGE.VERIFIER, verifier)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: SCOPES,
    redirect_uri: REDIRECT_URI,
    code_challenge_method: 'S256',
    code_challenge: challenge,
  })
  window.location.href = `https://accounts.spotify.com/authorize?${params}`
}

export async function exchangeCodeForToken(code) {
  const verifier = localStorage.getItem(STORAGE.VERIFIER)
  if (!verifier) throw new Error('No verifier found')

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    code_verifier: verifier,
  })

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) throw new Error('Token exchange failed')
  const data = await res.json()
  saveTokens(data)
  localStorage.removeItem(STORAGE.VERIFIER)
  return data
}

export async function refreshAccessToken() {
  const refresh = localStorage.getItem(STORAGE.REFRESH)
  if (!refresh) return null

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refresh,
    client_id: CLIENT_ID,
  })

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) { clearTokens(); return null }
  const data = await res.json()
  saveTokens(data)
  return data.access_token
}

function saveTokens({ access_token, refresh_token, expires_in }) {
  localStorage.setItem(STORAGE.TOKEN, access_token)
  if (refresh_token) localStorage.setItem(STORAGE.REFRESH, refresh_token)
  localStorage.setItem(STORAGE.EXPIRES, Date.now() + (expires_in - 60) * 1000)
}

export function clearTokens() {
  Object.values(STORAGE).forEach((k) => localStorage.removeItem(k))
}

export function getStoredToken() {
  const token = localStorage.getItem(STORAGE.TOKEN)
  const expiresAt = Number(localStorage.getItem(STORAGE.EXPIRES) || 0)
  if (!token || Date.now() > expiresAt) return null
  return token
}

export function isConnected() {
  return !!getStoredToken() || !!localStorage.getItem(STORAGE.REFRESH)
}

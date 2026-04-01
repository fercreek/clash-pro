import { useState, useEffect, useCallback } from 'react'
import {
  isConnected,
  getStoredToken,
  refreshAccessToken,
  exchangeCodeForToken,
  redirectToSpotifyLogin,
  clearTokens,
} from '../lib/spotifyAuth'
import { getMe } from '../lib/spotifyApi'

export function useSpotifyAuth() {
  const [spUser, setSpUser] = useState(null)
  const [spLoading, setSpLoading] = useState(true)

  // Handle OAuth callback (?code=xxx in URL after Spotify redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (!code) { init(); return }

    // Clean URL immediately so it doesn't re-trigger on refresh
    window.history.replaceState({}, '', window.location.pathname)

    exchangeCodeForToken(code)
      .then(() => init())
      .catch((err) => { console.error('Spotify token exchange error', err); setSpLoading(false) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function init() {
    setSpLoading(true)
    try {
      let token = getStoredToken()
      if (!token && isConnected()) token = await refreshAccessToken()
      if (token) {
        const me = await getMe()
        setSpUser(me)
      }
    } catch (e) {
      console.error('Spotify init error', e)
    } finally {
      setSpLoading(false)
    }
  }

  const connectSpotify = useCallback(() => {
    redirectToSpotifyLogin()
  }, [])

  const disconnectSpotify = useCallback(() => {
    clearTokens()
    setSpUser(null)
  }, [])

  return { spUser, spLoading, connectSpotify, disconnectSpotify, spConnected: !!spUser }
}

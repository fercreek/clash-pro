import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import {
  ListMusic, X, Play, Plus, Trash2,
  ChevronLeft, ChevronRight, Music2, Loader2,
} from 'lucide-react'
import { PLAYLISTS } from '../utils/songs'
import {
  parseSpotifyTrackUri,
  loadCustomTracksMap,
  saveCustomTracksMap,
  addCustomTrack,
  removeCustomTrack,
} from '../utils/spotifyUri'
import { useSpotifyAuth } from '../hooks/useSpotifyAuth'
import { getMyPlaylists, getPlaylistTracks, trackDisplayName, msToMin } from '../lib/spotifyApi'

// ── Merge hardcoded + custom tracks ──────────────────────────────────────────
function mergePlaylistTracks(pl, customMap) {
  const base = pl.tracks || []
  const extra = customMap[pl.id] || []
  const seen = new Set()
  const out = []
  for (const t of base) {
    if (!t?.uri || seen.has(t.uri)) continue
    seen.add(t.uri); out.push({ ...t, _custom: false })
  }
  for (const t of extra) {
    if (!t?.uri || seen.has(t.uri)) continue
    seen.add(t.uri); out.push({ ...t, _custom: true })
  }
  return out
}

// ── SpotifyIcon ───────────────────────────────────────────────────────────────
function SpotifyIcon({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  )
}

export default function SpotifyPlayer() {
  const controllerRef = useRef(null)
  const [showPicker, setShowPicker] = useState(false)
  const [pickerTab, setPickerTab] = useState('local') // 'local' | 'spotify'
  const [activePlaylistId, setActivePlaylistId] = useState(PLAYLISTS[0].id)
  const [currentUri, setCurrentUri] = useState(null)
  const [customMap, setCustomMap] = useState(loadCustomTracksMap)

  // Add-track form (local)
  const [addName, setAddName] = useState('')
  const [addArtist, setAddArtist] = useState('')
  const [addLink, setAddLink] = useState('')
  const [addError, setAddError] = useState('')

  // Spotify API state
  const { spUser, spLoading, connectSpotify, disconnectSpotify, spConnected } = useSpotifyAuth()
  const [spPlaylists, setSpPlaylists] = useState([])
  const [spPlaylistsLoading, setSpPlaylistsLoading] = useState(false)
  const [activeSpPlaylistId, setActiveSpPlaylistId] = useState(null)
  const [spTracks, setSpTracks] = useState([])
  const [spTracksLoading, setSpTracksLoading] = useState(false)

  // ── Local playlist logic ──────────────────────────────────────────────────
  const activePlaylist = PLAYLISTS.find((p) => p.id === activePlaylistId) ?? PLAYLISTS[0]
  const mergedTracks = useMemo(
    () => mergePlaylistTracks(activePlaylist, customMap),
    [activePlaylist, activePlaylistId, customMap]
  )
  const trackIndex = useMemo(() => {
    if (!currentUri) return -1
    return mergedTracks.findIndex((t) => t.uri === currentUri)
  }, [currentUri, mergedTracks])
  const isPlaylistMode = currentUri === activePlaylist.uri

  const nowPlaying = useMemo(() => {
    if (!currentUri) return { title: activePlaylist.name, subtitle: 'Elige lista o canción' }
    if (currentUri === activePlaylist.uri) return { title: activePlaylist.name, subtitle: 'Playlist completa' }
    const t = mergedTracks.find((x) => x.uri === currentUri)
    if (t) return { title: t.name, subtitle: `${activePlaylist.name} · ${t.artist || ''}` }
    // Check Spotify tracks
    const st = spTracks.find((x) => x.uri === currentUri)
    if (st) {
      const spPl = spPlaylists.find((p) => p.id === activeSpPlaylistId)
      return { title: st.name, subtitle: `${spPl?.name ?? 'Spotify'} · ${st.artists?.[0]?.name ?? ''}` }
    }
    return { title: 'Reproduciendo…', subtitle: '' }
  }, [currentUri, activePlaylist, mergedTracks, spTracks, spPlaylists, activeSpPlaylistId])

  // ── Spotify iframe init ───────────────────────────────────────────────────
  useEffect(() => {
    window.onSpotifyIframeApiReady = (IFrameAPI) => {
      const element = document.getElementById('spotify-embed-target')
      if (!element) return
      IFrameAPI.createController(
        element,
        { uri: PLAYLISTS[0].uri, width: '100%', height: '80' },
        (controller) => { controllerRef.current = controller }
      )
    }
    if (!document.getElementById('spotify-iframe-api')) {
      const script = document.createElement('script')
      script.id = 'spotify-iframe-api'
      script.src = 'https://open.spotify.com/embed/iframe-api/v1'
      script.async = true
      document.head.appendChild(script)
    }
  }, [])

  const load = useCallback((uri) => {
    controllerRef.current?.loadUri(uri)
    controllerRef.current?.play()
    setCurrentUri(uri)
  }, [])

  // ── Load Spotify playlists when connected ─────────────────────────────────
  useEffect(() => {
    if (!spConnected) { setSpPlaylists([]); return }
    setSpPlaylistsLoading(true)
    getMyPlaylists(50)
      .then((data) => setSpPlaylists(data))
      .catch(console.error)
      .finally(() => setSpPlaylistsLoading(false))
  }, [spConnected])

  // ── Load tracks when Spotify playlist selected ────────────────────────────
  const handleSpPlaylistPick = useCallback(async (pl) => {
    setActiveSpPlaylistId(pl.id)
    setSpTracks([])
    setSpTracksLoading(true)
    try {
      const tracks = await getPlaylistTracks(pl.id, 50)
      setSpTracks(tracks)
    } catch (e) { console.error(e) }
    finally { setSpTracksLoading(false) }
  }, [])

  // ── Local playlist handlers ───────────────────────────────────────────────
  const handlePlaylistPick = useCallback((pl) => {
    setActivePlaylistId(pl.id)
    load(pl.uri)
  }, [load])

  const handlePlayThisPlaylist = useCallback(() => load(activePlaylist.uri), [activePlaylist.uri, load])

  const handlePlayTrack = useCallback((track) => load(track.uri), [load])

  const goPrev = useCallback(() => {
    if (mergedTracks.length === 0) return
    if (isPlaylistMode || trackIndex <= 0) { load(mergedTracks[mergedTracks.length - 1].uri); return }
    load(mergedTracks[trackIndex - 1].uri)
  }, [isPlaylistMode, load, mergedTracks, trackIndex])

  const goNext = useCallback(() => {
    if (mergedTracks.length === 0) return
    if (isPlaylistMode || trackIndex < 0) { load(mergedTracks[0].uri); return }
    if (trackIndex >= mergedTracks.length - 1) { load(mergedTracks[0].uri); return }
    load(mergedTracks[trackIndex + 1].uri)
  }, [isPlaylistMode, load, mergedTracks, trackIndex])

  const handleAddTrack = (e) => {
    e.preventDefault(); setAddError('')
    const uri = parseSpotifyTrackUri(addLink)
    if (!uri) { setAddError('Pega un enlace o URI de Spotify'); return }
    const name = addName.trim()
    if (!name) { setAddError('Nombre obligatorio'); return }
    const baseUris = new Set((activePlaylist.tracks || []).map((t) => t?.uri).filter(Boolean))
    if (baseUris.has(uri)) { setAddError('Ya está en la lista base'); return }
    const artist = addArtist.trim() || '—'
    const next = addCustomTrack(customMap, activePlaylistId, { name, artist, uri })
    if (next === customMap) { setAddError('Esa canción ya está en la lista'); return }
    saveCustomTracksMap(next); setCustomMap(next)
    setAddLink(''); setAddName(''); setAddArtist('')
  }

  const handleRemoveCustom = (uri) => {
    const next = removeCustomTrack(customMap, activePlaylistId, uri)
    saveCustomTracksMap(next); setCustomMap(next)
  }

  const canStep = mergedTracks.length > 0
  const activeSpPlaylist = spPlaylists.find((p) => p.id === activeSpPlaylistId)

  return (
    <div className="relative w-full bg-zinc-900 border-b border-zinc-800 shrink-0">
      {/* Iframe Spotify */}
      <div id="spotify-embed-target" />

      {/* Control bar */}
      <div className="flex items-center gap-1 px-2 h-9 border-t border-zinc-800">
        <button type="button" disabled={!canStep} onClick={goPrev}
          className="p-1.5 rounded-md hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none text-zinc-300 transition-colors shrink-0">
          <ChevronLeft size={16} />
        </button>
        <button type="button" disabled={!canStep} onClick={goNext}
          className="p-1.5 rounded-md hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none text-zinc-300 transition-colors shrink-0">
          <ChevronRight size={16} />
        </button>

        <div className="flex-1 min-w-0 px-1">
          <p className="text-[11px] font-semibold text-white truncate leading-tight">{nowPlaying.title}</p>
          <p className="text-[10px] text-zinc-500 truncate leading-tight">{nowPlaying.subtitle}</p>
        </div>

        {/* Spotify connect pill */}
        {!spLoading && (
          spConnected ? (
            <button type="button" onClick={() => setPickerTab('spotify')}
              title={spUser?.display_name}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-600/20 hover:bg-green-600/30 text-green-400 text-[10px] font-bold transition-colors shrink-0">
              <SpotifyIcon size={12} />
              {spUser?.display_name?.split(' ')[0] ?? 'Spotify'}
            </button>
          ) : (
            <button type="button" onClick={connectSpotify}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-700 hover:bg-green-700/50 text-zinc-400 hover:text-green-300 text-[10px] font-bold transition-colors shrink-0">
              <SpotifyIcon size={12} />
              Conectar
            </button>
          )
        )}

        <button type="button" onClick={() => setShowPicker((v) => !v)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-zinc-700 hover:bg-zinc-600 text-white transition-colors shrink-0">
          {showPicker ? <X size={13} /> : <ListMusic size={13} />}
          {!showPicker && <span>Listas</span>}
        </button>
      </div>

      {/* Picker panel */}
      {showPicker && (
        <div className="absolute left-0 right-0 top-full bg-zinc-900 border border-zinc-700 rounded-b-xl shadow-2xl z-50 flex flex-col max-h-[min(32rem,78vh)]">

          {/* Tabs */}
          <div className="flex border-b border-zinc-800 shrink-0">
            <button type="button" onClick={() => setPickerTab('local')}
              className={`flex-1 py-2 text-xs font-bold transition-colors ${pickerTab === 'local' ? 'text-white border-b-2 border-red-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
              Mis listas
            </button>
            <button type="button"
              onClick={() => spConnected ? setPickerTab('spotify') : connectSpotify()}
              className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${pickerTab === 'spotify' ? 'text-green-400 border-b-2 border-green-500' : 'text-zinc-500 hover:text-green-400'}`}>
              <SpotifyIcon size={11} />
              {spConnected ? 'Spotify' : 'Conectar Spotify'}
            </button>
          </div>

          {/* ── Tab: Listas locales ── */}
          {pickerTab === 'local' && (
            <>
              <div className="px-3 pt-3 pb-2 border-b border-zinc-800 shrink-0">
                <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider mb-2">Playlist</p>
                <div className="grid grid-cols-2 gap-2">
                  {PLAYLISTS.map((pl) => {
                    const selected = activePlaylistId === pl.id
                    return (
                      <button key={pl.id} type="button" onClick={() => handlePlaylistPick(pl)}
                        className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition-all border active:scale-[0.98] ${
                          selected ? 'border-red-500 bg-red-500/10 text-white' : 'border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800'}`}>
                        <Music2 size={14} className={selected ? 'text-red-400 shrink-0 mt-0.5' : 'text-zinc-500 shrink-0 mt-0.5'} />
                        <span className="leading-snug line-clamp-2">{pl.name}</span>
                      </button>
                    )
                  })}
                </div>
                <button type="button" onClick={handlePlayThisPlaylist}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-green-500/50 transition-colors">
                  <Play size={16} className="text-green-400" fill="currentColor" />
                  <span className="text-green-400 text-sm font-bold">Reproducir lista completa</span>
                </button>
              </div>

              <div className="flex items-center px-3 py-2 border-b border-zinc-800 bg-zinc-950/50 shrink-0">
                <span className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">Canciones</span>
              </div>

              <form onSubmit={handleAddTrack} className="px-4 py-3 border-b border-zinc-800/60 space-y-2 shrink-0 bg-zinc-900/80">
                <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">Añadir canción manualmente</p>
                <div className="grid gap-2">
                  <input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="Nombre"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500" />
                  <input value={addArtist} onChange={(e) => setAddArtist(e.target.value)} placeholder="Artista (opcional)"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500" />
                  <div className="flex gap-2">
                    <input value={addLink} onChange={(e) => setAddLink(e.target.value)} placeholder="Enlace o spotify:track:…"
                      className="flex-1 min-w-0 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500" />
                    <button type="submit" className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold">
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
                {addError && <p className="text-red-400 text-xs">{addError}</p>}
              </form>

              <div className="overflow-y-auto flex-1 min-h-0">
                {mergedTracks.length === 0 ? (
                  <p className="text-zinc-500 text-xs text-center py-4 px-4">Sin canciones en esta lista.</p>
                ) : (
                  mergedTracks.map((track, i) => (
                    <div key={track.uri} className={`flex items-stretch border-b border-zinc-800/40 ${currentUri === track.uri ? 'bg-zinc-800' : ''}`}>
                      <button type="button" onClick={() => handlePlayTrack(track)}
                        className="flex-1 text-left px-3 py-2.5 hover:bg-zinc-800/80 transition-colors flex items-center gap-3 min-w-0">
                        <span className="w-6 shrink-0 text-center text-[10px] font-mono text-zinc-600">{i + 1}</span>
                        {currentUri === track.uri && <span className="w-1.5 h-1.5 bg-green-400 rounded-full shrink-0" />}
                        <div className={currentUri === track.uri ? 'min-w-0' : 'min-w-0 pl-[10px]'}>
                          <p className="text-white text-sm font-medium leading-tight truncate">{track.name}</p>
                          <p className="text-zinc-400 text-xs truncate">{track.artist}</p>
                        </div>
                      </button>
                      {track._custom && (
                        <button type="button" onClick={() => handleRemoveCustom(track.uri)}
                          className="shrink-0 px-3 text-zinc-500 hover:text-red-400 hover:bg-zinc-800/80">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* ── Tab: Spotify real playlists ── */}
          {pickerTab === 'spotify' && (
            <>
              {/* Header con usuario + desconectar */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 shrink-0">
                <div className="flex items-center gap-2">
                  <SpotifyIcon size={14} className="text-green-400" />
                  <span className="text-xs font-semibold text-white">{spUser?.display_name}</span>
                </div>
                <button type="button" onClick={disconnectSpotify}
                  className="text-[10px] text-zinc-500 hover:text-red-400 transition-colors">
                  Desconectar
                </button>
              </div>

              {/* Playlists del usuario */}
              <div className="px-3 pt-2 pb-2 border-b border-zinc-800 shrink-0">
                <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider mb-2">Tus playlists</p>
                {spPlaylistsLoading ? (
                  <div className="flex justify-center py-3"><Loader2 size={18} className="animate-spin text-zinc-500" /></div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                    {spPlaylists.map((pl) => {
                      const selected = activeSpPlaylistId === pl.id
                      const img = pl.images?.[0]?.url
                      return (
                        <button key={pl.id} type="button" onClick={() => handleSpPlaylistPick(pl)}
                          className={`flex items-center gap-2 rounded-xl px-2 py-2 text-left text-xs font-semibold transition-all border active:scale-[0.98] ${
                            selected ? 'border-green-500 bg-green-500/10 text-white' : 'border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:border-zinc-600'}`}>
                          {img
                            ? <img src={img} alt="" className="w-8 h-8 rounded-md shrink-0 object-cover" />
                            : <Music2 size={14} className="text-zinc-500 shrink-0" />}
                          <div className="min-w-0">
                            <p className="truncate leading-tight">{pl.name}</p>
                            <p className="text-[10px] text-zinc-500 truncate">{pl.tracks?.total} canciones</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Tracks de la playlist seleccionada */}
              {activeSpPlaylist && (
                <>
                  <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-950/50 shrink-0">
                    <span className="text-zinc-300 text-xs font-semibold truncate">{activeSpPlaylist.name}</span>
                    <button type="button" onClick={() => load(`spotify:playlist:${activeSpPlaylist.id}`)}
                      className="flex items-center gap-1 text-[10px] text-green-400 hover:text-green-300 font-bold shrink-0">
                      <Play size={11} fill="currentColor" /> Toda la lista
                    </button>
                  </div>

                  <div className="overflow-y-auto flex-1 min-h-0">
                    {spTracksLoading ? (
                      <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-zinc-500" /></div>
                    ) : spTracks.length === 0 ? (
                      <p className="text-zinc-500 text-xs text-center py-4">Sin canciones</p>
                    ) : (
                      spTracks.map((track, i) => {
                        const img = track.album?.images?.[2]?.url ?? track.album?.images?.[0]?.url
                        const artist = track.artists?.[0]?.name ?? ''
                        const isPlaying = currentUri === track.uri
                        return (
                          <button key={track.uri} type="button" onClick={() => load(track.uri)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 border-b border-zinc-800/40 hover:bg-zinc-800/80 transition-colors text-left ${isPlaying ? 'bg-zinc-800' : ''}`}>
                            <span className="w-5 shrink-0 text-center text-[10px] font-mono text-zinc-600">{i + 1}</span>
                            {img
                              ? <img src={img} alt="" className="w-8 h-8 rounded shrink-0 object-cover" />
                              : <Music2 size={14} className="text-zinc-500 shrink-0" />}
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium leading-tight truncate ${isPlaying ? 'text-green-400' : 'text-white'}`}>{track.name}</p>
                              <p className="text-zinc-400 text-xs truncate">{artist}</p>
                            </div>
                            <span className="text-[10px] text-zinc-600 shrink-0">{msToMin(track.duration_ms)}</span>
                          </button>
                        )
                      })
                    )}
                  </div>
                </>
              )}

              {!activeSpPlaylist && !spPlaylistsLoading && (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-zinc-600 text-xs text-center px-4">Selecciona una playlist para ver las canciones</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

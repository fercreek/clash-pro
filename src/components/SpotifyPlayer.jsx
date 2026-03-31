import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import {
  ListMusic,
  X,
  Play,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Music2,
} from 'lucide-react'
import { PLAYLISTS } from '../utils/songs'
import {
  parseSpotifyTrackUri,
  loadCustomTracksMap,
  saveCustomTracksMap,
  addCustomTrack,
  removeCustomTrack,
} from '../utils/spotifyUri'

function mergePlaylistTracks(pl, customMap) {
  const base = pl.tracks || []
  const extra = customMap[pl.id] || []
  const seen = new Set()
  const out = []
  for (const t of base) {
    if (!t?.uri || seen.has(t.uri)) continue
    seen.add(t.uri)
    out.push({ ...t, _custom: false })
  }
  for (const t of extra) {
    if (!t?.uri || seen.has(t.uri)) continue
    seen.add(t.uri)
    out.push({ ...t, _custom: true })
  }
  return out
}

export default function SpotifyPlayer() {
  const controllerRef = useRef(null)
  const [showPicker, setShowPicker] = useState(false)
  const [activePlaylistId, setActivePlaylistId] = useState(PLAYLISTS[0].id)
  const [currentUri, setCurrentUri] = useState(null)
  const [customMap, setCustomMap] = useState(loadCustomTracksMap)
  const [addName, setAddName] = useState('')
  const [addArtist, setAddArtist] = useState('')
  const [addLink, setAddLink] = useState('')
  const [addError, setAddError] = useState('')

  const activePlaylist = PLAYLISTS.find((p) => p.id === activePlaylistId) ?? PLAYLISTS[0]

  const mergedTracks = useMemo(
    () => mergePlaylistTracks(activePlaylist, customMap),
    [activePlaylist, activePlaylistId, customMap]
  )

  const nowPlaying = useMemo(() => {
    if (!currentUri) {
      return { title: activePlaylist.name, subtitle: 'Elige lista o canción' }
    }
    if (currentUri === activePlaylist.uri) {
      return { title: activePlaylist.name, subtitle: 'Playlist completa' }
    }
    const t = mergedTracks.find((x) => x.uri === currentUri)
    if (t) {
      return { title: t.name, subtitle: `${activePlaylist.name} · ${t.artist}` }
    }
    for (const pl of PLAYLISTS) {
      if (pl.uri === currentUri) {
        return { title: pl.name, subtitle: 'Playlist completa' }
      }
      const list = mergePlaylistTracks(pl, customMap)
      const tr = list.find((x) => x.uri === currentUri)
      if (tr) {
        return { title: tr.name, subtitle: `${pl.name} · ${tr.artist}` }
      }
    }
    return { title: activePlaylist.name, subtitle: 'Reproduciendo…' }
  }, [currentUri, activePlaylist, mergedTracks])

  const trackIndex = useMemo(() => {
    if (!currentUri) return -1
    return mergedTracks.findIndex((t) => t.uri === currentUri)
  }, [currentUri, mergedTracks])

  const isPlaylistMode = currentUri === activePlaylist.uri

  useEffect(() => {
    window.onSpotifyIframeApiReady = (IFrameAPI) => {
      const element = document.getElementById('spotify-embed-target')
      if (!element) return
      IFrameAPI.createController(
        element,
        { uri: PLAYLISTS[0].uri, width: '100%', height: '80' },
        (controller) => {
          controllerRef.current = controller
        }
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

  const handlePlaylistPick = useCallback(
    (pl) => {
      setActivePlaylistId(pl.id)
      load(pl.uri)
    },
    [load]
  )

  const handlePlayThisPlaylist = useCallback(() => {
    load(activePlaylist.uri)
  }, [activePlaylist.uri, load])

  const handlePlayTrack = useCallback(
    (track) => {
      load(track.uri)
    },
    [load]
  )

  const goPrevTrack = useCallback(() => {
    if (mergedTracks.length === 0) return
    if (isPlaylistMode || trackIndex <= 0) {
      load(mergedTracks[mergedTracks.length - 1].uri)
      return
    }
    load(mergedTracks[trackIndex - 1].uri)
  }, [isPlaylistMode, load, mergedTracks, trackIndex])

  const goNextTrack = useCallback(() => {
    if (mergedTracks.length === 0) return
    if (isPlaylistMode || trackIndex < 0) {
      load(mergedTracks[0].uri)
      return
    }
    if (trackIndex >= mergedTracks.length - 1) {
      load(mergedTracks[0].uri)
      return
    }
    load(mergedTracks[trackIndex + 1].uri)
  }, [isPlaylistMode, load, mergedTracks, trackIndex])

  const handleAddTrack = (e) => {
    e.preventDefault()
    setAddError('')
    const uri = parseSpotifyTrackUri(addLink)
    if (!uri) {
      setAddError('Pega un enlace o URI de Spotify (track)')
      return
    }
    const name = addName.trim()
    if (!name) {
      setAddError('Nombre obligatorio')
      return
    }
    const baseUris = new Set((activePlaylist.tracks || []).map((t) => t?.uri).filter(Boolean))
    if (baseUris.has(uri)) {
      setAddError('Ese track ya está en la lista base')
      return
    }
    const artist = addArtist.trim() || '—'
    const next = addCustomTrack(customMap, activePlaylistId, { name, artist, uri })
    if (next === customMap) {
      setAddError('Esa canción ya está en la lista')
      return
    }
    saveCustomTracksMap(next)
    setCustomMap(next)
    setAddLink('')
    setAddName('')
    setAddArtist('')
  }

  const handleRemoveCustom = (uri) => {
    const next = removeCustomTrack(customMap, activePlaylistId, uri)
    saveCustomTracksMap(next)
    setCustomMap(next)
  }

  const canStep = mergedTracks.length > 0

  return (
    <div className="w-full bg-zinc-900 border-b border-zinc-800 shrink-0 relative">
      <div id="spotify-embed-target" />

      <div className="absolute left-2 right-14 top-1/2 -translate-y-1/2 z-10 min-w-0 flex items-center gap-2 pointer-events-none">
        <Music2 size={14} className="text-red-500 shrink-0" />
        <div className="min-w-0 text-left">
          <p className="text-[11px] font-semibold text-white truncate leading-tight">
            {nowPlaying.title}
          </p>
          <p className="text-[10px] text-zinc-500 truncate leading-tight">{nowPlaying.subtitle}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowPicker((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold bg-zinc-700 hover:bg-zinc-600 text-white transition-colors z-10 pointer-events-auto"
      >
        {showPicker ? <X size={13} /> : <ListMusic size={13} />}
        {!showPicker && <span>Listas</span>}
      </button>

      {showPicker && (
        <div className="absolute left-0 right-0 top-full bg-zinc-900 border border-zinc-700 rounded-b-xl shadow-2xl z-50 flex flex-col max-h-[min(32rem,78vh)]">
          <div className="px-3 pt-3 pb-2 border-b border-zinc-800 shrink-0">
            <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider mb-2">
              Playlist
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PLAYLISTS.map((pl) => {
                const selected = activePlaylistId === pl.id
                return (
                  <button
                    key={pl.id}
                    type="button"
                    onClick={() => handlePlaylistPick(pl)}
                    className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition-all border active:scale-[0.98] ${
                      selected
                        ? 'border-red-500 bg-red-500/10 text-white shadow-[0_0_0_1px_rgba(239,68,68,0.35)]'
                        : 'border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800'
                    }`}
                  >
                    <Music2
                      size={14}
                      className={selected ? 'text-red-400 shrink-0 mt-0.5' : 'text-zinc-500 shrink-0 mt-0.5'}
                    />
                    <span className="leading-snug line-clamp-2">{pl.name}</span>
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              onClick={handlePlayThisPlaylist}
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-green-500/50 transition-colors"
            >
              <Play size={16} className="text-green-400" fill="currentColor" />
              <span className="text-green-400 text-sm font-bold">Reproducir esta lista desde el inicio</span>
            </button>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800 bg-zinc-950/50 shrink-0">
            <span className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider shrink-0">
              Canciones
            </span>
            <div className="flex-1" />
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={!canStep}
                onClick={goPrevTrack}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:pointer-events-none text-white transition-colors"
                aria-label="Anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                disabled={!canStep}
                onClick={goNextTrack}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:pointer-events-none text-white transition-colors"
                aria-label="Siguiente"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <form
            onSubmit={handleAddTrack}
            className="px-4 py-3 border-b border-zinc-800/60 space-y-2 shrink-0 bg-zinc-900/80"
          >
            <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">
              Añadir canción
            </p>
            <div className="grid grid-cols-1 gap-2">
              <input
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="Nombre"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500"
              />
              <input
                value={addArtist}
                onChange={(e) => setAddArtist(e.target.value)}
                placeholder="Artista (opcional)"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500"
              />
              <div className="flex gap-2">
                <input
                  value={addLink}
                  onChange={(e) => setAddLink(e.target.value)}
                  placeholder="Enlace o spotify:track:…"
                  className="flex-1 min-w-0 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500"
                />
                <button
                  type="submit"
                  className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
            {addError && <p className="text-red-400 text-xs">{addError}</p>}
          </form>

          <div className="overflow-y-auto flex-1 min-h-0">
            {mergedTracks.length === 0 ? (
              <p className="text-zinc-500 text-xs text-center py-4 px-4">
                Sin canciones. Añade arriba o en <code className="text-zinc-400">songs.js</code>.
              </p>
            ) : (
              mergedTracks.map((track, i) => (
                  <div
                    key={track.uri}
                    className={`flex items-stretch border-b border-zinc-800/40 ${
                      currentUri === track.uri ? 'bg-zinc-800' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handlePlayTrack(track)}
                      className="flex-1 text-left px-3 py-2.5 hover:bg-zinc-800/80 transition-colors flex items-center gap-3 min-w-0"
                    >
                      <span className="w-6 shrink-0 text-center text-[10px] font-mono text-zinc-600">
                        {i + 1}
                      </span>
                      {currentUri === track.uri && (
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full shrink-0" />
                      )}
                      <div className={currentUri === track.uri ? 'min-w-0' : 'min-w-0 pl-[10px]'}>
                        <p className="text-white text-sm font-medium leading-tight truncate">
                          {track.name}
                        </p>
                        <p className="text-zinc-400 text-xs truncate">{track.artist}</p>
                      </div>
                    </button>
                    {track._custom && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCustom(track.uri)}
                        className="shrink-0 px-3 text-zinc-500 hover:text-red-400 hover:bg-zinc-800/80"
                        aria-label="Quitar"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

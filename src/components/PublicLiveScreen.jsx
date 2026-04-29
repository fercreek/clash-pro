import { useEffect, useState, useCallback } from 'react'
import { Loader2, RefreshCw, WifiOff } from 'lucide-react'
import { fetchTournamentPublicSnapshot, subscribeTournamentPublicSnapshot } from '../lib/tournamentLive'
import LeaderboardScreen from './LeaderboardScreen'

function useSecondsAgo(ts) {
  const [secs, setSecs] = useState(null)
  useEffect(() => {
    if (!ts) { setSecs(null); return }
    const tick = () => setSecs(Math.floor((Date.now() - new Date(ts).getTime()) / 1000))
    tick()
    const id = setInterval(tick, 5000)
    return () => clearInterval(id)
  }, [ts])
  return secs
}

export default function PublicLiveScreen({ publicId }) {
  const [payload, setPayload] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updatedAt, setUpdatedAt] = useState(null)

  const apply = useCallback((p) => {
    if (p && typeof p === 'object') {
      setPayload(p)
      setUpdatedAt(p.updated_at ?? new Date().toISOString())
    }
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    const row = await fetchTournamentPublicSnapshot(publicId)
    apply(row?.payload ?? null)
    setLoading(false)
  }, [publicId, apply])

  useEffect(() => {
    let cancelled = false
    let off = () => {}
    ;(async () => {
      setLoading(true)
      const row = await fetchTournamentPublicSnapshot(publicId)
      if (cancelled) return
      apply(row?.payload ?? null)
      setLoading(false)
      off = subscribeTournamentPublicSnapshot(publicId, (pl) => apply(pl))
    })()
    return () => {
      cancelled = true
      off()
    }
  }, [publicId, apply])

  const secsAgo = useSecondsAgo(updatedAt)

  if (loading && !payload) {
    return (
      <div className="min-h-full bg-zinc-950 flex flex-col items-center justify-center gap-5 text-zinc-500 p-8">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Loader2 size={28} className="animate-spin text-red-500" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-60" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
        </div>
        <div className="text-center">
          <p className="text-white text-sm font-bold">Conectando al torneo…</p>
          <p className="text-zinc-500 text-xs mt-1">Esperando datos del organizador…</p>
        </div>
      </div>
    )
  }

  if (!payload?.competitors || !payload?.matches) {
    return (
      <div className="min-h-full bg-zinc-950 flex flex-col items-center justify-center gap-5 text-zinc-500 p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          <WifiOff size={32} className="text-zinc-600" />
        </div>
        <div>
          <p className="text-white font-black text-lg">Vista no disponible</p>
          <p className="text-zinc-500 text-sm mt-1.5 max-w-xs leading-relaxed">
            El organizador aún no ha publicado el torneo o el enlace no es válido.
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-colors"
        >
          <RefreshCw size={14} />
          Actualizar
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-zinc-950 flex flex-col">
      <div className="relative bg-gradient-to-b from-zinc-900 to-zinc-950 border-b border-zinc-800 px-4 pt-3 pb-2.5 text-center">
        <div className="flex items-center justify-center gap-2.5 mb-0.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
          <p className="text-sm font-black uppercase tracking-[0.35em] text-red-400">En vivo</p>
        </div>
        <p className="text-zinc-600 text-[11px]">ClashPro · Solo lectura</p>
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          title="Actualizar"
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-zinc-600 hover:text-zinc-300 transition-colors disabled:opacity-40"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex-1">
        <LeaderboardScreen
          competitors={payload.competitors}
          matches={payload.matches}
          onBack={() => {}}
          onReset={() => {}}
          showExtendedStats
          showConfetti={false}
          showRichWhatsApp={false}
          showFooterActions={false}
          showBackButton={false}
        />
      </div>

      {secsAgo !== null && (
        <div className="sticky bottom-0 bg-zinc-950/95 backdrop-blur border-t border-zinc-900 px-4 py-2 text-center">
          <p className="text-zinc-600 text-[11px]">
            Actualizado hace {secsAgo < 60 ? `${secsAgo}s` : `${Math.floor(secsAgo / 60)}m`}
          </p>
        </div>
      )}
    </div>
  )
}

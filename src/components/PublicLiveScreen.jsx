import { useEffect, useState, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { fetchTournamentPublicSnapshot, subscribeTournamentPublicSnapshot } from '../lib/tournamentLive'
import LeaderboardScreen from './LeaderboardScreen'

export default function PublicLiveScreen({ publicId }) {
  const [payload, setPayload] = useState(null)
  const [loading, setLoading] = useState(true)

  const apply = useCallback((p) => {
    if (p && typeof p === 'object') setPayload(p)
  }, [])

  useEffect(() => {
    let off = () => {}
    let cancelled = false
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

  if (loading && !payload) {
    return (
      <div className="min-h-full bg-zinc-950 flex flex-col items-center justify-center gap-3 text-zinc-500 p-8">
        <Loader2 size={32} className="animate-spin text-red-500" />
        <p className="text-sm">Cargando vista pública…</p>
      </div>
    )
  }

  if (!payload?.competitors || !payload?.matches) {
    return (
      <div className="min-h-full bg-zinc-950 flex flex-col items-center justify-center gap-2 text-zinc-500 p-8 text-center">
        <p className="text-white font-bold">Vista no disponible</p>
        <p className="text-sm">El organizador aún no ha publicado el torneo o el enlace no es válido.</p>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-zinc-950">
      <div className="px-4 pt-3 pb-1 border-b border-zinc-800 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400">ClashPro · En vivo</p>
        <p className="text-zinc-600 text-[11px] mt-0.5">Solo lectura</p>
      </div>
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
  )
}

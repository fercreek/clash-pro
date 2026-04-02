import { useEffect, useState, useCallback } from 'react'
import { X, History, ChevronRight, Loader2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { fetchTournamentArchives } from '../lib/tournamentArchives'
import { calculateScores, isRoundRobinFinished } from '../utils/roundRobin'
import LeaderboardScreen from './LeaderboardScreen'

function formatWhen(iso) {
  try {
    const d = new Date(iso)
    return d.toLocaleString('es', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export default function TournamentHistoryModal({ onClose }) {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  const load = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    const data = await fetchTournamentArchives(user.id)
    setRows(data)
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    load()
  }, [load])

  const noop = () => {}

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-[60]" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 top-[8vh] sm:top-[12vh] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-lg z-[70] bg-zinc-950 border border-zinc-800 rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <History size={18} className="text-red-400 shrink-0" />
            <h2 className="text-lg font-black text-white truncate">
              {selected ? 'Torneo guardado' : 'Historial'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-white rounded-lg shrink-0"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {selected ? (
            <LeaderboardScreen
              competitors={selected.competitors ?? []}
              matches={selected.matches ?? []}
              onBack={() => setSelected(null)}
              onReset={noop}
              showExtendedStats
              showConfetti={false}
              showRichWhatsApp
              showFooterActions={false}
            />
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-500">
              <Loader2 size={28} className="animate-spin text-red-500" />
              <p className="text-sm">Cargando…</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-zinc-400 text-sm">
                Cuando termines un torneo de competición, podrás verlo aquí.
              </p>
            </div>
          ) : (
            <ul className="p-3 space-y-2">
              {rows.map((row) => {
                const comps = row.competitors ?? []
                const ms = row.matches ?? []
                const lb = calculateScores(comps, ms)
                const champ = lb[0]?.name ?? '—'
                const done = isRoundRobinFinished(ms)
                return (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(row)}
                      className="w-full flex items-center gap-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl px-4 py-3 text-left transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm truncate">
                          {done ? `Campeón: ${champ}` : 'Torneo incompleto'}
                        </p>
                        <p className="text-zinc-500 text-xs mt-0.5">
                          {formatWhen(row.finished_at)} · {comps.length} competidores
                        </p>
                      </div>
                      <ChevronRight size={18} className="text-zinc-600 shrink-0" />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}

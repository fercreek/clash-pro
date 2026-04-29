import { useEffect, useState, useCallback, useMemo } from 'react'
import { X, History, ChevronRight, Loader2, BarChart2, Trophy, Swords } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { fetchTournamentArchives } from '../lib/tournamentArchives'
import { calculateScores, isRoundRobinFinished } from '../utils/roundRobin'
import { aggregateCareerStatsFromArchives, statsForArchiveRow, topCareerByWins } from '../utils/tournamentStats'
import LeaderboardScreen from './LeaderboardScreen'

function formatWhen(iso) {
  try {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now - d
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffDays === 0) {
      return `Hoy · ${d.toLocaleString('es', { hour: '2-digit', minute: '2-digit' })}`
    }
    if (diffDays === 1) {
      return `Ayer · ${d.toLocaleString('es', { hour: '2-digit', minute: '2-digit' })}`
    }
    if (diffDays < 7) {
      return d.toLocaleString('es', { weekday: 'long', hour: '2-digit', minute: '2-digit' })
    }
    return d.toLocaleString('es', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

const CHAMP_COLORS = ['#fbbf24', '#e4e4e7', '#d97706']

function ChampionBadge({ rank }) {
  const color = CHAMP_COLORS[rank - 1] ?? '#71717a'
  return (
    <div
      className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
      style={{ background: `${color}15`, border: `1px solid ${color}40` }}
    >
      <Trophy size={16} style={{ color }} strokeWidth={2.5} />
    </div>
  )
}

export default function TournamentHistoryModal({ onClose }) {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [selectedVisible, setSelectedVisible] = useState(false)

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

  const career = useMemo(() => aggregateCareerStatsFromArchives(rows), [rows])
  const top3 = useMemo(() => topCareerByWins(career.players, 3), [career.players])

  const noop = () => {}

  const handleSelectRow = useCallback((row) => {
    setSelectedVisible(false)
    setSelected(row)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setSelectedVisible(true))
    })
  }, [])

  const handleBack = useCallback(() => {
    setSelectedVisible(false)
    setTimeout(() => setSelected(null), 200)
  }, [])

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

        <div className="flex-1 overflow-y-auto min-h-0 relative">
          {selected ? (
            <div
              className="transition-all duration-250 ease-out"
              style={{
                opacity: selectedVisible ? 1 : 0,
                transform: selectedVisible ? 'translateY(0)' : 'translateY(10px)',
              }}
            >
              <LeaderboardScreen
                competitors={selected.competitors ?? []}
                matches={selected.matches ?? []}
                onBack={handleBack}
                onReset={noop}
                showExtendedStats
                showConfetti={false}
                showRichWhatsApp
                showFooterActions={false}
              />
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-500">
              <Loader2 size={28} className="animate-spin text-red-500" />
              <p className="text-sm">Cargando…</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="px-5 py-16 text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                <Swords size={28} className="text-amber-400" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-white font-bold text-base mb-1">¡A competir!</p>
                <p className="text-zinc-500 text-sm leading-relaxed max-w-xs mx-auto">
                  Termina tu primer torneo de competición y aparecerá aquí para siempre.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 space-y-3">
              {career.tournamentsConsidered > 0 && top3.length > 0 && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <BarChart2 size={16} className="text-amber-400 shrink-0" />
                      <p className="text-xs font-black uppercase tracking-widest text-zinc-400">
                        Récord global
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full">
                      {career.tournamentsConsidered} torneo{career.tournamentsConsidered !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <ol className="space-y-2.5">
                    {top3.map((p, i) => {
                      const medals = ['🥇', '🥈', '🥉']
                      return (
                        <li key={p.name} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm leading-none">{medals[i]}</span>
                            <span className="text-zinc-200 font-semibold text-sm truncate">{p.name}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-green-500/15 text-green-400 text-[10px] font-black">
                              {p.wins}V
                            </span>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-red-500/15 text-red-400 text-[10px] font-black">
                              {p.losses}D
                            </span>
                            {p.draws > 0 && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-zinc-700/50 text-zinc-400 text-[10px] font-black">
                                {p.draws}E
                              </span>
                            )}
                            <span className="text-zinc-600 text-[10px] font-bold ml-1 tabular-nums">
                              {p.winRate}%
                            </span>
                          </div>
                        </li>
                      )
                    })}
                  </ol>
                </div>
              )}
              <ul className="space-y-2">
                {rows.map((row) => {
                  const comps = row.competitors ?? []
                  const ms = row.matches ?? []
                  const lb = calculateScores(comps, ms)
                  const champ = lb[0]?.name ?? '—'
                  const done = isRoundRobinFinished(ms)
                  const perT = statsForArchiveRow(row)
                  const mvp = perT.length ? [...perT].sort((a, b) => b.wins - a.wins)[0] : null
                  return (
                    <li key={row.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectRow(row)}
                        className="w-full flex items-center gap-3 bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 rounded-xl px-3 py-3 text-left transition-all duration-150"
                      >
                        <ChampionBadge rank={done ? 1 : 0} />
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm truncate leading-tight">
                            {done ? champ : 'Torneo incompleto'}
                          </p>
                          <p className="text-zinc-500 text-xs mt-0.5 leading-tight">
                            {formatWhen(row.finished_at)}
                            {' · '}
                            <span className="text-zinc-600">{comps.length} jugadores</span>
                            {mvp && mvp.played > 0 ? (
                              <span className="text-zinc-600">
                                {' · '}
                                <span className="text-green-500/80">{mvp.wins}V</span>
                                {' '}
                                <span className="text-red-500/70">{mvp.losses}D</span>
                                {' '}{mvp.name}
                              </span>
                            ) : null}
                          </p>
                        </div>
                        <ChevronRight size={16} className="text-zinc-600 shrink-0" />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

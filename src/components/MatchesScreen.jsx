import { useMemo, useState } from 'react'
import { Trophy, RotateCcw, CheckCircle, Clock, Coffee } from 'lucide-react'
import { calculateScores } from '../utils/roundRobin'

function MatchCard({ match, onStartBattle }) {
  if (match.isBye) {
    return (
      <div className="flex items-center gap-3 bg-zinc-800/50 rounded-lg px-4 py-3 opacity-60">
        <Coffee size={16} className="text-zinc-500 shrink-0" />
        <span className="text-zinc-400 text-sm">
          <span className="text-white font-medium">{match.playerA}</span> — Descansa
        </span>
        <CheckCircle size={16} className="text-zinc-500 ml-auto shrink-0" />
      </div>
    )
  }

  if (match.completed) {
    const resultLabel =
      match.result === 'A'
        ? `Ganó ${match.playerA}`
        : match.result === 'B'
        ? `Ganó ${match.playerB}`
        : 'Empate'

    return (
      <div className="flex items-center gap-3 bg-zinc-800/50 rounded-lg px-4 py-3">
        <CheckCircle size={16} className="text-green-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">
            {match.playerA} <span className="text-zinc-500">vs</span> {match.playerB}
          </p>
          <p className="text-zinc-400 text-xs">{resultLabel}</p>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => onStartBattle(match.id)}
      className="w-full flex items-center gap-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-red-500 rounded-lg px-4 py-3 transition-colors text-left"
    >
      <Clock size={16} className="text-red-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold truncate">
          {match.playerA} <span className="text-zinc-500">vs</span> {match.playerB}
        </p>
        <p className="text-zinc-400 text-xs">Pendiente — toca para iniciar</p>
      </div>
    </button>
  )
}

export default function MatchesScreen({
  matches,
  competitors,
  onStartBattle,
  onViewLeaderboard,
  onReset,
}) {
  const [viewMode, setViewMode] = useState('list')

  const pending = useMemo(() => matches.filter((m) => !m.completed && !m.isBye), [matches])
  const completed = useMemo(() => matches.filter((m) => m.completed && !m.isBye), [matches])
  const byes = useMemo(() => matches.filter((m) => m.isBye), [matches])

  const roundsSections = useMemo(() => {
    const map = new Map()
    for (const m of matches) {
      const r = m.round != null ? m.round : -1
      if (!map.has(r)) map.set(r, [])
      map.get(r).push(m)
    }
    const keys = [...map.keys()].sort((a, b) => {
      if (a === -1) return 1
      if (b === -1) return -1
      return a - b
    })
    return keys.map((k) => ({
      key: k,
      label: k === -1 ? 'Sin ronda' : `Ronda ${k}`,
      items: map.get(k),
    }))
  }, [matches])

  const leaderboard = useMemo(
    () => calculateScores(competitors, matches),
    [competitors, matches]
  )

  const allDone = pending.length === 0

  return (
    <div className="p-4 max-w-lg mx-auto space-y-5">
      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-black">Batallas</h2>
          <p className="text-zinc-400 text-xs">
            {completed.length}/{completed.length + pending.length} completadas
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg bg-zinc-800 p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`rounded-md px-3 py-1.5 transition-colors ${
                viewMode === 'list' ? 'bg-zinc-700 text-white' : 'text-zinc-400'
              }`}
            >
              Lista
            </button>
            <button
              type="button"
              onClick={() => setViewMode('rounds')}
              className={`rounded-md px-3 py-1.5 transition-colors ${
                viewMode === 'rounds' ? 'bg-zinc-700 text-white' : 'text-zinc-400'
              }`}
            >
              Por ronda
            </button>
          </div>
          <button
            type="button"
            onClick={onViewLeaderboard}
            className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Trophy size={15} className="text-amber-400" />
            Ranking
          </button>
          <button
            type="button"
            onClick={onReset}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
            title="Reiniciar torneo"
          >
            <RotateCcw size={16} className="text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Mini leaderboard top 3 */}
      {completed.length > 0 && (
        <div className="bg-zinc-900 rounded-xl p-3 space-y-1">
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-2">
            Líderes
          </p>
          {leaderboard.slice(0, 3).map((entry, i) => (
            <div key={entry.name} className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 w-4">{i + 1}</span>
              <span className="flex-1 text-sm text-white font-medium truncate">{entry.name}</span>
              <span className="text-sm font-bold text-amber-400">{entry.points} pts</span>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'list' && (
        <>
          {pending.length > 0 && (
            <section className="space-y-2">
              <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest">
                Pendientes ({pending.length})
              </p>
              {pending.map((match) => (
                <MatchCard key={match.id} match={match} onStartBattle={onStartBattle} />
              ))}
            </section>
          )}

          {allDone && (
            <div className="text-center space-y-3 py-4">
              <p className="text-green-400 font-bold text-lg">¡Torneo completado!</p>
              <button
                type="button"
                onClick={onViewLeaderboard}
                className="w-full py-4 bg-amber-500 hover:bg-amber-400 rounded-xl font-black text-xl tracking-wide transition-colors"
              >
                VER GANADOR
              </button>
            </div>
          )}

          {completed.length > 0 && (
            <section className="space-y-2">
              <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest">
                Completadas ({completed.length})
              </p>
              {completed.map((match) => (
                <MatchCard key={match.id} match={match} onStartBattle={onStartBattle} />
              ))}
            </section>
          )}

          {byes.length > 0 && (
            <section className="space-y-2">
              <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest">
                Descansos
              </p>
              {byes.map((match) => (
                <MatchCard key={match.id} match={match} onStartBattle={onStartBattle} />
              ))}
            </section>
          )}
        </>
      )}

      {viewMode === 'rounds' && (
        <div className="space-y-5">
          {roundsSections.map((section) => (
            <section key={section.key} className="space-y-2">
              <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest">
                {section.label}
              </p>
              <div className="space-y-2">
                {section.items.map((match) => (
                  <MatchCard key={match.id} match={match} onStartBattle={onStartBattle} />
                ))}
              </div>
            </section>
          ))}
          {allDone && (
            <div className="text-center space-y-3 py-4">
              <p className="text-green-400 font-bold text-lg">¡Torneo completado!</p>
              <button
                type="button"
                onClick={onViewLeaderboard}
                className="w-full py-4 bg-amber-500 hover:bg-amber-400 rounded-xl font-black text-xl tracking-wide transition-colors"
              >
                VER GANADOR
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

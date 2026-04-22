import { useMemo, useState } from 'react'
import { Trophy, RotateCcw, CheckCircle, Clock, Coffee, Zap, X, Minus, Repeat, Flag } from 'lucide-react'
import { calculateScores } from '../utils/roundRobin'
import { showMatchesLeaderboardControls, showMatchesMiniRanking } from '../lib/featurePolicy'

function MatchCard({ match, onStartBattle, onQuickClose, expanded, onToggleExpand, isTournament }) {
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
      match.result == null
        ? 'Práctica completada'
        : match.result === 'A'
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
    <div className={`bg-zinc-800 border rounded-lg overflow-hidden transition-colors ${expanded ? 'border-amber-500' : 'border-zinc-700'}`}>
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => onStartBattle(match.id)}
          className="flex-1 flex items-center gap-3 text-left min-w-0"
        >
          <Clock size={16} className="text-red-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-white font-semibold truncate">
              {match.playerA} <span className="text-zinc-500">vs</span> {match.playerB}
            </p>
            <p className="text-zinc-400 text-xs">Toca para iniciar batalla</p>
          </div>
        </button>
        <button
          type="button"
          onClick={onToggleExpand}
          className={`shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            expanded
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
          }`}
          title={isTournament ? 'Cerrar batalla manualmente' : 'Marcar como hecha'}
        >
          {expanded ? <X size={13} /> : <Zap size={13} />}
          {expanded ? 'Cancelar' : 'Cerrar'}
        </button>
      </div>

      {expanded && (
        isTournament ? (
          <div className="px-4 pb-3 space-y-2 border-t border-zinc-700 pt-3">
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-widest">¿Quién ganó?</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onQuickClose(match.id, 'A')}
                className="flex-1 bg-zinc-700 hover:bg-blue-600/40 border border-zinc-600 hover:border-blue-500 rounded-lg px-3 py-2 text-sm font-bold text-white transition-colors"
              >
                {match.playerA}
              </button>
              <button
                type="button"
                onClick={() => onQuickClose(match.id, 'draw')}
                className="flex items-center gap-1 bg-zinc-700 hover:bg-amber-600/30 border border-zinc-600 hover:border-amber-500 rounded-lg px-3 py-2 text-sm font-bold text-amber-300 transition-colors"
              >
                <Minus size={13} /> Empate
              </button>
              <button
                type="button"
                onClick={() => onQuickClose(match.id, 'B')}
                className="flex-1 bg-zinc-700 hover:bg-blue-600/40 border border-zinc-600 hover:border-blue-500 rounded-lg px-3 py-2 text-sm font-bold text-white transition-colors"
              >
                {match.playerB}
              </button>
            </div>
          </div>
        ) : (
          <div className="px-4 pb-3 border-t border-zinc-700 pt-3">
            <p className="text-zinc-500 text-xs mb-2">Sin resultado de competición.</p>
            <button
              type="button"
              onClick={() => onQuickClose(match.id, null)}
              className="w-full bg-zinc-700 hover:bg-zinc-600 border border-zinc-600 rounded-lg px-3 py-2.5 text-sm font-bold text-white transition-colors"
            >
              Listo — siguiente batalla
            </button>
          </div>
        )
      )}
    </div>
  )
}

export default function MatchesScreen({
  matches,
  competitors,
  isTournament,
  onStartBattle,
  onQuickClose,
  onViewLeaderboard,
  onReset,
  practiceIterationNumber = 0,
  onNextPracticeIteration = null,
  onFinishPractice = null,
}) {
  const [viewMode, setViewMode] = useState('list')
  const [expandedId, setExpandedId] = useState(null)

  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id))

  const handleQuickClose = (matchId, result) => {
    onQuickClose(matchId, result)
    setExpandedId(null)
  }

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
  const showLb = showMatchesLeaderboardControls(isTournament)
  const showMini = showMatchesMiniRanking(isTournament)

  const matchCardProps = { onStartBattle, onQuickClose: handleQuickClose, isTournament }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-5">
      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-black">
            {isTournament ? 'Batallas' : practiceIterationNumber > 0 ? `Iteración ${practiceIterationNumber}` : 'Rondas'}
          </h2>
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
          {showLb && (
            <button
              type="button"
              onClick={onViewLeaderboard}
              className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Trophy size={15} className="text-amber-400" />
              Ranking
            </button>
          )}
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

      {showMini && completed.length > 0 && (
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
                <MatchCard
                  key={match.id}
                  match={match}
                  expanded={expandedId === match.id}
                  onToggleExpand={() => toggleExpand(match.id)}
                  {...matchCardProps}
                />
              ))}
            </section>
          )}

          {allDone && (
            <div className="text-center space-y-3 py-4">
              <p className="text-green-400 font-bold text-lg">
                {isTournament ? '¡Torneo completado!' : '¡Ronda completada!'}
              </p>
              {isTournament && (
                <button
                  type="button"
                  onClick={onViewLeaderboard}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-400 rounded-xl font-black text-xl tracking-wide transition-colors"
                >
                  VER GANADOR
                </button>
              )}
              {!isTournament && (onNextPracticeIteration || onFinishPractice) && (
                <div className="flex flex-col gap-2">
                  {onNextPracticeIteration && (
                    <button
                      type="button"
                      onClick={onNextPracticeIteration}
                      className="w-full flex items-center justify-center gap-2 py-4 bg-red-500 hover:bg-red-400 rounded-xl font-black text-base tracking-wide transition-colors"
                    >
                      <Repeat size={18} strokeWidth={2.5} />
                      SIGUIENTE ITERACIÓN
                    </button>
                  )}
                  {onFinishPractice && (
                    <button
                      type="button"
                      onClick={onFinishPractice}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl font-bold text-sm tracking-wide transition-colors"
                    >
                      <Flag size={15} />
                      Terminar práctica
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {completed.length > 0 && (
            <section className="space-y-2">
              <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest">
                Completadas ({completed.length})
              </p>
              {completed.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  expanded={expandedId === match.id}
                  onToggleExpand={() => toggleExpand(match.id)}
                  {...matchCardProps}
                />
              ))}
            </section>
          )}

          {byes.length > 0 && (
            <section className="space-y-2">
              <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest">
                Descansos
              </p>
              {byes.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  expanded={expandedId === match.id}
                  onToggleExpand={() => toggleExpand(match.id)}
                  {...matchCardProps}
                />
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
                  <MatchCard
                    key={match.id}
                    match={match}
                    expanded={expandedId === match.id}
                    onToggleExpand={() => toggleExpand(match.id)}
                    {...matchCardProps}
                  />
                ))}
              </div>
            </section>
          ))}
          {allDone && (
            <div className="text-center space-y-3 py-4">
              <p className="text-green-400 font-bold text-lg">
                {isTournament ? '¡Torneo completado!' : '¡Ronda completada!'}
              </p>
              {isTournament && (
                <button
                  type="button"
                  onClick={onViewLeaderboard}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-400 rounded-xl font-black text-xl tracking-wide transition-colors"
                >
                  VER GANADOR
                </button>
              )}
              {!isTournament && (onNextPracticeIteration || onFinishPractice) && (
                <div className="flex flex-col gap-2">
                  {onNextPracticeIteration && (
                    <button
                      type="button"
                      onClick={onNextPracticeIteration}
                      className="w-full flex items-center justify-center gap-2 py-4 bg-red-500 hover:bg-red-400 rounded-xl font-black text-base tracking-wide transition-colors"
                    >
                      <Repeat size={18} strokeWidth={2.5} />
                      SIGUIENTE ITERACIÓN
                    </button>
                  )}
                  {onFinishPractice && (
                    <button
                      type="button"
                      onClick={onFinishPractice}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl font-bold text-sm tracking-wide transition-colors"
                    >
                      <Flag size={15} />
                      Terminar práctica
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

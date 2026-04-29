import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { Trophy, RotateCcw, CheckCircle, Clock, Coffee, Zap, X, Minus, Repeat, Flag, Users, Settings2, Activity, Pencil, Radio, Copy, ExternalLink } from 'lucide-react'
import { calculateScores } from '../utils/roundRobin'
import { showMatchesLeaderboardControls, showMatchesMiniRanking } from '../lib/featurePolicy'
import { useAuth } from '../hooks/useAuth'
import {
  randomPublicId,
  getStoredLivePublicId,
  setStoredLivePublicId,
  buildLiveUrl,
  upsertTournamentPublicSnapshot,
} from '../lib/tournamentLive'
import PracticeRosterEditModal from './PracticeRosterEditModal'
import DiscardRoundsModal from './DiscardRoundsModal'

const LEVEL_BADGE = {
  beginner:   { label: 'B', cls: 'text-emerald-400' },
  intermedio: { label: 'I', cls: 'text-blue-400' },
  avanzado:   { label: 'A', cls: 'text-red-400' },
}

function LevelTag({ name, levelOf }) {
  if (!levelOf) return null
  const b = LEVEL_BADGE[levelOf[name]]
  if (!b) return null
  return <span className={`text-[9px] font-black ${b.cls}`}>{b.label}</span>
}

function MatchCard({
  match,
  onStartBattle,
  onQuickClose,
  expanded,
  onToggleExpand,
  isTournament,
  onUpdateMatchNames,
  allMatches,
  competitors,
  levelOf,
  battleIndex,
}) {
  const [editing, setEditing] = useState(false)
  const [da, setDa] = useState('')
  const [db, setDb] = useState('')

  const roundPool = useMemo(() => {
    const s = new Set()
    const step = (m) => {
      if (m.isBye) return
      s.add(m.playerA)
      s.add(m.playerB)
    }
    if (match.round != null) {
      for (const m of allMatches) {
        if (m.round === match.round) step(m)
      }
    } else {
      for (const m of allMatches) step(m)
    }
    let arr = [...s].sort((a, b) => a.localeCompare(b, 'es'))
    if (arr.length < 2 && competitors?.length) {
      arr = [...competitors].sort((a, b) => a.localeCompare(b, 'es'))
    }
    return arr
  }, [allMatches, match.round, competitors])

  const optionsForA = useMemo(() => roundPool.filter((n) => n !== db), [roundPool, db])
  const optionsForB = useMemo(() => roundPool.filter((n) => n !== da), [roundPool, da])

  useEffect(() => {
    if (match.isBye || match.completed) return
    setDa(match.playerA)
    setDb(match.playerB)
  }, [match.id, match.playerA, match.playerB, match.isBye, match.completed])

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
    if (!isTournament) {
      return (
        <div className="flex items-center gap-3 bg-zinc-800/50 rounded-lg px-4 py-3">
          <CheckCircle size={16} className="text-green-500 shrink-0" />
          <p className="text-white text-sm font-medium truncate flex-1 min-w-0">
            {match.playerA} <span className="text-zinc-500">vs</span> {match.playerB}
          </p>
        </div>
      )
    }
    const resultLabel =
      match.result === 'A'
        ? `Ganó ${match.playerA}`
        : match.result === 'B'
          ? `Ganó ${match.playerB}`
          : match.result === 'draw'
            ? 'Empate'
            : 'Cerrada'

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

  if (editing && onUpdateMatchNames && roundPool.length >= 2) {
    const canSave = da && db && da !== db
    return (
      <div className="bg-zinc-800 border border-amber-500/50 rounded-lg overflow-hidden p-4 space-y-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-400/90">Cambiar pareja</p>
          <p className="text-xs text-zinc-500 mt-1">Elige dos participantes de esta ronda (quienes ya salen en los cruces de la ronda)</p>
        </div>
        <div className="space-y-2">
          <label className="block">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Lado A</span>
            <select
              value={optionsForA.includes(da) ? da : optionsForA[0] ?? ''}
              onChange={(e) => {
                const v = e.target.value
                setDa(v)
                if (v === db) {
                  const alt = roundPool.find((n) => n !== v)
                  if (alt) setDb(alt)
                }
              }}
              className="w-full bg-zinc-900 border border-zinc-600 rounded-xl px-3 py-2.5 text-white text-sm font-medium"
            >
              {optionsForA.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Lado B</span>
            <select
              value={optionsForB.includes(db) ? db : optionsForB[0] ?? ''}
              onChange={(e) => {
                const v = e.target.value
                setDb(v)
                if (v === da) {
                  const alt = roundPool.find((n) => n !== v)
                  if (alt) setDa(alt)
                }
              }}
              className="w-full bg-zinc-900 border border-zinc-600 rounded-xl px-3 py-2.5 text-white text-sm font-medium"
            >
              {optionsForB.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!canSave}
            onClick={() => {
              if (!canSave) return
              onUpdateMatchNames(match.id, da, db)
              setEditing(false)
            }}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-black text-white"
          >
            Guardar
          </button>
          <button
            type="button"
            onClick={() => {
              setDa(match.playerA)
              setDb(match.playerB)
              setEditing(false)
            }}
            className="flex-1 py-2.5 rounded-xl border border-zinc-600 bg-zinc-800 text-sm font-bold text-zinc-300"
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-zinc-800 border rounded-lg overflow-hidden transition-colors ${expanded ? 'border-amber-500' : 'border-zinc-700'}`}>
      <div className="flex items-center gap-2 px-3 sm:px-4 py-3">
        <button
          type="button"
          onClick={() => onStartBattle(match.id)}
          className="flex-1 flex items-center gap-3 text-left min-w-0"
        >
          {battleIndex != null ? (
            <span className="shrink-0 min-w-[1.5rem] h-6 px-1 rounded-md bg-red-500/20 text-red-400 text-[10px] font-black flex items-center justify-center border border-red-500/30">
              #{battleIndex + 1}
            </span>
          ) : (
            <Clock size={16} className="text-red-500 shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-white font-semibold truncate flex items-center gap-1 flex-wrap">
              {match.playerA}<LevelTag name={match.playerA} levelOf={levelOf} />
              <span className="text-zinc-500">vs</span>
              {match.playerB}<LevelTag name={match.playerB} levelOf={levelOf} />
            </p>
            <p className="text-zinc-400 text-xs">Toca para iniciar batalla</p>
          </div>
        </button>
        {onUpdateMatchNames && allMatches && roundPool.length >= 2 && (
          <button
            type="button"
            onClick={() => {
              if (expanded) onToggleExpand()
              setDa(match.playerA)
              setDb(match.playerB)
              setEditing(true)
            }}
            className="shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold bg-zinc-700 hover:bg-zinc-600 text-zinc-200"
            title="Cambiar quiénes bailan esta batalla (entre quienes salen en la ronda)"
          >
            <Pencil size={13} className="shrink-0" />
            Cambiar
          </button>
        )}
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
  roundTime = 40,
  onEditSetup = null,
  onCommitPracticeRoster = null,
  onRegenerate = null,
  onEditRoster = null,
  practiceAppearances = null,
  visibleRound = null,
  practiceIterationNumber = 0,
  onNextRound = null,
  onNextPracticeIteration = null,
  onFinishPractice = null,
  sessionDanceCounts = null,
  sessionCompletedPairings = null,
  onUpdateMatchNames = null,
  battleRoundCount = 4,
  levelOf = null,
}) {
  const { user } = useAuth()
  const [viewMode, setViewMode] = useState('list')
  const [expandedId, setExpandedId] = useState(null)
  const [rosterOpen, setRosterOpen] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)
  const [liveOpen, setLiveOpen] = useState(false)
  const [syncLive, setSyncLive] = useState(false)
  const [publicLiveId, setPublicLiveId] = useState(() => getStoredLivePublicId() || null)
  const [copyOk, setCopyOk] = useState(false)
  const publicLiveIdRef = useRef(publicLiveId)
  publicLiveIdRef.current = publicLiveId

  const ensurePublicId = useCallback(() => {
    let id = publicLiveIdRef.current
    if (!id) {
      id = randomPublicId()
      setPublicLiveId(id)
      setStoredLivePublicId(id)
    }
    return id
  }, [])

  useEffect(() => {
    if (!isTournament || !user || !syncLive) return
    const pid = ensurePublicId()
    const t = setTimeout(() => {
      upsertTournamentPublicSnapshot({
        userId: user.id,
        publicId: pid,
        payload: { competitors, matches, roundTime, battleRoundCount },
      })
    }, 800)
    return () => clearTimeout(t)
  }, [isTournament, user, syncLive, competitors, matches, roundTime, battleRoundCount, ensurePublicId])

  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id))

  const handleQuickClose = (matchId, result) => {
    onQuickClose(matchId, result)
    setExpandedId(null)
  }

  const totalRounds = useMemo(() => {
    const nums = matches.map((m) => m.round).filter((r) => typeof r === 'number')
    return nums.length ? Math.max(...nums) : 0
  }, [matches])

  const scopedMatches = useMemo(() => {
    if (visibleRound == null) return matches
    return matches.filter((m) => m.round === visibleRound)
  }, [matches, visibleRound])

  const isLastRound = visibleRound != null && visibleRound >= totalRounds

  const pending = useMemo(() => scopedMatches.filter((m) => !m.completed && !m.isBye), [scopedMatches])
  const completed = useMemo(() => scopedMatches.filter((m) => m.completed && !m.isBye), [scopedMatches])
  const byes = useMemo(() => scopedMatches.filter((m) => m.isBye), [scopedMatches])

  const roundsSections = useMemo(() => {
    const map = new Map()
    for (const m of scopedMatches) {
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
  }, [scopedMatches])

  const leaderboard = useMemo(
    () => calculateScores(competitors, matches),
    [competitors, matches]
  )

  const allDone = pending.length === 0
  const showLb = showMatchesLeaderboardControls(isTournament)
  const showMini = showMatchesMiniRanking(isTournament)

  const liveFullUrl = useMemo(
    () => (publicLiveId ? buildLiveUrl(publicLiveId) : ''),
    [publicLiveId]
  )

  const handleCopyLiveUrl = useCallback(async () => {
    if (!liveFullUrl) return
    try {
      await navigator.clipboard.writeText(liveFullUrl)
      setCopyOk(true)
      setTimeout(() => setCopyOk(false), 2000)
    } catch {}
  }, [liveFullUrl])

  const danceRows = useMemo(() => {
    if (sessionDanceCounts == null || !competitors.length) return []
    return [...competitors]
      .map((name) => ({ name, count: sessionDanceCounts[name] ?? 0 }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'es'))
  }, [competitors, sessionDanceCounts])

  const practiceCompletedPairings = useMemo(() => {
    if (isTournament) return []
    if (sessionCompletedPairings != null) return sessionCompletedPairings
    return matches.filter((m) => m.completed && !m.isBye)
  }, [isTournament, sessionCompletedPairings, matches])

  const matchCardProps = { onStartBattle, onQuickClose: handleQuickClose, isTournament, onUpdateMatchNames, allMatches: matches, competitors, levelOf }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-5">
      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-black">
            {isTournament
              ? 'Batallas'
              : visibleRound != null
                ? `Ronda ${visibleRound}/${totalRounds}`
                : practiceIterationNumber > 0 ? `Iteración ${practiceIterationNumber}` : 'Rondas'}
          </h2>
          <p className="text-zinc-400 text-xs">
            {completed.length}/{completed.length + pending.length} completadas
            {!isTournament && practiceIterationNumber > 0 && (
              <span className="text-zinc-600"> · Iteración {practiceIterationNumber}</span>
            )}
          </p>
          {completed.length + pending.length > 0 && (
            <div className="h-1 w-full max-w-[160px] rounded-full bg-zinc-800 mt-1.5 overflow-hidden">
              <div
                className="h-full bg-red-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.round((completed.length / (completed.length + pending.length)) * 100)}%` }}
              />
            </div>
          )}
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
          {showLb && isTournament && user && (
            <button
              type="button"
              onClick={() => {
                setLiveOpen(true)
                if (!publicLiveId) {
                  const id = randomPublicId()
                  setPublicLiveId(id)
                  setStoredLivePublicId(id)
                }
              }}
              className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-lg text-sm font-medium text-amber-300 transition-colors"
            >
              <Radio size={15} className="text-red-400" />
              Proyectar
            </button>
          )}
          {!isTournament && onEditRoster && (
            <button
              type="button"
              onClick={onEditRoster}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              title="Editar participantes"
            >
              <Users size={16} className="text-zinc-400" />
            </button>
          )}
          <button
            type="button"
            onClick={isTournament ? onReset : () => setDiscardOpen(true)}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
            title={isTournament ? 'Reiniciar torneo' : 'Regenerar rondas'}
          >
            <RotateCcw size={16} className="text-zinc-400" />
          </button>
        </div>
      </div>

      {!isTournament && (onEditSetup || onCommitPracticeRoster) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-red-500">
              <Clock size={20} strokeWidth={2.25} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Cuenta atrás</p>
              <p className="text-lg font-black tabular-nums text-white leading-tight">
                {roundTime ?? 40}
                <span className="text-sm font-bold text-zinc-500">s</span>
                <span className="ml-1.5 text-xs font-medium text-zinc-500">por batalla</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
            {onEditSetup && (
              <button
                type="button"
                onClick={onEditSetup}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-600 bg-zinc-800 px-3 py-2 text-xs font-black uppercase tracking-wide text-zinc-200 hover:bg-zinc-700 transition-colors"
                title="Tiempo, roster completo y volver a armar desde setup"
              >
                <Settings2 size={14} />
                Ajustar setup
              </button>
            )}
            {onCommitPracticeRoster && (
              <button
                type="button"
                onClick={() => setRosterOpen(true)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-black uppercase tracking-wide text-red-300 hover:bg-red-500/20 transition-colors"
              >
                <Users size={14} />
                Bailarines
              </button>
            )}
          </div>
        </div>
      )}

      {onCommitPracticeRoster && (
        <PracticeRosterEditModal
          open={rosterOpen}
          onClose={() => setRosterOpen(false)}
          initialNames={competitors}
          sessionStats={sessionDanceCounts}
          sessionPairings={sessionCompletedPairings}
          onApply={(r) => {
            if (!r.ok) return
            return onCommitPracticeRoster(r.names)
          }}
        />
      )}

      <DiscardRoundsModal
        open={discardOpen}
        onClose={() => setDiscardOpen(false)}
        onConfirm={() => onRegenerate?.()}
      />

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

      {!isTournament && practiceAppearances && Object.keys(practiceAppearances).length > 0 && (() => {
        const entries = Object.entries(practiceAppearances).sort((a, b) => b[1] - a[1])
        const maxCount = entries[0]?.[1] ?? 1
        const minCount = entries[entries.length - 1]?.[1] ?? 0
        const isBalanced = maxCount - minCount <= 1
        return (
          <div className="bg-zinc-900 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest">Apariciones</p>
              <span className={`text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full ${
                isBalanced ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
              }`}>
                {isBalanced ? 'Balanceado' : `+${maxCount - minCount} dif`}
              </span>
            </div>
            <div className="space-y-1.5">
              {entries.map(([name, count], i) => (
                <div key={name} className="flex items-center gap-2">
                  <span className="text-xs text-zinc-600 w-4 shrink-0">{i + 1}</span>
                  <span className="text-sm text-white font-medium truncate w-24 shrink-0">{name}</span>
                  <div className="flex-1 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full transition-all"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-black text-red-400 tabular-nums w-5 text-right shrink-0">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {viewMode === 'list' && (
        <>
          {pending.length > 0 && (
            <section className="space-y-2">
              <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest">
                Pendientes ({pending.length})
              </p>
              {pending.map((match, idx) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  expanded={expandedId === match.id}
                  onToggleExpand={() => toggleExpand(match.id)}
                  battleIndex={idx}
                  {...matchCardProps}
                />
              ))}
            </section>
          )}

          {allDone && (
            <div className="text-center space-y-3 py-4">
              <p className="text-green-400 font-bold text-lg">
                {isTournament
                  ? '¡Torneo completado!'
                  : visibleRound != null && !isLastRound
                    ? `¡Ronda ${visibleRound} completada!`
                    : '¡Iteración completada!'}
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
              {!isTournament && visibleRound != null && !isLastRound && onNextRound && (
                <button
                  type="button"
                  onClick={onNextRound}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-red-500 hover:bg-red-400 rounded-xl font-black text-base tracking-wide transition-colors"
                >
                  <Repeat size={18} strokeWidth={2.5} />
                  SIGUIENTE RONDA
                </button>
              )}
              {!isTournament && (visibleRound == null || isLastRound) && (onNextPracticeIteration || onFinishPractice) && (
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
                {isTournament
                  ? '¡Torneo completado!'
                  : visibleRound != null && !isLastRound
                    ? `¡Ronda ${visibleRound} completada!`
                    : '¡Iteración completada!'}
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
              {!isTournament && visibleRound != null && !isLastRound && onNextRound && (
                <button
                  type="button"
                  onClick={onNextRound}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-red-500 hover:bg-red-400 rounded-xl font-black text-base tracking-wide transition-colors"
                >
                  <Repeat size={18} strokeWidth={2.5} />
                  SIGUIENTE RONDA
                </button>
              )}
              {!isTournament && (visibleRound == null || isLastRound) && (onNextPracticeIteration || onFinishPractice) && (
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

      {!isTournament && sessionDanceCounts != null && (practiceCompletedPairings.length > 0 || danceRows.length > 0) && (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
          <div className="flex items-center gap-2 text-zinc-500">
            <Activity size={16} className="shrink-0 text-red-500/80" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Batallas hechas (sesión)</p>
          </div>
          {practiceCompletedPairings.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 mb-2">Cruces que ya hubo (sin ganador, solo quién con quién)</p>
              <ul className="flex flex-col gap-1.5">
                {practiceCompletedPairings.map((m, i) => (
                  <li
                    key={`${i}-${m.id}`}
                    className="text-sm rounded-lg bg-zinc-950/80 border border-zinc-800/80 px-3 py-2 text-zinc-200"
                  >
                    <span className="font-semibold text-white">{m.playerA}</span>
                    <span className="text-zinc-600"> vs </span>
                    <span className="font-semibold text-white">{m.playerB}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {danceRows.length > 0 && (
            <>
              <p className="text-xs text-zinc-500">Veces en pista por persona</p>
              <ul className="flex flex-col gap-1.5">
                {danceRows.map((row) => (
                  <li
                    key={row.name}
                    className="flex items-center justify-between gap-2 rounded-xl bg-zinc-950/80 border border-zinc-800/80 px-3 py-2"
                  >
                    <span className="text-sm font-medium text-white truncate min-w-0">{row.name}</span>
                    <span className="text-sm font-black tabular-nums text-zinc-300 shrink-0">×{row.count}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {liveOpen && isTournament && user && (
        <>
          <div
            className="fixed inset-0 bg-black/70 z-[80]"
            onClick={() => setLiveOpen(false)}
            aria-hidden
          />
          <div className="fixed left-0 right-0 bottom-0 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-md sm:rounded-2xl z-[90] bg-zinc-950 border border-zinc-800 p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500/15 border border-red-500/30">
                  <Radio size={16} className="text-red-400" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white leading-tight">Proyección en vivo</h3>
                  <p className="text-zinc-500 text-[11px]">Ranking público para el público</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLiveOpen(false)}
                className="shrink-0 p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-white transition-colors"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-zinc-400 text-sm mb-5 leading-relaxed">
              Activa la sincronización para que un proyector o el público vean el ranking en casi tiempo real. El enlace no requiere cuenta.
            </p>
            <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer hover:border-zinc-700 transition-colors">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-zinc-600 text-red-500 focus:ring-red-500"
                checked={syncLive}
                onChange={(e) => setSyncLive(e.target.checked)}
              />
              <div>
                <span className="text-white text-sm font-semibold block">Sincronizar batallas ahora</span>
                {syncLive && <span className="text-green-400 text-[11px] font-medium">● En vivo</span>}
              </div>
            </label>
            {publicLiveId && liveFullUrl && (
              <div className="mt-5 space-y-3">
                <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-widest">Escanear para abrir</p>
                <div className="flex items-center justify-center p-4 bg-white rounded-2xl">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(liveFullUrl)}`}
                    width={200}
                    height={200}
                    alt=""
                    className="w-[200px] h-[200px]"
                  />
                </div>
                <a
                  href={liveFullUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-zinc-700 text-sm font-semibold text-amber-300 hover:bg-zinc-900 transition-colors"
                >
                  <ExternalLink size={16} />
                  Abrir vista pública
                </a>
                <button
                  type="button"
                  onClick={handleCopyLiveUrl}
                  className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-colors ${
                    copyOk
                      ? 'bg-green-500/20 border border-green-500/40 text-green-300'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                  }`}
                >
                  <Copy size={16} />
                  {copyOk ? '¡Copiado!' : 'Copiar enlace'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

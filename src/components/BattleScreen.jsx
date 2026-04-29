import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Play, Pause, Trophy, Minus, Volume2, VolumeX,
  ChevronLeft, RotateCcw, SkipForward, Plus, Music2, Undo2,
} from 'lucide-react'
import {
  useCountdownBeeps,
  loadSoundMuted,
  saveSoundMuted,
} from '../hooks/useCountdownBeeps'

function TimerCircle({ seconds, total, paused, onClick }) {
  const pct      = total > 0 ? seconds / total : 0
  const isUrgent = seconds <= 10

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={paused ? 'Reanudar' : 'Pausar'}
      className={`relative flex items-center justify-center rounded-full transition-all duration-500 ease-out select-none active:scale-95 ${
        isUrgent && !paused ? 'ring-2 ring-red-500/60 shadow-lg shadow-red-500/20' : ''
      } ${paused ? 'opacity-70' : ''}`}
      style={{
        width: 180,
        height: 180,
        background: `conic-gradient(
          ${paused ? '#71717a' : isUrgent ? '#ef4444' : '#f97316'} ${pct * 360}deg,
          #27272a ${pct * 360}deg
        )`,
      }}
    >
      <div className="absolute inset-3 bg-zinc-950 rounded-full flex items-center justify-center overflow-hidden">
        <div className={isUrgent && !paused ? 'animate-pulse' : ''}>
          <span
            key={seconds}
            className={`text-5xl font-black tabular-nums animate-digitPop inline-block ${
              paused ? 'text-zinc-400' : isUrgent ? 'text-red-500' : 'text-white'
            }`}
          >
            {String(seconds).padStart(2, '0')}
          </span>
        </div>
        {paused && (
          <span className="absolute text-[10px] text-zinc-500 mt-14">TAP = REANUDAR</span>
        )}
        {!paused && seconds > 3 && (
          <span className="absolute text-[10px] text-zinc-600 mt-14">TAP = PAUSAR</span>
        )}
      </div>
    </button>
  )
}

export default function BattleScreen({
  match,
  roundTime,
  roundCount = 4,
  isTournament = true,
  onBattleEnd,
  onCancel,
  nowPlaying,
  onNextSong,
  onRoundStart,
  matchNumber,
  totalMatches,
}) {
  const totalRounds = Math.min(4, Math.max(1, Math.floor(Number(roundCount)) || 4))

  const [status, setStatus] = useState('ready')
  const [roundIndex, setRoundIndex] = useState(0)
  const [betweenAfter, setBetweenAfter] = useState(null)
  const [timeLeft, setTimeLeft]   = useState(roundTime)
  const [paused, setPaused]       = useState(false)
  const [soundMuted, setSoundMuted] = useState(loadSoundMuted)
  const intervalRef = useRef(null)
  const onEndRef    = useRef(null)
  const toNextRef   = useRef(null)
  const beginRoundRef = useRef(null)

  const isRunning      = status === 'running'
  const isCountingDown = isRunning && !paused

  const { unlock, playBell, playRoundEnd, playParticipantChange } = useCountdownBeeps({ timeLeft, isCountingDown, muted: soundMuted })

  const clearTimer = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
  }, [])

  const runInterval = useCallback((onEnd) => {
    clearTimer()
    onEndRef.current = onEnd
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
          onEndRef.current?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [clearTimer])

  const startCountdown = useCallback((onEnd) => {
    setTimeLeft(roundTime)
    setPaused(false)
    setTimeout(() => runInterval(onEnd), 0)
  }, [roundTime, runInterval])

  const handlePauseResume = useCallback(() => {
    if (paused) { setPaused(false); runInterval(onEndRef.current) }
    else        { clearTimer(); setPaused(true) }
  }, [paused, clearTimer, runInterval])

  const addTime = useCallback((secs) => {
    setTimeLeft((prev) => Math.max(1, Math.min(prev + secs, roundTime * 2)))
  }, [roundTime])

  const handleRestartPhase = useCallback(() => {
    clearTimer()
    setPaused(false)
    setTimeLeft(roundTime)
    setTimeout(() => runInterval(onEndRef.current), 0)
  }, [clearTimer, roundTime, runInterval])

  const handleSkipPhase = useCallback(() => {
    clearTimer()
    setPaused(false)
    onEndRef.current?.()
  }, [clearTimer])

  const clearToNext = useCallback(() => {
    if (toNextRef.current) {
      clearTimeout(toNextRef.current)
      toNextRef.current = null
    }
  }, [])

  const beginRound = useCallback(
    (idx) => {
      if (idx > 0) {
        playParticipantChange()
        setTimeout(() => playBell(), 300)
      }
      setRoundIndex(idx)
      setStatus('running')
      setBetweenAfter(null)
      setPaused(false)
      startCountdown(() => {
        playRoundEnd()
        if (idx < totalRounds - 1) {
          setStatus('between')
          setBetweenAfter(idx)
          clearToNext()
          toNextRef.current = setTimeout(() => {
            toNextRef.current = null
            beginRoundRef.current?.(idx + 1)
          }, 750)
        } else if (isTournament) {
          setStatus('voting')
        } else {
          onBattleEnd(match.id, null)
        }
      })
    },
    [
      playParticipantChange,
      playBell,
      startCountdown,
      playRoundEnd,
      totalRounds,
      isTournament,
      onBattleEnd,
      match.id,
      clearToNext,
    ]
  )

  beginRoundRef.current = beginRound

  const goBackToRound1 = useCallback(() => {
    clearTimer()
    clearToNext()
    setPaused(false)
    setStatus('ready')
    setRoundIndex(0)
    setBetweenAfter(null)
    setTimeLeft(roundTime)
  }, [clearTimer, clearToNext, roundTime])

  const replayLastFromVoting = useCallback(() => {
    if (!isTournament) return
    const last = totalRounds - 1
    setStatus('running')
    setRoundIndex(last)
    setBetweenAfter(null)
    setPaused(false)
    setTimeLeft(roundTime)
    if (last > 0) {
      playParticipantChange()
      setTimeout(() => playBell(), 200)
    } else {
      setTimeout(() => playBell(), 200)
    }
    startCountdown(() => {
      playRoundEnd()
      setStatus('voting')
    })
  }, [isTournament, totalRounds, roundTime, playParticipantChange, playBell, startCountdown, playRoundEnd])

  useEffect(() => () => {
    clearTimer()
    if (toNextRef.current) clearTimeout(toNextRef.current)
  }, [clearTimer])

  const toggleMute = useCallback(() => {
    setSoundMuted((m) => { const next = !m; saveSoundMuted(next); return next })
  }, [])

  const handlePlay = useCallback(() => {
    if (status !== 'ready') return
    unlock()
    onRoundStart?.()
    playBell()
    beginRound(0)
  }, [status, beginRound, unlock, playBell, onRoundStart])

  const handleVote = useCallback((result) => onBattleEnd(match.id, result), [match.id, onBattleEnd])
  const handleBack = useCallback(() => {
    clearTimer()
    clearToNext()
    onCancel()
  }, [clearTimer, clearToNext, onCancel])

  const speakerName = (ri) => (ri % 2 === 0 ? match.playerA : match.playerB)
  const nextRoundOneBased = betweenAfter == null ? null : betweenAfter + 2
  const phaseLabel = (() => {
    if (status === 'voting') return '¿Quién ganó?'
    if (status === 'ready') return `Ronda 1 de ${totalRounds} · ${match.playerA}`
    if (status === 'between' && nextRoundOneBased != null) {
      return `Cambio — ronda ${nextRoundOneBased} inicia ahora…`
    }
    if (status === 'running') {
      const s = `Ronda ${roundIndex + 1} de ${totalRounds} · ${speakerName(roundIndex)}`
      return paused ? `⏸ Pausado · ${speakerName(roundIndex)}` : s
    }
    return ''
  })()

  const showTimer  = status !== 'voting'
  const showPlay   = status === 'ready'
  const showSongBar = nowPlaying?.title
  const showVoting = status === 'voting' && isTournament

  const aIsCurrent = status === 'ready' || (status === 'running' && roundIndex % 2 === 0)
  const bIsCurrent = status === 'running' && roundIndex % 2 === 1
  const aListoBetween = status === 'between' && betweenAfter % 2 === 0
  const bListoBetween = status === 'between' && betweenAfter % 2 === 1
  const aIsNext     = status === 'between' && (betweenAfter + 1) % 2 === 0
  const bIsNext     = status === 'between' && (betweenAfter + 1) % 2 === 1
  const turn1Active = aIsCurrent
  const turn1Done   = aListoBetween || bIsCurrent || showVoting || aIsNext || (status === 'running' && bIsCurrent)
  const turn2Current = bIsCurrent
  return (
    <div className={`flex flex-col items-center min-h-[calc(100vh-80px)] p-6 gap-5 relative ${showSongBar ? 'pb-20' : ''}`}>

      <div className="w-full flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-semibold transition-colors"
        >
          <ChevronLeft size={16} />
          Regresar
        </button>
        <button
          type="button"
          onClick={toggleMute}
          className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
          aria-label={soundMuted ? 'Activar sonido' : 'Silenciar'}
        >
          {soundMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </div>

      <div className="text-center space-y-1 mt-2">
        {matchNumber != null && totalMatches != null && (
          <p className="text-zinc-500 text-xs font-semibold">
            Batalla {matchNumber}/{totalMatches}
          </p>
        )}
        <h2 className="text-2xl font-black">
          {match.playerA}{' '}
          <span className="text-red-500 text-xl">VS</span>{' '}
          {match.playerB}
        </h2>
        {totalRounds > 1 && status !== 'voting' && (
          <div className="flex items-center justify-center gap-2 mt-1">
            {Array.from({ length: totalRounds }, (_, i) => {
              const isDone = (status === 'between' && i <= betweenAfter) || (status === 'running' && i < roundIndex)
              const isActive = status === 'running' && i === roundIndex
              return (
                <span
                  key={i}
                  className={`rounded-full transition-all duration-300 ${
                    isActive
                      ? 'w-3 h-3 bg-red-500 shadow-sm shadow-red-500/50'
                      : isDone
                        ? 'w-2 h-2 bg-zinc-500'
                        : 'w-2 h-2 bg-zinc-700'
                  }`}
                />
              )
            })}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 w-full max-w-sm mx-auto text-left">
          <div
            className={`rounded-xl border px-3 py-2 relative transition-colors ${
              aIsCurrent
                ? 'border-red-500/70 bg-red-500/10 ring-1 ring-red-500/40'
                : aIsNext
                  ? 'border-red-500/40 bg-red-500/5 ring-1 ring-red-500/30'
                  : turn1Done
                    ? 'border-zinc-700 bg-zinc-900/80 opacity-80'
                    : 'border-zinc-800 bg-zinc-900/50'
            }`}
          >
            {aIsCurrent && <span className="absolute inset-0 rounded-xl ring-2 ring-red-500/25 animate-pulse pointer-events-none" />}
            <p className="text-[10px] font-black uppercase tracking-widest text-red-400/90">1.º en salir</p>
            <p className="text-sm font-bold text-white leading-tight truncate" title={match.playerA}>
              {match.playerA}
            </p>
            {turn1Active && <p className="text-[10px] text-red-300/80 font-semibold mt-0.5">Turno actual</p>}
            {aIsNext && <p className="text-[10px] text-red-300/80 font-semibold mt-0.5">Siguiente</p>}
            {!aIsNext && (aListoBetween || (status === 'running' && bIsCurrent)) && (
              <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Listo</p>
            )}
            {showVoting && <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Listo</p>}
          </div>
          <div
            className={`rounded-xl border px-3 py-2 relative transition-colors ${
              showVoting
                ? 'border-zinc-700 bg-zinc-900/80 opacity-90'
                : bIsNext
                  ? 'border-amber-500/50 bg-amber-500/10 ring-1 ring-amber-500/40'
                  : turn2Current
                    ? 'border-amber-500/70 bg-amber-500/10 ring-1 ring-amber-500/40'
                    : turn1Active || aIsNext
                      ? 'border-amber-500/30 bg-amber-500/5'
                      : 'border-zinc-800 bg-zinc-900/50'
            }`}
          >
            {turn2Current && <span className="absolute inset-0 rounded-xl ring-2 ring-amber-500/25 animate-pulse pointer-events-none" />}
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-400/90">2.º en salir</p>
            <p className="text-sm font-bold text-white leading-tight truncate" title={match.playerB}>
              {match.playerB}
            </p>
            {turn2Current && (
              <p className="text-[10px] text-amber-200/80 font-semibold mt-0.5">Turno actual</p>
            )}
            {bIsNext && <p className="text-[10px] text-amber-300/80 font-semibold mt-0.5">Siguiente</p>}
            {bListoBetween && <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Listo</p>}
            {(status === 'ready' || (status === 'running' && roundIndex % 2 === 0)) && (
              <p className="text-[10px] text-zinc-500 font-medium mt-0.5">Después</p>
            )}
            {showVoting && (
              <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Listo</p>
            )}
          </div>
        </div>
        {status === 'between' ? (
          <div className="flex flex-col items-center gap-1.5 pt-1">
            <p className="text-amber-300/90 text-sm font-semibold animate-pulse">{phaseLabel}</p>
            <div className="flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 bg-amber-400/70 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        ) : (
          <p className="text-zinc-400 text-sm pt-0.5">{phaseLabel}</p>
        )}
      </div>

      {showTimer && (
        <TimerCircle
          seconds={timeLeft}
          total={roundTime}
          paused={paused}
          onClick={isRunning ? handlePauseResume : undefined}
        />
      )}

      {status === 'between' && (
        <button
          type="button"
          onClick={goBackToRound1}
          className="flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20 transition-colors"
        >
          <Undo2 size={16} />
          Volver a ronda 1
        </button>
      )}

      {isRunning && (
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-md">
          {roundIndex > 0 && (
            <button
              type="button"
              onClick={goBackToRound1}
              title="Reiniciar batalla desde ronda 1"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-600 bg-zinc-900/80 text-zinc-200 hover:border-zinc-500 text-xs font-semibold transition-colors"
            >
              <Undo2 size={14} />
              A ronda 1
            </button>
          )}
          <button
            type="button"
            onClick={handleRestartPhase}
            title="Reiniciar ronda"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
          >
            <RotateCcw size={14} /> Reiniciar
          </button>

          <button
            type="button"
            onClick={handlePauseResume}
            title={paused ? 'Reanudar' : 'Pausar'}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              paused
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-600/80'
            }`}
          >
            {paused ? <Play size={14} fill="currentColor" /> : <Pause size={14} fill="currentColor" />}
            {paused ? 'Reanudar' : 'Pausar'}
          </button>

          <button
            type="button"
            onClick={() => addTime(-5)}
            title="-5 segundos"
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
          >
            <Minus size={13} />5s
          </button>

          <button
            type="button"
            onClick={() => addTime(5)}
            title="+5 segundos"
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
          >
            <Plus size={13} />5s
          </button>

          <button
            type="button"
            onClick={handleSkipPhase}
            title="Terminar ronda ahora"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-orange-700/50 text-orange-400 text-xs font-semibold transition-colors"
          >
            <SkipForward size={14} /> Terminar
          </button>
        </div>
      )}

      {showPlay && (
        <button
          type="button"
          onClick={handlePlay}
          className="flex items-center gap-3 bg-red-500 hover:bg-red-600 active:scale-95 px-10 py-4 rounded-2xl font-black text-xl transition-all"
        >
          <Play size={24} fill="white" />
          {totalRounds > 1 ? 'INICIAR RONDA 1' : 'INICIAR BATALLA'}
        </button>
      )}

      {isRunning && !paused && (
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 bg-red-500 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      )}

      {status === 'voting' && isTournament && (
        <div className="w-full max-w-sm space-y-3">
          <p className="text-center text-zinc-400 text-sm mb-1">
            Selecciona el resultado de la batalla
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4 text-[11px]">
            <button
              type="button"
              onClick={goBackToRound1}
              className="px-2.5 py-1.5 rounded-lg border border-zinc-600 text-zinc-400 hover:text-white hover:border-zinc-500 font-semibold"
            >
              Ajustar: desde ronda 1
            </button>
            {totalRounds > 0 && (
              <button
                type="button"
                onClick={replayLastFromVoting}
                className="px-2.5 py-1.5 rounded-lg border border-zinc-600 text-zinc-400 hover:text-white hover:border-zinc-500 font-semibold"
              >
                {totalRounds > 1 ? 'Ajustar: repetir última ronda' : 'Ajustar: repetir ronda'}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleVote('A')}
            className="w-full flex items-center justify-between bg-zinc-800 hover:bg-blue-600/30 border border-zinc-700 hover:border-blue-500 rounded-2xl px-6 py-5 transition-colors"
          >
            <div className="text-left">
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Ganador</p>
              <p className="text-white font-black text-xl mt-0.5">{match.playerA}</p>
            </div>
            <div className="flex flex-col items-end gap-0.5 text-blue-400">
              <Trophy size={20} />
              <span className="font-black text-sm">3 pts</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleVote('B')}
            className="w-full flex items-center justify-between bg-zinc-800 hover:bg-blue-600/30 border border-zinc-700 hover:border-blue-500 rounded-2xl px-6 py-5 transition-colors"
          >
            <div className="text-left">
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Ganador</p>
              <p className="text-white font-black text-xl mt-0.5">{match.playerB}</p>
            </div>
            <div className="flex flex-col items-end gap-0.5 text-blue-400">
              <Trophy size={20} />
              <span className="font-black text-sm">3 pts</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleVote('draw')}
            className="w-full flex items-center justify-between bg-zinc-800 hover:bg-amber-600/20 border border-zinc-700 hover:border-amber-500 rounded-2xl px-6 py-5 transition-colors"
          >
            <div className="text-left">
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Resultado</p>
              <p className="text-white font-black text-xl mt-0.5">Empate</p>
            </div>
            <div className="flex flex-col items-end gap-0.5 text-amber-400">
              <Minus size={20} />
              <span className="font-black text-sm">1 pt c/u</span>
            </div>
          </button>
        </div>
      )}

      {showSongBar && (
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur border-t border-zinc-800 px-4 py-2.5 flex items-center gap-3 z-20">
          <Music2 size={14} className="text-green-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate leading-tight">{nowPlaying.title}</p>
            {nowPlaying.subtitle && (
              <p className="text-zinc-500 text-[10px] truncate leading-tight">{nowPlaying.subtitle}</p>
            )}
          </div>
          {onNextSong && (
            <button
              type="button"
              onClick={onNextSong}
              title="Siguiente en la cola"
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors shrink-0"
            >
              <SkipForward size={15} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

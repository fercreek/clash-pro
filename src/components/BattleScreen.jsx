import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Play, Pause, Trophy, Minus, Volume2, VolumeX,
  ChevronLeft, RotateCcw, SkipForward, Plus, Music2,
} from 'lucide-react'
import {
  useCountdownBeeps,
  loadSoundMuted,
  saveSoundMuted,
} from '../hooks/useCountdownBeeps'

const PHASE = {
  ROUND1_READY:   'round1_ready',
  ROUND1_RUNNING: 'round1_running',
  ROUND1_DONE:    'round1_done',
  ROUND2_RUNNING: 'round2_running',
  VOTING:         'voting',
}

// ── Círculo de cuenta regresiva ───────────────────────────────────────────────
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

export default function BattleScreen({ match, roundTime, onBattleEnd, onCancel, nowPlaying, onNextSong, onRoundStart, matchNumber, totalMatches }) {
  const [phase, setPhase]         = useState(PHASE.ROUND1_READY)
  const [timeLeft, setTimeLeft]   = useState(roundTime)
  const [paused, setPaused]       = useState(false)
  const [soundMuted, setSoundMuted] = useState(loadSoundMuted)
  const intervalRef = useRef(null)
  const onEndRef    = useRef(null)

  const isRunning      = phase === PHASE.ROUND1_RUNNING || phase === PHASE.ROUND2_RUNNING
  const isCountingDown = isRunning && !paused

  const { unlock, playBell } = useCountdownBeeps({ timeLeft, isCountingDown, muted: soundMuted })

  const clearTimer = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
  }, [])

  // Retoma desde timeLeft actual
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

  // Reinicia y corre desde roundTime
  const startCountdown = useCallback((onEnd) => {
    setTimeLeft(roundTime)
    setPaused(false)
    setTimeout(() => runInterval(onEnd), 0)
  }, [roundTime, runInterval])

  const handlePauseResume = useCallback(() => {
    if (paused) { setPaused(false); runInterval(onEndRef.current) }
    else        { clearTimer(); setPaused(true) }
  }, [paused, clearTimer, runInterval])

  // +N segundos al tiempo restante
  const addTime = useCallback((secs) => {
    setTimeLeft((prev) => Math.min(prev + secs, roundTime * 2))
  }, [roundTime])

  // Reiniciar la fase actual
  const handleRestartPhase = useCallback(() => {
    clearTimer()
    setPaused(false)
    setTimeLeft(roundTime)
    setTimeout(() => runInterval(onEndRef.current), 0)
  }, [clearTimer, roundTime, runInterval])

  // Terminar la fase actual de forma manual
  const handleSkipPhase = useCallback(() => {
    clearTimer()
    setPaused(false)
    onEndRef.current?.()
  }, [clearTimer])

  useEffect(() => () => clearTimer(), [clearTimer])

  const toggleMute = useCallback(() => {
    setSoundMuted((m) => { const next = !m; saveSoundMuted(next); return next })
  }, [])

  const handlePlay = useCallback(() => {
    unlock()
    playBell()
    onRoundStart?.()   // auto-avanza canción en la cola
    if (phase === PHASE.ROUND1_READY) {
      setPhase(PHASE.ROUND1_RUNNING)
      startCountdown(() => setPhase(PHASE.ROUND1_DONE))
    } else if (phase === PHASE.ROUND1_DONE) {
      setPhase(PHASE.ROUND2_RUNNING)
      playBell()
      startCountdown(() => setPhase(PHASE.VOTING))
    }
  }, [phase, startCountdown, unlock, playBell, onRoundStart])

  const handleVote = useCallback((result) => onBattleEnd(match.id, result), [match.id, onBattleEnd])
  const handleBack = useCallback(() => { clearTimer(); onCancel() }, [clearTimer, onCancel])

  const phaseLabel = {
    [PHASE.ROUND1_READY]:   `Ronda 1 · ${match.playerA}`,
    [PHASE.ROUND1_RUNNING]: paused ? `⏸ Pausado · ${match.playerA}` : `Ronda 1 · ${match.playerA}`,
    [PHASE.ROUND1_DONE]:    `✓ R1 terminada — prepara ${match.playerB}`,
    [PHASE.ROUND2_RUNNING]: paused ? `⏸ Pausado · ${match.playerB}` : `Ronda 2 · ${match.playerB}`,
    [PHASE.VOTING]:         '¿Quién ganó?',
  }[phase]

  const showTimer  = phase !== PHASE.VOTING
  const showPlay   = phase === PHASE.ROUND1_READY || phase === PHASE.ROUND1_DONE
  const showSongBar = nowPlaying?.title

  return (
    <div className={`flex flex-col items-center min-h-[calc(100vh-80px)] p-6 gap-5 relative ${showSongBar ? 'pb-20' : ''}`}>

      {/* Fila superior: regresar + mute */}
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

      {/* Nombres */}
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
        <p className="text-zinc-400 text-sm">{phaseLabel}</p>
      </div>

      {/* Círculo — tap para pausar/reanudar */}
      {showTimer && (
        <TimerCircle
          seconds={timeLeft}
          total={roundTime}
          paused={paused}
          onClick={isRunning ? handlePauseResume : undefined}
        />
      )}

      {/* Controles manuales (solo cuando corre o pausado) */}
      {isRunning && (
        <div className="flex items-center gap-2">
          {/* Reiniciar fase */}
          <button
            type="button"
            onClick={handleRestartPhase}
            title="Reiniciar ronda"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
          >
            <RotateCcw size={14} /> Reiniciar
          </button>

          {/* +10 segundos */}
          <button
            type="button"
            onClick={() => addTime(10)}
            title="+10 segundos"
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
          >
            <Plus size={13} />10s
          </button>

          {/* Terminar ronda */}
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

      {/* Botón principal: INICIAR */}
      {showPlay && (
        <button
          type="button"
          onClick={handlePlay}
          className="flex items-center gap-3 bg-red-500 hover:bg-red-600 active:scale-95 px-10 py-4 rounded-2xl font-black text-xl transition-all"
        >
          <Play size={24} fill="white" />
          {phase === PHASE.ROUND1_READY ? 'INICIAR RONDA 1' : 'INICIAR RONDA 2'}
        </button>
      )}

      {/* Bouncing dots cuando corre */}
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

      {/* Votación */}
      {phase === PHASE.VOTING && (
        <div className="w-full max-w-sm space-y-3">
          <p className="text-center text-zinc-400 text-sm mb-4">
            Selecciona el resultado de la batalla
          </p>

          <button
            type="button"
            onClick={() => handleVote('A')}
            className="w-full flex items-center justify-between bg-zinc-800 hover:bg-blue-600/30 border border-zinc-700 hover:border-blue-500 rounded-xl px-5 py-4 transition-colors"
          >
            <div className="text-left">
              <p className="text-xs text-zinc-400 uppercase tracking-widest">Ganador</p>
              <p className="text-white font-bold text-lg">{match.playerA}</p>
            </div>
            <div className="flex items-center gap-1 text-blue-400 font-black text-xl">
              <Trophy size={18} /> 3 pts
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleVote('B')}
            className="w-full flex items-center justify-between bg-zinc-800 hover:bg-blue-600/30 border border-zinc-700 hover:border-blue-500 rounded-xl px-5 py-4 transition-colors"
          >
            <div className="text-left">
              <p className="text-xs text-zinc-400 uppercase tracking-widest">Ganador</p>
              <p className="text-white font-bold text-lg">{match.playerB}</p>
            </div>
            <div className="flex items-center gap-1 text-blue-400 font-black text-xl">
              <Trophy size={18} /> 3 pts
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleVote('draw')}
            className="w-full flex items-center justify-between bg-zinc-800 hover:bg-amber-600/20 border border-zinc-700 hover:border-amber-500 rounded-xl px-5 py-4 transition-colors"
          >
            <div className="text-left">
              <p className="text-xs text-zinc-400 uppercase tracking-widest">Resultado</p>
              <p className="text-white font-bold text-lg">Empate</p>
            </div>
            <div className="flex items-center gap-1 text-amber-400 font-black text-xl">
              <Minus size={18} /> 1 pt c/u
            </div>
          </button>
        </div>
      )}

      {/* ── Mini barra de canción (bottom sticky) ─────────────────────────── */}
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

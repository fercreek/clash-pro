import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Trophy, Minus, Volume2, VolumeX } from 'lucide-react'
import {
  useCountdownBeeps,
  loadSoundMuted,
  saveSoundMuted,
} from '../hooks/useCountdownBeeps'

const PHASE = {
  ROUND1_READY: 'round1_ready',
  ROUND1_RUNNING: 'round1_running',
  ROUND1_DONE: 'round1_done',
  ROUND2_RUNNING: 'round2_running',
  VOTING: 'voting',
}

function TimerDisplay({ seconds, total }) {
  const pct = total > 0 ? seconds / total : 0
  const isUrgent = seconds <= 10

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={`relative flex items-center justify-center rounded-full transition-all duration-500 ease-out ${
          isUrgent ? 'ring-2 ring-red-500/60 shadow-lg shadow-red-500/20' : ''
        }`}
        style={{
          width: 180,
          height: 180,
          background: `conic-gradient(
            ${isUrgent ? '#ef4444' : '#f97316'} ${pct * 360}deg,
            #27272a ${pct * 360}deg
          )`,
        }}
      >
        <div className="absolute inset-3 bg-zinc-950 rounded-full flex items-center justify-center overflow-hidden">
          <div className={isUrgent ? 'animate-pulse' : ''}>
            <span
              key={seconds}
              className={`text-5xl font-black tabular-nums animate-digitPop inline-block ${
                isUrgent ? 'text-red-500' : 'text-white'
              }`}
            >
              {String(seconds).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BattleScreen({ match, roundTime, onBattleEnd }) {
  const [phase, setPhase] = useState(PHASE.ROUND1_READY)
  const [timeLeft, setTimeLeft] = useState(roundTime)
  const [soundMuted, setSoundMuted] = useState(loadSoundMuted)
  const intervalRef = useRef(null)

  const isCountingDown =
    phase === PHASE.ROUND1_RUNNING || phase === PHASE.ROUND2_RUNNING

  const { unlock } = useCountdownBeeps({
    timeLeft,
    isCountingDown,
    muted: soundMuted,
  })

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const startCountdown = useCallback(
    (onEnd) => {
      clearTimer()
      setTimeLeft(roundTime)
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
            onEnd()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    },
    [roundTime, clearTimer]
  )

  useEffect(() => {
    return () => clearTimer()
  }, [clearTimer])

  const toggleMute = useCallback(() => {
    setSoundMuted((m) => {
      const next = !m
      saveSoundMuted(next)
      return next
    })
  }, [])

  const handlePlay = useCallback(() => {
    unlock()
    if (phase === PHASE.ROUND1_READY) {
      setPhase(PHASE.ROUND1_RUNNING)
      startCountdown(() => setPhase(PHASE.ROUND1_DONE))
    } else if (phase === PHASE.ROUND1_DONE) {
      setPhase(PHASE.ROUND2_RUNNING)
      startCountdown(() => setPhase(PHASE.VOTING))
    }
  }, [phase, startCountdown, unlock])

  const handleVote = useCallback(
    (result) => {
      onBattleEnd(match.id, result)
    },
    [match.id, onBattleEnd]
  )

  const round1Label = `Ronda 1 · ${match.playerA}`
  const round2Label = `Ronda 2 · ${match.playerB}`

  const phaseLabel = {
    [PHASE.ROUND1_READY]: round1Label,
    [PHASE.ROUND1_RUNNING]: round1Label,
    [PHASE.ROUND1_DONE]: `✓ R1 terminada — prepara ${match.playerB}`,
    [PHASE.ROUND2_RUNNING]: round2Label,
    [PHASE.VOTING]: '¿Quién ganó?',
  }[phase]

  const showTimer = [
    PHASE.ROUND1_READY,
    PHASE.ROUND1_RUNNING,
    PHASE.ROUND1_DONE,
    PHASE.ROUND2_RUNNING,
  ].includes(phase)

  const showPlay =
    phase === PHASE.ROUND1_READY || phase === PHASE.ROUND1_DONE

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-6 gap-8 relative">
      <button
        type="button"
        onClick={toggleMute}
        className="absolute top-4 right-4 p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
        aria-label={soundMuted ? 'Activar sonido' : 'Silenciar'}
      >
        {soundMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>

      <div className="text-center space-y-1">
        <h2 className="text-2xl font-black">
          {match.playerA}{' '}
          <span className="text-red-500 text-xl">VS</span>{' '}
          {match.playerB}
        </h2>
        <p className="text-zinc-400 text-sm">{phaseLabel}</p>
      </div>

      {showTimer && (
        <TimerDisplay
          seconds={timeLeft}
          total={roundTime}
        />
      )}

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

      {(phase === PHASE.ROUND1_RUNNING || phase === PHASE.ROUND2_RUNNING) && (
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
              <Trophy size={18} />
              3 pts
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
              <Trophy size={18} />
              3 pts
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
              <Minus size={18} />
              1 pt c/u
            </div>
          </button>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  ChevronLeft, Dumbbell, Play, Pause, RotateCcw,
  CheckCircle, Volume2, VolumeX, Music2,
} from 'lucide-react'
import { ROUTINES, LEVEL_LABELS, LEVEL_COLORS, BLOCK_TYPE_COLORS } from '../data/practiceRoutines'
import { INSTRUMENTS, PATTERNS, MIN_BPM, MAX_BPM } from '../data/rhythmPatterns'
import { useRhythmEngine } from '../hooks/useRhythmEngine'
import { useCountdownBeeps, loadSoundMuted, saveSoundMuted } from '../hooks/useCountdownBeeps'

// ── Formato mm:ss ─────────────────────────────────────────────────────────────
function fmtTime(secs) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// ── Vista de Rutina activa ────────────────────────────────────────────────────
function RoutineRunner({ routine, onBack }) {
  const [blockIdx, setBlockIdx]   = useState(0)
  const [timeLeft, setTimeLeft]   = useState(routine.blocks[0].duration)
  const [running, setRunning]     = useState(false)
  const [done, setDone]           = useState(false)
  const [soundMuted, setSoundMuted] = useState(loadSoundMuted)
  const intervalRef = useRef(null)

  const block = routine.blocks[blockIdx]
  const isLast = blockIdx === routine.blocks.length - 1

  const { playBell, playRoundEnd, playParticipantChange } = useCountdownBeeps({
    timeLeft,
    isCountingDown: running,
    muted: soundMuted,
  })

  const toggleMute = useCallback(() => {
    setSoundMuted((m) => { const next = !m; saveSoundMuted(next); return next })
  }, [])

  const clearTimer = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
  }, [])

  const advance = useCallback(() => {
    clearTimer()
    setRunning(false)
    if (isLast) {
      playRoundEnd()
      setDone(true)
    } else {
      playParticipantChange()
      setBlockIdx((i) => i + 1)
      setTimeLeft(routine.blocks[blockIdx + 1].duration)
    }
  }, [clearTimer, isLast, blockIdx, routine.blocks, playRoundEnd, playParticipantChange])

  const startTimer = useCallback(() => {
    setRunning(true)
    playBell()
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { advance(); return 0 }
        return prev - 1
      })
    }, 1000)
  }, [playBell, advance])

  const pauseTimer = useCallback(() => {
    clearTimer()
    setRunning(false)
  }, [clearTimer])

  const handleToggle = useCallback(() => {
    if (running) pauseTimer()
    else startTimer()
  }, [running, pauseTimer, startTimer])

  const handleSkip = useCallback(() => {
    clearTimer()
    setRunning(false)
    advance()
  }, [clearTimer, advance])

  const handleRestart = useCallback(() => {
    clearTimer()
    setRunning(false)
    setBlockIdx(0)
    setTimeLeft(routine.blocks[0].duration)
    setDone(false)
  }, [clearTimer, routine.blocks])

  useEffect(() => () => clearTimer(), [clearTimer])

  const pct = block ? timeLeft / block.duration : 0

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 px-6 text-center">
        <CheckCircle size={56} className="text-green-400" />
        <div>
          <p className="text-2xl font-black text-white">Sesión completada</p>
          <p className="text-zinc-500 text-sm mt-1">{routine.title}</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleRestart}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm transition-colors"
          >
            <RotateCcw size={16} /> Repetir
          </button>
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-colors"
          >
            Terminar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-4">
      {/* Progress bar across blocks */}
      <div className="flex gap-1">
        {routine.blocks.map((b, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < blockIdx ? 'bg-red-500' : i === blockIdx ? 'bg-red-500/50' : 'bg-zinc-800'
            }`}
          />
        ))}
      </div>

      {/* Block info */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">
            Bloque {blockIdx + 1}/{routine.blocks.length}
          </p>
          <h2 className="text-xl font-black text-white">{block.name}</h2>
        </div>
        <button type="button" onClick={toggleMute}
          className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
          {soundMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

      {/* Timer circle */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleToggle}
          className="relative flex items-center justify-center rounded-full select-none active:scale-95 transition-transform"
          style={{
            width: 160,
            height: 160,
            background: `conic-gradient(
              ${running ? '#ef4444' : '#f97316'} ${pct * 360}deg,
              #27272a ${pct * 360}deg
            )`,
          }}
        >
          <div className="absolute inset-3 bg-zinc-950 rounded-full flex flex-col items-center justify-center">
            <span className="text-4xl font-black tabular-nums text-white">{fmtTime(timeLeft)}</span>
            <span className="text-[10px] text-zinc-500 mt-0.5">{running ? 'TAP = PAUSAR' : 'TAP = INICIAR'}</span>
          </div>
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-2">Instrucciones</p>
        <p className="text-sm text-zinc-300 leading-relaxed">{block.instructions}</p>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleToggle}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-colors ${
            running
              ? 'bg-zinc-800 hover:bg-zinc-700 text-white'
              : 'bg-red-600 hover:bg-red-500 text-white'
          }`}
        >
          {running ? <><Pause size={16} /> Pausar</> : <><Play size={16} fill="currentColor" /> Iniciar</>}
        </button>
        <button
          type="button"
          onClick={handleSkip}
          disabled={isLast && running === false}
          className="px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-semibold transition-colors disabled:opacity-30"
        >
          {isLast ? 'Terminar' : 'Siguiente'}
        </button>
        <button
          type="button"
          onClick={handleRestart}
          className="px-3 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors"
          title="Reiniciar desde el principio"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Upcoming blocks */}
      {blockIdx < routine.blocks.length - 1 && (
        <div className="space-y-1">
          <p className="text-xs text-zinc-600 font-semibold uppercase tracking-wider">Siguientes</p>
          {routine.blocks.slice(blockIdx + 1).map((b, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-zinc-600 px-1">
              <span className="w-12 shrink-0 text-right tabular-nums">{fmtTime(b.duration)}</span>
              <span className="truncate">{b.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Rhythm Trainer ────────────────────────────────────────────────────────────
function RhythmTrainer() {
  const [patternKey, setPatternKey] = useState('basic')
  const {
    isPlaying, currentStep, bpm, muted,
    toggle, setBpm, setPattern, toggleMute, STEPS,
  } = useRhythmEngine(PATTERNS[patternKey])

  const switchPattern = useCallback((key) => {
    setPatternKey(key)
    setPattern(PATTERNS[key])
  }, [setPattern])

  return (
    <div className="px-4 py-4 space-y-5">
      <div>
        <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">Nivel de patrón</p>
        <div className="flex gap-2">
          {Object.entries(PATTERNS).map(([key, p]) => (
            <button
              key={key}
              type="button"
              onClick={() => switchPattern(key)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                patternKey === key
                  ? 'bg-red-500/20 border-red-500/50 text-red-400'
                  : 'border-zinc-700 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* BPM */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Tempo</p>
          <span className="text-white font-black text-lg tabular-nums">{bpm} BPM</span>
        </div>
        <input
          type="range"
          min={MIN_BPM}
          max={MAX_BPM}
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          className="w-full accent-red-500"
        />
        <div className="flex justify-between text-[10px] text-zinc-600 mt-0.5">
          <span>{MIN_BPM}</span><span>{MAX_BPM}</span>
        </div>
      </div>

      {/* Step visualizer */}
      <div className="grid grid-cols-16 gap-0.5" style={{ gridTemplateColumns: `repeat(${STEPS}, 1fr)` }}>
        {Array.from({ length: STEPS }).map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-sm transition-colors ${
              i === currentStep && isPlaying ? 'bg-red-500' : 'bg-zinc-800'
            }`}
          />
        ))}
      </div>

      {/* Play/Stop */}
      <button
        type="button"
        onClick={toggle}
        className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-base transition-colors ${
          isPlaying
            ? 'bg-zinc-800 hover:bg-zinc-700 text-white'
            : 'bg-red-600 hover:bg-red-500 text-white'
        }`}
      >
        {isPlaying ? <><Pause size={20} /> Parar</> : <><Play size={20} fill="currentColor" /> Iniciar ritmo</>}
      </button>

      {/* Instrument toggles */}
      <div>
        <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">Instrumentos</p>
        <div className="space-y-2">
          {INSTRUMENTS.map((inst) => {
            const pattern = PATTERNS[patternKey]
            const hasHits = pattern?.[inst.id]?.some(Boolean)
            const isMuted = muted[inst.id]
            return (
              <div key={inst.id} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleMute(inst.id)}
                  className={`w-8 h-8 shrink-0 rounded-lg border flex items-center justify-center transition-colors ${
                    isMuted
                      ? 'border-zinc-700 bg-zinc-800 text-zinc-600'
                      : 'border-red-500/50 bg-red-500/10 text-red-400'
                  }`}
                  title={isMuted ? 'Activar' : 'Silenciar'}
                >
                  {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
                <span className={`text-sm font-semibold ${isMuted ? 'text-zinc-600' : 'text-zinc-300'}`}>
                  {inst.label}
                </span>
                {/* Mini step pattern */}
                <div className="flex-1 flex gap-0.5">
                  {(pattern?.[inst.id] ?? []).map((hit, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-2 rounded-sm ${
                        hit
                          ? i === currentStep && isPlaying
                            ? 'bg-red-500'
                            : isMuted ? 'bg-zinc-700' : 'bg-red-500/60'
                          : 'bg-zinc-800'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <p className="text-zinc-600 text-[11px] text-center leading-relaxed">
        Usa este ritmo mientras practicas tus shines y footwork para entrenar tu oído.
      </p>
    </div>
  )
}

// ── GuiaScreen principal ──────────────────────────────────────────────────────
export default function GuiaScreen({ onBack }) {
  const [tab, setTab]           = useState('rutinas') // 'rutinas' | 'ritmo'
  const [activeRoutine, setActiveRoutine] = useState(null)

  if (activeRoutine) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <div className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur border-b border-zinc-800">
          <div className="flex items-center gap-3 px-4 py-3">
            <button type="button" onClick={() => setActiveRoutine(null)}
              className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors">
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-sm font-black truncate">{activeRoutine.title}</h1>
          </div>
        </div>
        <RoutineRunner routine={activeRoutine} onBack={() => setActiveRoutine(null)} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur border-b border-zinc-800">
        <div className="flex items-center gap-3 px-4 py-3">
          <button type="button" onClick={onBack}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Dumbbell size={18} className="text-orange-400" />
            <h1 className="text-base font-black">Práctica Guiada</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800">
          <button type="button" onClick={() => setTab('rutinas')}
            className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
              tab === 'rutinas' ? 'text-white border-b-2 border-red-500' : 'text-zinc-500 hover:text-zinc-300'
            }`}>
            <Dumbbell size={13} /> Rutinas
          </button>
          <button type="button" onClick={() => setTab('ritmo')}
            className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
              tab === 'ritmo' ? 'text-white border-b-2 border-red-500' : 'text-zinc-500 hover:text-zinc-300'
            }`}>
            <Music2 size={13} /> Ritmo
          </button>
        </div>
      </div>

      {/* Routines tab */}
      {tab === 'rutinas' && (
        <div className="px-4 py-4 space-y-3 max-w-2xl mx-auto">
          <p className="text-zinc-500 text-xs leading-relaxed">
            Sesiones estructuradas con temporizador por bloque y señales de audio. Como el gym, pero para la pista.
          </p>
          {ROUTINES.map((routine) => (
            <button
              key={routine.id}
              type="button"
              onClick={() => setActiveRoutine(routine)}
              className="w-full text-left bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-4 transition-all active:scale-[0.99] group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${LEVEL_COLORS[routine.level]}`}>
                      {LEVEL_LABELS[routine.level]}
                    </span>
                    <span className="text-[10px] text-zinc-600">{routine.duration} min</span>
                    <span className="text-[10px] text-zinc-600">·</span>
                    <span className="text-[10px] text-zinc-600">{routine.blocks.length} bloques</span>
                  </div>
                  <h2 className="text-sm font-black text-white mb-1 group-hover:text-orange-400 transition-colors">
                    {routine.title}
                  </h2>
                  <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">
                    {routine.description}
                  </p>
                </div>
                <Play size={18} className="text-zinc-700 group-hover:text-orange-400 shrink-0 mt-1 transition-colors" fill="currentColor" />
              </div>

              {/* Block preview */}
              <div className="flex gap-1 mt-3">
                {routine.blocks.map((b, i) => (
                  <div key={i} className="flex-1 text-center">
                    <div className="h-1 rounded-full bg-zinc-800 mb-1" />
                    <span className="text-[9px] text-zinc-600 leading-none">{fmtTime(b.duration)}</span>
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Rhythm tab */}
      {tab === 'ritmo' && (
        <div className="max-w-2xl mx-auto">
          <div className="px-4 pt-4 pb-2">
            <p className="text-zinc-500 text-xs leading-relaxed">
              Secuenciador de percusión salsa. Practica tus shines y footwork mientras entrenas el oído. Inspirado en Salsa Rhythm y Percusión Salsa.
            </p>
          </div>
          <RhythmTrainer />
        </div>
      )}
    </div>
  )
}

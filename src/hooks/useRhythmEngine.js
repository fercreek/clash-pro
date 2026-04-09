import { useRef, useState, useCallback, useEffect } from 'react'
import { INSTRUMENTS, PATTERNS, DEFAULT_BPM } from '../data/rhythmPatterns'

const STEPS = 16

function getAudioContext() {
  const Ctx = window.AudioContext || window.webkitAudioContext
  return Ctx ? new Ctx() : null
}

export function useRhythmEngine() {
  const ctxRef       = useRef(null)
  const timerRef     = useRef(null)
  const stepRef      = useRef(0)
  const bpmRef       = useRef(DEFAULT_BPM)
  const patternRef   = useRef('basic')
  const mutedRef     = useRef({})        // { instrumentId: boolean }
  const isPlayingRef = useRef(false)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [bpm, setBpmState] = useState(DEFAULT_BPM)
  const [patternKey, setPatternKey] = useState('basic')
  const [muted, setMuted] = useState({})   // reactive copy of mutedRef

  // Keep refs in sync
  useEffect(() => { bpmRef.current = bpm }, [bpm])
  useEffect(() => { patternRef.current = patternKey }, [patternKey])
  useEffect(() => { mutedRef.current = muted }, [muted])

  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = getAudioContext()
    if (ctxRef.current?.state === 'suspended') ctxRef.current.resume().catch(() => {})
    return ctxRef.current
  }, [])

  const playStep = useCallback((step, scheduledTime) => {
    const ctx = ctxRef.current
    if (!ctx) return
    const pattern = PATTERNS[patternRef.current]
    if (!pattern) return

    INSTRUMENTS.forEach(({ id, freq, type, gain, dur }) => {
      if (!pattern[id]?.[step]) return
      if (mutedRef.current[id]) return

      const osc  = ctx.createOscillator()
      const g    = ctx.createGain()
      osc.connect(g)
      g.connect(ctx.destination)
      osc.type = type
      osc.frequency.value = freq
      g.gain.setValueAtTime(gain, scheduledTime)
      g.gain.exponentialRampToValueAtTime(0.0001, scheduledTime + dur)
      osc.start(scheduledTime)
      osc.stop(scheduledTime + dur + 0.01)
    })
  }, [])

  const scheduleAhead = useCallback(() => {
    const ctx = ctxRef.current
    if (!ctx || !isPlayingRef.current) return

    const secondsPerStep = 60 / bpmRef.current / 4  // 16 steps per bar = 4 per beat
    const lookAhead = 0.1   // schedule 100ms ahead
    const scheduleTime = ctx.currentTime

    let step = stepRef.current
    let t = scheduleTime

    while (t < scheduleTime + lookAhead) {
      playStep(step, t)
      setCurrentStep(step)
      step = (step + 1) % STEPS
      t += secondsPerStep
    }
    stepRef.current = step

    timerRef.current = setTimeout(scheduleAhead, 50)
  }, [playStep])

  const start = useCallback(() => {
    const ctx = ensureCtx()
    if (!ctx) return
    isPlayingRef.current = true
    stepRef.current = 0
    setIsPlaying(true)
    scheduleAhead()
  }, [ensureCtx, scheduleAhead])

  const stop = useCallback(() => {
    isPlayingRef.current = false
    clearTimeout(timerRef.current)
    setIsPlaying(false)
    setCurrentStep(-1)
    stepRef.current = 0
  }, [])

  const toggle = useCallback(() => {
    if (isPlayingRef.current) stop()
    else start()
  }, [start, stop])

  const setBpm = useCallback((val) => {
    setBpmState(Math.max(50, Math.min(160, val)))
  }, [])

  const setPattern = useCallback((key) => {
    setPatternKey(key)
    if (isPlayingRef.current) {
      // restart to apply new pattern immediately
      stop()
      setTimeout(start, 50)
    }
  }, [stop, start])

  const toggleMute = useCallback((id) => {
    setMuted((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  // Cleanup on unmount
  useEffect(() => () => {
    isPlayingRef.current = false
    clearTimeout(timerRef.current)
  }, [])

  return {
    isPlaying,
    currentStep,
    bpm,
    patternKey,
    muted,
    toggle,
    setBpm,
    setPattern,
    toggleMute,
    STEPS,
  }
}

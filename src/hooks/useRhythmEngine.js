import { useRef, useState, useCallback, useEffect } from 'react'
import { INSTRUMENTS, DEFAULT_BPM, INSTRUMENT_SYNTHS } from '../data/rhythmPatterns'

const STEPS = 16

function getAudioContext() {
  const Ctx = window.AudioContext || window.webkitAudioContext
  return Ctx ? new Ctx() : null
}

export function useRhythmEngine(initialPattern = null, initialBpm = DEFAULT_BPM) {
  const ctxRef       = useRef(null)
  const timerRef     = useRef(null)
  const stepRef      = useRef(0)
  const bpmRef       = useRef(initialBpm)
  const patternRef   = useRef(initialPattern)
  const mutedRef     = useRef({})
  const isPlayingRef = useRef(false)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [bpm, setBpmState] = useState(initialBpm)
  const [pattern, setPatternState] = useState(initialPattern)
  const [muted, setMuted] = useState({})

  useEffect(() => { bpmRef.current = bpm }, [bpm])
  useEffect(() => { patternRef.current = pattern }, [pattern])
  useEffect(() => { mutedRef.current = muted }, [muted])

  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = getAudioContext()
    if (ctxRef.current?.state === 'suspended') ctxRef.current.resume().catch(() => {})
    return ctxRef.current
  }, [])

  const playStep = useCallback((step, scheduledTime) => {
    const ctx = ctxRef.current
    if (!ctx) return
    const p = patternRef.current
    if (!p) return

    INSTRUMENTS.forEach(({ id }) => {
      if (!p[id]?.[step]) return
      if (mutedRef.current[id]) return
      const ht = Math.max(ctx.currentTime, scheduledTime + (Math.random() - 0.5) * 0.005)
      INSTRUMENT_SYNTHS[id]?.(ctx, ht)
    })
  }, [])

  const scheduleAhead = useCallback(() => {
    const ctx = ctxRef.current
    if (!ctx || !isPlayingRef.current) return

    const secondsPerStep = 60 / bpmRef.current / 4
    const lookAhead = 0.1
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
    if (!patternRef.current) return
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

  const setPattern = useCallback((next) => {
    setPatternState(next)
  }, [])

  const toggleMute = useCallback((id) => {
    setMuted((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  useEffect(() => () => {
    isPlayingRef.current = false
    clearTimeout(timerRef.current)
    ctxRef.current?.close().catch(() => {})
    ctxRef.current = null
  }, [])

  return {
    isPlaying,
    currentStep,
    bpm,
    pattern,
    muted,
    toggle,
    start,
    stop,
    setBpm,
    setPattern,
    toggleMute,
    ensureCtx,
    STEPS,
  }
}

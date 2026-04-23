import { useRef, useState, useCallback, useEffect } from 'react'
import { INSTRUMENTS, DEFAULT_BPM, INSTRUMENT_SYNTHS } from '../data/rhythmPatterns'
import { getCtx, getDestination } from '../audio/ctx'
import { loadSamples, playSampleHit } from '../audio/sampleCache'

const STEPS = 16

export function useRhythmEngine(initialPattern = null, initialBpm = DEFAULT_BPM) {
  const timerRef          = useRef(null)
  const stepRef           = useRef(0)
  const bpmRef            = useRef(initialBpm)
  const patternRef        = useRef(initialPattern)
  const mutedRef          = useRef({})
  const isPlayingRef      = useRef(false)
  const nextNoteTimeRef   = useRef(0)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [bpm, setBpmState] = useState(initialBpm)
  const [pattern, setPatternState] = useState(initialPattern)
  const [muted, setMuted] = useState({})

  useEffect(() => { bpmRef.current = bpm }, [bpm])
  useEffect(() => { patternRef.current = pattern }, [pattern])
  useEffect(() => { mutedRef.current = muted }, [muted])

  const ensureCtx = useCallback(() => getCtx(), [])

  const playStep = useCallback((step, scheduledTime) => {
    const ctx = getCtx()
    if (!ctx) return
    const p = patternRef.current
    if (!p) return

    INSTRUMENTS.forEach(({ id }) => {
      if (!p[id]?.[step]) return
      if (mutedRef.current[id]) return
      const ht = Math.max(ctx.currentTime, scheduledTime + (Math.random() - 0.5) * 0.005)
      const dest = getDestination()
      if (!dest) return

      if (!playSampleHit(ctx, id, ht, dest)) {
        INSTRUMENT_SYNTHS[id]?.(ctx, ht, dest)
      }
    })
  }, [])

  const scheduleAhead = useCallback(() => {
    const ctx = getCtx()
    if (!ctx || !isPlayingRef.current) return

    const secondsPerStep = 60 / bpmRef.current / 4
    const lookAhead = 0.1
    const horizon = ctx.currentTime + lookAhead

    while (nextNoteTimeRef.current < horizon) {
      const step = stepRef.current
      const t = nextNoteTimeRef.current
      playStep(step, t)
      const delay = Math.max(0, (t - ctx.currentTime) * 1000)
      setTimeout(() => setCurrentStep(step), delay)
      stepRef.current = (step + 1) % STEPS
      nextNoteTimeRef.current += secondsPerStep
    }

    timerRef.current = setTimeout(scheduleAhead, 25)
  }, [playStep])

  const start = useCallback(async () => {
    const ctx = getCtx()
    if (!ctx) return
    if (!patternRef.current) return
    isPlayingRef.current = true
    setIsPlaying(true)
    try {
      await loadSamples()
    } catch (e) {
      console.warn(e)
    }
    if (!isPlayingRef.current) return
    if (!patternRef.current) {
      isPlayingRef.current = false
      setIsPlaying(false)
      return
    }
    const ctx2 = getCtx()
    if (!ctx2) {
      isPlayingRef.current = false
      setIsPlaying(false)
      return
    }
    stepRef.current = 0
    nextNoteTimeRef.current = ctx2.currentTime + 0.05
    scheduleAhead()
  }, [scheduleAhead])

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
    loadSamples,
    STEPS,
  }
}

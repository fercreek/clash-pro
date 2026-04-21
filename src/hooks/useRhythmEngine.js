import { useRef, useState, useCallback, useEffect } from 'react'
import { INSTRUMENTS, DEFAULT_BPM, INSTRUMENT_SYNTHS } from '../data/rhythmPatterns'
import { getCtx, getDestination } from '../audio/ctx'
import { loadSamples, getBuffer } from '../audio/sampleCache'

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

      const buffer = getBuffer(id)
      if (buffer) {
        const src = ctx.createBufferSource()
        src.buffer = buffer
        src.playbackRate.value = 0.95 + Math.random() * 0.10
        const g = ctx.createGain()
        g.gain.setValueAtTime(0.85 + Math.random() * 0.15, ht)
        src.connect(g); g.connect(dest)
        src.start(ht)
      } else {
        INSTRUMENT_SYNTHS[id]?.(ctx, ht)
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

  const start = useCallback(() => {
    const ctx = getCtx()
    if (!ctx) return
    if (!patternRef.current) return
    loadSamples()
    isPlayingRef.current = true
    stepRef.current = 0
    nextNoteTimeRef.current = ctx.currentTime + 0.05
    setIsPlaying(true)
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

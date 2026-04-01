import { useEffect, useRef, useCallback } from 'react'

const MUTE_KEY = 'clashpro:soundMuted'

function getAudioContext() {
  const Ctx = window.AudioContext || window.webkitAudioContext
  return Ctx ? new Ctx() : null
}

export function useCountdownBeeps({
  timeLeft,
  isCountingDown,
  muted,
}) {
  const ctxRef = useRef(null)
  const lastBeepSecRef = useRef(null)

  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = getAudioContext()
    return ctxRef.current
  }, [])

  const unlock = useCallback(() => {
    const ctx = ensureCtx()
    if (ctx?.state === 'suspended') ctx.resume().catch(() => {})
  }, [ensureCtx])

  const playBeep = useCallback(
    (freq = 880, duration = 0.08) => {
      if (muted) return
      const ctx = ensureCtx()
      if (!ctx || ctx.state !== 'running') return
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + duration)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + duration)
    },
    [ensureCtx, muted]
  )

  useEffect(() => {
    if (!isCountingDown || muted) {
      lastBeepSecRef.current = null
      return
    }
    if (timeLeft >= 1 && timeLeft <= 3) {
      if (lastBeepSecRef.current !== timeLeft) {
        lastBeepSecRef.current = timeLeft
        playBeep(880 - (3 - timeLeft) * 120)
      }
    } else {
      lastBeepSecRef.current = null
    }
  }, [timeLeft, isCountingDown, muted, playBeep])

  // Campana de ring de boxeo: 3 dings rápidos
  const playBell = useCallback(() => {
    if (muted) return
    const ctx = ensureCtx()
    if (!ctx) return
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    ;[0, 0.18, 0.38].forEach((delay) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 1100
      osc.type = 'triangle'
      const t = ctx.currentTime + delay
      gain.gain.setValueAtTime(0.35, t)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55)
      osc.start(t)
      osc.stop(t + 0.6)
    })
  }, [ensureCtx, muted])

  return { unlock, playBeep, playBell, ensureCtx }
}

export function loadSoundMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

export function saveSoundMuted(value) {
  try {
    if (value) localStorage.setItem(MUTE_KEY, '1')
    else localStorage.removeItem(MUTE_KEY)
  } catch {}
}

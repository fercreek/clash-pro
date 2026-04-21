import { useEffect, useRef, useCallback } from 'react'
import { getCtx, getDestination } from '../audio/ctx'

const MUTE_KEY = 'clashpro:soundMuted'

function synthCowbell(ctx, dest, t, gain = 1.0, decay = 0.35) {
  const freqs = [540, 800]
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 750
  filter.Q.value = 1.2
  filter.connect(dest)

  const vca = ctx.createGain()
  vca.connect(filter)
  vca.gain.setValueAtTime(gain, t)
  vca.gain.exponentialRampToValueAtTime(0.0001, t + decay)

  freqs.forEach((freq) => {
    const osc = ctx.createOscillator()
    osc.type = 'square'
    osc.frequency.value = freq
    osc.connect(vca)
    osc.start(t)
    osc.stop(t + decay + 0.05)
  })
}

function synthClave(ctx, dest, t, gain = 0.85) {
  const decay = 0.07

  const bufSize = Math.ceil(ctx.sampleRate * decay)
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
  const noise = ctx.createBufferSource()
  noise.buffer = buf

  const nFilter = ctx.createBiquadFilter()
  nFilter.type = 'bandpass'
  nFilter.frequency.value = 2000
  nFilter.Q.value = 10

  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.value = 1800

  const vca = ctx.createGain()
  vca.gain.setValueAtTime(gain, t)
  vca.gain.exponentialRampToValueAtTime(0.0001, t + decay)
  vca.connect(dest)

  noise.connect(nFilter)
  nFilter.connect(vca)
  osc.connect(vca)

  noise.start(t)
  noise.stop(t + decay + 0.01)
  osc.start(t)
  osc.stop(t + decay + 0.01)
}

function synthRimShot(ctx, dest, t, gain = 0.9) {
  const decay = 0.14

  const bufSize = Math.ceil(ctx.sampleRate * decay)
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
  const noise = ctx.createBufferSource()
  noise.buffer = buf

  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 1100
  filter.Q.value = 4

  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.value = 900

  const vca = ctx.createGain()
  vca.gain.setValueAtTime(gain, t)
  vca.gain.exponentialRampToValueAtTime(0.0001, t + decay)
  vca.connect(dest)

  noise.connect(filter)
  filter.connect(vca)
  osc.connect(vca)

  noise.start(t)
  noise.stop(t + decay + 0.01)
  osc.start(t)
  osc.stop(t + decay + 0.01)
}

export function useCountdownBeeps({ timeLeft, isCountingDown, muted }) {
  const lastBeepSecRef = useRef(null)

  const unlock = useCallback(() => {
    getCtx()
  }, [])

  const playBeep = useCallback(
    (freq = 880, duration = 0.08) => {
      if (muted) return
      const ctx = getCtx()
      if (!ctx || ctx.state !== 'running') return
      const dest = getDestination()
      if (!dest) return
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(dest)
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + duration)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + duration)
    },
    [muted]
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

  const playBell = useCallback(() => {
    if (muted) return
    const ctx = getCtx()
    if (!ctx) return
    const dest = getDestination()
    if (!dest) return
    ;[0, 0.16, 0.32].forEach((delay) => {
      synthCowbell(ctx, dest, ctx.currentTime + delay, 0.9, 0.35)
    })
  }, [muted])

  const playRoundEnd = useCallback(() => {
    if (muted) return
    const ctx = getCtx()
    if (!ctx) return
    const dest = getDestination()
    if (!dest) return
    const beat = 0.22
    ;[0, beat, beat * 2, beat * 3.5, beat * 4.5].forEach((delay) => {
      synthClave(ctx, dest, ctx.currentTime + delay, 0.88)
    })
  }, [muted])

  const playParticipantChange = useCallback(() => {
    if (muted) return
    const ctx = getCtx()
    if (!ctx) return
    const dest = getDestination()
    if (!dest) return
    synthRimShot(ctx, dest, ctx.currentTime, 0.95)
  }, [muted])

  return { unlock, playBeep, playBell, playRoundEnd, playParticipantChange, ensureCtx: getCtx }
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

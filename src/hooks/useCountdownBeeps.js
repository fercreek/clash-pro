import { useEffect, useRef, useCallback } from 'react'
import { getCtx, getDestination } from '../audio/ctx'

const MUTE_KEY = 'clashpro:soundMuted'

function ringBellHit(ctx, dest, t, vel = 1) {
  const f0 = 756
  const sh = ctx.createBiquadFilter()
  sh.type = 'highshelf'
  sh.frequency.value = 2000
  sh.gain.value = 3.5
  sh.connect(dest)
  const bus = ctx.createGain()
  bus.connect(sh)
  const parts = [
    { m: 1, a: 1, d: 1.15 },
    { m: 2.19, a: 0.52, d: 0.88 },
    { m: 2.89, a: 0.33, d: 0.65 },
    { m: 3.45, a: 0.18, d: 0.5 },
    { m: 4.14, a: 0.1, d: 0.38 },
  ]
  for (const p of parts) {
    const o = ctx.createOscillator()
    o.type = 'sine'
    const fr = f0 * p.m
    o.frequency.setValueAtTime(fr, t)
    o.frequency.exponentialRampToValueAtTime(fr * 0.985, t + 0.18)
    const g = ctx.createGain()
    const pk = 0.14 * p.a * vel
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(pk, t + 0.002)
    g.gain.exponentialRampToValueAtTime(0.0001, t + p.d)
    o.connect(g)
    g.connect(bus)
    o.start(t)
    o.stop(t + p.d + 0.05)
  }
  const nlen = Math.max(1, Math.ceil(0.0022 * ctx.sampleRate))
  const nb = ctx.createBuffer(1, nlen, ctx.sampleRate)
  const nd = nb.getChannelData(0)
  for (let i = 0; i < nlen; i++) nd[i] = (Math.random() * 2 - 1) * (1 - i / nlen)
  const nsrc = ctx.createBufferSource()
  nsrc.buffer = nb
  const nhp = ctx.createBiquadFilter()
  nhp.type = 'highpass'
  nhp.frequency.value = 1200
  nhp.Q.value = 0.4
  const ng = ctx.createGain()
  ng.gain.setValueAtTime(0.1 * vel, t)
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.012)
  nsrc.connect(nhp)
  nhp.connect(ng)
  ng.connect(bus)
  nsrc.start(t)
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
    const t0 = ctx.currentTime
    const gap = 0.48
    ;[0, 1, 2].forEach((i) => {
      ringBellHit(ctx, dest, t0 + i * gap, 0.9 - i * 0.04)
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

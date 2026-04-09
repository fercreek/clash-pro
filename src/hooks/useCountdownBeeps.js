import { useEffect, useRef, useCallback } from 'react'

const MUTE_KEY = 'clashpro:soundMuted'

function getAudioContext() {
  const Ctx = window.AudioContext || window.webkitAudioContext
  return Ctx ? new Ctx() : null
}

// ── Cowbell campana (estilo TR-808) ──────────────────────────────────────────
// Dos osciladores square mezclados (540 + 800 Hz) → el "ping" metálico de la
// campana electrónica que se usa en salsa, timba y merengue.
function synthCowbell(ctx, t, gain = 1.0, decay = 0.35) {
  const freqs = [540, 800]
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 750
  filter.Q.value = 1.2
  filter.connect(ctx.destination)

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

// ── Clave (madera contra madera) ─────────────────────────────────────────────
// Golpe muy corto con click de ruido + tono a ~1800 Hz. Seco y brillante.
function synthClave(ctx, t, gain = 0.85) {
  const decay = 0.07

  // Componente ruido (ataque)
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

  // Componente tonal
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.value = 1800

  const vca = ctx.createGain()
  vca.gain.setValueAtTime(gain, t)
  vca.gain.exponentialRampToValueAtTime(0.0001, t + decay)
  vca.connect(ctx.destination)

  noise.connect(nFilter)
  nFilter.connect(vca)
  osc.connect(vca)

  noise.start(t)
  noise.stop(t + decay + 0.01)
  osc.start(t)
  osc.stop(t + decay + 0.01)
}

// ── Rim shot de timbales ─────────────────────────────────────────────────────
// Golpe seco y metálico en el aro del timbal. Ruido filtrado + tono agudo.
function synthRimShot(ctx, t, gain = 0.9) {
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
  vca.connect(ctx.destination)

  noise.connect(filter)
  filter.connect(vca)
  osc.connect(vca)

  noise.start(t)
  noise.stop(t + decay + 0.01)
  osc.start(t)
  osc.stop(t + decay + 0.01)
}

export function useCountdownBeeps({ timeLeft, isCountingDown, muted }) {
  const ctxRef         = useRef(null)
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
      const osc  = ctx.createOscillator()
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

  // Inicio de ronda: 3 golpes de campana (cowbell TR-808)
  const playBell = useCallback(() => {
    if (muted) return
    const ctx = ensureCtx()
    if (!ctx) return
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    ;[0, 0.16, 0.32].forEach((delay) => {
      synthCowbell(ctx, ctx.currentTime + delay, 0.9, 0.35)
    })
  }, [ensureCtx, muted])

  // Fin de ronda: patrón de clave 3-2 (el corazón rítmico de la salsa)
  // Tiempos: 1 — 2+ — 3 — — 4+ — |
  const playRoundEnd = useCallback(() => {
    if (muted) return
    const ctx = ensureCtx()
    if (!ctx) return
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    const beat = 0.22  // duración de un pulso base
    ;[0, beat, beat * 2, beat * 3.5, beat * 4.5].forEach((delay) => {
      synthClave(ctx, ctx.currentTime + delay, 0.88)
    })
  }, [ensureCtx, muted])

  // Cambio de participante: rim shot de timbales (seco, cortante)
  const playParticipantChange = useCallback(() => {
    if (muted) return
    const ctx = ensureCtx()
    if (!ctx) return
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    synthRimShot(ctx, ctx.currentTime, 0.95)
  }, [ensureCtx, muted])

  return { unlock, playBeep, playBell, playRoundEnd, playParticipantChange, ensureCtx }
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

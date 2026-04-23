import { SAMPLE_URLS } from './samples'
import { getCtx, getDestination } from './ctx'

const _buffers = {}
let _loading = false
let _loaded = false

const SLICE_SEC = {
  clave: 0.1,
  conga: 0.15,
  cowbell: 0.12,
  maracas: 0.055,
  bajo: 0.2,
}
const HIT_GAIN = {
  clave: 0.36,
  conga: 0.33,
  cowbell: 0.28,
  maracas: 0.19,
  bajo: 0.25,
}
const HPF_HZ = {
  clave: 200,
  conga: 50,
  cowbell: 160,
  maracas: 500,
  bajo: 35,
}
const LPF_HZ = {
  clave: 15000,
  conga: 7500,
  cowbell: 10000,
  maracas: 11000,
  bajo: 9000,
}
const PAN = {
  clave: -0.3,
  conga: 0.2,
  cowbell: -0.2,
  maracas: 0.4,
  bajo: 0,
}
const ATK_SEC = {
  clave: 0.0007,
  conga: 0.0016,
  cowbell: 0.0008,
  maracas: 0.0005,
  bajo: 0.0025,
}

export function playSampleHit(ctx, id, when, dest) {
  const buffer = _buffers[id]
  if (!buffer || !dest) return false
  const cap = SLICE_SEC[id] ?? 0.1
  const dur = Math.min(cap, buffer.duration, 0.32)
  if (dur < 0.012) return false
  const t0 = Math.max(ctx.currentTime, when)
  const src = ctx.createBufferSource()
  src.buffer = buffer
  const rate = 0.995 + Math.random() * 0.01
  src.playbackRate.setValueAtTime(rate, t0)
  const hp = ctx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.setValueAtTime(HPF_HZ[id] ?? 80, t0)
  hp.Q.setValueAtTime(0.65, t0)
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.setValueAtTime(LPF_HZ[id] ?? 16000, t0)
  lp.Q.setValueAtTime(0.55, t0)
  const g = ctx.createGain()
  const p = (HIT_GAIN[id] ?? 0.3) * (0.9 + Math.random() * 0.1)
  const atk = ATK_SEC[id] ?? 0.0012
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.linearRampToValueAtTime(p, t0 + atk)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  let last = lp
  if (typeof ctx.createStereoPanner === 'function') {
    const pan = ctx.createStereoPanner()
    pan.pan.setValueAtTime(Math.max(-1, Math.min(1, PAN[id] ?? 0)), t0)
    lp.connect(pan)
    last = pan
  }
  src.connect(hp)
  hp.connect(lp)
  last.connect(g)
  g.connect(dest)
  try {
    src.start(t0, 0, dur)
  } catch {
    return false
  }
  return true
}

export async function loadSamples() {
  if (_loaded || _loading) return
  _loading = true
  const ctx = getCtx()
  if (!ctx) { _loading = false; return }
  await Promise.all(
    Object.entries(SAMPLE_URLS).map(async ([id, url]) => {
      try {
        const resp = await fetch(url)
        const ab = await resp.arrayBuffer()
        _buffers[id] = await new Promise((res, rej) => ctx.decodeAudioData(ab, res, rej))
      } catch (e) {
        console.warn(`Sample failed: ${id}`, e)
      }
    })
  )
  _loaded = true
  _loading = false
}

export function getBuffer(id) { return _buffers[id] ?? null }
export { getDestination }

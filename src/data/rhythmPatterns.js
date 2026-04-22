/**
 * Patrones de 16 pasos por instrumento.
 * 1 = golpe, 0 = silencio.
 * Representa 2 compases de salsa (8 tiempos cada compás = 16 pasos de 1/8 nota).
 */

export const INSTRUMENTS = [
  { id: 'clave',    label: 'Clave',    freq: 1400, type: 'square',   gain: 0.25, dur: 0.06 },
  { id: 'conga',    label: 'Conga',    freq: 180,  type: 'sine',     gain: 0.4,  dur: 0.18 },
  { id: 'cowbell',  label: 'Cencerro', freq: 560,  type: 'square',   gain: 0.18, dur: 0.12 },
  { id: 'maracas',  label: 'Maracas',  freq: 1800, type: 'sawtooth', gain: 0.10, dur: 0.04 },
  { id: 'bajo',     label: 'Bajo',     freq: 80,   type: 'triangle', gain: 0.45, dur: 0.25 },
]

export const PATTERNS = {
  // ─── Nivel básico ─────────────────────────────────────────────────────────
  basic: {
    label: 'Básico',
    clave:   [1,0,0,1,0,0,1,0, 0,0,1,0,0,1,0,0], // 3-2 clave
    conga:   [1,0,0,0,1,0,0,0, 1,0,0,0,1,0,0,0],
    cowbell: [1,0,1,0,1,0,1,0, 1,0,1,0,1,0,1,0],
    maracas: [1,1,1,1,1,1,1,1, 1,1,1,1,1,1,1,1],
    bajo:    [1,0,0,0,0,0,1,0, 1,0,0,0,0,0,1,0],
  },
  // ─── Nivel intermedio ──────────────────────────────────────────────────────
  intermediate: {
    label: 'Intermedio',
    clave:   [1,0,0,1,0,0,1,0, 0,0,1,0,0,1,0,0], // 3-2 clave
    conga:   [1,0,0,1,1,0,0,1, 1,0,0,1,1,0,0,1], // tumbao variado
    cowbell: [1,0,1,0,1,0,1,0, 1,0,1,0,1,0,1,0],
    maracas: [1,0,1,0,1,0,1,0, 1,0,1,0,1,0,1,0],
    bajo:    [1,0,0,0,1,0,0,1, 0,0,1,0,0,0,1,0], // tumbao de bajo
  },
  // ─── Nivel avanzado ────────────────────────────────────────────────────────
  advanced: {
    label: 'Avanzado',
    clave:   [0,0,1,0,0,1,0,0, 1,0,0,0,1,0,0,0], // 2-3 clave
    conga:   [1,0,1,0,1,0,1,1, 0,1,0,1,1,0,1,0], // patrón de conga avanzado
    cowbell: [1,1,0,1,1,0,1,0, 1,1,0,1,1,0,1,0],
    maracas: [1,1,0,1,1,0,1,0, 1,1,0,1,1,0,1,0],
    bajo:    [1,0,0,1,0,1,0,0, 1,0,1,0,0,1,0,0],
  },
}

export const DEFAULT_BPM = 90
export const MIN_BPM = 50
export const MAX_BPM = 160

export const REFERENCE_PATTERNS = [
  {
    id: 'ref-clave-son-32',
    label: 'Clave Son 3-2',
    description: 'El patrón base de toda la salsa. Tres golpes en el primer compás, dos en el segundo. Es el punto de partida para entender cualquier canción salsera.',
    credit: 'Tradición afrocubana. Documentado por Rebeca Mauleón en Salsa Guidebook for Piano and Ensemble (Sher Music Co., 1993).',
    blogSlug: 'la-clave',
    bpm: 90,
    pattern: {
      clave:   [1,0,0,1,0,0,1,0, 0,0,1,0,0,1,0,0],
      conga:   [1,0,0,0,1,0,0,0, 1,0,0,0,1,0,0,0],
      cowbell: [1,0,1,0,1,0,1,0, 1,0,1,0,1,0,1,0],
      maracas: [1,1,1,1,1,1,1,1, 1,1,1,1,1,1,1,1],
      bajo:    [1,0,0,0,0,0,1,0, 1,0,0,0,0,0,1,0],
    },
  },
  {
    id: 'ref-clave-son-23',
    label: 'Clave Son 2-3',
    description: 'La inversión de la clave 3-2. Dos golpes primero, luego tres. Común en el repertorio cubano clásico y en la salsa de New York (on2).',
    credit: 'Tradición afrocubana. Documentado por Rebeca Mauleón en Salsa Guidebook for Piano and Ensemble (Sher Music Co., 1993).',
    blogSlug: 'la-clave',
    bpm: 90,
    pattern: {
      clave:   [0,0,1,0,0,1,0,0, 1,0,0,0,1,0,0,0],
      conga:   [1,0,0,0,1,0,0,0, 1,0,0,0,1,0,0,0],
      cowbell: [1,0,1,0,1,0,1,0, 1,0,1,0,1,0,1,0],
      maracas: [1,1,1,1,1,1,1,1, 1,1,1,1,1,1,1,1],
      bajo:    [0,0,0,0,1,0,0,0, 0,0,0,0,1,0,0,0],
    },
  },
  {
    id: 'ref-tumbao-clasico',
    label: 'Tumbao Clásico',
    description: 'El tumbao de bajo y conga que define la salsa. El bajo anticipa el beat con el característico golpe "y-1". Base de la sección de verso.',
    credit: 'Tradición musical cubana. Análisis del tumbao en Ned Sublette, Cuba and Its Music (Chicago Review Press, 2004).',
    blogSlug: 'estilos-de-salsa',
    bpm: 95,
    pattern: {
      clave:   [1,0,0,1,0,0,1,0, 0,0,1,0,0,1,0,0],
      conga:   [1,0,1,0,1,0,1,1, 1,0,1,0,1,0,1,1],
      cowbell: [0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0],
      maracas: [1,0,1,0,1,0,1,0, 1,0,1,0,1,0,1,0],
      bajo:    [1,0,0,0,1,0,0,1, 0,0,1,0,0,0,1,0],
    },
  },
  {
    id: 'ref-cascara',
    label: 'Cascara (Timbales)',
    description: 'El patrón de cáscara se toca en el shell del timbal durante el verso. Crea el groove de fondo que sostiene la energía antes del coro.',
    credit: 'Tradición salsera. Documentado por Rebeca Mauleón en Salsa Guidebook for Piano and Ensemble (Sher Music Co., 1993).',
    blogSlug: 'la-clave',
    bpm: 90,
    pattern: {
      clave:   [1,0,1,1,0,1,0,1, 1,0,1,1,0,1,0,1],
      conga:   [1,0,0,0,1,0,0,0, 1,0,0,0,1,0,0,0],
      cowbell: [0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0],
      maracas: [1,0,1,0,1,0,1,0, 1,0,1,0,1,0,1,0],
      bajo:    [1,0,0,0,1,0,0,1, 0,0,1,0,0,0,1,0],
    },
  },
  {
    id: 'ref-campana-mambo',
    label: 'Campana de Mambo',
    description: 'La campana de mano define la sección de coro/montuno. Su patrón sincopado marca cuando la energía sube y los bailarines tienen más libertad.',
    credit: 'Tradición afrocubana. Patrón de campana descrito en Christopher Washburne, "The Clave of Jazz" (Black Music Research Journal, 1997).',
    blogSlug: 'improvisacion-fundamentos',
    bpm: 100,
    pattern: {
      clave:   [1,0,0,1,0,0,1,0, 0,0,1,0,0,1,0,0],
      conga:   [1,0,0,1,1,0,0,1, 1,0,0,1,1,0,0,1],
      cowbell: [1,0,1,1,1,0,1,0, 1,0,1,1,1,0,1,0],
      maracas: [1,1,1,1,1,1,1,1, 1,1,1,1,1,1,1,1],
      bajo:    [1,0,0,0,1,0,0,1, 0,0,1,0,0,0,1,0],
    },
  },
  {
    id: 'ref-guaracha',
    label: 'Guaracha',
    description: 'Ritmo festivo cubano, antecesor directo de la salsa. Tempo más rápido, conga en marcha continua. Base de muchos clásicos de los años 50-70.',
    credit: 'Tradición musical cubana. Historia documentada en Ned Sublette, Cuba and Its Music (Chicago Review Press, 2004).',
    blogSlug: 'estilos-de-salsa',
    bpm: 105,
    pattern: {
      clave:   [1,0,0,1,0,0,1,0, 0,0,1,0,0,1,0,0],
      conga:   [1,0,1,0,1,0,1,0, 1,0,1,0,1,0,1,0],
      cowbell: [1,1,0,1,1,0,1,0, 1,1,0,1,1,0,1,0],
      maracas: [1,0,1,0,1,0,1,0, 1,0,1,0,1,0,1,0],
      bajo:    [1,0,1,0,0,0,1,0, 1,0,1,0,0,0,1,0],
    },
  },
]

export const STEPS_PER_PATTERN = 16

// ─── Synth helpers ─────────────────────────────────────────────────────────
function makeNoiseBuffer(ctx, durSec, shaper) {
  const len = Math.max(1, Math.ceil(ctx.sampleRate * durSec))
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) {
    const n = Math.random() * 2 - 1
    d[i] = shaper ? n * shaper(i / len, i, len) : n
  }
  return buf
}

function adsr(param, t, peak, attack, decay, sustainLevel, release, endT) {
  param.setValueAtTime(0.0001, t)
  param.linearRampToValueAtTime(peak, t + attack)
  param.exponentialRampToValueAtTime(Math.max(0.0001, peak * sustainLevel), t + attack + decay)
  param.exponentialRampToValueAtTime(0.0001, endT ?? (t + attack + decay + release))
}

export const INSTRUMENT_SYNTHS = {
  // ─── CLAVE ───────────────────────────────────────────────────────────────
  // Cuban wooden sticks. Hit = very short, dry woodblock pitch ~2500Hz.
  // Two inharmonic sine partials (fundamental + octave-ish) + attack click.
  // No bandpass ring — real claves are DRY.
  clave(ctx, t, dest) {
    const out = dest ?? ctx.destination
    const vel = 0.9 + Math.random() * 0.15
    const pitchDrift = 1 + (Math.random() - 0.5) * 0.02

    // Attack click: 1ms filtered noise burst for hit transient
    const clickBuf = makeNoiseBuffer(ctx, 0.0015)
    const clickSrc = ctx.createBufferSource(); clickSrc.buffer = clickBuf
    const clickBp = ctx.createBiquadFilter(); clickBp.type = 'highpass'; clickBp.frequency.value = 2500
    const clickG = ctx.createGain()
    clickG.gain.setValueAtTime(0.5 * vel, t)
    clickG.gain.exponentialRampToValueAtTime(0.0001, t + 0.003)
    clickSrc.connect(clickBp); clickBp.connect(clickG); clickG.connect(out); clickSrc.start(t)

    // Fundamental wood pitch ~2500Hz — pure sine, fast decay
    const f1 = ctx.createOscillator(); f1.type = 'sine'; f1.frequency.value = 2500 * pitchDrift
    const g1 = ctx.createGain()
    g1.gain.setValueAtTime(0.6 * vel, t)
    g1.gain.exponentialRampToValueAtTime(0.0001, t + 0.040)
    f1.connect(g1); g1.connect(out); f1.start(t); f1.stop(t + 0.045)

    // Inharmonic partial at ~3800Hz (wood grain character)
    const f2 = ctx.createOscillator(); f2.type = 'sine'; f2.frequency.value = 3800 * pitchDrift
    const g2 = ctx.createGain()
    g2.gain.setValueAtTime(0.25 * vel, t)
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.025)
    f2.connect(g2); g2.connect(out); f2.start(t); f2.stop(t + 0.03)
  },

  // ─── CONGA (open tone) ───────────────────────────────────────────────────
  // Tumba/conga open tone: punchy mid thud, fast pitch drop, skin snap.
  // Quick decay (150ms) — NOT a boingy sweep.
  conga(ctx, t, dest) {
    const out = dest ?? ctx.destination
    const vel = 0.85 + Math.random() * 0.25

    // Skin slap: short noise burst, bandpassed high
    const slapBuf = makeNoiseBuffer(ctx, 0.008, (r) => Math.exp(-r * 8))
    const slapSrc = ctx.createBufferSource(); slapSrc.buffer = slapBuf
    const slapBp = ctx.createBiquadFilter(); slapBp.type = 'bandpass'; slapBp.frequency.value = 1800; slapBp.Q.value = 1.5
    const slapG = ctx.createGain()
    slapG.gain.setValueAtTime(0.5 * vel, t)
    slapG.gain.exponentialRampToValueAtTime(0.0001, t + 0.012)
    slapSrc.connect(slapBp); slapBp.connect(slapG); slapG.connect(out); slapSrc.start(t)

    // Fundamental: fast pitch drop 260 → 195Hz in 30ms then hold
    const f1 = ctx.createOscillator(); f1.type = 'sine'
    f1.frequency.setValueAtTime(260, t)
    f1.frequency.exponentialRampToValueAtTime(195, t + 0.030)
    const g1 = ctx.createGain()
    g1.gain.setValueAtTime(0.0001, t)
    g1.gain.linearRampToValueAtTime(0.75 * vel, t + 0.003)
    g1.gain.exponentialRampToValueAtTime(0.0001, t + 0.180)
    f1.connect(g1); g1.connect(out); f1.start(t); f1.stop(t + 0.19)

    // Membrane overtone at 1.6× fundamental (Bessel mode)
    const f2 = ctx.createOscillator(); f2.type = 'sine'
    f2.frequency.setValueAtTime(415, t)
    f2.frequency.exponentialRampToValueAtTime(310, t + 0.030)
    const g2 = ctx.createGain()
    g2.gain.setValueAtTime(0.22 * vel, t)
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.060)
    f2.connect(g2); g2.connect(out); f2.start(t); f2.stop(t + 0.065)

    // Shell body thump (low-end weight)
    const f3 = ctx.createOscillator(); f3.type = 'sine'; f3.frequency.value = 95
    const g3 = ctx.createGain()
    g3.gain.setValueAtTime(0.28 * vel, t)
    g3.gain.exponentialRampToValueAtTime(0.0001, t + 0.040)
    f3.connect(g3); g3.connect(out); f3.start(t); f3.stop(t + 0.045)
  },

  // ─── COWBELL (TR-808 style) ──────────────────────────────────────────────
  // Two detuned square waves bandpassed. Iconic salsa cowbell clang.
  cowbell(ctx, t, dest) {
    const out = dest ?? ctx.destination
    const vel = 0.85 + Math.random() * 0.25
    const drift = 1 + (Math.random() - 0.5) * 0.02

    // Two square waves — 808 uses 800Hz + 540Hz (inharmonic metal modes)
    const o1 = ctx.createOscillator(); o1.type = 'square'; o1.frequency.value = 800 * drift
    const o2 = ctx.createOscillator(); o2.type = 'square'; o2.frequency.value = 540 * drift

    // Bandpass shapes the clang — wide pass, moderate Q
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'
    bp.frequency.value = 850; bp.Q.value = 1.8

    // Highpass cleans sub rumble from squares
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'
    hp.frequency.value = 500; hp.Q.value = 0.7

    // Two-stage gain: sharp attack, fast initial decay, slower metallic ring
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.45 * vel, t + 0.002)
    g.gain.exponentialRampToValueAtTime(0.18 * vel, t + 0.030)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.280)

    o1.connect(bp); o2.connect(bp); bp.connect(hp); hp.connect(g); g.connect(out)
    o1.start(t); o2.start(t)
    o1.stop(t + 0.29); o2.stop(t + 0.29)
  },

  // ─── MARACAS ─────────────────────────────────────────────────────────────
  // Short shaker burst. Two-stage noise (seed hit + tail) with hp filter.
  maracas(ctx, t, dest) {
    const out = dest ?? ctx.destination
    const vel = 0.8 + Math.random() * 0.25
    const dur = 0.045

    // Noise shaped: sharp seed impact at start, quick tail
    const buf = makeNoiseBuffer(ctx, dur, (r) => {
      // exponential attack ramp then decay (simulates seeds hitting then settling)
      if (r < 0.05) return r / 0.05
      return Math.exp(-(r - 0.05) * 25)
    })
    const src = ctx.createBufferSource(); src.buffer = buf

    // Highpass removes rumble
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'
    hp.frequency.value = 3500; hp.Q.value = 0.5

    // Light bandpass boost around 6kHz for seed brightness
    const bp = ctx.createBiquadFilter(); bp.type = 'peaking'
    bp.frequency.value = 6500; bp.Q.value = 1.0; bp.gain.value = 6

    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.32 * vel, t + 0.002)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)

    src.connect(hp); hp.connect(bp); bp.connect(g); g.connect(out)
    src.start(t)
  },

  // ─── BAJO (salsa tumbao bass) ────────────────────────────────────────────
  // Rounded plucky bass: sine fundamental + filtered square body + pluck click.
  bajo(ctx, t, dest) {
    const out = dest ?? ctx.destination
    const vel = 0.85 + Math.random() * 0.20
    const freq = 82  // E2-ish, tumbao range

    // Body: square through lowpass with moving cutoff (pluck character)
    const body = ctx.createOscillator(); body.type = 'square'
    body.frequency.setValueAtTime(freq * 1.008, t)
    body.frequency.exponentialRampToValueAtTime(freq, t + 0.025)
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'
    lp.frequency.setValueAtTime(1200, t)
    lp.frequency.exponentialRampToValueAtTime(220, t + 0.150)
    lp.Q.value = 3
    const bodyG = ctx.createGain()
    bodyG.gain.setValueAtTime(0.0001, t)
    bodyG.gain.linearRampToValueAtTime(0.30 * vel, t + 0.004)
    bodyG.gain.exponentialRampToValueAtTime(0.0001, t + 0.320)
    body.connect(lp); lp.connect(bodyG); bodyG.connect(out)
    body.start(t); body.stop(t + 0.33)

    // Fundamental sine — the round low-end weight
    const sub = ctx.createOscillator(); sub.type = 'sine'; sub.frequency.value = freq
    const subG = ctx.createGain()
    subG.gain.setValueAtTime(0.0001, t)
    subG.gain.linearRampToValueAtTime(0.65 * vel, t + 0.006)
    subG.gain.exponentialRampToValueAtTime(0.0001, t + 0.300)
    sub.connect(subG); subG.connect(out)
    sub.start(t); sub.stop(t + 0.31)

    // Second harmonic for definition
    const h2 = ctx.createOscillator(); h2.type = 'sine'; h2.frequency.value = freq * 2
    const h2G = ctx.createGain()
    h2G.gain.setValueAtTime(0.18 * vel, t)
    h2G.gain.exponentialRampToValueAtTime(0.0001, t + 0.080)
    h2.connect(h2G); h2G.connect(out)
    h2.start(t); h2.stop(t + 0.085)

    // Pluck click — short noise burst, bandpassed for finger/pick attack
    const nb = makeNoiseBuffer(ctx, 0.006)
    const ns = ctx.createBufferSource(); ns.buffer = nb
    const nbp = ctx.createBiquadFilter(); nbp.type = 'bandpass'
    nbp.frequency.value = 650; nbp.Q.value = 1.2
    const ng = ctx.createGain()
    ng.gain.setValueAtTime(0.20 * vel, t)
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.006)
    ns.connect(nbp); nbp.connect(ng); ng.connect(out); ns.start(t)
  },
}

export function emptyPattern() {
  return INSTRUMENTS.reduce((acc, inst) => {
    acc[inst.id] = Array(STEPS_PER_PATTERN).fill(0)
    return acc
  }, {})
}

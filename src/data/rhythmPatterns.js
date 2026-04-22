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

export const INSTRUMENT_SYNTHS = {
  clave(ctx, t, dest) {
    const out = dest ?? ctx.destination
    const vel = 0.85 + Math.random() * 0.30
    // 2ms click transient (attack)
    const cb = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.002), ctx.sampleRate)
    const cd = cb.getChannelData(0); for (let i = 0; i < cd.length; i++) cd[i] = Math.random() * 2 - 1
    const cs = ctx.createBufferSource(); cs.buffer = cb
    const cbp = ctx.createBiquadFilter(); cbp.type = 'bandpass'; cbp.frequency.value = 3000; cbp.Q.value = 8
    const cg = ctx.createGain(); cg.gain.setValueAtTime(0.8 * vel, t); cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.002)
    cs.connect(cbp); cbp.connect(cg); cg.connect(out); cs.start(t)
    // Inharmonic wood partials — cylindrical bar modes ratio 1 : 2.756
    ;[[2200, 0.35], [6072, 0.14]].forEach(([freq, g]) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = freq
      const og = ctx.createGain()
      og.gain.setValueAtTime(g * vel, t); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.055)
      o.connect(og); og.connect(out); o.start(t); o.stop(t + 0.06)
    })
  },

  conga(ctx, t, dest) {
    const out = dest ?? ctx.destination
    const vel = 0.85 + Math.random() * 0.30
    // Fundamental: two-stage sweep (fast elastic snap then slow settle)
    const f1 = ctx.createOscillator(); f1.type = 'sine'
    f1.frequency.setValueAtTime(280, t)
    f1.frequency.exponentialRampToValueAtTime(210, t + 0.015)
    f1.frequency.exponentialRampToValueAtTime(185, t + 0.30)
    const g1 = ctx.createGain()
    g1.gain.setValueAtTime(0.65 * vel, t); g1.gain.exponentialRampToValueAtTime(0.0001, t + 0.30)
    f1.connect(g1); g1.connect(out); f1.start(t); f1.stop(t + 0.31)
    // First overtone — membrane Bessel mode ratio 1.59×
    const f2 = ctx.createOscillator(); f2.type = 'sine'
    f2.frequency.setValueAtTime(445, t); f2.frequency.exponentialRampToValueAtTime(335, t + 0.015)
    const g2 = ctx.createGain()
    g2.gain.setValueAtTime(0.25 * vel, t); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.10)
    f2.connect(g2); g2.connect(out); f2.start(t); f2.stop(t + 0.11)
    // Shell body thump
    const f3 = ctx.createOscillator(); f3.type = 'sine'; f3.frequency.value = 90
    const g3 = ctx.createGain()
    g3.gain.setValueAtTime(0.30 * vel, t); g3.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)
    f3.connect(g3); g3.connect(out); f3.start(t); f3.stop(t + 0.06)
    // Skin slap transient
    const nb = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.005), ctx.sampleRate)
    const nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1
    const ns = ctx.createBufferSource(); ns.buffer = nb
    const nhp = ctx.createBiquadFilter(); nhp.type = 'bandpass'; nhp.frequency.value = 900; nhp.Q.value = 2
    const ng = ctx.createGain(); ng.gain.setValueAtTime(0.45 * vel, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.005)
    ns.connect(nhp); nhp.connect(ng); ng.connect(out); ns.start(t)
  },

  cowbell(ctx, t, dest) {
    const out = dest ?? ctx.destination
    const vel = 0.85 + Math.random() * 0.30
    // FM synthesis — carrier 562Hz, modulator 845Hz (ratio 1.503, inharmonic metal mode)
    const mod = ctx.createOscillator(); mod.type = 'sine'; mod.frequency.value = 845
    const modGain = ctx.createGain()
    modGain.gain.setValueAtTime(562 * 5, t)                  // index 5 at impact
    modGain.gain.exponentialRampToValueAtTime(562 * 0.5, t + 0.05) // settles to index 0.5
    modGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
    mod.connect(modGain)
    const car = ctx.createOscillator(); car.type = 'sine'; car.frequency.value = 562
    modGain.connect(car.frequency)  // FM: modulator drives carrier pitch
    // Two-stage output: fast clang then slow metallic ring
    const og = ctx.createGain()
    og.gain.setValueAtTime(0.5 * vel, t)
    og.gain.exponentialRampToValueAtTime(0.20 * vel, t + 0.05)
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.40)
    car.connect(og); og.connect(out)
    mod.start(t); mod.stop(t + 0.41); car.start(t); car.stop(t + 0.41)
  },

  maracas(ctx, t, dest) {
    const out = dest ?? ctx.destination
    const vel = 0.85 + Math.random() * 0.30
    const dur = 0.055
    // Pre-shape noise buffer to simulate seed density (denser at start, sparse tail)
    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.015))
    }
    const src = ctx.createBufferSource(); src.buffer = buf
    // Dual bandpass: seed impact ~4200Hz + shell ring ~7500Hz
    const bp1 = ctx.createBiquadFilter(); bp1.type = 'bandpass'; bp1.frequency.value = 4200; bp1.Q.value = 0.8
    const bp2 = ctx.createBiquadFilter(); bp2.type = 'bandpass'; bp2.frequency.value = 7500; bp2.Q.value = 1.2
    const mix = ctx.createGain(); mix.gain.value = 1.0
    const og = ctx.createGain()
    og.gain.setValueAtTime(0.0001, t)
    og.gain.linearRampToValueAtTime(0.35 * vel, t + 0.001)
    og.gain.exponentialRampToValueAtTime(0.15 * vel, t + 0.020)
    og.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    src.connect(bp1); bp1.connect(mix)
    src.connect(bp2); bp2.connect(mix)
    mix.connect(og); og.connect(out); src.start(t)
  },

  bajo(ctx, t, dest) {
    const out = dest ?? ctx.destination
    const vel = 0.85 + Math.random() * 0.30
    const freq = 82  // Ab — between Eb and F of tumbao

    // Sawtooth into lowpass: warm plucked bass character, self-cleaning via osc.stop()
    const o = ctx.createOscillator(); o.type = 'sawtooth'
    o.frequency.setValueAtTime(freq * 1.015, t)
    o.frequency.exponentialRampToValueAtTime(freq, t + 0.04)
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'
    lp.frequency.setValueAtTime(900, t); lp.frequency.exponentialRampToValueAtTime(280, t + 0.12)
    lp.Q.value = 1.5
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.55 * vel, t + 0.006)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28)
    o.connect(lp); lp.connect(g); g.connect(out)
    o.start(t); o.stop(t + 0.29)

    // Sub sine for low-end weight
    const sub = ctx.createOscillator(); sub.type = 'sine'; sub.frequency.value = freq
    const subG = ctx.createGain()
    subG.gain.setValueAtTime(0.35 * vel, t); subG.gain.exponentialRampToValueAtTime(0.0001, t + 0.20)
    sub.connect(subG); subG.connect(out)
    sub.start(t); sub.stop(t + 0.21)

    // Pluck click transient
    const nb = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.007), ctx.sampleRate)
    const nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1
    const ns = ctx.createBufferSource(); ns.buffer = nb
    const nlp = ctx.createBiquadFilter(); nlp.type = 'bandpass'; nlp.frequency.value = 500; nlp.Q.value = 2
    const ng = ctx.createGain(); ng.gain.setValueAtTime(0.22 * vel, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.007)
    ns.connect(nlp); nlp.connect(ng); ng.connect(out); ns.start(t)
  },
}

export function emptyPattern() {
  return INSTRUMENTS.reduce((acc, inst) => {
    acc[inst.id] = Array(STEPS_PER_PATTERN).fill(0)
    return acc
  }, {})
}

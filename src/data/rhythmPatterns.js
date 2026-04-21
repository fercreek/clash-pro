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
  clave(ctx, t) {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.065, ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    const src = ctx.createBufferSource(); src.buffer = buf
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3500; bp.Q.value = 12
    const g = ctx.createGain(); g.gain.setValueAtTime(0.35, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.065)
    src.connect(bp); bp.connect(g); g.connect(ctx.destination); src.start(t)
    ;[2200, 3900].forEach((freq, i) => {
      const o = ctx.createOscillator(); const og = ctx.createGain()
      o.type = 'sine'; o.frequency.value = freq
      og.gain.setValueAtTime(i === 0 ? 0.18 : 0.10, t); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.04)
      o.connect(og); og.connect(ctx.destination); o.start(t); o.stop(t + 0.05)
    })
  },

  conga(ctx, t) {
    const o = ctx.createOscillator(); const og = ctx.createGain()
    o.type = 'sine'
    o.frequency.setValueAtTime(280, t); o.frequency.exponentialRampToValueAtTime(160, t + 0.12)
    og.gain.setValueAtTime(0.6, t); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.25)
    o.connect(og); og.connect(ctx.destination); o.start(t); o.stop(t + 0.26)

    const o2 = ctx.createOscillator(); const og2 = ctx.createGain()
    o2.type = 'sine'
    o2.frequency.setValueAtTime(820, t); o2.frequency.exponentialRampToValueAtTime(680, t + 0.04)
    og2.gain.setValueAtTime(0.2, t); og2.gain.exponentialRampToValueAtTime(0.0001, t + 0.06)
    o2.connect(og2); og2.connect(ctx.destination); o2.start(t); o2.stop(t + 0.07)

    const nb = ctx.createBuffer(1, ctx.sampleRate * 0.02, ctx.sampleRate)
    const nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1
    const ns = ctx.createBufferSource(); ns.buffer = nb
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1800
    const ng = ctx.createGain(); ng.gain.setValueAtTime(0.25, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.02)
    ns.connect(hp); hp.connect(ng); ng.connect(ctx.destination); ns.start(t)
  },

  cowbell(ctx, t) {
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 720; bp.Q.value = 1.5
    const mg = ctx.createGain(); mg.gain.setValueAtTime(0.3, t); mg.gain.exponentialRampToValueAtTime(0.0001, t + 0.4)
    bp.connect(mg); mg.connect(ctx.destination)
    ;[540, 800].forEach(freq => {
      const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = freq
      o.connect(bp); o.start(t); o.stop(t + 0.41)
    })
    const cb = ctx.createBuffer(1, ctx.sampleRate * 0.005, ctx.sampleRate)
    const cd = cb.getChannelData(0); for (let i = 0; i < cd.length; i++) cd[i] = Math.random() * 2 - 1
    const cs = ctx.createBufferSource(); cs.buffer = cb
    const cg = ctx.createGain(); cg.gain.setValueAtTime(0.5, t); cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.005)
    cs.connect(cg); cg.connect(ctx.destination); cs.start(t)
  },

  maracas(ctx, t) {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.038, ctx.sampleRate)
    const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    const src = ctx.createBufferSource(); src.buffer = buf
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3000
    const pk = ctx.createBiquadFilter(); pk.type = 'peaking'; pk.frequency.value = 5500; pk.gain.value = 8; pk.Q.value = 1
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.22, t + 0.003)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.038)
    src.connect(hp); hp.connect(pk); pk.connect(g); g.connect(ctx.destination); src.start(t)
  },

  bajo(ctx, t) {
    const o = ctx.createOscillator(); const og = ctx.createGain()
    o.type = 'sine'
    o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(75, t + 0.08)
    og.gain.setValueAtTime(0.55, t); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.28)
    o.connect(og); og.connect(ctx.destination); o.start(t); o.stop(t + 0.29)

    const o2 = ctx.createOscillator(); const og2 = ctx.createGain()
    o2.type = 'triangle'
    o2.frequency.setValueAtTime(150, t); o2.frequency.exponentialRampToValueAtTime(95, t + 0.06)
    og2.gain.setValueAtTime(0.25, t); og2.gain.exponentialRampToValueAtTime(0.0001, t + 0.15)
    o2.connect(og2); og2.connect(ctx.destination); o2.start(t); o2.stop(t + 0.16)

    const nb = ctx.createBuffer(1, ctx.sampleRate * 0.015, ctx.sampleRate)
    const nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1
    const ns = ctx.createBufferSource(); ns.buffer = nb
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600
    const ng = ctx.createGain(); ng.gain.setValueAtTime(0.3, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.015)
    ns.connect(lp); lp.connect(ng); ng.connect(ctx.destination); ns.start(t)
  },
}

export function emptyPattern() {
  return INSTRUMENTS.reduce((acc, inst) => {
    acc[inst.id] = Array(STEPS_PER_PATTERN).fill(0)
    return acc
  }, {})
}

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

export function emptyPattern() {
  return INSTRUMENTS.reduce((acc, inst) => {
    acc[inst.id] = Array(STEPS_PER_PATTERN).fill(0)
    return acc
  }, {})
}

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

export const STEPS_PER_PATTERN = 16

export function emptyPattern() {
  return INSTRUMENTS.reduce((acc, inst) => {
    acc[inst.id] = Array(STEPS_PER_PATTERN).fill(0)
    return acc
  }, {})
}

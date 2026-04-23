import { generateRoundRobin } from './roundRobin'

const GHOST = '__REPEAT__'

// Fisher-Yates shuffle — ensures ties among candidates are random, not alphabetical
function shuffled(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Arma rondas para una sesión de práctica.
 *
 * Reglas:
 *  - Par: round-robin clásico, sin BYE.
 *  - Impar > 3: un bailarín repite por ronda (el de menor # apariciones),
 *    con regla no-consecutivo (no puede repetir en rondas seguidas).
 *  - ≤ 3: fallback a round-robin clásico con BYE (imposible garantizar no-consecutivo).
 *
 * @param {string[]} names
 * @param {number} iterationIndex       rotación para segunda/tercera iteración
 * @param {Object} cumulativeAppearances apariciones acumuladas de iteraciones previas
 *   (bias: quien ya repitió mucho tiene menor prioridad para repetir de nuevo)
 * @returns {{ matches, stats }}
 *   matches: [{ id, round, playerA, playerB, isBye, isRepeat, completed, result }]
 *   stats: { appearances: {name: n}, pairs: [[a, b, n], ...] desc }
 */
export function generatePracticeRounds(names, iterationIndex = 0, cumulativeAppearances = {}) {
  if (!Array.isArray(names) || names.length < 2) {
    return { matches: [], stats: { appearances: {}, pairs: [] } }
  }

  // ≤3: fallback BYE tradicional
  if (names.length <= 3) {
    const matches = generateRoundRobin(rotate(names, iterationIndex))
    return { matches, stats: buildStats(matches) }
  }

  const rotated = rotate(names, iterationIndex)

  // Par: round-robin sin BYE
  if (rotated.length % 2 === 0) {
    const matches = generateRoundRobin(rotated)
    return { matches, stats: buildStats(matches) }
  }

  // Impar >3: round-robin con GHOST, reemplazo por repetidor
  const base = generateRoundRobin([...rotated, GHOST])
  const rounds = groupByRound(base)
  // Seed appearances from cumulative (prev iterations) so the repeater bias carries over
  const appearances = Object.fromEntries(
    rotated.map((n) => [n, cumulativeAppearances[n] ?? 0])
  )
  let prevRepeater = null
  const out = []

  for (const roundMatches of rounds) {
    let repeaterThisRound = null
    for (const m of roundMatches) {
      if (m.playerA === GHOST || m.playerB === GHOST) {
        // El partner de GHOST es el "solo": necesita pareja.
        // El repeater baila dos veces esta ronda (por diseño en número impar).
        // Restricciones:
        //   - no igual al partner
        //   - no igual al repeater de la ronda previa (distribuir la carga)
        //   - minimizar apariciones totales
        // Tiebreaker: shuffled (random) — evita que el mismo alphabetically-first
        //   siempre gane cuando varios tienen el mismo count.
        const partner = m.playerA === GHOST ? m.playerB : m.playerA
        const candidates = shuffled(
          rotated.filter((n) => n !== partner && n !== prevRepeater)
        ).sort((a, b) => appearances[a] - appearances[b])
        const repeater = candidates[0] ?? rotated.find((n) => n !== partner)
        repeaterThisRound = repeater
        out.push({
          id: m.id,
          round: m.round,
          playerA: partner,
          playerB: repeater,
          isBye: false,
          isRepeat: true,
          repeaterName: repeater,
          completed: false,
          result: null,
        })
        appearances[partner]++
        appearances[repeater]++
      } else {
        out.push({
          id: m.id,
          round: m.round,
          playerA: m.playerA,
          playerB: m.playerB,
          isBye: false,
          isRepeat: false,
          completed: false,
          result: null,
        })
        appearances[m.playerA]++
        appearances[m.playerB]++
      }
    }
    prevRepeater = repeaterThisRound
  }

  return { matches: out, stats: buildStats(out) }
}

function rotate(arr, n) {
  if (!n) return [...arr]
  const k = ((n % arr.length) + arr.length) % arr.length
  return [...arr.slice(k), ...arr.slice(0, k)]
}

function groupByRound(matches) {
  const map = new Map()
  for (const m of matches) {
    if (!map.has(m.round)) map.set(m.round, [])
    map.get(m.round).push(m)
  }
  return [...map.values()]
}

function buildStats(matches) {
  const appearances = {}
  const pairMap = new Map()
  for (const m of matches) {
    if (m.isBye) continue
    appearances[m.playerA] = (appearances[m.playerA] ?? 0) + 1
    appearances[m.playerB] = (appearances[m.playerB] ?? 0) + 1
    const key = [m.playerA, m.playerB].sort().join(' ⇄ ')
    pairMap.set(key, (pairMap.get(key) ?? 0) + 1)
  }
  const pairs = [...pairMap.entries()]
    .map(([key, count]) => {
      const [a, b] = key.split(' ⇄ ')
      return [a, b, count]
    })
    .sort((x, y) => y[2] - x[2])
  return { appearances, pairs }
}

/**
 * Fusiona stats acumulando apariciones y pareos entre iteraciones.
 */
export function mergeStats(a, b) {
  const appearances = { ...(a?.appearances ?? {}) }
  for (const [name, n] of Object.entries(b?.appearances ?? {})) {
    appearances[name] = (appearances[name] ?? 0) + n
  }
  const pairMap = new Map()
  for (const [x, y, n] of a?.pairs ?? []) {
    pairMap.set([x, y].sort().join(' ⇄ '), n)
  }
  for (const [x, y, n] of b?.pairs ?? []) {
    const key = [x, y].sort().join(' ⇄ ')
    pairMap.set(key, (pairMap.get(key) ?? 0) + n)
  }
  const pairs = [...pairMap.entries()]
    .map(([key, count]) => {
      const [a2, b2] = key.split(' ⇄ ')
      return [a2, b2, count]
    })
    .sort((x, y) => y[2] - x[2])
  return { appearances, pairs }
}

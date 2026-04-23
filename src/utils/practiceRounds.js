import { generateRoundRobin } from './roundRobin.js'

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
 * @param {number} iterationIndex  rotación para segunda/tercera iteración
 * @param {Object} repeatCounts    { [name]: totalRepeats } — histórico persistido en DB
 *   (competitors.repeat_count + in-session repeats so far).
 *   Migration path to Opción B: caller swaps source to user_dancer_stats.total_repeats;
 *   this function's interface and semantics stay the same.
 * @returns {{ matches, stats }}
 *   matches: [{ id, round, playerA, playerB, isBye, isRepeat, repeaterName, completed, result }]
 *   stats: { appearances: {name: n}, repeats: {name: n}, pairs: [[a, b, n], ...] desc }
 */
export function generatePracticeRounds(names, iterationIndex = 0, repeatCounts = {}) {
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
  // thisIterationRepeats: tracks who's already repeated within this call.
  // Combined with repeatCounts (DB history) gives a full picture.
  const thisIterationRepeats = Object.fromEntries(rotated.map((n) => [n, 0]))
  let prevRepeater = null
  const out = []

  for (const roundMatches of rounds) {
    let repeaterThisRound = null
    for (const m of roundMatches) {
      if (m.playerA === GHOST || m.playerB === GHOST) {
        // El partner de GHOST es el "solo": necesita pareja.
        // El repeater baila dos veces esta ronda (por diseño en número impar).
        // Sort key: DB repeat history + in-call repeats (ascending = least-burdened first).
        // Tiebreaker: shuffle before sort so ties resolve randomly, not alphabetically.
        const partner = m.playerA === GHOST ? m.playerB : m.playerA
        const score = (n) => (repeatCounts[n] ?? 0) + thisIterationRepeats[n]
        const candidates = shuffled(
          rotated.filter((n) => n !== partner && n !== prevRepeater)
        ).sort((a, b) => score(a) - score(b))
        const repeater = candidates[0] ?? rotated.find((n) => n !== partner)
        repeaterThisRound = repeater
        thisIterationRepeats[repeater] = (thisIterationRepeats[repeater] ?? 0) + 1
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

export function buildStats(matches) {
  const appearances = {}
  const repeats = {}
  const pairMap = new Map()
  for (const m of matches) {
    if (m.isBye) continue
    appearances[m.playerA] = (appearances[m.playerA] ?? 0) + 1
    appearances[m.playerB] = (appearances[m.playerB] ?? 0) + 1
    if (m.isRepeat && m.repeaterName) {
      repeats[m.repeaterName] = (repeats[m.repeaterName] ?? 0) + 1
    }
    const key = [m.playerA, m.playerB].sort().join(' ⇄ ')
    pairMap.set(key, (pairMap.get(key) ?? 0) + 1)
  }
  const pairs = [...pairMap.entries()]
    .map(([key, count]) => {
      const [a, b] = key.split(' ⇄ ')
      return [a, b, count]
    })
    .sort((x, y) => y[2] - x[2])
  return { appearances, repeats, pairs }
}

/**
 * Fusiona stats acumulando apariciones y pareos entre iteraciones.
 */
export function countCompletedDancesPerPerson(matches) {
  const o = {}
  for (const m of matches) {
    if (m.isBye || !m.completed) continue
    o[m.playerA] = (o[m.playerA] ?? 0) + 1
    o[m.playerB] = (o[m.playerB] ?? 0) + 1
  }
  return o
}

export function aggregateSessionDanceCounts(practiceIterations, currentMatches) {
  const out = {}
  const merge = (obj) => {
    for (const [k, v] of Object.entries(obj)) {
      out[k] = (out[k] ?? 0) + v
    }
  }
  if (!practiceIterations.length) {
    merge(countCompletedDancesPerPerson(currentMatches ?? []))
    return out
  }
  for (let i = 0; i < practiceIterations.length - 1; i++) {
    merge(countCompletedDancesPerPerson(practiceIterations[i].matches ?? []))
  }
  merge(countCompletedDancesPerPerson(currentMatches ?? []))
  return out
}

export function sessionCompletedNonByePairings(practiceIterations, currentMatches) {
  const out = []
  if (!practiceIterations.length) {
    for (const m of currentMatches ?? []) {
      if (m.isBye || !m.completed) continue
      out.push(m)
    }
    return out
  }
  for (let i = 0; i < practiceIterations.length - 1; i++) {
    for (const m of practiceIterations[i].matches ?? []) {
      if (m.isBye || !m.completed) continue
      out.push(m)
    }
  }
  for (const m of currentMatches ?? []) {
    if (m.isBye || !m.completed) continue
    out.push(m)
  }
  return out
}

export function mergeStats(a, b) {
  const appearances = { ...(a?.appearances ?? {}) }
  for (const [name, n] of Object.entries(b?.appearances ?? {})) {
    appearances[name] = (appearances[name] ?? 0) + n
  }
  const repeats = { ...(a?.repeats ?? {}) }
  for (const [name, n] of Object.entries(b?.repeats ?? {})) {
    repeats[name] = (repeats[name] ?? 0) + n
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
  return { appearances, repeats, pairs }
}

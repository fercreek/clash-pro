import { generateRoundRobin } from './roundRobin.js'

const GHOST = '__REPEAT__'

export const LEVEL_LABELS = { beginner: 'B', intermedio: 'I', avanzado: 'A' }
export const LEVEL_NUM = { beginner: 0, intermedio: 1, avanzado: 2 }

// Fisher-Yates shuffle
function shuffled(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pairKey(a, b) {
  return [a, b].sort().join(' ⇄ ')
}

/**
 * Cost of pairing two dancers.
 * Level gap dominates (×10); pair repetition penalizes (×3).
 * null/unknown level treated as intermedio (1) → minimal penalty vs either end.
 */
function pairingCost(a, b, levelOf, pairCounts) {
  const lA = LEVEL_NUM[levelOf[a]] ?? 1
  const lB = LEVEL_NUM[levelOf[b]] ?? 1
  return Math.abs(lA - lB) * 10 + (pairCounts.get(pairKey(a, b)) ?? 0) * 3
}

/**
 * 2-opt local search: for each pair of matches in a round, try swapping
 * partners and keep if total cost decreases. Runs until no improvement.
 * O(matches²) per round — trivial for N ≤ 20.
 */
function optimizeRoundPairings(roundMatches, levelOf, pairCounts) {
  if (roundMatches.length < 2) return roundMatches
  const ms = [...roundMatches]
  let improved = true
  while (improved) {
    improved = false
    for (let i = 0; i < ms.length; i++) {
      for (let j = i + 1; j < ms.length; j++) {
        const { playerA: aA, playerB: aB } = ms[i]
        const { playerA: bA, playerB: bB } = ms[j]
        const before = pairingCost(aA, aB, levelOf, pairCounts)
                     + pairingCost(bA, bB, levelOf, pairCounts)
        // swap1: aA-bA + aB-bB
        const swap1 = pairingCost(aA, bA, levelOf, pairCounts)
                    + pairingCost(aB, bB, levelOf, pairCounts)
        // swap2: aA-bB + aB-bA
        const swap2 = pairingCost(aA, bB, levelOf, pairCounts)
                    + pairingCost(aB, bA, levelOf, pairCounts)
        if (swap1 < before && swap1 <= swap2) {
          ms[i] = { ...ms[i], playerA: aA, playerB: bA }
          ms[j] = { ...ms[j], playerA: aB, playerB: bB }
          improved = true
        } else if (swap2 < before) {
          ms[i] = { ...ms[i], playerA: aA, playerB: bB }
          ms[j] = { ...ms[j], playerA: aB, playerB: bA }
          improved = true
        }
      }
    }
  }
  return ms
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
/**
 * @param {string[]} names
 * @param {number} iterationIndex
 * @param {Object} repeatCounts  { [name]: totalRepeats }
 * @param {Object} levelOf       { [name]: 'beginner'|'intermedio'|'avanzado' } — optional
 * @param {Array}  priorPairings completed match objects from previous iterations (for pairCounts)
 */
export function generatePracticeRounds(names, iterationIndex = 0, repeatCounts = {}, levelOf = {}, priorPairings = []) {
  if (!Array.isArray(names) || names.length < 2) {
    return { matches: [], stats: { appearances: {}, pairs: [] } }
  }

  // Build pair history from prior pairings so optimizer avoids repeating seen pairs.
  const pairCounts = new Map()
  for (const m of priorPairings) {
    if (m.isBye || !m.completed) continue
    const k = pairKey(m.playerA, m.playerB)
    pairCounts.set(k, (pairCounts.get(k) ?? 0) + 1)
  }

  const hasLevels = Object.keys(levelOf).length > 0

  // ≤3: fallback BYE tradicional
  if (names.length <= 3) {
    const matches = generateRoundRobin(rotate(names, iterationIndex))
    return { matches, stats: buildStats(matches) }
  }

  const rotated = rotate(names, iterationIndex)

  // Par: round-robin, luego optimizar por nivel si hay datos de nivel
  if (rotated.length % 2 === 0) {
    const raw = generateRoundRobin(rotated)
    if (!hasLevels) return { matches: raw, stats: buildStats(raw) }
    const byRound = groupByRound(raw)
    const iterPairCounts = new Map(pairCounts)
    const out = []
    for (const roundMs of byRound) {
      const optimized = optimizeRoundPairings(roundMs, levelOf, iterPairCounts)
      for (const m of optimized) {
        iterPairCounts.set(pairKey(m.playerA, m.playerB),
          (iterPairCounts.get(pairKey(m.playerA, m.playerB)) ?? 0) + 1)
        out.push(m)
      }
    }
    return { matches: out, stats: buildStats(out) }
  }

  // Impar >3: round-robin con GHOST + repeater + optimización por nivel
  const base = generateRoundRobin([...rotated, GHOST])
  const rounds = groupByRound(base)
  const thisIterationRepeats = Object.fromEntries(rotated.map((n) => [n, 0]))
  const iterPairCounts = new Map(pairCounts)
  let prevRepeater = null
  const out = []

  for (const roundMatches of rounds) {
    let repeaterThisRound = null
    const roundOut = []

    for (const m of roundMatches) {
      if (m.playerA === GHOST || m.playerB === GHOST) {
        const partner = m.playerA === GHOST ? m.playerB : m.playerA
        const pool = rotated.filter((n) => n !== partner && n !== prevRepeater)
        const minTier = pool.reduce((min, n) => Math.min(min, thisIterationRepeats[n] ?? 0), Infinity)
        const tiered = pool.filter((n) => (thisIterationRepeats[n] ?? 0) <= minTier)
        // Among tier: prefer same/adjacent level, then DB history as final tiebreaker
        const candidates = hasLevels
          ? shuffled(tiered).sort((a, b) => {
              const levelCostA = pairingCost(partner, a, levelOf, iterPairCounts)
              const levelCostB = pairingCost(partner, b, levelOf, iterPairCounts)
              if (levelCostA !== levelCostB) return levelCostA - levelCostB
              return (repeatCounts[a] ?? 0) - (repeatCounts[b] ?? 0)
            })
          : shuffled(tiered).sort((a, b) => (repeatCounts[a] ?? 0) - (repeatCounts[b] ?? 0))
        const repeater = candidates[0] ?? rotated.find((n) => n !== partner)
        repeaterThisRound = repeater
        thisIterationRepeats[repeater] = (thisIterationRepeats[repeater] ?? 0) + 1
        roundOut.push({
          id: m.id, round: m.round,
          playerA: partner, playerB: repeater,
          isBye: false, isRepeat: true, repeaterName: repeater,
          completed: false, result: null,
        })
      } else {
        roundOut.push({
          id: m.id, round: m.round,
          playerA: m.playerA, playerB: m.playerB,
          isBye: false, isRepeat: false, repeaterName: null,
          completed: false, result: null,
        })
      }
    }

    // Optimize non-repeat matches within this round for level affinity
    const nonRepeat = roundOut.filter((m) => !m.isRepeat)
    const repeats = roundOut.filter((m) => m.isRepeat)
    const optimizedNonRepeat = hasLevels
      ? optimizeRoundPairings(nonRepeat, levelOf, iterPairCounts)
      : nonRepeat

    for (const m of [...optimizedNonRepeat, ...repeats]) {
      iterPairCounts.set(pairKey(m.playerA, m.playerB),
        (iterPairCounts.get(pairKey(m.playerA, m.playerB)) ?? 0) + 1)
      out.push(m)
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

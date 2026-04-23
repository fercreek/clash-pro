import { buildStats, mergeStats } from './practiceRounds.js'

const BYE = 'BYE'

function isNonEmptyName(s) {
  return s != null && String(s).trim() !== ''
}

function buildPositionMap(before, after) {
  const out = {}
  for (let i = 0; i < before.length; i++) {
    const to = String(after[i]).trim()
    if (before[i] !== to) {
      out[before[i]] = to
    }
  }
  return out
}

export function validateEqualLengthRemap(before, after) {
  if (!Array.isArray(before) || !Array.isArray(after)) {
    return { ok: false, error: 'Listas inválidas' }
  }
  if (before.length !== after.length) {
    return { ok: false, error: 'Distinto número de participantes' }
  }
  const seenB = new Set()
  for (const s of before) {
    if (!isNonEmptyName(s)) {
      return { ok: false, error: 'Nombre inválido en roster actual' }
    }
    const k = String(s).toLowerCase()
    if (seenB.has(k)) {
      return { ok: false, error: 'Duplicado en roster actual' }
    }
    seenB.add(k)
  }
  const seenA = new Set()
  for (const s of after) {
    if (!isNonEmptyName(s)) {
      return { ok: false, error: 'Nombre vacío' }
    }
    const k = String(s).trim().toLowerCase()
    if (seenA.has(k)) {
      return { ok: false, error: 'Nombres duplicados' }
    }
    seenA.add(k)
  }
  return { ok: true, map: buildPositionMap(before, after) }
}

export function renameField(name, map) {
  if (name == null) return name
  if (name === BYE) return name
  if (Object.prototype.hasOwnProperty.call(map, name)) return map[name]
  return name
}

export function remapMatches(matches, map) {
  if (!Object.keys(map).length) {
    return matches
  }
  return matches.map((m) => {
    if (m.isBye) {
      return {
        ...m,
        playerA: renameField(m.playerA, map),
        playerB: m.playerB === BYE ? BYE : renameField(m.playerB, map),
      }
    }
    return {
      ...m,
      playerA: renameField(m.playerA, map),
      playerB: renameField(m.playerB, map),
      repeaterName: m.repeaterName == null ? m.repeaterName : renameField(m.repeaterName, map),
    }
  })
}

export function remapRepeatCounts(m, map) {
  if (!Object.keys(map).length) {
    return { ...m }
  }
  const o = {}
  for (const [k, v] of Object.entries(m ?? {})) {
    const nk = renameField(k, map)
    o[nk] = (o[nk] ?? 0) + v
  }
  return o
}

export function remapIterationEntry(entry, map) {
  if (!entry) return entry
  const nextMatches = remapMatches(entry.matches ?? [], map)
  return {
    ...entry,
    matches: nextMatches,
    stats: buildStats(nextMatches),
  }
}

export function recomputeAggregatedStatsFromIterations(practiceIterations) {
  if (!practiceIterations?.length) {
    return { appearances: {}, repeats: {}, pairs: [] }
  }
  let acc = practiceIterations[0].stats ?? buildStats(practiceIterations[0].matches ?? [])
  for (let i = 1; i < practiceIterations.length; i++) {
    const st = practiceIterations[i].stats ?? buildStats(practiceIterations[i].matches ?? [])
    acc = mergeStats(acc, st)
  }
  return acc
}

export function remapPracticeState({
  matches,
  competitorsAfter,
  practiceIterations,
  practiceInitialRepeatCounts,
  map,
}) {
  const nextCompetitors = competitorsAfter.map((s) => String(s).trim())
  const nextMatches = remapMatches(matches, map)
  const iters = (practiceIterations ?? []).map((it, i) => {
    if (i === practiceIterations.length - 1) {
      return { ...it, matches: nextMatches, stats: buildStats(nextMatches) }
    }
    return remapIterationEntry(it, map)
  })
  return {
    competitors: nextCompetitors,
    matches: nextMatches,
    practiceIterations: iters,
    practiceStats: recomputeAggregatedStatsFromIterations(iters),
    practiceInitialRepeatCounts: remapRepeatCounts(practiceInitialRepeatCounts, map),
  }
}

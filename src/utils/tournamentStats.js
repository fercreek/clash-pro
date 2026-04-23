import { COMPETITION_MODE } from '../lib/featurePolicy'
import { computeExtendedStats } from './roundRobin'

function ensurePlayer(map, name) {
  if (!map.has(name)) {
    map.set(name, {
      name,
      wins: 0,
      losses: 0,
      draws: 0,
      played: 0,
      tournamentIds: new Set(),
    })
  }
  return map.get(name)
}

function recordMatchOnCareer(map, m) {
  if (!m.completed || m.isBye) return
  const a = m.playerA
  const b = m.playerB
  ensurePlayer(map, a)
  ensurePlayer(map, b)
  if (m.result === 'A') {
    const sa = map.get(a)
    const sb = map.get(b)
    sa.wins++
    sa.played++
    sb.losses++
    sb.played++
  } else if (m.result === 'B') {
    const sa = map.get(a)
    const sb = map.get(b)
    sb.wins++
    sb.played++
    sa.losses++
    sa.played++
  } else if (m.result === 'draw') {
    const sa = map.get(a)
    const sb = map.get(b)
    sa.draws++
    sa.played++
    sb.draws++
    sb.played++
  }
}

export function statsForArchiveRow(row) {
  const competitors = row.competitors ?? []
  const matches = row.matches ?? []
  return computeExtendedStats(competitors, matches)
}

export function aggregateCareerStatsFromArchives(archives) {
  if (!archives?.length) {
    return { players: [], tournamentsConsidered: 0 }
  }
  const byName = new Map()
  const sorted = [...archives].sort(
    (x, y) => new Date(x.finished_at) - new Date(y.finished_at)
  )
  let tournamentsConsidered = 0
  for (const row of sorted) {
    if (row.competition_mode === COMPETITION_MODE.practice) continue
    tournamentsConsidered++
    const competitors = row.competitors ?? []
    const matches = row.matches ?? []
    const id = row.id ?? String(tournamentsConsidered)
    for (const c of competitors) {
      ensurePlayer(byName, c).tournamentIds.add(id)
    }
    for (const m of matches) {
      recordMatchOnCareer(byName, m)
    }
  }
  const players = Array.from(byName.values()).map((p) => {
    const { tournamentIds, ...rest } = p
    const tournaments = tournamentIds.size
    const winRate = rest.played > 0 ? Math.round((rest.wins / rest.played) * 100) : 0
    return { ...rest, tournaments, winRate }
  })
  players.sort((a, b) => b.wins - a.wins || b.winRate - a.winRate)
  return { players, tournamentsConsidered }
}

export function topCareerByWins(players, n = 3) {
  return [...players].sort((a, b) => b.wins - a.wins).slice(0, n)
}

/**
 * Genera todos los emparejamientos Round Robin para un array de competidores.
 * Si el número es impar, agrega 'BYE' como placeholder de descanso.
 * Retorna un array plano de matches con el siguiente shape:
 * { id, playerA, playerB, isBye, completed, result }
 */
export function generateRoundRobin(competitors) {
  const players = [...competitors]
  if (players.length % 2 !== 0) players.push('BYE')

  const n = players.length
  const allMatches = []
  let matchIndex = 0

  for (let round = 0; round < n - 1; round++) {
    for (let i = 0; i < n / 2; i++) {
      const home = players[i]
      const away = players[n - 1 - i]
      const isBye = home === 'BYE' || away === 'BYE'

      allMatches.push({
        id: `match-${matchIndex++}`,
        round: round + 1,
        playerA: isBye ? (home === 'BYE' ? away : home) : home,
        playerB: isBye ? 'BYE' : away,
        isBye,
        completed: isBye,
        result: isBye ? 'bye' : null,
      })
    }

    // Rotación: el primer jugador es fijo, el resto rota en sentido horario
    players.splice(1, 0, players.pop())
  }

  return allMatches
}

/**
 * Calcula el leaderboard a partir del array de matches.
 * Puntuación: Victoria = 3 pts | Empate = 1 pt cada uno | Derrota = 0 pts
 */
export function calculateScores(competitors, matches) {
  const scores = Object.fromEntries(competitors.map((c) => [c, 0]))

  for (const match of matches) {
    if (!match.completed || match.isBye) continue

    if (match.result === 'A') {
      scores[match.playerA] = (scores[match.playerA] || 0) + 3
    } else if (match.result === 'B') {
      scores[match.playerB] = (scores[match.playerB] || 0) + 3
    } else if (match.result === 'draw') {
      scores[match.playerA] = (scores[match.playerA] || 0) + 1
      scores[match.playerB] = (scores[match.playerB] || 0) + 1
    }
  }

  return Object.entries(scores)
    .map(([name, points]) => ({ name, points }))
    .sort((a, b) => b.points - a.points)
}

/**
 * Calcula estadísticas extendidas por competidor.
 * Retorna array de { name, wins, losses, draws, played, winRate, currentStreak }
 * currentStreak: positivo = racha de victorias, negativo = racha de derrotas
 */
export function computeExtendedStats(competitors, matches) {
  const stats = Object.fromEntries(
    competitors.map((c) => [c, { name: c, wins: 0, losses: 0, draws: 0, played: 0 }])
  )

  const completedByPlayer = {}
  for (const c of competitors) completedByPlayer[c] = []

  for (const m of matches) {
    if (!m.completed || m.isBye) continue
    completedByPlayer[m.playerA]?.push(m)
    completedByPlayer[m.playerB]?.push(m)

    if (m.result === 'A') {
      if (stats[m.playerA]) { stats[m.playerA].wins++; stats[m.playerA].played++ }
      if (stats[m.playerB]) { stats[m.playerB].losses++; stats[m.playerB].played++ }
    } else if (m.result === 'B') {
      if (stats[m.playerB]) { stats[m.playerB].wins++; stats[m.playerB].played++ }
      if (stats[m.playerA]) { stats[m.playerA].losses++; stats[m.playerA].played++ }
    } else if (m.result === 'draw') {
      if (stats[m.playerA]) { stats[m.playerA].draws++; stats[m.playerA].played++ }
      if (stats[m.playerB]) { stats[m.playerB].draws++; stats[m.playerB].played++ }
    }
  }

  for (const c of competitors) {
    const s = stats[c]
    s.winRate = s.played > 0 ? Math.round((s.wins / s.played) * 100) : 0

    const history = completedByPlayer[c]
    let streak = 0
    for (let i = history.length - 1; i >= 0; i--) {
      const m = history[i]
      const won  = (m.result === 'A' && m.playerA === c) || (m.result === 'B' && m.playerB === c)
      const lost = (m.result === 'A' && m.playerB === c) || (m.result === 'B' && m.playerA === c)
      if (i === history.length - 1) {
        if (won) streak = 1
        else if (lost) streak = -1
        else break
      } else {
        if (streak > 0 && won) streak++
        else if (streak < 0 && lost) streak--
        else break
      }
    }
    s.currentStreak = streak
  }

  return competitors.map((c) => stats[c])
}

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

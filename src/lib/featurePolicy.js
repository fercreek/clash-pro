export const COMPETITION_MODE = {
  practice: 'practice',
  tournament: 'tournament',
}

export function canSelectTournamentMode(isFree) {
  return !isFree
}

export function showMatchesLeaderboardControls(isTournament) {
  return isTournament === true
}

export function showMatchesMiniRanking(isTournament) {
  return isTournament === true
}

export function showLeaderboardRoute(isTournament) {
  return isTournament === true
}

export function showConfettiOnLeaderboard(isTournament) {
  return isTournament === true
}

export function showExtendedStatsInLeaderboard(hasStats, isTournament) {
  return Boolean(hasStats && isTournament)
}

export function showRichWhatsAppInLeaderboard(hasStats, isTournament) {
  return Boolean(hasStats && isTournament)
}

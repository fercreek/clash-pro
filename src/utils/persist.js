import { COMPETITION_MODE } from '../lib/featurePolicy'

const STORAGE_KEY = 'clashpro:v1'

const VALID_SCREENS = new Set(['setup', 'matches', 'battle', 'leaderboard'])

function isValidMatch(m) {
  if (!m || typeof m !== 'object') return false
  if (typeof m.id !== 'string') return false
  if (typeof m.playerA !== 'string') return false
  if (typeof m.playerB !== 'string') return false
  if (typeof m.isBye !== 'boolean') return false
  if (typeof m.completed !== 'boolean') return false
  if (m.round != null && typeof m.round !== 'number') return false
  return true
}

function normalizeCompetitionMode(raw) {
  if (raw === COMPETITION_MODE.practice || raw === COMPETITION_MODE.tournament) return raw
  return COMPETITION_MODE.tournament
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (data.version !== 1 && data.version !== 2) return null
    if (!VALID_SCREENS.has(data.screen)) return null
    if (!Array.isArray(data.competitors)) return null
    if (!Array.isArray(data.matches)) return null
    if (typeof data.roundTime !== 'number' || data.roundTime < 1) return null
    if (data.activeMatchId != null && typeof data.activeMatchId !== 'string') return null
    for (let i = 0; i < data.matches.length; i++) {
      if (!isValidMatch(data.matches[i])) return null
    }
    const competitionMode = normalizeCompetitionMode(
      data.version >= 2 ? data.competitionMode : COMPETITION_MODE.tournament
    )
    return {
      screen: data.screen,
      competitors: data.competitors,
      roundTime: data.roundTime,
      matches: data.matches,
      activeMatchId: data.activeMatchId ?? null,
      competitionMode,
      savedAt: data.savedAt,
    }
  } catch {
    return null
  }
}

export function saveState(snapshot) {
  try {
    const payload = {
      version: 2,
      savedAt: new Date().toISOString(),
      screen: snapshot.screen,
      competitors: snapshot.competitors,
      roundTime: snapshot.roundTime,
      matches: snapshot.matches,
      activeMatchId: snapshot.activeMatchId ?? null,
      competitionMode: normalizeCompetitionMode(snapshot.competitionMode),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {}
}

export function clearState() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {}
}

export function normalizeHydratedScreen(screen, activeMatchId) {
  if (screen === 'battle') {
    return { screen: 'matches', activeMatchId: null }
  }
  return { screen, activeMatchId }
}

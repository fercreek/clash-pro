import { COMPETITION_MODE } from '../lib/featurePolicy'

const STORAGE_KEY = 'clashpro:v1'

const VALID_SCREENS = new Set(['setup', 'matches', 'battle', 'leaderboard', 'practice_setup', 'practice_live'])

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

function normalizeBattleRoundCount(raw) {
  const n = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(n)) return 4
  return Math.min(4, Math.max(1, Math.floor(n)))
}

function isValidPracticeIterations(raw) {
  if (!Array.isArray(raw)) return false
  for (const it of raw) {
    if (!it || typeof it !== 'object') return false
    if (!Array.isArray(it.matches)) return false
  }
  return true
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (data.version !== 1 && data.version !== 2 && data.version !== 3) return null
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
    const battleRoundCount =
      data.version >= 2 && data.battleRoundCount != null
        ? normalizeBattleRoundCount(data.battleRoundCount)
        : 4
    const practiceIterations =
      data.version >= 3 && isValidPracticeIterations(data.practiceIterations)
        ? data.practiceIterations
        : []
    const practiceStats =
      data.version >= 3 && data.practiceStats && typeof data.practiceStats === 'object'
        ? data.practiceStats
        : { appearances: {}, repeats: {}, pairs: [] }
    const practiceInitialRepeatCounts =
      data.version >= 3 && data.practiceInitialRepeatCounts && typeof data.practiceInitialRepeatCounts === 'object'
        ? data.practiceInitialRepeatCounts
        : {}
    return {
      screen: data.screen,
      competitors: data.competitors,
      roundTime: data.roundTime,
      matches: data.matches,
      activeMatchId: data.activeMatchId ?? null,
      competitionMode,
      battleRoundCount,
      practiceIterations,
      practiceStats,
      practiceInitialRepeatCounts,
      savedAt: data.savedAt,
    }
  } catch {
    return null
  }
}

export function saveState(snapshot) {
  try {
    const payload = {
      version: 3,
      savedAt: new Date().toISOString(),
      screen: snapshot.screen,
      competitors: snapshot.competitors,
      roundTime: snapshot.roundTime,
      matches: snapshot.matches,
      activeMatchId: snapshot.activeMatchId ?? null,
      competitionMode: normalizeCompetitionMode(snapshot.competitionMode),
      battleRoundCount: normalizeBattleRoundCount(snapshot.battleRoundCount),
      practiceIterations: snapshot.practiceIterations ?? [],
      practiceStats: snapshot.practiceStats ?? { appearances: {}, repeats: {}, pairs: [] },
      practiceInitialRepeatCounts: snapshot.practiceInitialRepeatCounts ?? {},
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

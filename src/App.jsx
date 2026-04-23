import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import SetupScreen from './components/SetupScreen'
import MatchesScreen from './components/MatchesScreen'
import BattleScreen from './components/BattleScreen'
import LeaderboardScreen from './components/LeaderboardScreen'
import SpotifyPlayer from './components/SpotifyPlayer'
import AuthScreen from './components/AuthScreen'
import HamburgerMenu from './components/HamburgerMenu'
import TournamentHistoryModal from './components/TournamentHistoryModal'
import BlogScreen from './components/BlogScreen'
import BlogPostScreen from './components/BlogPostScreen'
import GuiaScreen from './components/GuiaScreen'
import PatternsScreen from './components/PatternsScreen'
import PracticeHistoryScreen from './components/PracticeHistoryScreen'
import PracticeRosterRegenerateModal from './components/PracticeRosterRegenerateModal'
import DashboardScreen from './components/DashboardScreen'
import PublicLiveScreen from './components/PublicLiveScreen'
import { generateRoundRobin, isRoundRobinFinished } from './utils/roundRobin'
import {
  aggregateSessionDanceCounts,
  buildStats,
  generatePracticeRounds,
  mergeStats,
  sessionCompletedNonByePairings,
} from './utils/practiceRounds'
import {
  recomputeAggregatedStatsFromIterations,
  remapPracticeState,
  validateEqualLengthRemap,
} from './utils/remapParticipantNames.js'
import { saveTournamentArchive } from './lib/tournamentArchives'
import { useRoster } from './hooks/useRoster'
import { usePracticeSession } from './hooks/usePracticeSession'
import { loadState, saveState, clearState, normalizeHydratedScreen } from './utils/persist'
import { useAuth } from './hooks/useAuth'
import { usePlan } from './hooks/usePlan'
import { CompetitionModeProvider } from './hooks/useMode'
import { supabase } from './lib/supabase'
import { useTournamentPersistence } from './hooks/useTournamentState'
import {
  COMPETITION_MODE,
  showLeaderboardRoute,
  showExtendedStatsInLeaderboard,
  showConfettiOnLeaderboard,
  showRichWhatsAppInLeaderboard,
} from './lib/featurePolicy'
import { Menu } from 'lucide-react'

const SCREENS = {
  DASHBOARD: 'dashboard',
  SETUP: 'setup',
  MATCHES: 'matches',
  BATTLE: 'battle',
  LEADERBOARD: 'leaderboard',
  BLOG: 'blog',
  BLOG_POST: 'blog_post',
  GUIA: 'guia',
  PATTERNS: 'patterns',
  PRACTICE_SETUP: 'practice_setup',
  PRACTICE_LIVE: 'practice_live',
  PRACTICE_HISTORY: 'practice_history',
}

function computeBootState() {
  const loaded = loadState()
  if (!loaded) {
    return {
      screen: SCREENS.DASHBOARD,
      competitors: [],
      roundTime: 40,
      battleRoundCount: 4,
      matches: [],
      activeMatchId: null,
      competitionMode: COMPETITION_MODE.tournament,
    }
  }
  const competitionMode = loaded.competitionMode ?? COMPETITION_MODE.tournament
  let screen = loaded.screen
  if (competitionMode === COMPETITION_MODE.practice && screen === SCREENS.LEADERBOARD) {
    screen = SCREENS.PRACTICE_LIVE
  }
  if (competitionMode === COMPETITION_MODE.practice && screen === SCREENS.MATCHES) {
    screen = SCREENS.PRACTICE_LIVE
  }
  const norm = normalizeHydratedScreen(screen, loaded.activeMatchId)
  const hasActiveMatches = (loaded.matches?.length ?? 0) > 0
  return {
    screen: hasActiveMatches ? norm.screen : SCREENS.DASHBOARD,
    competitors: loaded.competitors ?? [],
    roundTime: loaded.roundTime,
    battleRoundCount: loaded.battleRoundCount ?? 4,
    matches: loaded.matches,
    activeMatchId: norm.activeMatchId,
    competitionMode,
  }
}

function AppShell() {
  const { user, profile, loading: authLoading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()
  const { planLabel, isPro, isFree, hasStats, hasHistory } = usePlan()
  const [menuOpen, setMenuOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [navImgBroken, setNavImgBroken] = useState(false)
  const [nowPlaying, setNowPlaying] = useState(null)
  const [blogSlug, setBlogSlug]     = useState(() => {
    const path = window.location.pathname
    if (path.startsWith('/blog/')) return path.replace('/blog/', '')
    return null
  })
  const [blogFilter, setBlogFilter] = useState(null)
  const [livePathId] = useState(() => {
    if (typeof window === 'undefined') return null
    const p = window.location.pathname
    if (!p.startsWith('/live/')) return null
    return p.split('/').filter(Boolean)[1] || null
  })
  const spotifyRef = useRef(null)
  const [boot] = useState(computeBootState)
  const [screen, setScreen] = useState(() => {
    const path = window.location.pathname
    if (path.startsWith('/blog/')) return SCREENS.BLOG_POST
    if (path === '/blog') return SCREENS.BLOG
    if (path === '/guide' || path === '/practice') return SCREENS.GUIA
    if (path === '/patterns') return SCREENS.PATTERNS
    if (path === '/practice/setup') return SCREENS.PRACTICE_SETUP
    if (path === '/practice/live') return SCREENS.PRACTICE_LIVE
    if (path === '/practice/history' || path === '/practice-history') return SCREENS.PRACTICE_HISTORY
    if (path === '/dashboard') return SCREENS.DASHBOARD
    if (boot.screen === SCREENS.SETUP || boot.screen === SCREENS.PRACTICE_SETUP) return SCREENS.DASHBOARD
    return boot.screen
  })
  const [competitors, setCompetitors] = useState(boot.competitors)
  const [roundTime, setRoundTime] = useState(boot.roundTime)
  const [battleRoundCount, setBattleRoundCount] = useState(boot.battleRoundCount)
  const [matches, setMatches] = useState(boot.matches)
  const [activeMatchId, setActiveMatchId] = useState(boot.activeMatchId)
  const [competitionMode, setCompetitionMode] = useState(boot.competitionMode)
  const [practiceIterations, setPracticeIterations] = useState([])
  const [practiceStats, setPracticeStats] = useState({ appearances: {}, repeats: {}, pairs: [] })
  const [practiceStartedAt, setPracticeStartedAt] = useState(null)
  const [currentPracticeRound, setCurrentPracticeRound] = useState(1)
  // DB repeat_count snapshot at session start — combined with in-session repeats
  // for fair repeater distribution across iterations.
  const [practiceInitialRepeatCounts, setPracticeInitialRepeatCounts] = useState({})
  const [practiceRegenerateDraft, setPracticeRegenerateDraft] = useState(null)

  const isTournament = competitionMode === COMPETITION_MODE.tournament

  const sessionDanceCounts = useMemo(
    () =>
      competitionMode === COMPETITION_MODE.practice
        ? aggregateSessionDanceCounts(practiceIterations, matches)
        : null,
    [competitionMode, practiceIterations, matches]
  )

  const sessionCompletedPairings = useMemo(
    () =>
      competitionMode === COMPETITION_MODE.practice
        ? sessionCompletedNonByePairings(practiceIterations, matches)
        : [],
    [competitionMode, practiceIterations, matches]
  )

  const { bumpFrequency, bumpRepeatCount } = useRoster()
  const { save: savePracticeSession } = usePracticeSession()

  const goTo = useCallback((nextScreen, opts = {}) => {
    window.history.pushState({ screen: nextScreen, ...opts }, '')
    setScreen(nextScreen)
  }, [])

  useEffect(() => {
    const handlePop = () => {
      setScreen((cur) => {
        if (cur === SCREENS.BATTLE) {
          setActiveMatchId(null)
          return isTournament ? SCREENS.MATCHES : SCREENS.PRACTICE_LIVE
        }
        if (cur === SCREENS.LEADERBOARD) return SCREENS.MATCHES
        if (cur === SCREENS.MATCHES) return SCREENS.SETUP
        if (cur === SCREENS.SETUP) return SCREENS.DASHBOARD
        if (cur === SCREENS.BLOG_POST) return SCREENS.BLOG
        if (cur === SCREENS.PRACTICE_LIVE) return SCREENS.PRACTICE_SETUP
        if (cur === SCREENS.PRACTICE_SETUP) return SCREENS.DASHBOARD
        if (cur === SCREENS.BLOG || cur === SCREENS.GUIA || cur === SCREENS.PATTERNS || cur === SCREENS.PRACTICE_HISTORY) return SCREENS.DASHBOARD
        return cur
      })
    }
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [isTournament])

  const goToBlog = useCallback((filter = null) => {
    window.history.pushState({ screen: SCREENS.BLOG }, '', '/blog')
    setScreen(SCREENS.BLOG)
    setBlogFilter(filter)
  }, [])

  const goToBlogPost = useCallback((slug) => {
    window.history.pushState({ screen: SCREENS.BLOG_POST, slug }, '', `/blog/${slug}`)
    setScreen(SCREENS.BLOG_POST)
    setBlogSlug(slug)
  }, [])

  const goToGuia = useCallback(() => {
    window.history.pushState({ screen: SCREENS.GUIA }, '', '/guide')
    setScreen(SCREENS.GUIA)
  }, [])

  const goToPracticeSetup = useCallback(() => {
    window.history.pushState({ screen: SCREENS.PRACTICE_SETUP }, '', '/practice/setup')
    setScreen(SCREENS.PRACTICE_SETUP)
  }, [])

  const goToPracticeLive = useCallback(() => {
    window.history.pushState({ screen: SCREENS.PRACTICE_LIVE }, '', '/practice/live')
    setScreen(SCREENS.PRACTICE_LIVE)
  }, [])

  const goToPatterns = useCallback(() => {
    window.history.pushState({ screen: SCREENS.PATTERNS }, '', '/patterns')
    setScreen(SCREENS.PATTERNS)
  }, [])

  const onTournamentLoaded = useCallback((payload) => {
    if (payload.battleRoundCount != null) {
      setBattleRoundCount(Math.min(4, Math.max(1, Number(payload.battleRoundCount) || 4)))
    }
    if (payload.matches?.length) {
      if (window.location.pathname === '/dashboard') return
      const norm = normalizeHydratedScreen(payload.screen, payload.activeMatchId)
      let s = norm.screen
      if (payload.competitionMode === COMPETITION_MODE.practice) {
        if (s === SCREENS.LEADERBOARD || s === SCREENS.MATCHES) s = SCREENS.PRACTICE_LIVE
      }
      setCompetitors(payload.competitors)
      setMatches(payload.matches)
      setRoundTime(payload.roundTime)
      setScreen(s)
      setActiveMatchId(norm.activeMatchId)
      setCompetitionMode(payload.competitionMode)
    }
  }, [])

  const { save: saveTournament, clearRemote } = useTournamentPersistence({
    user,
    isFree,
    onLoaded: onTournamentLoaded,
  })

  useEffect(() => {
    saveTournament({ competitors, matches, roundTime, screen, activeMatchId, competitionMode, battleRoundCount })
  }, [competitors, matches, roundTime, screen, activeMatchId, competitionMode, battleRoundCount, saveTournament])

  useEffect(() => {
    if (!user) return
    if (screen !== SCREENS.DASHBOARD) return
    supabase
      .from('competitors')
      .select('id, name, photo_url, is_active')
      .order('name')
      .then(({ data }) => {
        if (data?.length) {
          setCompetitors(data.filter((c) => c.is_active).map((c) => c.name))
        }
      })
  }, [user, screen])

  useEffect(() => {
    saveState({ screen, competitors, roundTime, battleRoundCount, matches, activeMatchId, competitionMode })
  }, [screen, competitors, roundTime, battleRoundCount, matches, activeMatchId, competitionMode])

  useEffect(() => {
    setNavImgBroken(false)
  }, [profile?.photo_url])

  useEffect(() => {
    if (!user) return
    const path = window.location.pathname
    if (path === '/' || path === '') {
      window.history.replaceState({ screen: SCREENS.DASHBOARD }, '', '/dashboard')
      setScreen(SCREENS.DASHBOARD)
    } else if (path === '/dashboard') {
      setScreen(SCREENS.DASHBOARD)
    }
  }, [user])

  useEffect(() => {
    if (profile == null) return
    if (isFree && competitionMode === COMPETITION_MODE.tournament) {
      setCompetitionMode(COMPETITION_MODE.practice)
    }
  }, [profile, isFree, competitionMode])

  useEffect(() => {
    if (!user) return
    if (screen === SCREENS.PRACTICE_LIVE || screen === SCREENS.PRACTICE_HISTORY) {
      setCompetitionMode(COMPETITION_MODE.practice)
    }
  }, [user, screen])

  useEffect(() => {
    if (screen === SCREENS.LEADERBOARD && !showLeaderboardRoute(isTournament)) {
      setScreen(SCREENS.MATCHES)
    }
  }, [screen, isTournament])

  const archiveCompletedIfNeeded = useCallback(() => {
    if (!user?.id || !hasHistory) return
    if (competitionMode !== COMPETITION_MODE.tournament) return
    if (!isRoundRobinFinished(matches)) return
    saveTournamentArchive({
      userId: user.id,
      competitors,
      matches,
      roundTime,
      competitionMode,
    })
  }, [user?.id, hasHistory, competitionMode, matches, competitors, roundTime])

  const handleStartTournament = useCallback((finalCompetitors, selectedTime, repeatCounts = {}, br) => {
    archiveCompletedIfNeeded()
    if (competitionMode === COMPETITION_MODE.practice) {
      const { matches: generated, stats } = generatePracticeRounds(finalCompetitors, 0, repeatCounts)
      setCompetitors(finalCompetitors)
      setRoundTime(selectedTime)
      setMatches(generated)
      setPracticeIterations([{ matches: generated, stats }])
      setPracticeStats(stats)
      setPracticeStartedAt(new Date().toISOString())
      setPracticeInitialRepeatCounts(repeatCounts)
      setCurrentPracticeRound(1)
      goToPracticeLive()
      return
    }
    const n = br == null ? battleRoundCount : Math.min(4, Math.max(1, Number(br) || 4))
    setBattleRoundCount(n)
    const generated = generateRoundRobin(finalCompetitors)
    setCompetitors(finalCompetitors)
    setRoundTime(selectedTime)
    setMatches(generated)
    goTo(SCREENS.MATCHES)
  }, [goTo, archiveCompletedIfNeeded, competitionMode, goToPracticeLive, battleRoundCount])

  const goToMatchList = useCallback(() => {
    if (isTournament) {
      goTo(SCREENS.MATCHES)
    } else {
      goToPracticeLive()
    }
  }, [isTournament, goTo, goToPracticeLive])

  const handleStartBattle = useCallback((matchId) => {
    setActiveMatchId(matchId)
    goTo(SCREENS.BATTLE)
  }, [goTo])

  const handleBattleEnd = useCallback((matchId, result) => {
    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId ? { ...m, completed: true, result } : m
      )
    )
    setActiveMatchId(null)
    goToMatchList()
  }, [goToMatchList])

  const handleQuickClose = useCallback((matchId, result) => {
    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId ? { ...m, completed: true, result } : m
      )
    )
  }, [])

  const practiceIterationsRef = useRef(practiceIterations)
  practiceIterationsRef.current = practiceIterations

  const handleUpdateMatchNames = useCallback(
    (matchId, playerA, playerB) => {
      const a1 = String(playerA).trim()
      const b1 = String(playerB).trim()
      if (!a1 || !b1) return
      setMatches((prev) =>
        prev.map((m) =>
          m.id === matchId
            ? { ...m, playerA: a1, playerB: b1, isRepeat: false, repeaterName: null }
            : m
        )
      )
      setCompetitors((prev) => {
        const have = new Set(prev.map((n) => n.toLowerCase()))
        const out = [...prev]
        for (const n of [a1, b1]) {
          if (!have.has(n.toLowerCase())) {
            have.add(n.toLowerCase())
            out.push(n)
          }
        }
        return out
      })
      if (competitionMode !== COMPETITION_MODE.practice) return
      const p = practiceIterationsRef.current
      if (!p.length) return
      const i = p.length - 1
      const newLast = (p[i].matches ?? []).map((m) =>
        m.id === matchId
          ? { ...m, playerA: a1, playerB: b1, isRepeat: false, repeaterName: null }
          : m
      )
      const it = { ...p[i], matches: newLast, stats: buildStats(newLast) }
      const nextIters = [...p.slice(0, i), it]
      setPracticeIterations(nextIters)
      setPracticeStats(recomputeAggregatedStatsFromIterations(nextIters))
    },
    [competitionMode]
  )

  const handleViewLeaderboard = useCallback(() => {
    if (!showLeaderboardRoute(isTournament)) return
    goTo(SCREENS.LEADERBOARD)
  }, [goTo, isTournament])

  const handleBackToMatches = useCallback(() => {
    goTo(SCREENS.MATCHES)
  }, [goTo])

  const goToDashboard = useCallback(() => {
    window.history.pushState({ screen: SCREENS.DASHBOARD }, '', '/dashboard')
    setScreen(SCREENS.DASHBOARD)
  }, [])

  const handleDashboardTournament = useCallback(() => {
    setCompetitionMode(COMPETITION_MODE.tournament)
    goTo(SCREENS.SETUP)
  }, [goTo])

  const handleDashboardPractice = useCallback(() => {
    setCompetitionMode(COMPETITION_MODE.practice)
    goToPracticeSetup()
  }, [goToPracticeSetup])

  const handleReset = useCallback(() => {
    archiveCompletedIfNeeded()
    clearState()
    clearRemote()
    setMatches([])
    setActiveMatchId(null)
    goToDashboard()
  }, [goToDashboard, clearRemote, archiveCompletedIfNeeded])

  const handleNewSession = useCallback(() => {
    archiveCompletedIfNeeded()
    const generated = generateRoundRobin(competitors)
    setMatches(generated)
    setActiveMatchId(null)
    goTo(SCREENS.MATCHES)
  }, [competitors, goTo, archiveCompletedIfNeeded])

  const handleNextPracticeIteration = useCallback(() => {
    const nextIdx = practiceIterations.length
    const combinedRepeatCounts = { ...practiceInitialRepeatCounts }
    for (const [name, n] of Object.entries(practiceStats.repeats ?? {})) {
      combinedRepeatCounts[name] = (combinedRepeatCounts[name] ?? 0) + n
    }
    const { matches: generated, stats } = generatePracticeRounds(competitors, nextIdx, combinedRepeatCounts)
    setMatches(generated)
    setActiveMatchId(null)
    setPracticeIterations((prev) => {
      if (!prev.length) {
        return [{ matches: generated, stats }]
      }
      const withSynced = [
        ...prev.slice(0, -1),
        { ...prev[prev.length - 1], matches, stats: buildStats(matches) },
      ]
      return [...withSynced, { matches: generated, stats }]
    })
    setPracticeStats((prev) => mergeStats(prev, stats))
    setCurrentPracticeRound(1)
    goToPracticeLive()
  }, [competitors, practiceIterations, practiceInitialRepeatCounts, practiceStats.repeats, matches, goToPracticeLive])

  const handleNextPracticeRound = useCallback(() => {
    setCurrentPracticeRound((r) => r + 1)
  }, [])

  const handleCommitPracticeRoster = useCallback(
    (list) => {
      const next = list.map((s) => String(s).trim()).filter(Boolean)
      if (next.length < 2) {
        return { error: 'Se necesitan al menos dos bailarines' }
      }
      if (next.length !== competitors.length) {
        setPracticeRegenerateDraft(next)
        return undefined
      }
      const v = validateEqualLengthRemap(competitors, next)
      if (!v.ok) {
        return { error: v.error }
      }
      if (Object.keys(v.map).length === 0) {
        return undefined
      }
      const r = remapPracticeState({
        matches,
        competitorsAfter: next,
        practiceIterations,
        practiceInitialRepeatCounts,
        map: v.map,
      })
      setCompetitors(r.competitors)
      setMatches(r.matches)
      setPracticeIterations(r.practiceIterations)
      setPracticeStats(r.practiceStats)
      setPracticeInitialRepeatCounts(r.practiceInitialRepeatCounts)
      setActiveMatchId(null)
      return undefined
    },
    [competitors, matches, practiceIterations, practiceInitialRepeatCounts]
  )

  const runPracticeRegenerate = useCallback(
    (newNames) => {
      if (!newNames || newNames.length < 2) {
        return
      }
      const combinedRepeatCounts = { ...practiceInitialRepeatCounts }
      for (const [name, n] of Object.entries(practiceStats.repeats ?? {})) {
        combinedRepeatCounts[name] = (combinedRepeatCounts[name] ?? 0) + n
      }
      const idx = Math.max(0, practiceIterations.length - 1)
      const { matches: generated, stats } = generatePracticeRounds(newNames, idx, combinedRepeatCounts)
      const nextIters = !practiceIterations.length
        ? [{ matches: generated, stats }]
        : [...practiceIterations.slice(0, -1), { matches: generated, stats }]
      setCompetitors(newNames)
      setMatches(generated)
      setActiveMatchId(null)
      setCurrentPracticeRound(1)
      setPracticeIterations(nextIters)
      setPracticeStats(recomputeAggregatedStatsFromIterations(nextIters))
    },
    [practiceInitialRepeatCounts, practiceStats.repeats, practiceIterations]
  )

  const handleRegeneratePractice = useCallback(() => {
    const seed = practiceIterations.length + 1
    const combinedRepeatCounts = { ...practiceInitialRepeatCounts }
    for (const [name, n] of Object.entries(practiceStats.repeats ?? {})) {
      combinedRepeatCounts[name] = (combinedRepeatCounts[name] ?? 0) + n
    }
    const { matches: generated } = generatePracticeRounds(competitors, seed, combinedRepeatCounts)
    setMatches(generated)
    setActiveMatchId(null)
    setCurrentPracticeRound(1)
  }, [competitors, practiceIterations.length, practiceInitialRepeatCounts, practiceStats.repeats])

  const handleEditPracticeRoster = useCallback(() => {
    goToPracticeSetup()
  }, [goToPracticeSetup])

  const liveAppearances = useMemo(() => {
    const base = { ...(practiceStats.appearances ?? {}) }
    for (const m of matches) {
      if (!m.completed || m.isBye) continue
      base[m.playerA] = (base[m.playerA] ?? 0) + 1
      base[m.playerB] = (base[m.playerB] ?? 0) + 1
    }
    return base
  }, [matches, practiceStats.appearances])

  const goToPracticeHistory = useCallback(() => {
    window.history.pushState({ screen: SCREENS.PRACTICE_HISTORY }, '', '/practice/history')
    setScreen(SCREENS.PRACTICE_HISTORY)
  }, [])

  const handleFinishPractice = useCallback(async () => {
    const iterations = !practiceIterations.length
      ? practiceIterations
      : [
          ...practiceIterations.slice(0, -1),
          { ...practiceIterations[practiceIterations.length - 1], matches, stats: buildStats(matches) },
        ]
    const stats = recomputeAggregatedStatsFromIterations(iterations)
    try {
      await savePracticeSession({
        started_at: practiceStartedAt,
        ended_at: new Date().toISOString(),
        competitors,
        iterations,
        stats,
      })
      await bumpFrequency(competitors)
      // Bump repeat_count for every dancer who was the odd-one-out across all iterations
      const repeaterNames = practiceIterations
        .flatMap((it) => it.matches ?? [])
        .filter((m) => m.isRepeat && m.repeaterName)
        .map((m) => m.repeaterName)
      if (repeaterNames.length) await bumpRepeatCount(repeaterNames)
    } catch (err) {
      console.error('Finish practice failed:', err)
    }
    clearState()
    clearRemote()
    setMatches([])
    setActiveMatchId(null)
    setPracticeIterations([])
    setPracticeStats({ appearances: {}, repeats: {}, pairs: [] })
    setPracticeStartedAt(null)
    setPracticeInitialRepeatCounts({})
    setCurrentPracticeRound(1)
    goToPracticeHistory()
  }, [
    savePracticeSession,
    practiceStartedAt,
    competitors,
    practiceIterations,
    practiceStats,
    matches,
    bumpFrequency,
    bumpRepeatCount,
    clearRemote,
    goToPracticeHistory,
  ])

  const activeMatch = matches.find((m) => m.id === activeMatchId) ?? null
  const nonByeMatches = matches.filter((m) => !m.isBye)
  const activeMatchIndex = activeMatch ? nonByeMatches.findIndex((m) => m.id === activeMatch.id) : -1

  const navName = profile?.name ?? user?.email?.split('@')[0] ?? ''
  const navInitials = (navName.slice(0, 2).toUpperCase() || 'CP')

  const lbShowExtendedStats = showExtendedStatsInLeaderboard(hasStats, isTournament)
  const lbShowConfetti = showConfettiOnLeaderboard(isTournament)
  const lbShowRichWa = showRichWhatsAppInLeaderboard(hasStats, isTournament)

  if (livePathId) {
    return (
      <div className="flex flex-col h-full bg-zinc-950 text-white">
        <PublicLiveScreen publicId={livePathId} />
      </div>
    )
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-zinc-950">
        <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <AuthScreen onSignIn={signInWithGoogle} loading={authLoading} onEmailSignIn={signInWithEmail} onEmailSignUp={signUpWithEmail} />
  }

  return (
    <CompetitionModeProvider mode={competitionMode} setMode={setCompetitionMode}>
      <div className="flex flex-col h-full bg-zinc-950 text-white">
        {screen === SCREENS.BATTLE && (
          <SpotifyPlayer ref={spotifyRef} onTrackChange={setNowPlaying} />
        )}

        <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-zinc-700 bg-zinc-950/80 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={goToDashboard}
              className="text-base font-black tracking-tight text-white truncate shrink-0 hover:opacity-90 text-left"
            >
              CLASH<span className="text-red-500">PRO</span>
            </button>
            <nav
              className="flex items-center gap-0 min-w-0 overflow-x-auto sm:gap-0.5 text-[10px] sm:text-xs font-semibold [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              aria-label="Secciones"
            >
              <button
                type="button"
                onClick={goToDashboard}
                className={`shrink-0 px-1.5 py-1 rounded-md transition-colors whitespace-nowrap ${
                  screen === SCREENS.DASHBOARD
                    ? 'text-white bg-zinc-800'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/70'
                }`}
              >
                Inicio
              </button>
              <button
                type="button"
                onClick={() => goToBlog()}
                className={`shrink-0 px-1.5 py-1 rounded-md transition-colors whitespace-nowrap ${
                  screen === SCREENS.BLOG || screen === SCREENS.BLOG_POST
                    ? 'text-white bg-zinc-800'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/70'
                }`}
              >
                Blog
              </button>
              <button
                type="button"
                onClick={goToGuia}
                className={`shrink-0 px-1.5 py-1 rounded-md transition-colors whitespace-nowrap ${
                  screen === SCREENS.GUIA
                    ? 'text-white bg-zinc-800'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/70'
                }`}
              >
                Guía
              </button>
              <button
                type="button"
                onClick={goToPatterns}
                className={`shrink-0 px-1.5 py-1 rounded-md transition-colors whitespace-nowrap ${
                  screen === SCREENS.PATTERNS
                    ? 'text-white bg-zinc-800'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/70'
                }`}
              >
                Patrones
              </button>
              <button
                type="button"
                onClick={goToPracticeHistory}
                className={`shrink-0 px-1.5 py-1 rounded-md transition-colors whitespace-nowrap ${
                  screen === SCREENS.PRACTICE_HISTORY
                    ? 'text-white bg-zinc-800'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/70'
                }`}
              >
                Historial
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {screen !== SCREENS.DASHBOARD && screen !== SCREENS.SETUP && (
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap border ${
                  isTournament
                    ? 'border-amber-500/35 bg-amber-500/10 text-amber-400'
                    : 'border-zinc-700 bg-zinc-800/80 text-zinc-400'
                }`}
                title={isTournament ? 'Competición con resultados' : 'Práctica sin puntos'}
              >
                {isTournament ? 'Competición' : 'Práctica'}
              </span>
            )}
            {screen !== SCREENS.DASHBOARD && screen !== SCREENS.SETUP && (
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
                  isPro ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-zinc-500'
                }`}
                title="Tu plan"
              >
                {planLabel}
              </span>
            )}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                menuOpen ? 'text-white bg-zinc-800' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
              aria-label="Abrir menú"
            >
              {profile?.photo_url && !navImgBroken ? (
                <img
                  src={profile.photo_url}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-zinc-700"
                  onError={() => setNavImgBroken(true)}
                />
              ) : (
                <span className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px] font-bold ring-1 ring-zinc-700">
                  {navInitials}
                </span>
              )}
              <Menu size={18} />
            </button>
          </div>
        </div>

        {menuOpen && (
          <HamburgerMenu
            onClose={() => setMenuOpen(false)}
            onOpenTournamentHistory={() => {
              setMenuOpen(false)
              setHistoryOpen(true)
            }}
            onOpenBlog={(filter) => { setMenuOpen(false); goToBlog(filter) }}
            onOpenGuia={() => { setMenuOpen(false); goToGuia() }}
            onOpenPatterns={() => { setMenuOpen(false); goToPatterns() }}
            onOpenPracticeHistory={() => { setMenuOpen(false); goToPracticeHistory() }}
          />
        )}
        {historyOpen && <TournamentHistoryModal onClose={() => setHistoryOpen(false)} />}

        {practiceRegenerateDraft && (
          <PracticeRosterRegenerateModal
            namesPreview={practiceRegenerateDraft}
            onCancel={() => setPracticeRegenerateDraft(null)}
            onConfirm={() => {
              const d = practiceRegenerateDraft
              setPracticeRegenerateDraft(null)
              if (d) runPracticeRegenerate(d)
            }}
          />
        )}

        <main className="flex-1 overflow-y-auto">
          {screen === SCREENS.DASHBOARD && (
            <DashboardScreen
              profile={profile}
              isPro={isPro}
              onStartTournament={handleDashboardTournament}
              onStartPractice={handleDashboardPractice}
              onOpenPatterns={() => goToPatterns()}
              onOpenGuia={() => goToGuia()}
              onOpenBlog={() => goToBlog()}
            />
          )}

          {(screen === SCREENS.SETUP || screen === SCREENS.PRACTICE_SETUP) && (
            <SetupScreen
              competitors={competitors}
              setCompetitors={setCompetitors}
              roundTime={roundTime}
              setRoundTime={setRoundTime}
              battleRoundCount={battleRoundCount}
              setBattleRoundCount={setBattleRoundCount}
              onStart={handleStartTournament}
              onOpenPromoMenu={() => setMenuOpen(true)}
            />
          )}

          {screen === SCREENS.MATCHES && (
            <MatchesScreen
              matches={matches}
              competitors={competitors}
              isTournament={isTournament}
              roundTime={roundTime}
              battleRoundCount={battleRoundCount}
              onStartBattle={handleStartBattle}
              onQuickClose={handleQuickClose}
              onViewLeaderboard={handleViewLeaderboard}
              onReset={handleReset}
              onUpdateMatchNames={handleUpdateMatchNames}
            />
          )}

          {screen === SCREENS.PRACTICE_LIVE && (
            <MatchesScreen
              matches={matches}
              competitors={competitors}
              isTournament={false}
              roundTime={roundTime}
              sessionDanceCounts={sessionDanceCounts}
              sessionCompletedPairings={sessionCompletedPairings}
              onEditSetup={goToPracticeSetup}
              onCommitPracticeRoster={handleCommitPracticeRoster}
              onStartBattle={handleStartBattle}
              onQuickClose={handleQuickClose}
              onViewLeaderboard={handleViewLeaderboard}
              onReset={handleReset}
              onRegenerate={handleRegeneratePractice}
              onEditRoster={handleEditPracticeRoster}
              practiceAppearances={liveAppearances}
              visibleRound={currentPracticeRound}
              practiceIterationNumber={practiceIterations.length}
              onNextRound={handleNextPracticeRound}
              onNextPracticeIteration={handleNextPracticeIteration}
              onFinishPractice={handleFinishPractice}
              onUpdateMatchNames={handleUpdateMatchNames}
            />
          )}

          {screen === SCREENS.BATTLE && activeMatch && (
            <BattleScreen
              match={activeMatch}
              roundTime={roundTime}
              roundCount={battleRoundCount}
              isTournament={isTournament}
              onBattleEnd={handleBattleEnd}
              onCancel={() => { setActiveMatchId(null); goToMatchList() }}
              nowPlaying={nowPlaying}
              onRoundStart={() => spotifyRef.current?.playNextInQueue()}
              onNextSong={() => spotifyRef.current?.playNextInQueue()}
              matchNumber={activeMatchIndex >= 0 ? activeMatchIndex + 1 : undefined}
              totalMatches={nonByeMatches.length}
            />
          )}

          {screen === SCREENS.LEADERBOARD && isTournament && (
            <LeaderboardScreen
              competitors={competitors}
              matches={matches}
              onBack={handleBackToMatches}
              onReset={handleReset}
              onNewSession={handleNewSession}
              showExtendedStats={lbShowExtendedStats}
              showConfetti={lbShowConfetti}
              showRichWhatsApp={lbShowRichWa}
            />
          )}

          {screen === SCREENS.BLOG && (
            <BlogScreen
              filter={blogFilter}
              onPostClick={goToBlogPost}
              onBack={() => { window.history.back() }}
            />
          )}

          {screen === SCREENS.BLOG_POST && blogSlug && (
            <BlogPostScreen
              slug={blogSlug}
              onBack={() => { window.history.back() }}
            />
          )}

          {screen === SCREENS.GUIA && (
            <GuiaScreen onBack={() => { window.history.back() }} />
          )}

          {screen === SCREENS.PATTERNS && (
            <PatternsScreen
              onBack={() => { window.history.back() }}
              onOpenBlogPost={goToBlogPost}
            />
          )}

          {screen === SCREENS.PRACTICE_HISTORY && (
            <PracticeHistoryScreen onBack={() => { window.history.back() }} />
          )}
        </main>
      </div>
    </CompetitionModeProvider>
  )
}

export default function App() {
  return <AppShell />
}

import { useState, useCallback, useEffect, useRef } from 'react'
import SetupScreen from './components/SetupScreen'
import MatchesScreen from './components/MatchesScreen'
import BattleScreen from './components/BattleScreen'
import LeaderboardScreen from './components/LeaderboardScreen'
import SpotifyPlayer from './components/SpotifyPlayer'
import AuthScreen from './components/AuthScreen'
import HamburgerMenu from './components/HamburgerMenu'
import TournamentHistoryModal from './components/TournamentHistoryModal'
import { generateRoundRobin, isRoundRobinFinished } from './utils/roundRobin'
import { saveTournamentArchive } from './lib/tournamentArchives'
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
  SETUP: 'setup',
  MATCHES: 'matches',
  BATTLE: 'battle',
  LEADERBOARD: 'leaderboard',
}

function computeBootState() {
  const loaded = loadState()
  if (!loaded) {
    return {
      screen: SCREENS.SETUP,
      competitors: [],
      roundTime: 40,
      matches: [],
      activeMatchId: null,
      competitionMode: COMPETITION_MODE.tournament,
    }
  }
  const competitionMode = loaded.competitionMode ?? COMPETITION_MODE.tournament
  let screen = loaded.screen
  if (competitionMode === COMPETITION_MODE.practice && screen === SCREENS.LEADERBOARD) {
    screen = SCREENS.MATCHES
  }
  const norm = normalizeHydratedScreen(screen, loaded.activeMatchId)
  return {
    screen: norm.screen,
    competitors: loaded.competitors ?? [],
    roundTime: loaded.roundTime,
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
  const spotifyRef = useRef(null)
  const [boot] = useState(computeBootState)
  const [screen, setScreen] = useState(boot.screen)
  const [competitors, setCompetitors] = useState(boot.competitors)
  const [roundTime, setRoundTime] = useState(boot.roundTime)
  const [matches, setMatches] = useState(boot.matches)
  const [activeMatchId, setActiveMatchId] = useState(boot.activeMatchId)
  const [competitionMode, setCompetitionMode] = useState(boot.competitionMode)

  const isTournament = competitionMode === COMPETITION_MODE.tournament

  const goTo = useCallback((nextScreen, opts = {}) => {
    window.history.pushState({ screen: nextScreen, ...opts }, '')
    setScreen(nextScreen)
  }, [])

  useEffect(() => {
    const handlePop = () => {
      setScreen((cur) => {
        if (cur === SCREENS.BATTLE) { setActiveMatchId(null); return SCREENS.MATCHES }
        if (cur === SCREENS.LEADERBOARD) return SCREENS.MATCHES
        if (cur === SCREENS.MATCHES) return SCREENS.SETUP
        return cur
      })
    }
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

  const onTournamentLoaded = useCallback((payload) => {
    if (payload.matches?.length) {
      const norm = normalizeHydratedScreen(payload.screen, payload.activeMatchId)
      let s = norm.screen
      if (payload.competitionMode === COMPETITION_MODE.practice && s === SCREENS.LEADERBOARD) {
        s = SCREENS.MATCHES
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
    saveTournament({ competitors, matches, roundTime, screen, activeMatchId, competitionMode })
  }, [competitors, matches, roundTime, screen, activeMatchId, competitionMode, saveTournament])

  useEffect(() => {
    if (!user) return
    supabase
      .from('competitors')
      .select('id, name, photo_url, is_active')
      .order('name')
      .then(({ data }) => {
        if (data?.length) {
          setCompetitors(data.filter((c) => c.is_active).map((c) => c.name))
        }
      })
  }, [user])

  useEffect(() => {
    saveState({ screen, competitors, roundTime, matches, activeMatchId, competitionMode })
  }, [screen, competitors, roundTime, matches, activeMatchId, competitionMode])

  useEffect(() => {
    setNavImgBroken(false)
  }, [profile?.photo_url])

  useEffect(() => {
    if (profile == null) return
    if (isFree && competitionMode === COMPETITION_MODE.tournament) {
      setCompetitionMode(COMPETITION_MODE.practice)
    }
  }, [profile, isFree, competitionMode])

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

  const handleStartTournament = useCallback((finalCompetitors, selectedTime) => {
    archiveCompletedIfNeeded()
    const generated = generateRoundRobin(finalCompetitors)
    setCompetitors(finalCompetitors)
    setRoundTime(selectedTime)
    setMatches(generated)
    goTo(SCREENS.MATCHES)
  }, [goTo, archiveCompletedIfNeeded])

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
    goTo(SCREENS.MATCHES)
  }, [goTo])

  const handleQuickClose = useCallback((matchId, result) => {
    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId ? { ...m, completed: true, result } : m
      )
    )
  }, [])

  const handleViewLeaderboard = useCallback(() => {
    if (!showLeaderboardRoute(isTournament)) return
    goTo(SCREENS.LEADERBOARD)
  }, [goTo, isTournament])

  const handleBackToMatches = useCallback(() => {
    goTo(SCREENS.MATCHES)
  }, [goTo])

  const handleReset = useCallback(() => {
    archiveCompletedIfNeeded()
    clearState()
    clearRemote()
    setMatches([])
    setActiveMatchId(null)
    goTo(SCREENS.SETUP)
  }, [goTo, clearRemote, archiveCompletedIfNeeded])

  const handleNewSession = useCallback(() => {
    archiveCompletedIfNeeded()
    const generated = generateRoundRobin(competitors)
    setMatches(generated)
    setActiveMatchId(null)
    goTo(SCREENS.MATCHES)
  }, [competitors, goTo, archiveCompletedIfNeeded])

  const activeMatch = matches.find((m) => m.id === activeMatchId) ?? null
  const nonByeMatches = matches.filter((m) => !m.isBye)
  const activeMatchIndex = activeMatch ? nonByeMatches.findIndex((m) => m.id === activeMatch.id) : -1

  const navName = profile?.name ?? user?.email?.split('@')[0] ?? ''
  const navInitials = (navName.slice(0, 2).toUpperCase() || 'CP')

  const lbShowExtendedStats = showExtendedStatsInLeaderboard(hasStats, isTournament)
  const lbShowConfetti = showConfettiOnLeaderboard(isTournament)
  const lbShowRichWa = showRichWhatsAppInLeaderboard(hasStats, isTournament)

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
        <SpotifyPlayer ref={spotifyRef} onTrackChange={setNowPlaying} />

        <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-zinc-800/60 shrink-0">
          <span className="text-sm font-black tracking-tight text-white truncate min-w-0">
            CLASH<span className="text-red-500">PRO</span>
          </span>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap border ${
                isTournament
                  ? 'border-amber-500/35 bg-amber-500/10 text-amber-400'
                  : 'border-zinc-700 bg-zinc-800/80 text-zinc-400'
              }`}
              title={isTournament ? 'Competición con resultados' : 'Práctica sin puntos'}
            >
              {isTournament ? 'Competición' : 'Práctica'}
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
                isPro ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-zinc-500'
              }`}
              title="Tu plan"
            >
              {planLabel}
            </span>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex items-center gap-2 text-zinc-500 hover:text-white p-1 rounded-lg transition-colors"
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
          />
        )}
        {historyOpen && <TournamentHistoryModal onClose={() => setHistoryOpen(false)} />}

        <main className="flex-1 overflow-y-auto">
          {screen === SCREENS.SETUP && (
            <SetupScreen
              initialCompetitors={competitors}
              initialRoundTime={roundTime}
              onStart={handleStartTournament}
              onOpenPromoMenu={() => setMenuOpen(true)}
            />
          )}

          {screen === SCREENS.MATCHES && (
            <MatchesScreen
              matches={matches}
              competitors={competitors}
              isTournament={isTournament}
              onStartBattle={handleStartBattle}
              onQuickClose={handleQuickClose}
              onViewLeaderboard={handleViewLeaderboard}
              onReset={handleReset}
            />
          )}

          {screen === SCREENS.BATTLE && activeMatch && (
            <BattleScreen
              match={activeMatch}
              roundTime={roundTime}
              isTournament={isTournament}
              onBattleEnd={handleBattleEnd}
              onCancel={() => { setActiveMatchId(null); goTo(SCREENS.MATCHES) }}
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
        </main>
      </div>
    </CompetitionModeProvider>
  )
}

export default function App() {
  return <AppShell />
}

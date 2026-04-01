import { useState, useCallback, useEffect } from 'react'
import SetupScreen from './components/SetupScreen'
import MatchesScreen from './components/MatchesScreen'
import BattleScreen from './components/BattleScreen'
import LeaderboardScreen from './components/LeaderboardScreen'
import SpotifyPlayer from './components/SpotifyPlayer'
import AuthScreen from './components/AuthScreen'
import { generateRoundRobin } from './utils/roundRobin'
import { loadState, saveState, clearState, normalizeHydratedScreen } from './utils/persist'
import { useAuth } from './hooks/useAuth'
import { supabase } from './lib/supabase'

const SCREENS = {
  SETUP: 'setup',
  MATCHES: 'matches',
  BATTLE: 'battle',
  LEADERBOARD: 'leaderboard',
}

function computeBootState() {
  const loaded = loadState()
  if (!loaded) {
    return { screen: SCREENS.SETUP, competitors: [], roundTime: 40, matches: [], activeMatchId: null }
  }
  const norm = normalizeHydratedScreen(loaded.screen, loaded.activeMatchId)
  return {
    screen: norm.screen,
    competitors: loaded.competitors ?? [],
    roundTime: loaded.roundTime,
    matches: loaded.matches,
    activeMatchId: norm.activeMatchId,
  }
}

export default function App() {
  const { user, loading: authLoading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()
  const [boot] = useState(computeBootState)
  const [screen, setScreen] = useState(boot.screen)
  const [competitors, setCompetitors] = useState(boot.competitors)
  const [roundTime, setRoundTime] = useState(boot.roundTime)
  const [matches, setMatches] = useState(boot.matches)
  const [activeMatchId, setActiveMatchId] = useState(boot.activeMatchId)

  // Carga competidores activos desde Supabase cuando el usuario se autentica
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
    saveState({ screen, competitors, roundTime, matches, activeMatchId })
  }, [screen, competitors, roundTime, matches, activeMatchId])

  // ── Setup → Matches ─────────────────────────────────────────────────────────
  const handleStartTournament = useCallback((finalCompetitors, selectedTime) => {
    const generated = generateRoundRobin(finalCompetitors)
    setCompetitors(finalCompetitors)
    setRoundTime(selectedTime)
    setMatches(generated)
    setScreen(SCREENS.MATCHES)
  }, [])

  // ── Matches → Battle ─────────────────────────────────────────────────────────
  const handleStartBattle = useCallback((matchId) => {
    setActiveMatchId(matchId)
    setScreen(SCREENS.BATTLE)
  }, [])

  // ── Battle → Matches (con resultado) ─────────────────────────────────────────
  const handleBattleEnd = useCallback((matchId, result) => {
    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId ? { ...m, completed: true, result } : m
      )
    )
    setActiveMatchId(null)
    setScreen(SCREENS.MATCHES)
  }, [])

  // ── Matches → Leaderboard ────────────────────────────────────────────────────
  const handleViewLeaderboard = useCallback(() => {
    setScreen(SCREENS.LEADERBOARD)
  }, [])

  // ── Leaderboard → Matches ────────────────────────────────────────────────────
  const handleBackToMatches = useCallback(() => {
    setScreen(SCREENS.MATCHES)
  }, [])

  // ── Reset completo ────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    clearState()
    setMatches([])
    setActiveMatchId(null)
    setScreen(SCREENS.SETUP)
  }, [])

  const activeMatch = matches.find((m) => m.id === activeMatchId) ?? null

  // Pantalla de carga inicial
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-zinc-950">
        <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Auth gate
  if (!user) {
    return <AuthScreen onSignIn={signInWithGoogle} loading={authLoading} onEmailSignIn={signInWithEmail} onEmailSignUp={signUpWithEmail} />
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-white">
      {/* Player de Spotify persistente — no se desmonta al cambiar pantalla */}
      <SpotifyPlayer />

      {/* Área de contenido principal */}
      <main className="flex-1 overflow-y-auto">
        {screen === SCREENS.SETUP && (
          <SetupScreen
            initialCompetitors={competitors}
            initialRoundTime={roundTime}
            onStart={handleStartTournament}
          />
        )}

        {screen === SCREENS.MATCHES && (
          <MatchesScreen
            matches={matches}
            competitors={competitors}
            onStartBattle={handleStartBattle}
            onViewLeaderboard={handleViewLeaderboard}
            onReset={handleReset}
          />
        )}

        {screen === SCREENS.BATTLE && activeMatch && (
          <BattleScreen
            match={activeMatch}
            roundTime={roundTime}
            onBattleEnd={handleBattleEnd}
            onCancel={() => { setActiveMatchId(null); setScreen(SCREENS.MATCHES) }}
          />
        )}

        {screen === SCREENS.LEADERBOARD && (
          <LeaderboardScreen
            competitors={competitors}
            matches={matches}
            onBack={handleBackToMatches}
            onReset={handleReset}
          />
        )}
      </main>
    </div>
  )
}

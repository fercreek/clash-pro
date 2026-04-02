import { createContext, useContext, useMemo } from 'react'
import { COMPETITION_MODE } from '../lib/featurePolicy'

const ModeContext = createContext(null)

export function CompetitionModeProvider({ mode, setMode, children }) {
  const value = useMemo(
    () => ({
      mode,
      setMode,
      isPractice: mode === COMPETITION_MODE.practice,
      isTournament: mode === COMPETITION_MODE.tournament,
    }),
    [mode, setMode]
  )
  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>
}

export function useMode() {
  const ctx = useContext(ModeContext)
  if (!ctx) {
    throw new Error('useMode must be used within CompetitionModeProvider')
  }
  return ctx
}

export { COMPETITION_MODE }

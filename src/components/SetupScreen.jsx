import { useState, useEffect, useMemo } from 'react'
import { Plus, Trash2, Swords, Clock, Lock, Dumbbell, Trophy, ExternalLink } from 'lucide-react'
import { usePlan } from '../hooks/usePlan'
import { useMode } from '../hooks/useMode'
import { useRoster } from '../hooks/useRoster'
import { canSelectTournamentMode, COMPETITION_MODE } from '../lib/featurePolicy'
import PlansComparisonModal from './PlansComparisonModal'
import RosterPicker from './RosterPicker'
import BulkNameInput from './BulkNameInput'
import { AV_BG } from '../utils/avatarColors'

export default function SetupScreen({ initialCompetitors, initialRoundTime, onStart, onOpenPromoMenu }) {
  const { isFree, maxCompetitors } = usePlan()
  const { mode, setMode } = useMode()
  const canTournament = canSelectTournamentMode(isFree)

  const [competitors, setCompetitors] = useState(initialCompetitors)
  const [inputValue, setInputValue] = useState('')
  const [roundTime, setRoundTime] = useState(initialRoundTime)
  const [plansOpen, setPlansOpen] = useState(false)

  const isTournament = mode === COMPETITION_MODE.tournament
  const { roster, addDancer } = useRoster()

  // repeat_count map — passed to generatePracticeRounds so the algorithm knows
  // who's already been the "odd-one-out" historically.
  // Migration to Opción B: replace roster source with user_dancer_stats query here;
  // onStart interface stays identical.
  const repeatCounts = roster.reduce((acc, r) => {
    acc[r.name] = r.repeat_count ?? 0
    return acc
  }, {})

  useEffect(() => {
    if (!canTournament && mode === COMPETITION_MODE.tournament) {
      setMode(COMPETITION_MODE.practice)
    }
  }, [canTournament, mode, setMode])

  const existingLower = useMemo(
    () => new Set(competitors.map((n) => n.toLowerCase())),
    [competitors]
  )

  const handleAdd = () => {
    const name = inputValue.trim()
    if (!name || existingLower.has(name.toLowerCase())) return
    setCompetitors((prev) => [...prev, name])
    setInputValue('')
  }

  const handleRemove = (name) => {
    setCompetitors((prev) => prev.filter((c) => c !== name))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAdd()
  }

  const handleToggleRoster = (name) => {
    setCompetitors((prev) => {
      const lower = name.toLowerCase()
      if (prev.some((n) => n.toLowerCase() === lower)) {
        return prev.filter((n) => n.toLowerCase() !== lower)
      }
      return [...prev, name]
    })
  }

  const handleAddNewDancer = async (name) => {
    const created = await addDancer(name)
    const finalName = created?.name ?? name
    if (!existingLower.has(finalName.toLowerCase())) {
      setCompetitors((prev) => [...prev, finalName])
    }
  }

  const handleBulkAdd = (names) => {
    setCompetitors((prev) => {
      const seen = new Set(prev.map((n) => n.toLowerCase()))
      const out = [...prev]
      for (const n of names) {
        const key = n.toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        out.push(n)
      }
      return out
    })
  }

  const atLimit = isFree && competitors.length >= maxCompetitors
  const canStart = competitors.length >= 2

  return (
    <div className="min-h-full bg-zinc-950 text-white">
      <div className="max-w-md mx-auto px-5 pt-5 pb-10 flex flex-col gap-6">

        {/* Page header — contextual by mode */}
        <div>
          <p className="text-[10px] font-black tracking-[0.25em] uppercase text-zinc-500 mb-1">
            {isTournament ? 'Competición' : 'Práctica libre'}
          </p>
          <h1 className="text-[28px] font-black tracking-tight text-white leading-tight">
            {isTournament ? 'Nuevo torneo' : 'Nueva sesión'}
          </h1>
        </div>

        {/* Mode selector */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center gap-3 mb-1">
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em]">Modo</p>
            <div className="flex-1 h-px bg-zinc-900" />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode(COMPETITION_MODE.practice)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
                !isTournament
                  ? 'bg-zinc-900 border border-zinc-600 ring-1 ring-zinc-500 text-white'
                  : 'bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <Dumbbell size={15} />
              Práctica
            </button>
            <button
              type="button"
              disabled={!canTournament}
              onClick={() => setMode(COMPETITION_MODE.tournament)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
                isTournament
                  ? 'bg-amber-500/5 border border-amber-500/30 ring-1 ring-amber-500/40 text-amber-300'
                  : 'bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:border-zinc-700'
              } ${!canTournament ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <Trophy size={15} />
              Competición
            </button>
          </div>

          {!canTournament && (
            <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Lock size={13} className="text-amber-400 shrink-0" />
                <p className="text-amber-200 text-xs">Requiere plan Pro</p>
              </div>
              <button
                type="button"
                onClick={() => setPlansOpen(true)}
                className="flex items-center gap-1 text-amber-400 text-xs font-bold hover:text-amber-300"
              >
                Ver planes <ExternalLink size={11} />
              </button>
            </div>
          )}

          {!canTournament ? null : isTournament ? (
            <p className="text-zinc-500 text-xs px-0.5">Resultados, ranking y compartir al finalizar.</p>
          ) : (
            <p className="text-zinc-500 text-xs px-0.5">Rondas con métricas. Impar = uno repite sin descansar.</p>
          )}
        </section>

        {/* Round time */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center gap-3 mb-1">
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em]">Tiempo por ronda</p>
            <div className="flex-1 h-px bg-zinc-900" />
          </div>
          <div className="flex gap-2">
            {[30, 40].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setRoundTime(t)}
                className={`flex-1 py-3 rounded-xl font-black text-lg transition-all ${
                  roundTime === t
                    ? 'bg-red-500 text-white'
                    : 'bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                {t}s
              </button>
            ))}
          </div>
        </section>

        {/* Competitors — mode-specific input */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center gap-3 mb-1">
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em]">
              {isTournament ? 'Competidores' : 'Bailarines'} ({competitors.length})
            </p>
            <div className="flex-1 h-px bg-zinc-900" />
          </div>

          {!isTournament && (
            <>
              {roster.length > 0 && (
                <div className="flex flex-col gap-2 mb-1">
                  <p className="text-zinc-500 text-[11px] uppercase tracking-wider font-bold">Roster</p>
                  <RosterPicker
                    roster={roster}
                    selected={competitors}
                    onToggle={handleToggleRoster}
                    onAdd={handleAddNewDancer}
                  />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <p className="text-zinc-500 text-[11px] uppercase tracking-wider font-bold">Pegar lista</p>
                <BulkNameInput
                  onAdd={handleBulkAdd}
                  existingNames={competitors}
                  disabled={atLimit}
                />
              </div>
            </>
          )}

          {isTournament && (
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nombre del bailarín..."
                disabled={atLimit}
                className="flex-1 bg-zinc-900/60 border border-zinc-800 focus:border-zinc-600 rounded-2xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none transition-colors disabled:opacity-40"
              />
              <button
                type="button"
                onClick={handleAdd}
                disabled={!inputValue.trim() || atLimit}
                className="bg-red-500 hover:bg-red-400 disabled:opacity-40 disabled:cursor-not-allowed px-4 rounded-2xl transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
          )}

          {atLimit && (
            <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Lock size={13} className="text-amber-400 shrink-0" />
                <p className="text-amber-200 text-xs">Límite plan Gratis ({maxCompetitors})</p>
              </div>
              <button
                type="button"
                onClick={() => setPlansOpen(true)}
                className="flex items-center gap-1 text-amber-400 text-xs font-bold hover:text-amber-300"
              >
                Pro <ExternalLink size={11} />
              </button>
            </div>
          )}

          {competitors.length > 0 && (
            <ul className="flex flex-col max-h-64 overflow-y-auto">
              {competitors.map((name, i) => (
                <li
                  key={name}
                  className={`flex items-center gap-3 py-2.5 ${i < competitors.length - 1 ? 'border-b border-zinc-900' : ''}`}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0"
                    style={{ background: AV_BG[i % AV_BG.length] }}
                  >
                    {name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="flex-1 text-white font-medium text-sm truncate">{name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemove(name)}
                    className="text-zinc-600 hover:text-red-500 transition-colors p-2 -mr-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {isTournament && competitors.length % 2 !== 0 && competitors.length > 0 && (
            <p className="text-amber-400 text-xs px-0.5">
              Número impar — un competidor descansará por ronda (BYE).
            </p>
          )}
          {!isTournament && competitors.length % 2 !== 0 && competitors.length > 3 && (
            <p className="text-zinc-500 text-xs px-0.5">
              Impar — un bailarín repetirá por ronda (no descansa).
            </p>
          )}
        </section>

        {/* CTA */}
        <button
          type="button"
          onClick={() => onStart(competitors, roundTime, repeatCounts)}
          disabled={!canStart}
          className="w-full flex items-center justify-center gap-2 py-4 bg-red-500 hover:bg-red-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl font-black text-base tracking-tight transition-colors"
        >
          <Swords size={18} strokeWidth={2.5} />
          {isTournament ? 'GENERAR TORNEO' : 'ARMAR RONDAS'}
        </button>

        <p className="text-zinc-700 text-xs text-center">Made with 🔥 &amp; ❤️ for Salsanamá</p>

      </div>

      {plansOpen && (
        <PlansComparisonModal
          onClose={() => setPlansOpen(false)}
          onOpenPromoMenu={onOpenPromoMenu}
        />
      )}
    </div>
  )
}

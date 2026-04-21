import { useState, useEffect } from 'react'
import { Plus, Trash2, Swords, Clock, Lock, Dumbbell, Trophy, ExternalLink } from 'lucide-react'
import { usePlan } from '../hooks/usePlan'
import { useMode } from '../hooks/useMode'
import { canSelectTournamentMode, COMPETITION_MODE } from '../lib/featurePolicy'
import PlansComparisonModal from './PlansComparisonModal'

export default function SetupScreen({ initialCompetitors, initialRoundTime, onStart, onOpenPromoMenu }) {
  const { isFree, maxCompetitors } = usePlan()
  const { mode, setMode } = useMode()
  const canTournament = canSelectTournamentMode(isFree)

  const [competitors, setCompetitors] = useState(initialCompetitors)
  const [inputValue, setInputValue] = useState('')
  const [roundTime, setRoundTime] = useState(initialRoundTime)
  const [plansOpen, setPlansOpen] = useState(false)

  useEffect(() => {
    if (!canTournament && mode === COMPETITION_MODE.tournament) {
      setMode(COMPETITION_MODE.practice)
    }
  }, [canTournament, mode, setMode])

  const handleAdd = () => {
    const name = inputValue.trim()
    if (!name || competitors.includes(name)) return
    setCompetitors((prev) => [...prev, name])
    setInputValue('')
  }

  const handleRemove = (name) => {
    setCompetitors((prev) => prev.filter((c) => c !== name))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAdd()
  }

  const atLimit = isFree && competitors.length >= maxCompetitors
  const canStart = competitors.length >= 2

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      <div className="pt-4 text-center">
        <h1 className="text-3xl font-black tracking-tight text-white">
          CLASH<span className="text-red-500">PRO</span>
        </h1>
        <p className="text-zinc-400 text-sm mt-1">Configuración del torneo</p>
      </div>

      <section className="space-y-2">
        <div className="flex items-center gap-2 text-zinc-300 text-sm font-semibold uppercase tracking-widest">
          <Dumbbell size={14} />
          <span>Modo</span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode(COMPETITION_MODE.practice)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition-colors ${
              mode === COMPETITION_MODE.practice
                ? 'bg-red-500 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            <Dumbbell size={16} />
            Práctica
          </button>
          <button
            type="button"
            disabled={!canTournament}
            onClick={() => setMode(COMPETITION_MODE.tournament)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition-colors ${
              mode === COMPETITION_MODE.tournament
                ? 'bg-red-500 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            } ${!canTournament ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Trophy size={16} />
            Competición
          </button>
        </div>
        {!canTournament && (
          <div className="flex flex-col gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
            <div className="flex items-start gap-2">
              <Lock size={14} className="text-amber-400 mt-0.5 shrink-0" />
              <p className="text-amber-200 text-xs">
                Competición con votación, puntos y ranking requiere plan Pro.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPlansOpen(true)}
              className="self-start flex items-center gap-1 text-amber-400 text-xs font-bold hover:text-amber-300"
            >
              Ver planes <ExternalLink size={12} />
            </button>
          </div>
        )}
        {mode === COMPETITION_MODE.practice && (
          <p className="text-zinc-500 text-xs">
            Cronómetro y música; sin votación ni puntos. Ideal para clase o ensayo.
          </p>
        )}
        {mode === COMPETITION_MODE.tournament && canTournament && (
          <p className="text-zinc-500 text-xs">
            Resultados, ranking y compartir al finalizar.
          </p>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-center gap-2 text-zinc-300 text-sm font-semibold uppercase tracking-widest">
          <Clock size={14} />
          <span>Tiempo por ronda</span>
        </div>
        <div className="flex gap-3">
          {[30, 40].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setRoundTime(t)}
              className={`flex-1 py-3 rounded-lg font-bold text-lg transition-colors ${
                roundTime === t
                  ? 'bg-red-500 text-white'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {t}s
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex items-center gap-2 text-zinc-300 text-sm font-semibold uppercase tracking-widest">
          <Swords size={14} />
          <span>Competidores ({competitors.length})</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nombre del bailarín..."
            disabled={atLimit}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-3.5 text-white placeholder-zinc-400 focus:outline-none focus:border-red-500 disabled:opacity-40"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!inputValue.trim() || atLimit}
            className="bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed p-3.5 rounded-lg transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>

        {atLimit && (
          <div className="flex flex-col gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2.5">
            <div className="flex items-start gap-2">
              <Lock size={14} className="text-amber-400 mt-0.5 shrink-0" />
              <p className="text-amber-300 text-xs">
                Límite del plan Gratis ({maxCompetitors} competidores).{' '}
                <span className="font-semibold">Pro = competidores ilimitados.</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPlansOpen(true)}
              className="self-start flex items-center gap-1 text-amber-400 text-xs font-bold hover:text-amber-300"
            >
              Ver planes <ExternalLink size={12} />
            </button>
          </div>
        )}

        <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {competitors.map((name, i) => (
            <li
              key={name}
              className="flex items-center justify-between bg-zinc-800 rounded-lg px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <span className="text-zinc-500 text-xs w-5 text-right">{i + 1}</span>
                <span className="text-white font-medium">{name}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(name)}
                className="text-zinc-500 hover:text-red-500 transition-colors p-3 -mr-2"
              >
                <Trash2 size={18} />
              </button>
            </li>
          ))}
        </ul>

        {competitors.length % 2 !== 0 && competitors.length > 0 && (
          <p className="text-amber-400 text-xs">
            Número impar — un competidor descansará por ronda (BYE).
          </p>
        )}
      </section>

      <button
        type="button"
        onClick={() => onStart(competitors, roundTime)}
        disabled={!canStart}
        className="w-full py-4 bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-black text-xl tracking-wide transition-colors"
      >
        GENERAR TORNEO
      </button>

      <p className="text-zinc-700 text-xs text-center pb-2">
        Made with 🔥 & ❤️ for Salsanamá
      </p>

      {plansOpen && (
        <PlansComparisonModal
          onClose={() => setPlansOpen(false)}
          onOpenPromoMenu={onOpenPromoMenu}
        />
      )}
    </div>
  )
}

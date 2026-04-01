import { useState } from 'react'
import { Plus, Trash2, Swords, Clock } from 'lucide-react'

export default function SetupScreen({ initialCompetitors, initialRoundTime, onStart }) {
  const [competitors, setCompetitors] = useState(initialCompetitors)
  const [inputValue, setInputValue] = useState('')
  const [roundTime, setRoundTime] = useState(initialRoundTime)

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

  const canStart = competitors.length >= 2

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="pt-4 text-center">
        <h1 className="text-3xl font-black tracking-tight text-white">
          CLASH<span className="text-red-500">PRO</span>
        </h1>
        <p className="text-zinc-400 text-sm mt-1">Configuración del torneo</p>
      </div>

      {/* Round Time Selector */}
      <section className="space-y-2">
        <div className="flex items-center gap-2 text-zinc-300 text-sm font-semibold uppercase tracking-widest">
          <Clock size={14} />
          <span>Tiempo por ronda</span>
        </div>
        <div className="flex gap-3">
          {[30, 40].map((t) => (
            <button
              key={t}
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

      {/* Add Competitor */}
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
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
          />
          <button
            onClick={handleAdd}
            disabled={!inputValue.trim()}
            className="bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed p-2 rounded-lg transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Competitor List */}
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
                onClick={() => handleRemove(name)}
                className="text-zinc-500 hover:text-red-500 transition-colors p-1"
              >
                <Trash2 size={16} />
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

      {/* Start Button */}
      <button
        onClick={() => onStart(competitors, roundTime)}
        disabled={!canStart}
        className="w-full py-4 bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-black text-xl tracking-wide transition-colors"
      >
        GENERAR TORNEO
      </button>

      <p className="text-zinc-700 text-xs text-center pb-2">
        Made with 🔥 & ❤️ for Salsanamá
      </p>
    </div>
  )
}

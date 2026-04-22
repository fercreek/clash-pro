import { useState } from 'react'
import { UserPlus, Check } from 'lucide-react'

export default function RosterPicker({ roster, selected, onToggle, onAdd }) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')

  const selectedSet = new Set(selected.map((n) => n.toLowerCase()))

  const handleConfirmAdd = async () => {
    const name = newName.trim()
    if (!name) return
    await onAdd?.(name)
    setNewName('')
    setAdding(false)
  }

  if (roster.length === 0 && !adding) {
    return (
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="w-full flex items-center justify-center gap-2 bg-zinc-900/60 border border-dashed border-zinc-700 rounded-2xl py-4 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors text-sm font-medium"
      >
        <UserPlus size={16} />
        Agregar primer bailarín al roster
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {roster.map((c) => {
          const isSelected = selectedSet.has(c.name.toLowerCase())
          return (
            <button
              key={c.id ?? c.name}
              type="button"
              onClick={() => onToggle(c.name)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border ${
                isSelected
                  ? 'bg-red-500/10 border-red-500/40 text-red-300'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              {isSelected && <Check size={11} strokeWidth={3} />}
              <span>{c.name}</span>
              {c.frequency_count > 0 && (
                <span className={`text-[10px] ${isSelected ? 'text-red-400/70' : 'text-zinc-600'}`}>
                  ×{c.frequency_count}
                </span>
              )}
            </button>
          )
        })}

        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-900/60 border border-dashed border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
          >
            <UserPlus size={12} />
            Nuevo
          </button>
        )}
      </div>

      {adding && (
        <div className="flex gap-2">
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirmAdd()
              if (e.key === 'Escape') { setAdding(false); setNewName('') }
            }}
            placeholder="Nombre nuevo…"
            className="flex-1 bg-zinc-900/60 border border-zinc-800 focus:border-zinc-600 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none text-sm"
          />
          <button
            type="button"
            onClick={handleConfirmAdd}
            disabled={!newName.trim()}
            className="bg-red-500 hover:bg-red-400 disabled:opacity-40 px-3 rounded-xl text-xs font-bold"
          >
            Ok
          </button>
          <button
            type="button"
            onClick={() => { setAdding(false); setNewName('') }}
            className="text-zinc-500 hover:text-white px-2 text-xs"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}

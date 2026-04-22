import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { parseNames } from '../utils/nameParser'

export default function BulkNameInput({ onAdd, existingNames = [], disabled = false }) {
  const [value, setValue] = useState('')

  const existingLower = useMemo(
    () => new Set(existingNames.map((n) => n.toLowerCase())),
    [existingNames]
  )

  const parsed = useMemo(() => parseNames(value), [value])
  const newOnes = useMemo(
    () => parsed.filter((n) => !existingLower.has(n.toLowerCase())),
    [parsed, existingLower]
  )

  const handleAdd = () => {
    if (newOnes.length === 0) return
    onAdd?.(newOnes)
    setValue('')
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        placeholder="Pega nombres: Juan, Ana, Luis…"
        rows={2}
        className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-zinc-600 rounded-2xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none transition-colors disabled:opacity-40 text-sm resize-none"
      />

      {parsed.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {parsed.map((name, i) => {
            const isNew = !existingLower.has(name.toLowerCase())
            return (
              <span
                key={`${name}-${i}`}
                className={`text-xs px-2 py-1 rounded-lg font-medium ${
                  isNew
                    ? 'bg-red-500/10 border border-red-500/30 text-red-300'
                    : 'bg-zinc-900/60 border border-zinc-800 text-zinc-500 line-through'
                }`}
              >
                {name}
              </span>
            )
          })}
        </div>
      )}

      <button
        type="button"
        onClick={handleAdd}
        disabled={disabled || newOnes.length === 0}
        className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-400 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2.5 rounded-2xl text-sm font-bold transition-colors"
      >
        <Plus size={16} />
        {newOnes.length === 0 ? 'Agregar' : `Agregar ${newOnes.length}`}
      </button>
    </div>
  )
}

import { useState, useEffect, useMemo } from 'react'
import { X, Plus, Trash2, Users } from 'lucide-react'
import { usePlan } from '../hooks/usePlan'

export default function PracticeRosterEditModal({ open, onClose, initialNames, onApply, sessionStats = null, sessionPairings = null, maxCompetitors: maxProp }) {
  const { isFree, maxCompetitors: planMax } = usePlan()
  const cap = maxProp ?? (isFree ? planMax : 64)
  const [rows, setRows] = useState(() => (initialNames.length ? [...initialNames] : ['', '']))
  const [localError, setLocalError] = useState(null)

  useEffect(() => {
    if (!open) return
    setRows(initialNames.length ? [...initialNames] : ['', ''])
  }, [open, initialNames])

  useEffect(() => {
    if (open) setLocalError(null)
  }, [open])

  const balanceInfo = useMemo(() => {
    if (!sessionStats || Object.keys(sessionStats).length === 0) return null
    const entries = Object.entries(sessionStats).sort((a, b) => b[1] - a[1])
    const counts = entries.map(([, c]) => c)
    const max = counts[0] ?? 0
    const min = counts[counts.length - 1] ?? 0
    const diff = max - min
    const overusedPairs = []
    if (sessionPairings?.length) {
      const pairMap = new Map()
      for (const m of sessionPairings) {
        const key = [m.playerA, m.playerB].sort().join(' ⇄ ')
        pairMap.set(key, (pairMap.get(key) ?? 0) + 1)
      }
      for (const [pair, count] of pairMap) {
        if (count >= 2) overusedPairs.push({ pair, count })
      }
      overusedPairs.sort((a, b) => b.count - a.count)
    }
    return { entries, max, diff, overusedPairs }
  }, [sessionStats, sessionPairings])

  if (!open) return null

  const apply = () => {
    setLocalError(null)
    const list = rows.map((s) => s.trim()).filter(Boolean)
    const seen = new Set()
    for (const n of list) {
      const k = n.toLowerCase()
      if (seen.has(k)) {
        setLocalError('Nombres duplicados')
        return
      }
      seen.add(k)
    }
    if (list.length < 2) {
      setLocalError('Se necesitan al menos dos bailarines')
      return
    }
    const res = onApply({ ok: true, names: list })
    if (res?.error) {
      setLocalError(res.error)
      return
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-red-500">
              <Users size={18} />
            </div>
            <h2 className="text-lg font-black text-white">Bailarines</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800"
            aria-label="Cerrar panel"
          >
            <X size={20} />
          </button>
        </div>
        <p className="text-xs text-zinc-500">
          Mismo número de nombres: se mantienen rondas y progreso. Si cambia el número, al guardar se pedirá
          confirmación para regenerar la iteración actual.
        </p>

        {balanceInfo && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Esta sesión</p>
              <span className={`text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full ${
                balanceInfo.diff <= 1
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : balanceInfo.diff <= 3
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'bg-red-500/15 text-red-400'
              }`}>
                {balanceInfo.diff <= 1 ? 'Balanceado' : `+${balanceInfo.diff} dif`}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {balanceInfo.entries.map(([name, count]) => (
                <div key={name} className="flex items-center gap-1">
                  <span className="text-xs text-zinc-400 truncate max-w-[80px]">{name}</span>
                  <span className="text-xs font-black text-red-400 tabular-nums">{count}</span>
                </div>
              ))}
            </div>
            {balanceInfo.overusedPairs.length > 0 && (
              <div className="pt-1 border-t border-zinc-800 space-y-0.5">
                <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wide">Parejas repetidas</p>
                {balanceInfo.overusedPairs.map(({ pair, count }) => (
                  <p key={pair} className="text-xs text-zinc-400">{pair} <span className="text-amber-400 font-bold">×{count}</span></p>
                ))}
              </div>
            )}
          </div>
        )}

        {localError && <p className="text-sm text-red-400 font-medium">{localError}</p>}
        <ul className="space-y-2">
          {rows.map((v, i) => (
            <li key={i} className="flex gap-2">
              <input
                value={v}
                onChange={(e) => {
                  const t = e.target.value
                  setRows((r) => r.map((x, j) => (j === i ? t : x)))
                }}
                className="flex-1 min-w-0 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm font-medium"
                placeholder="Nombre"
                autoCapitalize="words"
              />
              <button
                type="button"
                onClick={() => {
                  if (rows.length <= 1) return
                  setRows((r) => r.filter((_, j) => j !== i))
                }}
                className="shrink-0 p-2.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-red-400 transition-colors"
                title="Quitar"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
        {rows.length < cap && (
          <button
            type="button"
            onClick={() => setRows((r) => [...r, ''])}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-zinc-700 text-zinc-400 text-sm font-bold hover:text-white hover:border-zinc-500"
          >
            <Plus size={16} />
            Añadir
          </button>
        )}
        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-900 text-sm font-bold text-zinc-300 hover:bg-zinc-800"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={apply}
            className="px-4 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-sm font-black text-white"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  )
}

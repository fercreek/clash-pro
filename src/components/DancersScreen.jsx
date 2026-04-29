import { useState, useRef } from 'react'
import { ArrowLeft, Plus, Check, X, Pencil } from 'lucide-react'
import { useRoster } from '../hooks/useRoster'

const LEVELS = [
  { key: 'beginner',   label: 'B', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40', dot: 'bg-emerald-500', ring: 'ring-emerald-500' },
  { key: 'intermedio', label: 'I', color: 'bg-blue-500/20 text-blue-400 border-blue-500/40',           dot: 'bg-blue-500',    ring: 'ring-blue-500'   },
  { key: 'avanzado',   label: 'A', color: 'bg-red-500/20 text-red-400 border-red-500/40',              dot: 'bg-red-500',     ring: 'ring-red-500'    },
]

const LEVEL_MAP = Object.fromEntries(LEVELS.map((l) => [l.key, l]))

function levelDot(level) {
  return level ? LEVEL_MAP[level]?.dot ?? 'bg-zinc-600' : 'bg-zinc-600'
}

function DancerRow({ dancer, onUpdateLevel, onRename, onToggleActive }) {
  const [editing, setEditing] = useState(false)
  const [nameVal, setNameVal] = useState(dancer.name)
  const inputRef = useRef(null)

  const startEdit = () => {
    setNameVal(dancer.name)
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const commitEdit = () => {
    const trimmed = nameVal.trim()
    if (trimmed && trimmed !== dancer.name) onRename(dancer.id, trimmed)
    setEditing(false)
  }

  const cancelEdit = () => {
    setNameVal(dancer.name)
    setEditing(false)
  }

  const isInactive = dancer.is_active === false

  return (
    <li className={`flex items-center gap-3 px-4 py-3 border-b border-zinc-900 ${isInactive ? 'opacity-50' : ''}`}>
      {/* Avatar */}
      <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-[11px] font-black text-white ring-2 ring-offset-2 ring-offset-zinc-950 ${dancer.level ? LEVEL_MAP[dancer.level]?.ring ?? 'ring-zinc-700' : 'ring-zinc-700'}`}
        style={{ background: '#27272a' }}>
        <span className={`w-2 h-2 rounded-full absolute ${levelDot(dancer.level)}`} style={{ marginTop: 14, marginLeft: 14 }} />
        {dancer.name.slice(0, 2).toUpperCase()}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex items-center gap-1.5">
            <input
              ref={inputRef}
              value={nameVal}
              onChange={(e) => setNameVal(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit() }}
              className="flex-1 min-w-0 bg-zinc-800 border border-zinc-600 rounded-lg px-2 py-1 text-sm text-white font-medium focus:outline-none focus:border-red-500"
              autoCapitalize="words"
            />
            <button type="button" onClick={commitEdit} className="p-1 text-emerald-400 hover:text-emerald-300"><Check size={15} /></button>
            <button type="button" onClick={cancelEdit} className="p-1 text-zinc-500 hover:text-zinc-300"><X size={15} /></button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm font-medium text-white truncate">{dancer.name}</span>
            <button type="button" onClick={startEdit} className="shrink-0 p-1 text-zinc-600 hover:text-zinc-300 transition-colors">
              <Pencil size={12} />
            </button>
          </div>
        )}
        <p className="text-[11px] text-zinc-600 mt-0.5">
          {dancer.frequency_count > 0 ? `${dancer.frequency_count} rondas` : 'Sin rondas aún'}
        </p>
      </div>

      {/* Level pills */}
      <div className="flex items-center gap-1 shrink-0">
        {LEVELS.map((l) => (
          <button
            key={l.key}
            type="button"
            onClick={() => onUpdateLevel(dancer.id, dancer.level === l.key ? null : l.key)}
            className={`w-8 h-8 rounded-lg border text-xs font-black transition-all active:scale-95 ${
              dancer.level === l.key
                ? l.color
                : 'bg-zinc-800/60 border-zinc-700 text-zinc-500 hover:border-zinc-500'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* Deactivate */}
      <button
        type="button"
        onClick={() => onToggleActive(dancer.id, dancer.is_active)}
        className="shrink-0 p-2 text-zinc-600 hover:text-red-400 transition-colors"
        title={isInactive ? 'Reactivar' : 'Desactivar'}
      >
        <X size={15} />
      </button>
    </li>
  )
}

export default function DancersScreen({ onBack }) {
  const { roster, loading, updateDancer, addDancer, refresh } = useRoster()
  const [addingName, setAddingName] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const addInputRef = useRef(null)

  const active = roster.filter((r) => r.is_active !== false)
  const inactive = roster.filter((r) => r.is_active === false)

  const handleUpdateLevel = (id, level) => {
    updateDancer(id, { level })
  }

  const handleRename = (id, name) => {
    updateDancer(id, { name })
  }

  const handleToggleActive = (id, currentActive) => {
    updateDancer(id, { is_active: currentActive === false ? true : false })
  }

  const handleAdd = async () => {
    const trimmed = addingName.trim()
    if (!trimmed) return
    await addDancer(trimmed)
    setAddingName('')
    setShowAdd(false)
    refresh()
  }

  const openAdd = () => {
    setShowAdd(true)
    setTimeout(() => addInputRef.current?.focus(), 50)
  }

  return (
    <div className="min-h-full bg-zinc-950 text-white">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur border-b border-zinc-900 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button type="button" onClick={onBack} className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-black tracking-[0.25em] uppercase text-zinc-500">Gestión</p>
            <h1 className="text-lg font-black text-white leading-tight">Mis Bailarines</h1>
          </div>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="w-9 h-9 rounded-xl bg-red-500 hover:bg-red-400 flex items-center justify-center transition-colors active:scale-95"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Level legend */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-3">
        {LEVELS.map((l) => (
          <div key={l.key} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${l.dot}`} />
            <span className="text-[11px] text-zinc-500 capitalize">{l.key}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-zinc-600" />
          <span className="text-[11px] text-zinc-500">Sin nivel</span>
        </div>
      </div>

      {/* Add inline */}
      {showAdd && (
        <div className="mx-4 mb-3 flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5">
          <input
            ref={addInputRef}
            value={addingName}
            onChange={(e) => setAddingName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setShowAdd(false); setAddingName('') } }}
            placeholder="Nombre del bailarín..."
            className="flex-1 min-w-0 bg-transparent text-white text-sm font-medium placeholder-zinc-600 focus:outline-none"
            autoCapitalize="words"
          />
          <button type="button" onClick={handleAdd} disabled={!addingName.trim()} className="shrink-0 p-1.5 text-emerald-400 hover:text-emerald-300 disabled:opacity-40 transition-colors">
            <Check size={16} />
          </button>
          <button type="button" onClick={() => { setShowAdd(false); setAddingName('') }} className="shrink-0 p-1.5 text-zinc-500 hover:text-zinc-300">
            <X size={16} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="px-4 py-12 text-center text-zinc-600 text-sm">Cargando...</div>
      ) : active.length === 0 && !showAdd ? (
        <div className="px-4 py-16 text-center space-y-3">
          <p className="text-zinc-500 text-sm">Sin bailarines aún.</p>
          <button type="button" onClick={openAdd} className="text-red-400 text-sm font-bold hover:text-red-300">+ Agregar primero</button>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-900/0">
          {active.map((d) => (
            <DancerRow
              key={d.id}
              dancer={d}
              onUpdateLevel={handleUpdateLevel}
              onRename={handleRename}
              onToggleActive={handleToggleActive}
            />
          ))}
        </ul>
      )}

      {inactive.length > 0 && (
        <div className="mt-4">
          <p className="px-4 pb-2 text-[10px] font-black uppercase tracking-widest text-zinc-600">Inactivos</p>
          <ul>
            {inactive.map((d) => (
              <DancerRow
                key={d.id}
                dancer={d}
                onUpdateLevel={handleUpdateLevel}
                onRename={handleRename}
                onToggleActive={handleToggleActive}
              />
            ))}
          </ul>
        </div>
      )}

      <div className="h-16" />
    </div>
  )
}

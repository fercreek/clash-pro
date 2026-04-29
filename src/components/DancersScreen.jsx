import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { ArrowLeft, Plus, Check, X, Users, Archive, RotateCcw, Trash2 } from 'lucide-react'
import { useRoster } from '../hooks/useRoster'
import { useAuth } from '../hooks/useAuth'
import { dedupeRosterForViewerTable } from '../lib/rosterCanonical'

const LEVELS = [
  { key: 'beginner', label: 'B · Princ.' },
  { key: 'intermedio', label: 'I · Inter.' },
  { key: 'avanzado', label: 'A · Avanz.' },
]

function fmtShort(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short' })
  } catch {
    return '—'
  }
}

function DancerTableRow({ dancer, onPatch, onSetVisibility, onHardDelete }) {
  const [nameDraft, setNameDraft] = useState(dancer.name)
  const archived = !!dancer.deleted_at

  useEffect(() => {
    setNameDraft(dancer.name)
  }, [dancer.name, dancer.id])

  const commitName = useCallback(async () => {
    if (archived) return
    const t = nameDraft.trim()
    if (!t || t === dancer.name) return
    const r = await onPatch(dancer.id, { name: t })
    if (r == null) setNameDraft(dancer.name)
  }, [archived, nameDraft, dancer.name, dancer.id, onPatch])

  const active = dancer.is_active !== false

  return (
    <tr
      className={`border-b border-zinc-800/80 ${
        archived ? 'bg-zinc-900/60 opacity-80' : active ? '' : 'bg-zinc-900/40 opacity-75'
      }`}
    >
      <td className="py-2.5 pl-2 pr-1 align-middle w-10">
        {dancer.photo_url ? (
          <img src={dancer.photo_url} alt="" className="w-8 h-8 rounded-full object-cover border border-zinc-700" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[9px] font-black text-zinc-400">
            {dancer.name.slice(0, 2).toUpperCase()}
          </div>
        )}
      </td>
      <td className="py-2.5 px-1 align-middle min-w-[8.5rem]">
        <input
          type="text"
          value={nameDraft}
          disabled={archived}
          onChange={(e) => setNameDraft(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.target.blur()
            }
          }}
          className="w-full max-w-[11rem] bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-white font-medium focus:outline-none focus:border-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
          autoCapitalize="words"
        />
      </td>
      <td className="py-2.5 px-1 align-middle">
        <select
          value={dancer.level ?? ''}
          disabled={archived}
          onChange={(e) => {
            const v = e.target.value
            onPatch(dancer.id, { level: v === '' ? null : v })
          }}
          className="w-full min-w-[6.5rem] max-w-[9rem] bg-zinc-900 border border-zinc-700 rounded-lg px-1.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-red-500/50 disabled:opacity-50"
        >
          <option value="">Sin nivel</option>
          {LEVELS.map((l) => (
            <option key={l.key} value={l.key}>
              {l.label}
            </option>
          ))}
        </select>
      </td>
      <td className="py-2.5 px-1 align-middle text-center tabular-nums text-zinc-400 text-xs font-semibold w-12">
        {dancer.frequency_count ?? 0}
      </td>
      <td className="py-2.5 px-1 align-middle text-center tabular-nums text-zinc-500 text-xs w-10">
        {dancer.repeat_count ?? 0}
      </td>
      <td className="py-2.5 px-1 align-middle text-zinc-500 text-[11px] whitespace-nowrap w-16">
        {fmtShort(dancer.last_danced_at)}
      </td>
      <td className="py-2.5 px-1 align-middle">
        {archived ? (
          <span className="inline-block px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25 text-[10px] font-black uppercase text-amber-400/90">
            Archivado
          </span>
        ) : (
          <div className="inline-flex rounded-lg border border-zinc-700 overflow-hidden">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                void onSetVisibility(true)
              }}
              className={`px-2 py-1 text-[10px] font-black uppercase tracking-wide transition-colors ${
                active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Lista
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                void onSetVisibility(false)
              }}
              className={`px-2 py-1 text-[10px] font-black uppercase tracking-wide border-l border-zinc-700 transition-colors ${
                !active ? 'bg-zinc-600/40 text-zinc-200' : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Oculto
            </button>
          </div>
        )}
      </td>
      <td className="py-2.5 pr-2 pl-1 align-middle w-[4.5rem]">
        {archived ? (
          <button
            type="button"
            onClick={() => onPatch(dancer.id, { deleted_at: null, is_active: true })}
            className="flex items-center justify-center gap-1 w-full py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/35 text-[10px] font-black uppercase text-emerald-300 hover:bg-emerald-500/25 transition-colors"
            title="Quita archivo suave y vuelve a la lista"
          >
            <RotateCcw size={12} strokeWidth={2.5} />
            <span className="hidden sm:inline">Volver</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() =>
              onPatch(dancer.id, { deleted_at: new Date().toISOString(), is_active: false })
            }
            className="flex items-center justify-center w-full py-1.5 rounded-lg bg-zinc-800 border border-zinc-600 text-zinc-400 hover:text-amber-400 hover:border-amber-500/40 transition-colors"
            title="Archivo suave: no se borra de la base; desaparece del roster hasta restaurar"
          >
            <Archive size={14} strokeWidth={2} />
          </button>
        )}
      </td>
      <td className="py-2.5 pr-2 pl-1 align-middle w-11">
        <button
          type="button"
          onClick={() => onHardDelete(dancer)}
          className="flex items-center justify-center w-full py-1.5 rounded-lg border border-red-900/50 bg-red-950/30 text-red-400/90 hover:bg-red-950/60 hover:text-red-300 transition-colors"
          title="Borrar fila de la base (no se puede deshacer)"
        >
          <Trash2 size={14} strokeWidth={2} />
        </button>
      </td>
    </tr>
  )
}

export default function DancersScreen({ onBack }) {
  const { user, loading: authLoading } = useAuth()
  const {
    roster,
    loading,
    error: rosterError,
    updateDancer,
    updateVisibilityByNameKey,
    addDancer,
    refresh,
    deleteDancerPermanent,
  } = useRoster()
  const [filter, setFilter] = useState('active')
  const [addingName, setAddingName] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const addInputRef = useRef(null)

  const filtered = useMemo(() => {
    const alive = (r) => !r.deleted_at
    if (filter === 'active') return roster.filter((r) => alive(r))
    if (filter === 'hidden') return roster.filter((r) => alive(r) && r.is_active === false)
    if (filter === 'archived') return roster.filter((r) => !!r.deleted_at)
    return [...roster].sort((a, b) => {
      const ad = a.deleted_at ? 1 : 0
      const bd = b.deleted_at ? 1 : 0
      if (ad !== bd) return ad - bd
      const ai = a.is_active === false ? 1 : 0
      const bi = b.is_active === false ? 1 : 0
      if (ai !== bi) return ai - bi
      return a.name.localeCompare(b.name, 'es')
    })
  }, [roster, filter])

  const viewerId = user?.id ?? ''

  const displayRows = useMemo(() => {
    const deduped = dedupeRosterForViewerTable(filtered, viewerId)
    return [...deduped].sort((a, b) => {
      if (filter === 'active') {
        const ah = a.is_active === false ? 1 : 0
        const bh = b.is_active === false ? 1 : 0
        if (ah !== bh) return ah - bh
      }
      if (filter === 'all') {
        const ad = a.deleted_at ? 1 : 0
        const bd = b.deleted_at ? 1 : 0
        if (ad !== bd) return ad - bd
        const ai = a.is_active === false ? 1 : 0
        const bi = b.is_active === false ? 1 : 0
        if (ai !== bi) return ai - bi
      }
      return a.name.localeCompare(b.name, 'es')
    })
  }, [filtered, filter, viewerId])

  const counts = useMemo(() => {
    const alive = (r) => !r.deleted_at
    const uid = user?.id ?? ''
    const rosterAlive = dedupeRosterForViewerTable(roster.filter((r) => alive(r)), uid).length
    const hidden = dedupeRosterForViewerTable(roster.filter((r) => alive(r) && r.is_active === false), uid).length
    const archived = dedupeRosterForViewerTable(roster.filter((r) => !!r.deleted_at), uid).length
    const all = dedupeRosterForViewerTable(roster, uid).length
    return { rosterAlive, hidden, archived, all }
  }, [roster, user?.id])

  const hasHiddenDupes = viewerId && filtered.length > displayRows.length

  const patchDancer = useCallback(async (id, patch) => updateDancer(id, patch), [updateDancer])

  const handleAdd = async () => {
    const trimmed = addingName.trim()
    if (!trimmed) return
    await addDancer(trimmed)
    setAddingName('')
    setShowAdd(false)
    refresh()
  }

  const handleHardDelete = useCallback(
    async (d) => {
      if (!window.confirm(`¿Borrar permanentemente la fila «${d.name}»? No se puede deshacer.`)) return
      await deleteDancerPermanent(d.id)
      refresh()
    },
    [deleteDancerPermanent, refresh],
  )

  const openAdd = () => {
    setShowAdd(true)
    setTimeout(() => addInputRef.current?.focus(), 50)
  }

  if (!authLoading && !user) {
    return (
      <div className="min-h-full bg-zinc-950 text-white flex flex-col">
        <div className="sticky top-0 z-20 bg-zinc-950/95 backdrop-blur border-b border-zinc-900 px-4 py-3 flex items-center gap-3">
          <button type="button" onClick={onBack} className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-black text-white">Mis bailarines</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-3">
          <Users size={40} className="text-zinc-600" />
          <p className="text-zinc-400 text-sm">Inicia sesión para ver y editar tu roster en una tabla.</p>
          <button type="button" onClick={onBack} className="text-red-400 text-sm font-bold">
            Volver
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-zinc-950 text-white flex flex-col">
      <div className="sticky top-0 z-20 bg-zinc-950/95 backdrop-blur border-b border-zinc-900 px-3 sm:px-4 py-3 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button type="button" onClick={onBack} className="p-2 -ml-1 text-zinc-400 hover:text-white transition-colors shrink-0">
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-500">Roster</p>
            <h1 className="text-base sm:text-lg font-black text-white leading-tight truncate">Mis bailarines</h1>
          </div>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="shrink-0 w-9 h-9 rounded-xl bg-red-500 hover:bg-red-400 flex items-center justify-center transition-colors active:scale-95"
          aria-label="Agregar bailarín"
        >
          <Plus size={18} />
        </button>
      </div>

      {rosterError && (
        <div className="mx-3 sm:mx-4 mt-2 rounded-xl border border-red-500/40 bg-red-950/40 px-3 py-2 text-[11px] text-red-200 leading-snug">
          {rosterError.message}
          <button type="button" onClick={() => refresh()} className="ml-2 font-black text-red-300 underline underline-offset-2">
            Reintentar
          </button>
        </div>
      )}

      <p className="px-3 sm:px-4 pt-2 pb-1 text-[11px] text-zinc-500 leading-snug">
        Solo tu roster en cuenta. Un mismo nombre no se repite en la tabla salvo que la fila sea de otro usuario (otro id). <span className="text-zinc-600">Archivo</span> es suave; la papelera borra en la base.
      </p>

      {hasHiddenDupes && (
        <p className="px-3 sm:px-4 text-[10px] text-amber-500/90 leading-snug">
          Hay más de una fila con el mismo nombre en la base; aquí ves la fila prioritaria para esa clave.
        </p>
      )}

      <div className="px-3 sm:px-4 pb-2 flex flex-wrap gap-1.5 items-center">
        {[
          { id: 'active', label: 'Roster', n: counts.rosterAlive },
          { id: 'hidden', label: 'Ocultos', n: counts.hidden },
          { id: 'archived', label: 'Archivo', n: counts.archived },
          { id: 'all', label: 'Todos', n: counts.all },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setFilter(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wide transition-colors ${
              filter === t.id ? 'bg-red-500/20 text-red-300 border border-red-500/35' : 'bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {t.label} <span className="tabular-nums opacity-70">({t.n})</span>
          </button>
        ))}
      </div>

      {showAdd && (
        <div className="mx-3 sm:mx-4 mb-2 flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 shrink-0">
          <input
            ref={addInputRef}
            value={addingName}
            onChange={(e) => setAddingName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd()
              if (e.key === 'Escape') {
                setShowAdd(false)
                setAddingName('')
              }
            }}
            placeholder="Nombre del bailarín…"
            className="flex-1 min-w-0 bg-transparent text-white text-sm font-medium placeholder-zinc-600 focus:outline-none"
            autoCapitalize="words"
          />
          <button type="button" onClick={handleAdd} disabled={!addingName.trim()} className="shrink-0 p-1.5 text-emerald-400 hover:text-emerald-300 disabled:opacity-40 transition-colors">
            <Check size={16} />
          </button>
          <button
            type="button"
            onClick={() => {
              setShowAdd(false)
              setAddingName('')
            }}
            className="shrink-0 p-1.5 text-zinc-500 hover:text-zinc-300"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-auto px-1 sm:px-3 pb-28">
        {loading ? (
          <div className="py-16 text-center text-zinc-600 text-sm">Cargando tabla…</div>
        ) : displayRows.length === 0 ? (
          <div className="py-16 text-center space-y-2 px-4">
            <p className="text-zinc-500 text-sm">
              {filter === 'active'
                ? 'No hay nadie en el roster. Agrega uno o restaura desde archivo.'
                : filter === 'hidden'
                  ? 'No hay bailarines ocultos.'
                  : filter === 'archived'
                    ? 'Nadie en archivo suave.'
                    : 'Sin registros aún.'}
            </p>
            {filter === 'active' && !showAdd && (
              <button type="button" onClick={openAdd} className="text-red-400 text-sm font-bold">
                + Agregar bailarín
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-800/80 bg-zinc-950/50">
            <table className="w-full min-w-[40rem] text-left text-sm border-collapse">
              <thead className="border-b border-zinc-800">
                <tr>
                  <th className="py-2.5 pl-2 pr-0 text-[10px] font-black uppercase tracking-wider text-zinc-500 w-10 sticky top-0 z-10 bg-zinc-950/95 backdrop-blur-sm" />
                  <th className="py-2.5 px-1 text-[10px] font-black uppercase tracking-wider text-zinc-500 sticky top-0 z-10 bg-zinc-950/95 backdrop-blur-sm">Nombre</th>
                  <th className="py-2.5 px-1 text-[10px] font-black uppercase tracking-wider text-zinc-500 sticky top-0 z-10 bg-zinc-950/95 backdrop-blur-sm">Nivel</th>
                  <th className="py-2.5 px-1 text-[10px] font-black uppercase tracking-wider text-zinc-500 text-center w-12 sticky top-0 z-10 bg-zinc-950/95 backdrop-blur-sm">Rond.</th>
                  <th className="py-2.5 px-1 text-[10px] font-black uppercase tracking-wider text-zinc-500 text-center w-10 sticky top-0 z-10 bg-zinc-950/95 backdrop-blur-sm">Rep.</th>
                  <th className="py-2.5 px-1 text-[10px] font-black uppercase tracking-wider text-zinc-500 w-16 sticky top-0 z-10 bg-zinc-950/95 backdrop-blur-sm">Última</th>
                  <th className="py-2.5 px-1 text-[10px] font-black uppercase tracking-wider text-zinc-500 sticky top-0 z-10 bg-zinc-950/95 backdrop-blur-sm">Visibilidad</th>
                  <th className="py-2.5 pr-2 pl-1 text-[10px] font-black uppercase tracking-wider text-zinc-500 sticky top-0 z-10 bg-zinc-950/95 backdrop-blur-sm w-[4.5rem]">Archivo</th>
                  <th className="py-2.5 pr-2 pl-1 text-[10px] font-black uppercase tracking-wider text-zinc-500 sticky top-0 z-10 bg-zinc-950/95 backdrop-blur-sm w-11">Borrar</th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((d) => (
                  <DancerTableRow
                    key={d.id}
                    dancer={d}
                    onPatch={patchDancer}
                    onSetVisibility={(next) => updateVisibilityByNameKey(d.name, next)}
                    onHardDelete={handleHardDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const LEVEL_OPTS = [
  { key: 'beginner', label: 'B', long: 'Principiante', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  { key: 'intermedio', label: 'I', long: 'Intermedio', cls: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  { key: 'avanzado', label: 'A', long: 'Avanzado', cls: 'bg-red-500/20 text-red-300 border-red-500/40' },
]

function fmtDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return '—'
  }
}

export default function DancerProfileModal({
  open,
  onClose,
  sessionName,
  rosterRecord,
  updateDancer,
  addDancer,
  onRenamedInSession,
}) {
  const [draftName, setDraftName] = useState('')
  const [draftLevel, setDraftLevel] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setDraftName(sessionName)
    setDraftLevel(rosterRecord?.level ?? null)
  }, [open, sessionName, rosterRecord?.id, rosterRecord?.level])

  if (!open) return null

  const nameTrim = draftName.trim()
  const sessionOnlyRename =
    !rosterRecord &&
    nameTrim &&
    nameTrim.toLowerCase() !== sessionName.toLowerCase()

  const handleSessionOnlyRename = () => {
    if (!sessionOnlyRename) return
    onRenamedInSession?.(sessionName, nameTrim)
    onClose()
  }

  const handleSave = async () => {
    if (!nameTrim) return
    setSaving(true)
    try {
      if (rosterRecord) {
        if (nameTrim !== rosterRecord.name) {
          const r = await updateDancer(rosterRecord.id, { name: nameTrim })
          if (!r) return
          onRenamedInSession?.(rosterRecord.name, r.name)
        }
        if (draftLevel !== rosterRecord.level) {
          const r2 = await updateDancer(rosterRecord.id, { level: draftLevel })
          if (!r2) return
        }
      } else {
        const created = await addDancer(nameTrim)
        if (!created) return
        if (draftLevel) await updateDancer(created.id, { level: draftLevel })
        const finalName = created.name || nameTrim
        if (finalName.toLowerCase() !== sessionName.toLowerCase()) {
          onRenamedInSession?.(sessionName, finalName)
        }
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/75 z-[100]" onClick={onClose} aria-hidden />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[110] w-[min(100vw-2rem,22rem)] max-h-[min(90vh,32rem)] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Perfil</p>
            <h2 className="text-lg font-black text-white leading-tight mt-0.5">Bailarín</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-500 hover:bg-zinc-800 hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <label className="block mb-3">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 block">Nombre</span>
          <input
            type="text"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm font-medium focus:outline-none focus:border-red-500/60"
            autoCapitalize="words"
          />
        </label>

        {sessionOnlyRename && (
          <button
            type="button"
            onClick={handleSessionOnlyRename}
            className="w-full mb-3 py-2 rounded-xl border border-zinc-700 text-zinc-400 text-xs font-bold hover:bg-zinc-900 hover:text-zinc-200 transition-colors"
          >
            Solo renombrar en esta sesión (sin roster)
          </button>
        )}

        <div className="mb-3">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Nivel</span>
          <div className="flex gap-2">
            {LEVEL_OPTS.map((l) => (
              <button
                key={l.key}
                type="button"
                onClick={() => setDraftLevel((prev) => (prev === l.key ? null : l.key))}
                className={`flex-1 py-2.5 rounded-xl border text-xs font-black transition-all active:scale-[0.98] ${
                  draftLevel === l.key ? l.cls : 'bg-zinc-900/80 border-zinc-700 text-zinc-500 hover:border-zinc-600'
                }`}
              >
                <span className="block text-sm leading-none">{l.label}</span>
                <span className="block text-[9px] font-semibold opacity-80 mt-0.5 normal-case">{l.long}</span>
              </button>
            ))}
          </div>
        </div>

        {rosterRecord ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-3 mb-4 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Estadísticas</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-zinc-600">Rondas totales</p>
                <p className="font-black text-red-400 tabular-nums">{rosterRecord.frequency_count ?? 0}</p>
              </div>
              <div>
                <p className="text-zinc-600">Repeticiones</p>
                <p className="font-black text-amber-400/90 tabular-nums">{rosterRecord.repeat_count ?? 0}</p>
              </div>
              <div className="col-span-2">
                <p className="text-zinc-600">Última vez en pista</p>
                <p className="font-semibold text-zinc-300">{fmtDate(rosterRecord.last_danced_at)}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-zinc-500 text-xs leading-relaxed mb-4">
            Sin ficha en roster: al guardar se crea el bailarín y se persisten nivel y futuras estadísticas.
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-zinc-700 text-sm font-bold text-zinc-400 hover:bg-zinc-900 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={saving || !nameTrim}
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-400 disabled:opacity-40 text-sm font-black text-white transition-colors"
          >
            {saving ? '…' : rosterRecord ? 'Guardar' : 'Guardar en roster'}
          </button>
        </div>
      </div>
    </>
  )
}

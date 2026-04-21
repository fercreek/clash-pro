import { useState, useEffect, useCallback, useRef } from 'react'
import {
  ChevronLeft, Plus, Trash2, Edit3, Copy, Play, Pause, Save,
  Eraser, Music2, VolumeX, Circle, Square, AlertCircle, BookOpen,
} from 'lucide-react'
import {
  INSTRUMENTS, MIN_BPM, MAX_BPM, DEFAULT_BPM, STEPS_PER_PATTERN,
  emptyPattern, REFERENCE_PATTERNS,
} from '../data/rhythmPatterns'
import { useRhythmEngine } from '../hooks/useRhythmEngine'
import { listPatterns, savePattern, deletePattern } from '../lib/customPatterns'

// ── Mini grid (read-only) ─────────────────────────────────────────────────────
function MiniGrid({ pattern, currentStep = -1, isPlaying = false }) {
  return (
    <div className="space-y-0.5">
      {INSTRUMENTS.map((inst) => (
        <div key={inst.id} className="flex gap-0.5">
          {(pattern?.[inst.id] ?? Array(STEPS_PER_PATTERN).fill(0)).map((hit, i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-sm transition-colors ${
                hit
                  ? i === currentStep && isPlaying ? 'bg-red-400' : 'bg-red-500/70'
                  : i === currentStep && isPlaying ? 'bg-zinc-600' : 'bg-zinc-800'
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// ── Reference pattern card ────────────────────────────────────────────────────
function RefPatternCard({ data, onUseAsBase, onOpenBlogPost }) {
  const { isPlaying, currentStep, toggle } = useRhythmEngine(data.pattern, data.bpm)

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="text-white font-semibold text-sm">{data.label}</p>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-700 text-zinc-400 uppercase tracking-wide shrink-0">
              Ref
            </span>
          </div>
          <p className="text-zinc-400 text-xs leading-snug">{data.description}</p>
        </div>
        <span className="text-zinc-500 text-xs tabular-nums shrink-0">{data.bpm} BPM</span>
      </div>

      <MiniGrid pattern={data.pattern} currentStep={currentStep} isPlaying={isPlaying} />

      <p className="text-zinc-600 text-[10px] leading-snug italic">{data.credit}</p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggle}
          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2.5 rounded-lg transition-colors ${
            isPlaying
              ? 'bg-zinc-800 text-white'
              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
          }`}
        >
          {isPlaying ? <><Pause size={13} /> Parar</> : <><Play size={13} fill="currentColor" /> Preview</>}
        </button>

        <button
          type="button"
          onClick={() => onUseAsBase({ name: data.label, bpm: data.bpm, pattern: data.pattern })}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 transition-colors"
        >
          <Copy size={13} /> Usar como base
        </button>

        {data.blogSlug && onOpenBlogPost && (
          <button
            type="button"
            onClick={() => onOpenBlogPost(data.blogSlug)}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-red-400 transition-colors px-2 py-2.5"
            title="Leer artículo"
          >
            <BookOpen size={13} /> Artículo
          </button>
        )}
      </div>
    </div>
  )
}

// ── Library view ──────────────────────────────────────────────────────────────
function Library({ items, loading, error, onNew, onEdit, onDuplicate, onDelete, onUseAsBase, onOpenBlogPost }) {
  const [confirmId, setConfirmId] = useState(null)

  return (
    <div className="px-4 py-4 space-y-6">
      <button
        type="button"
        onClick={onNew}
        className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-2xl transition-colors"
      >
        <Plus size={18} /> Nuevo patrón
      </button>

      {/* Patrones de referencia */}
      <div className="space-y-2">
        <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Patrones de referencia</p>
        {REFERENCE_PATTERNS.map((ref) => (
          <RefPatternCard
            key={ref.id}
            data={ref}
            onUseAsBase={onUseAsBase}
            onOpenBlogPost={onOpenBlogPost}
          />
        ))}
      </div>

      {/* Mis patrones */}
      <div className="space-y-2">
        <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Mis patrones</p>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && items.length === 0 && !error && (
          <div className="text-center py-6 text-zinc-500 text-sm">
            <Music2 size={28} className="mx-auto mb-2 text-zinc-700" />
            Aún no tienes patrones guardados.<br />
            Crea uno o usa un patrón de referencia como base.
          </div>
        )}

        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{it.name}</p>
                  <p className="text-zinc-500 text-[11px]">{it.bpm} BPM</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onEdit(it)}
                    className="p-3 text-zinc-400 hover:text-red-400 transition-colors"
                    title="Editar"
                  >
                    <Edit3 size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDuplicate(it)}
                    className="p-3 text-zinc-400 hover:text-red-400 transition-colors"
                    title="Duplicar"
                  >
                    <Copy size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmId(confirmId === it.id ? null : it.id)}
                    className="p-3 text-zinc-400 hover:text-red-400 transition-colors"
                    title="Borrar"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>

              <MiniGrid pattern={it.pattern} />

              {confirmId === it.id && (
                <div className="mt-3 flex items-center justify-between gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                  <span className="text-red-300 text-xs">¿Borrar "{it.name}"?</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmId(null)}
                      className="text-zinc-400 text-xs px-2 py-1"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => { onDelete(it.id); setConfirmId(null) }}
                      className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-lg"
                    >
                      Borrar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Editor view ───────────────────────────────────────────────────────────────
function Editor({ initial, onCancel, onSaved }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [draft, setDraft] = useState(() => initial?.pattern ?? emptyPattern())
  const [editorBpm, setEditorBpm] = useState(initial?.bpm ?? DEFAULT_BPM)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  const [recording, setRecording] = useState(false)
  const [countIn, setCountIn] = useState(0)
  const recordStartRef = useRef(null)
  const recordTimersRef = useRef([])

  const {
    isPlaying, currentStep, bpm, muted,
    toggle, stop, setBpm, setPattern, toggleMute, ensureCtx,
  } = useRhythmEngine(draft, editorBpm)

  useEffect(() => { setPattern(draft) }, [draft, setPattern])
  useEffect(() => { setBpm(editorBpm) }, [editorBpm, setBpm])

  const toggleCell = useCallback((instId, step) => {
    setDraft((prev) => {
      const row = [...(prev[instId] ?? Array(STEPS_PER_PATTERN).fill(0))]
      row[step] = row[step] ? 0 : 1
      return { ...prev, [instId]: row }
    })
  }, [])

  const clearAll = useCallback(() => {
    if (isPlaying) stop()
    setDraft(emptyPattern())
  }, [isPlaying, stop])

  const stopRecording = useCallback(() => {
    recordTimersRef.current.forEach(clearTimeout)
    recordTimersRef.current = []
    recordStartRef.current = null
    setRecording(false)
    setCountIn(0)
  }, [])

  const playTick = useCallback((freq = 1200) => {
    const ctx = ensureCtx()
    if (!ctx) return
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.connect(g); g.connect(ctx.destination)
    osc.type = 'square'
    osc.frequency.value = freq
    g.gain.setValueAtTime(0.18, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06)
    osc.start()
    osc.stop(ctx.currentTime + 0.08)
  }, [ensureCtx])

  const startRecording = useCallback(() => {
    if (isPlaying) stop()
    const ctx = ensureCtx()
    if (!ctx) return
    setRecording(true)
    const beatMs = 60000 / editorBpm
    const loopBars = 2
    const stepMs = beatMs / 4

    for (let i = 0; i < 4; i++) {
      const t = setTimeout(() => {
        setCountIn(4 - i)
        playTick(i === 0 ? 1600 : 1200)
      }, i * beatMs)
      recordTimersRef.current.push(t)
    }

    const startT = setTimeout(() => {
      recordStartRef.current = performance.now()
      setCountIn(0)
      for (let i = 0; i < 4 * loopBars; i++) {
        const ct = setTimeout(() => playTick(i % 4 === 0 ? 1600 : 1200), i * beatMs)
        recordTimersRef.current.push(ct)
      }
      const endT = setTimeout(() => stopRecording(), loopBars * 8 * stepMs)
      recordTimersRef.current.push(endT)
    }, 4 * beatMs + 50)
    recordTimersRef.current.push(startT)
  }, [editorBpm, ensureCtx, isPlaying, playTick, stop, stopRecording])

  useEffect(() => () => {
    recordTimersRef.current.forEach(clearTimeout)
  }, [])

  const recordTap = useCallback((instId) => {
    if (!recording || !recordStartRef.current) return
    const elapsed = performance.now() - recordStartRef.current
    const stepMs = 60000 / editorBpm / 4
    const step = Math.round(elapsed / stepMs) % STEPS_PER_PATTERN
    setDraft((prev) => {
      const row = [...(prev[instId] ?? Array(STEPS_PER_PATTERN).fill(0))]
      row[step] = 1
      return { ...prev, [instId]: row }
    })
    playTick(800)
  }, [recording, editorBpm, playTick])

  const handleSave = useCallback(async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setSaveError('Ponle un nombre al patrón')
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      const saved = await savePattern({
        id: initial?.id,
        name: trimmed,
        bpm: editorBpm,
        pattern: draft,
      })
      if (isPlaying) stop()
      onSaved(saved)
    } catch (e) {
      setSaveError(e.message || 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }, [name, editorBpm, draft, initial?.id, isPlaying, stop, onSaved])

  return (
    <div className="px-4 py-4 space-y-5 pb-32">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre del patrón"
        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-red-500"
      />

      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Tempo</p>
          <span className="text-white font-black text-lg tabular-nums">{bpm} BPM</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditorBpm(Math.max(MIN_BPM, editorBpm - 5))}
            className="w-10 h-10 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white font-bold text-lg shrink-0"
          >−</button>
          <input
            type="range"
            min={MIN_BPM}
            max={MAX_BPM}
            value={editorBpm}
            onChange={(e) => setEditorBpm(Number(e.target.value))}
            className="flex-1 accent-red-500"
          />
          <button
            type="button"
            onClick={() => setEditorBpm(Math.min(MAX_BPM, editorBpm + 5))}
            className="w-10 h-10 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white font-bold text-lg shrink-0"
          >+</button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Pasos</p>
          <button
            type="button"
            onClick={toggle}
            disabled={recording}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
              isPlaying
                ? 'bg-zinc-800 text-white'
                : 'bg-red-600 hover:bg-red-500 text-white disabled:opacity-40'
            }`}
          >
            {isPlaying ? <><Pause size={12} /> Parar</> : <><Play size={12} fill="currentColor" /> Play</>}
          </button>
        </div>

        <div className="space-y-1.5">
          {INSTRUMENTS.map((inst) => {
            const row = draft[inst.id] ?? Array(STEPS_PER_PATTERN).fill(0)
            const isMuted = muted[inst.id]
            return (
              <div key={inst.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleMute(inst.id)}
                  className={`w-14 h-10 shrink-0 text-[10px] font-bold rounded-lg border transition-colors ${
                    isMuted
                      ? 'border-zinc-700 bg-zinc-800 text-zinc-600'
                      : 'border-red-500/50 bg-red-500/10 text-red-400'
                  }`}
                >
                  {isMuted ? <VolumeX size={13} className="mx-auto" /> : inst.label.slice(0, 5)}
                </button>
                <div className="flex-1 grid gap-0.5" style={{ gridTemplateColumns: `repeat(${STEPS_PER_PATTERN}, 1fr)` }}>
                  {row.map((hit, i) => {
                    const isCurrent = i === currentStep && isPlaying
                    const beatMark = i % 4 === 0
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleCell(inst.id, i)}
                        className={`h-10 rounded-sm transition-colors ${
                          hit
                            ? isCurrent ? 'bg-red-400' : 'bg-red-500/70 hover:bg-red-500'
                            : isCurrent
                              ? 'bg-zinc-600'
                              : beatMark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-900 hover:bg-zinc-800'
                        }`}
                        aria-label={`${inst.label} paso ${i + 1}`}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white text-sm font-bold">Grabar tocando</p>
            <p className="text-zinc-500 text-[11px]">Tappea los instrumentos al ritmo del metrónomo</p>
          </div>
          {!recording ? (
            <button
              type="button"
              onClick={startRecording}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-2 rounded-lg"
            >
              <Circle size={12} fill="currentColor" /> Grabar
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-1.5 bg-zinc-800 text-white text-xs font-bold px-3 py-2 rounded-lg"
            >
              <Square size={12} fill="currentColor" /> Parar
            </button>
          )}
        </div>

        {recording && countIn > 0 && (
          <div className="text-center py-4">
            <span className="text-red-400 text-4xl font-black tabular-nums">{countIn}</span>
            <p className="text-zinc-500 text-xs mt-1">Preparándote…</p>
          </div>
        )}

        {recording && countIn === 0 && (
          <>
            <div className="text-center">
              <span className="text-red-400 text-xs font-bold animate-pulse">● GRABANDO</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {INSTRUMENTS.map((inst) => (
                <button
                  key={inst.id}
                  type="button"
                  onClick={() => recordTap(inst.id)}
                  className="bg-red-500/20 hover:bg-red-500/40 active:bg-red-500/60 border border-red-500/50 text-red-300 text-sm font-bold py-8 rounded-xl transition-colors select-none"
                >
                  {inst.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {saveError && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
          <AlertCircle size={14} /> {saveError}
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/95 border-t border-zinc-800 px-4 py-3 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold py-3 rounded-xl"
        >
          Volver
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-bold px-4 py-3 rounded-xl"
          title="Limpiar"
        >
          <Eraser size={15} />
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-bold py-3 rounded-xl"
        >
          <Save size={15} /> {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function PatternsScreen({ onBack, onOpenBlogPost }) {
  const [view, setView] = useState('library')
  const [editing, setEditing] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listPatterns()
      setItems(data)
    } catch (e) {
      setError(e.message || 'Error cargando patrones')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const handleNew = () => { setEditing(null); setView('editor') }
  const handleEdit = (it) => { setEditing(it); setView('editor') }
  const handleDuplicate = (it) => {
    setEditing({ ...it, id: undefined, name: `${it.name} (copia)` })
    setView('editor')
  }
  const handleDelete = async (id) => {
    try {
      await deletePattern(id)
      setItems((prev) => prev.filter((p) => p.id !== id))
    } catch (e) {
      setError(e.message || 'No se pudo borrar')
    }
  }
  const handleSaved = () => {
    setView('library')
    setEditing(null)
    refresh()
  }
  const handleCancel = () => {
    setView('library')
    setEditing(null)
  }
  const handleUseAsBase = (base) => {
    setEditing({ id: undefined, name: base.name, bpm: base.bpm, pattern: base.pattern })
    setView('editor')
  }

  return (
    <div className="min-h-full bg-zinc-950">
      <div className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 px-3 py-2 flex items-center gap-2">
        <button
          type="button"
          onClick={view === 'editor' ? handleCancel : onBack}
          className="p-1.5 text-zinc-400 hover:text-white"
          aria-label="Volver"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <Music2 size={16} className="text-red-400" />
          <h1 className="text-white text-sm font-black">
            {view === 'editor' ? (editing?.id ? 'Editar patrón' : 'Nuevo patrón') : 'Patrones'}
          </h1>
        </div>
      </div>

      {view === 'library' && (
        <Library
          items={items}
          loading={loading}
          error={error}
          onNew={handleNew}
          onEdit={handleEdit}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onUseAsBase={handleUseAsBase}
          onOpenBlogPost={onOpenBlogPost}
        />
      )}

      {view === 'editor' && (
        <Editor
          initial={editing}
          onCancel={handleCancel}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}

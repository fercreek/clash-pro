import { useState, useEffect, useCallback, useRef } from 'react'
import {
  ChevronLeft, Plus, Trash2, Edit3, Copy, Play, Pause, Save,
  Eraser, Music2, VolumeX, Circle, Square, AlertCircle, BookOpen, Sparkles,
} from 'lucide-react'
import {
  INSTRUMENTS, MIN_BPM, MAX_BPM, DEFAULT_BPM, STEPS_PER_PATTERN,
  emptyPattern, REFERENCE_PATTERNS,
} from '../data/rhythmPatterns'
import { useRhythmEngine } from '../hooks/useRhythmEngine'
import { listPatterns, savePattern, deletePattern } from '../lib/customPatterns'
import { getCtx } from '../audio/ctx'
import { loadSamples } from '../audio/sampleCache'

function MiniGrid({ pattern, currentStep = -1, isPlaying = false, compact = false }) {
  const rowH = compact ? 'h-1.5' : 'h-2.5'
  return (
    <div className="space-y-1">
      {INSTRUMENTS.map((inst) => (
        <div key={inst.id} className="flex items-center gap-1.5">
          {!compact && (
            <span className="w-14 shrink-0 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              {inst.label.slice(0, 6)}
            </span>
          )}
          <div className="flex-1 flex gap-[2px]">
            {(pattern?.[inst.id] ?? Array(STEPS_PER_PATTERN).fill(0)).map((hit, i) => {
              const isBeat = i % 4 === 0
              const isCur = i === currentStep && isPlaying
              return (
                <div
                  key={i}
                  className={`flex-1 ${rowH} rounded-[2px] transition-colors ${
                    hit
                      ? isCur ? 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]' : 'bg-red-500'
                      : isCur
                        ? 'bg-zinc-600'
                        : isBeat ? 'bg-zinc-800' : 'bg-zinc-900'
                  }`}
                />
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function RefPatternCard({ data, onUseAsBase, onOpenBlogPost }) {
  const { isPlaying, currentStep, toggle } = useRhythmEngine(data.pattern, data.bpm)

  return (
    <div className={`group relative bg-gradient-to-br from-zinc-900 to-zinc-900/60 border rounded-2xl p-4 transition-all ${
      isPlaying ? 'border-red-500/50 shadow-[0_0_0_1px_rgba(239,68,68,0.3)]' : 'border-zinc-800 hover:border-zinc-700'
    }`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white font-black text-base leading-tight">{data.label}</h3>
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 uppercase tracking-widest border border-red-500/20 shrink-0">
              Ref
            </span>
          </div>
          <p className="text-zinc-400 text-xs leading-relaxed">{data.description}</p>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <span className="text-white font-black text-lg tabular-nums leading-none">{data.bpm}</span>
          <span className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest">bpm</span>
        </div>
      </div>

      <div className="bg-black/40 rounded-lg p-2.5 mb-3 border border-zinc-900">
        <MiniGrid pattern={data.pattern} currentStep={currentStep} isPlaying={isPlaying} />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggle}
          className={`flex items-center justify-center gap-1.5 text-xs font-bold w-11 h-11 rounded-xl transition-all shrink-0 ${
            isPlaying
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
              : 'bg-zinc-800 hover:bg-zinc-700 text-white'
          }`}
          aria-label={isPlaying ? 'Parar' : 'Preview'}
        >
          {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
        </button>

        <button
          type="button"
          onClick={() => onUseAsBase({ name: data.label, bpm: data.bpm, pattern: data.pattern })}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold h-11 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-colors"
        >
          <Copy size={14} /> Usar como base
        </button>

        {data.blogSlug && onOpenBlogPost && (
          <button
            type="button"
            onClick={() => onOpenBlogPost(data.blogSlug)}
            className="flex items-center justify-center w-11 h-11 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors shrink-0"
            title="Leer artículo"
            aria-label="Leer artículo"
          >
            <BookOpen size={16} />
          </button>
        )}
      </div>

      {data.credit && (
        <p className="text-zinc-600 text-[10px] leading-snug mt-3 pt-3 border-t border-zinc-900">
          {data.credit}
        </p>
      )}
    </div>
  )
}

function CustomCard({ item, onEdit, onDuplicate, onDelete, confirmOpen, onToggleConfirm }) {
  return (
    <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/60 border border-zinc-800 rounded-2xl p-4 hover:border-zinc-700 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-white font-black text-base truncate">{item.name}</h3>
          <p className="text-zinc-500 text-[11px] font-semibold tabular-nums">{item.bpm} BPM</p>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            title="Editar"
            aria-label="Editar"
          >
            <Edit3 size={15} />
          </button>
          <button
            type="button"
            onClick={() => onDuplicate(item)}
            className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            title="Duplicar"
            aria-label="Duplicar"
          >
            <Copy size={15} />
          </button>
          <button
            type="button"
            onClick={onToggleConfirm}
            className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Borrar"
            aria-label="Borrar"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="bg-black/40 rounded-lg p-2.5 border border-zinc-900">
        <MiniGrid pattern={item.pattern} />
      </div>

      {confirmOpen && (
        <div className="mt-3 flex items-center justify-between gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
          <span className="text-red-300 text-xs font-semibold truncate">¿Borrar "{item.name}"?</span>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={onToggleConfirm}
              className="text-zinc-400 hover:text-white text-xs font-bold px-2 py-1"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onDelete(item.id)}
              className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
            >
              Borrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Library({ items, loading, error, onNew, onEdit, onDuplicate, onDelete, onUseAsBase, onOpenBlogPost }) {
  const [confirmId, setConfirmId] = useState(null)
  const [tab, setTab] = useState('ref')

  return (
    <div className="px-4 py-5 space-y-5 pb-8">
      <div className="bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent border border-red-500/20 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
            <Sparkles size={18} className="text-red-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-white font-black text-base leading-tight mb-0.5">Secuenciador de ritmos</h2>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Aprende los patrones fundamentales o crea los tuyos. Toca play en cualquier referencia para escucharla.
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
        <button
          type="button"
          onClick={() => setTab('ref')}
          className={`flex-1 text-xs font-bold py-2.5 rounded-lg transition-all ${
            tab === 'ref' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Referencia
        </button>
        <button
          type="button"
          onClick={() => setTab('mine')}
          className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 rounded-lg transition-all ${
            tab === 'mine' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Mis patrones
          {items.length > 0 && (
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 tabular-nums">
              {items.length}
            </span>
          )}
        </button>
      </div>

      {tab === 'ref' && (
        <div className="space-y-3">
          {REFERENCE_PATTERNS.map((ref) => (
            <RefPatternCard
              key={ref.id}
              data={ref}
              onUseAsBase={onUseAsBase}
              onOpenBlogPost={onOpenBlogPost}
            />
          ))}
        </div>
      )}

      {tab === 'mine' && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={onNew}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 rounded-2xl transition-colors shadow-lg shadow-red-500/20"
          >
            <Plus size={18} /> Nuevo patrón
          </button>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2.5">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {loading && (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && items.length === 0 && !error && (
            <div className="text-center py-12 px-6 bg-zinc-900/50 border border-dashed border-zinc-800 rounded-2xl">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-zinc-800/50 flex items-center justify-center">
                <Music2 size={24} className="text-zinc-600" />
              </div>
              <p className="text-zinc-300 font-bold text-sm mb-1">Aún no tienes patrones</p>
              <p className="text-zinc-500 text-xs leading-relaxed max-w-xs mx-auto">
                Crea uno desde cero o toma un patrón de referencia como base.
              </p>
            </div>
          )}

          {items.map((it) => (
            <CustomCard
              key={it.id}
              item={it}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              confirmOpen={confirmId === it.id}
              onToggleConfirm={() => setConfirmId(confirmId === it.id ? null : it.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

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
    <div className="px-4 py-5 space-y-5 pb-32">
      <div>
        <label className="block text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-1.5">Nombre</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Mi tumbao favorito"
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-3 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
        />
      </div>

      <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Tempo</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-white font-black text-3xl tabular-nums leading-none">{bpm}</span>
              <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">bpm</span>
            </div>
          </div>
          <button
            type="button"
            onClick={toggle}
            disabled={recording}
            className={`flex items-center gap-2 text-sm font-bold px-5 h-11 rounded-xl transition-all ${
              isPlaying
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                : 'bg-red-600 hover:bg-red-500 text-white disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            {isPlaying ? <><Pause size={14} fill="currentColor" /> Parar</> : <><Play size={14} fill="currentColor" /> Play</>}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditorBpm(Math.max(MIN_BPM, editorBpm - 5))}
            className="w-10 h-10 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 rounded-lg text-white font-bold text-xl shrink-0"
            aria-label="Bajar BPM"
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
            className="w-10 h-10 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 rounded-lg text-white font-bold text-xl shrink-0"
            aria-label="Subir BPM"
          >+</button>
        </div>
      </div>

      <div>
        <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-2">Pasos</p>
        <div className="bg-black/40 border border-zinc-900 rounded-2xl p-3 space-y-1.5">
          {INSTRUMENTS.map((inst) => {
            const row = draft[inst.id] ?? Array(STEPS_PER_PATTERN).fill(0)
            const isMuted = muted[inst.id]
            return (
              <div key={inst.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleMute(inst.id)}
                  className={`w-14 h-10 shrink-0 text-[10px] font-black rounded-lg border transition-all ${
                    isMuted
                      ? 'border-zinc-800 bg-zinc-900 text-zinc-600'
                      : 'border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                  }`}
                  aria-label={`${isMuted ? 'Unmute' : 'Mute'} ${inst.label}`}
                >
                  {isMuted ? <VolumeX size={13} className="mx-auto" /> : inst.label.slice(0, 5).toUpperCase()}
                </button>
                <div className="flex-1 grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${STEPS_PER_PATTERN}, 1fr)` }}>
                  {row.map((hit, i) => {
                    const isCurrent = i === currentStep && isPlaying
                    const beatMark = i % 4 === 0
                    const groupEnd = (i + 1) % 4 === 0 && i !== STEPS_PER_PATTERN - 1
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleCell(inst.id, i)}
                        className={`h-10 rounded-[4px] transition-all ${groupEnd ? 'mr-0.5' : ''} ${
                          hit
                            ? isCurrent
                              ? 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.6)]'
                              : 'bg-red-500 hover:bg-red-400'
                            : isCurrent
                              ? 'bg-zinc-600'
                              : beatMark
                                ? 'bg-zinc-800 hover:bg-zinc-700'
                                : 'bg-zinc-900 hover:bg-zinc-800'
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

      <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/60 border border-zinc-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-white text-sm font-black">Grabar tocando</p>
            <p className="text-zinc-500 text-[11px] leading-snug">Tappea los instrumentos al ritmo del metrónomo</p>
          </div>
          {!recording ? (
            <button
              type="button"
              onClick={startRecording}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3.5 h-10 rounded-xl shrink-0"
            >
              <Circle size={11} fill="currentColor" /> Grabar
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold px-3.5 h-10 rounded-xl shrink-0"
            >
              <Square size={11} fill="currentColor" /> Parar
            </button>
          )}
        </div>

        {recording && countIn > 0 && (
          <div className="text-center py-5">
            <span className="text-red-400 text-5xl font-black tabular-nums leading-none">{countIn}</span>
            <p className="text-zinc-500 text-xs mt-2 font-semibold">Preparándote…</p>
          </div>
        )}

        {recording && countIn === 0 && (
          <>
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 text-red-400 text-xs font-black tracking-widest">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                GRABANDO
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {INSTRUMENTS.map((inst) => (
                <button
                  key={inst.id}
                  type="button"
                  onClick={() => recordTap(inst.id)}
                  className="bg-red-500/20 hover:bg-red-500/40 active:bg-red-500/60 border border-red-500/50 text-red-300 text-[11px] font-black py-8 rounded-xl transition-colors select-none uppercase"
                >
                  {inst.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {saveError && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2.5">
          <AlertCircle size={14} /> {saveError}
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/95 backdrop-blur-sm border-t border-zinc-800 px-4 py-3 flex gap-2 shadow-[0_-8px_24px_rgba(0,0,0,0.4)]">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold py-3 rounded-xl transition-colors"
        >
          Volver
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-bold w-12 py-3 rounded-xl transition-colors"
          title="Limpiar"
          aria-label="Limpiar"
        >
          <Eraser size={15} />
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-bold py-3 rounded-xl transition-colors shadow-lg shadow-red-500/20"
        >
          <Save size={15} /> {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}

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
  useEffect(() => {
    getCtx()
    loadSamples()
  }, [])

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
      <div className="sticky top-0 z-10 bg-zinc-950/85 backdrop-blur-md border-b border-zinc-800 px-3 py-3 flex items-center gap-2">
        <button
          type="button"
          onClick={view === 'editor' ? handleCancel : onBack}
          className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          aria-label="Volver"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
            <Music2 size={14} className="text-red-400" />
          </div>
          <h1 className="text-white text-sm font-black truncate">
            {view === 'editor' ? (editing?.id ? 'Editar patrón' : 'Nuevo patrón') : 'Patrones de salsa'}
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

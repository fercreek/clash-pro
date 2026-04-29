import { useState, useEffect, useMemo, useRef } from 'react'
import { Plus, Trash2, Swords, Clock, Lock, Dumbbell, Trophy, ExternalLink, Users, Pencil, Table2 } from 'lucide-react'
import { usePlan } from '../hooks/usePlan'
import { useMode } from '../hooks/useMode'
import { useAuth } from '../hooks/useAuth'
import { useRoster } from '../hooks/useRoster'
import { canSelectTournamentMode, COMPETITION_MODE } from '../lib/featurePolicy'
import PlansComparisonModal from './PlansComparisonModal'
import RosterPicker from './RosterPicker'
import BulkNameInput from './BulkNameInput'
import DancerProfileModal from './DancerProfileModal'
import { AV_BG } from '../utils/avatarColors'
import { dedupeRosterByName, pickCanonicalRow, normalizeDancerNameKey } from '../lib/rosterCanonical'

const BATTLE_ROUND_LABELS = ['Mínimo', 'Estándar', 'Extendido', 'Completo']

const LEVEL_BADGE = {
  beginner: { short: 'B', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  intermedio: { short: 'I', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  avanzado: { short: 'A', cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
}

export default function SetupScreen({
  competitors,
  setCompetitors,
  roundTime,
  setRoundTime,
  battleRoundCount,
  setBattleRoundCount,
  onStart,
  onResume,
  isResumingPractice = false,
  sessionStats = null,
  onOpenPromoMenu,
  onOpenDancersTable = null,
}) {
  const { user } = useAuth()
  const { isFree, maxCompetitors } = usePlan()
  const { mode, setMode } = useMode()
  const canTournament = canSelectTournamentMode(isFree)

  const [inputValue, setInputValue] = useState('')
  const [plansOpen, setPlansOpen] = useState(false)
  const [highlightName, setHighlightName] = useState('')
  const [profileModal, setProfileModal] = useState(null)
  const highlightTimerRef = useRef(null)

  const isTournament = mode === COMPETITION_MODE.tournament
  const { roster, addDancer, updateDancer, loading: rosterLoading } = useRoster()

  useEffect(() => {
    if (!user?.id || rosterLoading || competitors.length === 0) return
    const inRoster = new Set(roster.map((r) => r.name.toLowerCase()))
    const missing = competitors.filter((n) => !inRoster.has(n.toLowerCase()))
    if (missing.length === 0) return
    let cancelled = false
    void (async () => {
      for (const n of missing) {
        if (cancelled) return
        await addDancer(n)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id, rosterLoading, competitors.join('\x1e'), addDancer])

  const rosterByLower = useMemo(() => {
    const m = new Map()
    for (const r of roster) {
      if (r.deleted_at) continue
      const k = normalizeDancerNameKey(r.name)
      if (!k) continue
      const cur = m.get(k)
      m.set(k, cur ? pickCanonicalRow(cur, r, user?.id) : r)
    }
    return m
  }, [roster, user?.id])

  const rosterVisible = useMemo(
    () => dedupeRosterByName(roster.filter((r) => r.is_active !== false && !r.deleted_at), user?.id),
    [roster, user?.id],
  )

  const repeatCountsByLower = useMemo(() => {
    const acc = {}
    for (const r of roster) {
      const k = normalizeDancerNameKey(r.name)
      if (!k) continue
      acc[k] = (acc[k] ?? 0) + (r.repeat_count ?? 0)
    }
    return acc
  }, [roster])

  const repeatCounts = useMemo(() => {
    const out = {}
    for (const n of competitors) {
      out[n] = repeatCountsByLower[normalizeDancerNameKey(n)] ?? 0
    }
    return out
  }, [competitors, repeatCountsByLower])

  useEffect(() => {
    if (!canTournament && mode === COMPETITION_MODE.tournament) {
      setMode(COMPETITION_MODE.practice)
    }
  }, [canTournament, mode, setMode])

  useEffect(() => () => clearTimeout(highlightTimerRef.current), [])

  const existingLower = useMemo(
    () => new Set(competitors.map((n) => n.toLowerCase())),
    [competitors]
  )

  const flashHighlight = (name) => {
    setHighlightName(name)
    clearTimeout(highlightTimerRef.current)
    highlightTimerRef.current = setTimeout(() => setHighlightName(''), 1400)
  }

  const handleAdd = () => {
    const name = inputValue.trim()
    if (!name || existingLower.has(name.toLowerCase())) return
    setCompetitors((prev) => [...prev, name])
    setInputValue('')
    flashHighlight(name)
  }

  const handleRemove = (name) => {
    setCompetitors((prev) => prev.filter((c) => c !== name))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAdd()
  }

  const handleToggleRoster = (name) => {
    setCompetitors((prev) => {
      const lower = name.toLowerCase()
      if (prev.some((n) => n.toLowerCase() === lower)) {
        return prev.filter((n) => n.toLowerCase() !== lower)
      }
      flashHighlight(name)
      return [...prev, name]
    })
  }

  const handleAddNewDancer = async (name) => {
    const created = await addDancer(name)
    const finalName = created?.name ?? name
    if (!existingLower.has(finalName.toLowerCase())) {
      setCompetitors((prev) => [...prev, finalName])
      flashHighlight(finalName)
    }
  }

  const handleBulkAdd = (names) => {
    setCompetitors((prev) => {
      const seen = new Set(prev.map((n) => n.toLowerCase()))
      const out = [...prev]
      for (const n of names) {
        const key = n.toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        out.push(n)
      }
      return out
    })
  }

  const handleRenamedInSession = (oldName, newName) => {
    if (!oldName || !newName || oldName === newName) return
    setCompetitors((prev) =>
      prev.map((n) => (n.toLowerCase() === oldName.toLowerCase() ? newName : n))
    )
  }

  const atLimit = isFree && competitors.length >= maxCompetitors
  const canStart = competitors.length >= 2

  return (
    <div className="min-h-full bg-zinc-950 text-white">
      <div className="max-w-md mx-auto px-5 pt-5 pb-28 flex flex-col gap-6">

        <div>
          <p className="text-[10px] font-black tracking-[0.25em] uppercase text-zinc-500 mb-1">
            {isTournament ? 'Competición' : 'Práctica libre'}
          </p>
          <h1 className="text-[28px] font-black tracking-tight text-white leading-tight">
            {isTournament ? 'Nuevo torneo' : isResumingPractice ? 'Sesión activa' : 'Nueva sesión'}
          </h1>
        </div>

        {/* Session stats banner — shown when resuming a practice session */}
        {isResumingPractice && sessionStats && Object.keys(sessionStats).length > 0 && (
          <section className="flex flex-col gap-2">
            <div className="flex items-center gap-3 mb-1">
              <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em]">Esta sesión</p>
              <div className="flex-1 h-px bg-zinc-900" />
            </div>
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-3 flex flex-wrap gap-x-4 gap-y-1">
              {Object.entries(sessionStats)
                .sort((a, b) => b[1] - a[1])
                .map(([name, count]) => (
                  <div key={name} className="flex items-center gap-1.5 min-w-0">
                    <span className="text-sm text-white font-medium truncate max-w-[100px]">{name}</span>
                    <span className="text-xs font-black text-red-400 tabular-nums">{count}</span>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Mode selector */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center gap-3 mb-1">
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em]">Modo</p>
            <div className="flex-1 h-px bg-zinc-900" />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode(COMPETITION_MODE.practice)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                !isTournament
                  ? 'bg-zinc-900 border border-zinc-500 ring-1 ring-zinc-400/30 text-white scale-[1.02]'
                  : 'bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
              }`}
            >
              <Dumbbell size={15} />
              Práctica
            </button>
            <button
              type="button"
              disabled={!canTournament}
              onClick={() => setMode(COMPETITION_MODE.tournament)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                isTournament
                  ? 'bg-amber-500/10 border border-amber-500/40 ring-1 ring-amber-400/30 text-amber-300 scale-[1.02]'
                  : 'bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
              } ${!canTournament ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <Trophy size={15} />
              Competición
            </button>
          </div>

          {!canTournament && (
            <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Lock size={13} className="text-amber-400 shrink-0" />
                <p className="text-amber-200 text-xs">Requiere plan Pro</p>
              </div>
              <button
                type="button"
                onClick={() => setPlansOpen(true)}
                className="flex items-center gap-1 text-amber-400 text-xs font-bold hover:text-amber-300"
              >
                Ver planes <ExternalLink size={11} />
              </button>
            </div>
          )}

          {!canTournament ? null : isTournament ? (
            <p className="text-zinc-500 text-xs px-0.5">Resultados, ranking y compartir al finalizar.</p>
          ) : (
            <p className="text-zinc-500 text-xs px-0.5">Rondas con métricas. Impar = uno repite sin descansar.</p>
          )}
        </section>

        {/* Round time */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center gap-3 mb-1">
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em]">Tiempo por ronda</p>
            <div className="flex-1 h-px bg-zinc-900" />
          </div>
          <div className="flex gap-2">
            {[30, 40].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setRoundTime(t)}
                className={`flex-1 py-3 rounded-xl font-black text-lg transition-all duration-200 ${
                  roundTime === t
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/40 ring-2 ring-red-400/30 scale-[1.02]'
                    : 'bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                }`}
              >
                {t}s
              </button>
            ))}
          </div>
        </section>

        {isTournament && (
          <section className="flex flex-col gap-2">
            <div className="flex items-center gap-3 mb-1">
              <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em]">Rondas por batalla</p>
              <div className="flex-1 h-px bg-zinc-900" />
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((n, idx) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setBattleRoundCount(n)}
                  className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 rounded-xl transition-all duration-200 ${
                    battleRoundCount === n
                      ? 'bg-amber-500/90 text-zinc-950 shadow-lg shadow-amber-500/30 ring-2 ring-amber-400/30 scale-[1.02]'
                      : 'bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                  }`}
                >
                  <span className="font-black text-lg leading-none">{n}</span>
                  <span className={`text-[9px] font-bold leading-none ${battleRoundCount === n ? 'text-zinc-800' : 'text-zinc-600'}`}>
                    {BATTLE_ROUND_LABELS[idx]}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-zinc-600 text-[11px] px-0.5">Cada competidor sale por turno (1.º / 2.º) hasta completar las rondas.</p>
          </section>
        )}

        <section className="flex flex-col gap-2">
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <div className="flex items-center gap-2">
              <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em]">Bailarines</p>
              {competitors.length > 0 && (
                <span
                  key={competitors.length}
                  className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500/15 border border-red-500/25 text-red-400 font-black text-[10px] animate-[pulse_0.4s_ease-out]"
                >
                  {competitors.length}
                </span>
              )}
            </div>
            <div className="flex-1 h-px bg-zinc-900 min-w-[4rem]" />
            {competitors.length > 0 && (
              <span className="text-zinc-600 text-[10px] flex items-center gap-1">
                <Users size={10} />
                {competitors.length} en lista
              </span>
            )}
            {onOpenDancersTable && (
              <button
                type="button"
                onClick={onOpenDancersTable}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900/80 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide text-zinc-400 hover:text-amber-400 hover:border-amber-500/30 transition-colors shrink-0"
              >
                <Table2 size={12} strokeWidth={2.25} className="text-red-400/90" />
                Tabla /dancers
              </button>
            )}
          </div>

          <p className="text-zinc-600 text-[10px] leading-relaxed -mt-0.5 mb-1">
            Misma base que <span className="text-zinc-500">/dancers</span> (importar = agregar ahí o pegar lista abajo). Duplicados por nombre se muestran una vez aquí; en la tabla puedes fusionarlos o borrar filas de la base.
          </p>

          <div className="flex flex-col gap-2 mb-1">
            <p className="text-zinc-500 text-[11px] uppercase tracking-wider font-bold">Roster</p>
            <RosterPicker
              roster={rosterVisible}
              selected={competitors}
              onToggle={handleToggleRoster}
              onAdd={handleAddNewDancer}
              onEditMember={(c) => setProfileModal({ sessionName: c.name, rosterRecord: c })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-zinc-500 text-[11px] uppercase tracking-wider font-bold">Pegar lista</p>
            <BulkNameInput
              onAdd={handleBulkAdd}
              existingNames={competitors}
              disabled={atLimit}
            />
          </div>

          {isTournament && (
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nombre del bailarín..."
                disabled={atLimit}
                className="flex-1 bg-zinc-900/60 border border-zinc-800 focus:border-zinc-600 focus:ring-2 focus:ring-zinc-600/20 rounded-2xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none transition-all disabled:opacity-40"
              />
              <button
                type="button"
                onClick={handleAdd}
                disabled={!inputValue.trim() || atLimit}
                className="bg-red-500 hover:bg-red-400 disabled:opacity-40 disabled:cursor-not-allowed px-4 rounded-2xl transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
          )}

          {atLimit && (
            <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Lock size={13} className="text-amber-400 shrink-0" />
                <p className="text-amber-200 text-xs">Límite plan Gratis ({maxCompetitors})</p>
              </div>
              <button
                type="button"
                onClick={() => setPlansOpen(true)}
                className="flex items-center gap-1 text-amber-400 text-xs font-bold hover:text-amber-300"
              >
                Pro <ExternalLink size={11} />
              </button>
            </div>
          )}

          {competitors.length > 0 && (
            <ul className="flex flex-col max-h-[min(24rem,55vh)] overflow-y-auto rounded-xl border border-zinc-800/80 bg-zinc-950/40">
              {competitors.map((name, i) => {
                const rec = rosterByLower.get(name.toLowerCase())
                const lb = rec?.level ? LEVEL_BADGE[rec.level] : null
                return (
                  <li
                    key={name}
                    className={`flex items-center gap-3 px-3 py-3 transition-all duration-500 ${
                      highlightName === name
                        ? 'bg-red-500/8 ring-inset ring-1 ring-red-500/25'
                        : i % 2 === 0 ? 'bg-zinc-900/35' : 'bg-zinc-900/15'
                    } ${i < competitors.length - 1 ? 'border-b border-zinc-800/60' : ''}`}
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 transition-all duration-300 ${highlightName === name ? 'scale-105 ring-2 ring-white/15' : ''}`}
                      style={{ background: AV_BG[i % AV_BG.length] }}
                    >
                      {name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-white font-semibold text-sm truncate">{name}</span>
                        {lb && (
                          <span className={`shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded border ${lb.cls}`}>
                            {lb.short}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
                        {rec ? (
                          <>
                            {(rec.frequency_count ?? 0) > 0 || (rec.repeat_count ?? 0) > 0 ? (
                              <>
                                <span className="text-zinc-400 tabular-nums">{rec.frequency_count ?? 0} rondas</span>
                                {(rec.repeat_count ?? 0) > 0 && (
                                  <span className="text-zinc-600"> · {rec.repeat_count} rep.</span>
                                )}
                              </>
                            ) : (
                              <span>Perfil en roster · sin rondas aún</span>
                            )}
                          </>
                        ) : (
                          <span className="text-amber-500/80">Sin perfil en roster — edita para crear</span>
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProfileModal({ sessionName: name, rosterRecord: rec ?? null })}
                      className="shrink-0 p-2 rounded-lg text-zinc-500 hover:text-amber-400 hover:bg-zinc-800/80 transition-colors"
                      title="Editar perfil"
                    >
                      <Pencil size={16} strokeWidth={2} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(name)}
                      className="shrink-0 text-zinc-600 hover:text-red-500 transition-colors p-2 -mr-1"
                      title="Quitar de la lista"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {isTournament && competitors.length % 2 !== 0 && competitors.length > 0 && (
            <p className="text-amber-400 text-xs px-0.5">
              Número impar — un competidor descansará por ronda (BYE).
            </p>
          )}
          {!isTournament && competitors.length % 2 !== 0 && competitors.length > 3 && (
            <p className="text-zinc-500 text-xs px-0.5">
              Impar — un bailarín repetirá por ronda (no descansa).
            </p>
          )}
        </section>

        <p className="text-zinc-700 text-xs text-center">Made with 🔥 &amp; ❤️ for Salsanamá</p>

      </div>

      <div className="sticky bottom-0 z-20 px-5 pb-5 pt-4 bg-gradient-to-t from-zinc-950 via-zinc-950/98 to-transparent">
        <div className="max-w-md mx-auto">
          {isResumingPractice ? (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onResume?.(competitors, roundTime)}
                disabled={!canStart}
                className="w-full flex items-center justify-center gap-2 py-4 bg-red-500 hover:bg-red-400 active:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl font-black text-base tracking-tight transition-all shadow-xl shadow-red-500/30"
              >
                <Swords size={18} strokeWidth={2.5} />
                REANUDAR SESIÓN
              </button>
              <button
                type="button"
                onClick={() => onStart(competitors, roundTime, repeatCounts)}
                disabled={!canStart}
                className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl font-bold text-sm text-zinc-400 tracking-tight transition-colors"
              >
                Nueva sesión (descarta historial)
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() =>
                onStart(competitors, roundTime, repeatCounts, isTournament ? battleRoundCount : undefined)
              }
              disabled={!canStart}
              className="w-full flex items-center justify-center gap-2 py-4 bg-red-500 hover:bg-red-400 active:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl font-black text-base tracking-tight transition-all shadow-xl shadow-red-500/30"
            >
              <Swords size={18} strokeWidth={2.5} />
              {isTournament ? 'GENERAR TORNEO' : 'ARMAR RONDAS'}
            </button>
          )}
        </div>
      </div>

      {plansOpen && (
        <PlansComparisonModal
          onClose={() => setPlansOpen(false)}
          onOpenPromoMenu={onOpenPromoMenu}
        />
      )}

      {profileModal && (
        <DancerProfileModal
          open
          onClose={() => setProfileModal(null)}
          sessionName={profileModal.sessionName}
          rosterRecord={profileModal.rosterRecord}
          updateDancer={updateDancer}
          addDancer={addDancer}
          onRenamedInSession={handleRenamedInSession}
        />
      )}
    </div>
  )
}

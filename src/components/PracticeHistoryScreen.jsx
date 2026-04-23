import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, History, Users, Repeat, Heart } from 'lucide-react'
import { usePracticeSession } from '../hooks/usePracticeSession'
import { AV_BG } from '../utils/avatarColors'

function startOfLocalDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function dayGroupKeyAndLabel(iso) {
  if (!iso) {
    return { key: 'unknown', label: 'Sin fecha' }
  }
  const t = new Date(iso)
  if (Number.isNaN(t.getTime())) {
    return { key: 'unknown', label: 'Sin fecha' }
  }
  const s = startOfLocalDay(t)
  const key = `${s.getFullYear()}-${String(s.getMonth() + 1).padStart(2, '0')}-${String(s.getDate()).padStart(2, '0')}`
  const now = new Date()
  const today = startOfLocalDay(now)
  const diff = Math.floor((today.getTime() - s.getTime()) / 864e5)
  if (diff === 0) return { key, label: 'Hoy' }
  if (diff === 1) return { key, label: 'Ayer' }
  if (diff === 2) return { key, label: 'Anteayer' }
  return { key, label: t.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) }
}

function sessionSortTime(s) {
  const t = s.ended_at || s.created_at
  if (!t) return 0
  const d = new Date(t)
  return Number.isNaN(d.getTime()) ? 0 : d.getTime()
}

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `hace ${days}d`
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

function Avatar({ name, idx }) {
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-black shrink-0"
      style={{ background: AV_BG[idx % AV_BG.length] }}
    >
      {initials}
    </div>
  )
}

export default function PracticeHistoryScreen({ onBack }) {
  const { list } = usePracticeSession()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    list()
      .then((data) => setSessions(data))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false))
  }, [list])

  const sessionsByDay = useMemo(() => {
    const sorted = [...sessions].sort((a, b) => sessionSortTime(b) - sessionSortTime(a))
    const out = []
    for (const s of sorted) {
      const t = s.ended_at || s.created_at
      const { key, label } = dayGroupKeyAndLabel(t)
      const last = out[out.length - 1]
      if (last && last.key === key) {
        last.items.push(s)
      } else {
        out.push({ key, label, items: [s] })
      }
    }
    return out
  }, [sessions])

  if (selected) return <SessionDetail session={selected} onBack={() => setSelected(null)} />

  return (
    <div className="min-h-full bg-zinc-950 text-white">
      <div className="max-w-md mx-auto px-5 pt-5 pb-10 flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="text-zinc-500 hover:text-white p-1 -ml-1"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="text-[10px] font-black tracking-[0.25em] uppercase text-zinc-500">Práctica</p>
            <h1 className="text-[24px] font-black tracking-tight text-white leading-tight">Historial</h1>
          </div>
        </div>

        {loading && <p className="text-zinc-500 text-sm">Cargando…</p>}

        {!loading && sessions.length === 0 && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl px-5 py-10 text-center">
            <History size={28} className="text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400 text-sm">Aún no hay sesiones. Termina tu primera práctica y aparecerá aquí.</p>
          </div>
        )}

        <div className="flex flex-col gap-5">
          {sessionsByDay.map((group) => (
            <section key={group.key} className="flex flex-col gap-2">
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] px-0.5 capitalize">
                {group.label}
              </p>
              <ul className="flex flex-col gap-2">
                {group.items.map((s) => {
                  const comp = Array.isArray(s.competitors) ? s.competitors : []
                  const iters = Array.isArray(s.iterations) ? s.iterations.length : 0
                  const topNames = Object.entries(s.stats?.appearances ?? {})
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => setSelected(s)}
                        className="w-full bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-2xl px-4 py-3 flex flex-col gap-2 text-left transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">
                            {timeAgo(s.ended_at || s.created_at)}
                          </span>
                          <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                            <span className="flex items-center gap-1"><Users size={11} />{comp.length}</span>
                            <span className="flex items-center gap-1"><Repeat size={11} />{iters}</span>
                          </div>
                        </div>
                        {topNames.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            {topNames.map(([name], i) => (
                              <div key={name} className="flex items-center gap-1.5">
                                <Avatar name={name} idx={i} />
                                <span className="text-white text-xs font-medium">{name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

function SessionDetail({ session, onBack }) {
  const comp = Array.isArray(session.competitors) ? session.competitors : []
  const apps = Object.entries(session.stats?.appearances ?? {}).sort((a, b) => b[1] - a[1])
  const pairs = (session.stats?.pairs ?? []).slice(0, 6)
  const iters = Array.isArray(session.iterations) ? session.iterations.length : 0

  return (
    <div className="min-h-full bg-zinc-950 text-white">
      <div className="max-w-md mx-auto px-5 pt-5 pb-10 flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="text-zinc-500 hover:text-white p-1 -ml-1"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="text-[10px] font-black tracking-[0.25em] uppercase text-zinc-500">Sesión</p>
            <h1 className="text-[22px] font-black tracking-tight text-white leading-tight">
              {timeAgo(session.ended_at || session.created_at)}
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl px-4 py-3">
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Bailarines</p>
            <p className="text-white text-2xl font-black">{comp.length}</p>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl px-4 py-3">
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Iteraciones</p>
            <p className="text-white text-2xl font-black">{iters}</p>
          </div>
        </div>

        <section className="flex flex-col gap-2">
          <div className="flex items-center gap-3 mb-1">
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em]">Apariciones</p>
            <div className="flex-1 h-px bg-zinc-900" />
          </div>
          <ul className="flex flex-col">
            {apps.map(([name, count], i) => (
              <li key={name} className={`flex items-center gap-3 py-2.5 ${i < apps.length - 1 ? 'border-b border-zinc-900' : ''}`}>
                <Avatar name={name} idx={i} />
                <span className="flex-1 text-white text-sm font-medium truncate">{name}</span>
                <span className="text-zinc-400 text-sm font-bold">×{count}</span>
              </li>
            ))}
          </ul>
        </section>

        {pairs.length > 0 && (
          <section className="flex flex-col gap-2">
            <div className="flex items-center gap-3 mb-1">
              <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em]">Top pareos</p>
              <div className="flex-1 h-px bg-zinc-900" />
            </div>
            <ul className="flex flex-col gap-1.5">
              {pairs.map(([a, b, n], i) => (
                <li key={`${a}-${b}`} className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2">
                  <Heart size={12} className="text-red-400 shrink-0" />
                  <span className="flex-1 text-white text-xs">
                    <span className="font-bold">{a}</span>
                    <span className="text-zinc-500"> ↔ </span>
                    <span className="font-bold">{b}</span>
                  </span>
                  <span className="text-zinc-400 text-xs font-bold">×{n}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}

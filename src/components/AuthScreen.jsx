import { useState, useRef } from 'react'
import { Timer, Trophy, Music, Smartphone, Zap, BarChart2, Coffee, Sparkles, ArrowRight } from 'lucide-react'
import { LANDING_NEWS } from '../data/landingNews'

const FEATURES = [
  { icon: Zap,        title: 'Bracket automático',     desc: 'Round Robin generado en 1 tap. Sin cálculos.' },
  { icon: Timer,      title: 'Cronómetro profesional', desc: 'Turno A → B → Votación con cuenta regresiva.' },
  { icon: Trophy,     title: 'Ranking en tiempo real', desc: 'Leaderboard live. Sin Excel, sin papel.' },
  { icon: Music,      title: 'Música integrada',       desc: 'Playlists de Salsanamá + Spotify propio.' },
  { icon: Smartphone, title: 'Sin instalación',        desc: 'Funciona en cualquier teléfono. Instálable como app.' },
  { icon: BarChart2,  title: 'Historial de torneos',   desc: 'Historial en la nube. Revisa y comparte después.' },
]

export default function AuthScreen({ onEmailSignIn, onEmailSignUp }) {
  const [mode, setMode] = useState('signin')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const formRef = useRef(null)

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    if (!username.trim()) { setError('Ingresa tu usuario'); return }
    if (!password) { setError('Ingresa tu contraseña'); return }
    setBusy(true)
    try {
      if (mode === 'signin') {
        await onEmailSignIn(username, password)
      } else {
        await onEmailSignUp(username, password)
        setInfo('¡Cuenta creada! Iniciando sesión…')
        await onEmailSignIn(username, password)
      }
    } catch (err) {
      setError(err.message ?? 'Error al autenticar')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col overflow-x-hidden">

      {/* ── HERO ── */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-14 pb-10 text-center">
        {/* glow blob */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[480px] h-[480px] rounded-full bg-red-500/10 blur-[100px]" />
        </div>

        <span className="relative z-10 inline-flex items-center gap-1.5 text-[10px] font-black tracking-[0.3em] text-red-400 uppercase mb-5 px-3 py-1 rounded-full border border-red-500/20 bg-red-500/8">
          <Sparkles size={11} /> Para grupos de salsa 1vs1
        </span>

        <h1 className="relative z-10 text-[56px] leading-none font-black tracking-tight">
          CLASH<span className="text-red-500">PRO</span>
        </h1>

        <p className="relative z-10 text-zinc-400 text-lg mt-3 max-w-[260px] leading-snug">
          Torneos sin papel.<br />Brackets en segundos.
        </p>

        <button
          onClick={scrollToForm}
          className="relative z-10 mt-7 inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-black px-7 py-3.5 rounded-2xl text-sm transition-colors shadow-lg shadow-red-500/30"
        >
          Empezar gratis <ArrowRight size={16} />
        </button>

        <p className="relative z-10 mt-3 text-zinc-600 text-[11px]">Sin tarjeta · Gratis para siempre</p>
      </section>

      {/* ── FEATURES ── */}
      <section className="px-4 pb-10">
        <div className="grid grid-cols-2 gap-2.5 max-w-md mx-auto">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex flex-col gap-2 bg-zinc-900/80 rounded-2xl px-3.5 py-3 border border-zinc-800"
            >
              <div className="w-7 h-7 rounded-lg bg-red-500/12 flex items-center justify-center shrink-0">
                <Icon size={14} className="text-red-400" />
              </div>
              <div>
                <p className="text-white text-xs font-bold leading-tight">{title}</p>
                <p className="text-zinc-500 text-[11px] mt-0.5 leading-snug">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── NOVEDADES ── */}
      <section className="px-4 pb-10">
        <p className="text-center text-zinc-600 text-[10px] font-black uppercase tracking-widest mb-3">
          Últimas novedades
        </p>
        <div className="max-w-md mx-auto space-y-2">
          {LANDING_NEWS.slice(0, 3).map((item) => (
            <article
              key={`${item.date}-${item.title}`}
              className="flex gap-3 bg-zinc-900/60 border border-zinc-800/60 rounded-xl px-3.5 py-2.5"
            >
              <div className="w-1 shrink-0 rounded-full bg-red-500/40 self-stretch" />
              <div>
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">{item.date}</p>
                <p className="text-white text-xs font-bold mt-0.5">{item.title}</p>
                <p className="text-zinc-500 text-[11px] mt-0.5 leading-snug">{item.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── PLANES ── */}
      <section className="px-4 pb-10">
        <p className="text-center text-zinc-600 text-[10px] font-black uppercase tracking-widest mb-3">
          Planes
        </p>
        <div className="grid grid-cols-2 gap-2.5 max-w-md mx-auto">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 flex flex-col gap-2">
            <p className="text-white text-sm font-black">Gratis</p>
            <p className="text-green-400 text-xs font-bold">$0</p>
            <ul className="space-y-1.5 mt-1">
              {['10 competidores', 'Modo práctica', 'Round Robin', 'Música'].map(f => (
                <li key={f} className="text-zinc-400 text-[11px] flex items-start gap-1.5">
                  <span className="text-zinc-600 mt-0.5 shrink-0">✓</span>{f}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-red-500/25 bg-red-500/5 p-4 flex flex-col gap-2">
            <p className="text-red-400 text-sm font-black">Pro</p>
            <p className="text-zinc-500 text-xs">Próximamente</p>
            <ul className="space-y-1.5 mt-1">
              {['Ilimitados', 'Votación & puntos', 'Estadísticas', 'Historial', 'Compartir Stories'].map(f => (
                <li key={f} className="text-zinc-400 text-[11px] flex items-start gap-1.5">
                  <span className="text-red-500 mt-0.5 shrink-0">✓</span>{f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── FORM ── */}
      <section ref={formRef} className="px-4 pb-8 max-w-sm mx-auto w-full">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl shadow-black/40">
          <div className="text-center mb-4">
            <p className="text-white font-black text-base">
              {mode === 'signin' ? 'Iniciar sesión' : 'Crear cuenta'}
            </p>
            <p className="text-zinc-500 text-xs mt-0.5">
              {mode === 'signin' ? 'Bienvenido de nuevo' : 'Únete gratis, sin tarjeta'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-2.5">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Usuario (ej. Fer)"
              autoComplete="username"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              required
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
            />

            {error && <p className="text-red-400 text-xs text-center py-1">{error}</p>}
            {info  && <p className="text-green-400 text-xs text-center py-1">{info}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-red-500 hover:bg-red-600 active:bg-red-700 disabled:opacity-50 text-white font-black py-3.5 rounded-xl transition-colors text-sm shadow-lg shadow-red-500/20"
            >
              {busy ? 'Cargando…' : mode === 'signin' ? 'Entrar →' : 'Crear cuenta →'}
            </button>
          </form>

          <p className="text-zinc-500 text-xs text-center mt-3">
            {mode === 'signin' ? (
              <>¿No tienes cuenta?{' '}
                <button type="button" onClick={() => { setMode('signup'); setError(''); setInfo('') }}
                  className="text-zinc-200 font-semibold underline underline-offset-2">
                  Regístrate
                </button>
              </>
            ) : (
              <>¿Ya tienes cuenta?{' '}
                <button type="button" onClick={() => { setMode('signin'); setError(''); setInfo('') }}
                  className="text-zinc-200 font-semibold underline underline-offset-2">
                  Inicia sesión
                </button>
              </>
            )}
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="mt-auto px-5 pb-10 flex flex-col items-center gap-3">
        <a
          href="https://buymeacoffee.com/fercreek"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 text-xs font-semibold transition-colors"
        >
          <Coffee size={13} /> Invítame un café
        </a>
        <p className="text-zinc-700 text-xs text-center">
          Hecho con 🔥 para la comunidad salsera
        </p>
        <p className="text-zinc-700 text-[11px] text-center">
          <a href="mailto:fercreek@gmail.com" className="text-zinc-600 hover:text-zinc-400 transition-colors">fercreek@gmail.com</a>
          {' · '}
          <a href="https://wa.me/528117655605" target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-zinc-400 transition-colors">WhatsApp</a>
        </p>
      </footer>
    </div>
  )
}

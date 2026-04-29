import { useState, useRef } from 'react'
import { Timer, Trophy, Music, Smartphone, Zap, BarChart2, Coffee, Sparkles, ArrowRight, Loader2, MessageCircle } from 'lucide-react'
import { LANDING_NEWS } from '../data/landingNews'

const WHATSAPP_COLLAB_URL = 'https://wa.me/528117655605'

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
      <section className="relative flex flex-col items-center justify-center px-6 pt-16 pb-12 text-center">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-red-500/12 blur-[120px]" />
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[300px] h-[200px] rounded-full bg-red-600/8 blur-[80px]" />
        </div>

        <span className="relative z-10 inline-flex items-center gap-1.5 text-[10px] font-black tracking-[0.3em] text-red-400 uppercase mb-6 px-3 py-1.5 rounded-full border border-red-500/25 bg-red-500/8">
          <Sparkles size={11} /> Para grupos de salsa 1vs1
        </span>

        <div className="relative z-10 mb-3">
          <h1 className="text-[76px] leading-none font-black tracking-tighter drop-shadow-2xl">
            CLASH<span className="text-red-500 [text-shadow:0_0_40px_rgba(239,68,68,0.5)]">PRO</span>
          </h1>
          <div className="mt-1 h-0.5 w-24 mx-auto rounded-full bg-gradient-to-r from-transparent via-red-500/60 to-transparent" />
        </div>

        <p className="relative z-10 text-zinc-300 text-xl font-semibold mt-2 max-w-[280px] leading-snug">
          Organiza tu torneo de salsa 1vs1
        </p>
        <p className="relative z-10 text-zinc-500 text-sm mt-2 max-w-[260px] leading-snug">
          Brackets automáticos · Sin papel · En segundos.
        </p>

        <button
          onClick={scrollToForm}
          className="relative z-10 mt-8 inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-black px-8 py-4 rounded-2xl text-sm transition-all shadow-xl shadow-red-500/35 hover:shadow-red-500/50 hover:scale-[1.02]"
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
              className="flex flex-col gap-2 bg-zinc-900/80 rounded-2xl px-3.5 py-3 border border-zinc-800 hover:border-zinc-700 transition-colors"
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

      <section className="px-4 pb-10 max-w-md mx-auto">
        <p className="text-center text-zinc-600 text-[10px] font-black uppercase tracking-widest mb-3">
          Colaborar o usar la app
        </p>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-4 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <MessageCircle size={18} className="text-emerald-400" strokeWidth={2.25} />
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-bold leading-snug">¿Quieres probarla en tu academia, evento o clase?</p>
              <p className="text-zinc-500 text-[11px] mt-1 leading-relaxed">
                Feedback, ideas o acceso para organizadores: escríbenos por WhatsApp. El enlace abre el chat sin mostrar el número aquí.
              </p>
            </div>
          </div>
          <a
            href={WHATSAPP_COLLAB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white text-sm font-black tracking-tight transition-colors shadow-lg shadow-emerald-900/30"
          >
            <MessageCircle size={16} strokeWidth={2.25} />
            Abrir WhatsApp
          </a>
        </div>
      </section>

      {/* ── FORM ── */}
      <section ref={formRef} className="px-4 pb-8 max-w-sm mx-auto w-full">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl shadow-black/50">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/20 mb-3">
              <span className="text-red-400 font-black text-sm">CP</span>
            </div>
            <p className="text-white font-black text-lg">
              {mode === 'signin' ? 'Iniciar sesión' : 'Crear cuenta'}
            </p>
            <p className="text-zinc-500 text-xs mt-1">
              {mode === 'signin' ? 'Bienvenido de nuevo a ClashPro' : 'Únete gratis · Sin tarjeta requerida'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-zinc-400 text-xs font-semibold tracking-wide">
                Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ej. Fer"
                autoComplete="username"
                disabled={busy}
                className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/25 transition-all disabled:opacity-50"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-zinc-400 text-xs font-semibold tracking-wide">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                required
                disabled={busy}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/25 transition-all disabled:opacity-50"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <p className="text-red-400 text-xs text-center">{error}</p>
              </div>
            )}
            {info && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                <p className="text-green-400 text-xs text-center">{info}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 active:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-xl transition-all text-sm shadow-lg shadow-red-500/25 hover:shadow-red-500/40"
            >
              {busy ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Cargando…
                </>
              ) : mode === 'signin' ? 'Entrar →' : 'Crear cuenta →'}
            </button>
          </form>

          <p className="text-zinc-500 text-xs text-center mt-4">
            {mode === 'signin' ? (
              <>¿No tienes cuenta?{' '}
                <button type="button" onClick={() => { setMode('signup'); setError(''); setInfo('') }}
                  className="text-zinc-200 font-semibold underline underline-offset-2 hover:text-white transition-colors">
                  Regístrate
                </button>
              </>
            ) : (
              <>¿Ya tienes cuenta?{' '}
                <button type="button" onClick={() => { setMode('signin'); setError(''); setInfo('') }}
                  className="text-zinc-200 font-semibold underline underline-offset-2 hover:text-white transition-colors">
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
          <a href={WHATSAPP_COLLAB_URL} target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-zinc-400 transition-colors">WhatsApp</a>
        </p>
      </footer>
    </div>
  )
}

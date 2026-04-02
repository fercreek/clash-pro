import { useState, useRef } from 'react'
import { Timer, Trophy, Music, Smartphone, Zap, BarChart2, Coffee, Sparkles } from 'lucide-react'
import { LANDING_NEWS } from '../data/landingNews'

const FEATURES = [
  {
    icon: Zap,
    title: 'Bracket automático',
    desc: 'Selecciona quiénes están hoy → todos los enfrentamientos se generan solos en formato Round Robin.',
  },
  {
    icon: Timer,
    title: 'Cronómetro profesional',
    desc: 'Turno A → Turno B → Votación. Con cuenta regresiva y beeps de aviso.',
  },
  {
    icon: Trophy,
    title: 'Ranking en tiempo real',
    desc: 'El leaderboard se actualiza con cada batalla. Sin Excel, sin papel.',
  },
  {
    icon: Music,
    title: 'Música integrada',
    desc: 'Playlists de Salsanamá incluidas. Conecta Spotify para usar las tuyas.',
  },
  {
    icon: Smartphone,
    title: 'Sin instalación',
    desc: 'Corre en el navegador de cualquier teléfono. Instálala como app desde Safari o Chrome.',
  },
  {
    icon: BarChart2,
    title: 'Historial de torneos',
    desc: 'Competiciones terminadas guardadas en la nube; revisa ranking y comparte de nuevo (plan Pro).',
  },
]

const PLANS = [
  {
    name: 'Gratis',
    price: null,
    color: 'zinc',
    items: [
      'Hasta 10 competidores',
      'Modo práctica: cronómetro y rotación',
      'Round Robin completo',
      'Música integrada',
    ],
    locked: [],
  },
  {
    name: 'Pro',
    price: 'Próximamente',
    color: 'red',
    items: [
      'Competidores ilimitados',
      'Modo competición: votación, puntos y ranking',
      'Estadísticas y compartir enriquecido',
      'Historial de torneos finalizados',
      'Compartir imagen Stories (próximamente)',
    ],
    locked: [],
  },
]

export default function AuthScreen({ onEmailSignIn, onEmailSignUp }) {
  const [mode, setMode] = useState('signin')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const formRef = useRef(null)

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

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
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="flex flex-col items-center justify-center px-6 pt-16 pb-12 text-center">
        <p className="text-xs font-semibold tracking-[0.25em] text-red-500 uppercase mb-4">
          Para grupos de práctica y eventos locales
        </p>
        <h1 className="text-5xl font-black tracking-tight leading-none">
          CLASH<span className="text-red-500">PRO</span>
        </h1>
        <p className="text-zinc-400 text-lg mt-3 max-w-xs leading-snug">
          Torneos de salsa 1vs1. Sin papel. Sin Excel.
        </p>
        <button
          onClick={scrollToForm}
          className="mt-8 bg-red-500 hover:bg-red-600 text-white font-bold px-8 py-3.5 rounded-2xl text-base transition-colors"
        >
          Empezar gratis →
        </button>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section className="px-5 pb-12">
        <div className="grid grid-cols-1 gap-3 max-w-md mx-auto">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex gap-3 bg-zinc-900 rounded-2xl px-4 py-3.5 border border-zinc-800"
            >
              <div className="mt-0.5 shrink-0 w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center">
                <Icon size={14} className="text-red-400" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold leading-tight">{title}</p>
                <p className="text-zinc-500 text-xs mt-0.5 leading-snug">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 pb-12">
        <p className="text-center text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
          <Sparkles size={14} className="text-amber-400 shrink-0" />
          Novedades
        </p>
        <div className="max-w-md mx-auto space-y-3">
          {LANDING_NEWS.map((item) => (
            <article
              key={`${item.date}-${item.title}`}
              className="bg-zinc-900/90 border border-zinc-800 rounded-2xl px-4 py-3"
            >
              <p className="text-[10px] font-semibold text-red-500/90 uppercase tracking-wider">{item.date}</p>
              <p className="text-white text-sm font-bold mt-1">{item.title}</p>
              <p className="text-zinc-500 text-xs mt-1 leading-snug">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── PLANES ───────────────────────────────────────────── */}
      <section className="px-5 pb-12">
        <p className="text-center text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-4">
          Planes
        </p>
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-4 flex flex-col gap-2 ${
                plan.color === 'red'
                  ? 'border-red-500/30 bg-red-500/5'
                  : 'border-zinc-800 bg-zinc-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm font-bold ${plan.color === 'red' ? 'text-red-400' : 'text-white'}`}>
                  {plan.name}
                </span>
                {plan.price && (
                  <span className="text-zinc-500 text-xs">{plan.price}</span>
                )}
                {!plan.price && (
                  <span className="text-green-400 text-xs font-semibold">$0</span>
                )}
              </div>
              <ul className="space-y-1">
                {plan.items.map((item) => (
                  <li key={item} className="text-zinc-400 text-xs flex items-start gap-1.5">
                    <span className={`mt-0.5 shrink-0 ${plan.color === 'red' ? 'text-red-500' : 'text-zinc-600'}`}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── FORM ─────────────────────────────────────────────── */}
      <section
        ref={formRef}
        className="px-5 pb-8 max-w-sm mx-auto w-full"
      >
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-center text-white font-bold text-base mb-4">
            {mode === 'signin' ? 'Iniciar sesión' : 'Crear cuenta'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Usuario (ej. Fer)"
              autoComplete="username"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:border-red-500"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              required
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:border-red-500"
            />

            {error && <p className="text-red-400 text-xs text-center">{error}</p>}
            {info  && <p className="text-green-400 text-xs text-center">{info}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors text-sm"
            >
              {busy ? 'Cargando…' : mode === 'signin' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-zinc-500 text-xs text-center mt-3">
            {mode === 'signin' ? (
              <>¿No tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError(''); setInfo('') }}
                  className="text-zinc-300 underline"
                >
                  Regístrate
                </button>
              </>
            ) : (
              <>¿Ya tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setError(''); setInfo('') }}
                  className="text-zinc-300 underline"
                >
                  Inicia sesión
                </button>
              </>
            )}
          </p>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="mt-auto px-5 pb-10 flex flex-col items-center gap-3">
        <a
          href="https://buymeacoffee.com/fercreek"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 text-sm font-medium transition-colors"
        >
          <Coffee size={15} />
          Invítame un café
        </a>
        <p className="text-zinc-700 text-xs text-center">
          Made with 🔥 & ❤️ for Salsanamá
        </p>
        <p className="text-zinc-700 text-xs text-center">
          ¿Problemas?{' '}
          <a href="mailto:fercreek@gmail.com" className="text-zinc-500 hover:text-zinc-300 transition-colors">
            fercreek@gmail.com
          </a>
          {' · '}
          <a href="https://wa.me/528117655605" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-zinc-300 transition-colors">
            WhatsApp
          </a>
        </p>
      </footer>
    </div>
  )
}

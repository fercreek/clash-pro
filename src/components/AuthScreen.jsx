import { useState } from 'react'

export default function AuthScreen({ onEmailSignIn, onEmailSignUp }) {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    if (!username.trim()) { setError('Ingresa tu usuario'); return }
    setBusy(true)
    try {
      if (mode === 'signin') {
        await onEmailSignIn(username, password)
      } else {
        await onEmailSignUp(username, password)
        setInfo('¡Cuenta creada! Iniciando sesión…')
        // auto sign-in after signup
        await onEmailSignIn(username, password)
      }
    } catch (err) {
      setError(err.message ?? 'Error al autenticar')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 px-6 gap-8 relative">
      <div className="text-center">
        <h1 className="text-4xl font-black tracking-tight text-white">
          CLASH<span className="text-red-500">PRO</span>
        </h1>
        <p className="text-zinc-400 text-sm mt-2">Batallas 1vs1 de improvisación</p>
      </div>

      <div className="w-full max-w-xs space-y-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Usuario (ej. Fer)"
            autoComplete="username"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-red-500"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            required
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-red-500"
          />

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}
          {info && <p className="text-green-400 text-xs text-center">{info}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
          >
            {busy ? 'Cargando…' : mode === 'signin' ? 'Entrar' : 'Crear cuenta'}
          </button>

          <p className="text-zinc-500 text-xs text-center">
            {mode === 'signin' ? (
              <>¿No tienes cuenta?{' '}
                <button type="button" onClick={() => { setMode('signup'); setError(''); setInfo('') }} className="text-zinc-300 underline">
                  Regístrate
                </button>
              </>
            ) : (
              <>¿Ya tienes cuenta?{' '}
                <button type="button" onClick={() => { setMode('signin'); setError(''); setInfo('') }} className="text-zinc-300 underline">
                  Inicia sesión
                </button>
              </>
            )}
          </p>
        </form>

        <p className="text-zinc-600 text-xs text-center">
          Al entrar aceptas que tus datos se usen para el torneo
        </p>
      </div>

      <p className="absolute bottom-6 text-zinc-600 text-xs text-center">
        Made with 🔥 & ❤️ for Salsanamá
      </p>
    </div>
  )
}

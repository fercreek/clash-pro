import { useState } from 'react'
import { X, LogOut, Tag, Coffee, ChevronRight, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { usePlan } from '../hooks/usePlan'
import { supabase } from '../lib/supabase'

export default function HamburgerMenu({ onClose }) {
  const { user, profile, signOut } = useAuth()
  const { planLabel, isPro } = usePlan()

  const [promoCode, setPromoCode] = useState('')
  const [promoStatus, setPromoStatus] = useState(null) // null | 'loading' | 'success' | 'error'
  const [promoMsg, setPromoMsg] = useState('')

  const username = profile?.name ?? user?.email?.split('@')[0] ?? 'Usuario'
  const initials  = username.slice(0, 2).toUpperCase()

  const handleSignOut = async () => {
    await signOut()
    onClose()
  }

  const handleRedeem = async (e) => {
    e.preventDefault()
    if (!promoCode.trim()) return
    setPromoStatus('loading')
    setPromoMsg('')

    const { data, error } = await supabase.rpc('redeem_promo_code', {
      p_code: promoCode.trim().toUpperCase(),
    })

    if (error || data?.error) {
      setPromoStatus('error')
      setPromoMsg(data?.error ?? 'Error al canjear. Intenta de nuevo.')
    } else {
      setPromoStatus('success')
      setPromoMsg('¡Código canjeado! Recargando…')
      setTimeout(() => window.location.reload(), 1800)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-72 max-w-[85vw] bg-zinc-900 border-l border-zinc-800 z-50 flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-sm">
              {initials}
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">{username}</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                isPro ? 'bg-red-500/20 text-red-400' : 'bg-zinc-700 text-zinc-400'
              }`}>
                {planLabel}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">

          {/* Código promo */}
          {!isPro && (
            <div>
              <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Tag size={12} /> Código de acceso Pro
              </p>
              <form onSubmit={handleRedeem} className="space-y-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="SALSANAMA26"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-zinc-600 uppercase tracking-widest focus:outline-none focus:border-red-500"
                />
                <button
                  type="submit"
                  disabled={promoStatus === 'loading' || promoStatus === 'success'}
                  className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-lg transition-colors"
                >
                  {promoStatus === 'loading' ? 'Canjeando…' : 'Canjear'}
                </button>
              </form>

              {promoStatus === 'success' && (
                <p className="flex items-center gap-1.5 text-green-400 text-xs mt-2">
                  <CheckCircle size={13} /> {promoMsg}
                </p>
              )}
              {promoStatus === 'error' && (
                <p className="flex items-center gap-1.5 text-red-400 text-xs mt-2">
                  <AlertCircle size={13} /> {promoMsg}
                </p>
              )}
            </div>
          )}

          {isPro && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-center">
              <p className="text-red-400 text-sm font-semibold">✦ Acceso Pro activo</p>
              <p className="text-zinc-500 text-xs mt-0.5">Gracias por apoyar ClashPro</p>
            </div>
          )}

          {/* Buy Me a Coffee */}
          <a
            href="https://buymeacoffee.com/fercreek"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 rounded-xl px-4 py-3 transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <Coffee size={16} className="text-yellow-400" />
              <div>
                <p className="text-yellow-300 text-sm font-medium">Invítame un café</p>
                <p className="text-zinc-500 text-xs">buymeacoffee.com/fercreek</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-zinc-600 group-hover:text-yellow-400 transition-colors" />
          </a>
        </div>

        {/* Footer — cerrar sesión */}
        <div className="px-5 pb-6 pt-2 border-t border-zinc-800">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full text-zinc-400 hover:text-red-400 transition-colors text-sm py-2"
          >
            <LogOut size={15} />
            Cerrar sesión
          </button>
        </div>
      </div>
    </>
  )
}

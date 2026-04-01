import { useState, useRef, useEffect } from 'react'
import {
  X, LogOut, Tag, Coffee, ChevronRight, CheckCircle, AlertCircle, ImagePlus,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { usePlan } from '../hooks/usePlan'
import { supabase } from '../lib/supabase'

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => {
      const s = String(r.result || '')
      const i = s.indexOf(',')
      resolve(i >= 0 ? s.slice(i + 1) : s)
    }
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

export default function HamburgerMenu({ onClose }) {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const { planLabel, isPro } = usePlan()

  const [promoCode, setPromoCode] = useState('')
  const [promoStatus, setPromoStatus] = useState(null)
  const [promoMsg, setPromoMsg] = useState('')

  const [photoStatus, setPhotoStatus] = useState(null)
  const [photoMsg, setPhotoMsg] = useState('')
  const [imgBroken, setImgBroken] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    setImgBroken(false)
  }, [profile?.photo_url])

  const username = profile?.name ?? user?.email?.split('@')[0] ?? 'Usuario'
  const initials = username.slice(0, 2).toUpperCase()

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

  const handlePickPhoto = () => {
    fileRef.current?.click()
  }

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !file.type.startsWith('image/')) return
    setPhotoStatus('loading')
    setPhotoMsg('')
    try {
      const imageBase64 = await fileToBase64(file)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Sin sesión')
      const r = await fetch('/api/upload-profile-photo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ imageBase64, contentType: file.type }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j.error || 'No se pudo subir')
      await refreshProfile()
      setPhotoStatus('success')
      setPhotoMsg('Foto actualizada')
      setTimeout(() => {
        setPhotoStatus(null)
        setPhotoMsg('')
      }, 2200)
    } catch (err) {
      setPhotoStatus('error')
      setPhotoMsg(err?.message || 'Error')
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />

      <div className="fixed top-0 right-0 h-full w-72 max-w-[85vw] bg-zinc-900 border-l border-zinc-800 z-50 flex flex-col shadow-2xl">

        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3 min-w-0">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <button
              type="button"
              onClick={handlePickPhoto}
              disabled={photoStatus === 'loading'}
              className="relative shrink-0 w-12 h-12 rounded-full overflow-hidden bg-red-500 flex items-center justify-center text-white font-bold text-sm ring-2 ring-zinc-700 hover:ring-red-500/50 transition-all disabled:opacity-60"
              title="Cambiar foto de perfil"
            >
              {profile?.photo_url && !imgBroken ? (
                <img
                  src={profile.photo_url}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={() => setImgBroken(true)}
                />
              ) : (
                initials
              )}
            </button>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm leading-tight truncate">{username}</p>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    isPro ? 'bg-red-500/20 text-red-400' : 'bg-zinc-700 text-zinc-400'
                  }`}
                >
                  {planLabel}
                </span>
                <button
                  type="button"
                  onClick={handlePickPhoto}
                  disabled={photoStatus === 'loading'}
                  className="text-[10px] text-zinc-500 hover:text-red-400 font-medium flex items-center gap-0.5"
                >
                  <ImagePlus size={11} />
                  {photoStatus === 'loading' ? 'Subiendo…' : 'Foto'}
                </button>
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-zinc-500 hover:text-white p-1 shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">

          {!isPro && (
            <div>
              <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Tag size={12} /> Código de acceso Pro
              </p>
              <p className="text-zinc-600 text-[11px] mb-2 leading-snug">
                Si tienes un código (por ejemplo de tu escuela o evento), pégalo aquí para desbloquear Pro.
              </p>
              <form onSubmit={handleRedeem} className="space-y-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Ej. SALSANAMA26"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-zinc-600 uppercase tracking-widest focus:outline-none focus:border-red-500"
                />
                <button
                  type="submit"
                  disabled={promoStatus === 'loading' || promoStatus === 'success'}
                  className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-lg transition-colors"
                >
                  {promoStatus === 'loading' ? 'Canjeando…' : 'Canjear código'}
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
              <p className="text-red-400 text-sm font-semibold">Acceso Pro activo</p>
              <p className="text-zinc-500 text-xs mt-0.5">Gracias por apoyar ClashPro</p>
            </div>
          )}

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

        <div className="px-5 pb-6 pt-2 border-t border-zinc-800">
          {photoStatus === 'error' && (
            <p className="flex items-center gap-1.5 text-red-400 text-xs mb-2">
              <AlertCircle size={13} /> {photoMsg}
            </p>
          )}
          {photoStatus === 'success' && photoMsg && (
            <p className="flex items-center gap-1.5 text-green-400 text-xs mb-2">
              <CheckCircle size={13} /> {photoMsg}
            </p>
          )}
          <button
            type="button"
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

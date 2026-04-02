import { X } from 'lucide-react'

const FREE_ITEMS = [
  'Hasta 10 competidores',
  'Modo práctica y rotación Round Robin',
  'Cronómetro y música',
]

const PRO_ITEMS = [
  'Competidores ilimitados',
  'Modo competición: votación, puntos y ranking',
  'Estadísticas (V/D/E, rachas)',
  'Historial de torneos finalizados',
  'Compartir enriquecido y más',
]

export default function PlansComparisonModal({ onClose, onOpenPromoMenu }) {
  return (
    <>
      <div
        className="fixed inset-0 bg-black/70 z-[60]"
        onClick={onClose}
        aria-hidden
      />
      <div className="fixed inset-x-4 top-[12%] max-w-md mx-auto bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl z-[70] max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <h3 className="text-lg font-black text-white">Planes</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-white rounded-lg"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-3">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Gratis</p>
            <ul className="text-sm text-zinc-300 space-y-1.5">
              {FREE_ITEMS.map((t) => (
                <li key={t} className="flex gap-2">
                  <span className="text-zinc-600 shrink-0">✓</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-red-500/40 bg-red-500/5 p-3">
            <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">Pro</p>
            <ul className="text-sm text-zinc-200 space-y-1.5">
              {PRO_ITEMS.map((t) => (
                <li key={t} className="flex gap-2">
                  <span className="text-red-500 shrink-0">✓</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-zinc-500 text-xs">
            Si tienes un código de acceso, ábrelo desde el menú (☰) → Código de acceso Pro.
          </p>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold text-zinc-300"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={() => {
                onClose()
                onOpenPromoMenu?.()
              }}
              className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-sm font-bold text-white"
            >
              Ir al código Pro
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

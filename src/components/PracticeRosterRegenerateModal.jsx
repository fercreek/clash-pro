import { X, AlertTriangle } from 'lucide-react'

export default function PracticeRosterRegenerateModal({ onConfirm, onCancel, namesPreview }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle size={22} className="shrink-0" />
            <h2 className="text-lg font-black text-white">Cambio de plantilla</h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Al cambiar el número de bailarines se vuelve a generar la grilla de <span className="text-white font-semibold">esta iteración</span>. Las
          batallas pendientes de esta vuelta se perderán; las ya cerradas o de iteraciones anteriores se conservan en el
          resumen.
        </p>
        {namesPreview?.length > 0 && (
          <p className="text-xs text-zinc-500">
            Nuevo roster: {namesPreview.join(', ')}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-900 text-sm font-bold text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-sm font-black text-white transition-colors"
          >
            Regenerar rondas
          </button>
        </div>
      </div>
    </div>
  )
}

import { RotateCcw, X } from 'lucide-react'

export default function DiscardRoundsModal({ open, onConfirm, onClose }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
              <RotateCcw size={16} className="text-zinc-400" />
            </div>
            <div>
              <p className="font-black text-white text-sm">Regenerar rondas</p>
              <p className="text-zinc-500 text-xs mt-0.5">Las rondas actuales no contarán para estadísticas.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-zinc-600 hover:text-zinc-400 p-1 -mr-1 -mt-1">
            <X size={16} />
          </button>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-sm transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => { onConfirm(); onClose() }}
            className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-white font-black text-sm transition-colors"
          >
            Regenerar
          </button>
        </div>
      </div>
    </div>
  )
}

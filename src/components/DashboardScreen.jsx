import { Trophy, Music2, BookOpen, Dumbbell, ChevronRight } from 'lucide-react'

export default function DashboardScreen({
  profile,
  isPro,
  onStartTournament,
  onStartPractice,
  onOpenPatterns,
  onOpenGuia,
  onOpenBlog,
}) {
  const name = profile?.name?.split(' ')[0] ?? 'bailarín'

  return (
    <div className="min-h-full bg-zinc-950 px-4 py-6 space-y-6">
      <div>
        <p className="text-zinc-400 text-sm">Hola, <span className="text-white font-bold">{name}</span></p>
        <h1 className="text-2xl font-black text-white mt-0.5 leading-tight">
          ¿Qué hacemos hoy?
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onStartTournament}
          className="group flex flex-col items-start gap-3 bg-gradient-to-br from-amber-500/15 via-amber-500/8 to-transparent border border-amber-500/30 hover:border-amber-500/60 rounded-2xl p-4 text-left transition-all active:scale-[0.97]"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Trophy size={20} className="text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-white font-black text-sm leading-tight">Competición</p>
            <p className="text-amber-400/70 text-[11px] leading-snug mt-0.5">Puntos, voting y leaderboard</p>
          </div>
          <div className="flex items-center gap-1 text-amber-400 text-[11px] font-bold">
            Iniciar <ChevronRight size={13} />
          </div>
        </button>

        <button
          type="button"
          onClick={onStartPractice}
          className="group flex flex-col items-start gap-3 bg-gradient-to-br from-zinc-800/80 via-zinc-800/40 to-transparent border border-zinc-700 hover:border-zinc-600 rounded-2xl p-4 text-left transition-all active:scale-[0.97]"
        >
          <div className="w-10 h-10 rounded-xl bg-zinc-700/60 flex items-center justify-center">
            <Dumbbell size={20} className="text-zinc-300" />
          </div>
          <div className="flex-1">
            <p className="text-white font-black text-sm leading-tight">Práctica</p>
            <p className="text-zinc-400 text-[11px] leading-snug mt-0.5">Solo timer y rotación de parejas</p>
          </div>
          <div className="flex items-center gap-1 text-zinc-400 text-[11px] font-bold">
            Iniciar <ChevronRight size={13} />
          </div>
        </button>
      </div>

      <div>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-3">Herramientas</p>
        <div className="space-y-2">
          <button
            type="button"
            onClick={onOpenPatterns}
            className="w-full flex items-center gap-3 bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 rounded-xl px-4 py-3 text-left transition-all active:scale-[0.98]"
          >
            <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
              <Music2 size={16} className="text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm">Patrones de salsa</p>
              <p className="text-zinc-500 text-[11px]">Aprende clave, tumbao, cascara…</p>
            </div>
            <ChevronRight size={16} className="text-zinc-600 shrink-0" />
          </button>

          <button
            type="button"
            onClick={onOpenGuia}
            className="w-full flex items-center gap-3 bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 rounded-xl px-4 py-3 text-left transition-all active:scale-[0.98]"
          >
            <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center shrink-0">
              <Dumbbell size={16} className="text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm">Guía de práctica</p>
              <p className="text-zinc-500 text-[11px]">Rutinas con timer para entrenar</p>
            </div>
            <ChevronRight size={16} className="text-zinc-600 shrink-0" />
          </button>

          <button
            type="button"
            onClick={onOpenBlog}
            className="w-full flex items-center gap-3 bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 rounded-xl px-4 py-3 text-left transition-all active:scale-[0.98]"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
              <BookOpen size={16} className="text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm">Base de conocimiento</p>
              <p className="text-zinc-500 text-[11px]">Artículos sobre salsa y performance</p>
            </div>
            <ChevronRight size={16} className="text-zinc-600 shrink-0" />
          </button>
        </div>
      </div>
    </div>
  )
}

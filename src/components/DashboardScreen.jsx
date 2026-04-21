import { Trophy, Dumbbell, Music2, BookOpen, ChevronRight, Swords, Zap } from 'lucide-react'

export default function DashboardScreen({
  profile,
  isPro,
  onStartTournament,
  onStartPractice,
  onOpenPatterns,
  onOpenGuia,
  onOpenBlog,
}) {
  const name = profile?.name?.split(' ')[0] ?? profile?.email?.split('@')[0] ?? 'bailarín'

  return (
    <div className="min-h-full bg-zinc-950 flex flex-col text-white">
      <style>{`@keyframes clashBar { 0% { transform: scaleY(0.4); } 100% { transform: scaleY(1); } }`}</style>

      <div className="flex-1 px-5 pt-6 pb-8 max-w-md mx-auto w-full flex flex-col gap-7">

        <div>
          <p className="text-zinc-500 text-xs tracking-wide uppercase font-semibold">
            Hola, <span className="text-zinc-300">{name}</span>
          </p>
          <h1 className="text-[34px] font-black text-white mt-1.5 leading-[0.95] tracking-tight">
            ¿Listo para<br/>el <span className="text-red-500">1vs1</span>?
          </h1>
        </div>

        <button
          type="button"
          onClick={onStartTournament}
          className="relative overflow-hidden rounded-3xl text-left group active:scale-[0.99] transition-transform"
          style={{ padding: 1, background: 'linear-gradient(135deg, rgba(251,191,36,0.8), rgba(239,68,68,0.5) 55%, rgba(63,63,70,0.3))' }}
        >
          <div className="relative rounded-[23px] bg-zinc-950 overflow-hidden">
            <div
              className="absolute inset-0 opacity-80 pointer-events-none"
              style={{ background: 'radial-gradient(80% 60% at 85% 20%, rgba(251,191,36,0.25), transparent 60%), radial-gradient(60% 40% at 15% 90%, rgba(239,68,68,0.15), transparent 60%)' }}
            />

            <div className="absolute right-5 top-5 flex items-end gap-[3px] h-12 opacity-70">
              {[0.5, 0.8, 0.35, 1, 0.6, 0.9, 0.45].map((h, i) => (
                <span
                  key={i}
                  className="w-[3px] rounded-full bg-amber-400"
                  style={{ height: `${h * 100}%`, animation: `clashBar 900ms ${i * 90}ms ease-in-out infinite alternate` }}
                />
              ))}
            </div>

            <div className="relative p-5 pt-6 pb-5">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[10px] font-black tracking-[0.2em] uppercase text-amber-400">Modo principal</span>
              </div>

              <div className="flex items-end gap-3 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Trophy size={26} className="text-zinc-950" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-black text-[28px] leading-[0.9] tracking-tight">Competición</p>
                  <p className="text-zinc-400 text-xs mt-1.5 font-medium">Torneo 1vs1 con bracket y jueces</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-5">
                {['Bracket', 'Voting', 'Leaderboard'].map((l) => (
                  <span
                    key={l}
                    className="text-[11px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-full px-2.5 py-1"
                  >
                    {l}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between bg-amber-400 group-hover:bg-amber-300 rounded-2xl px-5 py-3.5 transition-colors">
                <span className="text-zinc-950 font-black text-base tracking-tight">Iniciar torneo</span>
                <Swords size={18} className="text-zinc-950" strokeWidth={2.5} />
              </div>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={onStartPractice}
          className="flex items-center gap-3 bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 rounded-2xl px-4 py-3.5 text-left transition-all active:scale-[0.98]"
        >
          <div className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">
            <Zap size={20} className="text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-white font-black text-[15px] leading-tight">Práctica libre</p>
              <span className="text-[9px] font-black tracking-widest text-zinc-500 uppercase">Rápido</span>
            </div>
            <p className="text-zinc-500 text-xs mt-0.5">Timer · Rotación de parejas · Sin puntaje</p>
          </div>
          <ChevronRight size={16} className="text-zinc-600 shrink-0" />
        </button>

        <div>
          <div className="flex items-center gap-3 mb-3">
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em]">Herramientas</p>
            <div className="flex-1 h-px bg-zinc-900" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={onOpenPatterns}
              className="flex flex-col items-start gap-2 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/70 rounded-xl px-3 py-3 text-left transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-800/80 ring-1 ring-red-500/20 flex items-center justify-center">
                <Music2 size={18} className="text-red-400" />
              </div>
              <div>
                <p className="text-zinc-200 text-[12px] font-bold leading-tight">Patrones</p>
                <p className="text-zinc-500 text-[10px] leading-tight mt-0.5">de salsa</p>
              </div>
            </button>

            <button
              type="button"
              onClick={onOpenGuia}
              className="flex flex-col items-start gap-2 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/70 rounded-xl px-3 py-3 text-left transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-800/80 ring-1 ring-orange-500/20 flex items-center justify-center">
                <Dumbbell size={18} className="text-orange-400" />
              </div>
              <div>
                <p className="text-zinc-200 text-[12px] font-bold leading-tight">Guía</p>
                <p className="text-zinc-500 text-[10px] leading-tight mt-0.5">de práctica</p>
              </div>
            </button>

            <button
              type="button"
              onClick={onOpenBlog}
              className="flex flex-col items-start gap-2 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/70 rounded-xl px-3 py-3 text-left transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-800/80 ring-1 ring-blue-500/20 flex items-center justify-center">
                <BookOpen size={18} className="text-blue-400" />
              </div>
              <div>
                <p className="text-zinc-200 text-[12px] font-bold leading-tight">Base</p>
                <p className="text-zinc-500 text-[10px] leading-tight mt-0.5">de conocimiento</p>
              </div>
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

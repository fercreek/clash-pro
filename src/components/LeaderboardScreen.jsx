import { useMemo, useCallback, useState } from 'react'
import { Trophy, Medal, ArrowLeft, RotateCcw, Share2, Copy, MessageCircle } from 'lucide-react'
import { calculateScores } from '../utils/roundRobin'

function buildShareText(leaderboard, completedMatches, totalMatches, isFinished) {
  const lines = ['ClashPro — Ranking', '', `Batallas: ${completedMatches}/${totalMatches}`, '']
  leaderboard.forEach((e, i) => {
    lines.push(`${i + 1}. ${e.name} — ${e.points} pts`)
  })
  if (isFinished && leaderboard.length > 0) {
    lines.push('', `Campeón: ${leaderboard[0].name} (${leaderboard[0].points} pts)`)
  }
  return lines.join('\n')
}

const RANK_STYLES = [
  { bg: 'bg-amber-500/20 border-amber-500', text: 'text-amber-400', icon: Trophy },
  { bg: 'bg-zinc-400/10 border-zinc-400', text: 'text-zinc-300', icon: Medal },
  { bg: 'bg-orange-800/20 border-orange-700', text: 'text-orange-500', icon: Medal },
]

function ScoreRow({ entry, rank }) {
  const style = RANK_STYLES[rank] ?? {
    bg: 'bg-zinc-800/50 border-zinc-800',
    text: 'text-zinc-400',
  }
  const Icon = style.icon

  return (
    <div
      className={`flex items-center gap-4 border rounded-xl px-4 py-3 ${style.bg}`}
    >
      <span className={`text-2xl font-black w-8 text-center ${style.text}`}>
        {rank + 1}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold truncate">{entry.name}</p>
      </div>
      <div className={`flex items-center gap-1 font-black text-xl ${style.text}`}>
        {Icon && rank < 3 && <Icon size={16} />}
        <span>{entry.points}</span>
        <span className="text-xs font-normal text-zinc-500">pts</span>
      </div>
    </div>
  )
}

export default function LeaderboardScreen({ competitors, matches, onBack, onReset }) {
  const [copyDone, setCopyDone] = useState(false)

  const leaderboard = useMemo(
    () => calculateScores(competitors, matches),
    [competitors, matches]
  )

  const totalMatches = matches.filter((m) => !m.isBye).length
  const completedMatches = matches.filter((m) => m.completed && !m.isBye).length
  const isFinished = totalMatches === completedMatches

  const shareText = useMemo(
    () => buildShareText(leaderboard, completedMatches, totalMatches, isFinished),
    [leaderboard, completedMatches, totalMatches, isFinished]
  )

  const handleShare = useCallback(async () => {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: 'ClashPro — Ranking', text: shareText })
        return
      } catch (e) {
        if (e?.name === 'AbortError') return
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer')
  }, [shareText])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopyDone(true)
      setTimeout(() => setCopyDone(false), 2000)
    } catch {}
  }, [shareText])

  return (
    <div className="p-4 max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={onBack}
          className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-black">Leaderboard</h2>
          <p className="text-zinc-400 text-xs">
            {completedMatches}/{totalMatches} batallas completadas
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-lg text-sm transition-colors"
            title="Compartir"
          >
            <Share2 size={14} />
          </button>
          <button
            type="button"
            onClick={() =>
              window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer')
            }
            className="flex items-center gap-1.5 bg-zinc-800 hover:bg-green-900/40 px-3 py-2 rounded-lg text-sm transition-colors"
            title="WhatsApp"
          >
            <MessageCircle size={14} className="text-green-400" />
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-lg text-sm transition-colors"
            title="Copiar"
          >
            <Copy size={14} />
            {copyDone && <span className="text-xs text-green-400">OK</span>}
          </button>
          {isFinished && (
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-lg text-sm transition-colors"
            >
              <RotateCcw size={14} />
              Nuevo torneo
            </button>
          )}
        </div>
      </div>

      {/* Winner highlight */}
      {isFinished && leaderboard.length > 0 && (
        <div className="text-center bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5">
          <Trophy size={36} className="text-amber-400 mx-auto mb-2" />
          <p className="text-amber-400 text-sm uppercase tracking-widest font-semibold">
            Campeón
          </p>
          <p className="text-white text-3xl font-black mt-1">{leaderboard[0].name}</p>
          <p className="text-amber-400 font-bold">{leaderboard[0].points} puntos</p>
        </div>
      )}

      {/* Rankings */}
      <section className="space-y-2">
        {leaderboard.map((entry, i) => (
          <ScoreRow key={entry.name} entry={entry} rank={i} />
        ))}
      </section>
    </div>
  )
}

import { useMemo, useCallback, useState, useEffect, useRef } from 'react'
import { Trophy, ArrowLeft, RotateCcw, Share2, Copy, MessageCircle, RefreshCw, ImageDown } from 'lucide-react'
import confetti from 'canvas-confetti'
import { calculateScores, computeExtendedStats } from '../utils/roundRobin'
import { AV_BG } from '../utils/avatarColors'
import { shareOrDownloadLeaderboardPng } from '../utils/shareLeaderboardImage'

function buildWhatsAppText(leaderboard, extStats, completedMatches, totalMatches, isFinished) {
  const lines = ['🏆 ClashPro — Resultado de hoy', '']
  leaderboard.forEach((e, i) => {
    const s = extStats.find((x) => x.name === e.name)
    const detail = s ? `(${s.wins}V ${s.losses}D)` : ''
    lines.push(`${i + 1}. ${e.name} — ${e.points} pts ${detail}`.trim())
  })
  if (isFinished && leaderboard.length > 0) {
    lines.push('', `🥇 Campeón: ${leaderboard[0].name}`)
  }
  lines.push('', 'clash-pro.vercel.app')
  return lines.join('\n')
}

function buildWhatsAppTextSimple(leaderboard, completedMatches, totalMatches, isFinished) {
  const lines = ['🏆 ClashPro — Resultado', '']
  leaderboard.forEach((e, i) => {
    lines.push(`${i + 1}. ${e.name} — ${e.points} pts`)
  })
  if (isFinished && leaderboard.length > 0) {
    lines.push('', `🥇 Campeón: ${leaderboard[0].name}`)
  }
  lines.push('', 'clash-pro.vercel.app')
  return lines.join('\n')
}

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


function Avatar({ name, size = 40, idx = 0 }) {
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div
      className="shrink-0 rounded-full flex items-center justify-center text-white font-black"
      style={{ width: size, height: size, background: AV_BG[idx % AV_BG.length], fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  )
}

function Streak({ n }) {
  if (!n) return null
  const up = n > 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-black ${up ? 'text-green-400' : 'text-zinc-500'}`}>
      {up ? '🔥' : '↓'}{Math.abs(n)}
    </span>
  )
}

function PodiumBlock({ rank, name, pts, color, height, idx, champion }) {
  return (
    <div className="flex flex-col items-center" style={{ width: 96 }}>
      <div className="relative mb-2">
        {champion && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <Trophy size={20} color="#fbbf24" strokeWidth={2.5} />
          </div>
        )}
        <Avatar name={name} size={champion ? 60 : 48} idx={idx} />
        <div
          className="absolute -bottom-1 -right-1 rounded-full flex items-center justify-center font-black text-[11px]"
          style={{ width: 20, height: 20, background: color, color: '#18181b', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
        >
          {rank}
        </div>
      </div>
      <p className="text-white font-bold text-[11px] text-center leading-tight max-w-full truncate w-full px-1">
        {name.split(' ')[0]}
      </p>
      <p className="text-zinc-500 text-[10px] mb-2">{pts} pts</p>
      <div
        className="w-full relative rounded-t-lg overflow-hidden"
        style={{
          height,
          background: `linear-gradient(180deg, ${color}22, ${color}08)`,
          border: `1px solid ${color}40`,
          borderBottom: 'none',
        }}
      >
        <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: color }} />
        <div
          className="absolute bottom-3 left-1/2 -translate-x-1/2 font-black tabular-nums"
          style={{ color: `${color}33`, fontSize: 40, lineHeight: 1, letterSpacing: '-0.04em' }}
        >
          {rank}
        </div>
      </div>
    </div>
  )
}

export default function LeaderboardScreen({
  competitors,
  matches,
  onBack,
  onReset,
  onNewSession,
  showExtendedStats = true,
  showConfetti = true,
  showRichWhatsApp = true,
  showFooterActions = true,
  showBackButton = true,
}) {
  const [copyDone, setCopyDone] = useState(false)
  const [imageBusy, setImageBusy] = useState(false)
  const confettiFiredRef = useRef(false)

  const leaderboard = useMemo(() => calculateScores(competitors, matches), [competitors, matches])

  const extStats = useMemo(
    () => (showExtendedStats ? computeExtendedStats(competitors, matches) : []),
    [competitors, matches, showExtendedStats]
  )

  const totalMatches = matches.filter((m) => !m.isBye).length
  const completedMatches = matches.filter((m) => m.completed && !m.isBye).length
  const isFinished = totalMatches === completedMatches && totalMatches > 0

  useEffect(() => {
    if (!showConfetti || completedMatches <= 0 || confettiFiredRef.current) return
    confettiFiredRef.current = true
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#ef4444', '#f97316', '#ffffff', '#fbbf24'] })
  }, [showConfetti, completedMatches])

  const shareText = useMemo(
    () => buildShareText(leaderboard, completedMatches, totalMatches, isFinished),
    [leaderboard, completedMatches, totalMatches, isFinished]
  )

  const whatsappText = useMemo(
    () =>
      showRichWhatsApp
        ? buildWhatsAppText(leaderboard, extStats, completedMatches, totalMatches, isFinished)
        : buildWhatsAppTextSimple(leaderboard, completedMatches, totalMatches, isFinished),
    [leaderboard, extStats, completedMatches, totalMatches, isFinished, showRichWhatsApp]
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
    window.open(`https://wa.me/?text=${encodeURIComponent(whatsappText)}`, '_blank', 'noopener,noreferrer')
  }, [shareText, whatsappText])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopyDone(true)
      setTimeout(() => setCopyDone(false), 2000)
    } catch {}
  }, [shareText])

  const handleWhatsApp = useCallback(() => {
    window.open(`https://wa.me/?text=${encodeURIComponent(whatsappText)}`, '_blank', 'noopener,noreferrer')
  }, [whatsappText])

  const dateLabel = useMemo(
    () =>
      new Date().toLocaleString('es', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    []
  )

  const handleShareImage = useCallback(async () => {
    if (imageBusy) return
    setImageBusy(true)
    try {
      await shareOrDownloadLeaderboardPng({
        leaderboard,
        completedMatches,
        totalMatches,
        isFinished,
        dateLabel,
      })
    } finally {
      setImageBusy(false)
    }
  }, [leaderboard, completedMatches, totalMatches, isFinished, dateLabel, imageBusy])

  const [first, second, third, ...rest] = leaderboard

  return (
    <div className="min-h-full bg-zinc-950 text-white">

      {/* amber glow from top */}
      <div
        className="absolute inset-x-0 top-0 h-64 pointer-events-none"
        style={{ background: 'radial-gradient(70% 50% at 50% 0%, rgba(251,191,36,0.18), transparent 70%)' }}
      />

      {/* header */}
      <div className="relative px-5 pt-5 pb-3 flex items-center justify-between">
        {showBackButton ? (
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        ) : (
        <div className="w-10" />
        )}

        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400">
            {isFinished ? 'Torneo terminado' : 'Ranking en vivo'}
          </p>
          <p className="text-zinc-500 text-[11px] font-medium">{completedMatches}/{totalMatches} batallas</p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleShareImage}
            disabled={imageBusy}
            className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400 hover:bg-zinc-800 transition-colors disabled:opacity-50"
            title="Imagen Stories (1080×1920)"
          >
            <ImageDown size={16} />
          </button>
          <button
            type="button"
            onClick={handleWhatsApp}
            className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-green-400 hover:bg-zinc-800 transition-colors"
            title="WhatsApp"
          >
            <MessageCircle size={16} />
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-zinc-800 transition-colors"
            title="Compartir"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* champion name */}
      {first && (
        <div className="relative px-5 pt-2 pb-1 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400/80 mb-1">Campeón</p>
          <div className="inline-flex items-center gap-2 mb-0.5">
            <Trophy size={16} className="text-amber-400" strokeWidth={2.5} />
            <h1 className="text-white font-black text-[28px] leading-none tracking-tight">{first.name}</h1>
          </div>
          <p className="text-zinc-500 text-xs font-medium">{first.points} pts</p>
        </div>
      )}

      {/* podium */}
      {leaderboard.length >= 2 && (
        <div className="relative px-4 pt-8 pb-4">
          <div className="flex items-end justify-center gap-2">
            {second && (
              <PodiumBlock rank={2} name={second.name} pts={second.points} color="#e4e4e7" height={100} idx={1} />
            )}
            {first && (
              <PodiumBlock rank={1} name={first.name} pts={first.points} color="#fbbf24" height={140} idx={0} champion />
            )}
            {third && (
              <PodiumBlock rank={3} name={third.name} pts={third.points} color="#d97706" height={78} idx={2} />
            )}
          </div>
        </div>
      )}

      {/* rest of ranking */}
      {rest.length > 0 && (
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center gap-3 mb-3">
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em]">Resto del ranking</p>
            <div className="flex-1 h-px bg-zinc-900" />
          </div>
          <div className="flex flex-col">
            {rest.map((e, i) => {
              const rank = i + 4
              const stat = extStats.find((s) => s.name === e.name)
              const rankColor = '#52525b'
              return (
                <div
                  key={e.name}
                  className={`flex items-center gap-3 py-3 ${i < rest.length - 1 ? 'border-b border-zinc-900' : ''}`}
                >
                  <div className="w-8 text-center">
                    <span className="font-black text-lg tabular-nums" style={{ color: rankColor }}>{rank}</span>
                  </div>
                  <Avatar name={e.name} size={38} idx={rank - 1} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate leading-tight">{e.name}</p>
                    {stat && stat.played > 0 && (
                      <p className="text-zinc-500 text-[11px]">
                        {stat.wins}V · {stat.losses}D · {stat.draws}E{' '}
                        <Streak n={stat.currentStreak} />
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-white font-black text-base tabular-nums leading-none">{e.points}</p>
                    <p className="text-zinc-600 text-[9px] uppercase tracking-wider font-black">pts</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* copy button */}
      <div className="px-5 pt-2 pb-2">
        <button
          type="button"
          onClick={handleCopy}
          className="w-full flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl py-3 text-zinc-400 text-sm font-semibold transition-colors"
        >
          <Copy size={14} />
          {copyDone ? <span className="text-green-400">Copiado</span> : 'Copiar ranking'}
        </button>
      </div>

      {/* share + reset */}
      <div className="px-5 pt-2 pb-8">
        <button
          type="button"
          onClick={handleShare}
          className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-400 rounded-2xl py-4 text-white font-black text-base tracking-tight transition-colors"
        >
          <Share2 size={16} />
          Compartir resultados
        </button>

        {showFooterActions && (
          <div className="flex gap-2 mt-2">
            {onNewSession && (
              <button
                type="button"
                onClick={onNewSession}
                className="flex-1 flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 py-3 rounded-xl text-sm font-semibold text-zinc-300 transition-colors"
              >
                <RefreshCw size={14} />
                Nueva sesión
              </button>
            )}
            <button
              type="button"
              onClick={onReset}
              className="flex-1 flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 py-3 rounded-xl text-sm font-semibold text-zinc-300 transition-colors"
            >
              <RotateCcw size={14} />
              Nuevo torneo
            </button>
          </div>
        )}
      </div>

    </div>
  )
}

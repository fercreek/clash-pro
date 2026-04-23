const W = 1080
const H = 1920

function fitFont(ctx, text, maxWidth, sizeStart) {
  let size = sizeStart
  ctx.font = `600 ${size}px system-ui, -apple-system, sans-serif`
  while (size > 20 && ctx.measureText(text).width > maxWidth) {
    size -= 2
    ctx.font = `600 ${size}px system-ui, -apple-system, sans-serif`
  }
  return size
}

export function drawLeaderboardShareImage({
  leaderboard,
  completedMatches,
  totalMatches,
  isFinished,
  dateLabel,
}) {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, '#18181b')
  g.addColorStop(1, '#09090b')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  ctx.fillStyle = 'rgba(251, 191, 36, 0.08)'
  ctx.beginPath()
  ctx.arc(W * 0.85, 0, 420, 0, Math.PI * 2)
  ctx.fill()

  let y = 100
  ctx.textAlign = 'left'
  ctx.fillStyle = '#fafafa'
  ctx.font = '800 88px system-ui, -apple-system, sans-serif'
  ctx.fillText('CLASH', 72, y)
  const wClash = ctx.measureText('CLASH').width
  ctx.fillStyle = '#ef4444'
  ctx.fillText('PRO', 72 + wClash + 8, y)

  y += 40
  ctx.fillStyle = '#a1a1aa'
  ctx.font = '500 32px system-ui, -apple-system, sans-serif'
  ctx.fillText(isFinished ? 'Resultado del torneo' : 'Ranking', 72, (y += 50))

  ctx.font = '400 26px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#71717a'
  y += 36
  ctx.fillText(
    `${dateLabel} · ${completedMatches}/${totalMatches} batallas`,
    72,
    y
  )

  let rowY = y + 80
  const rows = (leaderboard ?? []).slice(0, 12)
  for (let i = 0; i < rows.length; i++) {
    const e = rows[i]
    const rank = i + 1
    const isTop3 = rank <= 3
    const boxY = rowY
    rowY += 108
    if (isTop3) {
      ctx.fillStyle = rank === 1 ? 'rgba(251, 191, 36, 0.12)' : 'rgba(63, 63, 70, 0.5)'
      ctx.beginPath()
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(56, boxY, W - 112, 92, 16)
      } else {
        ctx.rect(56, boxY, W - 112, 92)
      }
      ctx.fill()
    }
    ctx.fillStyle = isTop3 && rank === 1 ? '#fbbf24' : '#a1a1aa'
    ctx.font = '800 40px system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(String(rank), 88, boxY + 60)

    ctx.fillStyle = '#fafafa'
    const name = e.name
    const nameSize = fitFont(ctx, name, W - 112 - 200 - 120, 36)
    ctx.font = `700 ${nameSize}px system-ui, sans-serif`
    ctx.fillText(name, 160, boxY + 58)

    ctx.textAlign = 'right'
    ctx.fillStyle = '#e4e4e7'
    ctx.font = '800 36px system-ui, sans-serif'
    ctx.fillText(`${e.points} pts`, W - 88, boxY + 58)
    ctx.textAlign = 'left'
  }

  ctx.fillStyle = '#52525b'
  ctx.font = '500 24px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('clash-pro.vercel.app', W / 2, H - 120)

  return canvas
}

export function leaderboardImageToPngBlob(canvas) {
  return new Promise((resolve) => {
    if (!canvas) {
      resolve(null)
      return
    }
    canvas.toBlob(
      (b) => resolve(b),
      'image/png',
      0.92
    )
  })
}

export async function shareOrDownloadLeaderboardPng({ leaderboard, completedMatches, totalMatches, isFinished, dateLabel }) {
  const canvas = drawLeaderboardShareImage({
    leaderboard,
    completedMatches,
    totalMatches,
    isFinished,
    dateLabel,
  })
  const blob = await leaderboardImageToPngBlob(canvas)
  if (!blob) return
  const file = new File([blob], 'clashpro-ranking.png', { type: 'image/png' })
  if (typeof navigator !== 'undefined' && navigator.canShare) {
    try {
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'ClashPro' })
        return
      }
    } catch (e) {
      if (e?.name === 'AbortError') return
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'clashpro-ranking.png'
  a.click()
  URL.revokeObjectURL(url)
}

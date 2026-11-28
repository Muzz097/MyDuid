import {
  PERSONA_TITLES,
  WEEKDAY_FULL,
  formatMonthYear,
  formatPersonaReasonNoAmount,
} from './copy'
import type { WrappedDetail } from './types'

export type ShareCardFormat = '9:16' | '1:1'

/**
 * Privacy-safe share card payload.
 * DILARANG keras memasukkan: nominal Rupiah apa pun, catatan transaksi (notes),
 * nama dompet, nama pengguna, atau email. Hanya field agregat non-nominal.
 */
export type SafeShareCardData = {
  monthLabel: string
  personaTitle: string
  personaReason: string
  achievements: string[]
  topCategories: { name: string; sharePercent: number }[]
}

export function buildSafeShareCardData(detail: WrappedDetail): SafeShareCardData {
  const achievements: string[] = []

  if (detail.no_spend_days > 0) {
    achievements.push(`${detail.no_spend_days} hari tanpa pengeluaran`)
  }
  if (detail.logging.longest_logging_streak > 0) {
    achievements.push(
      `Streak mencatat ${detail.logging.longest_logging_streak} hari beruntun`,
    )
  }
  if (detail.budgets) {
    const kept = detail.budgets.healthy + detail.budgets.warning
    if (kept > 0) {
      achievements.push(`${kept} anggaran terjaga`)
    }
  }
  if (detail.busiest_weekday && achievements.length < 3) {
    achievements.push(
      `Hari paling aktif: ${WEEKDAY_FULL[detail.busiest_weekday]}`,
    )
  }
  const expChange = detail.summary?.previous?.expense_change_percent ?? null
  if (expChange !== null && expChange !== 0 && achievements.length < 3) {
    achievements.push(
      expChange < 0
        ? `Pengeluaran turun ${Math.abs(expChange)}% dari bulan lalu`
        : `Pengeluaran naik ${expChange}% dari bulan lalu`,
    )
  }

  return {
    monthLabel: formatMonthYear(detail.month),
    personaTitle: PERSONA_TITLES[detail.persona.code],
    personaReason: formatPersonaReasonNoAmount(detail.persona),
    achievements: achievements.slice(0, 3),
    topCategories: detail.top_categories.slice(0, 3).map((c) => ({
      name: c.name,
      sharePercent: c.share_percent,
    })),
  }
}

function readThemePalette() {
  const styles = getComputedStyle(document.documentElement)
  const getVar = (name: string, fallback: string) =>
    styles.getPropertyValue(name).trim() || fallback

  return {
    brand500: getVar('--brand-500', 'rgb(196, 61, 75)'),
    brand700: getVar('--brand-700', 'rgb(136, 36, 52)'),
    brand900: getVar('--brand-900', 'rgb(79, 23, 34)'),
    accent: getVar('--accent', 'rgb(231, 109, 123)'),
    surfaceCard: getVar('--surface-card', 'rgb(255, 255, 255)'),
    textPrimary: getVar('--text-primary', 'rgb(60, 32, 38)'),
    textSecondary: getVar('--text-secondary', 'rgb(123, 98, 102)'),
  }
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.trim().split(/\s+/)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate
    } else {
      if (current) lines.push(current)
      current = word
      if (lines.length === maxLines) break
    }
  }
  if (current && lines.length < maxLines) {
    lines.push(current)
  }

  if (lines.length === maxLines) {
    let last = lines[maxLines - 1]
    while (last.length > 3 && ctx.measureText(`${last}...`).width > maxWidth) {
      last = last.slice(0, -1)
    }
    if (words.join(' ') !== lines.join(' ')) {
      lines[maxLines - 1] = `${last}...`
    }
  }

  return lines
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
  ctx.closePath()
}

export async function renderShareCard(
  detail: WrappedDetail,
  format: ShareCardFormat,
): Promise<Blob> {
  if (typeof document !== 'undefined' && document.fonts?.load) {
    await Promise.allSettled([
      document.fonts.load('700 48px "Plus Jakarta Sans"'),
      document.fonts.load('400 28px "Plus Jakarta Sans"'),
    ])
  }

  const safe = buildSafeShareCardData(detail)
  const palette = readThemePalette()
  const width = 1080
  const height = format === '9:16' ? 1920 : 1080

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas tidak tersedia di peramban ini.')
  }

  // Background gradient from active theme tokens
  const bg = ctx.createLinearGradient(0, 0, width, height)
  bg.addColorStop(0, palette.brand700)
  bg.addColorStop(0.55, palette.brand900)
  bg.addColorStop(1, palette.brand500)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, width, height)

  // Soft decorative circles
  ctx.save()
  ctx.globalAlpha = 0.14
  ctx.fillStyle = palette.accent
  ctx.beginPath()
  ctx.arc(width * 0.88, height * 0.14, format === '9:16' ? 280 : 220, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(width * 0.12, height * 0.86, format === '9:16' ? 240 : 180, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  const pad = format === '9:16' ? 88 : 72
  const innerWidth = width - pad * 2
  let y = format === '9:16' ? 140 : 88

  // Header badge + Month Year
  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)'
  drawRoundedRect(ctx, pad, y, 280, 54, 27)
  ctx.fill()

  ctx.fillStyle = '#ffffff'
  ctx.font = '700 24px "Plus Jakarta Sans", sans-serif'
  ctx.fillText('MYDUID WRAPPED', pad + 26, y + 36)

  y += format === '9:16' ? 108 : 88
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
  ctx.font = '600 34px "Plus Jakarta Sans", sans-serif'
  ctx.fillText(safe.monthLabel, pad, y)

  // Persona title
  y += format === '9:16' ? 86 : 68
  ctx.fillStyle = '#ffffff'
  ctx.font = `800 ${format === '9:16' ? 76 : 62}px "Plus Jakarta Sans", sans-serif`
  const titleLines = wrapTextLines(ctx, safe.personaTitle, innerWidth, 2)
  for (const line of titleLines) {
    ctx.fillText(line, pad, y)
    y += format === '9:16' ? 88 : 72
  }

  // Persona reason (privacy-safe)
  y += 10
  ctx.fillStyle = 'rgba(255, 255, 255, 0.88)'
  ctx.font = `400 ${format === '9:16' ? 32 : 26}px "Plus Jakarta Sans", sans-serif`
  const reasonLines = wrapTextLines(ctx, safe.personaReason, innerWidth, 3)
  for (const line of reasonLines) {
    ctx.fillText(line, pad, y)
    y += format === '9:16' ? 44 : 36
  }

  // Card panel for achievements + top categories
  y += format === '9:16' ? 56 : 26
  const footerHeight = 90
  const panelHeight = height - y - footerHeight - 36
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)'
  drawRoundedRect(ctx, pad, y, innerWidth, panelHeight, 32)
  ctx.fill()

  let py = y + (format === '9:16' ? 58 : 44)
  const pPad = pad + 44
  const pWidth = innerWidth - 88

  if (safe.achievements.length > 0) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)'
    ctx.font = '700 22px "Plus Jakarta Sans", sans-serif'
    ctx.fillText('SOROTAN BULAN INI', pPad, py)
    py += format === '9:16' ? 46 : 36

    ctx.fillStyle = '#ffffff'
    ctx.font = `600 ${format === '9:16' ? 30 : 25}px "Plus Jakarta Sans", sans-serif`
    for (const item of safe.achievements) {
      const wrapped = wrapTextLines(ctx, `•  ${item}`, pWidth, 2)
      for (const line of wrapped) {
        ctx.fillText(line, pPad, py)
        py += format === '9:16' ? 42 : 34
      }
      py += 6
    }
  }

  if (safe.topCategories.length > 0 && py + 120 < y + panelHeight) {
    py += format === '9:16' ? 28 : 14
    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)'
    ctx.font = '700 22px "Plus Jakarta Sans", sans-serif'
    ctx.fillText('KATEGORI TERATAS', pPad, py)
    py += format === '9:16' ? 46 : 36

    for (const cat of safe.topCategories) {
      if (py + 40 > y + panelHeight - 16) break
      ctx.fillStyle = '#ffffff'
      ctx.font = `600 ${format === '9:16' ? 28 : 24}px "Plus Jakarta Sans", sans-serif`
      const pctLabel = `${cat.sharePercent}%`
      const pctWidth = ctx.measureText(pctLabel).width
      const catLines = wrapTextLines(ctx, cat.name, pWidth - pctWidth - 24, 1)
      ctx.fillText(catLines[0] ?? cat.name, pPad, py)
      ctx.fillText(pctLabel, pPad + pWidth - pctWidth, py)
      py += format === '9:16' ? 48 : 38
    }
  }

  // Footer
  ctx.fillStyle = 'rgba(255, 255, 255, 0.78)'
  ctx.font = '600 24px "Plus Jakarta Sans", sans-serif'
  ctx.fillText('MyDuid · Your Money, Understood.', pad, height - 56)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Gagal membuat gambar PNG.'))
    }, 'image/png')
  })
}

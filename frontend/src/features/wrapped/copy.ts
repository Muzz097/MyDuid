import { formatRupiah } from '@/lib/money'
import type { WrappedPersona, WrappedPersonaCode } from './types'

const TZ = 'Asia/Jakarta'

const monthNameFmt = new Intl.DateTimeFormat('id-ID', {
  timeZone: TZ,
  month: 'long',
})

const monthYearFmt = new Intl.DateTimeFormat('id-ID', {
  timeZone: TZ,
  month: 'long',
  year: 'numeric',
})

const shortDateFmt = new Intl.DateTimeFormat('id-ID', {
  timeZone: TZ,
  day: 'numeric',
  month: 'short',
})

const fullDateFmt = new Intl.DateTimeFormat('id-ID', {
  timeZone: TZ,
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

function parseMonthMidday(ym: string): Date {
  return new Date(`${ym}-15T12:00:00+07:00`)
}

function parseDateMidday(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00+07:00`)
}

export function formatMonthName(ym: string): string {
  return monthNameFmt.format(parseMonthMidday(ym))
}

export function formatMonthYear(ym: string): string {
  return monthYearFmt.format(parseMonthMidday(ym))
}

export function formatShortDate(isoDate: string): string {
  return shortDateFmt.format(parseDateMidday(isoDate))
}

export function formatFullDate(isoDate: string): string {
  return fullDateFmt.format(parseDateMidday(isoDate))
}

export const WEEKDAY_SHORT: Record<number, string> = {
  1: 'Sen',
  2: 'Sel',
  3: 'Rab',
  4: 'Kam',
  5: 'Jum',
  6: 'Sab',
  7: 'Min',
}

export const WEEKDAY_FULL: Record<number, string> = {
  1: 'Senin',
  2: 'Selasa',
  3: 'Rabu',
  4: 'Kamis',
  5: 'Jumat',
  6: 'Sabtu',
  7: 'Minggu',
}

export const PERSONA_TITLES: Record<WrappedPersonaCode, string> = {
  calm_saver: 'Penabung Tenang',
  budget_keeper: 'Penjaga Anggaran',
  recovery_month: 'Bulan Pemulihan',
  moment_hunter: 'Pemburu Momen',
  weekend_king: 'Raja Akhir Pekan',
  routine: 'Si Teratur',
  explorer: 'Penjelajah',
}

export const PERSONA_TAGLINES: Record<WrappedPersonaCode, string> = {
  calm_saver: 'Arus kas tetap positif dengan pengeluaran yang lebih terkendali.',
  budget_keeper: 'Semua batas anggaran bulan ini berhasil kamu jaga.',
  recovery_month: 'Langkah baik untuk menurunkan pengeluaran dibanding bulan lalu.',
  moment_hunter: 'Sebagian besar pengeluaranmu terkumpul pada satu hari spesial.',
  weekend_king: 'Ritme belanjamu paling aktif di akhir pekan.',
  routine: 'Konsisten mencatat aktivitas keuangan sepanjang bulan.',
  explorer: 'Pola keuanganmu unik dan terus berkembang.',
}

export function formatPersonaReason(persona: WrappedPersona): string {
  const { code, reason } = persona

  switch (code) {
    case 'calm_saver': {
      const pct = typeof reason.expense_change_percent === 'number'
        ? Math.abs(reason.expense_change_percent)
        : null
      const net = typeof reason.net === 'number' ? formatRupiah(reason.net) : null
      if (pct !== null && net !== null) {
        return `Pengeluaranmu turun ${pct}% dari bulan lalu dengan surplus ${net}.`
      }
      return PERSONA_TAGLINES.calm_saver
    }

    case 'budget_keeper': {
      const total = typeof reason.total === 'number' ? reason.total : null
      if (total !== null) {
        return `Seluruh ${total} anggaran bulan ini selesai tanpa melewati batas.`
      }
      return PERSONA_TAGLINES.budget_keeper
    }

    case 'recovery_month': {
      const pct = typeof reason.expense_change_percent === 'number'
        ? Math.abs(reason.expense_change_percent)
        : null
      if (pct !== null) {
        return `Pengeluaranmu turun ${pct}% dibanding bulan sebelumnya.`
      }
      return PERSONA_TAGLINES.recovery_month
    }

    case 'moment_hunter': {
      const pct = typeof reason.share_percent === 'number' ? reason.share_percent : null
      const date = typeof reason.date === 'string' ? formatShortDate(reason.date) : null
      if (pct !== null && date !== null) {
        return `${pct}% pengeluaranmu terjadi pada ${date}.`
      }
      return PERSONA_TAGLINES.moment_hunter
    }

    case 'weekend_king': {
      const pct = typeof reason.weekend_share_percent === 'number'
        ? reason.weekend_share_percent
        : null
      if (pct !== null) {
        return `${pct}% pengeluaranmu terjadi di hari Sabtu dan Minggu.`
      }
      return PERSONA_TAGLINES.weekend_king
    }

    case 'routine': {
      const txCount = typeof reason.transaction_count === 'number'
        ? reason.transaction_count
        : null
      const activeDays = typeof reason.active_days === 'number'
        ? reason.active_days
        : null
      if (txCount !== null && activeDays !== null) {
        return `Kamu mencatat ${txCount} transaksi di ${activeDays} hari berbeda.`
      }
      return PERSONA_TAGLINES.routine
    }

    case 'explorer': {
      if (reason.kind === 'not_enough_data') {
        return 'Catat minimal 10 transaksi dalam sebulan untuk membuka pola yang lebih spesifik.'
      }
      return PERSONA_TAGLINES.explorer
    }
  }
}

export function formatPersonaReasonNoAmount(persona: WrappedPersona): string {
  const { code, reason } = persona

  if (code === 'calm_saver') {
    const pct = typeof reason.expense_change_percent === 'number'
      ? Math.abs(reason.expense_change_percent)
      : null
    if (pct !== null) {
      return `Pengeluaranmu turun ${pct}% dari bulan lalu dengan arus kas tetap positif.`
    }
    return PERSONA_TAGLINES.calm_saver
  }

  return formatPersonaReason(persona)
}

export function previousCompletedMonthJakarta(): string {
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
  }).format(now)
  const [y, m] = parts.split('-').map(Number)
  const prev = new Date(Date.UTC(y, m - 2, 15))
  const py = prev.getUTCFullYear()
  const pm = String(prev.getUTCMonth() + 1).padStart(2, '0')
  return `${py}-${pm}`
}

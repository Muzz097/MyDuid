import { shiftJakartaDate, todayJakarta } from '@/lib/date'
import type { ComparisonBasis, ReportTab } from '@/features/reports/types'

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export const MAX_REPORT_DAYS = 366

export function isValidIsoDate(value: string | null | undefined): value is string {
  if (!value || !ISO_DATE_RE.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  )
}

export function diffDaysInclusive(from: string, to: string): number {
  const a = new Date(`${from}T12:00:00+07:00`).getTime()
  const b = new Date(`${to}T12:00:00+07:00`).getTime()
  return Math.round((b - a) / 86_400_000) + 1
}

export function defaultCurrentMonthRange(): { from: string; to: string } {
  const today = todayJakarta()
  return {
    from: `${today.slice(0, 7)}-01`,
    to: today,
  }
}

export function validatePeriodRange(
  from: string,
  to: string,
): { valid: true } | { valid: false; message: string } {
  if (!isValidIsoDate(from) || !isValidIsoDate(to)) {
    return { valid: false, message: 'Format tanggal harus YYYY-MM-DD.' }
  }
  if (from > to) {
    return { valid: false, message: 'Tanggal mulai tidak boleh melebihi tanggal akhir.' }
  }
  const today = todayJakarta()
  if (to > today) {
    return { valid: false, message: 'Tanggal akhir tidak boleh melewati hari ini.' }
  }
  if (diffDaysInclusive(from, to) - 1 > MAX_REPORT_DAYS) {
    return { valid: false, message: 'Rentang tanggal laporan maksimal 366 hari.' }
  }
  return { valid: true }
}

export function resolveReportPeriod(
  rawFrom: string | null,
  rawTo: string | null,
): { from: string; to: string } {
  if (rawFrom && rawTo && validatePeriodRange(rawFrom, rawTo).valid) {
    return { from: rawFrom, to: rawTo }
  }
  return defaultCurrentMonthRange()
}

export function resolveReportTab(rawTab: string | null): ReportTab {
  if (rawTab === 'ringkasan' || rawTab === 'summary') return 'summary'
  if (
    rawTab === 'categories' ||
    rawTab === 'trends' ||
    rawTab === 'wallets' ||
    rawTab === 'compare' ||
    rawTab === 'wrapped'
  ) {
    return rawTab
  }
  return 'summary'
}

export type PeriodPresetKey = 'this_month' | 'last_month' | 'last_7_days' | 'last_30_days'

export function getPresetRange(preset: PeriodPresetKey): { from: string; to: string } {
  const today = todayJakarta()
  switch (preset) {
    case 'this_month':
      return { from: `${today.slice(0, 7)}-01`, to: today }
    case 'last_month': {
      const [y, m] = today.slice(0, 7).split('-').map(Number)
      const prevEnd = new Date(Date.UTC(y, m - 1, 0))
      const fy = prevEnd.getUTCFullYear()
      const fm = String(prevEnd.getUTCMonth() + 1).padStart(2, '0')
      const fd = String(prevEnd.getUTCDate()).padStart(2, '0')
      return { from: `${fy}-${fm}-01`, to: `${fy}-${fm}-${fd}` }
    }
    case 'last_7_days':
      return { from: shiftJakartaDate(today, -6), to: today }
    case 'last_30_days':
      return { from: shiftJakartaDate(today, -29), to: today }
  }
}

export function shiftMonthRange(
  currentFrom: string,
  deltaMonths: -1 | 1,
): { from: string; to: string } | null {
  const today = todayJakarta()
  const currentYm = today.slice(0, 7)

  const [y, m] = currentFrom.slice(0, 7).split('-').map(Number)
  const target = new Date(Date.UTC(y, m - 1 + deltaMonths, 1))
  const ty = target.getUTCFullYear()
  const tm = String(target.getUTCMonth() + 1).padStart(2, '0')
  const targetYm = `${ty}-${tm}`

  if (targetYm > currentYm) return null
  if (targetYm === currentYm) {
    return { from: `${targetYm}-01`, to: today }
  }

  const lastDay = new Date(Date.UTC(ty, target.getUTCMonth() + 1, 0)).getUTCDate()
  return {
    from: `${targetYm}-01`,
    to: `${targetYm}-${String(lastDay).padStart(2, '0')}`,
  }
}

export function canAdvanceMonth(currentFrom: string): boolean {
  const currentYm = todayJakarta().slice(0, 7)
  return currentFrom.slice(0, 7) < currentYm
}

export function formatShortDateId(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
}

export function formatFullDateId(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function formatDateRangeId(from: string, to: string): string {
  if (from === to) return formatFullDateId(from)
  const sameYear = from.slice(0, 4) === to.slice(0, 4)
  const sameMonth = from.slice(0, 7) === to.slice(0, 7)

  if (sameMonth) {
    return `${Number(from.slice(8, 10))}–${formatFullDateId(to)}`
  }
  if (sameYear) {
    return `${formatShortDateId(from)} – ${formatFullDateId(to)}`
  }
  return `${formatFullDateId(from)} – ${formatFullDateId(to)}`
}

export function comparisonBasisLabel(
  basis: ComparisonBasis,
  prevFrom: string,
  prevTo: string,
): string {
  const range = formatDateRangeId(prevFrom, prevTo)
  switch (basis) {
    case 'previous_month':
      return `vs ${range} (bulan lalu)`
    case 'same_days_previous_month':
      return `vs ${range}`
    case 'previous_equal_period':
      return `vs ${range}`
  }
}

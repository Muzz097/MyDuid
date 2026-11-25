/**
 * Centralized Jakarta-timezone date helpers.
 *
 * All helpers default to Asia/Jakarta (WIB, UTC+7).
 */

const TZ = 'Asia/Jakarta'

/** Current date string in Jakarta timezone (YYYY-MM-DD). */
export function todayJakarta(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/** Shift a YYYY-MM-DD date by `days` and return the new YYYY-MM-DD. */
export function shiftJakartaDate(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00+07:00`)
  date.setDate(date.getDate() + days)
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/**
 * Human-readable group label for a date:
 * - "Hari ini" / "Kemarin" for relative dates
 * - "20 Nov 2026" otherwise
 */
export function formatGroupLabel(iso: string): string {
  const today = todayJakarta()
  if (iso === today) return 'Hari ini'
  if (iso === shiftJakartaDate(today, -1)) return 'Kemarin'
  const date = new Date(`${iso}T00:00:00`)
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

import { useEffect, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { todayJakarta } from '@/lib/date'
import {
  canAdvanceMonth,
  formatDateRangeId,
  getPresetRange,
  shiftMonthRange,
  validatePeriodRange,
  type PeriodPresetKey,
} from '@/features/reports/periodUtils'

export type ReportPeriodBarProps = {
  from: string
  to: string
  onChangePeriod: (nextFrom: string, nextTo: string) => void
}

const PRESETS: { key: PeriodPresetKey; label: string }[] = [
  { key: 'this_month', label: 'Bulan ini' },
  { key: 'last_month', label: 'Bulan lalu' },
  { key: 'last_7_days', label: '7 hari' },
  { key: 'last_30_days', label: '30 hari' },
]

export function ReportPeriodBar({
  from,
  to,
  onChangePeriod,
}: ReportPeriodBarProps) {
  const [customOpen, setCustomOpen] = useState(false)
  const [draftFrom, setDraftFrom] = useState(from)
  const [draftTo, setDraftTo] = useState(to)
  const [customError, setCustomError] = useState<string | null>(null)

  useEffect(() => {
    setDraftFrom(from)
    setDraftTo(to)
    setCustomError(null)
  }, [from, to])

  const activePreset = PRESETS.find((p) => {
    const r = getPresetRange(p.key)
    return r.from === from && r.to === to
  })?.key

  const canNext = canAdvanceMonth(from)
  const today = todayJakarta()

  function handlePrevMonth() {
    const next = shiftMonthRange(from, -1)
    if (next) {
      setCustomOpen(false)
      onChangePeriod(next.from, next.to)
    }
  }

  function handleNextMonth() {
    const next = shiftMonthRange(from, 1)
    if (next) {
      setCustomOpen(false)
      onChangePeriod(next.from, next.to)
    }
  }

  function handleApplyCustom(e: React.FormEvent) {
    e.preventDefault()
    const check = validatePeriodRange(draftFrom, draftTo)
    if (!check.valid) {
      setCustomError(check.message)
      return
    }
    setCustomError(null)
    setCustomOpen(false)
    onChangePeriod(draftFrom, draftTo)
  }

  return (
    <section
      aria-label="Pemilih periode laporan"
      className="sticky top-16 z-20 -mx-4 border-b border-line bg-page/90 px-4 py-3 backdrop-blur-md lg:mx-0 lg:rounded-[var(--radius-card)] lg:border lg:bg-card/95 lg:px-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Month stepper + active range */}
        <div className="flex items-center justify-between gap-2 sm:justify-start">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Bulan sebelumnya"
              className="inline-flex size-11 items-center justify-center rounded-[var(--radius-control)] border border-line bg-card text-ink transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 active:scale-95"
            >
              <ChevronLeft size={18} strokeWidth={2} aria-hidden />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              disabled={!canNext}
              aria-label="Bulan berikutnya"
              className="inline-flex size-11 items-center justify-center rounded-[var(--radius-control)] border border-line bg-card text-ink transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 active:scale-95"
            >
              <ChevronRight size={18} strokeWidth={2} aria-hidden />
            </button>
          </div>

          <div className="flex items-center gap-2 px-1">
            <Calendar size={16} strokeWidth={1.75} className="shrink-0 text-brand-600 dark:text-brand-400" aria-hidden />
            <span className="text-sm font-semibold text-ink tabular-nums">
              {formatDateRangeId(from, to)}
            </span>
          </div>
        </div>

        {/* Presets + custom toggle */}
        <div className="flex flex-wrap items-center gap-1.5">
          {PRESETS.map((preset) => {
            const selected = activePreset === preset.key && !customOpen
            return (
              <button
                key={preset.key}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  const range = getPresetRange(preset.key)
                  setCustomOpen(false)
                  onChangePeriod(range.from, range.to)
                }}
                className={cn(
                  'inline-flex min-h-9 items-center rounded-full px-3 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                  selected
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-muted text-ink hover:bg-line/60',
                )}
              >
                {preset.label}
              </button>
            )
          })}

          <button
            type="button"
            aria-expanded={customOpen}
            aria-pressed={customOpen || !activePreset}
            onClick={() => setCustomOpen((v) => !v)}
            className={cn(
              'inline-flex min-h-9 items-center rounded-full px-3 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
              customOpen || !activePreset
                ? 'bg-brand-500 text-white shadow-sm'
                : 'bg-muted text-ink hover:bg-line/60',
            )}
          >
            Kustom
          </button>
        </div>
      </div>

      {/* Custom date range inputs */}
      {customOpen && (
        <form
          onSubmit={handleApplyCustom}
          className="mt-3 flex flex-col gap-2.5 border-t border-line/70 pt-3 sm:flex-row sm:items-end"
        >
          <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-ink-soft">
            <span>Dari tanggal</span>
            <input
              type="date"
              value={draftFrom}
              max={today}
              onChange={(e) => {
                setDraftFrom(e.target.value)
                setCustomError(null)
              }}
              className="min-h-11 rounded-[var(--radius-control)] border border-line bg-card px-3 text-sm text-ink focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/30"
              required
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-ink-soft">
            <span>Sampai tanggal</span>
            <input
              type="date"
              value={draftTo}
              max={today}
              onChange={(e) => {
                setDraftTo(e.target.value)
                setCustomError(null)
              }}
              className="min-h-11 rounded-[var(--radius-control)] border border-line bg-card px-3 text-sm text-ink focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/30"
              required
            />
          </label>
          <div className="flex items-center gap-2">
            <Button type="submit" size="md" variant="primary" className="min-h-11">
              Terapkan
            </Button>
            <Button
              type="button"
              size="md"
              variant="ghost"
              className="min-h-11"
              onClick={() => {
                setCustomOpen(false)
                setCustomError(null)
              }}
            >
              Batal
            </Button>
          </div>
          {customError && (
            <p className="text-xs font-medium text-danger-600 dark:text-danger-400 sm:col-span-full" role="alert">
              {customError}
            </p>
          )}
        </form>
      )}
    </section>
  )
}

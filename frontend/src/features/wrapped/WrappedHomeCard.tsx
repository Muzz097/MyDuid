import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, X } from 'lucide-react'
import { Card } from '@/components/ui'
import { formatMonthName, previousCompletedMonthJakarta } from './copy'
import { useWrappedMonths } from './useWrapped'

function dismissedKey(month: string): string {
  return `myduid.wrapped.dismissed.${month}`
}

function isDismissed(month: string): boolean {
  try {
    return window.localStorage.getItem(dismissedKey(month)) === '1'
  } catch {
    return false
  }
}

export function WrappedHomeCard() {
  const targetMonth = previousCompletedMonthJakarta()
  const [dismissed, setDismissed] = useState(() => isDismissed(targetMonth))
  const { data, loading, error } = useWrappedMonths(!dismissed)

  if (dismissed || loading || error || !data) {
    return null
  }

  const hasTargetMonth = data.months.some((m) => m.month === targetMonth)
  if (!hasTargetMonth) {
    return null
  }

  function handleDismiss() {
    try {
      window.localStorage.setItem(dismissedKey(targetMonth), '1')
    } catch {
      // Ignore storage failure
    }
    setDismissed(true)
  }

  const monthName = formatMonthName(targetMonth)

  return (
    <Card className="border-brand-200/80 bg-gradient-to-r from-brand-500/12 via-card to-accent/12 !p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Sparkles className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-ink">
              Wrapped {monthName} sudah siap
            </p>
            <p className="truncate text-xs text-ink-soft">
              Lihat kilas balik keuanganmu bulan lalu
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Link
            to={`/laporan/wrapped/${targetMonth}`}
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            Lihat
          </Link>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label={`Tutup pengingat Wrapped ${monthName}`}
            className="inline-flex size-11 items-center justify-center rounded-[var(--radius-control)] text-ink-soft transition hover:bg-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </Card>
  )
}

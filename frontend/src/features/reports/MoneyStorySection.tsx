import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Flame,
  RefreshCw,
  Tag,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatRupiah } from '@/lib/money'
import { formatFullDateId } from '@/features/reports/periodUtils'
import type { ReportStory, ReportSummary } from '@/features/reports/types'
import { useReportData } from '@/features/reports/useReportData'

export type MoneyStorySectionProps = {
  from: string
  to: string
  summary: ReportSummary | null
}

function reasonText(code: string | undefined, fallback: string): string {
  switch (code) {
    case 'no_expense_in_period':
      return 'Belum ada pengeluaran tercatat pada periode ini.'
    case 'no_previous_expense':
      return 'Belum ada data pengeluaran pada periode pembanding.'
    default:
      return fallback
  }
}

export function MoneyStorySection({
  from,
  to,
  summary,
}: MoneyStorySectionProps) {
  const { data: story, loading, error, retry } = useReportData<ReportStory>(
    '/reports/story',
    { from, to },
  )

  return (
    <section aria-label="Money Story" className="space-y-3">
      <SectionHeader
        title="Money Story"
        subtitle="Sorotan utama dari transaksi Anda — klik kartu untuk menelusuri detailnya"
      />

      {loading && !story ? (
        <div className="grid gap-3 md:grid-cols-2">
          <Skeleton className="h-28" rounded="card" />
          <Skeleton className="h-28" rounded="card" />
          <Skeleton className="h-28" rounded="card" />
          <Skeleton className="h-28" rounded="card" />
        </div>
      ) : error && !story ? (
        <Card className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-danger-500" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-ink">Money Story gagal dimuat</p>
              <p className="text-xs text-ink-soft">{error}</p>
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={retry} className="gap-1.5">
            <RefreshCw size={14} aria-hidden />
            Coba lagi
          </Button>
        </Card>
      ) : story ? (
        <div className="grid gap-3 md:grid-cols-2">
          {/* 1. Kategori pengeluaran tertinggi */}
          {story.top_expense_category ? (
            <Link
              to={`/transaksi?from=${from}&to=${to}&type=expense&category_id=${story.top_expense_category.category_id}`}
              className="group block rounded-[var(--radius-card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            >
              <Card className="flex h-full items-start justify-between gap-3 p-4 transition duration-150 group-hover:border-brand-300 group-hover:bg-muted/30 dark:group-hover:border-brand-700">
                <div className="flex items-start gap-3">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-brand-500/10 text-brand-600 dark:text-brand-400">
                    <Tag size={18} strokeWidth={1.75} aria-hidden />
                  </span>
                  <div>
                    <p className="text-xs font-medium text-ink-soft">
                      Kategori pengeluaran tertinggi
                    </p>
                    <p className="mt-1 text-sm font-semibold text-ink">
                      {story.top_expense_category.name}
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-expense-600 tabular-nums dark:text-expense-400">
                      {formatRupiah(story.top_expense_category.amount)}
                    </p>
                  </div>
                </div>
                <ArrowRight
                  size={16}
                  className="mt-1 shrink-0 text-ink-soft transition group-hover:translate-x-0.5 group-hover:text-brand-600 dark:group-hover:text-brand-400"
                  aria-hidden
                />
              </Card>
            </Link>
          ) : (
            <Card variant="subtle" className="flex items-start gap-3 p-4">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-muted text-ink-soft">
                <Tag size={18} strokeWidth={1.75} aria-hidden />
              </span>
              <div>
                <p className="text-xs font-medium text-ink-soft">
                  Kategori pengeluaran tertinggi
                </p>
                <p className="mt-1 text-xs text-ink-soft">
                  {reasonText(
                    story.reasons.top_expense_category,
                    'Belum ada data kategori pengeluaran.',
                  )}
                </p>
              </div>
            </Card>
          )}

          {/* 2. Hari dengan pengeluaran terbanyak */}
          {story.busiest_day ? (
            <Link
              to={`/transaksi?from=${story.busiest_day.date}&to=${story.busiest_day.date}&type=expense`}
              className="group block rounded-[var(--radius-card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            >
              <Card className="flex h-full items-start justify-between gap-3 p-4 transition duration-150 group-hover:border-brand-300 group-hover:bg-muted/30 dark:group-hover:border-brand-700">
                <div className="flex items-start gap-3">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-brand-500/10 text-brand-600 dark:text-brand-400">
                    <CalendarDays size={18} strokeWidth={1.75} aria-hidden />
                  </span>
                  <div>
                    <p className="text-xs font-medium text-ink-soft">
                      Hari dengan pengeluaran tertinggi
                    </p>
                    <p className="mt-1 text-sm font-semibold text-ink">
                      {formatFullDateId(story.busiest_day.date)}
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-expense-600 tabular-nums dark:text-expense-400">
                      {formatRupiah(story.busiest_day.amount)}
                    </p>
                  </div>
                </div>
                <ArrowRight
                  size={16}
                  className="mt-1 shrink-0 text-ink-soft transition group-hover:translate-x-0.5 group-hover:text-brand-600 dark:group-hover:text-brand-400"
                  aria-hidden
                />
              </Card>
            </Link>
          ) : (
            <Card variant="subtle" className="flex items-start gap-3 p-4">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-muted text-ink-soft">
                <CalendarDays size={18} strokeWidth={1.75} aria-hidden />
              </span>
              <div>
                <p className="text-xs font-medium text-ink-soft">
                  Hari dengan pengeluaran tertinggi
                </p>
                <p className="mt-1 text-xs text-ink-soft">
                  {reasonText(
                    story.reasons.busiest_day,
                    'Belum ada pengeluaran harian tercatat.',
                  )}
                </p>
              </div>
            </Card>
          )}

          {/* 3. Pengeluaran terbesar */}
          {story.largest_expense ? (
            <Link
              to={`/transaksi?from=${story.largest_expense.transaction_date}&to=${story.largest_expense.transaction_date}&type=expense${story.largest_expense.category_id ? `&category_id=${story.largest_expense.category_id}` : ''}`}
              className="group block rounded-[var(--radius-card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            >
              <Card className="flex h-full items-start justify-between gap-3 p-4 transition duration-150 group-hover:border-brand-300 group-hover:bg-muted/30 dark:group-hover:border-brand-700">
                <div className="flex items-start gap-3">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-brand-500/10 text-brand-600 dark:text-brand-400">
                    <Flame size={18} strokeWidth={1.75} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-ink-soft">
                      Pengeluaran terbesar
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-ink">
                      {story.largest_expense.notes?.trim() ||
                        story.largest_expense.category_name ||
                        'Transaksi pengeluaran'}
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-expense-600 tabular-nums dark:text-expense-400">
                      {formatRupiah(story.largest_expense.amount)}
                      <span className="ml-1.5 text-xs font-normal text-ink-soft">
                        · {formatFullDateId(story.largest_expense.transaction_date)}
                      </span>
                    </p>
                  </div>
                </div>
                <ArrowRight
                  size={16}
                  className="mt-1 shrink-0 text-ink-soft transition group-hover:translate-x-0.5 group-hover:text-brand-600 dark:group-hover:text-brand-400"
                  aria-hidden
                />
              </Card>
            </Link>
          ) : (
            <Card variant="subtle" className="flex items-start gap-3 p-4">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-muted text-ink-soft">
                <Flame size={18} strokeWidth={1.75} aria-hidden />
              </span>
              <div>
                <p className="text-xs font-medium text-ink-soft">
                  Pengeluaran terbesar
                </p>
                <p className="mt-1 text-xs text-ink-soft">
                  {reasonText(
                    story.reasons.largest_expense,
                    'Belum ada transaksi pengeluaran.',
                  )}
                </p>
              </div>
            </Card>
          )}

          {/* 4. Perubahan pengeluaran vs periode pembanding */}
          {story.expense_change && story.expense_change.percent !== null ? (
            <Link
              to={
                summary?.previous
                  ? `/transaksi?from=${summary.previous.from}&to=${summary.previous.to}&type=expense`
                  : `/transaksi?from=${from}&to=${to}&type=expense`
              }
              className="group block rounded-[var(--radius-card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            >
              <Card className="flex h-full items-start justify-between gap-3 p-4 transition duration-150 group-hover:border-brand-300 group-hover:bg-muted/30 dark:group-hover:border-brand-700">
                <div className="flex items-start gap-3">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-brand-500/10 text-brand-600 dark:text-brand-400">
                    {story.expense_change.percent > 0 ? (
                      <TrendingUp size={18} strokeWidth={1.75} aria-hidden />
                    ) : (
                      <TrendingDown size={18} strokeWidth={1.75} aria-hidden />
                    )}
                  </span>
                  <div>
                    <p className="text-xs font-medium text-ink-soft">
                      Perubahan pengeluaran
                    </p>
                    <p className="mt-1 text-sm font-semibold text-ink">
                      {story.expense_change.percent === 0
                        ? 'Pengeluaran sama dengan periode pembanding'
                        : story.expense_change.percent > 0
                          ? `Pengeluaran naik ${story.expense_change.percent}%`
                          : `Pengeluaran turun ${Math.abs(story.expense_change.percent)}%`}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-soft tabular-nums">
                      Periode pembanding: {formatRupiah(story.expense_change.previous_amount)}
                    </p>
                  </div>
                </div>
                <ArrowRight
                  size={16}
                  className="mt-1 shrink-0 text-ink-soft transition group-hover:translate-x-0.5 group-hover:text-brand-600 dark:group-hover:text-brand-400"
                  aria-hidden
                />
              </Card>
            </Link>
          ) : (
            <Card variant="subtle" className="flex items-start gap-3 p-4">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-muted text-ink-soft">
                <BookOpen size={18} strokeWidth={1.75} aria-hidden />
              </span>
              <div>
                <p className="text-xs font-medium text-ink-soft">
                  Perubahan pengeluaran
                </p>
                <p className="mt-1 text-xs text-ink-soft">
                  {reasonText(
                    story.reasons.expense_change,
                    'Belum ada data pembanding untuk periode ini.',
                  )}
                </p>
              </div>
            </Card>
          )}
        </div>
      ) : null}
    </section>
  )
}

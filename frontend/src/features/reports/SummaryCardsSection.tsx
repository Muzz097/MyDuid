import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  Receipt,
  RefreshCw,
  Scale,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Skeleton } from '@/components/ui/Skeleton'
import { useCountUp } from '@/hooks/useCountUp'
import { cn } from '@/lib/cn'
import { formatRupiah } from '@/lib/money'
import { comparisonBasisLabel } from '@/features/reports/periodUtils'
import type { ReportSummary } from '@/features/reports/types'

export type SummaryCardsSectionProps = {
  summary: ReportSummary | null
  loading: boolean
  error: string | null
  onRetry: () => void
  from: string
  to: string
}

function ChangeChip({
  percent,
  invertGood = false,
}: {
  percent: number | null
  invertGood?: boolean
}) {
  if (percent === null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-ink-soft">
        <Minus size={12} strokeWidth={2} aria-hidden />
        Belum ada pembanding
      </span>
    )
  }

  if (percent === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-ink-soft">
        <Minus size={12} strokeWidth={2} aria-hidden />
        Sama (0%)
      </span>
    )
  }

  const isUp = percent > 0
  const isPositiveTone = invertGood ? !isUp : isUp
  const Icon = isUp ? ArrowUpRight : ArrowDownRight
  const label = isUp ? `Naik ${percent}%` : `Turun ${Math.abs(percent)}%`

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums',
        isPositiveTone
          ? 'bg-income-500/12 text-income-600 dark:text-income-400'
          : 'bg-expense-500/12 text-expense-600 dark:text-expense-400',
      )}
    >
      <Icon size={13} strokeWidth={2.25} aria-hidden />
      {label}
    </span>
  )
}

export function SummaryCardsSection({
  summary,
  loading,
  error,
  onRetry,
  from,
  to,
}: SummaryCardsSectionProps) {
  const animatedNet = useCountUp(loading || !summary ? 0 : summary.net)
  const animatedIncome = useCountUp(loading || !summary ? 0 : summary.income)
  const animatedExpense = useCountUp(loading || !summary ? 0 : summary.expense)

  if (loading && !summary) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-36 md:col-span-2" rounded="card" />
          <Skeleton className="h-36" rounded="card" />
          <Skeleton className="h-36" rounded="card" />
        </div>
        <Skeleton className="h-24" rounded="card" />
      </div>
    )
  }

  if (error && !summary) {
    return (
      <Card className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="mt-0.5 shrink-0 text-danger-500" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-ink">Ringkasan gagal dimuat</p>
            <p className="text-xs text-ink-soft">{error}</p>
          </div>
        </div>
        <Button size="sm" variant="secondary" onClick={onRetry} className="gap-1.5">
          <RefreshCw size={14} aria-hidden />
          Coba lagi
        </Button>
      </Card>
    )
  }

  if (!summary) return null

  const basisText = comparisonBasisLabel(
    summary.comparison_basis,
    summary.previous.from,
    summary.previous.to,
  )

  const cashFlowBadge =
    summary.cash_flow === 'positive'
      ? { label: 'Surplus', icon: TrendingUp, cls: 'bg-income-500/12 text-income-600 dark:text-income-400' }
      : summary.cash_flow === 'negative'
        ? { label: 'Defisit', icon: TrendingDown, cls: 'bg-expense-500/12 text-expense-600 dark:text-expense-400' }
        : { label: 'Seimbang', icon: Scale, cls: 'bg-muted text-ink-soft' }
  const CashFlowIcon = cashFlowBadge.icon

  return (
    <div className="space-y-4">
      {/* 3 Primary Metric Cards (Net emphasized across 2 columns on md/lg) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Arus Kas Bersih (Hero emphasis) */}
        <Card className="flex flex-col justify-between border-brand-200/80 bg-card p-5 dark:border-brand-800/40 md:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-wide text-ink-soft uppercase">
                Arus Kas Bersih
              </p>
              <p
                className={cn(
                  'mt-2 text-2xl font-bold tracking-tight tabular-nums sm:text-3xl',
                  summary.net > 0
                    ? 'text-income-600 dark:text-income-400'
                    : summary.net < 0
                      ? 'text-expense-600 dark:text-expense-400'
                      : 'text-ink',
                )}
              >
                {summary.net > 0 ? `+${formatRupiah(animatedNet)}` : formatRupiah(animatedNet)}
              </p>
            </div>

            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
                cashFlowBadge.cls,
              )}
            >
              <CashFlowIcon size={14} strokeWidth={2} aria-hidden />
              {cashFlowBadge.label}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line/60 pt-3">
            <ChangeChip percent={summary.previous.net_change_percent} />
            <span className="text-xs text-ink-soft">{basisText}</span>
          </div>
        </Card>

        {/* Total Pemasukan */}
        <Card className="flex flex-col justify-between p-5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold tracking-wide text-ink-soft uppercase">
                Total Pemasukan
              </p>
              <TrendingUp size={16} className="text-income-500" aria-hidden />
            </div>
            <p className="mt-2 text-xl font-bold tracking-tight text-ink tabular-nums sm:text-2xl">
              {formatRupiah(animatedIncome)}
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-1 border-t border-line/60 pt-3">
            <div>
              <ChangeChip percent={summary.previous.income_change_percent} />
            </div>
            <span className="text-[11px] text-ink-soft">{basisText}</span>
          </div>
        </Card>

        {/* Total Pengeluaran */}
        <Card className="flex flex-col justify-between p-5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold tracking-wide text-ink-soft uppercase">
                Total Pengeluaran
              </p>
              <TrendingDown size={16} className="text-expense-500" aria-hidden />
            </div>
            <p className="mt-2 text-xl font-bold tracking-tight text-ink tabular-nums sm:text-2xl">
              {formatRupiah(animatedExpense)}
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-1 border-t border-line/60 pt-3">
            <div>
              <ChangeChip percent={summary.previous.expense_change_percent} invertGood />
            </div>
            <span className="text-[11px] text-ink-soft">{basisText}</span>
          </div>
        </Card>
      </div>

      {/* Financial Snapshot */}
      {summary.has_data ? (
        <Card variant="subtle" className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-card text-brand-600 dark:text-brand-400">
                <Receipt size={18} strokeWidth={1.75} aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">
                  Potret Periode Ini
                </p>
                <p className="mt-0.5 text-xs text-ink-soft">
                  {summary.transaction_count} transaksi tercatat
                  {summary.income_used_percent !== null && (
                    <>
                      {' · '}
                      <span className="font-medium text-ink">
                        {summary.income_used_percent}%
                      </span>{' '}
                      pemasukan terpakai
                      {summary.income_remaining_percent !== null && summary.income_remaining_percent >= 0
                        ? ` (${summary.income_remaining_percent}% tersisa)`
                        : ''}
                    </>
                  )}
                </p>
              </div>
            </div>

            <Link
              to={`/transaksi?from=${from}&to=${to}`}
              className="inline-flex min-h-9 items-center text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
            >
              Lihat semua transaksi
            </Link>
          </div>

          {summary.income_used_percent !== null && (
            <div className="mt-3">
              <ProgressBar
                value={summary.expense}
                max={summary.income}
              />
            </div>
          )}
        </Card>
      ) : (
        <Card variant="subtle" className="flex flex-col items-center justify-center py-8 text-center">
          <span className="mb-2 inline-flex size-11 items-center justify-center rounded-xl bg-muted text-ink-soft">
            <Receipt size={20} strokeWidth={1.75} aria-hidden />
          </span>
          <p className="text-sm font-semibold text-ink">
            Belum ada transaksi pada periode ini
          </p>
          <p className="mt-1 max-w-md text-xs text-ink-soft">
            Catat pemasukan atau pengeluaran agar ringkasan dan pola keuangan Anda muncul di sini.
          </p>
        </Card>
      )}
    </div>
  )
}

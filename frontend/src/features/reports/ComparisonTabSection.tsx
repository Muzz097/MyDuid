import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  GitCompare,
  RefreshCw,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { formatRupiah } from '@/lib/money'
import type {
  ComparisonContributor,
  ReportComparisonResponse,
} from '@/features/reports/types'
import { comparisonBasisLabel, formatDateRangeId } from '@/features/reports/periodUtils'
import { useReportData } from '@/features/reports/useReportData'

export type ComparisonTabSectionProps = {
  from: string
  to: string
}

function PercentChip({
  percent,
  positiveIsGood,
}: {
  percent: number | null
  positiveIsGood: boolean
}) {
  if (percent === null) {
    return <span className="text-xs text-ink-subtle">—</span>
  }
  if (percent === 0) {
    return <span className="text-xs text-ink-soft">0%</span>
  }
  const up = percent > 0
  const good = positiveIsGood ? up : !up
  const Icon = up ? ArrowUpRight : ArrowDownRight
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-medium tabular-nums px-1.5 py-0.5 rounded-full',
        good
          ? 'bg-income-100 dark:bg-income-900/30 text-income-700 dark:text-income-300'
          : 'bg-expense-100 dark:bg-expense-900/30 text-expense-700 dark:text-expense-300',
      )}
    >
      <Icon size={12} strokeWidth={2} aria-hidden />
      {up ? `+${percent}%` : `${percent}%`}
    </span>
  )
}

function ComparisonMetricRow({
  label,
  current,
  previous,
  changePercent,
  positiveIsGood,
}: {
  label: string
  current: number
  previous: number
  changePercent: number | null
  positiveIsGood: boolean
}) {
  const delta = current - previous
  return (
    <div className="py-3 border-b border-surface-border last:border-0">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs text-ink-soft pt-0.5 shrink-0">{label}</span>
        <div className="flex flex-col items-end gap-1 min-w-0">
          <span className="text-sm font-semibold tabular-nums text-ink">
            {formatRupiah(current)}
          </span>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <span className="text-xs text-ink-subtle tabular-nums">
              vs {formatRupiah(previous)}
            </span>
            {delta !== 0 && (
              <span
                className={cn(
                  'text-xs tabular-nums',
                  delta > 0 === positiveIsGood
                    ? 'text-income-600 dark:text-income-400'
                    : 'text-expense-600 dark:text-expense-400',
                )}
              >
                {delta > 0 ? '+' : ''}
                {formatRupiah(delta)}
              </span>
            )}
            <PercentChip percent={changePercent} positiveIsGood={positiveIsGood} />
          </div>
        </div>
      </div>
    </div>
  )
}

function ContributorRow({
  item,
  from,
  to,
}: {
  item: ComparisonContributor
  from: string
  to: string
}) {
  const drillTo = `/transaksi?from=${from}&to=${to}&type=expense&category_id=${item.category_id}`
  const isUp = item.direction === 'up'
  return (
    <Link
      to={drillTo}
      className="flex items-center justify-between gap-3 py-2.5 px-1 rounded-lg hover:bg-surface-hover transition-colors"
    >
      <div className="min-w-0">
        <span className="text-sm text-ink truncate block">{item.name}</span>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-ink-subtle tabular-nums">
            Lalu: {formatRupiah(item.previous)}
          </span>
          <span className="text-xs text-ink-subtle">→</span>
          <span className="text-xs tabular-nums font-medium text-ink">
            {formatRupiah(item.current)}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span
          className={cn(
            'text-xs font-semibold tabular-nums',
            isUp
              ? 'text-expense-600 dark:text-expense-400'
              : 'text-income-600 dark:text-income-400',
          )}
        >
          {isUp ? '+' : ''}
          {formatRupiah(item.delta)}
        </span>
        <span
          className={cn(
            'inline-flex items-center gap-0.5 text-[11px] font-medium',
            isUp
              ? 'text-expense-600 dark:text-expense-400'
              : 'text-income-600 dark:text-income-400',
          )}
        >
          {isUp ? (
            <ArrowUpRight size={11} aria-hidden />
          ) : (
            <ArrowDownRight size={11} aria-hidden />
          )}
          {isUp ? 'Naik' : 'Turun'}
        </span>
      </div>
    </Link>
  )
}

function ComparisonSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
      <Card className="p-5 space-y-3">
        <Skeleton className="h-4 w-40" />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </Card>
      <Card className="p-5 space-y-2">
        <Skeleton className="h-4 w-56" />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </Card>
    </div>
  )
}

export function ComparisonTabSection({ from, to }: ComparisonTabSectionProps) {
  const { data, loading, error, retry } = useReportData<ReportComparisonResponse>(
    '/reports/comparison',
    { from, to },
  )

  if (loading) {
    return (
      <section aria-label="Perbandingan periode" className="space-y-4">
        <SectionHeader
          title="Bandingkan Periode"
          subtitle="Perbandingan dengan periode sebelumnya"
        />
        <ComparisonSkeleton />
      </section>
    )
  }

  if (error) {
    return (
      <section aria-label="Perbandingan periode" className="space-y-4">
        <SectionHeader
          title="Bandingkan Periode"
        />
        <Card className="p-5">
          <div className="flex flex-col items-center gap-3 text-center py-4">
            <AlertCircle size={24} className="text-expense-500" aria-hidden />
            <p className="text-sm text-ink-soft">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={retry}
              className="inline-flex items-center gap-2"
            >
              <RefreshCw size={14} aria-hidden />
              Coba lagi
            </Button>
          </div>
        </Card>
      </section>
    )
  }

  if (!data) {
    return null
  }

  const { period, comparison, income_change_percent, expense_change_percent, net_change_percent, contributors } = data

  const isEmptyPeriod =
    period.income === 0 &&
    period.expense === 0 &&
    comparison.income === 0 &&
    comparison.expense === 0

  const basisLabel = comparisonBasisLabel(comparison.basis, comparison.from, comparison.to)

  return (
    <section aria-label="Perbandingan periode" className="space-y-4">
      <SectionHeader
        title="Bandingkan Periode"
        subtitle={basisLabel}
      />

      {/* Period header cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-[11px] font-medium text-brand-600 dark:text-brand-400 mb-1">
            Periode ini
          </p>
          <p className="text-xs text-ink-soft leading-snug">
            {formatDateRangeId(period.from, period.to)}
          </p>
        </Card>
        <Card className="p-4" variant="subtle">
          <p className="text-[11px] font-medium text-ink-soft mb-1">Pembanding</p>
          <p className="text-xs text-ink-subtle leading-snug">
            {formatDateRangeId(comparison.from, comparison.to)}
          </p>
        </Card>
      </div>

      {/* Main metric comparison */}
      {isEmptyPeriod ? (
        <Card variant="subtle" className="p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <GitCompare size={32} className="text-ink-subtle" aria-hidden />
            <div>
              <p className="text-sm font-medium text-ink-soft">
                Belum ada data untuk dibandingkan
              </p>
              <p className="text-xs text-ink-subtle mt-0.5">
                Belum ada transaksi pada periode ini maupun periode pembanding.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-5">
          <ComparisonMetricRow
            label="Pemasukan"
            current={period.income}
            previous={comparison.income}
            changePercent={income_change_percent}
            positiveIsGood
          />
          <ComparisonMetricRow
            label="Pengeluaran"
            current={period.expense}
            previous={comparison.expense}
            changePercent={expense_change_percent}
            positiveIsGood={false}
          />
          <ComparisonMetricRow
            label="Arus Kas Bersih"
            current={period.net}
            previous={comparison.net}
            changePercent={net_change_percent}
            positiveIsGood
          />
        </Card>
      )}

      {/* Top contributors */}
      <div>
        <h3 className="text-sm font-semibold text-ink mb-3">
          Kategori yang Berubah Paling Signifikan
        </h3>
        {contributors.length > 0 ? (
          <Card className="px-4 py-2 divide-y divide-surface-border">
            {contributors.map((c) => (
              <ContributorRow key={c.category_id} item={c} from={from} to={to} />
            ))}
          </Card>
        ) : (
          <Card variant="subtle" className="p-6">
            <p className="text-sm text-ink-soft text-center">
              Tidak ada perbedaan kategori pengeluaran yang signifikan.
            </p>
          </Card>
        )}
      </div>
    </section>
  )
}

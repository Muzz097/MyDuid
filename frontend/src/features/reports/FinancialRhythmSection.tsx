import { useMemo, useState } from 'react'
import { AlertCircle, BarChart3, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { formatCompact, formatRupiah } from '@/lib/money'
import {
  diffDaysInclusive,
  formatDateRangeId,
  formatShortDateId,
} from '@/features/reports/periodUtils'
import type {
  CashFlowGranularity,
  ReportCashFlowBucket,
} from '@/features/reports/types'
import { useReportData } from '@/features/reports/useReportData'

export type FinancialRhythmSectionProps = {
  from: string
  to: string
}

type ChartRow = {
  label: string
  rangeLabel: string
  from: string
  to: string
  income: number
  expense: number
}

const GRANULARITY_OPTIONS: { key: CashFlowGranularity; label: string }[] = [
  { key: 'day', label: 'Harian' },
  { key: 'week', label: 'Mingguan' },
  { key: 'month', label: 'Bulanan' },
]

function formatBucketLabel(
  bucket: ReportCashFlowBucket,
  granularity: CashFlowGranularity,
): string {
  if (granularity === 'day') {
    return String(Number(bucket.from.slice(8, 10)))
  }
  if (granularity === 'month') {
    const [y, m] = bucket.from.slice(0, 7).split('-').map(Number)
    return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('id-ID', {
      month: 'short',
      timeZone: 'UTC',
    })
  }
  return formatShortDateId(bucket.from)
}

export function FinancialRhythmSection({ from, to }: FinancialRhythmSectionProps) {
  const navigate = useNavigate()
  const defaultGranularity: CashFlowGranularity =
    diffDaysInclusive(from, to) <= 31 ? 'day' : 'week'

  const [selectedGranularity, setSelectedGranularity] =
    useState<CashFlowGranularity | null>(null)
  const granularity = selectedGranularity ?? defaultGranularity

  const { data, loading, error, retry } = useReportData<ReportCashFlowBucket[]>(
    '/reports/cashflow',
    { from, to, granularity },
  )

  const chartData = useMemo<ChartRow[]>(() => {
    if (!data) return []
    return data.map((bucket) => ({
      label: formatBucketLabel(bucket, granularity),
      rangeLabel: formatDateRangeId(bucket.from, bucket.to),
      from: bucket.from,
      to: bucket.to,
      income: bucket.income,
      expense: bucket.expense,
    }))
  }, [data, granularity])

  const hasActivity = useMemo(
    () => chartData.some((row) => row.income > 0 || row.expense > 0),
    [chartData],
  )

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-3 border-b border-line/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader
          title="Financial Rhythm"
          subtitle="Pergerakan pemasukan dan pengeluaran pada periode terpilih"
        />

        <div
          role="group"
          aria-label="Interval grafik arus kas"
          className="inline-flex self-start rounded-[var(--radius-control)] bg-muted p-1"
        >
          {GRANULARITY_OPTIONS.map((opt) => {
            const active = granularity === opt.key
            return (
              <button
                key={opt.key}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedGranularity(opt.key)}
                className={cn(
                  'min-h-8 rounded-[var(--radius-control)] px-3 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                  active
                    ? 'bg-card font-semibold text-ink shadow-xs'
                    : 'text-ink-soft hover:text-ink',
                )}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {loading && !data ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-64 w-full" rounded="card" />
        </div>
      ) : error && !data ? (
        <div className="mt-4 flex flex-col items-start gap-3 rounded-[var(--radius-control)] border border-danger-200/70 bg-danger-100/30 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-danger-800/40 dark:bg-danger-950/20">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-danger-500" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-ink">Grafik arus kas gagal dimuat</p>
              <p className="text-xs text-ink-soft">{error}</p>
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={retry} className="gap-1.5">
            <RefreshCw size={14} aria-hidden />
            Coba lagi
          </Button>
        </div>
      ) : !hasActivity ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <span className="mb-2 inline-flex size-10 items-center justify-center rounded-xl bg-muted text-ink-soft">
            <BarChart3 size={20} strokeWidth={1.75} aria-hidden />
          </span>
          <p className="text-sm font-medium text-ink">Belum ada pergerakan arus kas</p>
          <p className="mt-0.5 text-xs text-ink-soft">
            Grafik akan terisi otomatis saat ada transaksi di rentang tanggal ini.
          </p>
        </div>
      ) : (
        <div className="mt-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-soft">
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-income-500" aria-hidden />
                Pemasukan
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-expense-500" aria-hidden />
                Pengeluaran
              </span>
            </div>
            <span>Klik batang grafik untuk melihat transaksi</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
                onClick={(state) => {
                  const idx = state?.activeTooltipIndex
                  if (typeof idx === 'number' && chartData[idx]) {
                    const row = chartData[idx]
                    navigate(`/transaksi?from=${row.from}&to=${row.to}`)
                  }
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--color-line)"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'var(--color-ink-soft)', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={16}
                />
                <YAxis
                  tickFormatter={(v: number) => formatCompact(v).replace('Rp', '')}
                  tick={{ fill: 'var(--color-ink-soft)', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={56}
                />
                <Tooltip
                  cursor={{ fill: 'var(--color-muted)', opacity: 0.45 }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const row = payload[0]?.payload as ChartRow | undefined
                    if (!row) return null
                    return (
                      <div className="rounded-[var(--radius-control)] border border-line bg-card px-3 py-2 text-xs shadow-md">
                        <p className="font-semibold text-ink">{row.rangeLabel}</p>
                        <div className="mt-1.5 space-y-1 tabular-nums">
                          <p className="flex items-center justify-between gap-4 text-income-600 dark:text-income-400">
                            <span>Pemasukan</span>
                            <span className="font-semibold">{formatRupiah(row.income)}</span>
                          </p>
                          <p className="flex items-center justify-between gap-4 text-expense-600 dark:text-expense-400">
                            <span>Pengeluaran</span>
                            <span className="font-semibold">{formatRupiah(row.expense)}</span>
                          </p>
                        </div>
                      </div>
                    )
                  }}
                />
                <Bar
                  dataKey="income"
                  name="Pemasukan"
                  fill="var(--color-income-500)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={24}
                  className="cursor-pointer"
                />
                <Bar
                  dataKey="expense"
                  name="Pengeluaran"
                  fill="var(--color-expense-500)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={24}
                  className="cursor-pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </Card>
  )
}

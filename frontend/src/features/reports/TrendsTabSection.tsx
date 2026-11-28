import { useMemo, useState } from 'react'
import {
  AlertCircle,
  BarChart3,
  CalendarClock,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
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
import type { ReportTrendsResponse } from '@/features/reports/types'
import { useReportData } from '@/features/reports/useReportData'

const MONTH_OPTIONS = [3, 6, 12] as const

const WEEKDAY_LABELS: Record<string, { short: string; full: string }> = {
  monday: { short: 'Sen', full: 'Senin' },
  tuesday: { short: 'Sel', full: 'Selasa' },
  wednesday: { short: 'Rab', full: 'Rabu' },
  thursday: { short: 'Kam', full: 'Kamis' },
  friday: { short: 'Jum', full: 'Jumat' },
  saturday: { short: 'Sab', full: 'Sabtu' },
  sunday: { short: 'Min', full: 'Minggu' },
}

function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('id-ID', {
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC',
  })
}

function formatFullMonthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export type TrendsTabSectionProps = {
  months?: number
  onChangeMonths?: (months: number) => void
}

export function TrendsTabSection({
  months: controlledMonths,
  onChangeMonths,
}: TrendsTabSectionProps = {}) {
  const [internalMonths, setInternalMonths] = useState<number>(6)
  const months = controlledMonths ?? internalMonths
  const setMonths = onChangeMonths ?? setInternalMonths
  const { data, loading, error, retry } = useReportData<ReportTrendsResponse>(
    '/reports/trends',
    { months },
  )

  const monthlyChartData = useMemo(() => {
    if (!data) return []
    return data.monthly.map((m) => ({
      label: formatMonthLabel(m.month),
      fullLabel: m.is_partial
        ? `${formatFullMonthLabel(m.month)} (berjalan)`
        : formatFullMonthLabel(m.month),
      income: m.income,
      expense: m.expense,
      isPartial: m.is_partial,
    }))
  }, [data])

  const weekdayChartData = useMemo(() => {
    if (!data) return []
    return data.weekday_rhythm.map((w) => {
      const labels = WEEKDAY_LABELS[w.key] ?? { short: w.key, full: w.key }
      return {
        label: labels.short,
        fullLabel: labels.full,
        average: w.average_per_occurrence,
        total: w.total,
        count: w.count,
      }
    })
  }, [data])

  const hasMonthlyActivity = monthlyChartData.some(
    (m) => m.income > 0 || m.expense > 0,
  )
  const hasWeekdayActivity = weekdayChartData.some((w) => w.total > 0)

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader
          title="Tren Keuangan"
          subtitle="Pergerakan pemasukan, pengeluaran, dan ritme mingguan lintas bulan"
        />

        <div
          role="group"
          aria-label="Rentang bulan tren"
          className="inline-flex self-start rounded-[var(--radius-control)] bg-muted p-1"
        >
          {MONTH_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              aria-pressed={months === opt}
              onClick={() => setMonths(opt)}
              className={cn(
                'min-h-9 rounded-[var(--radius-control)] px-3 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                months === opt
                  ? 'bg-card font-semibold text-ink shadow-xs'
                  : 'text-ink-soft hover:text-ink',
              )}
            >
              {opt} bulan
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <div className="space-y-4">
          <Skeleton className="h-72 w-full" rounded="card" />
          <div className="grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-24" rounded="card" />
            <Skeleton className="h-24" rounded="card" />
            <Skeleton className="h-24" rounded="card" />
          </div>
          <Skeleton className="h-64 w-full" rounded="card" />
        </div>
      ) : error && !data ? (
        <Card className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-danger-500" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-ink">Data tren gagal dimuat</p>
              <p className="text-xs text-ink-soft">{error}</p>
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={retry} className="gap-1.5">
            <RefreshCw size={14} aria-hidden />
            Coba lagi
          </Button>
        </Card>
      ) : data ? (
        <>
          {/* A. Tren Bulanan */}
          <Card className="p-5">
            <div className="border-b border-line/60 pb-3">
              <h3 className="text-sm font-semibold text-ink">
                Pemasukan vs Pengeluaran Bulanan
              </h3>
              <p className="text-xs text-ink-soft">
                {months} bulan terakhir (bulan berjalan ditandai sebagai parsial)
              </p>
            </div>

            {!hasMonthlyActivity ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="mb-2 inline-flex size-10 items-center justify-center rounded-xl bg-muted text-ink-soft">
                  <BarChart3 size={20} strokeWidth={1.75} aria-hidden />
                </span>
                <p className="text-sm font-medium text-ink">
                  Belum ada data tren bulanan
                </p>
                <p className="mt-0.5 text-xs text-ink-soft">
                  Catat transaksi di beberapa bulan agar grafik tren dapat ditampilkan.
                </p>
              </div>
            ) : (
              <div className="mt-4">
                <div className="mb-3 flex items-center gap-4 text-xs text-ink-soft">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-income-500" aria-hidden />
                    Pemasukan
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-expense-500" aria-hidden />
                    Pengeluaran
                  </span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyChartData}
                      margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
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
                          const row = payload[0]?.payload as (typeof monthlyChartData)[number] | undefined
                          if (!row) return null
                          return (
                            <div className="rounded-[var(--radius-control)] border border-line bg-card px-3 py-2 text-xs shadow-md">
                              <p className="font-semibold text-ink">{row.fullLabel}</p>
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
                        maxBarSize={28}
                      />
                      <Bar
                        dataKey="expense"
                        name="Pengeluaran"
                        fill="var(--color-expense-500)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={28}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </Card>

          {/* B. Highlight Tren (berdasarkan bulan penuh yang memiliki pengeluaran) */}
          {(data.average_expense !== null ||
            data.highest_expense_month !== null ||
            data.lowest_expense_month !== null) && (
            <div className="grid gap-3 sm:grid-cols-3">
              {data.average_expense !== null && (
                <Card variant="subtle" className="p-4">
                  <p className="text-xs font-medium text-ink-soft">
                    Rata-rata pengeluaran / bulan
                  </p>
                  <p className="mt-1.5 text-lg font-bold text-ink tabular-nums">
                    {formatRupiah(data.average_expense)}
                  </p>
                  {data.month_over_month_change_percent !== null && (
                    <p className="mt-1 text-[11px] text-ink-soft tabular-nums">
                      Bulan penuh terakhir:{' '}
                      {data.month_over_month_change_percent > 0
                        ? `naik ${data.month_over_month_change_percent}%`
                        : data.month_over_month_change_percent < 0
                          ? `turun ${Math.abs(data.month_over_month_change_percent)}%`
                          : 'sama (0%)'}
                    </p>
                  )}
                </Card>
              )}

              {data.highest_expense_month && (
                <Card variant="subtle" className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-ink-soft">
                      Pengeluaran tertinggi
                    </p>
                    <TrendingUp size={15} className="text-expense-500" aria-hidden />
                  </div>
                  <p className="mt-1.5 text-lg font-bold text-ink tabular-nums">
                    {formatRupiah(data.highest_expense_month.expense)}
                  </p>
                  <p className="mt-1 text-xs text-ink-soft">
                    {formatFullMonthLabel(data.highest_expense_month.month)}
                  </p>
                </Card>
              )}

              {data.lowest_expense_month && (
                <Card variant="subtle" className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-ink-soft">
                      Pengeluaran terendah
                    </p>
                    <TrendingDown size={15} className="text-income-500" aria-hidden />
                  </div>
                  <p className="mt-1.5 text-lg font-bold text-ink tabular-nums">
                    {formatRupiah(data.lowest_expense_month.expense)}
                  </p>
                  <p className="mt-1 text-xs text-ink-soft">
                    {formatFullMonthLabel(data.lowest_expense_month.month)}
                  </p>
                </Card>
              )}
            </div>
          )}

          {/* C. Spending Rhythm (rata-rata pengeluaran per hari dalam seminggu) */}
          <Card className="p-5">
            <div className="border-b border-line/60 pb-3">
              <h3 className="text-sm font-semibold text-ink">
                Spending Rhythm Mingguan
              </h3>
              <p className="text-xs text-ink-soft">
                Rata-rata pengeluaran per hari dalam seminggu selama {months} bulan terakhir
              </p>
            </div>

            {!hasWeekdayActivity ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <span className="mb-2 inline-flex size-10 items-center justify-center rounded-xl bg-muted text-ink-soft">
                  <CalendarClock size={20} strokeWidth={1.75} aria-hidden />
                </span>
                <p className="text-sm font-medium text-ink">
                  Belum ada pola pengeluaran mingguan
                </p>
                <p className="mt-0.5 text-xs text-ink-soft">
                  Ritme pengeluaran harian akan muncul setelah ada transaksi pengeluaran.
                </p>
              </div>
            ) : (
              <div className="mt-4 h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={weekdayChartData}
                    margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
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
                        const row = payload[0]?.payload as (typeof weekdayChartData)[number] | undefined
                        if (!row) return null
                        return (
                          <div className="rounded-[var(--radius-control)] border border-line bg-card px-3 py-2 text-xs shadow-md">
                            <p className="font-semibold text-ink">{row.fullLabel}</p>
                            <div className="mt-1 space-y-0.5 tabular-nums text-ink-soft">
                              <p>
                                Rata-rata:{' '}
                                <span className="font-semibold text-ink">
                                  {formatRupiah(row.average)}
                                </span>
                              </p>
                              <p>Total: {formatRupiah(row.total)}</p>
                              <p>{row.count} transaksi</p>
                            </div>
                          </div>
                        )
                      }}
                    />
                    <Bar
                      dataKey="average"
                      name="Rata-rata"
                      fill="var(--color-brand-500)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={32}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </>
      ) : null}
    </div>
  )
}

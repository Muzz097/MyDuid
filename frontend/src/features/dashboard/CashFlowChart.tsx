import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { formatCompact, formatRupiah } from '@/lib/money'
import { cn } from '@/lib/cn'
import type { DailyCashFlowItem } from '@/types'

export interface CashFlowChartProps {
  data: DailyCashFlowItem[]
  loading?: boolean
  className?: string
}

type PeriodMode = 'daily' | 'weekly'

interface WeeklyCashFlowItem {
  weekLabel: string
  dateRange: string
  income: number
  expense: number
}

function groupIntoWeeks(dailyData: DailyCashFlowItem[]): WeeklyCashFlowItem[] {
  if (!dailyData.length) return []

  // Group by Monday-based week
  const weeks: WeeklyCashFlowItem[] = []
  let currentWeekDays: DailyCashFlowItem[] = []
  let currentWeekNumber = 1

  for (let i = 0; i < dailyData.length; i++) {
    const item = dailyData[i]
    currentWeekDays.push(item)

    // Check day of week: Date in local time or parse parts
    const [y, m, d] = item.date.split('-').map(Number)
    const dateObj = new Date(y, m - 1, d)
    const dayOfWeek = dateObj.getDay() // 0 is Sunday, 1 is Monday

    const isSunday = dayOfWeek === 0
    const isLastItem = i === dailyData.length - 1

    if (isSunday || isLastItem) {
      const firstDay = currentWeekDays[0]
      const lastDay = currentWeekDays[currentWeekDays.length - 1]

      const firstD = firstDay.date.split('-')[2]
      const lastD = lastDay.date.split('-')[2]

      const weekIncome = currentWeekDays.reduce((acc, curr) => acc + curr.income, 0)
      const weekExpense = currentWeekDays.reduce((acc, curr) => acc + curr.expense, 0)

      weeks.push({
        weekLabel: `Mgg ${currentWeekNumber}`,
        dateRange: `Tgl ${Number(firstD)} - ${Number(lastD)}`,
        income: weekIncome,
        expense: weekExpense,
      })

      currentWeekNumber++
      currentWeekDays = []
    }
  }

  return weeks
}

export function CashFlowChart({
  data,
  loading = false,
  className,
}: CashFlowChartProps) {
  const [mode, setMode] = useState<PeriodMode>('daily')

  const weeklyData = useMemo(() => groupIntoWeeks(data), [data])

  const chartData = useMemo(() => {
    if (mode === 'weekly') {
      return weeklyData.map((w) => ({
        label: w.weekLabel,
        subLabel: w.dateRange,
        income: w.income,
        expense: w.expense,
      }))
    }

    return data.map((d) => {
      const day = d.date.split('-')[2]
      return {
        label: `${Number(day)}`,
        subLabel: d.date,
        income: d.income,
        expense: d.expense,
      }
    })
  }, [mode, data, weeklyData])

  const hasActivity = useMemo(() => {
    return data.some((item) => item.income > 0 || item.expense > 0)
  }, [data])

  return (
    <Card className={cn('flex flex-col p-5', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-line/60 pb-4">
        <SectionHeader
          title="Grafik Arus Kas"
          subtitle={
            mode === 'daily'
              ? 'Pemasukan dan pengeluaran harian'
              : 'Akumulasi pemasukan dan pengeluaran per minggu'
          }
          className="mb-0"
        />

        {/* Segmented control for Daily vs Weekly */}
        <div
          role="group"
          aria-label="Pilihan periode grafik"
          className="inline-flex items-center rounded-xl bg-muted/80 p-1 border border-line/40 self-start sm:self-auto"
        >
          <button
            type="button"
            onClick={() => setMode('daily')}
            className={cn(
              'rounded-lg px-3 py-1 text-xs font-semibold transition-all duration-150',
              mode === 'daily'
                ? 'bg-card text-ink shadow-xs'
                : 'text-ink-soft hover:text-ink',
            )}
          >
            Harian
          </button>
          <button
            type="button"
            onClick={() => setMode('weekly')}
            className={cn(
              'rounded-lg px-3 py-1 text-xs font-semibold transition-all duration-150',
              mode === 'weekly'
                ? 'bg-card text-ink shadow-xs'
                : 'text-ink-soft hover:text-ink',
            )}
          >
            Mingguan
          </button>
        </div>
      </div>

      <div className="relative mt-5 h-64 w-full">
        {loading ? (
          <div className="flex size-full items-center justify-center text-xs text-ink-soft">
            Memuat grafik...
          </div>
        ) : !hasActivity ? (
          <div className="flex size-full flex-col items-center justify-center text-center p-6">
            <p className="text-sm font-medium text-ink">Belum ada arus kas bulan ini</p>
            <p className="mt-1 max-w-xs text-xs text-ink-soft">
              Grafik harian dan mingguan akan langsung terisi saat Anda mulai mencatat transaksi.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              barGap={2}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--color-line)"
                opacity={0.6}
              />
              <XAxis
                dataKey="label"
                stroke="var(--color-ink-soft)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--color-ink-soft)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val: number) => (val === 0 ? '0' : formatCompact(val))}
              />
              <Tooltip
                cursor={{ fill: 'var(--color-muted)', opacity: 0.4 }}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null
                  const item = payload[0].payload as {
                    label: string
                    subLabel: string
                    income: number
                    expense: number
                  }

                  return (
                    <div className="rounded-xl border border-line bg-card p-3 shadow-lg text-xs">
                      <p className="font-semibold text-ink">
                        {mode === 'daily' ? `Tanggal ${item.subLabel}` : `${item.label} (${item.subLabel})`}
                      </p>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-ink-soft">
                            <span className="size-2 rounded-full bg-income-500" />
                            Pemasukan
                          </span>
                          <span className="font-semibold tabular-nums text-income-600 dark:text-income-400">
                            {formatRupiah(item.income)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-ink-soft">
                            <span className="size-2 rounded-full bg-expense-500" />
                            Pengeluaran
                          </span>
                          <span className="font-semibold tabular-nums text-expense-600 dark:text-expense-400">
                            {formatRupiah(item.expense)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                formatter={(val: string) => (
                  <span className="text-ink-soft capitalize">
                    {val === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                  </span>
                )}
              />
              <Bar
                dataKey="income"
                name="income"
                fill="var(--color-income-500)"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
              <Bar
                dataKey="expense"
                name="expense"
                fill="var(--color-expense-500)"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  )
}

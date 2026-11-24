import { useMemo, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { MoneyText } from '@/components/ui/MoneyText'
import { getIcon } from '@/lib/icons'
import { formatCompact, formatRupiah } from '@/lib/money'
import { cn } from '@/lib/cn'
import type { CategorySummaryItem, TransactionType } from '@/types'

export interface CategoryCompositionProps {
  incomeCategories: CategorySummaryItem[]
  expenseCategories: CategorySummaryItem[]
  balanceHidden?: boolean
  onAddTransaction?: (type: TransactionType) => void
  className?: string
}

const EXPENSE_COLORS = [
  'var(--color-expense-500)',
  'var(--color-expense-600)',
  'var(--color-warn-500)',
  'var(--color-brand-500)',
  'var(--color-brand-600)',
  'var(--color-info-500)',
  'var(--color-brand-400)',
]

const INCOME_COLORS = [
  'var(--color-income-500)',
  'var(--color-income-600)',
  'var(--color-brand-500)',
  'var(--color-info-500)',
  'var(--color-income-400)',
  'var(--color-brand-400)',
]

export function CategoryComposition({
  incomeCategories,
  expenseCategories,
  balanceHidden = false,
  onAddTransaction,
  className,
}: CategoryCompositionProps) {
  const [selectedType, setSelectedType] = useState<TransactionType>('expense')
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const activeCategories = selectedType === 'expense' ? expenseCategories : incomeCategories
  const palette = selectedType === 'expense' ? EXPENSE_COLORS : INCOME_COLORS

  const totalAmount = useMemo(() => {
    return activeCategories.reduce((sum, item) => sum + item.amount, 0)
  }, [activeCategories])

  const selectedCategory = activeIndex !== null && activeCategories[activeIndex]
    ? activeCategories[activeIndex]
    : null

  const selectedPercent = selectedCategory && totalAmount > 0
    ? Math.round((selectedCategory.amount / totalAmount) * 100)
    : null

  return (
    <Card className={cn('flex flex-col p-5', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-line/60 pb-4">
        <SectionHeader
          title="Komposisi Kategori"
          subtitle={
            selectedType === 'expense'
              ? 'Sebaran pos pengeluaran bulan ini'
              : 'Sebaran sumber pemasukan bulan ini'
          }
          className="mb-0"
        />

        {/* Tab segmented control */}
        <div
          role="group"
          aria-label="Pilihan jenis transaksi komposisi"
          className="inline-flex items-center rounded-xl bg-muted/80 p-1 border border-line/40 self-start sm:self-auto"
        >
          <button
            type="button"
            onClick={() => {
              setSelectedType('expense')
              setActiveIndex(null)
            }}
            className={cn(
              'rounded-lg px-3 py-1 text-xs font-semibold transition-all duration-150',
              selectedType === 'expense'
                ? 'bg-card text-expense-600 shadow-xs dark:text-expense-400'
                : 'text-ink-soft hover:text-ink',
            )}
          >
            Pengeluaran
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedType('income')
              setActiveIndex(null)
            }}
            className={cn(
              'rounded-lg px-3 py-1 text-xs font-semibold transition-all duration-150',
              selectedType === 'income'
                ? 'bg-card text-income-600 shadow-xs dark:text-income-400'
                : 'text-ink-soft hover:text-ink',
            )}
          >
            Pemasukan
          </button>
        </div>
      </div>

      {activeCategories.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
          <p className="text-sm font-medium text-ink">
            {selectedType === 'expense'
              ? 'Belum ada pengeluaran di bulan ini'
              : 'Belum ada pemasukan di bulan ini'}
          </p>
          <p className="mt-1 max-w-xs text-xs text-ink-soft">
            {selectedType === 'expense'
              ? 'Catat pengeluaran Anda untuk melihat kategori mana yang paling dominan.'
              : 'Catat pemasukan seperti gaji, bisnis, atau bonus untuk melihat sebarannya.'}
          </p>
          {onAddTransaction && (
            <Button
              size="sm"
              variant="outline"
              className="mt-4"
              onClick={() => onAddTransaction(selectedType)}
              leftIcon={<Plus size={14} />}
            >
              {selectedType === 'expense' ? 'Catat Pengeluaran' : 'Catat Pemasukan'}
            </Button>
          )}
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-5">
          {/* Donut Chart area */}
          <div className="relative mx-auto h-48 w-full max-w-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  formatter={(val: unknown) => [
                    formatRupiah(Number(val) || 0),
                    selectedType === 'expense' ? 'Pengeluaran' : 'Pemasukan',
                  ]}
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    borderColor: 'var(--color-line)',
                    borderRadius: 'var(--radius-control)',
                    color: 'var(--color-ink)',
                    fontSize: '12px',
                  }}
                />
                <Pie
                  data={activeCategories}
                  dataKey="amount"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={3}
                  stroke="none"
                  isAnimationActive
                  animationDuration={500}
                  onClick={(_, index) => {
                    setActiveIndex(activeIndex === index ? null : index)
                  }}
                >
                  {activeCategories.map((entry, index) => {
                    const isSelected = activeIndex === index
                    return (
                      <Cell
                        key={entry.category_id}
                        fill={palette[index % palette.length]}
                        className="cursor-pointer transition-transform duration-200"
                        style={{
                          transform: isSelected ? 'scale(1.06)' : 'scale(1)',
                          transformOrigin: 'center center',
                          outline: 'none',
                        }}
                      />
                    )
                  })}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Center label */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
              {selectedCategory ? (
                <>
                  <p className="line-clamp-1 text-[11px] font-semibold text-ink-soft">
                    {selectedCategory.name}
                  </p>
                  <p
                    className={cn(
                      'tabular-nums text-sm font-bold',
                      selectedType === 'expense'
                        ? 'text-expense-600 dark:text-expense-400'
                        : 'text-income-600 dark:text-income-400',
                    )}
                  >
                    {selectedPercent}%
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
                    Total
                  </p>
                  <p
                    className={cn(
                      'tabular-nums text-sm font-bold',
                      selectedType === 'expense'
                        ? 'text-expense-600 dark:text-expense-400'
                        : 'text-income-600 dark:text-income-400',
                    )}
                  >
                    {balanceHidden ? 'Rp ••••••' : formatCompact(totalAmount)}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Category items breakdown */}
          <div className="divide-y divide-line/60 border-t border-line/60 pt-2">
            {activeCategories.slice(0, 5).map((entry, index) => {
              const LegendIcon = getIcon(entry.icon_key ?? 'default')
              const percent = totalAmount > 0 ? Math.round((entry.amount / totalAmount) * 100) : 0
              const isSelected = activeIndex === index

              return (
                <button
                  type="button"
                  key={entry.category_id}
                  onClick={() => setActiveIndex(isSelected ? null : index)}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 py-2 text-left text-xs transition duration-150 rounded-lg px-2 -mx-2',
                    isSelected ? 'bg-muted/70 font-semibold' : 'hover:bg-muted/40',
                  )}
                >
                  <span className="inline-flex min-w-0 items-center gap-2 text-ink">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor: palette[index % palette.length],
                      }}
                      aria-hidden
                    />
                    <span
                      className={cn(
                        'inline-flex size-6 shrink-0 items-center justify-center rounded-md',
                        selectedType === 'expense'
                          ? 'bg-expense-50 text-expense-600 dark:bg-expense-950/40 dark:text-expense-400'
                          : 'bg-income-50 text-income-600 dark:bg-income-950/40 dark:text-income-400',
                      )}
                    >
                      <LegendIcon size={14} strokeWidth={1.8} aria-hidden />
                    </span>
                    <span className="truncate font-medium">{entry.name}</span>
                    <span className="text-[11px] text-ink-soft">({percent}%)</span>
                  </span>
                  <MoneyText
                    amount={entry.amount}
                    type={selectedType}
                    className="tabular-nums text-xs font-semibold shrink-0"
                    hidden={balanceHidden}
                  />
                </button>
              )
            })}
          </div>
        </div>
      )}
    </Card>
  )
}

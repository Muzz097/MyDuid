import { useState } from 'react'
import { Eye, EyeOff, TrendingDown, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { IconButton } from '@/components/ui/IconButton'
import { MoneyText } from '@/components/ui/MoneyText'
import { cn } from '@/lib/cn'

export type FinancialSummaryProps = {
  totalBalance: number
  income: number
  expense: number
  balanceHidden?: boolean
  onToggleHide?: () => void
  className?: string
}

export function FinancialSummary({
  totalBalance,
  income,
  expense,
  balanceHidden = false,
  onToggleHide,
  className,
}: FinancialSummaryProps) {
  const [internalHidden, setInternalHidden] = useState(false)
  const isHidden = onToggleHide ? balanceHidden : internalHidden
  const handleToggle = onToggleHide ?? (() => setInternalHidden((prev) => !prev))

  return (
    <Card
      className={cn(
        'relative overflow-hidden border border-line bg-gradient-to-br from-card via-card to-brand-50/20 p-5 lg:p-6',
        className,
      )}
    >
      <div className="flex flex-col gap-6">
        {/* Top: Total Saldo */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Total Saldo Bersih
              </span>
              <span className="inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                Semua Dompet
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <MoneyText
                amount={totalBalance}
                type="neutral"
                hidden={isHidden}
                className="text-3xl font-bold tracking-tight sm:text-4xl tabular-nums"
              />
            </div>
          </div>

          <IconButton
            label={isHidden ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
            onClick={handleToggle}
            variant="ghost"
            size="md"
            icon={
              <span className="relative inline-flex size-5">
                <Eye
                  size={20}
                  strokeWidth={1.75}
                  aria-hidden
                  className={cn(
                    'absolute inset-0 transition duration-200',
                    isHidden ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100',
                  )}
                />
                <EyeOff
                  size={20}
                  strokeWidth={1.75}
                  aria-hidden
                  className={cn(
                    'absolute inset-0 transition duration-200',
                    isHidden ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0',
                  )}
                />
              </span>
            }
          />
        </div>

        {/* Divider with subtle styling */}
        <div className="grid grid-cols-2 gap-4 border-t border-line/70 pt-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-income-50 text-income-600 dark:bg-income-950/40 dark:text-income-400">
              <TrendingUp size={18} strokeWidth={2} aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-ink-soft">Pemasukan Bulan Ini</p>
              <MoneyText
                amount={income}
                type="income"
                hidden={isHidden}
                className="mt-0.5 text-base font-bold tabular-nums"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 border-l border-line/70 pl-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-expense-50 text-expense-500 dark:bg-expense-950/40 dark:text-expense-400">
              <TrendingDown size={18} strokeWidth={2} aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-ink-soft">Pengeluaran Bulan Ini</p>
              <MoneyText
                amount={expense}
                type="expense"
                hidden={isHidden}
                className="mt-0.5 text-base font-bold tabular-nums"
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

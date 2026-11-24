import { ArrowDownLeft, ArrowUpRight, Scale } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { MoneyText } from '@/components/ui/MoneyText'
import { cn } from '@/lib/cn'

export interface MonthlySummaryCardsProps {
  income: number
  expense: number
  balanceHidden?: boolean
  className?: string
}

export function MonthlySummaryCards({
  income,
  expense,
  balanceHidden = false,
  className,
}: MonthlySummaryCardsProps) {
  const netCashFlow = income - expense

  return (
    <div className={cn('grid grid-cols-1 gap-3.5 sm:grid-cols-3', className)}>
      {/* 1. Pemasukan */}
      <Card
        className="group relative flex flex-col justify-between overflow-hidden border border-line bg-card p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-xs"
        variant="subtle"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-ink-soft">Pemasukan</span>
          <span className="flex size-7 items-center justify-center rounded-lg bg-income-50 text-income-600 transition group-hover:scale-110 dark:bg-income-950/40 dark:text-income-400">
            <ArrowDownLeft size={16} strokeWidth={2.25} aria-hidden />
          </span>
        </div>
        <div className="mt-3">
          <MoneyText
            amount={income}
            type="income"
            hidden={balanceHidden}
            className="text-lg font-bold tracking-tight sm:text-xl tabular-nums text-income-600 dark:text-income-400"
          />
          <p className="mt-0.5 text-[11px] text-ink-soft">Bulan ini</p>
        </div>
      </Card>

      {/* 2. Pengeluaran */}
      <Card
        className="group relative flex flex-col justify-between overflow-hidden border border-line bg-card p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-xs"
        variant="subtle"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-ink-soft">Pengeluaran</span>
          <span className="flex size-7 items-center justify-center rounded-lg bg-expense-50 text-expense-600 transition group-hover:scale-110 dark:bg-expense-950/40 dark:text-expense-400">
            <ArrowUpRight size={16} strokeWidth={2.25} aria-hidden />
          </span>
        </div>
        <div className="mt-3">
          <MoneyText
            amount={expense}
            type="expense"
            hidden={balanceHidden}
            className="text-lg font-bold tracking-tight sm:text-xl tabular-nums text-expense-600 dark:text-expense-400"
          />
          <p className="mt-0.5 text-[11px] text-ink-soft">Bulan ini</p>
        </div>
      </Card>

      {/* 3. Arus Kas Bersih */}
      <Card
        className="group relative flex flex-col justify-between overflow-hidden border border-line bg-card p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-xs"
        variant="subtle"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-ink-soft">Arus Kas Bersih</span>
          <span
            className={cn(
              'flex size-7 items-center justify-center rounded-lg transition group-hover:scale-110',
              netCashFlow >= 0
                ? 'bg-income-50 text-income-600 dark:bg-income-950/40 dark:text-income-400'
                : 'bg-expense-50 text-expense-600 dark:bg-expense-950/40 dark:text-expense-400',
            )}
          >
            <Scale size={16} strokeWidth={2} aria-hidden />
          </span>
        </div>
        <div className="mt-3">
          <MoneyText
            amount={Math.abs(netCashFlow)}
            type={netCashFlow >= 0 ? 'income' : 'expense'}
            hidden={balanceHidden}
            className={cn(
              'text-lg font-bold tracking-tight sm:text-xl tabular-nums',
              netCashFlow >= 0
                ? 'text-income-600 dark:text-income-400'
                : 'text-expense-600 dark:text-expense-400',
            )}
          />
          <p className="mt-0.5 text-[11px] text-ink-soft">
            {netCashFlow >= 0 ? 'Surplus (Pemasukan > Pengeluaran)' : 'Defisit (Pengeluaran > Pemasukan)'}
          </p>
        </div>
      </Card>
    </div>
  )
}

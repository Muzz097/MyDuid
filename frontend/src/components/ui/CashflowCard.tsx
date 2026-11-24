import { ArrowDownLeft, ArrowUpRight, Scale } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { MoneyText } from '@/components/ui/MoneyText'
import { cn } from '@/lib/cn'

export interface CashflowCardProps {
  income: number
  expense: number
  hidden?: boolean
  className?: string
}

export function CashflowCard({
  income,
  expense,
  hidden = false,
  className,
}: CashflowCardProps) {
  const netCashFlow = income - expense

  return (
    <Card
      className={cn(
        'grid grid-cols-1 gap-0 overflow-hidden p-0 sm:grid-cols-3',
        className,
      )}
      variant="subtle"
    >
      <div className="flex flex-col justify-between p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-ink-soft">Pemasukan</span>
          <span className="flex size-7 items-center justify-center rounded-lg bg-income-50 text-income-600 dark:bg-income-950/40 dark:text-income-400">
            <ArrowDownLeft size={16} strokeWidth={2.25} aria-hidden />
          </span>
        </div>
        <div className="mt-3">
          <MoneyText
            amount={income}
            type="income"
            hidden={hidden}
            className="text-lg font-bold tracking-tight tabular-nums text-income-600 dark:text-income-400"
          />
          <p className="mt-0.5 text-[11px] text-ink-soft">Bulan ini</p>
        </div>
      </div>

      <div className="flex flex-col justify-between border-t border-line p-4 sm:border-t-0 sm:border-l">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-ink-soft">Pengeluaran</span>
          <span className="flex size-7 items-center justify-center rounded-lg bg-expense-50 text-expense-600 dark:bg-expense-950/40 dark:text-expense-400">
            <ArrowUpRight size={16} strokeWidth={2.25} aria-hidden />
          </span>
        </div>
        <div className="mt-3">
          <MoneyText
            amount={expense}
            type="expense"
            hidden={hidden}
            className="text-lg font-bold tracking-tight tabular-nums text-expense-600 dark:text-expense-400"
          />
          <p className="mt-0.5 text-[11px] text-ink-soft">Bulan ini</p>
        </div>
      </div>

      <div className="flex flex-col justify-between border-t border-line p-4 sm:border-t-0 sm:border-l">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-ink-soft">Arus Kas Bersih</span>
          <span
            className={cn(
              'flex size-7 items-center justify-center rounded-lg',
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
            hidden={hidden}
            className={cn(
              'text-lg font-bold tracking-tight tabular-nums',
              netCashFlow >= 0
                ? 'text-income-600 dark:text-income-400'
                : 'text-expense-600 dark:text-expense-400',
            )}
          />
          <p className="mt-0.5 text-[11px] text-ink-soft">
            {netCashFlow >= 0
              ? 'Surplus (Pemasukan > Pengeluaran)'
              : 'Defisit (Pengeluaran > Pemasukan)'}
          </p>
        </div>
      </div>
    </Card>
  )
}

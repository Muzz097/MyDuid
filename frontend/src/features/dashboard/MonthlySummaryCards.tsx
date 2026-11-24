import { ArrowDownLeft, ArrowRight, ArrowUpRight, Calendar, Scale } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { MoneyText } from '@/components/ui/MoneyText'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { cn } from '@/lib/cn'

export interface MonthlySummaryCardsProps {
  income: number
  expense: number
  balanceHidden?: boolean
  className?: string
  showSectionHeader?: boolean
}

export function MonthlySummaryCards({
  income,
  expense,
  balanceHidden = false,
  className,
  showSectionHeader = true,
}: MonthlySummaryCardsProps) {
  const netCashFlow = income - expense
  const isSurplus = netCashFlow >= 0

  return (
    <div className={cn('space-y-3', className)}>
      {showSectionHeader && (
        <SectionHeader
          title="Ringkasan Bulanan"
          subtitle="Arus uang masuk dan keluar bulan ini"
          action={
            <Link
              to="/kalender"
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-control)] bg-brand-500/10 px-2.5 py-1 text-xs font-semibold text-brand-600 transition duration-150 hover:bg-brand-500/15 hover:text-brand-700 active:scale-[0.98] dark:bg-brand-500/20 dark:text-brand-400 dark:hover:bg-brand-500/30"
              title="Buka Kalender Keuangan"
            >
              <Calendar size={13} strokeWidth={2} aria-hidden />
              <span>Lihat Kalender Keuangan</span>
              <ArrowRight size={12} strokeWidth={2} aria-hidden />
            </Link>
          }
        />
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* 1. Pemasukan -> Kalender with type=income */}
        <Link
          to="/kalender?type=income"
          className="group block rounded-[var(--radius-card)] outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          aria-label="Lihat kalender pemasukan bulan ini"
        >
          <Card
            className="flex h-full flex-col justify-between overflow-hidden border border-line bg-card p-4 transition duration-200 group-hover:-translate-y-0.5 group-hover:border-income-500/50 group-hover:shadow-xs active:scale-[0.99]"
            variant="subtle"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-ink-soft">Pemasukan</span>
              <span className="flex size-7 items-center justify-center rounded-lg bg-income-50 text-income-600 transition duration-200 group-hover:scale-110 dark:bg-income-950/40 dark:text-income-400">
                <ArrowDownLeft size={16} strokeWidth={2.25} aria-hidden />
              </span>
            </div>

            <div className="mt-3">
              <MoneyText
                amount={income}
                type="income"
                hidden={balanceHidden}
                className="text-lg font-bold tracking-tight tabular-nums text-income-600 sm:text-xl dark:text-income-400"
              />
              <div className="mt-1 flex items-center justify-between text-[11px] text-ink-soft">
                <span>Bulan ini</span>
                <span className="font-semibold text-brand-600 opacity-0 transition-opacity duration-150 group-hover:opacity-100 dark:text-brand-400">
                  Kalender &rarr;
                </span>
              </div>
            </div>
          </Card>
        </Link>

        {/* 2. Pengeluaran -> Kalender with type=expense */}
        <Link
          to="/kalender?type=expense"
          className="group block rounded-[var(--radius-card)] outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          aria-label="Lihat kalender pengeluaran bulan ini"
        >
          <Card
            className="flex h-full flex-col justify-between overflow-hidden border border-line bg-card p-4 transition duration-200 group-hover:-translate-y-0.5 group-hover:border-expense-500/50 group-hover:shadow-xs active:scale-[0.99]"
            variant="subtle"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-ink-soft">Pengeluaran</span>
              <span className="flex size-7 items-center justify-center rounded-lg bg-expense-50 text-expense-600 transition duration-200 group-hover:scale-110 dark:bg-expense-950/40 dark:text-expense-400">
                <ArrowUpRight size={16} strokeWidth={2.25} aria-hidden />
              </span>
            </div>

            <div className="mt-3">
              <MoneyText
                amount={expense}
                type="expense"
                hidden={balanceHidden}
                className="text-lg font-bold tracking-tight tabular-nums text-expense-600 sm:text-xl dark:text-expense-400"
              />
              <div className="mt-1 flex items-center justify-between text-[11px] text-ink-soft">
                <span>Bulan ini</span>
                <span className="font-semibold text-brand-600 opacity-0 transition-opacity duration-150 group-hover:opacity-100 dark:text-brand-400">
                  Kalender &rarr;
                </span>
              </div>
            </div>
          </Card>
        </Link>

        {/* 3. Arus Kas Bersih -> Kalender without filter */}
        <Link
          to="/kalender"
          className="group block rounded-[var(--radius-card)] outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          aria-label="Lihat kalender keuangan dan arus kas bersih"
        >
          <Card
            className="flex h-full flex-col justify-between overflow-hidden border border-line bg-card p-4 transition duration-200 group-hover:-translate-y-0.5 group-hover:border-brand-500/50 group-hover:shadow-xs active:scale-[0.99]"
            variant="subtle"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-ink-soft">Arus Kas Bersih</span>
              <span
                className={cn(
                  'flex size-7 items-center justify-center rounded-lg transition duration-200 group-hover:scale-110',
                  isSurplus
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
                type={isSurplus ? 'income' : 'expense'}
                hidden={balanceHidden}
                className={cn(
                  'text-lg font-bold tracking-tight tabular-nums sm:text-xl',
                  isSurplus
                    ? 'text-income-600 dark:text-income-400'
                    : 'text-expense-600 dark:text-expense-400',
                )}
              />
              <div className="mt-1 flex items-center justify-between text-[11px]">
                <Badge variant={isSurplus ? 'income' : 'expense'} size="sm">
                  {isSurplus ? 'Surplus' : 'Defisit'}
                </Badge>
                <span className="font-semibold text-brand-600 opacity-0 transition-opacity duration-150 group-hover:opacity-100 dark:text-brand-400">
                  Kalender &rarr;
                </span>
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  )
}

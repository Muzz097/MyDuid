/**
 * TransactionSummaryBar
 *
 * Compact horizontal summary of the current filter results.
 * Shows: income total, expense total, transfer total (separately), and item count.
 * Does NOT mix transfers with income/expense.
 *
 * When only page-1 is loaded (more pages available), shows a note that the
 * summary is partial. The correct total count comes from meta.total.
 */

import { ArrowLeftRight, TrendingDown, TrendingUp } from 'lucide-react'
import { MoneyText } from '@/components/ui/MoneyText'
import { cn } from '@/lib/cn'
import type { TransactionSummary } from '@/features/transactions/useTransactionQuery'

type TransactionSummaryBarProps = {
  summary: TransactionSummary
  hasMore: boolean
  className?: string
}

export function TransactionSummaryBar({
  summary,
  hasMore,
  className,
}: TransactionSummaryBarProps) {
  const totalItems = summary.transactionCount + summary.transferCount

  return (
    <div
      className={cn(
        'rounded-[var(--radius-card)] border border-line/60 bg-card',
        className,
      )}
      aria-label="Ringkasan periode"
    >
      <div className="grid grid-cols-3 divide-x divide-line/60">
        {/* Income */}
        <div className="flex flex-col items-center gap-0.5 px-3 py-3 sm:flex-row sm:gap-2 sm:items-center">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-income-50 text-income-600 dark:bg-income-950/40 dark:text-income-400">
            <TrendingUp size={14} strokeWidth={2} aria-hidden />
          </span>
          <div className="text-center sm:text-left">
            <p className="text-[10px] font-medium text-ink-soft leading-tight">Pemasukan</p>
            <MoneyText
              amount={summary.income}
              type="income"
              compact
              className="text-xs font-bold tabular-nums leading-tight"
            />
          </div>
        </div>

        {/* Expense */}
        <div className="flex flex-col items-center gap-0.5 px-3 py-3 sm:flex-row sm:gap-2 sm:items-center">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-expense-50 text-expense-500 dark:bg-expense-950/40 dark:text-expense-400">
            <TrendingDown size={14} strokeWidth={2} aria-hidden />
          </span>
          <div className="text-center sm:text-left">
            <p className="text-[10px] font-medium text-ink-soft leading-tight">Pengeluaran</p>
            <MoneyText
              amount={summary.expense}
              type="expense"
              compact
              className="text-xs font-bold tabular-nums leading-tight"
            />
          </div>
        </div>

        {/* Transfer */}
        <div className="flex flex-col items-center gap-0.5 px-3 py-3 sm:flex-row sm:gap-2 sm:items-center">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-ink-soft">
            <ArrowLeftRight size={14} strokeWidth={2} aria-hidden />
          </span>
          <div className="text-center sm:text-left">
            <p className="text-[10px] font-medium text-ink-soft leading-tight">Transfer</p>
            <MoneyText
              amount={summary.transferTotal}
              type="neutral"
              compact
              className="text-xs font-bold tabular-nums leading-tight text-ink"
            />
          </div>
        </div>
      </div>

      {/* Count row */}
      <div className="border-t border-line/60 px-4 py-2 flex items-center justify-between">
        <p className="text-[11px] text-ink-soft">
          {totalItems === 0
            ? 'Tidak ada transaksi ditemukan'
            : `${summary.transactionCount} transaksi${summary.transferCount > 0 ? ` · ${summary.transferCount} transfer` : ''}`}
        </p>
        {hasMore && (
          <p className="text-[10px] text-ink-soft/70 italic">
            Ringkasan dari data yang dimuat
          </p>
        )}
      </div>
    </div>
  )
}

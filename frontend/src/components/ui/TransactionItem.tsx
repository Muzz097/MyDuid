import type { ReactNode } from 'react'
import { MoneyText } from '@/components/ui/MoneyText'
import { cn } from '@/lib/cn'
import { iconRegistry } from '@/lib/icons'
import type { Category, Transaction, Wallet } from '@/types'

function formatShortDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`)
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

export type TransactionItemProps = {
  transaction: Transaction
  category?: Category | null
  wallet?: Wallet | null
  hidden?: boolean
  action?: ReactNode
  className?: string
  compact?: boolean
}

export function TransactionItem({
  transaction,
  category,
  wallet,
  hidden = false,
  action,
  className,
  compact = false,
}: TransactionItemProps) {
  const title = transaction.notes?.trim() || category?.name || 'Transaksi'
  const iconKey = category?.iconKey ?? 'default'
  const TxIcon = iconRegistry[iconKey] ?? iconRegistry.default
  const isIncome = transaction.type === 'income'

  const toneClass = isIncome
    ? 'bg-income-50 text-income-600 dark:bg-income-950/40 dark:text-income-400'
    : 'bg-expense-50 text-expense-500 dark:bg-expense-950/40 dark:text-expense-400'

  return (
    <div
      className={cn(
        'group flex min-h-12 items-center gap-3 transition-colors duration-150',
        compact ? 'py-2.5' : 'py-3.5',
        className,
      )}
    >
      <span
        className={cn(
          'inline-flex size-10 shrink-0 items-center justify-center rounded-xl transition duration-150 group-hover:scale-105',
          toneClass,
        )}
        aria-hidden
      >
        <TxIcon size={19} strokeWidth={1.75} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink tracking-tight">
          {title}
        </p>
        <div className="flex items-center gap-1.5 truncate text-xs text-ink-soft">
          <span className="truncate">{wallet?.name ?? 'Dompet'}</span>
          <span aria-hidden>·</span>
          <span>{formatShortDate(transaction.date)}</span>
          {category?.name && transaction.notes?.trim() && (
            <>
              <span aria-hidden>·</span>
              <span className="truncate text-ink-soft/80">{category.name}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <MoneyText
          amount={transaction.amount}
          type={transaction.type}
          className="text-sm font-semibold tabular-nums"
          hidden={hidden}
        />
        {action}
      </div>
    </div>
  )
}

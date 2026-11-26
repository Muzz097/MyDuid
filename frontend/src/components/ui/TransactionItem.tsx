import type { ReactNode } from 'react'
import { CategoryAvatar } from '@/components/ui/CategoryAvatar'
import { MoneyText } from '@/components/ui/MoneyText'
import { cn } from '@/lib/cn'
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
  onClick?: () => void
  className?: string
  compact?: boolean
}

export function TransactionItem({
  transaction,
  category,
  wallet,
  hidden = false,
  action,
  onClick,
  className,
  compact = false,
}: TransactionItemProps) {
  const title = transaction.notes?.trim() || category?.name || 'Transaksi'

  const content = (
    <>
      <CategoryAvatar
        categoryId={category?.id ?? transaction.categoryId}
        name={category?.name}
        iconKey={category?.iconKey ?? 'default'}
        type={transaction.type}
        size="md"
        className="group-hover:scale-105 motion-reduce:group-hover:scale-100"
      />

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
    </>
  )

  if (onClick && !action) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'group flex min-h-12 w-full items-center gap-3 text-left transition duration-150',
          'hover:bg-muted/45 active:scale-[0.992] active:bg-muted/65',
          'motion-reduce:transition-none motion-reduce:active:scale-100',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-400',
          compact ? 'py-2.5' : 'py-3.5',
          className,
        )}
      >
        {content}
      </button>
    )
  }

  return (
    <div
      className={cn(
        'group flex min-h-12 items-center gap-3 transition-colors duration-150',
        compact ? 'py-2.5' : 'py-3.5',
        className,
      )}
    >
      {content}
    </div>
  )
}

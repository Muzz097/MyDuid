import { cn } from '@/lib/cn'
import { formatCompact, formatRupiah } from '@/lib/money'

type MoneyType = 'income' | 'expense' | 'neutral'

type MoneyTextProps = {
  amount: number
  type: MoneyType
  compact?: boolean
  hidden?: boolean
  className?: string
}

const typeClass: Record<MoneyType, string> = {
  income: 'text-income-600',
  expense: 'text-expense-500',
  neutral: 'text-ink',
}

export function MoneyText({
  amount,
  type,
  compact = false,
  hidden = false,
  className,
}: MoneyTextProps) {
  if (hidden) {
    return (
      <span className={cn('tabular font-bold text-ink', className)}>
        Rp ••••••
      </span>
    )
  }

  const formatted = compact ? formatCompact(amount) : formatRupiah(amount)
  const prefix = type === 'income' ? '+' : type === 'expense' ? '−' : ''

  return (
    <span className={cn('tabular font-bold', typeClass[type], className)}>
      {prefix}
      {formatted}
    </span>
  )
}

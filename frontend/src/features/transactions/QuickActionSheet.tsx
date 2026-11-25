import {
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  Camera,
  Mic,
  Zap,
} from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { cn } from '@/lib/cn'

type QuickActionSheetProps = {
  open: boolean
  onClose: () => void
  onSelectExpense: () => void
  onSelectIncome: () => void
  onSelectTransfer?: () => void
}

type ActionItem = {
  id: string
  label: string
  description: string
  icon: typeof ArrowDownLeft
  variant: 'expense' | 'income' | 'default'
  disabled?: boolean
  badge?: string
  onClick?: () => void
}

export function QuickActionSheet({
  open,
  onClose,
  onSelectExpense,
  onSelectIncome,
  onSelectTransfer,
}: QuickActionSheetProps) {
  const actions: ActionItem[] = [
    {
      id: 'expense',
      label: 'Pengeluaran',
      description: 'Catat belanja dan pengeluaran rutin',
      icon: ArrowUpRight,
      variant: 'expense',
      onClick: () => {
        onClose()
        onSelectExpense()
      },
    },
    {
      id: 'income',
      label: 'Pemasukan',
      description: 'Catat gaji atau pemasukan lainnya',
      icon: ArrowDownLeft,
      variant: 'income',
      onClick: () => {
        onClose()
        onSelectIncome()
      },
    },
    {
      id: 'transfer',
      label: 'Transfer Antar Dompet',
      description: 'Pindah dana antar dompet atau rekening',
      icon: ArrowRightLeft,
      variant: 'default',
      onClick: () => {
        onClose()
        onSelectTransfer?.()
      },
    },
    {
      id: 'ocr',
      label: 'Foto Struk',
      description: 'Pindai otomatis struk belanja dengan OCR',
      icon: Camera,
      variant: 'default',
      disabled: true,
      badge: 'Segera Hadir',
    },
    {
      id: 'voice',
      label: 'Catat Suara',
      description: 'Bicara untuk mencatat transaksi praktis',
      icon: Mic,
      variant: 'default',
      disabled: true,
      badge: 'Segera Hadir',
    },
    {
      id: 'quick-input',
      label: 'Input Cepat',
      description: 'Ketik cepat sekali jalan menggunakan AI',
      icon: Zap,
      variant: 'default',
      disabled: true,
      badge: 'Segera Hadir',
    },
  ]

  return (
    <Sheet open={open} onClose={onClose} title="Catat Baru">
      <div className="grid grid-cols-1 gap-2.5 pb-2 sm:grid-cols-2">
        {actions.map((item) => {
          const Icon = item.icon
          const isDisabled = item.disabled

          return (
            <button
              key={item.id}
              type="button"
              disabled={isDisabled}
              onClick={item.onClick}
              className={cn(
                'group relative flex items-center gap-3.5 rounded-[var(--radius-card)] border border-line p-3.5 text-left transition duration-200',
                isDisabled
                  ? 'cursor-not-allowed bg-muted/40 opacity-60'
                  : 'bg-card hover:border-brand-300 hover:bg-muted/60 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
              )}
            >
              <div
                className={cn(
                  'flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] transition duration-200',
                  item.variant === 'expense' &&
                    'bg-expense-500/10 text-expense-600 dark:bg-expense-500/20 dark:text-expense-400',
                  item.variant === 'income' &&
                    'bg-income-500/10 text-income-600 dark:bg-income-500/20 dark:text-income-400',
                  item.variant === 'default' &&
                    'bg-muted text-ink-soft',
                )}
              >
                <Icon size={22} strokeWidth={1.75} aria-hidden />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-ink">
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-ink-soft">
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 line-clamp-1 text-xs text-ink-soft">
                  {item.description}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </Sheet>
  )
}

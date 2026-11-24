import { Link } from 'react-router-dom'
import { getIcon } from '@/lib/icons'
import { formatRupiah } from '@/lib/money'
import { cn } from '@/lib/cn'
import type { Wallet } from '@/types'

export interface WalletCardItemProps {
  wallet: Wallet | {
    id: number
    name: string
    type: Wallet['type']
    icon_key?: string
    iconKey?: string
    balance: number
  }
  hidden?: boolean
  className?: string
}

const typeLabels: Record<string, string> = {
  cash: 'Tunai',
  bank: 'Bank',
  ewallet: 'E-Wallet',
}

export function WalletCardItem({
  wallet,
  hidden = false,
  className,
}: WalletCardItemProps) {
  const iconKey = ('iconKey' in wallet ? wallet.iconKey : wallet.icon_key) ?? 'default'
  const WalletIcon = getIcon(iconKey)
  const typeLabel = typeLabels[wallet.type] ?? wallet.type

  return (
    <Link
      to={`/dompet?selected=${wallet.id}`}
      className={cn(
        'group relative flex w-52 shrink-0 snap-start flex-col justify-between overflow-hidden rounded-[var(--radius-card)]',
        'border border-line/80 bg-card p-4 text-left transition-all duration-200',
        'hover:-translate-y-1 hover:border-brand-300 hover:shadow-md active:translate-y-0',
        className,
      )}
    >
      {/* Visual styling: stitch-border line decoration at top */}
      <div
        className="pointer-events-none absolute inset-x-2 top-1.5 h-0.5 border-t border-dashed border-line/70 dark:border-line/40"
        aria-hidden="true"
      />

      {/* Wallet flap & clasp simulation on right side */}
      <div
        className="pointer-events-none absolute right-0 top-3 flex items-center pr-2"
        aria-hidden="true"
      >
        <div className="relative flex h-6 w-5 items-center justify-end rounded-l-md bg-muted/70 px-1 border-y border-l border-line/60 shadow-xs">
          {/* Golden metallic snap button rivet */}
          <div className="size-2 rounded-full bg-amber-400 dark:bg-amber-500 shadow-inner ring-1 ring-amber-600/40" />
        </div>
      </div>

      {/* Top row: Icon + Type tag */}
      <div className="flex items-center justify-between gap-2 pr-6">
        <span className="inline-flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-transform duration-200 group-hover:scale-105 dark:bg-brand-900/30 dark:text-brand-300 shadow-xs">
          {WalletIcon({ size: 20, strokeWidth: 1.8, 'aria-hidden': true })}
        </span>
        <span className="rounded-full bg-muted/80 px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase text-ink-soft">
          {typeLabel}
        </span>
      </div>

      {/* Bottom details */}
      <div className="mt-4">
        <p className="truncate text-xs font-semibold text-ink-soft group-hover:text-ink transition-colors">
          {wallet.name}
        </p>
        <p className="mt-1 tabular-nums text-base font-bold text-ink tracking-tight">
          {hidden ? 'Rp ••••••' : formatRupiah(wallet.balance)}
        </p>
      </div>

      {/* Bottom subtle stitch line */}
      <div
        className="pointer-events-none absolute inset-x-2 bottom-1.5 h-0.5 border-b border-dashed border-line/70 dark:border-line/40"
        aria-hidden="true"
      />
    </Link>
  )
}

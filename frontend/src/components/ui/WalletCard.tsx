import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { getIcon } from '@/lib/icons'
import { formatRupiah } from '@/lib/money'
import type { Wallet } from '@/types'

export type WalletCardSize = 'compact' | 'full'

export type WalletCardWallet =
  | Wallet
  | {
      id: number
      name: string
      type: Wallet['type']
      icon_key?: string
      iconKey?: string
      balance: number
      isActive?: boolean
    }

export interface WalletCardProps {
  wallet: WalletCardWallet
  hidden?: boolean
  size?: WalletCardSize
  onClick?: () => void
  action?: ReactNode
  className?: string
}

const typeLabels: Record<Wallet['type'], string> = {
  cash: 'Kas',
  bank: 'Bank',
  ewallet: 'E-wallet',
}

function resolveIconKey(wallet: WalletCardWallet): string {
  if ('iconKey' in wallet && wallet.iconKey) return wallet.iconKey
  if ('icon_key' in wallet && wallet.icon_key) return wallet.icon_key
  return 'default'
}

export function WalletCard({
  wallet,
  hidden = false,
  size = 'compact',
  onClick,
  action,
  className,
}: WalletCardProps) {
  const WalletIcon = getIcon(resolveIconKey(wallet))
  const typeLabel = typeLabels[wallet.type] ?? wallet.type
  const isArchived = wallet.isActive === false
  const hasAction = action != null

  return (
    <div
      className={cn(
        'relative',
        size === 'compact' && 'h-36 w-[16.5rem] shrink-0 snap-start',
        size === 'full' && 'w-full',
        className,
      )}
    >
      <button
        type="button"
        onClick={onClick}
        aria-label={`Dompet ${wallet.name}`}
        className={cn(
          'group relative min-h-11 w-full overflow-visible text-left',
          'transition-all duration-200 hover:-translate-y-1 active:translate-y-0',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2',
          'motion-reduce:transform-none motion-reduce:transition-none',
          size === 'compact' && 'h-36',
          size === 'full' && 'min-h-36',
        )}
      >
        {/* Leather-like wallet shell */}
        <div
          className="absolute inset-0 overflow-hidden rounded-[var(--radius-card)] border border-brand-800/35 bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 shadow-[var(--shadow-card)] transition-shadow duration-200 group-hover:shadow-md dark:border-white/10 motion-reduce:transition-none"
          aria-hidden="true"
        >
          <div className="absolute inset-1.5 rounded-[calc(var(--radius-card)-0.3rem)] border border-dashed border-white/30" />
          <div className="absolute -right-12 -top-14 size-28 rotate-12 rounded-full border border-white/10" />
        </div>

        {/* Top flap silhouette */}
        <div
          className="pointer-events-none absolute left-1.5 right-1.5 top-1.5 h-[4.25rem] overflow-hidden rounded-t-[calc(var(--radius-card)-0.3rem)] rounded-b-[0.85rem] border border-white/15 bg-gradient-to-r from-brand-400/70 via-brand-300/35 to-brand-700/20 shadow-sm [clip-path:polygon(0_0,100%_0,96%_100%,4%_100%)]"
          aria-hidden="true"
        >
          <div className="absolute inset-x-2.5 bottom-2 border-b border-dashed border-white/35" />
        </div>

        {/* Wallet pocket content */}
        <div
          className={cn(
            'relative z-10 flex h-full min-h-36 flex-col px-4 py-3.5 text-white',
            hasAction && 'pr-12',
          )}
        >
          <div className="flex items-center gap-2.5">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-white/25 bg-brand-900/20 shadow-sm backdrop-blur-sm transition-transform duration-200 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none">
              <WalletIcon size={17} strokeWidth={1.8} aria-hidden />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="truncate text-sm font-bold leading-tight drop-shadow-sm">
                  {wallet.name}
                </p>
                {isArchived ? (
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium text-white/90">
                    Diarsipkan
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/75">
                {typeLabel}
              </p>
            </div>
          </div>

          <div className="mt-auto border-t border-white/20 pt-2.5">
            <p className="text-[10px] font-medium text-white/70">Saldo tersedia</p>
            <p className="mt-0.5 truncate tabular-nums text-lg font-extrabold tracking-tight text-white drop-shadow-sm">
              {hidden ? 'Rp ••••••' : formatRupiah(wallet.balance)}
            </p>
          </div>
        </div>
      </button>

      {hasAction ? (
        <div className="absolute right-2 top-2 z-20">{action}</div>
      ) : null}
    </div>
  )
}

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
        'group relative h-36 w-[16.5rem] shrink-0 snap-start overflow-visible text-left',
        'transition-all duration-200 hover:-translate-y-1 active:translate-y-0',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2',
        className,
      )}
    >
      {/* Leather-like wallet shell */}
      <div
        className="absolute inset-0 overflow-hidden rounded-[1.35rem] border border-brand-800/35 bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 shadow-[0_10px_24px_color-mix(in_srgb,var(--brand-700)_24%,transparent)] transition-shadow duration-200 group-hover:shadow-[0_14px_28px_color-mix(in_srgb,var(--brand-700)_32%,transparent)] dark:border-white/10"
        aria-hidden="true"
      >
        <div className="absolute inset-1.5 rounded-[1.05rem] border border-dashed border-white/30" />
        <div className="absolute -right-12 -top-14 size-28 rotate-12 rounded-full border border-white/10" />
      </div>

      {/* Oversized top flap gives the card the silhouette of a physical wallet */}
      <div
        className="pointer-events-none absolute left-1.5 right-1.5 top-1.5 h-[4.25rem] overflow-hidden rounded-t-[1.05rem] rounded-b-[0.85rem] border border-white/15 bg-gradient-to-r from-brand-400/70 via-brand-300/35 to-brand-700/20 shadow-[0_5px_10px_rgb(0_0_0/0.14)] [clip-path:polygon(0_0,100%_0,96%_100%,4%_100%)]"
        aria-hidden="true"
      >
        <div className="absolute inset-x-2.5 bottom-2 border-b border-dashed border-white/35" />
      </div>

      {/* Raised clasp */}
      <div
        className="pointer-events-none absolute right-[1.15rem] top-[3.55rem] z-20 flex size-9 items-center justify-center rounded-full border border-amber-200/70 bg-amber-300 shadow-[0_3px_8px_rgb(0_0_0/0.24)] dark:border-amber-300/40 dark:bg-amber-400"
        aria-hidden="true"
      >
        <div className="size-3 rounded-full border border-amber-700/50 bg-amber-200 shadow-inner dark:bg-amber-300">
          <div className="mx-auto mt-[3px] h-px w-1.5 bg-amber-700/70" />
        </div>
      </div>

      {/* Wallet pocket content */}
      <div className="relative z-10 flex h-full flex-col px-4 py-3.5 text-white">
        <div className="flex items-center gap-2.5 pr-10">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-white/25 bg-black/10 shadow-sm backdrop-blur-sm transition-transform duration-200 group-hover:scale-105">
            <WalletIcon size={17} strokeWidth={1.8} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight drop-shadow-sm">
              {wallet.name}
            </p>
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
    </Link>
  )
}

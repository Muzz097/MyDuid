import { useEffect, useState, type ReactNode } from 'react'
import { WalletIcon } from '@/components/ui/WalletIcon'
import { useWalletCardImage } from '@/hooks/useWalletCardImage'
import { cn } from '@/lib/cn'
import { formatRupiah } from '@/lib/money'
import type { Wallet, WalletCardTheme, WalletGroup, WalletIconType } from '@/types'

export type WalletCardSize = 'compact' | 'full'

export type WalletCardWallet =
  | Wallet
  | {
      id: number
      name: string
      type: Wallet['type']
      group?: WalletGroup
      card_theme?: WalletCardTheme
      cardTheme?: WalletCardTheme
      icon_type?: WalletIconType
      iconType?: WalletIconType
      icon_key?: string
      iconKey?: string
      has_card_image?: boolean
      hasCardImage?: boolean
      balance: number
      isActive?: boolean
    }

export interface WalletCardProps {
  wallet: WalletCardWallet
  hidden?: boolean
  size?: WalletCardSize
  imageSrc?: string | null
  imageVersion?: number | string
  onClick?: () => void
  action?: ReactNode
  className?: string
}

const typeLabels: Record<Wallet['type'], string> = {
  cash: 'Kas',
  bank: 'Bank',
  ewallet: 'E-wallet',
}

const groupLabels: Record<WalletGroup, string> = {
  daily: 'Sehari-hari',
  savings: 'Tabungan',
  investment: 'Investasi',
}

export const walletThemeClasses: Record<WalletCardTheme, string> = {
  default: 'from-[var(--wallet-default-from)] to-[var(--wallet-default-to)]',
  rose: 'from-[var(--wallet-rose-from)] to-[var(--wallet-rose-to)]',
  ocean: 'from-[var(--wallet-ocean-from)] to-[var(--wallet-ocean-to)]',
  emerald: 'from-[var(--wallet-emerald-from)] to-[var(--wallet-emerald-to)]',
  sunset: 'from-[var(--wallet-sunset-from)] to-[var(--wallet-sunset-to)]',
  graphite: 'from-[var(--wallet-graphite-from)] to-[var(--wallet-graphite-to)]',
}

function resolveIconKey(wallet: WalletCardWallet): string {
  if ('iconKey' in wallet && wallet.iconKey) return wallet.iconKey
  if ('icon_key' in wallet && wallet.icon_key) return wallet.icon_key
  return 'default'
}

function resolveIconType(wallet: WalletCardWallet): WalletIconType {
  if ('iconType' in wallet && wallet.iconType) return wallet.iconType
  if ('icon_type' in wallet && wallet.icon_type) return wallet.icon_type
  return 'preset'
}

function resolveCardTheme(wallet: WalletCardWallet): WalletCardTheme {
  const theme =
    ('cardTheme' in wallet && wallet.cardTheme) ||
    ('card_theme' in wallet && wallet.card_theme) ||
    'default'
  return theme in walletThemeClasses ? theme : 'default'
}

function resolveGroup(wallet: WalletCardWallet): WalletGroup | undefined {
  if ('group' in wallet) return wallet.group
  return undefined
}

function resolveHasCardImage(wallet: WalletCardWallet): boolean {
  if ('hasCardImage' in wallet && typeof wallet.hasCardImage === 'boolean') {
    return wallet.hasCardImage
  }
  if ('has_card_image' in wallet && typeof wallet.has_card_image === 'boolean') {
    return wallet.has_card_image
  }
  return false
}

export function WalletCard({
  wallet,
  hidden = false,
  size = 'compact',
  imageSrc,
  imageVersion,
  onClick,
  action,
  className,
}: WalletCardProps) {
  const iconKey = resolveIconKey(wallet)
  const iconType = resolveIconType(wallet)
  const cardTheme = resolveCardTheme(wallet)
  const themeGradient = walletThemeClasses[cardTheme]
  const typeLabel = typeLabels[wallet.type] ?? wallet.type
  const walletGroup = resolveGroup(wallet)
  const groupLabel = walletGroup ? groupLabels[walletGroup] : undefined
  const isArchived = wallet.isActive === false
  const hasAction = action != null
  const hasCardImage = resolveHasCardImage(wallet)

  const { src: fetchedSrc, error: fetchError } = useWalletCardImage(
    wallet.id,
    hasCardImage && imageSrc === undefined,
    imageVersion,
  )
  const effectiveSrc = imageSrc !== undefined ? imageSrc : fetchedSrc
  const [imgFailed, setImgFailed] = useState(false)

  useEffect(() => {
    setImgFailed(false)
  }, [effectiveSrc])

  const showPhoto = Boolean(effectiveSrc) && !imgFailed && !(imageSrc === undefined && fetchError)

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
          className={cn(
            'absolute inset-0 overflow-hidden rounded-[var(--radius-card)] border border-black/20 bg-gradient-to-br shadow-[var(--shadow-card)] transition-shadow duration-200 group-hover:shadow-md dark:border-white/10 motion-reduce:transition-none',
            themeGradient,
          )}
          aria-hidden="true"
        >
          {showPhoto && effectiveSrc ? (
            <>
              <img
                src={effectiveSrc}
                alt=""
                onError={() => setImgFailed(true)}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-black/30" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10" />
          )}
          <div className="absolute inset-1.5 rounded-[calc(var(--radius-card)-0.3rem)] border border-dashed border-white/30" />
          <div className="absolute -right-12 -top-14 size-28 rotate-12 rounded-full border border-white/10" />
        </div>

        {/* Top flap silhouette */}
        <div
          className="pointer-events-none absolute left-1.5 right-1.5 top-1.5 h-[4.25rem] overflow-hidden rounded-t-[calc(var(--radius-card)-0.3rem)] rounded-b-[0.85rem] border border-white/15 bg-gradient-to-r from-white/20 via-white/10 to-black/15 shadow-sm [clip-path:polygon(0_0,100%_0,96%_100%,4%_100%)]"
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
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-white/25 bg-black/20 shadow-sm backdrop-blur-sm transition-transform duration-200 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none">
              <WalletIcon iconType={iconType} iconKey={iconKey} size={17} strokeWidth={1.8} />
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
                {groupLabel ? (
                  <span className="ml-1.5 normal-case tracking-normal font-medium opacity-80">
                    · {groupLabel}
                  </span>
                ) : null}
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

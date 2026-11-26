import { Eye, EyeOff, PiggyBank, TrendingUp, Wallet, type LucideIcon } from 'lucide-react'
import assetDaily from '@/assets/mascot/asset-daily.png'
import assetInvestment from '@/assets/mascot/asset-investment.png'
import assetSavings from '@/assets/mascot/asset-savings.png'
import { cn } from '@/lib/cn'
import { formatRupiah } from '@/lib/money'
import type { WalletGroup } from '@/types'

const DEFAULT_ILLUSTRATIONS: Record<WalletGroup, string> = {
  daily: assetDaily,
  savings: assetSavings,
  investment: assetInvestment,
}

export interface AssetGroupSummary {
  group: WalletGroup
  balance: number
}

export interface AssetOverviewCardProps {
  totalBalance: number
  groups: Record<WalletGroup, number>
  balanceHidden: boolean
  onToggleHide: () => void
  onGroupClick?: (group: WalletGroup) => void
  illustrations?: Partial<Record<WalletGroup, string>>
  className?: string
}

interface GroupConfig {
  key: WalletGroup
  label: string
  Icon: LucideIcon
}

const GROUP_CONFIGS: GroupConfig[] = [
  { key: 'daily', label: 'Sehari-hari', Icon: Wallet },
  { key: 'savings', label: 'Tabungan', Icon: PiggyBank },
  { key: 'investment', label: 'Investasi', Icon: TrendingUp },
]

function computePercentage(balance: number, total: number): string {
  if (total <= 0 || balance <= 0) return '0%'
  return `${Math.floor((balance * 100) / total)}%`
}

export function AssetOverviewCard({
  totalBalance,
  groups,
  balanceHidden,
  onToggleHide,
  onGroupClick,
  illustrations,
  className,
}: AssetOverviewCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[var(--radius-card)] border border-brand-200/75 bg-gradient-to-br from-page via-card to-brand-50/75 p-4 shadow-sm sm:p-5 dark:border-brand-800/60 dark:from-card dark:via-card dark:to-brand-950/35',
        className,
      )}
    >
      {/* Subtle warm ambient highlight */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-brand-100/45 blur-2xl dark:bg-brand-900/15"
      />

      {/* Header: Total Aset + Eye Toggle */}
      <div className="relative flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
            Total Aset
          </p>
          <p className="mt-0.5 tabular-nums text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            {balanceHidden ? 'Rp ••••••' : formatRupiah(totalBalance)}
          </p>
        </div>

        <button
          type="button"
          onClick={onToggleHide}
          aria-label={balanceHidden ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
          aria-pressed={balanceHidden}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-line/80 bg-card/85 text-ink-soft shadow-2xs transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:bg-muted/50 dark:hover:border-brand-800 dark:hover:bg-brand-950/50 dark:hover:text-brand-400 motion-reduce:transition-none"
        >
          {balanceHidden ? <Eye size={18} aria-hidden /> : <EyeOff size={18} aria-hidden />}
        </button>
      </div>

      {/* Three pocket cards: roomy horizontal scroll on mobile/tablet, 3-column grid on desktop */}
      <div className="relative mt-4 flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0">
        {GROUP_CONFIGS.map(({ key, label, Icon }) => {
          const balance = groups[key] ?? 0
          const pct = computePercentage(balance, totalBalance)
          const illustrationSrc = illustrations?.[key] ?? DEFAULT_ILLUSTRATIONS[key]

          return (
            <button
              key={key}
              type="button"
              onClick={() => onGroupClick?.(key)}
              className={cn(
                'group flex min-w-[256px] shrink-0 items-center justify-between gap-3 rounded-2xl border border-brand-200/65 bg-card/90 p-3.5 text-left shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300/90 hover:bg-card hover:shadow-sm active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-brand-800/50 dark:bg-muted/35 dark:hover:border-brand-700 dark:hover:bg-muted/55 sm:min-w-[272px] lg:min-w-0',
                'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
              )}
            >
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 self-stretch py-0.5">
                <span className="inline-flex w-fit items-center rounded-full bg-brand-100/85 px-2.5 py-0.5 tabular-nums text-[11px] font-bold text-brand-700 dark:bg-brand-900/65 dark:text-brand-300">
                  {pct}
                </span>

                <div className="min-w-0">
                  <p className="text-xs font-semibold text-ink-soft">{label}</p>
                  <p className="mt-0.5 truncate tabular-nums text-base font-extrabold tracking-tight text-ink sm:text-[17px]">
                    {balanceHidden ? 'Rp ••••••' : formatRupiah(balance)}
                  </p>
                </div>
              </div>

              <div className="flex w-1/3 max-w-[100px] shrink-0 items-center justify-center self-stretch">
                {illustrationSrc ? (
                  <img
                    src={illustrationSrc}
                    alt=""
                    aria-hidden
                    className="h-24 w-full object-contain drop-shadow-xs transition-transform duration-200 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  />
                ) : (
                  <span className="inline-flex size-12 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/60 dark:text-brand-300">
                    <Icon size={22} strokeWidth={2} aria-hidden />
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Eye, EyeOff, Wallet as WalletIcon, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { IconButton } from '@/components/ui/IconButton'
import { MoneyText } from '@/components/ui/MoneyText'
import { cn } from '@/lib/cn'

export interface TotalAssetCardProps {
  totalBalance: number
  balanceHidden?: boolean
  onToggleHide?: () => void
  walletCount?: number
  className?: string
}

export function TotalAssetCard({
  totalBalance,
  balanceHidden = false,
  onToggleHide,
  walletCount = 0,
  className,
}: TotalAssetCardProps) {
  const [internalHidden, setInternalHidden] = useState(false)
  const isHidden = onToggleHide ? balanceHidden : internalHidden
  const handleToggle = onToggleHide ?? (() => setInternalHidden((prev) => !prev))

  return (
    <Card
      className={cn(
        'relative overflow-hidden border border-brand-500/20 bg-gradient-to-br from-card via-card to-brand-50/30 dark:to-brand-950/20 p-6 lg:p-7 shadow-[var(--shadow-card)] transition duration-200 hover:shadow-md',
        className,
      )}
    >
      {/* Indonesian Banknote Guilloche-inspired subtle watermark patterns */}
      <div
        className="pointer-events-none absolute -right-12 -top-12 size-64 opacity-25 dark:opacity-15"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 200 200"
          className="size-full stroke-brand-500 fill-none"
          strokeWidth="0.75"
        >
          <circle cx="100" cy="100" r="25" strokeDasharray="3 3" />
          <circle cx="100" cy="100" r="45" />
          <circle cx="100" cy="100" r="65" strokeDasharray="2 4" />
          <circle cx="100" cy="100" r="85" />
          <circle cx="100" cy="100" r="95" strokeDasharray="1 3" />
          {/* Subtle geometric banknote lathe rosettes */}
          {Array.from({ length: 12 }).map((_, i) => (
            <ellipse
              key={i}
              cx="100"
              cy="100"
              rx="90"
              ry="35"
              transform={`rotate(${i * 15} 100 100)`}
              className="opacity-40"
            />
          ))}
        </svg>
      </div>

      {/* Mascot subtle embossed watermark in bottom right corner */}
      <div
        className="pointer-events-none absolute right-4 -bottom-6 size-32 select-none opacity-10 dark:opacity-5 transition duration-300"
        aria-hidden="true"
      >
        <img
          src="/mascot.jpg"
          alt=""
          className="size-full object-contain filter grayscale contrast-125"
        />
      </div>

      <div className="relative z-10 flex flex-col justify-between gap-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex size-6 items-center justify-center rounded-md bg-brand-500/10 text-brand-600 dark:text-brand-400">
                <WalletIcon size={14} strokeWidth={2} aria-hidden />
              </span>
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink-soft">
                Total Aset
              </h2>
            </div>
            <p className="mt-1 text-xs text-ink-soft">
              Saldo dari seluruh dompet aktif
            </p>
          </div>

          <IconButton
            label={isHidden ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
            onClick={handleToggle}
            variant="ghost"
            size="md"
            icon={
              <span className="relative inline-flex size-5">
                <Eye
                  size={20}
                  strokeWidth={1.75}
                  aria-hidden
                  className={cn(
                    'absolute inset-0 transition duration-200',
                    isHidden ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100',
                  )}
                />
                <EyeOff
                  size={20}
                  strokeWidth={1.75}
                  aria-hidden
                  className={cn(
                    'absolute inset-0 transition duration-200',
                    isHidden ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0',
                  )}
                />
              </span>
            }
          />
        </div>

        {/* Amount display */}
        <div className="my-1">
          <MoneyText
            amount={totalBalance}
            type="neutral"
            hidden={isHidden}
            className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl tabular-nums text-ink"
          />
        </div>

        {/* Footer link to Wallets */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line/60 pt-4">
          <span className="text-xs font-medium text-ink-soft">
            {walletCount > 0
              ? `${walletCount} dompet terhubung`
              : 'Belum ada dompet aktif'}
          </span>
          <Link
            to="/dompet"
            className="group inline-flex items-center gap-1.5 rounded-[var(--radius-control)] px-2.5 py-1 text-xs font-semibold text-brand-600 transition hover:bg-brand-50/50 hover:text-brand-700 dark:text-brand-400 dark:hover:bg-brand-900/30"
          >
            <span>Lihat rincian dompet</span>
            <ArrowRight
              size={13}
              strokeWidth={2}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </div>
      </div>
    </Card>
  )
}

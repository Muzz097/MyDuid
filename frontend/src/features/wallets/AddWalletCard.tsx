import { Plus } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { WalletCardSize } from '@/components/ui/WalletCard'

export interface AddWalletCardProps {
  size?: WalletCardSize
  onClick?: () => void
  className?: string
}

const outlineMotion = cn(
  'fill-transparent stroke-current transition-[stroke-dashoffset,fill] duration-300',
  'group-hover:fill-brand-50 group-hover:[stroke-dashoffset:-18]',
  'motion-reduce:transition-none',
)

export function AddWalletCard({
  size = 'compact',
  onClick,
  className,
}: AddWalletCardProps) {
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
        className={cn(
          'group relative flex w-full min-h-11 flex-col items-center justify-center gap-1.5 overflow-hidden rounded-[var(--radius-card)] bg-transparent text-brand-600',
          'transition duration-200 hover:bg-brand-50/60 active:scale-[0.98]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2',
          'motion-reduce:transition-none motion-reduce:active:scale-100',
          'dark:text-brand-400 dark:hover:bg-brand-50/30',
          size === 'compact' && 'h-36',
          size === 'full' && 'min-h-36',
        )}
      >
        <svg
          viewBox="0 0 264 144"
          preserveAspectRatio="none"
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-2 h-[calc(100%-1rem)] w-[calc(100%-1rem)] text-brand-500',
            'transition-transform duration-300 group-hover:translate-x-1',
            'motion-reduce:transition-none motion-reduce:group-hover:translate-x-0',
          )}
        >
          <rect
            x="4"
            y="8"
            width="190"
            height="128"
            rx="28"
            strokeWidth="1.75"
            strokeDasharray="7 6"
            vectorEffect="non-scaling-stroke"
            className={outlineMotion}
          />
          <rect
            x="168"
            y="16"
            width="88"
            height="112"
            rx="24"
            strokeWidth="1.75"
            strokeDasharray="7 6"
            vectorEffect="non-scaling-stroke"
            className={outlineMotion}
          />
        </svg>
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-[12%] size-6 -translate-y-1/2 text-brand-500"
        >
          <circle
            cx="12"
            cy="12"
            r="5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeDasharray="3 2.5"
            className={cn(
              'transition-[stroke-dashoffset] duration-300 group-hover:[stroke-dashoffset:-8]',
              'motion-reduce:transition-none',
            )}
          />
        </svg>
        <Plus size={22} strokeWidth={1.75} aria-hidden className="relative z-10" />
        <span className="relative z-10 text-sm font-semibold">Tambah dompet</span>
      </button>
    </div>
  )
}

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

// Unified wallet silhouette: rounded body + integrated right flap + small clasp
const WALLET_OUTLINE_PATH = [
  'M 24 8',
  'H 194',
  'Q 206 8 212 18',
  'H 244',
  'Q 258 18 258 32',
  'V 112',
  'Q 258 126 244 126',
  'H 212',
  'Q 206 136 194 136',
  'H 24',
  'Q 8 136 8 120',
  'V 24',
  'Q 8 8 24 8',
  'Z',
  'M 232 72',
  'm -5 0',
  'a 5 5 0 1 0 10 0',
  'a 5 5 0 1 0 -10 0',
].join(' ')

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
          'group relative flex min-h-36 w-full flex-col items-center justify-center gap-1.5 overflow-hidden rounded-[var(--radius-card)] bg-transparent pl-4 pr-16 text-brand-600',
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
            'pointer-events-none absolute inset-0 h-full w-full text-brand-500',
            'transition-transform duration-300 group-hover:translate-x-0.5',
            'motion-reduce:transition-none motion-reduce:group-hover:translate-x-0',
          )}
        >
          <path
            d={WALLET_OUTLINE_PATH}
            strokeWidth="1.75"
            strokeDasharray="7 6"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className={outlineMotion}
          />
        </svg>
        <Plus size={22} strokeWidth={1.75} aria-hidden className="relative z-10 shrink-0" />
        <span className="relative z-10 text-center text-sm font-semibold leading-tight">
          Tambah dompet
        </span>
      </button>
    </div>
  )
}

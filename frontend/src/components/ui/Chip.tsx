import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type ChipProps = {
  selected?: boolean
  children: ReactNode
  icon?: ReactNode
  onClick?: () => void
  className?: string
}

export function Chip({
  selected = false,
  children,
  icon,
  onClick,
  className,
}: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition duration-200 active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
        selected ? 'bg-brand-500 text-white' : 'bg-muted text-ink',
        className,
      )}
    >
      {icon}
      {children}
    </button>
  )
}

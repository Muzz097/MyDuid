import { cn } from '@/lib/cn'

type SkeletonProps = {
  className?: string
  rounded?: 'card' | 'control' | 'full' | 'sm'
}

export function Skeleton({ className, rounded = 'control' }: SkeletonProps) {
  const roundedClass = {
    card: 'rounded-[var(--radius-card)]',
    control: 'rounded-[var(--radius-control)]',
    full: 'rounded-full',
    sm: 'rounded-md',
  }[rounded]

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-muted/80',
        'after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.8s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/10 after:to-transparent',
        roundedClass,
        className,
      )}
      aria-hidden="true"
    />
  )
}


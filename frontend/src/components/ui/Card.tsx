import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'subtle' | 'plain'
  interactive?: boolean
}

export function Card({
  className,
  variant = 'default',
  interactive = false,
  children,
  ...props
}: CardProps) {
  const variantClasses = {
    default:
      'bg-card border border-line shadow-[var(--shadow-card)]',
    subtle:
      'bg-muted/50 border border-line/60',
    plain:
      'bg-transparent border border-line',
  }

  return (
    <div
      className={cn(
        'rounded-[var(--radius-card)] p-5 transition duration-150',
        variantClasses[variant],
        interactive &&
          'cursor-pointer hover:border-brand-300 hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}


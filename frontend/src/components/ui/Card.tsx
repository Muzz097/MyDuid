import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type CardProps = HTMLAttributes<HTMLDivElement>

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-card border border-line p-5 shadow-[var(--shadow-card)] rounded-[var(--radius-card)]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

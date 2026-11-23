import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type BadgeVariant =
  | 'neutral'
  | 'brand'
  | 'income'
  | 'expense'
  | 'warn'
  | 'danger'
  | 'info'

type BadgeSize = 'sm' | 'md'

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant
  size?: BadgeSize
  children: ReactNode
  dot?: boolean
}

const variantClass: Record<BadgeVariant, string> = {
  neutral: 'bg-muted text-ink-soft border-transparent',
  brand: 'bg-brand-50 text-brand-700 border-brand-200/50',
  income: 'bg-income-50 text-income-700 border-income-100',
  expense: 'bg-expense-50 text-expense-600 border-expense-100',
  warn: 'bg-warn-100 text-warn-700 border-warn-100',
  danger: 'bg-danger-100 text-danger-700 border-danger-100',
  info: 'bg-info-50 text-info-700 border-info-100',
}

const dotColorClass: Record<BadgeVariant, string> = {
  neutral: 'bg-ink-soft',
  brand: 'bg-brand-500',
  income: 'bg-income-500',
  expense: 'bg-expense-500',
  warn: 'bg-warn-500',
  danger: 'bg-danger-500',
  info: 'bg-info-500',
}

const sizeClass: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
}

export function Badge({
  variant = 'neutral',
  size = 'sm',
  children,
  dot = false,
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('size-1.5 rounded-full shrink-0', dotColorClass[variant])}
          aria-hidden
        />
      )}
      {children}
    </span>
  )
}

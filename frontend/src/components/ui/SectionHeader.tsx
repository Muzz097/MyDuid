import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type SectionHeaderProps = {
  title: string
  subtitle?: string
  action?: ReactNode
  className?: string
  as?: 'h2' | 'h3'
}

export function SectionHeader({
  title,
  subtitle,
  action,
  className,
  as: Component = 'h2',
}: SectionHeaderProps) {
  return (
    <div className={cn('flex items-end justify-between gap-3 mb-3', className)}>
      <div className="min-w-0 flex-1">
        <Component className="text-base font-semibold tracking-tight text-ink">
          {title}
        </Component>
        {subtitle && (
          <p className="mt-0.5 text-xs text-ink-soft">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

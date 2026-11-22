import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-line bg-card px-6 py-10 text-center">
      <span className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-muted text-ink-soft">
        <Icon size={24} strokeWidth={1.75} aria-hidden />
      </span>
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <p className="mt-1 max-w-sm text-sm leading-6 text-ink-soft">
        {description}
      </p>
      {action ? (
        <Button className="mt-5" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </div>
  )
}

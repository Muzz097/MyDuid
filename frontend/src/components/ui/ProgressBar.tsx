import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/cn'

type ProgressBarProps = {
  value: number
  max: number
  label?: string
  className?: string
}

type BudgetStatus = 'healthy' | 'warning' | 'over'

function getStatus(percent: number): BudgetStatus {
  if (percent > 100) return 'over'
  if (percent >= 80) return 'warning'
  return 'healthy'
}

const statusConfig: Record<
  BudgetStatus,
  { label: string; barClass: string; Icon: typeof CheckCircle2 }
> = {
  healthy: {
    label: 'Aman',
    barClass: 'bg-income-500',
    Icon: CheckCircle2,
  },
  warning: {
    label: 'Hampir habis',
    barClass: 'bg-warn-500',
    Icon: AlertTriangle,
  },
  over: {
    label: 'Terlampaui',
    barClass: 'bg-danger-500',
    Icon: XCircle,
  },
}

export function ProgressBar({ value, max, label, className }: ProgressBarProps) {
  const percent = max > 0 ? (value / max) * 100 : 0
  const status = getStatus(percent)
  const { label: statusLabel, barClass, Icon } = statusConfig[status]
  const barWidth = Math.min(percent, 100)

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label ? (
        <span className="text-sm font-medium text-ink">{label}</span>
      ) : null}
      <div className="flex items-center gap-3">
        <div
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label}
          className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted"
        >
          <div
            className={cn('h-full rounded-full transition-[width]', barClass)}
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <span
          className={cn(
            'inline-flex min-w-28 shrink-0 items-center gap-1 text-sm text-ink-soft',
            status === 'healthy' && 'text-income-600',
            status === 'warning' && 'text-warn-700',
            status === 'over' && 'text-danger-700',
          )}
        >
          <Icon className="size-4" aria-hidden />
          {statusLabel}
        </span>
      </div>
    </div>
  )
}

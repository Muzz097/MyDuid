import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

type IconButtonVariant = 'ghost' | 'secondary' | 'outline' | 'danger'
type IconButtonSize = 'sm' | 'md' | 'lg'

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  icon: ReactNode
  variant?: IconButtonVariant
  size?: IconButtonSize
}

const variantClass: Record<IconButtonVariant, string> = {
  ghost:
    'text-ink-soft hover:text-ink hover:bg-muted active:scale-[0.96]',
  secondary:
    'bg-muted text-ink hover:bg-line/40 active:scale-[0.96]',
  outline:
    'border border-line bg-card text-ink hover:bg-muted hover:border-line active:scale-[0.96]',
  danger:
    'text-ink-soft hover:text-danger-500 hover:bg-danger-100 active:scale-[0.96]',
}

const sizeClass: Record<IconButtonSize, string> = {
  sm: 'size-9 min-h-9 min-w-9 text-xs',
  md: 'size-11 min-h-11 min-w-11 text-sm',
  lg: 'size-12 min-h-12 min-w-12 text-base',
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      label,
      icon,
      variant = 'ghost',
      size = 'md',
      className,
      disabled,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        aria-label={label}
        title={label}
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-[var(--radius-control)] font-medium transition duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
          'disabled:pointer-events-none disabled:opacity-50',
          variantClass[variant],
          sizeClass[size],
          className,
        )}
        {...props}
      >
        {icon}
      </button>
    )
  },
)

IconButton.displayName = 'IconButton'

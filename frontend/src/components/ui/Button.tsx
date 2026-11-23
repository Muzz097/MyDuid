import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

const variantClass: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-500 text-white shadow-xs hover:bg-brand-600 active:bg-brand-700 active:scale-[0.98]',
  secondary:
    'bg-muted text-ink hover:bg-line/40 active:scale-[0.98]',
  outline:
    'border border-line bg-card text-ink hover:bg-muted hover:border-line active:scale-[0.98]',
  ghost:
    'bg-transparent text-ink hover:bg-muted active:scale-[0.98]',
  danger:
    'bg-danger-500 text-white shadow-xs hover:bg-danger-700 active:scale-[0.98]',
}

const sizeClass: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 text-xs gap-1.5',
  md: 'min-h-11 px-4 text-sm gap-2',
  lg: 'min-h-[50px] px-5 text-base gap-2.5',
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium transition duration-150 select-none',
        'rounded-[var(--radius-control)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-1 focus-visible:ring-offset-card',
        'disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none',
        variantClass[variant],
        sizeClass[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin shrink-0" aria-hidden />
          <span>Memproses...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  )
}


import { useId, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  helperText?: string
  error?: string
}

export function Input({
  label,
  helperText,
  error,
  className,
  id,
  ...props
}: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const describedBy = error
    ? `${inputId}-error`
    : helperText
      ? `${inputId}-helper`
      : undefined

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'min-h-12 w-full border border-line bg-card px-3 text-ink outline-none transition-shadow',
          'rounded-[var(--radius-control)]',
          'focus:ring-2 focus:ring-brand-400',
          error && 'border-danger-500 focus:ring-danger-500',
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-sm text-danger-500">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${inputId}-helper`} className="text-sm text-ink-soft">
          {helperText}
        </p>
      ) : null}
    </div>
  )
}

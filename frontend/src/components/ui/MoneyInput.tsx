import { useId, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { formatRupiahInput, parseRupiah } from '@/lib/money'

type MoneyInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type' | 'inputMode'
> & {
  label?: string
  helperText?: string
  error?: string
  value: number
  onChange: (value: number) => void
}

export function MoneyInput({
  label,
  helperText,
  error,
  value,
  onChange,
  className,
  id,
  ...props
}: MoneyInputProps) {
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
      <div
        className={cn(
          'flex min-h-12 items-center rounded-[var(--radius-control)] border border-line bg-card px-3 text-ink transition-shadow focus-within:ring-2 focus-within:ring-brand-400',
          error && 'border-danger-500 focus-within:ring-danger-500',
        )}
      >
        <span className="mr-2 text-sm text-ink-soft" aria-hidden>
          Rp
        </span>
        <input
          {...props}
          id={inputId}
          type="text"
          inputMode="numeric"
          value={value > 0 ? formatRupiahInput(value) : ''}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'min-w-0 flex-1 bg-transparent py-2 text-right tabular text-ink outline-none',
            className,
          )}
          onChange={(event) => {
            onChange(parseRupiah(event.target.value))
          }}
        />
      </div>
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

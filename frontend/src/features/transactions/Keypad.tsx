import { Delete } from 'lucide-react'
import { cn } from '@/lib/cn'

type KeypadProps = {
  onDigit: (digit: string) => void
  onBackspace: () => void
}

const keys: Array<{ label: string; value: string; aria?: string }> = [
  { label: '1', value: '1' },
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { label: '4', value: '4' },
  { label: '5', value: '5' },
  { label: '6', value: '6' },
  { label: '7', value: '7' },
  { label: '8', value: '8' },
  { label: '9', value: '9' },
  { label: '000', value: '000' },
  { label: '0', value: '0' },
]

export function Keypad({ onDigit, onBackspace }: KeypadProps) {
  return (
    <div
      className="grid grid-cols-3 gap-2"
      role="group"
      aria-label="Keypad angka"
    >
      {keys.map((key) => (
        <button
          key={key.value === '000' ? '000' : key.label}
          type="button"
          onClick={() => onDigit(key.value)}
          className={cn(
            'inline-flex min-h-14 items-center justify-center rounded-[var(--radius-control)] bg-muted text-xl font-semibold text-ink tabular',
            'transition duration-200 hover:bg-brand-50 active:scale-[0.97]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
          )}
        >
          {key.label}
        </button>
      ))}
      <button
        type="button"
        aria-label="Hapus"
        onClick={onBackspace}
        className={cn(
          'inline-flex min-h-14 items-center justify-center rounded-[var(--radius-control)] bg-muted text-ink',
          'transition duration-200 hover:bg-brand-50 active:scale-[0.97]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
        )}
      >
        <Delete size={22} strokeWidth={1.75} aria-hidden />
      </button>
    </div>
  )
}

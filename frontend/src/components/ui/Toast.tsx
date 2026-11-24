import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { cn } from '@/lib/cn'

type ToastType = 'success' | 'error' | 'info'

type ToastShowOptions = {
  message: string
  description?: string
  type?: ToastType
  actionLabel?: string
  onAction?: () => void
  duration?: number
}

type ToastItem = ToastShowOptions & {
  id: number
}

type ToastContextValue = {
  show: (options: ToastShowOptions) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<number | null>(null)
  const idRef = useRef(0)

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const hide = useCallback(() => {
    setVisible(false)
    clearTimer()
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.setTimeout(
      () => setToast(null),
      reduced ? 0 : 250,
    )
  }, [clearTimer])

  const show = useCallback(
    ({
      message,
      description,
      type = 'success',
      actionLabel,
      onAction,
      duration = 5000,
    }: ToastShowOptions) => {
      clearTimer()
      idRef.current += 1
      setToast({
        id: idRef.current,
        message,
        description,
        type,
        actionLabel,
        onAction,
        duration,
      })
      setVisible(true)
      timerRef.current = window.setTimeout(() => {
        setVisible(false)
        window.setTimeout(() => setToast(null), 250)
      }, duration)
    },
    [clearTimer],
  )

  useEffect(() => () => clearTimer(), [clearTimer])

  const value = useMemo(() => ({ show }), [show])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <div
          className={cn(
            'pointer-events-none fixed inset-x-0 z-[70] flex justify-center px-4',
            'bottom-[calc(5.5rem+env(safe-area-inset-bottom))] lg:bottom-6',
          )}
          aria-live="polite"
        >
          <div
            role="status"
            className={cn(
              'pointer-events-auto flex w-full max-w-md items-center gap-3.5 rounded-[var(--radius-control)] border border-line bg-card/95 px-4 py-3 text-ink shadow-xl backdrop-blur-md transition duration-[250ms] ease-[var(--ease-soft)] dark:border-line/40',
              visible
                ? 'translate-y-0 opacity-100 scale-100'
                : 'translate-y-3 opacity-0 scale-95',
            )}
          >
            {toast.type === 'error' ? (
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-expense-50 text-expense-600 dark:bg-expense-950/50 dark:text-expense-400">
                <AlertCircle
                  size={20}
                  strokeWidth={2}
                  className="shrink-0"
                  aria-hidden
                />
              </span>
            ) : toast.type === 'info' ? (
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-info-50 text-info-600 dark:bg-info-950/50 dark:text-info-400">
                <Info
                  size={20}
                  strokeWidth={2}
                  className="shrink-0"
                  aria-hidden
                />
              </span>
            ) : (
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-income-50 text-income-600 dark:bg-income-950/50 dark:text-income-400">
                <CheckCircle2
                  size={20}
                  strokeWidth={2}
                  className="shrink-0"
                  aria-hidden
                />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink leading-snug">{toast.message}</p>
              {toast.description && (
                <p className="mt-0.5 text-xs text-ink-soft leading-normal">{toast.description}</p>
              )}
            </div>
            {toast.actionLabel && toast.onAction ? (
              <button
                type="button"
                onClick={() => {
                  toast.onAction?.()
                  hide()
                }}
                className="shrink-0 rounded-[calc(var(--radius-control)-4px)] px-2.5 py-1 text-xs font-semibold text-brand-600 transition duration-150 hover:bg-brand-50 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 dark:text-brand-400 dark:hover:bg-brand-950/50"
              >
                {toast.actionLabel}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast harus di dalam ToastProvider')
  return ctx
}


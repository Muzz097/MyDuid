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
            'pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-4',
            'bottom-[calc(5.5rem+env(safe-area-inset-bottom))] lg:bottom-6',
          )}
          aria-live="polite"
        >
          <div
            role="status"
            className={cn(
              'pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-[var(--radius-control)] bg-ink px-4 py-3 text-sm text-white shadow-xl transition duration-[250ms] ease-[var(--ease-soft)] border border-line/20',
              visible
                ? 'translate-y-0 opacity-100 scale-100'
                : 'translate-y-3 opacity-0 scale-95',
            )}
          >
            {toast.type === 'error' ? (
              <AlertCircle
                size={20}
                strokeWidth={1.75}
                className="shrink-0 text-danger-500"
                aria-hidden
              />
            ) : toast.type === 'info' ? (
              <Info
                size={20}
                strokeWidth={1.75}
                className="shrink-0 text-info-500"
                aria-hidden
              />
            ) : (
              <CheckCircle2
                size={20}
                strokeWidth={1.75}
                className="shrink-0 text-income-400"
                aria-hidden
              />
            )}
            <p className="min-w-0 flex-1 font-medium">{toast.message}</p>
            {toast.actionLabel && toast.onAction ? (
              <button
                type="button"
                onClick={() => {
                  toast.onAction?.()
                  hide()
                }}
                className="shrink-0 rounded-[var(--radius-control)] px-2.5 py-1 text-xs font-semibold text-brand-300 transition duration-150 hover:bg-white/10 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
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


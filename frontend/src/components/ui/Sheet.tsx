import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'

export type SheetVariant = 'sheet' | 'drawer'

type SheetProps = {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
  variant?: SheetVariant
}

const EXIT_MS = 250
const sheetStack: number[] = []
let nextSheetId = 1
let scrollLockCount = 0
let lockedBodyOverflow = ''

export function Sheet({
  open,
  onClose,
  title,
  children,
  className,
  variant = 'sheet',
}: SheetProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)
  const onCloseRef = useRef(onClose)
  const [rendered, setRendered] = useState(open)
  const [visible, setVisible] = useState(open)
  const isDrawer = variant === 'drawer'

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (open) {
      const frame = requestAnimationFrame(() => {
        setRendered(true)
        setVisible(true)
      })
      return () => cancelAnimationFrame(frame)
    }
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const frame = requestAnimationFrame(() => setVisible(false))
    const timeout = window.setTimeout(
      () => setRendered(false),
      reduced ? 0 : EXIT_MS,
    )
    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(timeout)
    }
  }, [open])

  useEffect(() => {
    if (!rendered) return

    previouslyFocused.current = document.activeElement as HTMLElement | null
    const id = nextSheetId
    nextSheetId += 1
    sheetStack.push(id)

    if (scrollLockCount === 0) {
      lockedBodyOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }
    scrollLockCount += 1

    panelRef.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      if (sheetStack[sheetStack.length - 1] !== id) return
      event.preventDefault()
      onCloseRef.current()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      const wasTop = sheetStack[sheetStack.length - 1] === id
      const index = sheetStack.indexOf(id)
      if (index >= 0) sheetStack.splice(index, 1)
      scrollLockCount = Math.max(0, scrollLockCount - 1)
      if (scrollLockCount === 0) {
        document.body.style.overflow = lockedBodyOverflow
      }
      document.removeEventListener('keydown', onKeyDown)
      if (wasTop) previouslyFocused.current?.focus?.()
    }
  }, [rendered])

  if (!rendered) return null

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-end justify-center',
        isDrawer ? 'lg:items-stretch lg:justify-end' : 'lg:items-center lg:p-6',
      )}
    >
      <button
        type="button"
        aria-label="Tutup"
        className={cn(
          'absolute inset-0 bg-ink/40 transition-opacity duration-[250ms] ease-[var(--ease-soft)] motion-reduce:transition-none',
          visible ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn(
          'relative z-10 flex max-h-[92dvh] w-full flex-col bg-card shadow-lg outline-none',
          'transition duration-[250ms] ease-[var(--ease-soft)] motion-reduce:transition-none',
          isDrawer
            ? 'rounded-t-[1.5rem] lg:h-full lg:max-h-none lg:w-[30rem] lg:max-w-[32rem] lg:rounded-none lg:rounded-l-[var(--radius-card)]'
            : 'rounded-t-[1.5rem] lg:max-h-[85dvh] lg:max-w-lg lg:rounded-[var(--radius-card)]',
          isDrawer
            ? visible
              ? 'translate-y-0 opacity-100 lg:translate-x-0'
              : 'translate-y-full opacity-0 lg:translate-y-0 lg:translate-x-full'
            : visible
              ? 'translate-y-0 opacity-100 lg:scale-100'
              : 'translate-y-full opacity-0 lg:translate-y-4 lg:scale-95',
          className,
        )}
      >
        <div className="flex shrink-0 flex-col pt-3 lg:pt-4">
          <div
            className="mx-auto mb-2 h-1 w-10 rounded-full bg-line lg:hidden"
            aria-hidden
          />
          <div className="flex items-center justify-between gap-3 px-4 pb-3">
            {title ? (
              <h2 id={titleId} className="text-lg font-semibold text-ink">
                {title}
              </h2>
            ) : (
              <span />
            )}
            <button
              type="button"
              aria-label="Tutup"
              onClick={onClose}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-control)] text-ink-soft transition duration-200 hover:bg-muted active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            >
              <X size={20} strokeWidth={1.75} aria-hidden />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:pb-6">
          {children}
        </div>
      </div>
    </div>
  )
}

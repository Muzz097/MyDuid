import {
  Check,
  Monitor,
  Moon,
  Palette,
  Sun,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { themes, useTheme, type AppearanceMode } from '@/lib/theme-context'
import { cn } from '@/lib/cn'

const appearanceOptions = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: Monitor },
] as const

const CLOSE_ANIMATION_MS = 240

export function ThemeSwitcher() {
  const { theme, appearance, setTheme, setAppearance } = useTheme()
  const titleId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const openFrameRef = useRef<number | null>(null)
  const closeTimerRef = useRef<number | null>(null)
  const [open, setOpen] = useState(false)
  const [rendered, setRendered] = useState(false)
  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 1023px)').matches,
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1023px)')
    const updateViewport = () => setIsMobile(mediaQuery.matches)
    mediaQuery.addEventListener('change', updateViewport)
    return () => mediaQuery.removeEventListener('change', updateViewport)
  }, [])

  const openPanel = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    if (openFrameRef.current !== null) {
      window.cancelAnimationFrame(openFrameRef.current)
    }
    setRendered(true)
    openFrameRef.current = window.requestAnimationFrame(() => {
      openFrameRef.current = null
      setOpen(true)
    })
  }, [])

  const closePanel = useCallback(() => {
    if (openFrameRef.current !== null) {
      window.cancelAnimationFrame(openFrameRef.current)
      openFrameRef.current = null
    }
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current)
    }
    setOpen(false)
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    closeTimerRef.current = window.setTimeout(
      () => {
        setRendered(false)
        closeTimerRef.current = null
      },
      reducedMotion ? 0 : CLOSE_ANIMATION_MS,
    )
  }, [])

  useEffect(() => {
    return () => {
      if (openFrameRef.current !== null) {
        window.cancelAnimationFrame(openFrameRef.current)
      }
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      ) {
        closePanel()
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        closePanel()
        triggerRef.current?.focus()
        return
      }

      if (event.key !== 'Tab' || !isMobile || !panelRef.current) return
      const panel = panelRef.current
      const focusable =
        panel.querySelectorAll<HTMLElement>('button:not(:disabled)')
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) return

      if (
        event.shiftKey &&
        (document.activeElement === first ||
          !panel.contains(document.activeElement))
      ) {
        event.preventDefault()
        last.focus()
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          !panel.contains(document.activeElement))
      ) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, isMobile, closePanel])

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label="Pengaturan tampilan"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={titleId}
        onClick={() => {
          if (open) closePanel()
          else openPanel()
        }}
        className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] border border-line bg-card px-3 text-sm font-medium text-ink transition duration-200 hover:bg-muted active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
      >
        <Palette size={18} strokeWidth={1.75} aria-hidden />
        <span className="hidden sm:inline">Tampilan</span>
      </button>

      {rendered && (
        <>
          <button
            type="button"
            tabIndex={-1}
            aria-label="Tutup pengaturan tampilan"
            onClick={closePanel}
            className={cn(
              'fixed inset-0 z-40 bg-ink/40 transition-opacity duration-[240ms] lg:hidden',
              open ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
          />
          <div
            ref={panelRef}
            id={titleId}
            role="dialog"
            aria-modal={isMobile}
            aria-labelledby={`${titleId}-label`}
            className={cn(
              'fixed inset-x-0 bottom-0 z-50 max-h-[90dvh] overflow-y-auto rounded-t-[1.5rem] border border-line bg-card p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-lg transition duration-[240ms] ease-[var(--ease-soft)]',
              'lg:absolute lg:inset-x-auto lg:bottom-auto lg:right-0 lg:top-full lg:mt-2 lg:max-h-[min(85dvh,42rem)] lg:w-[22rem] lg:rounded-[var(--radius-card)] lg:p-5 lg:pb-5',
              open
                ? 'translate-y-0 opacity-100 lg:scale-100'
                : 'translate-y-full opacity-0 lg:translate-y-2 lg:scale-95',
            )}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2
                  id={`${titleId}-label`}
                  className="text-lg font-semibold text-ink"
                >
                  Tampilan
                </h2>
                <p className="mt-0.5 text-sm text-ink-soft">
                  Sesuaikan warna dan mode layar
                </p>
              </div>
              <button
                type="button"
                aria-label="Tutup pengaturan tampilan"
                onClick={closePanel}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-control)] text-ink-soft transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
              >
                <X size={20} strokeWidth={1.75} aria-hidden />
              </button>
            </div>

            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-ink">
                Tema warna
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {themes.map((option) => {
                  const selected = theme === option.id
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setTheme(option.id)}
                      className={cn(
                        'flex min-h-[4.5rem] items-center gap-3 rounded-[var(--radius-control)] border p-2.5 text-left transition duration-200 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                        selected
                          ? 'border-brand-500 bg-brand-50/60'
                          : 'border-line bg-card',
                      )}
                    >
                      <span
                        data-theme={option.id}
                        className="theme-preview flex size-10 shrink-0 items-center justify-center gap-1 rounded-xl border border-line bg-page"
                        aria-hidden
                      >
                        <span className="size-4 rounded-full bg-brand-500" />
                        <span className="size-2.5 rounded-full bg-accent" />
                      </span>
                      <span className="min-w-0 flex-1 text-sm font-medium text-ink">
                        {option.name}
                      </span>
                      {selected && (
                        <Check
                          size={18}
                          strokeWidth={2}
                          className="shrink-0 text-brand-600"
                          aria-hidden
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <fieldset className="mt-5">
              <legend className="mb-2 text-sm font-semibold text-ink">
                Mode tampilan
              </legend>
              <div className="grid grid-cols-3 gap-2">
                {appearanceOptions.map((option) => {
                  const Icon = option.icon
                  const selected: AppearanceMode = option.id
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={appearance === selected}
                      onClick={() => setAppearance(selected)}
                      className={cn(
                        'flex min-h-16 flex-col items-center justify-center gap-1 rounded-[var(--radius-control)] border px-2 py-2 text-xs font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                        appearance === selected
                          ? 'border-brand-500 bg-brand-50/60 text-brand-700'
                          : 'border-line bg-card text-ink-soft hover:bg-muted',
                      )}
                    >
                      <Icon size={18} strokeWidth={1.75} aria-hidden />
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </fieldset>
          </div>
        </>
      )}
    </div>
  )
}

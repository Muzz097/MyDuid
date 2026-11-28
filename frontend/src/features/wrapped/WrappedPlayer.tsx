import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RefreshCw,
  X,
} from 'lucide-react'
import { Button, Skeleton } from '@/components/ui'
import { cn } from '@/lib/cn'
import { buildSlides } from './buildSlides'
import { formatMonthYear } from './copy'
import { ShareSheet } from './ShareSheet'
import { WrappedSlideView } from './slides'
import { useWrappedDetail } from './useWrapped'

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/
const AUTOPLAY_MS = 6000

export function WrappedPlayer() {
  const { month } = useParams<{ month: string }>()
  const navigate = useNavigate()
  const isValidMonth = Boolean(month && MONTH_RE.test(month))

  const dialogRef = useRef<HTMLDivElement>(null)
  const prevFocusRef = useRef<HTMLElement | null>(null)
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)

  const [index, setIndex] = useState(0)
  const [autoplay, setAutoplay] = useState(false)
  const [paused, setPaused] = useState(false)
  const [holding, setHolding] = useState(false)
  const [tabHidden, setTabHidden] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  )

  useEffect(() => {
    if (!isValidMonth) {
      navigate('/laporan?tab=wrapped', { replace: true })
    }
  }, [isValidMonth, navigate])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => {
      setReducedMotion(mq.matches)
      if (mq.matches) setAutoplay(false)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const { data, loading, error, retry } = useWrappedDetail(
    isValidMonth ? month! : null,
  )

  const slides = useMemo(() => (data ? buildSlides(data) : []), [data])
  const totalSlides = slides.length
  const safeIndex = Math.min(index, Math.max(totalSlides - 1, 0))
  const currentSlide = slides[safeIndex] ?? null

  useEffect(() => {
    setIndex(0)
  }, [month])

  useEffect(() => {
    if (data && !data.has_data) {
      navigate('/laporan?tab=wrapped', { replace: true })
    }
  }, [data, navigate])

  const handleClose = useCallback(() => {
    navigate('/laporan?tab=wrapped')
  }, [navigate])

  const handleNavigate = useCallback(
    (to: string) => {
      navigate(to)
    },
    [navigate],
  )

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1))
  }, [])

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(Math.max(totalSlides - 1, 0), i + 1))
  }, [totalSlides])

  const handleReplay = useCallback(() => {
    setIndex(0)
  }, [])

  // Focus trap + restore focus
  useEffect(() => {
    prevFocusRef.current = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()

    return () => {
      document.body.style.overflow = prevOverflow
      prevFocusRef.current?.focus?.()
    }
  }, [])

  // Visibility pause
  useEffect(() => {
    const onVisibility = () => setTabHidden(document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  // Keyboard controls
  useEffect(() => {
    if (shareOpen) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goNext()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goPrev()
      } else if (e.key === ' ') {
        e.preventDefault()
        setPaused((p) => !p)
      } else if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        )
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [goNext, goPrev, handleClose, shareOpen])

  // Autoplay timer (stops at last slide, disabled in reducedMotion or while shareOpen)
  const isAutoplayActive =
    autoplay &&
    !reducedMotion &&
    !paused &&
    !holding &&
    !tabHidden &&
    !shareOpen &&
    totalSlides > 0 &&
    safeIndex < totalSlides - 1

  useEffect(() => {
    if (!isAutoplayActive) return
    const timer = window.setTimeout(() => {
      setIndex((i) => Math.min(totalSlides - 1, i + 1))
    }, AUTOPLAY_MS)
    return () => window.clearTimeout(timer)
  }, [isAutoplayActive, safeIndex, totalSlides])

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    pointerStartRef.current = { x: e.clientX, y: e.clientY }
    setHolding(true)
  }

  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    setHolding(false)
    const start = pointerStartRef.current
    pointerStartRef.current = null
    if (!start) return

    const dx = e.clientX - start.x
    const dy = e.clientY - start.y
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) goNext()
      else goPrev()
      return
    }

    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      const rect = e.currentTarget.getBoundingClientRect()
      const relX = e.clientX - rect.left
      if (relX < rect.width / 3) goPrev()
      else goNext()
    }
  }

  if (!isValidMonth) return null

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`MyDuid Wrapped ${formatMonthYear(month!)}`}
      tabIndex={-1}
      className="fixed inset-0 z-[55] flex items-center justify-center bg-black/80 backdrop-blur-sm focus:outline-none sm:p-4"
    >
      <div className="relative flex h-full w-full flex-col overflow-hidden bg-card sm:h-[min(860px,92vh)] sm:max-w-[440px] sm:rounded-[28px] sm:border sm:border-line sm:shadow-2xl">
        {/* Top segmented progress & controls */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 space-y-2.5 p-3.5">
          {totalSlides > 0 && (
            <div
              className="flex gap-1"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={totalSlides}
              aria-valuenow={safeIndex + 1}
              aria-label={`Slide ${safeIndex + 1} dari ${totalSlides}`}
            >
              {slides.map((s, idx) => {
                const isPast = idx < safeIndex
                const isCurrent = idx === safeIndex
                return (
                  <div
                    key={s.id}
                    className="h-1 flex-1 overflow-hidden rounded-full bg-ink/20"
                  >
                    <div
                      className={cn(
                        'h-full rounded-full bg-ink',
                        isPast ? 'w-full' : isCurrent ? 'w-full' : 'w-0',
                        isCurrent && isAutoplayActive && 'wrapped-progress-fill',
                      )}
                      style={
                        isCurrent && isAutoplayActive
                          ? { animationDuration: `${AUTOPLAY_MS}ms` }
                          : undefined
                      }
                    />
                  </div>
                )
              })}
            </div>
          )}

          <div className="pointer-events-auto flex items-center justify-between gap-2">
            <span className="rounded-full bg-card/80 px-2.5 py-1 text-xs font-semibold text-ink backdrop-blur-sm">
              {formatMonthYear(month!)}
            </span>

            <div className="flex items-center gap-1.5">
              {!reducedMotion && totalSlides > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setAutoplay((a) => !a)}
                    aria-pressed={autoplay}
                    className={cn(
                      'inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-xs font-semibold backdrop-blur-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus',
                      autoplay
                        ? 'bg-brand-600 text-white'
                        : 'bg-card/80 text-ink hover:bg-card',
                    )}
                  >
                    {autoplay ? 'Putar Otomatis' : 'Manual'}
                  </button>

                  {autoplay && (
                    <button
                      type="button"
                      onClick={() => setPaused((p) => !p)}
                      aria-label={paused ? 'Lanjutkan putar' : 'Jeda putar'}
                      className="inline-flex size-11 items-center justify-center rounded-full bg-card/80 text-ink backdrop-blur-sm transition hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    >
                      {paused ? (
                        <Play className="size-4" aria-hidden="true" />
                      ) : (
                        <Pause className="size-4" aria-hidden="true" />
                      )}
                    </button>
                  )}
                </>
              )}

              <button
                type="button"
                onClick={handleClose}
                aria-label="Tutup Wrapped"
                className="inline-flex size-11 items-center justify-center rounded-full bg-card/80 text-ink backdrop-blur-sm transition hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Main story viewport */}
        {loading && (
          <div className="flex h-full flex-col justify-between p-6 pt-20">
            <Skeleton className="h-6 w-40" rounded="control" />
            <div className="space-y-4">
              <Skeleton className="h-12 w-3/4" rounded="card" />
              <Skeleton className="h-5 w-full" rounded="control" />
              <Skeleton className="h-5 w-2/3" rounded="control" />
            </div>
            <Skeleton className="h-11 w-full" rounded="control" />
          </div>
        )}

        {!loading && error && (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
            <p className="text-base font-semibold text-ink">
              Tidak dapat memuat Wrapped
            </p>
            <p className="text-sm text-ink-soft">{error}</p>
            <div className="flex gap-2">
              <Button onClick={retry} variant="primary">
                <RefreshCw className="size-4" aria-hidden="true" />
                Coba lagi
              </Button>
              <Button onClick={handleClose} variant="secondary">
                Kembali
              </Button>
            </div>
          </div>
        )}

        {!loading && !error && currentSlide && (
          <div
            key={`${month}-${currentSlide.id}-${safeIndex}`}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={() => setHolding(false)}
            className="relative flex-1 select-none overflow-y-auto"
          >
            <WrappedSlideView
              slide={currentSlide}
              onNavigate={handleNavigate}
              onReplay={handleReplay}
              onOpenShare={() => setShareOpen(true)}
            />
          </div>
        )}

        {/* Accessible prev/next buttons at bottom edge */}
        {!loading && !error && totalSlides > 1 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-2 z-30 flex items-center justify-between px-3">
            <button
              type="button"
              onClick={goPrev}
              disabled={safeIndex === 0}
              aria-label="Slide sebelumnya"
              className="pointer-events-auto inline-flex size-11 items-center justify-center rounded-full bg-card/75 text-ink backdrop-blur-sm transition hover:bg-card disabled:opacity-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={safeIndex === totalSlides - 1}
              aria-label="Slide berikutnya"
              className="pointer-events-auto inline-flex size-11 items-center justify-center rounded-full bg-card/75 text-ink backdrop-blur-sm transition hover:bg-card disabled:opacity-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {data && (
        <ShareSheet
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          detail={data}
        />
      )}
    </div>
  )
}

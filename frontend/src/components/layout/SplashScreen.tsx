import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'
import { markSplashSeen } from '@/lib/splash'

interface SplashScreenProps {
  /** If the app is still loading asynchronous core data (e.g. auth boot) */
  isLoading?: boolean
  /** Callback fired after splash finishes fade-out animation and unmounts */
  onFinish?: () => void
}

export function SplashScreen({ isLoading = false, onFinish }: SplashScreenProps) {
  // Animation step states: 0: initial, 1: logo in, 2: name reveal & coin flip, 3: tagline in, 4: exit
  const [stage, setStage] = useState<number>(0)
  const [isDismissed, setIsDismissed] = useState<boolean>(false)

  useEffect(() => {
    // Check prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      // Fast path for reduced motion: show brief static brand and dismiss once loading is complete
      const timer = setTimeout(() => {
        if (!isLoading) {
          markSplashSeen()
          setIsDismissed(true)
          onFinish?.()
        }
      }, 500)
      return () => clearTimeout(timer)
    }

    // Sequence of animations
    const t0 = setTimeout(() => setStage(1), 40) // Logo entrance
    const t1 = setTimeout(() => setStage(2), 400) // Name reveal + micro coin
    const t2 = setTimeout(() => setStage(3), 850) // Tagline & sparkles reveal

    return () => {
      clearTimeout(t0)
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [isLoading, onFinish])

  // When stage reaches 3 (tagline revealed) and background loading has finished, initiate exit transition
  useEffect(() => {
    if (stage >= 3 && !isLoading) {
      // Brief moment for user to appreciate the logo and tagline before clean exit fade
      const exitTimer = setTimeout(() => {
        setStage(4) // Triggers fade-out and slight scale-up transition
        markSplashSeen()

        const finishTimer = setTimeout(() => {
          setIsDismissed(true)
          onFinish?.()
        }, 400) // matches transition duration

        return () => clearTimeout(finishTimer)
      }, 550)

      return () => clearTimeout(exitTimer)
    }
  }, [stage, isLoading, onFinish])

  if (isDismissed) {
    return null
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Memuat MyDuid"
      className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center select-none overflow-hidden',
        'bg-page text-ink transition-all duration-400 ease-out',
        stage === 4 ? 'opacity-0 scale-[1.02] pointer-events-none' : 'opacity-100 scale-100',
      )}
    >
      {/* Subtle ambient gradient mesh in the background */}
      <div
        className={cn(
          'pointer-events-none absolute -inset-[10%] opacity-40 dark:opacity-20 transition-opacity duration-700 blur-3xl',
          stage >= 1 ? 'opacity-40 dark:opacity-20' : 'opacity-0',
        )}
        style={{
          background:
            'radial-gradient(circle at 50% 45%, var(--brand-500) 0%, transparent 60%), radial-gradient(circle at 65% 55%, var(--income-500) 0%, transparent 50%)',
        }}
      />

      <div className="relative flex flex-col items-center text-center px-6">
        {/* Brand Logo Container */}
        <div className="relative mb-5 flex items-center justify-center">
          {/* Subtle pulse ring */}
          <div
            className={cn(
              'absolute size-20 rounded-[1.25rem] bg-brand-500/15 transition-all duration-700 ease-out',
              stage >= 1 ? 'scale-125 opacity-100' : 'scale-75 opacity-0',
            )}
          />

          {/* Logo Mark: Official 'M' Brand Identity Badge */}
          <div
            className={cn(
              'relative flex size-18 items-center justify-center rounded-[var(--radius-card)]',
              'bg-brand-500 text-white font-extrabold text-3xl shadow-lg shadow-brand-500/30',
              'transition-all duration-600 cubic-bezier(0.22, 1, 0.36, 1)',
              stage >= 1
                ? 'opacity-100 scale-100 translate-y-0 rotate-0'
                : 'opacity-0 scale-75 translate-y-3 -rotate-6',
            )}
          >
            <span>M</span>

            {/* Creative financial micro-element: Golden coin accent popping on top corner */}
            <div
              className={cn(
                'absolute -top-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full',
                'bg-amber-400 text-amber-950 font-black text-[11px] shadow-sm ring-2 ring-page',
                'transition-all duration-500 delay-100 cubic-bezier(0.34, 1.56, 0.64, 1)',
                stage >= 2
                  ? 'opacity-100 scale-100 rotate-0'
                  : 'opacity-0 scale-0 rotate-45',
              )}
              title="Rp"
            >
              Rp
            </div>
          </div>
        </div>

        {/* Brand Name with sleek mask-reveal */}
        <div className="overflow-hidden pb-1">
          <h1
            className={cn(
              'text-3xl font-extrabold tracking-tight text-ink transition-all duration-500 cubic-bezier(0.22, 1, 0.36, 1)',
              stage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
            )}
          >
            MyDuid
          </h1>
        </div>

        {/* Brand Tagline */}
        <div className="overflow-hidden pt-1">
          <p
            className={cn(
              'text-sm font-medium text-ink-soft transition-all duration-500 cubic-bezier(0.22, 1, 0.36, 1)',
              stage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
            )}
          >
            Your Money, Understood.
          </p>
        </div>

        {/* Financial progress indicator: Subtle, elegant mini cash-flow pulse indicator */}
        <div
          className={cn(
            'mt-8 flex items-center gap-1.5 transition-all duration-500',
            stage >= 3 ? 'opacity-100' : 'opacity-0',
          )}
        >
          <span className="size-1.5 rounded-full bg-brand-500 animate-pulse" />
          <span
            className="size-1.5 rounded-full bg-brand-400 animate-pulse"
            style={{ animationDelay: '150ms' }}
          />
          <span
            className="size-1.5 rounded-full bg-income-500 animate-pulse"
            style={{ animationDelay: '300ms' }}
          />
        </div>
      </div>
    </div>
  )
}

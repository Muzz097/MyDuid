import { useEffect, useRef, useState } from 'react'
import { CalendarClock, Sparkles } from 'lucide-react'
import { formatFullDate, formatMonthName } from './copy'

type CountdownState = {
  days: number
  hours: number
  minutes: number
  seconds: number
  reached: boolean
}

function computeCountdown(availableAt: string): CountdownState {
  const targetMs = new Date(`${availableAt}T00:00:00+07:00`).getTime()
  const diffMs = targetMs - Date.now()
  if (!Number.isFinite(diffMs) || diffMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, reached: true }
  }
  const totalSeconds = Math.floor(diffMs / 1000)
  const days = Math.floor(totalSeconds / 86_400)
  const hours = Math.floor((totalSeconds % 86_400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return { days, hours, minutes, seconds, reached: false }
}

function pad2(n: number): string {
  return String(Math.max(0, n)).padStart(2, '0')
}

function CountdownTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="relative overflow-hidden rounded-[var(--radius-card)] bg-gradient-to-b from-brand-400/50 to-brand-900/60 p-[1px] shadow-md">
      <div className="relative flex flex-col items-center justify-center rounded-[calc(var(--radius-card)-1px)] bg-brand-900/90 px-2 py-3 text-white sm:px-3 sm:py-3.5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
        />
        <span
          key={value}
          className="wrapped-tile-flip text-2xl font-extrabold leading-none tracking-tight tabular-nums sm:text-3xl"
        >
          {value}
        </span>
        <span className="mt-1.5 text-[10px] font-semibold tracking-widest text-white/75">
          {label}
        </span>
      </div>
    </div>
  )
}

export function WrappedCountdown({
  upcomingMonth,
  availableAt,
  onZero,
}: {
  upcomingMonth: string
  availableAt: string
  onZero: () => void
}) {
  const [state, setState] = useState<CountdownState>(() =>
    computeCountdown(availableAt),
  )
  const [srMinuteText, setSrMinuteText] = useState(() => {
    const initial = computeCountdown(availableAt)
    return `${initial.days} hari ${initial.hours} jam ${initial.minutes} menit`
  })
  const reloadedRef = useRef(false)
  const onZeroRef = useRef(onZero)

  useEffect(() => {
    onZeroRef.current = onZero
  }, [onZero])

  useEffect(() => {
    reloadedRef.current = false
    let intervalId: number | null = null

    const sync = () => {
      const next = computeCountdown(availableAt)
      setState(next)
      const minuteLabel = `${next.days} hari ${next.hours} jam ${next.minutes} menit`
      setSrMinuteText((prev) => (prev === minuteLabel ? prev : minuteLabel))

      if (next.reached && !reloadedRef.current) {
        reloadedRef.current = true
        onZeroRef.current()
      }
    }

    const startTimer = () => {
      if (intervalId !== null) return
      intervalId = window.setInterval(sync, 1000)
    }

    const stopTimer = () => {
      if (intervalId !== null) {
        window.clearInterval(intervalId)
        intervalId = null
      }
    }

    const onVisibilityChange = () => {
      if (document.hidden) {
        stopTimer()
      } else {
        sync()
        startTimer()
      }
    }

    sync()
    if (!document.hidden) {
      startTimer()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      stopTimer()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [availableAt])

  const monthName = formatMonthName(upcomingMonth)
  const availableLabel = formatFullDate(availableAt)

  return (
    <section
      aria-label={`Hitung mundur MyDuid Wrapped ${monthName}`}
      className="relative overflow-hidden rounded-[var(--radius-card)] bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 p-4 text-white shadow-md sm:p-5"
    >
      {/* Subtle decorative circles */}
      <div
        aria-hidden="true"
        className="wrapped-countdown-sheen pointer-events-none absolute -right-10 -top-10 size-36 rounded-full bg-white/10 blur-xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-12 -left-10 size-40 rounded-full bg-brand-400/20 blur-2xl"
      />

      <div className="relative z-10 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
            {state.reached ? (
              <Sparkles className="size-5" aria-hidden="true" />
            ) : (
              <CalendarClock className="size-5" aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold leading-snug sm:text-base">
              {state.reached
                ? 'Wrapped sudah tersedia'
                : `MyDuid Wrapped ${monthName} tersedia dalam`}
            </p>
            <p className="mt-0.5 text-xs text-white/80">
              Terbuka otomatis pada {availableLabel} pukul 00:00 WIB
            </p>
          </div>
        </div>

        {!state.reached && (
          <div
            aria-hidden="true"
            className="grid grid-cols-4 gap-2 sm:gap-3"
          >
            <CountdownTile value={pad2(state.days)} label="HARI" />
            <CountdownTile value={pad2(state.hours)} label="JAM" />
            <CountdownTile value={pad2(state.minutes)} label="MENIT" />
            <CountdownTile value={pad2(state.seconds)} label="DETIK" />
          </div>
        )}

        <span aria-live="off" className="sr-only">
          {state.reached
            ? `Wrapped ${monthName} sudah tersedia.`
            : `MyDuid Wrapped ${monthName} tersedia dalam ${srMinuteText}.`}
        </span>
      </div>
    </section>
  )
}

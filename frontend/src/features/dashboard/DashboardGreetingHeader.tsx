import { useEffect, useState } from 'react'
import { Bell, Sparkles } from 'lucide-react'
import { ThemeSwitcher } from '@/components/layout/ThemeSwitcher'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/cn'

export interface DashboardGreetingHeaderProps {
  className?: string
}

function getGreetingWIB(): string {
  // Asia/Jakarta local hour
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    hour: 'numeric',
    hour12: false,
  })
  const hour = parseInt(formatter.format(new Date()), 10)

  if (hour >= 4 && hour < 11) return 'Selamat pagi'
  if (hour >= 11 && hour < 15) return 'Selamat siang'
  if (hour >= 15 && hour < 18) return 'Selamat sore'
  return 'Selamat malam'
}

export function DashboardGreetingHeader({ className }: DashboardGreetingHeaderProps) {
  const { user } = useAuth()
  const [greeting] = useState(() => getGreetingWIB())
  const [isVisibleMobile, setIsVisibleMobile] = useState(true)

  // Auto-hide on mobile scroll down, reappear when scroll up or at top
  useEffect(() => {
    let lastScrollY = window.scrollY
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY
          // If at the very top (within 20px), always show
          if (currentScrollY <= 20) {
            setIsVisibleMobile(true)
          } else if (currentScrollY > lastScrollY && currentScrollY > 60) {
            // Scrolling down -> hide header on mobile
            setIsVisibleMobile(false)
          } else if (currentScrollY < lastScrollY) {
            // Scrolling up -> show header on mobile
            setIsVisibleMobile(true)
          }
          lastScrollY = currentScrollY
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Display user's first name if available
  const firstName = user?.name ? user.name.split(' ')[0] : 'Kawan'

  return (
    <div
      className={cn(
        'transition-all duration-300 ease-out',
        // On mobile, animate transform up to hide when scrolling down
        !isVisibleMobile && '-translate-y-8 opacity-0 pointer-events-none md:translate-y-0 md:opacity-100 md:pointer-events-auto',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3 min-w-0">
          {/* User avatar / initial */}
          <div className="relative flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 font-bold text-white shadow-sm ring-2 ring-brand-200/50 dark:ring-brand-800/40">
            <span>{user?.name ? user.name.charAt(0).toUpperCase() : 'M'}</span>
            <span
              className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-card bg-income-500"
              title="Aktif"
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-medium text-ink-soft">
              <span>{greeting}</span>
              <Sparkles size={13} className="text-amber-500" aria-hidden />
            </div>
            <h1 className="truncate text-lg sm:text-xl font-bold tracking-tight text-ink">
              {firstName} 👋
            </h1>
          </div>
        </div>

        {/* Right side controls: Notification & ThemeSwitcher */}
        <div className="flex items-center gap-2">
          {/* Notification icon button (shows peaceful status) */}
          <button
            type="button"
            aria-label="Pemberitahuan"
            title="Tidak ada notifikasi baru"
            className="relative inline-flex size-9 items-center justify-center rounded-[var(--radius-control)] border border-line/70 bg-card text-ink-soft transition duration-150 hover:bg-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            <Bell size={18} strokeWidth={1.8} aria-hidden />
          </button>

          <div className="inline-flex">
            <ThemeSwitcher />
          </div>
        </div>
      </div>
    </div>
  )
}

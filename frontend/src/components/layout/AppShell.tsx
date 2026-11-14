import {
  Home,
  MoreHorizontal,
  PiggyBank,
  Plus,
  Receipt,
  Wallet,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

type SidebarLink = {
  to: string
  label: string
  icon: typeof Home
  end?: boolean
}

const sidebarLinks: SidebarLink[] = [
  { to: '/', label: 'Beranda', icon: Home, end: true },
  { to: '/transaksi', label: 'Transaksi', icon: Receipt },
  { to: '/dompet', label: 'Dompet', icon: Wallet },
  { to: '/anggaran', label: 'Anggaran', icon: PiggyBank },
]

function navClassName({ isActive }: { isActive: boolean }) {
  return cn(
    'inline-flex min-h-11 items-center gap-3 rounded-[var(--radius-control)] px-3 text-sm font-medium text-ink-soft transition-colors',
    isActive && 'bg-brand-50 text-brand-700 dark:bg-muted dark:text-ink',
  )
}

function bottomNavClassName({ isActive }: { isActive: boolean }) {
  return cn(
    'flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-[var(--radius-control)] text-[11px] font-medium text-ink-soft',
    isActive && 'text-brand-700 dark:text-ink',
  )
}

export function AppShell() {
  return (
    <div className="flex min-h-dvh bg-page text-ink">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-card px-4 py-6 lg:flex">
        <div className="mb-8 flex items-center gap-3 px-2">
          <span className="inline-flex size-10 items-center justify-center rounded-[var(--radius-control)] bg-brand-500 text-lg font-bold text-white">
            M
          </span>
          <span className="text-lg font-semibold text-ink">MyDuid</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1" aria-label="Menu utama">
          {sidebarLinks.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={navClassName}>
              <Icon className="size-5 shrink-0" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>

        <Button
          variant="primary"
          fullWidth
          // TODO: buka form catat transaksi
          onClick={() => {}}
        >
          Catat Transaksi
        </Button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <main
          className={cn(
            'mx-auto w-full max-w-5xl flex-1 px-4 py-6',
            'pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:px-8 lg:pb-8',
          )}
        >
          <Outlet />
        </main>

        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
          aria-label="Navigasi bawah"
        >
          <div className="relative flex items-end px-2 pt-1">
            <NavLink to="/" end className={bottomNavClassName}>
              {({ isActive }) => (
                <>
                  <Home
                    className={cn('size-5', isActive && 'text-brand-600')}
                    aria-hidden
                  />
                  Beranda
                </>
              )}
            </NavLink>

            <NavLink to="/transaksi" className={bottomNavClassName}>
              {({ isActive }) => (
                <>
                  <Receipt
                    className={cn('size-5', isActive && 'text-brand-600')}
                    aria-hidden
                  />
                  Transaksi
                </>
              )}
            </NavLink>

            <div className="flex flex-1 items-center justify-center">
              <button
                type="button"
                aria-label="Catat transaksi"
                // TODO: buka form catat transaksi
                onClick={() => {}}
                className="-mt-5 inline-flex size-14 items-center justify-center rounded-full bg-brand-500 text-white shadow-[var(--shadow-card)] transition-transform active:scale-[0.98]"
              >
                <Plus className="size-7" aria-hidden />
              </button>
            </div>

            <NavLink to="/anggaran" className={bottomNavClassName}>
              {({ isActive }) => (
                <>
                  <PiggyBank
                    className={cn('size-5', isActive && 'text-brand-600')}
                    aria-hidden
                  />
                  Anggaran
                </>
              )}
            </NavLink>

            <NavLink to="/lainnya" className={bottomNavClassName}>
              {({ isActive }) => (
                <>
                  <MoreHorizontal
                    className={cn('size-5', isActive && 'text-brand-600')}
                    aria-hidden
                  />
                  Lainnya
                </>
              )}
            </NavLink>
          </div>
        </nav>
      </div>
    </div>
  )
}

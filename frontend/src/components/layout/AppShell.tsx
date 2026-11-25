import {
  BarChart3,
  Bot,
  Calendar,
  ChevronRight,
  Home,
  LogOut,
  PiggyBank,
  Plus,
  Receipt,
  Wallet,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { PageTransition } from '@/components/ui/Motion'
import { ThemeSwitcher } from '@/components/layout/ThemeSwitcher'
import {
  AddTransactionProvider,
  useAddTransaction,
} from '@/features/transactions/AddTransactionContext'
import { WalletDetailPanel } from '@/features/wallets/WalletDetailPanel'
import { WalletDetailProvider } from '@/features/wallets/WalletDetailContext'
import { QuickActionSheet } from '@/features/transactions/QuickActionSheet'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/cn'
import { useHideOnScroll } from '@/hooks/useHideOnScroll'

type NavItem = {
  to?: string
  label: string
  icon: typeof Home
  end?: boolean
  disabled?: boolean
  badge?: string
}

type NavGroup = {
  title: string
  items: NavItem[]
}

const sidebarGroups: NavGroup[] = [
  {
    title: 'Ringkasan',
    items: [
      { to: '/', label: 'Beranda', icon: Home, end: true },
    ],
  },
  {
    title: 'Kelola Keuangan',
    items: [
      { to: '/transaksi', label: 'Transaksi', icon: Receipt },
      { to: '/dompet', label: 'Dompet', icon: Wallet },
    ],
  },
  {
    title: 'Perencanaan',
    items: [
      { to: '/anggaran', label: 'Anggaran', icon: PiggyBank },
    ],
  },
  {
    title: 'Analisis',
    items: [
      { to: '/kalender', label: 'Kalender', icon: Calendar },
      {
        label: 'Laporan',
        icon: BarChart3,
        disabled: true,
        badge: 'Segera Hadir',
      },
    ],
  },
  {
    title: 'Asisten',
    items: [
      {
        label: 'Asisten',
        icon: Bot,
        disabled: true,
        badge: 'Segera Hadir',
      },
    ],
  },
]

function getPageMeta(pathname: string): { title: string; subtitle: string } {
  switch (pathname) {
    case '/':
      return { title: 'Beranda', subtitle: 'Ringkasan keuangan dan aktivitas Anda' }
    case '/transaksi':
      return { title: 'Transaksi', subtitle: 'Kelola dan lacak riwayat transaksi' }
    case '/kalender':
      return { title: 'Kalender Keuangan', subtitle: 'Pantau arus kas harian dan riwayat tanggal' }
    case '/dompet':
      return { title: 'Dompet', subtitle: 'Atur rekening dan sumber dana' }
    case '/anggaran':
      return { title: 'Anggaran', subtitle: 'Pantau batas pengeluaran bulanan' }
    case '/lainnya':
      return { title: 'Lainnya', subtitle: 'Pengaturan akun dan preferensi' }
    default:
      return { title: 'MyDuid', subtitle: 'Kelola keuangan dengan bijak' }
  }
}

function navClassName({ isActive }: { isActive: boolean }) {
  return cn(
    'group flex min-h-11 items-center justify-between rounded-[var(--radius-control)] px-3 text-sm font-medium transition duration-200 active:scale-[0.98]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
    isActive
      ? 'bg-brand-500/10 font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400'
      : 'text-ink-soft hover:bg-muted/70 hover:text-ink',
  )
}

function bottomNavClassName({ isActive }: { isActive: boolean }) {
  return cn(
    'relative flex min-h-12 min-w-12 flex-1 flex-col items-center justify-center gap-1 rounded-[var(--radius-control)] text-[11px] font-medium transition duration-200 active:scale-[0.98]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
    isActive
      ? 'font-semibold text-brand-600 dark:text-brand-400'
      : 'text-ink-soft hover:text-ink',
  )
}

function AppShellInner() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { openAddTransaction } = useAddTransaction()
  const [quickActionOpen, setQuickActionOpen] = useState(false)
  const headerHidden = useHideOnScroll()

  const meta = getPageMeta(pathname)

  async function handleLogout() {
    await logout()
    navigate('/masuk', { replace: true })
  }

  return (
    <div className="flex min-h-dvh bg-page text-ink antialiased">
      {/* 1. Desktop Sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-card px-4 py-5 lg:flex">
        {/* Brand */}
        <div className="mb-6 flex items-center gap-3 px-2">
          <div className="flex size-10 items-center justify-center rounded-[var(--radius-control)] bg-brand-500 font-bold text-white shadow-sm shadow-brand-500/20">
            M
          </div>
          <div>
            <div className="text-lg font-bold leading-tight text-ink">MyDuid</div>
            <div className="text-[11px] font-medium text-ink-soft">Personal Finance</div>
          </div>
        </div>

        {/* Navigation Groups */}
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto pr-1">
          {sidebarGroups.map((group) => (
            <div key={group.title} className="flex flex-col gap-1">
              <span className="px-3 text-[11px] font-bold tracking-wider text-ink-soft/80 uppercase">
                {group.title}
              </span>
              <nav className="flex flex-col gap-0.5" aria-label={group.title}>
                {group.items.map((item) => {
                  const Icon = item.icon
                  if (item.disabled || !item.to) {
                    return (
                      <div
                        key={item.label}
                        aria-disabled="true"
                        className="flex min-h-11 cursor-not-allowed items-center justify-between rounded-[var(--radius-control)] px-3 text-sm font-medium text-ink-soft/50"
                      >
                        <div className="flex items-center gap-3">
                          <Icon size={19} strokeWidth={1.75} className="shrink-0" aria-hidden />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="rounded-full bg-muted/80 px-2 py-0.5 text-[10px] font-medium text-ink-soft/70">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )
                  }

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={navClassName}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={19} strokeWidth={1.75} className="shrink-0" aria-hidden />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight
                        size={15}
                        strokeWidth={1.75}
                        className="text-ink-soft/40 transition duration-200 group-hover:translate-x-0.5 group-hover:text-ink-soft"
                        aria-hidden
                      />
                    </NavLink>
                  )
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* User Card & Sidebar Actions */}
        <div className="mt-4 flex flex-col gap-2.5 border-t border-line pt-4">
          <Button
            variant="primary"
            fullWidth
            onClick={() => setQuickActionOpen(true)}
            className="gap-2 shadow-sm shadow-brand-500/20"
          >
            <Plus size={18} strokeWidth={2} aria-hidden />
            Catat Transaksi
          </Button>

          <div className="flex items-center justify-between rounded-[var(--radius-control)] bg-muted/40 p-2">
            <div className="min-w-0 pr-2">
              <p className="truncate text-xs font-semibold text-ink">{user?.name ?? 'Pengguna'}</p>
              <p className="truncate text-[11px] text-ink-soft">{user?.email ?? ''}</p>
            </div>
            <button
              type="button"
              aria-label="Keluar akun"
              title="Keluar akun"
              onClick={() => void handleLogout()}
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-control)] text-ink-soft transition duration-200 hover:bg-muted hover:text-expense-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            >
              <LogOut size={16} strokeWidth={1.75} aria-hidden />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* 2. Header */}
        <header
          className={cn(
            'sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-line bg-card/85 px-4 backdrop-blur-md transition duration-200 lg:px-8 lg:translate-y-0 lg:opacity-100',
            headerHidden && '-translate-y-full opacity-0',
          )}
        >
          {/* Mobile Brand */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="flex size-9 items-center justify-center rounded-[var(--radius-control)] bg-brand-500 font-bold text-white shadow-sm shadow-brand-500/20">
              M
            </div>
            <div>
              <span className="font-bold text-ink">MyDuid</span>
              <span className="block text-[10px] text-ink-soft font-medium leading-none">Personal Finance</span>
            </div>
          </div>

          {/* Desktop Page Info */}
          <div className="hidden lg:block">
            <h1 className="text-base font-bold text-ink leading-tight">{meta.title}</h1>
            <p className="text-xs text-ink-soft">{meta.subtitle}</p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <NavLink
              to="/kalender"
              className={({ isActive }) =>
                cn(
                  'inline-flex size-9 items-center justify-center rounded-[var(--radius-control)] transition duration-200 lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                  isActive
                    ? 'bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400'
                    : 'text-ink-soft hover:bg-muted hover:text-ink',
                )
              }
              title="Kalender Keuangan"
              aria-label="Kalender Keuangan"
            >
              <Calendar size={18} strokeWidth={1.75} aria-hidden />
            </NavLink>
            <ThemeSwitcher />
          </div>
        </header>

        {/* Page Content */}
        <main
          className={cn(
            'mx-auto w-full max-w-5xl flex-1 px-4 py-6',
            'pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:px-8 lg:pb-8',
          )}
        >
          <PageTransition transitionKey={pathname}>
            <Outlet />
          </PageTransition>
        </main>

        {/* 3. Mobile Bottom Navigation */}
        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
          aria-label="Navigasi bawah"
        >
          <div className="relative flex items-center justify-around px-2 pt-1.5 pb-1">
            {/* 1. Beranda */}
            <NavLink to="/" end className={bottomNavClassName}>
              {({ isActive }) => (
                <>
                  <Home
                    size={20}
                    strokeWidth={isActive ? 2.25 : 1.75}
                    className={cn(isActive && 'text-brand-600 dark:text-brand-400')}
                    aria-hidden
                  />
                  <span>Beranda</span>
                </>
              )}
            </NavLink>

            {/* 2. Transaksi */}
            <NavLink to="/transaksi" className={bottomNavClassName}>
              {({ isActive }) => (
                <>
                  <Receipt
                    size={20}
                    strokeWidth={isActive ? 2.25 : 1.75}
                    className={cn(isActive && 'text-brand-600 dark:text-brand-400')}
                    aria-hidden
                  />
                  <span>Transaksi</span>
                </>
              )}
            </NavLink>

            {/* 3. Catat (+) Central Action Button */}
            <div className="flex flex-1 items-center justify-center">
              <button
                type="button"
                aria-label="Catat transaksi baru"
                onClick={() => setQuickActionOpen(true)}
                className="-mt-5 inline-flex size-14 items-center justify-center rounded-full bg-brand-500 text-white shadow-[0_8px_20px_color-mix(in_srgb,var(--color-brand-500)_35%,transparent)] transition duration-200 hover:scale-105 hover:bg-brand-600 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              >
                <Plus size={28} strokeWidth={2.25} aria-hidden />
              </button>
            </div>

            {/* 4. Dompet Navigation */}
            <NavLink to="/dompet" className={bottomNavClassName}>
              {({ isActive }) => (
                <>
                  <Wallet
                    size={20}
                    strokeWidth={isActive ? 2.25 : 1.75}
                    className={cn(isActive && 'text-brand-600 dark:text-brand-400')}
                    aria-hidden
                  />
                  <span>Dompet</span>
                </>
              )}
            </NavLink>

            {/* 5. Anggaran Navigation */}
            <NavLink to="/anggaran" className={bottomNavClassName}>
              {({ isActive }) => (
                <>
                  <PiggyBank
                    size={20}
                    strokeWidth={isActive ? 2.25 : 1.75}
                    className={cn(isActive && 'text-brand-600 dark:text-brand-400')}
                    aria-hidden
                  />
                  <span>Anggaran</span>
                </>
              )}
            </NavLink>
          </div>
        </nav>
      </div>

      {/* Quick Action Sheet */}
      <QuickActionSheet
        open={quickActionOpen}
        onClose={() => setQuickActionOpen(false)}
        onSelectExpense={() => openAddTransaction('expense')}
        onSelectIncome={() => openAddTransaction('income')}
      />
    </div>
  )
}

export function AppShell() {
  return (
    <AddTransactionProvider>
      <WalletDetailProvider>
        <WalletDetailPanel />
        <AppShellInner />
      </WalletDetailProvider>
    </AddTransactionProvider>
  )
}

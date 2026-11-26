import { useCallback, useEffect, useState } from 'react'
import { ArrowRight, Plus, Receipt, Wallet } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Button,
  Card,
  SectionHeader,
  Skeleton,
  TransactionItem,
  useToast,
  SectionMotion,
  WalletCard,
} from '@/components/ui'
import { useAddTransaction } from '@/features/transactions/AddTransactionContext'
import { AddWalletCard } from '@/features/wallets/AddWalletCard'
import { useWalletDetail } from '@/features/wallets/useWalletDetail'
import { useCountUp } from '@/hooks/useCountUp'
import { useDragScroll } from '@/hooks/useDragScroll'
import { cn } from '@/lib/cn'
import { ApiError, api } from '@/lib/api'
import { useStore } from '@/lib/store'
import type { DashboardData } from '@/types'
import { DashboardGreetingHeader } from '@/features/dashboard/DashboardGreetingHeader'
import { TotalAssetCard } from '@/features/dashboard/TotalAssetCard'
import { MonthlySummaryCards } from '@/features/dashboard/MonthlySummaryCards'
import { CashFlowChart } from '@/features/dashboard/CashFlowChart'
import { CategoryComposition } from '@/features/dashboard/CategoryComposition'
import { BudgetProgressCard, type DashboardBudget } from '@/features/dashboard/BudgetProgressCard'

function currentMonth(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
  }).format(new Date())
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { openAddTransaction } = useAddTransaction()
  const { openWallet } = useWalletDetail()
  const { show } = useToast()
  const { wallets: storeWallets, version } = useStore()
  const { ref: carouselRef, isDragging, dragProps } = useDragScroll<HTMLDivElement>()

  const [balanceHidden, setBalanceHidden] = useState(false)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [dashLoading, setDashLoading] = useState(true)
  const [_dashError, setDashError] = useState<string | null>(null)

  const [budgets, setBudgets] = useState<DashboardBudget[]>([])
  const [budgetsLoading, setBudgetsLoading] = useState(true)

  // Fetch dashboard data
  const loadDashboard = useCallback(async () => {
    try {
      setDashLoading(true)
      setDashError(null)
      const res = await api<{ data: DashboardData }>(`/dashboard?month=${currentMonth()}`)
      setDashboardData(res.data)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Gagal memuat data dashboard'
      setDashError(msg)
      show({ message: msg, type: 'error' })
    } finally {
      setDashLoading(false)
    }
  }, [show])

  // Fetch budgets separately so slow budgets API does not block dashboard
  const loadBudgets = useCallback(async () => {
    try {
      setBudgetsLoading(true)
      const res = await api<{ data: DashboardBudget[] }>(`/budgets?month=${currentMonth()}`)
      setBudgets(
        [...res.data]
          .sort((left, right) => right.percent - left.percent)
          .slice(0, 3),
      )
    } catch {
      // Budgets are progressive, error does not crash the whole page
    } finally {
      setBudgetsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDashboard()
    void loadBudgets()
  }, [loadDashboard, loadBudgets, version])

  // Count up animation for balance
  const rawBalance = dashboardData?.total_balance ?? 0
  const animatedBalance = useCountUp(dashLoading ? 0 : rawBalance)

  // Data helpers
  const wallets = dashboardData?.wallets ?? storeWallets
  const income = dashboardData?.income ?? 0
  const expense = dashboardData?.expense ?? 0
  const dailyCashFlow = dashboardData?.daily_cash_flow ?? []
  const incomeCategories = dashboardData?.income_by_category ?? []
  const expenseCategories = dashboardData?.expense_by_category ?? []
  const recentTransactions = dashboardData?.recent_transactions ?? []

  return (
    <div className="space-y-6 pb-6">
      {/* 1. Personal Greeting / Header */}
      <DashboardGreetingHeader />

      {/* 2. Hero Total Aset Card */}
      <SectionMotion as="section" aria-label="Total Aset" delay={0}>
        {dashLoading && !dashboardData ? (
          <Skeleton className="h-44 w-full" rounded="card" />
        ) : (
          <TotalAssetCard
            totalBalance={animatedBalance}
            balanceHidden={balanceHidden}
            onToggleHide={() => setBalanceHidden((v) => !v)}
            walletCount={wallets.length}
          />
        )}
      </SectionMotion>

      {/* 3. Dompet Section */}
      <SectionMotion as="section" aria-label="Daftar Dompet" delay={40}>
        <SectionHeader
          title="Dompet & Rekening"
          subtitle={`${wallets.length} sumber dana aktif`}
          action={
            <Link
              to="/dompet"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 transition hover:text-brand-700 hover:underline dark:text-brand-400"
            >
              <span>Kelola</span>
              <ArrowRight size={13} aria-hidden />
            </Link>
          }
        />

        {dashLoading && !dashboardData ? (
          <div className="flex gap-3 overflow-hidden">
            <Skeleton className="h-28 w-52 shrink-0" rounded="card" />
            <Skeleton className="h-28 w-52 shrink-0" rounded="card" />
            <Skeleton className="h-28 w-52 shrink-0" rounded="card" />
          </div>
        ) : wallets.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-8 text-center" variant="subtle">
            <span className="mb-2 inline-flex size-10 items-center justify-center rounded-xl bg-muted text-ink-soft">
              <Wallet size={20} strokeWidth={1.75} aria-hidden />
            </span>
            <p className="text-sm font-medium text-ink">Belum ada dompet aktif</p>
            <p className="mt-0.5 text-xs text-ink-soft">
              Tambahkan uang kas, rekening bank, atau e-wallet Anda.
            </p>
            <Link to="/dompet?tambah=1" className="mt-3">
              <Button size="sm" variant="outline">
                Tambah Dompet
              </Button>
            </Link>
          </Card>
        ) : (
          <div
            ref={carouselRef}
            {...dragProps}
            className={cn(
              'flex gap-3 overflow-x-auto pb-2 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
              isDragging
                ? 'cursor-grabbing select-none snap-none'
                : 'cursor-grab snap-x snap-mandatory',
            )}
          >
            {wallets.map((wallet) => (
              <WalletCard
                key={wallet.id}
                wallet={wallet}
                size="compact"
                hidden={balanceHidden}
                onClick={() => openWallet(wallet.id)}
              />
            ))}
            <AddWalletCard
              size="compact"
              onClick={() => navigate('/dompet?tambah=1')}
            />
          </div>
        )}
      </SectionMotion>

      {/* 4. Monthly Summary Cards (Income, Expense, Net Cash Flow) -> Clickable to /kalender */}
      <SectionMotion as="section" aria-label="Ringkasan Bulanan" delay={80}>
        {dashLoading && !dashboardData ? (
          <div className="space-y-3">
            <Skeleton className="h-7 w-48 rounded-lg" />
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
              <Skeleton className="h-28 w-full" rounded="card" />
              <Skeleton className="h-28 w-full" rounded="card" />
              <Skeleton className="h-28 w-full" rounded="card" />
            </div>
          </div>
        ) : (
          <MonthlySummaryCards
            income={income}
            expense={expense}
            balanceHidden={balanceHidden}
          />
        )}
      </SectionMotion>

      {/* 5. Grafik Arus Kas (Daily / Weekly) */}
      <SectionMotion as="section" aria-label="Grafik Arus Kas" delay={120}>
        {dashLoading && !dashboardData ? (
          <Skeleton className="h-72 w-full" rounded="card" />
        ) : (
          <CashFlowChart data={dailyCashFlow} />
        )}
      </SectionMotion>

      {/* 6. Progres Anggaran & Komposisi Kategori (2 Columns on large) */}
      <SectionMotion className="grid grid-cols-1 gap-6 lg:grid-cols-2" delay={160}>
        {/* Progres Anggaran */}
        <section aria-label="Progres Anggaran" className="flex flex-col">
          <BudgetProgressCard
            budgets={budgets}
            loading={budgetsLoading}
          />
        </section>

        {/* Komposisi Kategori (Income / Expense tabs) */}
        <section aria-label="Komposisi Kategori" className="flex flex-col">
          {dashLoading && !dashboardData ? (
            <Skeleton className="h-72 w-full" rounded="card" />
          ) : (
            <CategoryComposition
              incomeCategories={incomeCategories}
              expenseCategories={expenseCategories}
              balanceHidden={balanceHidden}
              onAddTransaction={(type) => openAddTransaction(type)}
            />
          )}
        </section>
      </SectionMotion>

      {/* 7. Transaksi Terakhir Section */}
      <SectionMotion as="section" aria-label="Transaksi Terakhir" delay={200}>
        <SectionHeader
          title="Transaksi Terakhir"
          subtitle="Catatan keuangan baru-baru ini"
          action={
            <Link
              to="/transaksi"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 transition hover:text-brand-700 hover:underline dark:text-brand-400"
            >
              <span>Semua Transaksi</span>
              <ArrowRight size={13} aria-hidden />
            </Link>
          }
        />
        <Card className="!p-0 overflow-hidden">
          {dashLoading && !dashboardData ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <span className="mb-2 inline-flex size-12 items-center justify-center rounded-full bg-muted text-ink-soft">
                <Receipt size={24} strokeWidth={1.75} aria-hidden />
              </span>
              <p className="text-sm font-medium text-ink">Belum ada transaksi di bulan ini</p>
              <p className="mt-1 max-w-sm text-xs text-ink-soft">
                Mulai catat pengeluaran atau pemasukan pertama Anda untuk melihat histori di sini.
              </p>
              <Button
                size="sm"
                variant="primary"
                className="mt-4"
                onClick={() => openAddTransaction()}
                leftIcon={<Plus size={14} />}
              >
                Catat Transaksi
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-line px-5">
              {recentTransactions.map((tx) => {
                // Map to Transaction item format
                const mappedTx = {
                  id: tx.id,
                  walletId: tx.wallet?.id ?? 0,
                  categoryId: tx.category?.id ?? 0,
                  type: tx.type,
                  amount: tx.amount,
                  date: tx.transaction_date,
                  notes: tx.notes ?? undefined,
                }
                const categoryObj = tx.category
                  ? {
                      id: tx.category.id,
                      name: tx.category.name,
                      type: tx.type,
                      iconKey: tx.category.icon_key ?? 'default',
                    }
                  : null

                const walletObj = tx.wallet
                  ? {
                      id: tx.wallet.id,
                      name: tx.wallet.name,
                      type: 'cash' as const,
                      group: 'daily' as const,
                      cardTheme: 'default' as const,
                      iconType: 'preset' as const,
                      iconKey: 'default',
                      hasCardImage: false,
                      balance: 0,
                    }
                  : null

                return (
                  <TransactionItem
                    key={tx.id}
                    transaction={mappedTx}
                    category={categoryObj}
                    wallet={walletObj}
                    hidden={balanceHidden}
                  />
                )
              })}
            </div>
          )}
        </Card>
      </SectionMotion>
    </div>
  )
}

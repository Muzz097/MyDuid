import { useEffect, useState } from 'react'
import {
  ArrowRight,
  Plus,
  Receipt,
  Wallet,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import {
  Button,
  Card,
  FinancialSummary,
  MoneyText,
  ProgressBar,
  SectionHeader,
  Skeleton,
  TransactionItem,
  useToast,
} from '@/components/ui'
import { useAddTransaction } from '@/features/transactions/AddTransactionContext'
import { useCountUp } from '@/hooks/useCountUp'
import { ApiError, api } from '@/lib/api'
import { getIcon } from '@/lib/icons'
import { formatCompact, formatRupiah } from '@/lib/money'
import { useStore } from '@/lib/store'
import { monthSummary, totalBalance } from '@/lib/summary'
import type { Category, Transaction } from '@/types'

const PIE_COLORS = [
  'var(--color-expense-500)',
  'var(--color-expense-400)',
  'var(--color-warn-500)',
  'var(--color-brand-500)',
  'var(--color-brand-400)',
  'var(--color-info-500)',
]

type DashboardBudget = {
  id: number
  limit_amount: number
  spent: number
  percent: number
  category: { name: string } | null
  wallet: { name: string } | null
}

function currentMonth(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
  }).format(new Date())
}

function expenseByCategory(
  transactions: Transaction[],
  categories: Category[],
) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const totals = new Map<number, number>()

  for (const tx of transactions) {
    if (tx.type !== 'expense') continue
    const [y, m] = tx.date.split('-').map(Number)
    if (y !== year || m !== month) continue
    totals.set(tx.categoryId, (totals.get(tx.categoryId) ?? 0) + tx.amount)
  }

  return [...totals.entries()]
    .map(([categoryId, amount]) => {
      const category = categories.find((c) => c.id === categoryId)
      return {
        categoryId,
        name: category?.name ?? 'Lainnya',
        iconKey: category?.iconKey ?? 'default',
        amount,
      }
    })
    .sort((a, b) => b.amount - a.amount)
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-44 w-full" rounded="card" />
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <div className="flex gap-3 overflow-hidden">
          <Skeleton className="h-28 w-48 shrink-0" rounded="card" />
          <Skeleton className="h-28 w-48 shrink-0" rounded="card" />
          <Skeleton className="h-28 w-48 shrink-0" rounded="card" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-64" rounded="card" />
        <Skeleton className="h-64" rounded="card" />
      </div>
      <Skeleton className="h-64 w-full" rounded="card" />
    </div>
  )
}

export function DashboardPage() {
  const { wallets, transactions, categories } = useStore()
  const { show } = useToast()
  const { openAddTransaction } = useAddTransaction()
  const [balanceHidden, setBalanceHidden] = useState(false)
  const [loading, setLoading] = useState(true)
  const [budgets, setBudgets] = useState<DashboardBudget[]>([])
  const [now] = useState(() => new Date())

  const balance = totalBalance(wallets)
  const animatedBalance = useCountUp(loading ? 0 : balance)
  const { income, expense } = monthSummary(
    transactions,
    now.getFullYear(),
    now.getMonth() + 1,
  )
  const categorySpend = expenseByCategory(transactions, categories)
  const recent = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
    .slice(0, 5)

  const categoryById = new Map(categories.map((c) => [c.id, c]))
  const walletById = new Map(wallets.map((w) => [w.id, w]))

  useEffect(() => {
    let active = true
    api<{ data: DashboardBudget[] }>(`/budgets?month=${currentMonth()}`)
      .then((response) => {
        if (active) {
          setBudgets(
            [...response.data]
              .sort((left, right) => right.percent - left.percent)
              .slice(0, 3),
          )
        }
      })
      .catch((error: unknown) => {
        if (active) {
          show({
            message:
              error instanceof ApiError
                ? error.message
                : 'Progres anggaran gagal dimuat',
            type: 'error',
          })
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [show])

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6 pb-4">
      {/* 1. Hero financial summary */}
      <section aria-label="Ringkasan Saldo dan Arus Kas">
        <FinancialSummary
          totalBalance={animatedBalance}
          income={income}
          expense={expense}
          balanceHidden={balanceHidden}
          onToggleHide={() => setBalanceHidden((v) => !v)}
          className="animate-fade-up shadow-[var(--shadow-card)]"
        />
      </section>

      {/* 2. Dompet Section */}
      <section aria-label="Daftar Dompet">
        <SectionHeader
          title="Dompet & Rekening"
          subtitle={`${wallets.length} sumber dana aktif`}
          action={
            <Link
              to="/dompet"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 transition hover:text-brand-700 hover:underline"
            >
              <span>Kelola</span>
              <ArrowRight size={13} aria-hidden />
            </Link>
          }
        />
        {wallets.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-8 text-center" variant="subtle">
            <span className="mb-2 inline-flex size-10 items-center justify-center rounded-xl bg-muted text-ink-soft">
              <Wallet size={20} strokeWidth={1.75} aria-hidden />
            </span>
            <p className="text-sm font-medium text-ink">Belum ada dompet</p>
            <p className="mt-0.5 text-xs text-ink-soft">
              Tambahkan kas, rekening bank, atau e-wallet Anda.
            </p>
            <Link to="/dompet" className="mt-3">
              <Button size="sm" variant="outline">
                Tambah Dompet
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1.5 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {wallets.map((wallet) => {
              const WalletIcon = getIcon(wallet.iconKey)
              return (
                <div
                  key={wallet.id}
                  className="group relative flex w-48 shrink-0 snap-start flex-col justify-between rounded-[var(--radius-card)] border border-line bg-card p-4 transition duration-150 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition duration-150 group-hover:scale-105 dark:bg-brand-900/30 dark:text-brand-300">
                      <WalletIcon size={20} strokeWidth={1.75} aria-hidden />
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-ink-soft capitalize">
                      {wallet.type}
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="truncate text-xs font-medium text-ink-soft">
                      {wallet.name}
                    </p>
                    <p className="mt-0.5 tabular-nums text-base font-bold text-ink tracking-tight">
                      {balanceHidden ? 'Rp ••••••' : formatRupiah(wallet.balance)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* 3. Progres Anggaran & Pengeluaran Per Kategori (2 Columns on large) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Progres Anggaran */}
        <section aria-label="Progres Anggaran" className="flex flex-col">
          <SectionHeader
            title="Progres Anggaran"
            subtitle="Pantauan batas bulan ini"
            action={
              <Link
                to="/anggaran"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 transition hover:text-brand-700 hover:underline"
              >
                <span>Lihat Semua</span>
                <ArrowRight size={13} aria-hidden />
              </Link>
            }
          />
          <Card className="flex flex-1 flex-col justify-between">
            {budgets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm font-medium text-ink">Belum ada anggaran</p>
                <p className="mt-1 max-w-xs text-xs text-ink-soft">
                  Buat anggaran bulanan untuk mengendalikan pengeluaran Anda dengan lebih disiplin.
                </p>
                <Link to="/anggaran" className="mt-4">
                  <Button size="sm" variant="outline" leftIcon={<Plus size={14} />}>
                    Buat Anggaran
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {budgets.map((budget) => (
                  <ProgressBar
                    key={budget.id}
                    value={budget.spent}
                    max={budget.limit_amount}
                    label={
                      budget.category && budget.wallet
                        ? `${budget.category.name} · ${budget.wallet.name}`
                        : budget.category?.name ?? budget.wallet?.name ?? 'Anggaran'
                    }
                  />
                ))}
              </div>
            )}
          </Card>
        </section>

        {/* Pengeluaran per Kategori */}
        <section aria-label="Pengeluaran per Kategori" className="flex flex-col">
          <SectionHeader
            title="Pengeluaran Kategori"
            subtitle="Distribusi pengeluaran bulan ini"
          />
          <Card className="flex flex-1 flex-col justify-between">
            {categorySpend.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm font-medium text-ink">Belum ada pengeluaran</p>
                <p className="mt-1 max-w-xs text-xs text-ink-soft">
                  Transaksi pengeluaran bulan ini akan dikelompokkan otomatis di sini.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4"
                  onClick={() => openAddTransaction('expense')}
                  leftIcon={<Plus size={14} />}
                >
                  Catat Pengeluaran
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative mx-auto h-44 w-full max-w-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip
                        formatter={(val: unknown) => [
                          formatRupiah(Number(val) || 0),
                          'Nominal',
                        ]}
                        contentStyle={{
                          backgroundColor: 'var(--color-card)',
                          borderColor: 'var(--color-line)',
                          borderRadius: 'var(--radius-control)',
                          color: 'var(--color-ink)',
                          fontSize: '12px',
                        }}
                      />
                      <Pie
                        data={categorySpend}
                        dataKey="amount"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={72}
                        paddingAngle={3}
                        stroke="none"
                        isAnimationActive
                        animationDuration={600}
                      >
                        {categorySpend.map((entry, index) => (
                          <Cell
                            key={entry.categoryId}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-ink-soft">
                      Total
                    </p>
                    <p className="tabular-nums text-sm font-bold text-expense-500">
                      {balanceHidden ? 'Rp ••••••' : formatCompact(expense)}
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-line/60 border-t border-line/60 pt-2">
                  {categorySpend.slice(0, 4).map((entry, index) => {
                    const LegendIcon = getIcon(entry.iconKey)
                    const percent = expense > 0 ? Math.round((entry.amount / expense) * 100) : 0
                    return (
                      <div
                        key={entry.categoryId}
                        className="flex items-center justify-between gap-3 py-2 text-xs"
                      >
                        <span className="inline-flex min-w-0 items-center gap-2 text-ink">
                          <span
                            className="size-2 shrink-0 rounded-full"
                            style={{
                              backgroundColor:
                                PIE_COLORS[index % PIE_COLORS.length],
                            }}
                            aria-hidden
                          />
                          <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-expense-50 text-expense-500 dark:bg-expense-950/40 dark:text-expense-400">
                            <LegendIcon size={14} strokeWidth={1.75} aria-hidden />
                          </span>
                          <span className="truncate font-medium">{entry.name}</span>
                          <span className="text-[11px] text-ink-soft">({percent}%)</span>
                        </span>
                        <MoneyText
                          amount={entry.amount}
                          type="expense"
                          className="tabular-nums text-xs font-semibold"
                          hidden={balanceHidden}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </Card>
        </section>
      </div>

      {/* 4. Transaksi Terakhir Section */}
      <section aria-label="Transaksi Terakhir">
        <SectionHeader
          title="Transaksi Terakhir"
          subtitle="Catatan keuangan baru-baru ini"
          action={
            <Link
              to="/transaksi"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 transition hover:text-brand-700 hover:underline"
            >
              <span>Semua Transaksi</span>
              <ArrowRight size={13} aria-hidden />
            </Link>
          }
        />
        <Card className="!p-0 overflow-hidden">
          {recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <span className="mb-2 inline-flex size-12 items-center justify-center rounded-full bg-muted text-ink-soft">
                <Receipt size={24} strokeWidth={1.75} aria-hidden />
              </span>
              <p className="text-sm font-medium text-ink">Belum ada transaksi</p>
              <p className="mt-1 max-w-sm text-xs text-ink-soft">
                Mulai catat transaksi pertama Anda untuk melihat histori di sini.
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
              {recent.map((tx) => (
                <TransactionItem
                  key={tx.id}
                  transaction={tx}
                  category={categoryById.get(tx.categoryId)}
                  wallet={walletById.get(tx.walletId)}
                  hidden={balanceHidden}
                />
              ))}
            </div>
          )}
        </Card>
      </section>
    </div>
  )
}

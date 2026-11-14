import { useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { Card } from '@/components/ui/Card'
import { MoneyText } from '@/components/ui/MoneyText'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Skeleton } from '@/components/ui/Skeleton'
import { useCountUp } from '@/hooks/useCountUp'
import { cn } from '@/lib/cn'
import { getIcon } from '@/lib/icons'
import { formatCompact } from '@/lib/money'
import { useStore } from '@/lib/store'
import { monthSummary, totalBalance } from '@/lib/summary'
import { budgets } from '@/mocks/data'
import type { Category, Transaction } from '@/types'

const PIE_COLORS = [
  'var(--color-expense-500)',
  'var(--color-expense-400)',
  'var(--color-warn-500)',
  'var(--color-brand-400)',
]

function formatShortDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`)
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
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
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2" aria-busy="true">
      <Skeleton className="h-28 lg:col-span-2" />
      <div className="grid grid-cols-2 gap-4 lg:col-span-2">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <div className="flex gap-3 lg:col-span-2">
        <Skeleton className="h-28 w-44 shrink-0" />
        <Skeleton className="h-28 w-44 shrink-0" />
        <Skeleton className="h-28 w-44 shrink-0" />
      </div>
      <Skeleton className="h-48" />
      <Skeleton className="h-48" />
      <Skeleton className="h-64 lg:col-span-2" />
    </div>
  )
}

export function DashboardPage() {
  const { wallets, transactions, categories } = useStore()
  const [balanceHidden, setBalanceHidden] = useState(false)
  const [loading, setLoading] = useState(true)
  const now = new Date()
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
    const timer = window.setTimeout(() => setLoading(false), 600)
    return () => window.clearTimeout(timer)
  }, [])

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* a. Hero saldo */}
      <Card
        className="animate-fade-up lg:col-span-2"
        style={{ animationDelay: '0ms' }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-sm text-ink-soft">Total saldo</p>
            <MoneyText
              amount={animatedBalance}
              type="neutral"
              hidden={balanceHidden}
              className="text-3xl"
            />
          </div>
          <button
            type="button"
            aria-label={balanceHidden ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
            aria-pressed={balanceHidden}
            onClick={() => setBalanceHidden((v) => !v)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-control)] text-ink-soft transition duration-200 hover:bg-muted active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            <span className="relative inline-flex size-5">
              <Eye
                size={20}
                strokeWidth={1.75}
                aria-hidden
                className={cn(
                  'absolute inset-0 transition duration-200',
                  balanceHidden
                    ? 'rotate-90 opacity-0'
                    : 'rotate-0 opacity-100',
                )}
              />
              <EyeOff
                size={20}
                strokeWidth={1.75}
                aria-hidden
                className={cn(
                  'absolute inset-0 transition duration-200',
                  balanceHidden
                    ? 'rotate-0 opacity-100'
                    : '-rotate-90 opacity-0',
                )}
              />
            </span>
          </button>
        </div>
      </Card>

      {/* b. Ringkasan bulan */}
      <div
        className="animate-fade-up grid grid-cols-2 gap-4 lg:col-span-2"
        style={{ animationDelay: '70ms' }}
      >
        <Card>
          <p className="text-sm text-ink-soft">Pemasukan bulan ini</p>
          <MoneyText
            amount={income}
            type="income"
            className="mt-2 text-lg"
            hidden={balanceHidden}
          />
        </Card>
        <Card>
          <p className="text-sm text-ink-soft">Pengeluaran bulan ini</p>
          <MoneyText
            amount={expense}
            type="expense"
            className="mt-2 text-lg"
            hidden={balanceHidden}
          />
        </Card>
      </div>

      {/* c. Carousel dompet */}
      <section
        className="animate-fade-up lg:col-span-2"
        style={{ animationDelay: '140ms' }}
        aria-label="Dompet"
      >
        <h2 className="mb-3 text-base font-semibold text-ink">Dompet</h2>
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {wallets.map((wallet) => {
            const WalletIcon = getIcon(wallet.iconKey)
            return (
              <Card
                key={wallet.id}
                role="button"
                tabIndex={0}
                className="w-44 shrink-0 cursor-pointer snap-start p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
              >
                <div className="mb-3 inline-flex size-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                  <WalletIcon size={22} strokeWidth={1.75} aria-hidden />
                </div>
                <p className="truncate text-sm font-medium text-ink">
                  {wallet.name}
                </p>
                <p className="mt-1 tabular text-sm font-bold text-ink">
                  {balanceHidden ? 'Rp ••••••' : formatCompact(wallet.balance)}
                </p>
              </Card>
            )
          })}
        </div>
      </section>

      {/* d. Progres anggaran */}
      <Card
        className="animate-fade-up"
        style={{ animationDelay: '210ms' }}
      >
        <h2 className="mb-4 text-base font-semibold text-ink">
          Progres anggaran
        </h2>
        <div className="flex flex-col gap-4">
          {budgets.map((budget) => {
            const category = categoryById.get(budget.categoryId)
            return (
              <ProgressBar
                key={budget.id}
                value={budget.spent}
                max={budget.limit}
                label={category?.name ?? 'Kategori'}
              />
            )
          })}
        </div>
      </Card>

      {/* e. Pengeluaran per kategori */}
      <Card
        className="animate-fade-up"
        style={{ animationDelay: '280ms' }}
      >
        <h2 className="mb-4 text-base font-semibold text-ink">
          Pengeluaran per kategori
        </h2>
        {categorySpend.length === 0 ? (
          <p className="text-sm text-ink-soft">Belum ada pengeluaran bulan ini.</p>
        ) : (
          <>
            <div className="relative mx-auto h-48 w-full max-w-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categorySpend}
                    dataKey="amount"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={76}
                    paddingAngle={2}
                    stroke="none"
                    isAnimationActive
                    animationDuration={700}
                    animationBegin={0}
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
                <p className="text-xs text-ink-soft">Total</p>
                <p className="tabular text-sm font-bold text-expense-500">
                  {balanceHidden ? 'Rp ••••••' : formatCompact(expense)}
                </p>
              </div>
            </div>
            <ul className="mt-4 space-y-2">
              {categorySpend.map((entry, index) => {
                const LegendIcon = getIcon(entry.iconKey)
                return (
                  <li
                    key={entry.categoryId}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="inline-flex min-w-0 items-center gap-2 text-ink">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                        }}
                        aria-hidden
                      />
                      <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-expense-50 text-expense-500">
                        <LegendIcon size={18} strokeWidth={1.75} aria-hidden />
                      </span>
                      <span className="truncate">{entry.name}</span>
                    </span>
                    <MoneyText
                      amount={entry.amount}
                      type="expense"
                      compact
                      className="text-sm"
                      hidden={balanceHidden}
                    />
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </Card>

      {/* f. Transaksi terakhir */}
      <Card
        className="animate-fade-up lg:col-span-2"
        style={{ animationDelay: '350ms' }}
      >
        <h2 className="mb-4 text-base font-semibold text-ink">
          Transaksi terakhir
        </h2>
        <ul className="divide-y divide-line">
          {recent.map((tx) => {
            const category = categoryById.get(tx.categoryId)
            const wallet = walletById.get(tx.walletId)
            const title = tx.notes?.trim() || category?.name || 'Transaksi'
            const TxIcon = getIcon(category?.iconKey ?? 'default')
            const toneClass =
              tx.type === 'income'
                ? 'bg-income-50 text-income-600'
                : 'bg-expense-50 text-expense-500'
            return (
              <li
                key={tx.id}
                className="flex min-h-11 items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span
                  className={cn(
                    'inline-flex size-10 shrink-0 items-center justify-center rounded-full',
                    toneClass,
                  )}
                  aria-hidden
                >
                  <TxIcon size={18} strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">
                    {title}
                  </p>
                  <p className="truncate text-xs text-ink-soft">
                    {wallet?.name ?? 'Dompet'} · {formatShortDate(tx.date)}
                  </p>
                </div>
                <MoneyText
                  amount={tx.amount}
                  type={tx.type}
                  className="shrink-0 text-sm"
                  hidden={balanceHidden}
                />
              </li>
            )
          })}
        </ul>
      </Card>
    </div>
  )
}

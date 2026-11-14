import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { Card } from '@/components/ui/Card'
import { MoneyText } from '@/components/ui/MoneyText'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { budgets, categories, transactions, wallets } from '@/mocks/data'
import { formatCompact } from '@/lib/money'
import { monthSummary, totalBalance } from '@/lib/summary'
import type { Wallet } from '@/types'

const PIE_COLORS = [
  'var(--color-expense-500)',
  'var(--color-expense-400)',
  'var(--color-warn-500)',
  'var(--color-brand-400)',
]

const walletEmoji: Record<Wallet['type'], string> = {
  cash: '💵',
  bank: '🏦',
  ewallet: '📱',
}

function formatShortDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`)
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

function expenseByCategory() {
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
        emoji: category?.emoji ?? '•',
        amount,
      }
    })
    .sort((a, b) => b.amount - a.amount)
}

export function DashboardPage() {
  const [balanceHidden, setBalanceHidden] = useState(false)
  const now = new Date()
  const balance = totalBalance(wallets)
  const { income, expense } = monthSummary(
    transactions,
    now.getFullYear(),
    now.getMonth() + 1,
  )
  const categorySpend = expenseByCategory()
  const recent = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
    .slice(0, 5)

  const categoryById = new Map(categories.map((c) => [c.id, c]))
  const walletById = new Map(wallets.map((w) => [w.id, w]))

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* a. Hero saldo */}
      <Card className="lg:col-span-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-sm text-ink-soft">Total saldo</p>
            <MoneyText
              amount={balance}
              type="neutral"
              hidden={balanceHidden}
              className="text-3xl"
            />
          </div>
          <button
            type="button"
            aria-label={balanceHidden ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
            onClick={() => setBalanceHidden((v) => !v)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-control)] text-ink-soft transition-colors hover:bg-muted"
          >
            {balanceHidden ? (
              <EyeOff className="size-5" aria-hidden />
            ) : (
              <Eye className="size-5" aria-hidden />
            )}
          </button>
        </div>
      </Card>

      {/* b. Ringkasan bulan */}
      <div className="grid grid-cols-2 gap-4 lg:col-span-2">
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
      <section className="lg:col-span-2" aria-label="Dompet">
        <h2 className="mb-3 text-base font-semibold text-ink">Dompet</h2>
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {wallets.map((wallet) => (
            <Card
              key={wallet.id}
              className="w-44 shrink-0 snap-start p-4"
            >
              <div className="mb-3 inline-flex size-10 items-center justify-center rounded-full bg-muted text-lg">
                {walletEmoji[wallet.type]}
              </div>
              <p className="truncate text-sm font-medium text-ink">
                {wallet.name}
              </p>
              <p className="mt-1 tabular text-sm font-bold text-ink">
                {balanceHidden ? 'Rp ••••••' : formatCompact(wallet.balance)}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* d. Progres anggaran */}
      <Card>
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
      <Card>
        <h2 className="mb-4 text-base font-semibold text-ink">
          Pengeluaran per kategori
        </h2>
        {categorySpend.length === 0 ? (
          <p className="text-sm text-ink-soft">Belum ada pengeluaran bulan ini.</p>
        ) : (
          <>
            <div className="mx-auto h-48 w-full max-w-[220px]">
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
            </div>
            <ul className="mt-4 space-y-2">
              {categorySpend.map((entry, index) => (
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
                    <span className="truncate">
                      {entry.emoji} {entry.name}
                    </span>
                  </span>
                  <MoneyText
                    amount={entry.amount}
                    type="expense"
                    compact
                    className="text-sm"
                    hidden={balanceHidden}
                  />
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      {/* f. Transaksi terakhir */}
      <Card className="lg:col-span-2">
        <h2 className="mb-4 text-base font-semibold text-ink">
          Transaksi terakhir
        </h2>
        <ul className="divide-y divide-line">
          {recent.map((tx) => {
            const category = categoryById.get(tx.categoryId)
            const wallet = walletById.get(tx.walletId)
            const title = tx.notes?.trim() || category?.name || 'Transaksi'
            return (
              <li
                key={tx.id}
                className="flex min-h-11 items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-lg"
                  aria-hidden
                >
                  {category?.emoji ?? '•'}
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

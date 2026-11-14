import { Receipt, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { MoneyText } from '@/components/ui/MoneyText'
import { useToast } from '@/components/ui/Toast'
import { useAddTransaction } from '@/features/transactions/AddTransactionContext'
import { cn } from '@/lib/cn'
import { getIcon } from '@/lib/icons'
import { useStore } from '@/lib/store'
import type { Transaction } from '@/types'

function todayJakarta(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function shiftJakartaDate(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00+07:00`)
  date.setDate(date.getDate() + days)
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function formatGroupLabel(iso: string): string {
  const today = todayJakarta()
  if (iso === today) return 'Hari ini'
  if (iso === shiftJakartaDate(today, -1)) return 'Kemarin'
  const date = new Date(`${iso}T00:00:00`)
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatShortDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`)
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

type Group = {
  date: string
  items: Transaction[]
}

function groupByDate(transactions: Transaction[]): Group[] {
  const map = new Map<string, Transaction[]>()
  const sorted = [...transactions].sort(
    (a, b) => b.date.localeCompare(a.date) || b.id - a.id,
  )
  for (const tx of sorted) {
    const list = map.get(tx.date)
    if (list) list.push(tx)
    else map.set(tx.date, [tx])
  }
  return [...map.entries()].map(([date, items]) => ({ date, items }))
}

export function TransactionsPage() {
  const { transactions, categories, wallets, removeTransaction, restoreTransaction } =
    useStore()
  const { show } = useToast()
  const { openAddTransaction } = useAddTransaction()

  const categoryById = new Map(categories.map((c) => [c.id, c]))
  const walletById = new Map(wallets.map((w) => [w.id, w]))
  const groups = groupByDate(transactions)

  function handleDelete(tx: Transaction) {
    removeTransaction(tx.id)
    show({
      message: 'Transaksi dihapus',
      actionLabel: 'Batalkan',
      onAction: () => {
        restoreTransaction(tx)
      },
    })
  }

  if (transactions.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <span className="inline-flex size-16 items-center justify-center rounded-full bg-muted text-ink-soft">
          <Receipt size={32} strokeWidth={1.75} aria-hidden />
        </span>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-ink">Belum ada transaksi</h1>
          <p className="text-sm text-ink-soft">
            Catat pemasukan atau pengeluaran untuk mulai melacak.
          </p>
        </div>
        <Button variant="primary" size="lg" onClick={openAddTransaction}>
          Catat transaksi pertama
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-ink">Transaksi</h1>

      {groups.map((group) => (
        <section key={group.date} className="space-y-2">
          <h2 className="text-sm font-medium text-ink-soft">
            {formatGroupLabel(group.date)}
          </h2>
          <Card className="!p-0">
            <ul className="divide-y divide-line px-4">
              {group.items.map((tx) => {
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
                    className="flex min-h-11 items-center gap-3 py-3"
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
                    />
                    <button
                      type="button"
                      aria-label={`Hapus ${title}`}
                      onClick={() => handleDelete(tx)}
                      className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] text-ink-soft transition duration-200 hover:bg-danger-100 hover:text-danger-500 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                    >
                      <Trash2 size={18} strokeWidth={1.75} aria-hidden />
                    </button>
                  </li>
                )
              })}
            </ul>
          </Card>
        </section>
      ))}
    </div>
  )
}

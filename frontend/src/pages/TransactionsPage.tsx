import { Receipt, Trash2 } from 'lucide-react'
import {
  Button,
  Card,
  IconButton,
  TransactionItem,
  useToast,
  PageHeaderMotion,
  StaggerContainer,
  StaggerItem,
} from '@/components/ui'
import { useAddTransaction } from '@/features/transactions/AddTransactionContext'
import { formatGroupLabel } from '@/lib/date'
import { useStore } from '@/lib/store'
import type { Transaction } from '@/types'

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
        <span className="inline-flex size-16 items-center justify-center rounded-2xl bg-muted text-ink-soft">
          <Receipt size={32} strokeWidth={1.75} aria-hidden />
        </span>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-ink">Belum ada transaksi</h1>
          <p className="text-sm text-ink-soft max-w-sm">
            Catat pemasukan atau pengeluaran harian Anda untuk mulai melacak arus uang secara otomatis.
          </p>
        </div>
        <Button variant="primary" size="lg" onClick={() => openAddTransaction()}>
          Catat transaksi pertama
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-6">
      <PageHeaderMotion
        title="Riwayat Transaksi"
        subtitle={`Total ${transactions.length} transaksi tercatat`}
        action={
          <Button
            size="sm"
            variant="primary"
            onClick={() => openAddTransaction()}
          >
            + Catat Transaksi
          </Button>
        }
      />

      <StaggerContainer className="space-y-6">
        {groups.map((group, groupIdx) => (
          <StaggerItem
            key={group.date}
            index={groupIdx}
            as="section"
            className="space-y-2"
          >
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                {formatGroupLabel(group.date)}
              </h2>
              <span className="text-[11px] text-ink-soft">
                {group.items.length} transaksi
              </span>
            </div>
            <Card className="!p-0 overflow-hidden divide-y divide-line">
              <div className="divide-y divide-line px-4">
                {group.items.map((tx) => {
                  const category = categoryById.get(tx.categoryId)
                  const wallet = walletById.get(tx.walletId)
                  const title = tx.notes?.trim() || category?.name || 'Transaksi'

                  return (
                    <TransactionItem
                      key={tx.id}
                      transaction={tx}
                      category={category}
                      wallet={wallet}
                      action={
                        <IconButton
                          label={`Hapus ${title}`}
                          icon={<Trash2 size={16} strokeWidth={1.75} aria-hidden />}
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(tx)}
                        />
                      }
                    />
                  )
                })}
              </div>
            </Card>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  )
}

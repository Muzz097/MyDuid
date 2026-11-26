import {
  useCallback,
  useRef,
  useState,
  type UIEvent,
} from 'react'
import {
  AlertCircle,
  ArrowLeftRight,
  Receipt,
  RefreshCw,
  Search,
} from 'lucide-react'
import {
  Button,
  Card,
  EmptyState,
  IconButton,
  PageHeaderMotion,
  Skeleton,
  StaggerContainer,
  StaggerItem,
  TransactionItem,
} from '@/components/ui'
import { MoneyText } from '@/components/ui/MoneyText'
import { useAddTransaction } from '@/features/transactions/AddTransactionContext'
import { TransactionDetailPanel } from '@/features/transactions/TransactionDetailPanel'
import { TransactionFilterBar } from '@/features/transactions/TransactionFilterBar'
import { TransactionSummaryBar } from '@/features/transactions/TransactionSummaryBar'
import {
  DEFAULT_FILTERS,
  useTransactionQuery,
  type FetchedTransaction,
  type FetchedTransfer,
  type TransactionFilters,
} from '@/features/transactions/useTransactionQuery'
import { formatGroupLabel } from '@/lib/date'
import { useStore } from '@/lib/store'
import type { Wallet } from '@/types'

// ---- Types -------------------------------------------------------------

type Group = {
  date: string
  transactions: FetchedTransaction[]
  transfers: FetchedTransfer[]
}

// ---- Helpers -----------------------------------------------------------

function groupByDate(
  transactions: FetchedTransaction[],
  transfers: FetchedTransfer[],
): Group[] {
  const map = new Map<string, Group>()

  for (const tx of transactions) {
    const existing = map.get(tx.date)
    if (existing) {
      existing.transactions.push(tx)
    } else {
      map.set(tx.date, { date: tx.date, transactions: [tx], transfers: [] })
    }
  }

  for (const tr of transfers) {
    const existing = map.get(tr.date)
    if (existing) {
      existing.transfers.push(tr)
    } else {
      map.set(tr.date, { date: tr.date, transactions: [], transfers: [tr] })
    }
  }

  // Sort descending by date then by most recent id
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([, group]) => ({
      ...group,
      transactions: [...group.transactions].sort((a, b) => b.id - a.id),
      transfers: [...group.transfers].sort((a, b) => b.id - a.id),
    }))
}

// ---- Transfer item component ------------------------------------------

type TransferItemProps = {
  transfer: FetchedTransfer
  walletById: Map<number, Wallet>
}

function TransferItem({ transfer, walletById }: TransferItemProps) {
  const srcWallet = transfer.sourceWallet ?? walletById.get(transfer.sourceWalletId)
  const dstWallet = transfer.destinationWallet ?? walletById.get(transfer.destinationWalletId)
  const title = transfer.notes?.trim() || 'Transfer'
  const walletLabel = [srcWallet?.name, dstWallet?.name].filter(Boolean).join(' → ')

  return (
    <div className="group flex min-h-12 items-center gap-3 py-3.5 transition-colors duration-150">
      <span
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-ink-soft transition duration-150 group-hover:scale-105"
        aria-hidden
      >
        <ArrowLeftRight size={18} strokeWidth={1.75} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink tracking-tight">{title}</p>
        <div className="flex items-center gap-1.5 truncate text-xs text-ink-soft">
          <span className="truncate">{walletLabel || 'Transfer'}</span>
          <span aria-hidden>·</span>
          <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-ink-soft">
            Transfer
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <MoneyText
          amount={transfer.amount}
          type="neutral"
          className="text-sm font-semibold tabular-nums text-ink"
        />
      </div>
    </div>
  )
}

// ---- Skeleton loading state -------------------------------------------

function TransactionSkeletonGroup() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" rounded="control" />
      <Card className="!p-0 overflow-hidden">
        <div className="divide-y divide-line px-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 py-3.5">
              <Skeleton className="size-10 shrink-0" rounded="card" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-2/3" rounded="control" />
                <Skeleton className="h-3 w-1/3" rounded="control" />
              </div>
              <Skeleton className="h-4 w-20" rounded="control" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ---- Main page component ----------------------------------------------

export function TransactionsPage() {
  const { categories, wallets, refresh } = useStore()
  const { openAddTransaction } = useAddTransaction()

  const [filters, setFilters] = useState<TransactionFilters>(DEFAULT_FILTERS)
  const [selectedTransaction, setSelectedTransaction] =
    useState<FetchedTransaction | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const {
    transactions,
    transfers,
    summary,
    meta,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refetch,
  } = useTransactionQuery(filters)

  const categoryById = new Map(categories.map((c) => [c.id, c]))
  const walletById = new Map(wallets.map((w) => [w.id, w]))

  function patchFilter(patch: Partial<TransactionFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }))
  }

  // ---- Infinite scroll sentinel ---------------------------------------
  const handleScroll = useCallback(
    (e: UIEvent<HTMLDivElement>) => {
      if (!hasMore || loadingMore) return
      const el = e.currentTarget
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 300
      if (nearBottom) loadMore()
    },
    [hasMore, loadingMore, loadMore],
  )

  const groups = groupByDate(transactions, transfers)

  const hasResults = groups.length > 0
  const isFirstLoad = loading && transactions.length === 0 && transfers.length === 0
  const hasFiltersApplied =
    filters.search.trim() !== '' ||
    filters.type !== DEFAULT_FILTERS.type ||
    filters.walletId !== null ||
    filters.categoryIds.length > 0 ||
    filters.period !== DEFAULT_FILTERS.period

  // ---- Render ----------------------------------------------------------
  return (
    <div
      className="flex flex-col gap-4 pb-8"
      ref={scrollContainerRef}
      onScroll={handleScroll}
    >
      {/* Header */}
      <PageHeaderMotion
        title="Transaksi"
        subtitle={
          meta
            ? `${meta.total} transaksi ditemukan`
            : 'Riwayat keuangan Anda'
        }
        action={
          <Button
            size="sm"
            variant="primary"
            onClick={() => openAddTransaction({ onSaved: () => void refetch() })}
          >
            + Catat
          </Button>
        }
      />

      {/* Filter bar */}
      <TransactionFilterBar
        filters={filters}
        onChange={patchFilter}
        wallets={wallets.filter((w) => w.isActive !== false)}
        categories={categories}
      />

      {/* Summary bar */}
      {(hasResults || loading) && !isFirstLoad && (
        <TransactionSummaryBar
          summary={summary}
          hasMore={hasMore}
        />
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="flex items-start gap-3 rounded-[var(--radius-card)] border border-danger-100 bg-danger-100/40 px-4 py-3 dark:border-danger-700/30 dark:bg-danger-950/20">
          <AlertCircle
            size={18}
            strokeWidth={2}
            className="mt-0.5 shrink-0 text-danger-500"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-danger-700 dark:text-danger-400">{error}</p>
          </div>
          <IconButton
            label="Coba lagi"
            icon={<RefreshCw size={15} strokeWidth={2} aria-hidden />}
            variant="ghost"
            size="sm"
            onClick={() => setFilters((f) => ({ ...f }))}
          />
        </div>
      )}

      {/* Loading skeleton (first load only) */}
      {isFirstLoad && (
        <div className="space-y-6" aria-busy="true" aria-label="Memuat transaksi...">
          <Skeleton className="h-20 w-full" rounded="card" />
          <TransactionSkeletonGroup />
          <TransactionSkeletonGroup />
        </div>
      )}

      {/* Empty state */}
      {!isFirstLoad && !loading && !error && !hasResults && (
        <>
          {hasFiltersApplied ? (
            <EmptyState
              icon={Search}
              title="Tidak ada hasil"
              description="Tidak ada transaksi yang cocok dengan filter atau pencarian Anda. Coba ubah periode, jenis, atau kata kunci."
              action={{
                label: 'Reset filter',
                onClick: () => setFilters(DEFAULT_FILTERS),
              }}
            />
          ) : (
            <EmptyState
              icon={Receipt}
              title="Belum ada transaksi"
              description="Catat pemasukan atau pengeluaran harian Anda untuk mulai melacak arus uang."
              action={{
                label: 'Catat transaksi pertama',
                onClick: () => openAddTransaction({ onSaved: () => void refetch() }),
              }}
            />
          )}
        </>
      )}

      {/* Transaction list */}
      {!isFirstLoad && hasResults && (
        <StaggerContainer className="space-y-6">
          {groups.map((group, groupIdx) => {
            const groupTxCount = group.transactions.length + group.transfers.length
            return (
              <StaggerItem
                key={group.date}
                index={Math.min(groupIdx, 7)} // cap stagger delay
                as="section"
                className="space-y-2"
              >
                {/* Date group header */}
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    {formatGroupLabel(group.date)}
                  </h2>
                  <span className="text-[11px] text-ink-soft">
                    {groupTxCount} {groupTxCount === 1 ? 'transaksi' : 'transaksi'}
                  </span>
                </div>

                {/* Card with transactions + transfers */}
                <Card className="!p-0 overflow-hidden divide-y divide-line">
                  <div className="divide-y divide-line px-4">
                    {/* Regular transactions */}
                    {group.transactions.map((tx) => {
                      const category = categoryById.get(tx.categoryId)
                      const wallet = walletById.get(tx.walletId)

                      return (
                        <TransactionItem
                          key={`tx-${tx.id}`}
                          transaction={tx}
                          category={category}
                          wallet={wallet}
                          onClick={() => setSelectedTransaction(tx)}
                        />
                      )
                    })}

                    {/* Transfers */}
                    {group.transfers.map((tr) => (
                      <TransferItem
                        key={`tr-${tr.id}`}
                        transfer={tr}
                        walletById={walletById}
                      />
                    ))}
                  </div>
                </Card>
              </StaggerItem>
            )
          })}
        </StaggerContainer>
      )}

      {/* Load more */}
      {hasMore && !loadingMore && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" size="sm" onClick={loadMore}>
            Muat lebih banyak
          </Button>
        </div>
      )}

      {/* Loading more indicator */}
      {loadingMore && (
        <div className="flex justify-center py-4" aria-live="polite" aria-busy="true">
          <div className="flex items-center gap-2 text-sm text-ink-soft">
            <span className="size-4 animate-spin rounded-full border-2 border-brand-300 border-t-brand-500" aria-hidden />
            Memuat...
          </div>
        </div>
      )}

      {/* End of results */}
      {!hasMore && !loading && hasResults && meta && meta.total > PER_PAGE && (
        <p className="text-center text-xs text-ink-soft py-2">
          Semua {meta.total} transaksi telah dimuat
        </p>
      )}

      {/* Transaction detail & edit panel */}
      <TransactionDetailPanel
        transaction={selectedTransaction}
        wallets={wallets}
        categories={categories}
        onClose={() => setSelectedTransaction(null)}
        onUpdated={async (updated) => {
          setSelectedTransaction(updated)
          await Promise.all([refresh(), refetch()])
        }}
        onDeleted={async () => {
          setSelectedTransaction(null)
          await Promise.all([refresh(), refetch()])
        }}
        onRestored={async () => {
          await Promise.all([refresh(), refetch()])
        }}
      />
    </div>
  )
}

const PER_PAGE = 25

import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet2,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { getIcon } from '@/lib/icons'
import { formatRupiah } from '@/lib/money'
import type { ReportWalletItem } from '@/features/reports/types'
import { useReportData } from '@/features/reports/useReportData'

export type WalletsTabSectionProps = {
  from: string
  to: string
}

function WalletCardSkeleton() {
  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      <Skeleton className="h-9 w-full rounded-lg" />
    </Card>
  )
}

function ActivityBar({ income, expense }: { income: number; expense: number }) {
  const total = income + expense
  if (total === 0) return null
  const incomePercent = Math.round((income / total) * 100)
  const expensePercent = 100 - incomePercent
  return (
    <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5" aria-hidden>
      {incomePercent > 0 && (
        <div
          className="bg-income-500 rounded-full"
          style={{ width: `${incomePercent}%` }}
        />
      )}
      {expensePercent > 0 && (
        <div
          className="bg-expense-500 rounded-full"
          style={{ width: `${expensePercent}%` }}
        />
      )}
    </div>
  )
}

function WalletCard({ item, from, to }: { item: ReportWalletItem; from: string; to: string }) {
  const WIcon = getIcon(item.icon_key ?? 'default')
  const baseDrill = `/transaksi?from=${from}&to=${to}&wallet_id=${item.wallet_id}`
  const hasActivity =
    item.income > 0 || item.expense > 0 || item.transfer_in > 0 || item.transfer_out > 0

  return (
    <Card className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center shrink-0">
          <WIcon size={20} className="text-brand-600 dark:text-brand-400" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-ink truncate">{item.name}</span>
            {!item.is_active && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-ink-subtle/20 text-ink-soft">
                Diarsipkan
              </span>
            )}
          </div>
          <span className="text-xs text-ink-soft tabular-nums">
            {item.transaction_count} transaksi
          </span>
        </div>
      </div>

      {/* Activity bar */}
      {hasActivity && <ActivityBar income={item.income} expense={item.expense} />}

      {/* Metric rows */}
      <div className="divide-y divide-surface-border">
        {/* Income row — drill-down to income transactions */}
        <Link
          to={`${baseDrill}&type=income`}
          className="flex items-center justify-between py-1.5 hover:opacity-70 transition-opacity"
        >
          <span className="text-xs text-ink-soft">Pemasukan</span>
          <span className="text-sm font-medium tabular-nums text-income-600 dark:text-income-400">
            {formatRupiah(item.income)}
          </span>
        </Link>

        {/* Expense row — drill-down to expense transactions */}
        <Link
          to={`${baseDrill}&type=expense`}
          className="flex items-center justify-between py-1.5 hover:opacity-70 transition-opacity"
        >
          <span className="text-xs text-ink-soft">Pengeluaran</span>
          <span className="text-sm font-medium tabular-nums text-expense-600 dark:text-expense-400">
            {formatRupiah(item.expense)}
          </span>
        </Link>

        {/* Transfer in — only if present */}
        {item.transfer_in > 0 && (
          <div className="flex items-center justify-between py-1.5">
            <span className="inline-flex items-center gap-1 text-xs text-ink-soft">
              <ArrowDownLeft size={12} aria-hidden />
              Transfer masuk
            </span>
            <span className="text-sm tabular-nums text-ink-soft">
              {formatRupiah(item.transfer_in)}
            </span>
          </div>
        )}

        {/* Transfer out — only if present */}
        {item.transfer_out > 0 && (
          <div className="flex items-center justify-between py-1.5">
            <span className="inline-flex items-center gap-1 text-xs text-ink-soft">
              <ArrowUpRight size={12} aria-hidden />
              Transfer keluar
            </span>
            <span className="text-sm tabular-nums text-ink-soft">
              {formatRupiah(item.transfer_out)}
            </span>
          </div>
        )}

        {/* Current balance — labeled as all-time, not period-end */}
        <div className="flex items-center justify-between py-1.5">
          <span className="text-xs text-ink-soft">Saldo saat ini</span>
          <span className="text-sm font-semibold tabular-nums text-ink">
            {formatRupiah(item.balance)}
          </span>
        </div>
      </div>

      {/* Drill-down CTA */}
      <Link
        to={baseDrill}
        className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors"
      >
        Lihat semua transaksi
        <ArrowUpRight size={13} aria-hidden />
      </Link>
    </Card>
  )
}

export function WalletsTabSection({ from, to }: WalletsTabSectionProps) {
  const { data, loading, error, retry } = useReportData<ReportWalletItem[]>(
    '/reports/wallets',
    { from, to },
  )

  if (loading) {
    return (
      <section aria-label="Aktivitas dompet" className="space-y-4">
        <SectionHeader
          title="Aktivitas Dompet"
          subtitle="Pemasukan, pengeluaran, dan transfer per dompet"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <WalletCardSkeleton key={i} />
          ))}
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section aria-label="Aktivitas dompet" className="space-y-4">
        <SectionHeader title="Aktivitas Dompet" />
        <Card className="p-5">
          <div className="flex flex-col items-center gap-3 text-center py-4">
            <AlertCircle size={24} className="text-expense-500" aria-hidden />
            <p className="text-sm text-ink-soft">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={retry}
              className="inline-flex items-center gap-2"
            >
              <RefreshCw size={14} aria-hidden />
              Coba lagi
            </Button>
          </div>
        </Card>
      </section>
    )
  }

  if (!data || data.length === 0) {
    return (
      <section aria-label="Aktivitas dompet" className="space-y-4">
        <SectionHeader title="Aktivitas Dompet" />
        <Card variant="subtle" className="p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <Wallet2 size={32} className="text-ink-subtle" aria-hidden />
            <div>
              <p className="text-sm font-medium text-ink-soft">Belum ada aktivitas dompet</p>
              <p className="text-xs text-ink-subtle mt-0.5">
                Belum ada transaksi pada periode ini.
              </p>
            </div>
          </div>
        </Card>
      </section>
    )
  }

  const totalIncome = data.reduce((s, w) => s + w.income, 0)
  const totalExpense = data.reduce((s, w) => s + w.expense, 0)

  return (
    <section aria-label="Aktivitas dompet" className="space-y-4">
      <SectionHeader
        title="Aktivitas Dompet"
        subtitle={`${data.length} dompet aktif`}
      />

      {/* Summary strip */}
      <Card className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-income-100 dark:bg-income-900/30 flex items-center justify-center shrink-0">
              <TrendingUp
                size={16}
                className="text-income-600 dark:text-income-400"
                aria-hidden
              />
            </div>
            <div>
              <p className="text-[11px] text-ink-soft">Total pemasukan</p>
              <p className="text-sm font-semibold tabular-nums text-income-600 dark:text-income-400">
                {formatRupiah(totalIncome)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-expense-100 dark:bg-expense-900/30 flex items-center justify-center shrink-0">
              <TrendingDown
                size={16}
                className="text-expense-600 dark:text-expense-400"
                aria-hidden
              />
            </div>
            <div>
              <p className="text-[11px] text-ink-soft">Total pengeluaran</p>
              <p className="text-sm font-semibold tabular-nums text-expense-600 dark:text-expense-400">
                {formatRupiah(totalExpense)}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Per-wallet cards */}
      <div className={cn('grid grid-cols-1 gap-4', data.length > 1 && 'md:grid-cols-2', data.length > 2 && 'lg:grid-cols-3')}>
        {data.map((wallet) => (
          <WalletCard key={wallet.wallet_id} item={wallet} from={from} to={to} />
        ))}
      </div>

      <p className="text-[11px] text-ink-subtle text-center px-4">
        * Saldo saat ini mencerminkan saldo terkini dari seluruh waktu, bukan saldo akhir periode.
      </p>
    </section>
  )
}

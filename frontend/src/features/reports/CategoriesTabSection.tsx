import { useState } from 'react'
import {
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Layers,
  RefreshCw,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { formatRupiah } from '@/lib/money'
import type {
  ReportCategoriesResponse,
  ReportCategoryItem,
} from '@/features/reports/types'
import { useReportData } from '@/features/reports/useReportData'

export type CategoriesTabSectionProps = {
  from: string
  to: string
}

type CategoryType = 'expense' | 'income'

function CategoryDelta({ percent }: { percent: number | null }) {
  if (percent === null) return null
  if (percent === 0) {
    return <span className="text-[11px] text-ink-soft">Sama (0%)</span>
  }
  const up = percent > 0
  const Icon = up ? ArrowUpRight : ArrowDownRight
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums',
        up
          ? 'text-expense-600 dark:text-expense-400'
          : 'text-income-600 dark:text-income-400',
      )}
    >
      <Icon size={12} strokeWidth={2} aria-hidden />
      {up ? `+${percent}%` : `${percent}%`}
    </span>
  )
}

function CategoryRow({
  item,
  rank,
  mode,
  from,
  to,
  type,
}: {
  item: ReportCategoryItem
  rank: number
  mode: 'amount' | 'count'
  from: string
  to: string
  type: CategoryType
}) {
  const drillUrl = `/transaksi?from=${from}&to=${to}&type=${type}&category_id=${item.category_id}`
  const barWidth =
    mode === 'amount' ? Math.min(100, Math.max(4, item.share_percent)) : 0

  return (
    <Link
      to={drillUrl}
      className="group block rounded-[var(--radius-control)] border border-line/70 bg-card p-3.5 transition hover:border-brand-300 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 dark:hover:border-brand-700"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-ink-soft tabular-nums">
            {rank}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">
              {item.name}
            </p>
            <p className="mt-0.5 text-xs text-ink-soft tabular-nums">
              Rata-rata {formatRupiah(item.average)} / transaksi
              {mode === 'amount' && ` · ${item.count} transaksi`}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 text-right">
          <div>
            {mode === 'amount' ? (
              <>
                <p className="text-sm font-bold text-ink tabular-nums">
                  {formatRupiah(item.amount)}
                </p>
                <div className="mt-0.5 flex items-center justify-end gap-1.5">
                  <span className="text-[11px] font-medium text-ink-soft tabular-nums">
                    {item.share_percent}%
                  </span>
                  {type === 'expense' && (
                    <CategoryDelta percent={item.change_percent} />
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-ink tabular-nums">
                  {item.count} transaksi
                </p>
                <p className="mt-0.5 text-[11px] text-ink-soft tabular-nums">
                  Total {formatRupiah(item.amount)}
                </p>
              </>
            )}
          </div>
          <ArrowRight
            size={15}
            className="text-ink-soft transition group-hover:translate-x-0.5 group-hover:text-brand-600 dark:group-hover:text-brand-400"
            aria-hidden
          />
        </div>
      </div>

      {mode === 'amount' && (
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              type === 'expense' ? 'bg-expense-500' : 'bg-income-500',
            )}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      )}
    </Link>
  )
}

export function CategoriesTabSection({ from, to }: CategoriesTabSectionProps) {
  const [type, setType] = useState<CategoryType>('expense')
  const { data, loading, error, retry } =
    useReportData<ReportCategoriesResponse>('/reports/categories', {
      from,
      to,
      type,
    })

  const typeLabel = type === 'expense' ? 'Pengeluaran' : 'Pemasukan'

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader
          title={`Kategori ${typeLabel}`}
          subtitle="Bandingkan kategori berdasarkan total nominal dan frekuensi transaksi"
        />

        <div
          role="group"
          aria-label="Tipe kategori"
          className="inline-flex self-start rounded-[var(--radius-control)] bg-muted p-1"
        >
          {(
            [
              { key: 'expense', label: 'Pengeluaran' },
              { key: 'income', label: 'Pemasukan' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.key}
              type="button"
              aria-pressed={type === opt.key}
              onClick={() => setType(opt.key)}
              className={cn(
                'min-h-9 rounded-[var(--radius-control)] px-3.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                type === opt.key
                  ? 'bg-card font-semibold text-ink shadow-xs'
                  : 'text-ink-soft hover:text-ink',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-72" rounded="card" />
          <Skeleton className="h-72" rounded="card" />
        </div>
      ) : error && !data ? (
        <Card className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-danger-500" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-ink">
                Data kategori gagal dimuat
              </p>
              <p className="text-xs text-ink-soft">{error}</p>
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={retry} className="gap-1.5">
            <RefreshCw size={14} aria-hidden />
            Coba lagi
          </Button>
        </Card>
      ) : data && data.by_amount.length === 0 ? (
        <Card
          variant="subtle"
          className="flex flex-col items-center justify-center py-12 text-center"
        >
          <span className="mb-2 inline-flex size-11 items-center justify-center rounded-xl bg-muted text-ink-soft">
            <Layers size={20} strokeWidth={1.75} aria-hidden />
          </span>
          <p className="text-sm font-semibold text-ink">
            Belum ada data kategori {typeLabel.toLowerCase()}
          </p>
          <p className="mt-1 max-w-md text-xs text-ink-soft">
            Tidak ada transaksi {typeLabel.toLowerCase()} pada rentang tanggal ini.
          </p>
        </Card>
      ) : data ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {/* A. Berdasarkan Nominal */}
          <Card className="space-y-3 p-5">
            <div>
              <h3 className="text-sm font-semibold text-ink">
                Berdasarkan Nominal
              </h3>
              <p className="text-xs text-ink-soft">
                Urutan kategori dengan total {typeLabel.toLowerCase()} terbesar
              </p>
            </div>
            <div className="space-y-2.5">
              {data.by_amount.map((item, idx) => (
                <CategoryRow
                  key={item.category_id}
                  item={item}
                  rank={idx + 1}
                  mode="amount"
                  from={from}
                  to={to}
                  type={type}
                />
              ))}
            </div>
          </Card>

          {/* B. Berdasarkan Frekuensi */}
          <Card className="space-y-3 p-5">
            <div>
              <h3 className="text-sm font-semibold text-ink">
                Berdasarkan Frekuensi
              </h3>
              <p className="text-xs text-ink-soft">
                Urutan kategori yang paling sering digunakan
              </p>
            </div>
            <div className="space-y-2.5">
              {data.by_count.map((item, idx) => (
                <CategoryRow
                  key={item.category_id}
                  item={item}
                  rank={idx + 1}
                  mode="count"
                  from={from}
                  to={to}
                  type={type}
                />
              ))}
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  )
}

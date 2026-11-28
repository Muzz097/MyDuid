import { Link } from 'react-router-dom'
import { Play, RefreshCw, Sparkles } from 'lucide-react'
import { Button, Card, EmptyState, Skeleton } from '@/components/ui'
import { formatMonthYear } from './copy'
import { WrappedCountdown } from './WrappedCountdown'
import { useWrappedMonths } from './useWrapped'

export function WrappedTab() {
  const { data, loading, error, retry } = useWrappedMonths(true)

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-36 w-full" rounded="card" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full" rounded="card" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="text-sm font-semibold text-ink">
          Gagal memuat daftar MyDuid Wrapped
        </p>
        <p className="text-xs text-ink-soft">{error}</p>
        <Button onClick={retry} variant="secondary" size="sm">
          <RefreshCw className="size-4" aria-hidden="true" />
          Coba lagi
        </Button>
      </Card>
    )
  }

  const months = data?.months ?? []
  const upcoming = data?.upcoming

  return (
    <div className="space-y-5">
      {upcoming && (
        <WrappedCountdown
          upcomingMonth={upcoming.month}
          availableAt={upcoming.available_at}
          onZero={retry}
        />
      )}

      {months.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Belum ada Wrapped yang selesai"
          description="Cerita keuangan bulananmu akan muncul di sini setelah satu bulan kalender berakhir dan memiliki transaksi."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {months.map((item) => (
            <Card
              key={item.month}
              className="flex flex-col justify-between gap-4 transition hover:border-brand-300"
            >
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-ink">
                  {formatMonthYear(item.month)}
                </h3>
                <p className="text-xs text-ink-soft tabular-nums">
                  {item.transaction_count} transaksi dicatat
                </p>
              </div>

              <Link
                to={`/laporan/wrapped/${item.month}`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                <Play className="size-4" aria-hidden="true" />
                <span>Putar</span>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

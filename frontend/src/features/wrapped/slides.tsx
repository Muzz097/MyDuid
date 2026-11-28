import type { MouseEvent } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Flame,
  PiggyBank,
  RotateCcw,
  Share2,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { useCountUp } from '@/hooks/useCountUp'
import { cn } from '@/lib/cn'
import { getIcon } from '@/lib/icons'
import { formatCompact, formatRupiah } from '@/lib/money'
import {
  PERSONA_TITLES,
  WEEKDAY_FULL,
  WEEKDAY_SHORT,
  formatFullDate,
  formatMonthYear,
  formatPersonaReason,
  formatShortDate,
} from './copy'
import type { WrappedDetail, WrappedSlide } from './types'

type SlideProps = {
  slide: WrappedSlide
  onNavigate: (to: string) => void
  onReplay: () => void
  onOpenShare: () => void
}

function stopTap(e: MouseEvent) {
  e.stopPropagation()
}

function IntroSlide({ data }: { data: WrappedDetail }) {
  const txCount = useCountUp(data.transaction_count)
  const title = PERSONA_TITLES[data.persona.code]
  const reason = formatPersonaReason(data.persona)
  const monthLabel = formatMonthYear(data.month)

  return (
    <div className="flex h-full flex-col justify-between bg-gradient-to-br from-brand-500/20 via-card to-accent/15 p-6 pt-16 text-ink">
      <span className="sr-only">
        {`Ringkasan pembuka ${monthLabel}. Julukan: ${title}. ${reason} Total ${data.transaction_count} transaksi dicatat.`}
      </span>

      <div className="space-y-2 wrapped-stagger-1">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/15 px-3 py-1 text-xs font-semibold text-brand-700 dark:text-brand-200">
          <Sparkles className="size-3.5" aria-hidden="true" />
          <span>MyDuid Wrapped</span>
        </p>
        <p className="text-lg font-semibold text-ink-soft">
          {monthLabel}, ceritamu.
        </p>
      </div>

      <div className="space-y-4 wrapped-stagger-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft">
          Gaya keuanganmu bulan ini
        </p>
        <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-ink">
          {title}
        </h2>
        <p className="text-base leading-relaxed text-ink-soft">{reason}</p>
      </div>

      <div className="flex items-baseline gap-2 border-t border-line pt-4 wrapped-stagger-3">
        <span className="text-3xl font-bold tabular-nums text-ink">
          {txCount}
        </span>
        <span className="text-sm text-ink-soft">transaksi dicatat</span>
      </div>
    </div>
  )
}

function NumbersSlide({ data }: { data: WrappedDetail }) {
  const summary = data.summary!
  const income = useCountUp(summary.income)
  const expense = useCountUp(summary.expense)
  const net = useCountUp(summary.net)
  const expChange = summary.previous?.expense_change_percent ?? null

  const compText =
    summary.previous === null || expChange === null
      ? 'Belum ada pembanding bulan sebelumnya'
      : expChange === 0
        ? 'Pengeluaran sama dengan bulan lalu'
        : expChange < 0
          ? `Pengeluaran turun ${Math.abs(expChange)}% dari bulan lalu`
          : `Pengeluaran naik ${expChange}% dari bulan lalu`

  return (
    <div className="flex h-full flex-col justify-between bg-gradient-to-b from-income-500/15 via-card to-expense-500/10 p-6 pt-16 text-ink">
      <span className="sr-only">
        {`Angka utama ${formatMonthYear(data.month)}: Pemasukan ${formatRupiah(summary.income)}, Pengeluaran ${formatRupiah(summary.expense)}, Selisih bersih ${formatRupiah(summary.net)}. ${compText}.`}
      </span>

      <div className="space-y-1 wrapped-stagger-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft">
          Arus Kas
        </p>
        <h2 className="text-2xl font-bold tracking-tight text-ink">
          Tiga angka utamamu
        </h2>
      </div>

      <div className="space-y-5 wrapped-stagger-2">
        <div>
          <p className="text-xs font-medium text-ink-soft">Pemasukan</p>
          <p className="mt-0.5 text-3xl font-extrabold tabular-nums text-income-600 dark:text-income-400">
            {formatRupiah(income)}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium text-ink-soft">Pengeluaran</p>
          <p className="mt-0.5 text-3xl font-extrabold tabular-nums text-expense-600 dark:text-expense-400">
            {formatRupiah(expense)}
          </p>
        </div>

        <div className="border-t border-line pt-4">
          <p className="text-xs font-medium text-ink-soft">Selisih Bersih</p>
          <p
            className={cn(
              'mt-0.5 text-2xl font-bold tabular-nums',
              summary.net >= 0
                ? 'text-income-600 dark:text-income-400'
                : 'text-expense-600 dark:text-expense-400',
            )}
          >
            {summary.net > 0 ? '+' : ''}
            {formatRupiah(net)}
          </p>
        </div>
      </div>

      <div className="inline-flex items-center gap-2 self-start rounded-full border border-line bg-muted/80 px-3.5 py-2 text-xs font-medium text-ink wrapped-stagger-3">
        {expChange !== null && expChange < 0 ? (
          <TrendingDown
            className="size-4 shrink-0 text-income-600 dark:text-income-400"
            aria-hidden="true"
          />
        ) : expChange !== null && expChange > 0 ? (
          <TrendingUp
            className="size-4 shrink-0 text-expense-600 dark:text-expense-400"
            aria-hidden="true"
          />
        ) : (
          <PiggyBank className="size-4 shrink-0 text-ink-soft" aria-hidden="true" />
        )}
        <span>{compText}</span>
      </div>
    </div>
  )
}

function CategoriesSlide({
  data,
  onNavigate,
}: {
  data: WrappedDetail
  onNavigate: (to: string) => void
}) {
  const top = data.top_categories.slice(0, 3)
  const freq = data.most_frequent_category

  return (
    <div className="flex h-full flex-col justify-between bg-gradient-to-tr from-brand-500/15 via-card to-muted p-6 pt-16 text-ink">
      <span className="sr-only">
        {`Kategori pengeluaran utama: ${top.map((c) => `${c.name} ${formatRupiah(c.amount)} (${c.share_percent}%)`).join(', ')}.${freq ? ` Paling sering: ${freq.name} ${freq.count} kali.` : ''}`}
      </span>

      <div className="space-y-1 wrapped-stagger-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft">
          Prioritas Pengeluaran
        </p>
        <h2 className="text-2xl font-bold tracking-tight text-ink">
          Ke mana uangmu pergi
        </h2>
      </div>

      <div className="space-y-4 wrapped-stagger-2">
        {top.map((cat) => {
          const Icon = getIcon(cat.icon_key ?? 'default')
          const url = `/transaksi?from=${data.from}&to=${data.to}&type=expense&category_id=${cat.category_id}`
          return (
            <button
              key={cat.category_id}
              type="button"
              onClick={(e) => {
                stopTap(e)
                onNavigate(url)
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="relative z-20 block w-full min-h-11 rounded-[var(--radius-control)] border border-line bg-card/80 p-3 text-left transition hover:border-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 font-semibold text-ink">
                  <Icon className="size-4 text-brand-600 dark:text-brand-300" aria-hidden="true" />
                  <span>{cat.name}</span>
                </span>
                <span className="text-sm font-bold tabular-nums text-ink">
                  {formatRupiah(cat.amount)}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-brand-500 transition-all"
                    style={{ width: `${Math.max(cat.share_percent, 4)}%` }}
                  />
                </div>
                <span className="w-10 text-right text-xs font-semibold tabular-nums text-ink-soft">
                  {cat.share_percent}%
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {freq ? (
        <button
          type="button"
          onClick={(e) => {
            stopTap(e)
            onNavigate(
              `/transaksi?from=${data.from}&to=${data.to}&type=expense&category_id=${freq.category_id}`,
            )
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="relative z-20 flex min-h-11 w-full items-center justify-between rounded-[var(--radius-control)] border border-line bg-muted/80 px-4 py-2.5 text-left text-sm transition hover:border-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus wrapped-stagger-3"
        >
          <span className="text-ink-soft">Paling sering dicatat</span>
          <span className="font-semibold text-ink">
            {freq.name} ({freq.count} kali)
          </span>
        </button>
      ) : (
        <div />
      )}
    </div>
  )
}

function DaysSlide({
  data,
  onNavigate,
}: {
  data: WrappedDetail
  onNavigate: (to: string) => void
}) {
  const firstDay = new Date(`${data.from}T12:00:00+07:00`)
  const jsDay = firstDay.getDay()
  const leadingEmpty = jsDay === 0 ? 6 : jsDay - 1
  const maxAmount = Math.max(...data.daily_expense.map((d) => d.amount), 0)

  function cellTone(amount: number): string {
    if (amount <= 0 || maxAmount <= 0) return 'bg-muted/70 text-ink-soft'
    const ratio = amount / maxAmount
    if (ratio >= 0.75) return 'bg-expense-500 text-white font-bold'
    if (ratio >= 0.4) return 'bg-expense-500/45 text-ink font-semibold'
    return 'bg-expense-500/20 text-ink'
  }

  return (
    <div className="flex h-full flex-col justify-between bg-gradient-to-bl from-expense-500/15 via-card to-brand-500/10 p-6 pt-16 text-ink">
      <span className="sr-only">
        {`Hari berkesan ${formatMonthYear(data.month)}. ${data.biggest_day ? `Pengeluaran terbesar pada ${formatFullDate(data.biggest_day.date)} sebesar ${formatRupiah(data.biggest_day.amount)}.` : ''} ${data.frugal_day ? `Pengeluaran teringan pada ${formatFullDate(data.frugal_day.date)} sebesar ${formatRupiah(data.frugal_day.amount)}.` : ''}`}
      </span>

      <div className="space-y-1 wrapped-stagger-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft">
          Jejak Harian
        </p>
        <h2 className="text-2xl font-bold tracking-tight text-ink">
          Hari berkesan
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-2.5 wrapped-stagger-2">
        {data.biggest_day && (
          <button
            type="button"
            onClick={(e) => {
              stopTap(e)
              onNavigate(`/transaksi?date=${data.biggest_day!.date}`)
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="relative z-20 min-h-11 rounded-[var(--radius-control)] border border-line bg-card/85 p-3 text-left transition hover:border-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <p className="text-[11px] font-medium text-ink-soft">Terbesar</p>
            <p className="mt-0.5 text-sm font-bold tabular-nums text-expense-600 dark:text-expense-400">
              {formatCompact(data.biggest_day.amount)}
            </p>
            <p className="text-xs text-ink-soft">
              {formatShortDate(data.biggest_day.date)}
            </p>
          </button>
        )}

        {data.frugal_day && (
          <button
            type="button"
            onClick={(e) => {
              stopTap(e)
              onNavigate(`/transaksi?date=${data.frugal_day!.date}`)
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="relative z-20 min-h-11 rounded-[var(--radius-control)] border border-line bg-card/85 p-3 text-left transition hover:border-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <p className="text-[11px] font-medium text-ink-soft">Paling ringan</p>
            <p className="mt-0.5 text-sm font-bold tabular-nums text-income-600 dark:text-income-400">
              {formatCompact(data.frugal_day.amount)}
            </p>
            <p className="text-xs text-ink-soft">
              {formatShortDate(data.frugal_day.date)}
            </p>
          </button>
        )}
      </div>

      <div className="space-y-1.5 wrapped-stagger-3">
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-ink-soft">
          {[1, 2, 3, 4, 5, 6, 7].map((iso) => (
            <span key={iso}>{WEEKDAY_SHORT[iso]}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: leadingEmpty }).map((_, i) => (
            <div key={`empty-${i}`} className="h-8" />
          ))}
          {data.daily_expense.map((day) => {
            const dayNum = Number(day.date.slice(8, 10))
            return (
              <button
                key={day.date}
                type="button"
                title={`${formatShortDate(day.date)}: ${formatRupiah(day.amount)}`}
                aria-label={`${formatFullDate(day.date)}, pengeluaran ${formatRupiah(day.amount)}`}
                onClick={(e) => {
                  stopTap(e)
                  onNavigate(`/transaksi?date=${day.date}`)
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className={cn(
                  'relative z-20 flex h-8 items-center justify-center rounded-lg text-xs tabular-nums transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus',
                  cellTone(day.amount),
                )}
              >
                {dayNum}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function RhythmSlide({ data }: { data: WrappedDetail }) {
  const maxTotal = Math.max(...data.weekday_rhythm.map((w) => w.total), 1)
  const busiestName = data.busiest_weekday
    ? WEEKDAY_FULL[data.busiest_weekday]
    : null

  return (
    <div className="flex h-full flex-col justify-between bg-gradient-to-br from-info-500/15 via-card to-brand-500/15 p-6 pt-16 text-ink">
      <span className="sr-only">
        {`Ritme pengeluaran mingguan. ${busiestName ? `Hari paling aktif adalah ${busiestName}.` : ''}`}
      </span>

      <div className="space-y-1 wrapped-stagger-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft">
          Ritme Mingguan
        </p>
        <h2 className="text-2xl font-bold tracking-tight text-ink">
          {busiestName ? `${busiestName} paling ramai` : 'Pola harimu'}
        </h2>
      </div>

      <div className="flex h-48 items-end justify-between gap-2 pt-4 wrapped-stagger-2">
        {data.weekday_rhythm.map((item) => {
          const pct = Math.max(Math.round((item.total / maxTotal) * 100), item.total > 0 ? 12 : 4)
          const isBusiest = item.iso_weekday === data.busiest_weekday
          return (
            <div
              key={item.iso_weekday}
              className="flex flex-1 flex-col items-center gap-2"
            >
              <span className="text-[10px] font-medium tabular-nums text-ink-soft">
                {item.total > 0 ? formatCompact(item.total) : '-'}
              </span>
              <div className="flex h-32 w-full items-end justify-center">
                <div
                  className={cn(
                    'w-full max-w-8 rounded-t-lg transition-all',
                    isBusiest ? 'bg-brand-600' : 'bg-brand-500/30',
                  )}
                  style={{ height: `${pct}%` }}
                />
              </div>
              <span
                className={cn(
                  'text-xs',
                  isBusiest ? 'font-bold text-ink' : 'text-ink-soft',
                )}
              >
                {WEEKDAY_SHORT[item.iso_weekday]}
              </span>
            </div>
          )
        })}
      </div>

      <p className="rounded-[var(--radius-control)] border border-line bg-muted/70 px-4 py-3 text-sm text-ink-soft wrapped-stagger-3">
        {busiestName
          ? `Pengeluaran tertinggimu paling sering terjadi di hari ${busiestName}.`
          : 'Aktivitas pengeluaranmu tersebar merata.'}
      </p>
    </div>
  )
}

function ChangesSlide({
  data,
  onNavigate,
}: {
  data: WrappedDetail
  onNavigate: (to: string) => void
}) {
  return (
    <div className="flex h-full flex-col justify-between bg-gradient-to-tl from-accent/15 via-card to-brand-500/10 p-6 pt-16 text-ink">
      <span className="sr-only">
        {`Perubahan kategori dibanding bulan lalu: ${data.changes.map((c) => `${c.name} ${c.direction === 'up' ? 'naik' : 'turun'} ${formatRupiah(Math.abs(c.delta))}`).join(', ')}.`}
      </span>

      <div className="space-y-1 wrapped-stagger-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft">
          Dibanding Bulan Lalu
        </p>
        <h2 className="text-2xl font-bold tracking-tight text-ink">
          Yang berubah bulan ini
        </h2>
      </div>

      <div className="space-y-3 wrapped-stagger-2">
        {data.changes.slice(0, 3).map((item) => {
          const isUp = item.direction === 'up'
          return (
            <button
              key={item.category_id}
              type="button"
              onClick={(e) => {
                stopTap(e)
                onNavigate(
                  `/transaksi?from=${data.from}&to=${data.to}&type=expense&category_id=${item.category_id}`,
                )
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="relative z-20 flex min-h-14 w-full items-center justify-between gap-3 rounded-[var(--radius-control)] border border-line bg-card/85 px-4 py-3 text-left transition hover:border-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              <div className="flex items-center gap-2.5">
                {isUp ? (
                  <ArrowUpRight
                    className="size-5 shrink-0 text-expense-600 dark:text-expense-400"
                    aria-hidden="true"
                  />
                ) : (
                  <ArrowDownRight
                    className="size-5 shrink-0 text-income-600 dark:text-income-400"
                    aria-hidden="true"
                  />
                )}
                <div>
                  <p className="font-semibold text-ink">{item.name}</p>
                  <p className="text-xs text-ink-soft">
                    {isUp ? 'Naik' : 'Turun'}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  'text-sm font-bold tabular-nums',
                  isUp
                    ? 'text-expense-600 dark:text-expense-400'
                    : 'text-income-600 dark:text-income-400',
                )}
              >
                {isUp ? '+' : '-'}
                {formatRupiah(Math.abs(item.delta))}
              </span>
            </button>
          )
        })}
      </div>

      <p className="text-xs text-ink-soft wrapped-stagger-3">
        Ketuk kategori untuk melihat detail transaksinya.
      </p>
    </div>
  )
}

function HabitsSlide({ data }: { data: WrappedDetail }) {
  const keptBudgets = data.budgets ? data.budgets.healthy + data.budgets.warning : 0
  const items: { label: string; value: string; icon: typeof Flame }[] = []

  if (data.no_spend_days > 0) {
    items.push({
      label: 'Hari tanpa pengeluaran',
      value: `${data.no_spend_days} hari`,
      icon: Calendar,
    })
  }
  if (data.longest_no_spend_streak > 0) {
    items.push({
      label: 'Runtutan bebas belanja terpanjang',
      value: `${data.longest_no_spend_streak} hari beruntun`,
      icon: Flame,
    })
  }
  if (data.logging.longest_logging_streak > 0) {
    items.push({
      label: 'Konsistensi mencatat',
      value: `${data.logging.longest_logging_streak} hari beruntun`,
      icon: Sparkles,
    })
  }
  if (keptBudgets > 0) {
    items.push({
      label: 'Anggaran terjaga',
      value: `${keptBudgets} anggaran terjaga`,
      icon: ShieldCheck,
    })
  }

  return (
    <div className="flex h-full flex-col justify-between bg-gradient-to-br from-income-500/15 via-card to-brand-500/10 p-6 pt-16 text-ink">
      <span className="sr-only">
        {`Kebiasaan baik: ${items.map((i) => `${i.label} ${i.value}`).join(', ')}.`}
      </span>

      <div className="space-y-1 wrapped-stagger-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft">
          Kebiasaan Baik
        </p>
        <h2 className="text-2xl font-bold tracking-tight text-ink">
          Langkah kecil yang berarti
        </h2>
      </div>

      <div className="space-y-3 wrapped-stagger-2">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-[var(--radius-control)] border border-line bg-card/85 px-4 py-3.5"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-income-500/15 text-income-600 dark:text-income-400">
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs text-ink-soft">{item.label}</p>
                <p className="text-base font-bold text-ink">{item.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div />
    </div>
  )
}

function BiggestSlide({
  data,
  onNavigate,
}: {
  data: WrappedDetail
  onNavigate: (to: string) => void
}) {
  const tx = data.biggest_transaction!
  const amount = useCountUp(tx.amount)

  return (
    <div className="flex h-full flex-col justify-between bg-gradient-to-b from-brand-500/20 via-card to-expense-500/15 p-6 pt-16 text-ink">
      <span className="sr-only">
        {`Transaksi pengeluaran terbesar: ${formatRupiah(tx.amount)} pada ${formatFullDate(tx.date)}${tx.category_name ? ` di kategori ${tx.category_name}` : ''}.`}
      </span>

      <div className="space-y-1 wrapped-stagger-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft">
          Momen Terbesar
        </p>
        <h2 className="text-2xl font-bold tracking-tight text-ink">
          Satu transaksi paling menonjol
        </h2>
      </div>

      <div className="space-y-3 wrapped-stagger-2">
        <p className="text-sm font-medium text-ink-soft">
          {tx.category_name ?? 'Pengeluaran'}
        </p>
        <p className="text-4xl font-extrabold tabular-nums text-ink">
          {formatRupiah(amount)}
        </p>
        <p className="text-sm text-ink-soft">{formatFullDate(tx.date)}</p>
      </div>

      <button
        type="button"
        onClick={(e) => {
          stopTap(e)
          onNavigate(`/transaksi?date=${tx.date}`)
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="relative z-20 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] border border-line bg-card px-4 text-sm font-semibold text-ink transition hover:border-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus wrapped-stagger-3"
      >
        Lihat transaksi di tanggal ini
      </button>
    </div>
  )
}

function ClosingSlide({
  data,
  onNavigate,
  onReplay,
  onOpenShare,
}: {
  data: WrappedDetail
  onNavigate: (to: string) => void
  onReplay: () => void
  onOpenShare: () => void
}) {
  const title = PERSONA_TITLES[data.persona.code]
  const monthLabel = formatMonthYear(data.month)
  const reportUrl = `/laporan?tab=summary&from=${data.from}&to=${data.to}`

  return (
    <div className="flex h-full flex-col justify-between bg-gradient-to-br from-brand-500/20 via-card to-income-500/15 p-6 pt-16 text-ink">
      <span className="sr-only">
        {`Penutup Wrapped ${monthLabel}. Julukan: ${title}.`}
      </span>

      <div className="space-y-1 wrapped-stagger-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft">
          Ringkasan {monthLabel}
        </p>
        <h2 className="text-3xl font-extrabold tracking-tight text-ink">
          {title}
        </h2>
      </div>

      <div className="space-y-2.5 rounded-[var(--radius-card)] border border-line bg-card/90 p-4 wrapped-stagger-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-soft">Total transaksi</span>
          <span className="font-semibold tabular-nums text-ink">
            {data.transaction_count} kali
          </span>
        </div>
        {data.summary && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-soft">Pengeluaran</span>
            <span className="font-semibold tabular-nums text-ink">
              {formatRupiah(data.summary.expense)}
            </span>
          </div>
        )}
        {data.top_categories[0] && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-soft">Kategori utama</span>
            <span className="font-semibold text-ink">
              {data.top_categories[0].name}
            </span>
          </div>
        )}
      </div>

      <div className="relative z-20 space-y-2.5 wrapped-stagger-3">
        <button
          type="button"
          onClick={(e) => {
            stopTap(e)
            onNavigate(reportUrl)
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="flex min-h-11 w-full items-center justify-center rounded-[var(--radius-control)] bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          Lihat laporan lengkap
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={(e) => {
              stopTap(e)
              onReplay()
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[var(--radius-control)] border border-line bg-card px-3 text-sm font-medium text-ink transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            <span>Putar ulang</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              stopTap(e)
              onOpenShare()
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[var(--radius-control)] border border-line bg-card px-3 text-sm font-semibold text-ink transition hover:border-brand-400 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <Share2 className="size-4" aria-hidden="true" />
            <span>Bagikan</span>
          </button>
        </div>

        <button
          type="button"
          onClick={(e) => {
            stopTap(e)
            onNavigate('/anggaran')
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="flex min-h-11 w-full items-center justify-center text-xs font-semibold text-brand-600 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus dark:text-brand-300"
        >
          Atur anggaran untuk bulan berikutnya
        </button>
      </div>
    </div>
  )
}

export function WrappedSlideView({
  slide,
  onNavigate,
  onReplay,
  onOpenShare,
}: SlideProps) {
  switch (slide.id) {
    case 'intro':
      return <IntroSlide data={slide.data} />
    case 'numbers':
      return <NumbersSlide data={slide.data} />
    case 'categories':
      return <CategoriesSlide data={slide.data} onNavigate={onNavigate} />
    case 'days':
      return <DaysSlide data={slide.data} onNavigate={onNavigate} />
    case 'rhythm':
      return <RhythmSlide data={slide.data} />
    case 'changes':
      return <ChangesSlide data={slide.data} onNavigate={onNavigate} />
    case 'habits':
      return <HabitsSlide data={slide.data} />
    case 'biggest':
      return <BiggestSlide data={slide.data} onNavigate={onNavigate} />
    case 'closing':
      return (
        <ClosingSlide
          data={slide.data}
          onNavigate={onNavigate}
          onReplay={onReplay}
          onOpenShare={onOpenShare}
        />
      )
  }
}

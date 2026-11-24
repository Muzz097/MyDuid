import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Receipt,
  RotateCcw,
  Scale,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  IconButton,
  MoneyText,
  PageHeaderMotion,
  SectionMotion,
  Skeleton,
  TransactionItem,
  useToast,
} from '@/components/ui'
import { useAddTransaction } from '@/features/transactions/AddTransactionContext'
import { api, ApiError } from '@/lib/api'
import { cn } from '@/lib/cn'
import { formatCompact, formatRupiah } from '@/lib/money'
import { useStore } from '@/lib/store'
import type { Category, Transaction, TransactionType, Wallet } from '@/types'

type ApiTransaction = {
  id: number
  wallet_id: number
  category_id: number
  type: TransactionType
  amount: number
  transaction_date: string
  notes: string | null
  wallet?: { id: number; name: string }
  category?: { id: number; name: string; icon_key: string }
}

type DataEnvelope<T> = {
  data: T
}

function todayJakarta(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function currentYearMonthJakarta(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
  }).format(new Date())
}

function formatMonthTitle(yearMonth: string): string {
  const [yearStr, monthStr] = yearMonth.split('-')
  const date = new Date(Number(yearStr), Number(monthStr) - 1, 1)
  return new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatFullDateIndonesian(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`)
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function shiftMonth(yearMonth: string, offset: number): string {
  const [yearStr, monthStr] = yearMonth.split('-')
  const d = new Date(Number(yearStr), Number(monthStr) - 1 + offset, 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

const DAYS_HEADER = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

export function CalendarPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { openAddTransaction } = useAddTransaction()
  const { categories, wallets, removeTransaction, restoreTransaction, version } = useStore()
  const { show } = useToast()

  const today = useMemo(() => todayJakarta(), [])
  const currentMonth = useMemo(() => currentYearMonthJakarta(), [])

  // Month state (YYYY-MM)
  const [month, setMonth] = useState<string>(() => {
    const qMonth = searchParams.get('month')
    if (qMonth && /^\d{4}-(0[1-9]|1[0-2])$/.test(qMonth)) {
      return qMonth
    }
    return currentMonth
  })

  // Selected date state (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const qDate = searchParams.get('date')
    if (qDate && /^\d{4}-\d{2}-\d{2}$/.test(qDate)) {
      return qDate
    }
    return today
  })

  // Filter: 'all' | 'income' | 'expense'
  const filterParam = searchParams.get('type')
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>(() => {
    if (filterParam === 'income') return 'income'
    if (filterParam === 'expense') return 'expense'
    return 'all'
  })

  // Sync state if URL query param changes
  useEffect(() => {
    const type = searchParams.get('type')
    if (type === 'income' || type === 'expense') {
      setFilter(type)
    } else if (type === 'all') {
      setFilter('all')
    }
  }, [searchParams])

  // Transactions state for current month
  const [monthTransactions, setMonthTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [_error, setError] = useState<string | null>(null)

  const loadTransactions = useCallback(async (targetMonth: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api<DataEnvelope<ApiTransaction[]>>(
        `/transactions?month=${targetMonth}&per_page=500`,
      )
      const mapped: Transaction[] = res.data.map((t) => ({
        id: t.id,
        walletId: t.wallet_id,
        categoryId: t.category_id,
        type: t.type,
        amount: t.amount,
        date: t.transaction_date,
        notes: t.notes ?? undefined,
      }))
      setMonthTransactions(mapped)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Gagal memuat transaksi kalender'
      setError(msg)
      show({ message: msg, type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [show])

  // Load when month or store version changes
  useEffect(() => {
    void loadTransactions(month)
  }, [month, version, loadTransactions])

  // Change month handler
  function handlePrevMonth() {
    setMonth((m) => {
      const nextM = shiftMonth(m, -1)
      setSearchParams((prev) => {
        prev.set('month', nextM)
        return prev
      })
      return nextM
    })
  }

  function handleNextMonth() {
    setMonth((m) => {
      const nextM = shiftMonth(m, 1)
      setSearchParams((prev) => {
        prev.set('month', nextM)
        return prev
      })
      return nextM
    })
  }

  function handleGoToday() {
    setMonth(currentMonth)
    setSelectedDate(today)
    setSearchParams((prev) => {
      prev.delete('month')
      prev.delete('date')
      return prev
    })
  }

  function handleSelectDate(isoDate: string) {
    setSelectedDate(isoDate)
    const targetMonth = isoDate.substring(0, 7)
    if (targetMonth !== month) {
      setMonth(targetMonth)
      setSearchParams((prev) => {
        prev.set('month', targetMonth)
        prev.set('date', isoDate)
        return prev
      })
    } else {
      setSearchParams((prev) => {
        prev.set('date', isoDate)
        return prev
      })
    }
  }

  function handleFilterChange(newFilter: 'all' | 'income' | 'expense') {
    setFilter(newFilter)
    setSearchParams((prev) => {
      if (newFilter === 'all') {
        prev.delete('type')
      } else {
        prev.set('type', newFilter)
      }
      return prev
    })
  }

  // Aggregate transactions by date
  const dateAggregates = useMemo(() => {
    const map = new Map<
      string,
      {
        income: number
        expense: number
        count: number
        transactions: Transaction[]
      }
    >()

    for (const tx of monthTransactions) {
      let entry = map.get(tx.date)
      if (!entry) {
        entry = { income: 0, expense: 0, count: 0, transactions: [] }
        map.set(tx.date, entry)
      }
      if (tx.type === 'income') {
        entry.income += tx.amount
      } else if (tx.type === 'expense') {
        entry.expense += tx.amount
      }
      entry.count += 1
      entry.transactions.push(tx)
    }

    return map
  }, [monthTransactions])

  // Monthly totals
  const monthlyTotals = useMemo(() => {
    let income = 0
    let expense = 0
    for (const tx of monthTransactions) {
      if (tx.type === 'income') income += tx.amount
      else if (tx.type === 'expense') expense += tx.amount
    }
    return {
      income,
      expense,
      net: income - expense,
      count: monthTransactions.length,
    }
  }, [monthTransactions])

  // Calendar matrix calculation (Monday start)
  const calendarCells = useMemo(() => {
    const [yearStr, monthStr] = month.split('-')
    const year = Number(yearStr)
    const monthIndex = Number(monthStr) - 1

    const firstDayDate = new Date(year, monthIndex, 1)
    const totalDaysInMonth = new Date(year, monthIndex + 1, 0).getDate()

    // Monday-based day of week for 1st of month: 0=Mon, 1=Tue, ..., 6=Sun
    const firstDayOfWeek = (firstDayDate.getDay() + 6) % 7

    const cells: {
      date: string
      dayNumber: number
      isCurrentMonth: boolean
      isToday: boolean
      isSelected: boolean
      hasIncome: boolean
      hasExpense: boolean
      income: number
      expense: number
      count: number
    }[] = []

    // Previous month filler days
    const prevMonthDays = new Date(year, monthIndex, 0).getDate()
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthDays - i
      const prevDate = new Date(year, monthIndex - 1, d)
      const iso = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(prevDate)
      const agg = dateAggregates.get(iso)

      cells.push({
        date: iso,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: iso === today,
        isSelected: iso === selectedDate,
        hasIncome: (agg?.income ?? 0) > 0,
        hasExpense: (agg?.expense ?? 0) > 0,
        income: agg?.income ?? 0,
        expense: agg?.expense ?? 0,
        count: agg?.count ?? 0,
      })
    }

    // Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const curDate = new Date(year, monthIndex, d)
      const iso = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(curDate)
      const agg = dateAggregates.get(iso)

      cells.push({
        date: iso,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: iso === today,
        isSelected: iso === selectedDate,
        hasIncome: (agg?.income ?? 0) > 0,
        hasExpense: (agg?.expense ?? 0) > 0,
        income: agg?.income ?? 0,
        expense: agg?.expense ?? 0,
        count: agg?.count ?? 0,
      })
    }

    // Next month filler days to complete a full 35 or 42 grid
    const remaining = (7 - (cells.length % 7)) % 7
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, monthIndex + 1, d)
      const iso = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(nextDate)
      const agg = dateAggregates.get(iso)

      cells.push({
        date: iso,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: iso === today,
        isSelected: iso === selectedDate,
        hasIncome: (agg?.income ?? 0) > 0,
        hasExpense: (agg?.expense ?? 0) > 0,
        income: agg?.income ?? 0,
        expense: agg?.expense ?? 0,
        count: agg?.count ?? 0,
      })
    }

    return cells
  }, [month, dateAggregates, today, selectedDate])

  // Selected date details
  const selectedDateAggregate = dateAggregates.get(selectedDate)
  const selectedDateIncome = selectedDateAggregate?.income ?? 0
  const selectedDateExpense = selectedDateAggregate?.expense ?? 0
  const selectedDateNet = selectedDateIncome - selectedDateExpense

  // Transactions on selected date filtered
  const rawDateTransactions = selectedDateAggregate?.transactions ?? []
  const filteredDateTransactions = useMemo(() => {
    if (filter === 'all') return rawDateTransactions
    return rawDateTransactions.filter((t) => t.type === filter)
  }, [rawDateTransactions, filter])

  const categoryById = useMemo(
    () => new Map<number, Category>(categories.map((c) => [c.id, c])),
    [categories],
  )
  const walletById = useMemo(
    () => new Map<number, Wallet>(wallets.map((w) => [w.id, w])),
    [wallets],
  )

  function handleDelete(tx: Transaction) {
    void removeTransaction(tx.id)
      .then(() => {
        show({
          message: 'Transaksi berhasil dihapus',
          type: 'info',
          actionLabel: 'Batalkan',
          onAction: () => {
            void restoreTransaction(tx)
          },
        })
      })
      .catch((err: unknown) => {
        show({
          message: err instanceof Error ? err.message : 'Gagal menghapus transaksi',
          type: 'error',
        })
      })
  }

  const isCurrentMonthView = month === currentMonth

  return (
    <div className="space-y-6 pb-8">
      {/* 1. Page Header & Month Selector */}
      <PageHeaderMotion>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
                <CalendarIcon size={20} strokeWidth={2} aria-hidden />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
                Kalender Keuangan
              </h1>
            </div>
            <p className="mt-1 text-xs text-ink-soft sm:text-sm">
              Pantau arus uang masuk dan keluar setiap hari secara visual.
            </p>
          </div>

          {/* Month Navigation Controls */}
          <div className="flex items-center gap-2 self-start rounded-[var(--radius-control)] border border-line bg-card p-1 shadow-2xs sm:self-auto">
            <IconButton
              icon={<ChevronLeft size={18} />}
              ariaLabel="Bulan sebelumnya"
              onClick={handlePrevMonth}
              variant="ghost"
              size="sm"
            />
            <span className="min-w-32 text-center text-xs font-bold text-ink sm:min-w-36 sm:text-sm">
              {formatMonthTitle(month)}
            </span>
            <IconButton
              icon={<ChevronRight size={18} />}
              ariaLabel="Bulan berikutnya"
              onClick={handleNextMonth}
              variant="ghost"
              size="sm"
            />
            {!isCurrentMonthView && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleGoToday}
                leftIcon={<RotateCcw size={13} />}
                className="ml-1 text-xs"
              >
                Bulan Ini
              </Button>
            )}
          </div>
        </div>
      </PageHeaderMotion>

      {/* 2. Monthly Summary Cards */}
      <SectionMotion delay={20}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Pemasukan Bulanan */}
          <Card
            variant="subtle"
            className={cn(
              'cursor-pointer border transition duration-200 hover:-translate-y-0.5 hover:shadow-xs',
              filter === 'income' ? 'border-income-500 ring-2 ring-income-500/20' : 'border-line',
            )}
            onClick={() => handleFilterChange(filter === 'income' ? 'all' : 'income')}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-ink-soft">Pemasukan Bulan Ini</span>
              <span className="flex size-7 items-center justify-center rounded-lg bg-income-50 text-income-600 dark:bg-income-950/40 dark:text-income-400">
                <TrendingDown size={15} strokeWidth={2.25} aria-hidden />
              </span>
            </div>
            <div className="mt-2.5">
              <MoneyText
                amount={monthlyTotals.income}
                type="income"
                className="text-lg font-bold tracking-tight text-income-600 sm:text-xl dark:text-income-400"
              />
              <p className="mt-0.5 text-[11px] text-ink-soft">
                {filter === 'income' ? 'Filter pemasukan aktif' : 'Klik untuk filter pemasukan'}
              </p>
            </div>
          </Card>

          {/* Pengeluaran Bulanan */}
          <Card
            variant="subtle"
            className={cn(
              'cursor-pointer border transition duration-200 hover:-translate-y-0.5 hover:shadow-xs',
              filter === 'expense' ? 'border-expense-500 ring-2 ring-expense-500/20' : 'border-line',
            )}
            onClick={() => handleFilterChange(filter === 'expense' ? 'all' : 'expense')}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-ink-soft">Pengeluaran Bulan Ini</span>
              <span className="flex size-7 items-center justify-center rounded-lg bg-expense-50 text-expense-600 dark:bg-expense-950/40 dark:text-expense-400">
                <TrendingUp size={15} strokeWidth={2.25} aria-hidden />
              </span>
            </div>
            <div className="mt-2.5">
              <MoneyText
                amount={monthlyTotals.expense}
                type="expense"
                className="text-lg font-bold tracking-tight text-expense-600 sm:text-xl dark:text-expense-400"
              />
              <p className="mt-0.5 text-[11px] text-ink-soft">
                {filter === 'expense' ? 'Filter pengeluaran aktif' : 'Klik untuk filter pengeluaran'}
              </p>
            </div>
          </Card>

          {/* Arus Kas Bersih Bulanan */}
          <Card
            variant="subtle"
            className={cn(
              'cursor-pointer border transition duration-200 hover:-translate-y-0.5 hover:shadow-xs',
              filter === 'all' ? 'border-brand-500/40' : 'border-line',
            )}
            onClick={() => handleFilterChange('all')}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-ink-soft">Arus Kas Bersih</span>
              <span
                className={cn(
                  'flex size-7 items-center justify-center rounded-lg',
                  monthlyTotals.net >= 0
                    ? 'bg-income-50 text-income-600 dark:bg-income-950/40 dark:text-income-400'
                    : 'bg-expense-50 text-expense-600 dark:bg-expense-950/40 dark:text-expense-400',
                )}
              >
                <Scale size={15} strokeWidth={2} aria-hidden />
              </span>
            </div>
            <div className="mt-2.5">
              <MoneyText
                amount={Math.abs(monthlyTotals.net)}
                type={monthlyTotals.net >= 0 ? 'income' : 'expense'}
                className={cn(
                  'text-lg font-bold tracking-tight sm:text-xl',
                  monthlyTotals.net >= 0
                    ? 'text-income-600 dark:text-income-400'
                    : 'text-expense-600 dark:text-expense-400',
                )}
              />
              <p className="mt-0.5 text-[11px] text-ink-soft">
                {monthlyTotals.net >= 0
                  ? 'Surplus (Pemasukan > Pengeluaran)'
                  : 'Defisit (Pengeluaran > Pemasukan)'}
              </p>
            </div>
          </Card>
        </div>
      </SectionMotion>

      {/* 3. Main Content: Calendar Grid + Selected Date Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Monthly Calendar Grid (7 cols on lg) */}
        <SectionMotion delay={40} className="lg:col-span-7">
          <Card className="overflow-hidden border border-line bg-card p-3 sm:p-5 shadow-xs">
            {/* Header: Legend & Filter status */}
            <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
              <div className="flex items-center gap-3 text-xs text-ink-soft">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <span className="size-2 rounded-full bg-income-500" aria-hidden />
                  <span>Pemasukan</span>
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <span className="size-2 rounded-full bg-expense-500" aria-hidden />
                  <span>Pengeluaran</span>
                </span>
              </div>

              {selectedDate === today && (
                <Badge variant="brand" size="sm">
                  Hari Ini
                </Badge>
              )}
            </div>

            {/* Days of Week Header (Monday start) */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-ink-soft mb-2">
              {DAYS_HEADER.map((dayName, idx) => (
                <div
                  key={dayName}
                  className={cn(
                    'py-1',
                    idx >= 5 && 'text-brand-600 dark:text-brand-400 font-semibold',
                  )}
                >
                  {dayName}
                </div>
              ))}
            </div>

            {/* Calendar Cells */}
            {loading ? (
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {Array.from({ length: 35 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square w-full rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5" role="grid" aria-label="Kalender">
                {calendarCells.map((cell) => {
                  const isCurrentDay = cell.isToday
                  const isSelectedDay = cell.isSelected
                  const hasTransactions = cell.hasIncome || cell.hasExpense

                  return (
                    <button
                      key={cell.date}
                      type="button"
                      onClick={() => handleSelectDate(cell.date)}
                      className={cn(
                        'group relative flex aspect-square flex-col items-center justify-between rounded-xl p-1 sm:p-1.5 text-xs transition duration-150',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                        // Month active/inactive
                        !cell.isCurrentMonth && 'opacity-40 hover:opacity-75',
                        // Selection style
                        isSelectedDay
                          ? 'border-2 border-brand-500 bg-brand-500/10 font-bold text-brand-700 shadow-xs dark:bg-brand-500/20 dark:text-brand-300'
                          : 'border border-line/60 bg-card hover:bg-muted/70 hover:border-line text-ink',
                        // Today highlight (if not selected)
                        isCurrentDay && !isSelectedDay && 'ring-1 ring-brand-400 font-semibold',
                      )}
                      aria-label={`${cell.dayNumber} ${formatMonthTitle(month)} ${cell.count} transaksi`}
                      aria-selected={isSelectedDay}
                    >
                      {/* Day number & today marker */}
                      <div className="flex w-full items-center justify-between">
                        <span
                          className={cn(
                            'inline-flex size-5 items-center justify-center rounded-full text-[11px] sm:text-xs',
                            isCurrentDay && 'bg-brand-500 text-white font-bold',
                            isSelectedDay && !isCurrentDay && 'font-bold text-brand-600 dark:text-brand-300',
                          )}
                        >
                          {cell.dayNumber}
                        </span>

                        {cell.count > 0 && (
                          <span className="hidden text-[9px] font-semibold text-ink-soft sm:inline-block">
                            {cell.count}
                          </span>
                        )}
                      </div>

                      {/* Transaction indicators */}
                      <div className="flex w-full items-center justify-center gap-1 py-0.5">
                        {cell.hasIncome && (
                          <span
                            className="size-1.5 rounded-full bg-income-500 shadow-2xs sm:size-2"
                            title={`Pemasukan: ${formatRupiah(cell.income)}`}
                          />
                        )}
                        {cell.hasExpense && (
                          <span
                            className="size-1.5 rounded-full bg-expense-500 shadow-2xs sm:size-2"
                            title={`Pengeluaran: ${formatRupiah(cell.expense)}`}
                          />
                        )}
                        {!hasTransactions && (
                          <span className="size-1.5 opacity-0 sm:size-2" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </Card>
        </SectionMotion>

        {/* Right: Selected Date Activity & Transactions (5 cols on lg) */}
        <SectionMotion delay={60} className="lg:col-span-5 flex flex-col gap-4">
          {/* Selected Date Summary Card */}
          <Card className="border border-line bg-card p-4 sm:p-5 shadow-xs">
            <div className="flex items-start justify-between gap-2 border-b border-line pb-3.5">
              <div>
                <p className="text-xs font-semibold text-ink-soft uppercase tracking-wider">
                  Tanggal Terpilih
                </p>
                <h2 className="mt-0.5 text-base font-bold text-ink sm:text-lg">
                  {formatFullDateIndonesian(selectedDate)}
                </h2>
              </div>
              {selectedDate === today && (
                <Badge variant="brand" size="sm">
                  Hari Ini
                </Badge>
              )}
            </div>

            {/* Selected Date Metric Strips */}
            <div className="mt-3.5 grid grid-cols-3 gap-2">
              <div className="rounded-[var(--radius-control)] bg-income-50/60 p-2.5 dark:bg-income-950/30">
                <span className="text-[10px] font-semibold text-income-700 dark:text-income-300">
                  Pemasukan
                </span>
                <p className="mt-1 text-xs font-bold text-income-600 sm:text-sm tabular-nums dark:text-income-400">
                  {formatCompact(selectedDateIncome)}
                </p>
              </div>

              <div className="rounded-[var(--radius-control)] bg-expense-50/60 p-2.5 dark:bg-expense-950/30">
                <span className="text-[10px] font-semibold text-expense-700 dark:text-expense-300">
                  Pengeluaran
                </span>
                <p className="mt-1 text-xs font-bold text-expense-600 sm:text-sm tabular-nums dark:text-expense-400">
                  {formatCompact(selectedDateExpense)}
                </p>
              </div>

              <div className="rounded-[var(--radius-control)] bg-muted/70 p-2.5">
                <span className="text-[10px] font-semibold text-ink-soft">
                  Arus Bersih
                </span>
                <p
                  className={cn(
                    'mt-1 text-xs font-bold sm:text-sm tabular-nums',
                    selectedDateNet >= 0
                      ? 'text-income-600 dark:text-income-400'
                      : 'text-expense-600 dark:text-expense-400',
                  )}
                >
                  {selectedDateNet > 0 ? '+' : ''}
                  {formatCompact(selectedDateNet)}
                </p>
              </div>
            </div>

            {/* Filter Selector & Quick Add Button */}
            <div className="mt-4 flex items-center justify-between gap-2">
              <div
                className="flex items-center gap-1 rounded-[var(--radius-control)] bg-muted p-0.5 text-xs"
                role="tablist"
                aria-label="Filter transaksi"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={filter === 'all'}
                  onClick={() => handleFilterChange('all')}
                  className={cn(
                    'rounded-[calc(var(--radius-control)-2px)] px-2.5 py-1 text-xs font-semibold transition duration-150',
                    filter === 'all'
                      ? 'bg-card text-ink shadow-2xs'
                      : 'text-ink-soft hover:text-ink',
                  )}
                >
                  Semua ({rawDateTransactions.length})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={filter === 'income'}
                  onClick={() => handleFilterChange('income')}
                  className={cn(
                    'rounded-[calc(var(--radius-control)-2px)] px-2.5 py-1 text-xs font-semibold transition duration-150',
                    filter === 'income'
                      ? 'bg-income-500 text-white shadow-2xs'
                      : 'text-ink-soft hover:text-ink',
                  )}
                >
                  Masuk
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={filter === 'expense'}
                  onClick={() => handleFilterChange('expense')}
                  className={cn(
                    'rounded-[calc(var(--radius-control)-2px)] px-2.5 py-1 text-xs font-semibold transition duration-150',
                    filter === 'expense'
                      ? 'bg-expense-500 text-white shadow-2xs'
                      : 'text-ink-soft hover:text-ink',
                  )}
                >
                  Keluar
                </button>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() =>
                  openAddTransaction({
                    type: filter === 'income' ? 'income' : 'expense',
                    date: selectedDate,
                  })
                }
                leftIcon={<Plus size={14} />}
                className="text-xs shrink-0"
              >
                Catat
              </Button>
            </div>
          </Card>

          {/* Transactions List on Selected Date */}
          <div className="space-y-3">
            {filteredDateTransactions.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="Belum ada transaksi"
                description={`Tidak ada transaksi ${filter === 'income' ? 'pemasukan ' : filter === 'expense' ? 'pengeluaran ' : ''}pada ${formatFullDateIndonesian(selectedDate)}.`}
                action={{
                  label: 'Catat Transaksi Sekarang',
                  onClick: () =>
                    openAddTransaction({
                      type: filter === 'income' ? 'income' : 'expense',
                      date: selectedDate,
                    }),
                }}
              />
            ) : (
              <Card className="divide-y divide-line border border-line bg-card p-0 shadow-xs">
                <div className="px-4 py-2.5 bg-muted/30 flex items-center justify-between text-xs font-medium text-ink-soft">
                  <span>Daftar Transaksi ({filteredDateTransactions.length})</span>
                  <span>{formatFullDateIndonesian(selectedDate)}</span>
                </div>
                <div className="divide-y divide-line/60 px-4">
                  {filteredDateTransactions.map((tx) => (
                    <TransactionItem
                      key={tx.id}
                      transaction={tx}
                      category={categoryById.get(tx.categoryId)}
                      wallet={walletById.get(tx.walletId)}
                      compact
                      action={
                        <button
                          type="button"
                          onClick={() => handleDelete(tx)}
                          aria-label={`Hapus transaksi ${tx.amount}`}
                          className="rounded-lg p-1 text-ink-soft/60 hover:bg-muted hover:text-expense-500 transition duration-150"
                        >
                          <span className="sr-only">Hapus</span>
                          <span aria-hidden className="text-xs">✕</span>
                        </button>
                      }
                    />
                  ))}
                </div>
              </Card>
            )}
          </div>
        </SectionMotion>
      </div>
    </div>
  )
}

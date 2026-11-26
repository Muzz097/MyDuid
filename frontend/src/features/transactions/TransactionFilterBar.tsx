/**
 * TransactionFilterBar
 *
 * Compact, accessible filter bar for the Transactions page.
 * Contains:
 *   - Search input (notes / category / wallet)
 *   - Quick-period chips (Hari ini, Minggu ini, Bulan ini, Bulan lalu, Tahun ini, Custom)
 *   - Type chips (Semua, Pemasukan, Pengeluaran)
 *   - Wallet filter (dropdown chip)
 *   - Category filter (multi-select chips, up to 20 shown then collapsed)
 *   - Active filter chip strip (dismissible) + Reset all
 *
 * Props are purely controlled (no internal filter state).
 */

import { useId, useRef, useState, type ChangeEvent } from 'react'
import {
  ArrowLeftRight,
  CalendarRange,
  ChevronDown,
  Filter,
  Search,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import type { Category, Wallet } from '@/types'
import {
  DEFAULT_FILTERS,
  type PeriodPreset,
  type TransactionFilters,
} from '@/features/transactions/useTransactionQuery'

// ---- Helpers -----------------------------------------------------------

const PERIOD_LABELS: Record<PeriodPreset, string> = {
  today: 'Hari ini',
  this_week: 'Minggu ini',
  this_month: 'Bulan ini',
  last_month: 'Bulan lalu',
  this_year: 'Tahun ini',
  custom: 'Rentang...',
}

const TYPE_OPTIONS = [
  { value: 'all' as const,      label: 'Semua',        icon: <ArrowLeftRight size={14} strokeWidth={2} aria-hidden /> },
  { value: 'income' as const,   label: 'Pemasukan',    icon: <TrendingUp     size={14} strokeWidth={2} aria-hidden /> },
  { value: 'expense' as const,  label: 'Pengeluaran',  icon: <TrendingDown   size={14} strokeWidth={2} aria-hidden /> },
]

// ---- Sub-components ----------------------------------------------------

type SmallChipProps = {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
  icon?: React.ReactNode
  className?: string
  ariaLabel?: string
}

function SmallChip({ selected, onClick, children, icon, className, ariaLabel }: SmallChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={ariaLabel}
      className={cn(
        'inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium transition duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 active:scale-[0.97]',
        selected
          ? 'bg-brand-500 text-white shadow-sm'
          : 'bg-muted text-ink hover:bg-line/50',
        className,
      )}
    >
      {icon}
      {children}
    </button>
  )
}

type DismissibleChipProps = {
  label: string
  onRemove: () => void
}

function DismissibleChip({ label, onRemove }: DismissibleChipProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 py-1 pl-3 pr-1.5 text-xs font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Hapus filter: ${label}`}
        className="ml-0.5 inline-flex size-4 items-center justify-center rounded-full hover:bg-brand-200 dark:hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-400 transition"
      >
        <X size={10} strokeWidth={2.5} aria-hidden />
      </button>
    </span>
  )
}

// ---- Main component ----------------------------------------------------

export type TransactionFilterBarProps = {
  filters: TransactionFilters
  onChange: (patch: Partial<TransactionFilters>) => void
  wallets: Wallet[]
  categories: Category[]
  className?: string
}

export function TransactionFilterBar({
  filters,
  onChange,
  wallets,
  categories,
  className,
}: TransactionFilterBarProps) {
  const searchId = useId()
  const dateFromId = useId()
  const dateToId = useId()
  const walletSelectId = useId()
  const [showAllCategories, setShowAllCategories] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Split categories by type
  const incomeCategories = categories.filter((c) => c.type === 'income')
  const expenseCategories = categories.filter((c) => c.type === 'expense')
  const relevantCategories =
    filters.type === 'income'
      ? incomeCategories
      : filters.type === 'expense'
        ? expenseCategories
        : categories

  const CAT_SHOW_LIMIT = 8
  const displayedCategories = showAllCategories
    ? relevantCategories
    : relevantCategories.slice(0, CAT_SHOW_LIMIT)

  function toggleCategory(id: number) {
    const existing = filters.categoryIds
    if (existing.includes(id)) {
      onChange({ categoryIds: existing.filter((c) => c !== id) })
    } else {
      onChange({ categoryIds: [...existing, id] })
    }
  }

  function handleSearchChange(e: ChangeEvent<HTMLInputElement>) {
    onChange({ search: e.target.value })
  }

  function clearSearch() {
    onChange({ search: '' })
    searchInputRef.current?.focus()
  }

  // ---- Active filter chips -----------------------------------------------

  const activeChips: { label: string; onRemove: () => void }[] = []

  if (filters.type !== 'all') {
    activeChips.push({
      label: filters.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      onRemove: () => onChange({ type: 'all' }),
    })
  }

  if (filters.walletId !== null) {
    const w = wallets.find((x) => x.id === filters.walletId)
    activeChips.push({
      label: w ? w.name : `Dompet #${filters.walletId}`,
      onRemove: () => onChange({ walletId: null }),
    })
  }

  for (const cid of filters.categoryIds) {
    const cat = categories.find((c) => c.id === cid)
    activeChips.push({
      label: cat ? cat.name : `Kategori #${cid}`,
      onRemove: () => onChange({ categoryIds: filters.categoryIds.filter((x) => x !== cid) }),
    })
  }

  if (filters.period !== DEFAULT_FILTERS.period) {
    activeChips.push({
      label: PERIOD_LABELS[filters.period],
      onRemove: () => onChange({ period: DEFAULT_FILTERS.period, dateFrom: '', dateTo: '' }),
    })
  }

  if (filters.search.trim()) {
    activeChips.push({
      label: `"${filters.search.trim()}"`,
      onRemove: () => onChange({ search: '' }),
    })
  }

  const hasActiveFilters =
    filters.type !== DEFAULT_FILTERS.type ||
    filters.walletId !== DEFAULT_FILTERS.walletId ||
    filters.categoryIds.length > 0 ||
    filters.period !== DEFAULT_FILTERS.period ||
    filters.search.trim() !== ''

  function resetAll() {
    onChange(DEFAULT_FILTERS)
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* ---- Row 1: Search + Filter toggle -------------------------------- */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <label htmlFor={searchId} className="sr-only">
            Cari transaksi
          </label>
          <span
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft"
            aria-hidden
          >
            <Search size={16} strokeWidth={2} />
          </span>
          <input
            ref={searchInputRef}
            id={searchId}
            type="search"
            value={filters.search}
            onChange={handleSearchChange}
            placeholder="Cari catatan, kategori, atau dompet..."
            autoComplete="off"
            className={cn(
              'w-full min-h-10 rounded-[var(--radius-control)] border border-line bg-card pl-9 pr-9 text-sm text-ink',
              'outline-none transition-shadow focus:ring-2 focus:ring-brand-400',
              'placeholder:text-ink-soft/60',
            )}
          />
          {filters.search && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Hapus pencarian"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 rounded-full p-0.5"
            >
              <X size={15} strokeWidth={2.5} aria-hidden />
            </button>
          )}
        </div>

        <IconButton
          label={showAdvanced ? 'Tutup filter' : 'Buka filter lanjut'}
          icon={<Filter size={16} strokeWidth={2} aria-hidden />}
          variant={showAdvanced ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setShowAdvanced((v) => !v)}
          className={cn(
            'shrink-0',
            hasActiveFilters && !showAdvanced && 'relative after:absolute after:right-1.5 after:top-1.5 after:size-2 after:rounded-full after:bg-brand-500',
          )}
          aria-expanded={showAdvanced}
        />
      </div>

      {/* ---- Row 2: Period quick chips (always visible) ------------------- */}
      <div
        className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none"
        role="group"
        aria-label="Filter periode"
      >
        {(Object.entries(PERIOD_LABELS) as [PeriodPreset, string][]).map(([key, label]) => (
          <SmallChip
            key={key}
            selected={filters.period === key}
            onClick={() => onChange({ period: key, ...(key !== 'custom' ? { dateFrom: '', dateTo: '' } : {}) })}
            icon={key === 'custom' ? <CalendarRange size={13} strokeWidth={2} aria-hidden /> : undefined}
            ariaLabel={`Periode: ${label}`}
            className="whitespace-nowrap"
          >
            {label}
          </SmallChip>
        ))}
      </div>

      {/* ---- Custom date range (shown when period === 'custom') ----------- */}
      {filters.period === 'custom' && (
        <div
          className="flex flex-wrap gap-3 rounded-[var(--radius-control)] border border-line/60 bg-muted/40 px-3 py-2.5"
          role="group"
          aria-label="Rentang tanggal kustom"
        >
          <div className="flex flex-col gap-1">
            <label htmlFor={dateFromId} className="text-[11px] font-medium text-ink-soft uppercase tracking-wide">
              Dari
            </label>
            <input
              id={dateFromId}
              type="date"
              value={filters.dateFrom}
              onChange={(e) => onChange({ dateFrom: e.target.value })}
              className="rounded-[var(--radius-control)] border border-line bg-card px-2.5 py-1.5 text-sm text-ink outline-none focus:ring-2 focus:ring-brand-400 min-h-9"
              max={filters.dateTo || undefined}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={dateToId} className="text-[11px] font-medium text-ink-soft uppercase tracking-wide">
              Sampai
            </label>
            <input
              id={dateToId}
              type="date"
              value={filters.dateTo}
              onChange={(e) => onChange({ dateTo: e.target.value })}
              className="rounded-[var(--radius-control)] border border-line bg-card px-2.5 py-1.5 text-sm text-ink outline-none focus:ring-2 focus:ring-brand-400 min-h-9"
              min={filters.dateFrom || undefined}
            />
          </div>
        </div>
      )}

      {/* ---- Advanced filters panel --------------------------------------- */}
      {showAdvanced && (
        <div className="space-y-4 rounded-[var(--radius-card)] border border-line/60 bg-card p-4">
          {/* Type filter */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
              Jenis Transaksi
            </p>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Jenis transaksi">
              {TYPE_OPTIONS.map((opt) => (
                <SmallChip
                  key={opt.value}
                  selected={filters.type === opt.value}
                  onClick={() => {
                    onChange({ type: opt.value, categoryIds: [] })
                  }}
                  icon={opt.icon}
                  ariaLabel={`Jenis: ${opt.label}`}
                >
                  {opt.label}
                </SmallChip>
              ))}
            </div>
          </div>

          {/* Wallet filter */}
          {wallets.length > 0 && (
            <div>
              <label
                htmlFor={walletSelectId}
                className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-ink-soft"
              >
                Dompet
              </label>
              <div className="relative">
                <select
                  id={walletSelectId}
                  value={filters.walletId ?? ''}
                  onChange={(e) =>
                    onChange({ walletId: e.target.value ? Number(e.target.value) : null })
                  }
                  className={cn(
                    'w-full appearance-none rounded-[var(--radius-control)] border border-line bg-card',
                    'px-3 pr-9 py-2 text-sm text-ink outline-none transition-shadow',
                    'focus:ring-2 focus:ring-brand-400 min-h-10',
                  )}
                >
                  <option value="">Semua Dompet</option>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={15}
                  strokeWidth={2}
                  aria-hidden
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-soft"
                />
              </div>
            </div>
          )}

          {/* Category filter */}
          {relevantCategories.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                Kategori
                {filters.categoryIds.length > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-brand-500 px-1.5 text-[10px] text-white">
                    {filters.categoryIds.length}
                  </span>
                )}
              </p>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter kategori">
                {displayedCategories.map((cat) => (
                  <SmallChip
                    key={cat.id}
                    selected={filters.categoryIds.includes(cat.id)}
                    onClick={() => toggleCategory(cat.id)}
                    ariaLabel={`Kategori: ${cat.name}`}
                  >
                    {cat.name}
                  </SmallChip>
                ))}
              </div>
              {relevantCategories.length > CAT_SHOW_LIMIT && (
                <button
                  type="button"
                  onClick={() => setShowAllCategories((v) => !v)}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 rounded"
                >
                  <ChevronDown
                    size={13}
                    strokeWidth={2.5}
                    aria-hidden
                    className={cn('transition-transform', showAllCategories && 'rotate-180')}
                  />
                  {showAllCategories
                    ? 'Tampilkan lebih sedikit'
                    : `+${relevantCategories.length - CAT_SHOW_LIMIT} kategori lainnya`}
                </button>
              )}
            </div>
          )}

          {/* Reset */}
          {hasActiveFilters && (
            <div className="border-t border-line/60 pt-3">
              <Button variant="ghost" size="sm" onClick={resetAll} className="text-ink-soft hover:text-ink">
                <X size={14} strokeWidth={2.5} aria-hidden className="mr-1" />
                Reset semua filter
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ---- Active filter chips row ------------------------------------- */}
      {activeChips.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-1.5"
          role="list"
          aria-label="Filter aktif"
        >
          {activeChips.map((chip, i) => (
            <div key={i} role="listitem">
              <DismissibleChip label={chip.label} onRemove={chip.onRemove} />
            </div>
          ))}
          {activeChips.length > 1 && (
            <button
              type="button"
              onClick={resetAll}
              className="ml-1 text-xs font-medium text-ink-soft hover:text-ink transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 rounded"
            >
              Hapus semua
            </button>
          )}
        </div>
      )}
    </div>
  )
}

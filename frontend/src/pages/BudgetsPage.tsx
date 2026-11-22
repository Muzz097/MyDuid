import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  PiggyBank,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { BudgetFormSheet } from '@/features/budgets/BudgetFormSheet'
import { ApiError, api } from '@/lib/api'
import { getIcon } from '@/lib/icons'
import { formatRupiah } from '@/lib/money'
import { useStore } from '@/lib/store'

type Budget = {
  id: number
  category_id: number | null
  wallet_id: number | null
  year: number
  month: number
  limit_amount: number
  spent: number
  remaining: number
  percent: number
  status: 'healthy' | 'warning' | 'over'
  category: { id: number; name: string; icon_key: string } | null
  wallet: { id: number; name: string } | null
}

function todayInJakarta() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const value = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value)
  const year = value('year')
  const month = String(value('month')).padStart(2, '0')
  return {
    monthKey: `${year}-${month}`,
    day: value('day'),
  }
}

function changeMonth(month: string, offset: number): string {
  const [year, value] = month.split('-').map(Number)
  const date = new Date(year, value - 1 + offset, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(month: string): string {
  const [year, value] = month.split('-').map(Number)
  return new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, value - 1, 1))
}

function daysInMonth(month: string): number {
  const [year, value] = month.split('-').map(Number)
  return new Date(year, value, 0).getDate()
}

function BudgetSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="h-36" />
      ))}
    </div>
  )
}

export function BudgetsPage() {
  const { wallets } = useStore()
  const { show } = useToast()
  const [today] = useState(todayInJakarta)
  const latestMonth = useMemo(() => changeMonth(today.monthKey, 1), [today])
  const [month, setMonth] = useState(today.monthKey)
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Budget | null>(null)
  const [menuId, setMenuId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<Budget | null>(null)

  const loadBudgets = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const response = await api<{ data: Budget[] }>(
        `/budgets?month=${encodeURIComponent(month)}`,
      )
      setBudgets(response.data)
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Anggaran gagal dimuat'
      setLoadError(message)
      throw error
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => {
    void loadBudgets().catch(() => undefined)
  }, [loadBudgets])

  async function handleDelete() {
    if (!deleting) return
    try {
      await api(`/budgets/${deleting.id}`, { method: 'DELETE' })
      setDeleting(null)
      show({ message: 'Anggaran dihapus' })
      await loadBudgets()
    } catch (error) {
      show({
        message:
          error instanceof Error ? error.message : 'Anggaran gagal dihapus',
      })
    }
  }

  function openCreateForm() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEditForm(budget: Budget) {
    setEditing(budget)
    setFormOpen(true)
    setMenuId(null)
  }

  const isCurrentMonth = month === today.monthKey
  const elapsedDays = isCurrentMonth ? today.day : null
  const elapsedPercent =
    elapsedDays === null ? undefined : (elapsedDays / daysInMonth(month)) * 100
  const daysRemaining =
    elapsedDays === null ? null : daysInMonth(month) - elapsedDays

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Anggaran</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Atur batas pengeluaran per kategori atau dompet.
          </p>
        </div>
        <div className="hidden sm:block">
          <Button onClick={openCreateForm}>
            <Plus size={18} strokeWidth={1.75} className="mr-2" aria-hidden />
            Tambah anggaran
          </Button>
        </div>
      </header>

      <div className="flex items-center justify-between rounded-[var(--radius-card)] border border-line bg-card p-2">
        <button
          type="button"
          aria-label="Bulan sebelumnya"
          onClick={() => setMonth((value) => changeMonth(value, -1))}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-control)] text-ink-soft transition duration-200 hover:bg-muted active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
        >
          <ChevronLeft size={20} strokeWidth={1.75} aria-hidden />
        </button>
        <p className="text-base font-semibold capitalize text-ink">
          {monthLabel(month)}
        </p>
        <button
          type="button"
          aria-label="Bulan berikutnya"
          disabled={month >= latestMonth}
          onClick={() => setMonth((value) => changeMonth(value, 1))}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-control)] text-ink-soft transition duration-200 hover:bg-muted active:scale-[0.98] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
        >
          <ChevronRight size={20} strokeWidth={1.75} aria-hidden />
        </button>
      </div>

      {loading ? (
        <BudgetSkeleton />
      ) : loadError ? (
        <div className="space-y-3 rounded-[var(--radius-card)] border border-line bg-card p-6 text-center">
          <p className="text-sm text-ink-soft">{loadError}</p>
          <Button variant="secondary" onClick={() => void loadBudgets().catch(() => undefined)}>
            Coba lagi
          </Button>
        </div>
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="Belum ada anggaran"
          description={`Buat anggaran untuk membantu memantau pengeluaran pada ${monthLabel(month)}.`}
          action={{ label: 'Buat anggaran pertama', onClick: openCreateForm }}
        />
      ) : (
        <div className="space-y-3">
          {budgets.map((budget) => {
            const walletIconKey = wallets.find(
              (wallet) => wallet.id === budget.wallet_id,
            )?.iconKey
            const Icon = getIcon(
              budget.category?.icon_key ?? walletIconKey ?? 'default',
            )
            const title =
              budget.category && budget.wallet
                ? `${budget.category.name} · ${budget.wallet.name}`
                : budget.category?.name ?? budget.wallet?.name ?? 'Anggaran'
            return (
              <Card key={budget.id} className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-expense-50 text-expense-500">
                    <Icon size={20} strokeWidth={1.75} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-semibold text-ink">{title}</h2>
                    <p className="mt-1 text-sm text-ink-soft">
                      {budget.category && budget.wallet
                        ? 'Kategori · Dompet'
                        : budget.category
                          ? 'Kategori'
                          : 'Dompet'}
                    </p>
                  </div>
                  <div className="relative">
                    <button
                      type="button"
                      aria-label={`Aksi untuk anggaran ${title}`}
                      aria-expanded={menuId === budget.id}
                      onClick={() =>
                        setMenuId((current) =>
                          current === budget.id ? null : budget.id,
                        )
                      }
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-control)] text-ink-soft transition duration-200 hover:bg-muted active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                    >
                      <MoreVertical size={20} strokeWidth={1.75} aria-hidden />
                    </button>
                    {menuId === budget.id ? (
                      <div className="absolute right-0 top-full z-10 mt-1 min-w-32 rounded-[var(--radius-control)] border border-line bg-card p-1 shadow-lg">
                        <button
                          type="button"
                          onClick={() => openEditForm(budget)}
                          className="min-h-11 w-full rounded-lg px-3 text-left text-sm text-ink hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                        >
                          Ubah
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleting(budget)
                            setMenuId(null)
                          }}
                          className="min-h-11 w-full rounded-lg px-3 text-left text-sm text-danger-700 hover:bg-danger-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                        >
                          Hapus
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>

                <ProgressBar
                  value={budget.spent}
                  max={budget.limit_amount}
                  label={`${budget.percent}% dari batas`}
                  markerPercent={elapsedPercent}
                />
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
                  <p className="tabular text-ink-soft">
                    Sisa {formatRupiah(budget.remaining)} dari{' '}
                    {formatRupiah(budget.limit_amount)}
                  </p>
                  {daysRemaining !== null ? (
                    <p className="text-ink-soft">
                      {daysRemaining === 0
                        ? 'Hari terakhir bulan ini'
                        : `Sisa ${daysRemaining} hari bulan ini`}
                    </p>
                  ) : null}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {!loading && budgets.length > 0 ? (
        <Button fullWidth className="sm:hidden" onClick={openCreateForm}>
          <Plus size={18} strokeWidth={1.75} className="mr-2" aria-hidden />
          Tambah anggaran
        </Button>
      ) : null}

      <BudgetFormSheet
        open={formOpen}
        month={month}
        budget={editing}
        onClose={() => setFormOpen(false)}
        onSaved={loadBudgets}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Hapus anggaran?"
        description={`Anggaran ${deleting?.category?.name ?? deleting?.wallet?.name ?? ''} akan dihapus.`}
        confirmLabel="Hapus"
        variant="danger"
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}

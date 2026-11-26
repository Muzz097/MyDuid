import { useCallback, useEffect, useState } from 'react'
import { Calendar, CheckCircle2, Pencil, Plus, Target, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { api, ApiError } from '@/lib/api'
import { cn } from '@/lib/cn'
import { formatRupiah } from '@/lib/money'
import type { Wallet, WalletGoal } from '@/types'

interface WalletGoalSectionProps {
  wallet: Wallet
  onChanged: () => void
}

type GoalDraft = {
  name: string
  target_amount: string
  deadline: string
}

function emptyDraft(): GoalDraft {
  return { name: '', target_amount: '', deadline: '' }
}

function draftFromGoal(goal: WalletGoal): GoalDraft {
  return {
    name: goal.name,
    target_amount: String(goal.target_amount),
    deadline: goal.deadline ?? '',
  }
}

export function WalletGoalSection({ wallet, onChanged }: WalletGoalSectionProps) {
  const { show } = useToast()
  const [goal, setGoal] = useState<WalletGoal | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null)
  const [draft, setDraft] = useState<GoalDraft>(emptyDraft)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchGoal = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await api<{ data: WalletGoal | null }>(`/wallets/${wallet.id}/goal`)
      setGoal(res.data)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Gagal memuat goal.')
    } finally {
      setLoading(false)
    }
  }, [wallet.id])

  useEffect(() => {
    setFormMode(null)
    setConfirmDelete(false)
    setErrors({})
    void fetchGoal()
  }, [fetchGoal])

  const openCreate = () => {
    setDraft(emptyDraft())
    setErrors({})
    setFormMode('create')
  }

  const openEdit = () => {
    if (!goal) return
    setDraft(draftFromGoal(goal))
    setErrors({})
    setFormMode('edit')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const nextErrors: Record<string, string> = {}
    const trimmedName = draft.name.trim()
    const parsedTarget = Number(draft.target_amount)
    const deadline = draft.deadline.trim()

    if (!trimmedName) nextErrors.name = 'Nama goal wajib diisi.'
    if (!Number.isInteger(parsedTarget) || parsedTarget < 1) {
      nextErrors.target_amount = 'Target tabungan harus bilangan bulat lebih dari 0.'
    }
    if (deadline && !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
      nextErrors.deadline = 'Tenggat harus dalam format YYYY-MM-DD.'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setSaving(true)
    setErrors({})
    try {
      const payload = {
        name: trimmedName,
        target_amount: parsedTarget,
        deadline: deadline || null,
      }

      const res =
        formMode === 'create'
          ? await api<{ data: WalletGoal }>(`/wallets/${wallet.id}/goal`, {
              method: 'POST',
              body: JSON.stringify(payload),
            })
          : await api<{ data: WalletGoal }>(`/wallets/${wallet.id}/goal`, {
              method: 'PUT',
              body: JSON.stringify(payload),
            })

      setGoal(res.data)
      setFormMode(null)
      show({
        message: formMode === 'create' ? 'Goal tabungan dibuat.' : 'Goal tabungan diperbarui.',
        type: 'success',
      })
      onChanged()
    } catch (err) {
      if (err instanceof ApiError && err.status === 422 && err.errors) {
        const mapped: Record<string, string> = {}
        for (const [k, v] of Object.entries(err.errors)) {
          if (v[0]) mapped[k] = v[0]
        }
        setErrors(mapped)
      } else {
        show({
          message: err instanceof Error ? err.message : 'Gagal menyimpan goal.',
          type: 'error',
        })
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api(`/wallets/${wallet.id}/goal`, { method: 'DELETE' })
      setGoal(null)
      setConfirmDelete(false)
      show({ message: 'Goal tabungan dihapus.', type: 'success' })
      onChanged()
    } catch (err) {
      show({
        message: err instanceof Error ? err.message : 'Gagal menghapus goal.',
        type: 'error',
      })
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <Skeleton className="h-24 w-full" rounded="card" />
  }

  if (loadError) {
    return (
      <section aria-label="Goal tabungan" className="space-y-2">
        <p className="text-sm text-danger-500" role="alert">{loadError}</p>
        <Button type="button" variant="outline" size="sm" onClick={() => void fetchGoal()}>
          Coba lagi
        </Button>
      </section>
    )
  }

  if (formMode !== null) {
    return (
      <section
        aria-label={formMode === 'create' ? 'Buat goal tabungan' : 'Ubah goal tabungan'}
        className="rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-xs"
      >
        <h3 className="mb-3 text-sm font-semibold text-ink">
          {formMode === 'create' ? 'Buat Goal Tabungan' : 'Ubah Goal Tabungan'}
        </h3>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
          <Input
            label="Nama goal"
            placeholder="Contoh: Dana Darurat"
            maxLength={100}
            value={draft.name}
            error={errors.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
          <Input
            label="Target tabungan (Rp)"
            type="number"
            min={1}
            step={1}
            placeholder="Contoh: 10000000"
            value={draft.target_amount}
            error={errors.target_amount}
            onChange={(e) => setDraft((d) => ({ ...d, target_amount: e.target.value }))}
          />
          <Input
            label="Tenggat (opsional)"
            type="date"
            value={draft.deadline}
            error={errors.deadline}
            onChange={(e) => setDraft((d) => ({ ...d, deadline: e.target.value }))}
          />
          {errors.wallet_id ? (
            <p className="text-sm text-danger-500" role="alert">
              {errors.wallet_id}
            </p>
          ) : null}
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={() => {
                setFormMode(null)
                setErrors({})
              }}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={saving}>
              Simpan
            </Button>
          </div>
        </form>
      </section>
    )
  }

  if (!goal) {
    return (
      <section
        aria-label="Goal tabungan"
        className="flex items-center justify-between gap-3 rounded-[var(--radius-card)] border border-dashed border-line bg-muted/40 px-4 py-3.5"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
            <Target size={18} strokeWidth={1.75} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">Belum ada goal</p>
            <p className="text-xs text-ink-soft">Tetapkan target tabungan untuk dompet ini.</p>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={openCreate}>
          <Plus size={15} strokeWidth={2} aria-hidden />
          Buat Goal
        </Button>
      </section>
    )
  }

  const deadlineInfo = goal.deadline_info
  const showWeeklyDeposit =
    !goal.achieved &&
    deadlineInfo !== null &&
    deadlineInfo.status === 'Dalam tenggat' &&
    deadlineInfo.weekly_deposit !== null

  return (
    <section
      aria-label="Goal tabungan"
      className="space-y-3 rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-xs"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Target size={17} strokeWidth={1.8} className="shrink-0 text-brand-500" aria-hidden />
          <h3 className="truncate text-sm font-semibold text-ink">{goal.name}</h3>
          {goal.achieved ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-income-500/15 px-2 py-0.5 text-[11px] font-semibold text-income-600 dark:text-income-400">
              <CheckCircle2 size={12} strokeWidth={2} aria-hidden />
              Tercapai
            </span>
          ) : deadlineInfo?.status === 'Tenggat terlewat' ? (
            <span className="inline-flex items-center rounded-full bg-danger-500/15 px-2 py-0.5 text-[11px] font-semibold text-danger-600 dark:text-danger-400">
              Tenggat terlewat
            </span>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={openEdit} aria-label="Ubah goal">
            <Pencil size={14} strokeWidth={1.75} aria-hidden />
            Ubah
          </Button>
          {!confirmDelete ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-danger-500 hover:bg-danger-500/10 hover:text-danger-500"
              onClick={() => setConfirmDelete(true)}
              aria-label="Hapus goal"
            >
              <Trash2 size={14} strokeWidth={1.75} aria-hidden />
            </Button>
          ) : (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="danger"
                size="sm"
                loading={deleting}
                onClick={() => void handleDelete()}
              >
                Hapus
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={deleting}
                onClick={() => setConfirmDelete(false)}
              >
                Batal
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between gap-2 text-xs">
          <span className="tabular-nums font-medium text-ink">
            {formatRupiah(goal.balance)}{' '}
            <span className="text-ink-soft">/ {formatRupiah(goal.target_amount)}</span>
          </span>
          <span className="tabular-nums font-bold text-ink">{goal.percent}%</span>
        </div>
        <div
          className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={goal.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progres goal ${goal.name}: ${goal.percent}%`}
        >
          <div
            className={cn(
              'h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none',
              goal.achieved ? 'bg-income-500' : 'bg-brand-500',
            )}
            style={{ width: `${Math.min(Math.max(goal.percent, 0), 100)}%` }}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-soft">
          <span className="tabular-nums">
            {goal.achieved ? 'Target sudah tercapai' : `Sisa ${formatRupiah(goal.remaining)}`}
          </span>
          {goal.deadline ? (
            <span className="inline-flex items-center gap-1">
              <Calendar size={12} strokeWidth={1.75} aria-hidden />
              Tenggat: {goal.deadline}
            </span>
          ) : null}
        </div>
      </div>

      {showWeeklyDeposit ? (
        <div className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-ink">
          <p className="font-semibold tabular-nums">
            Perkiraan setoran: {formatRupiah(deadlineInfo.weekly_deposit!)} / minggu
          </p>
          {deadlineInfo.deposit_note ? (
            <p className="mt-0.5 text-[11px] text-ink-soft">{deadlineInfo.deposit_note}</p>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

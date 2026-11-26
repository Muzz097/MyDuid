import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import {
  AlertCircle,
  Calendar,
  Clock,
  FileText,
  Hash,
  Pencil,
  Tag,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet as WalletIconLucide,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { IconButton } from '@/components/ui/IconButton'
import { Input } from '@/components/ui/Input'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { MoneyText } from '@/components/ui/MoneyText'
import { Sheet } from '@/components/ui/Sheet'
import { useToast } from '@/components/ui/Toast'
import {
  mapTransaction,
  type ApiTransaction,
  type FetchedTransaction,
} from '@/features/transactions/useTransactionQuery'
import { api, ApiError } from '@/lib/api'
import { cn } from '@/lib/cn'
import { shiftJakartaDate, todayJakarta } from '@/lib/date'
import { getIcon } from '@/lib/icons'
import { formatRupiah } from '@/lib/money'
import type { Category, TransactionType, Wallet } from '@/types'

const MAX_AMOUNT = 9_000_000_000_000
const MAX_NOTES_LENGTH = 500

type TransactionDetailPanelProps = {
  transaction: FetchedTransaction | null
  wallets: Wallet[]
  categories: Category[]
  onClose: () => void
  onUpdated: (transaction: FetchedTransaction) => Promise<void> | void
  onDeleted: (id: number) => Promise<void> | void
  onRestored: (transaction: FetchedTransaction) => Promise<void> | void
}

type TransactionDraft = {
  type: TransactionType
  amount: number
  categoryId: number | null
  walletId: number | null
  date: string
  notes: string
}

type FieldErrors = Partial<
  Record<'type' | 'amount' | 'categoryId' | 'walletId' | 'date' | 'notes', string>
>

function CategoryBadgeIcon({
  iconKey,
  size = 20,
}: {
  iconKey?: string
  size?: number
}) {
  const Icon = getIcon(iconKey ?? 'default')
  return <Icon size={size} strokeWidth={1.75} aria-hidden />
}

function createDraft(tx: FetchedTransaction): TransactionDraft {
  return {
    type: tx.type,
    amount: tx.amount,
    categoryId: tx.categoryId,
    walletId: tx.walletId,
    date: tx.date,
    notes: tx.notes ?? '',
  }
}

function formatFullDate(iso: string): string {
  const date = new Date(`${iso}T12:00:00+07:00`)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatDateTimeJakarta(iso: string): string | null {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function mapServerErrors(errors?: Record<string, string[]>): FieldErrors {
  if (!errors) return {}
  const mapped: FieldErrors = {}
  if (errors.type?.[0]) mapped.type = errors.type[0]
  if (errors.amount?.[0]) mapped.amount = errors.amount[0]
  if (errors.category_id?.[0]) mapped.categoryId = errors.category_id[0]
  if (errors.wallet_id?.[0]) mapped.walletId = errors.wallet_id[0]
  if (errors.transaction_date?.[0]) mapped.date = errors.transaction_date[0]
  if (errors.notes?.[0]) mapped.notes = errors.notes[0]
  return mapped
}

export function TransactionDetailPanel({
  transaction,
  wallets,
  categories,
  onClose,
  onUpdated,
  onDeleted,
  onRestored,
}: TransactionDetailPanelProps) {
  const { show } = useToast()
  const notesId = useId()
  const amountInputRef = useRef<HTMLInputElement>(null)

  const [trackedTxId, setTrackedTxId] = useState<number | null>(
    transaction?.id ?? null,
  )
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<TransactionDraft | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  const open = transaction != null
  const currentTxId = transaction?.id ?? null
  if (currentTxId !== trackedTxId) {
    setTrackedTxId(currentTxId)
    setIsEditing(false)
    setDraft(null)
    setFieldErrors({})
    setSubmitError(null)
    setSaving(false)
    setConfirmDeleteOpen(false)
  }

  const maxDate = useMemo(() => shiftJakartaDate(todayJakarta(), 1), [])
  const activeWallets = useMemo(
    () => wallets.filter((w) => w.isActive !== false),
    [wallets],
  )

  // Focus first editable input when entering edit mode
  useEffect(() => {
    if (!isEditing) return
    const frame = requestAnimationFrame(() => {
      amountInputRef.current?.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [isEditing])

  const handleCancelEdit = useCallback(() => {
    if (saving) return
    setIsEditing(false)
    setDraft(null)
    setFieldErrors({})
    setSubmitError(null)
  }, [saving])

  // Escape in edit mode returns to read-only before Sheet closes the drawer
  useEffect(() => {
    if (!open || !isEditing || confirmDeleteOpen) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      handleCancelEdit()
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [open, isEditing, confirmDeleteOpen, handleCancelEdit])

  const handleClosePanel = useCallback(() => {
    if (saving) return
    onClose()
  }, [saving, onClose])

  function enterEditMode() {
    if (!transaction) return
    setDraft(createDraft(transaction))
    setFieldErrors({})
    setSubmitError(null)
    setIsEditing(true)
  }

  function handleTypeChange(nextType: TransactionType) {
    setDraft((prev) => {
      if (!prev || prev.type === nextType) return prev
      const validCategories = categories.filter((c) => c.type === nextType)
      const currentStillValid =
        prev.categoryId != null &&
        validCategories.some((c) => c.id === prev.categoryId)
      return {
        ...prev,
        type: nextType,
        categoryId: currentStillValid
          ? prev.categoryId
          : (validCategories[0]?.id ?? null),
      }
    })
    setFieldErrors((prev) => ({ ...prev, type: undefined, categoryId: undefined }))
    setSubmitError(null)
  }

  const typedCategories = useMemo(() => {
    if (!draft) return []
    return categories.filter((c) => c.type === draft.type)
  }, [categories, draft])

  function validateDraft(d: TransactionDraft): FieldErrors {
    const errors: FieldErrors = {}
    if (!Number.isInteger(d.amount) || d.amount <= 0) {
      errors.amount = 'Nominal harus lebih dari Rp 0.'
    } else if (d.amount > MAX_AMOUNT) {
      errors.amount = 'Nominal terlalu besar.'
    }

    const validCats = categories.filter((c) => c.type === d.type)
    if (d.categoryId == null || !validCats.some((c) => c.id === d.categoryId)) {
      errors.categoryId = 'Pilih kategori yang sesuai dengan jenis transaksi.'
    }

    if (d.walletId == null) {
      errors.walletId = 'Dompet wajib dipilih.'
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date)) {
      errors.date = 'Tanggal transaksi wajib diisi.'
    } else if (d.date > maxDate) {
      errors.date = 'Tanggal tidak boleh lebih dari besok.'
    }

    if (d.notes.trim().length > MAX_NOTES_LENGTH) {
      errors.notes = `Catatan maksimal ${MAX_NOTES_LENGTH} karakter.`
    }

    return errors
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    if (!transaction || !draft || saving) return

    const errors = validateDraft(draft)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setSubmitError('Periksa kembali isian yang belum valid.')
      return
    }

    setSaving(true)
    setFieldErrors({})
    setSubmitError(null)

    try {
      const payload: Record<string, unknown> = {
        type: draft.type,
        amount: draft.amount,
        transaction_date: draft.date,
        notes: draft.notes.trim() || null,
      }

      // Send category_id and wallet_id (only omit if unchanged and inactive to avoid false rejection)
      const selectedWallet = wallets.find((w) => w.id === draft.walletId)
      if (
        draft.walletId !== transaction.walletId ||
        selectedWallet?.isActive !== false
      ) {
        payload.wallet_id = draft.walletId
      }
      payload.category_id = draft.categoryId

      const res = await api<{ data: ApiTransaction }>(
        `/transactions/${transaction.id}`,
        {
          method: 'PUT',
          body: JSON.stringify(payload),
        },
      )

      const updated = mapTransaction(res.data)
      await onUpdated(updated)
      setIsEditing(false)
      setDraft(null)
      show({
        message: 'Transaksi berhasil diperbarui',
        type: 'success',
      })
    } catch (err) {
      if (err instanceof ApiError) {
        const mapped = mapServerErrors(err.errors)
        if (Object.keys(mapped).length > 0) {
          setFieldErrors(mapped)
        }
        setSubmitError(err.message || 'Gagal memperbarui transaksi.')
      } else {
        setSubmitError('Terjadi kesalahan saat menyimpan perubahan.')
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleConfirmDelete() {
    if (!transaction) return
    const deletedTx = transaction
    const categoryName =
      deletedTx.category?.name ??
      categories.find((c) => c.id === deletedTx.categoryId)?.name ??
      (deletedTx.type === 'income' ? 'Pemasukan' : 'Pengeluaran')

    try {
      await api(`/transactions/${deletedTx.id}`, { method: 'DELETE' })
      setConfirmDeleteOpen(false)
      onClose()
      await onDeleted(deletedTx.id)

      show({
        message: 'Transaksi dihapus',
        description: `${categoryName} • ${formatRupiah(deletedTx.amount)}`,
        type: 'info',
        actionLabel: 'Urungkan',
        onAction: () => {
          void api<{ data: ApiTransaction }>(
            `/transactions/${deletedTx.id}/restore`,
            { method: 'POST' },
          )
            .then(async (res) => {
              const restored = mapTransaction(res.data)
              await onRestored(restored)
              show({
                message: 'Transaksi berhasil dipulihkan',
                type: 'success',
              })
            })
            .catch((err: unknown) => {
              show({
                message:
                  err instanceof ApiError
                    ? err.message
                    : 'Gagal memulihkan transaksi',
                type: 'error',
              })
            })
        },
      })
    } catch (err) {
      setConfirmDeleteOpen(false)
      show({
        message:
          err instanceof ApiError
            ? err.message
            : 'Gagal menghapus transaksi',
        type: 'error',
      })
    }
  }

  const resolvedCategory = transaction
    ? (categories.find((c) => c.id === transaction.categoryId) ??
      (transaction.category
        ? {
            id: transaction.category.id,
            name: transaction.category.name,
            type: transaction.type,
            iconKey: transaction.category.iconKey,
          }
        : null))
    : null

  const resolvedWallet = transaction
    ? (wallets.find((w) => w.id === transaction.walletId) ??
      transaction.wallet ??
      null)
    : null

  const createdAtLabel =
    transaction?.createdAt ? formatDateTimeJakarta(transaction.createdAt) : null

  return (
    <>
      <Sheet
        open={open}
        onClose={handleClosePanel}
        variant="drawer"
        title={isEditing ? 'Ubah Transaksi' : 'Detail Transaksi'}
      >
        {transaction && !isEditing && (
          <div className="flex flex-col gap-5">
            {/* Hero summary card */}
            <div className="rounded-[var(--radius-card)] border border-line/70 bg-muted/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'inline-flex size-11 shrink-0 items-center justify-center rounded-xl',
                      transaction.type === 'income'
                        ? 'bg-income-50 text-income-600 dark:bg-income-950/40 dark:text-income-400'
                        : 'bg-expense-50 text-expense-500 dark:bg-expense-950/40 dark:text-expense-400',
                    )}
                    aria-hidden
                  >
                    <CategoryBadgeIcon iconKey={resolvedCategory?.iconKey} size={20} />
                  </span>
                  <div className="min-w-0">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                        transaction.type === 'income'
                          ? 'bg-income-50 text-income-600 dark:bg-income-950/50 dark:text-income-400'
                          : 'bg-expense-50 text-expense-500 dark:bg-expense-950/50 dark:text-expense-400',
                      )}
                    >
                      {transaction.type === 'income' ? (
                        <TrendingUp size={12} strokeWidth={2.2} aria-hidden />
                      ) : (
                        <TrendingDown size={12} strokeWidth={2.2} aria-hidden />
                      )}
                      {transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                    </span>
                    <p className="mt-1 truncate text-sm font-medium text-ink">
                      {resolvedCategory?.name ?? 'Kategori'}
                    </p>
                  </div>
                </div>

                <IconButton
                  label="Ubah transaksi"
                  icon={<Pencil size={18} strokeWidth={1.9} aria-hidden />}
                  variant="ghost"
                  size="md"
                  onClick={enterEditMode}
                />
              </div>

              <div className="mt-4 border-t border-line/60 pt-3">
                <p className="text-xs text-ink-soft">Nominal</p>
                <MoneyText
                  amount={transaction.amount}
                  type={transaction.type}
                  className="mt-0.5 block text-2xl font-bold tracking-tight tabular-nums"
                />
              </div>
            </div>

            {/* Structured read-only details */}
            <dl className="divide-y divide-line/60 rounded-[var(--radius-card)] border border-line/70 bg-card px-4">
              <div className="flex items-center justify-between gap-4 py-3.5">
                <dt className="flex items-center gap-2 text-xs font-medium text-ink-soft">
                  <Tag size={15} strokeWidth={1.75} aria-hidden />
                  Kategori
                </dt>
                <dd className="text-right text-sm font-medium text-ink">
                  {resolvedCategory?.name ?? 'Tidak diketahui'}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-4 py-3.5">
                <dt className="flex items-center gap-2 text-xs font-medium text-ink-soft">
                  <WalletIconLucide size={15} strokeWidth={1.75} aria-hidden />
                  Dompet
                </dt>
                <dd className="text-right text-sm font-medium text-ink">
                  {resolvedWallet?.name ?? 'Tidak diketahui'}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-4 py-3.5">
                <dt className="flex items-center gap-2 text-xs font-medium text-ink-soft">
                  <Calendar size={15} strokeWidth={1.75} aria-hidden />
                  Tanggal
                </dt>
                <dd className="text-right text-sm font-medium text-ink">
                  {formatFullDate(transaction.date)}
                </dd>
              </div>

              <div className="flex flex-col gap-1.5 py-3.5">
                <dt className="flex items-center gap-2 text-xs font-medium text-ink-soft">
                  <FileText size={15} strokeWidth={1.75} aria-hidden />
                  Catatan
                </dt>
                <dd
                  className={cn(
                    'text-sm leading-relaxed break-words',
                    transaction.notes?.trim()
                      ? 'text-ink'
                      : 'italic text-ink-soft/75',
                  )}
                >
                  {transaction.notes?.trim() || 'Tidak ada catatan'}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-4 py-3.5">
                <dt className="flex items-center gap-2 text-xs font-medium text-ink-soft">
                  <Hash size={15} strokeWidth={1.75} aria-hidden />
                  ID Transaksi
                </dt>
                <dd className="text-right text-xs font-medium tabular-nums text-ink-soft">
                  #{transaction.id}
                </dd>
              </div>

              {createdAtLabel && (
                <div className="flex items-center justify-between gap-4 py-3.5">
                  <dt className="flex items-center gap-2 text-xs font-medium text-ink-soft">
                    <Clock size={15} strokeWidth={1.75} aria-hidden />
                    Dicatat pada
                  </dt>
                  <dd className="text-right text-xs font-medium tabular-nums text-ink-soft">
                    {createdAtLabel} WIB
                  </dd>
                </div>
              )}
            </dl>

            {/* Footer actions */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => setConfirmDeleteOpen(true)}
                className="text-danger-500 hover:bg-danger-100/50 hover:text-danger-700 dark:hover:bg-danger-950/30 dark:hover:text-danger-400"
              >
                <Trash2 size={16} strokeWidth={1.9} aria-hidden />
                Hapus
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={enterEditMode}
              >
                <Pencil size={16} strokeWidth={1.9} aria-hidden />
                Ubah
              </Button>
            </div>
          </div>
        )}

        {transaction && isEditing && draft && (
          <form onSubmit={(e) => void handleSave(e)} className="flex flex-col gap-4" noValidate>
            {submitError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-[var(--radius-control)] border border-danger-100 bg-danger-100/40 px-3.5 py-2.5 text-sm text-danger-700 dark:border-danger-700/40 dark:bg-danger-950/30 dark:text-danger-400"
              >
                <AlertCircle size={17} strokeWidth={2} className="mt-0.5 shrink-0" aria-hidden />
                <span>{submitError}</span>
              </div>
            )}

            {/* Type toggle */}
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink">Jenis transaksi</span>
              <div
                className="grid grid-cols-2 gap-1 rounded-[var(--radius-control)] bg-muted p-1"
                role="group"
                aria-label="Jenis transaksi"
              >
                <button
                  type="button"
                  aria-pressed={draft.type === 'expense'}
                  disabled={saving}
                  onClick={() => handleTypeChange('expense')}
                  className={cn(
                    'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[calc(var(--radius-control)-2px)] text-sm font-semibold transition duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                    draft.type === 'expense'
                      ? 'bg-expense-500 text-white shadow-sm'
                      : 'text-ink-soft hover:text-ink',
                  )}
                >
                  <TrendingDown size={15} strokeWidth={2} aria-hidden />
                  Pengeluaran
                </button>
                <button
                  type="button"
                  aria-pressed={draft.type === 'income'}
                  disabled={saving}
                  onClick={() => handleTypeChange('income')}
                  className={cn(
                    'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[calc(var(--radius-control)-2px)] text-sm font-semibold transition duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                    draft.type === 'income'
                      ? 'bg-income-500 text-white shadow-sm'
                      : 'text-ink-soft hover:text-ink',
                  )}
                >
                  <TrendingUp size={15} strokeWidth={2} aria-hidden />
                  Pemasukan
                </button>
              </div>
              {fieldErrors.type && (
                <p className="text-sm text-danger-500">{fieldErrors.type}</p>
              )}
            </div>

            {/* Amount */}
            <MoneyInput
              ref={amountInputRef}
              label="Nominal"
              value={draft.amount}
              disabled={saving}
              error={fieldErrors.amount}
              placeholder="0"
              onChange={(value) => {
                setDraft((prev) => (prev ? { ...prev, amount: value } : prev))
                setFieldErrors((prev) => ({ ...prev, amount: undefined }))
                setSubmitError(null)
              }}
            />

            {/* Category (strictly filtered by draft.type) */}
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink">Kategori</span>
              {typedCategories.length === 0 ? (
                <p className="rounded-[var(--radius-control)] border border-line bg-muted/40 px-3 py-2.5 text-xs text-ink-soft">
                  Belum ada kategori aktif untuk jenis{' '}
                  {draft.type === 'income' ? 'pemasukan' : 'pengeluaran'}.
                </p>
              ) : (
                <div
                  className="flex flex-wrap gap-2"
                  role="group"
                  aria-label="Pilih kategori"
                >
                  {typedCategories.map((cat) => {
                    const Icon = getIcon(cat.iconKey)
                    const selected = draft.categoryId === cat.id
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        disabled={saving}
                        aria-pressed={selected}
                        onClick={() => {
                          setDraft((prev) =>
                            prev ? { ...prev, categoryId: cat.id } : prev,
                          )
                          setFieldErrors((prev) => ({
                            ...prev,
                            categoryId: undefined,
                          }))
                          setSubmitError(null)
                        }}
                        className={cn(
                          'inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition duration-150',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 active:scale-[0.98]',
                          selected
                            ? 'border-brand-500 bg-brand-500 text-white shadow-sm'
                            : 'border-line bg-card text-ink hover:bg-muted',
                        )}
                      >
                        <Icon size={14} strokeWidth={1.9} aria-hidden />
                        {cat.name}
                      </button>
                    )
                  })}
                </div>
              )}
              {fieldErrors.categoryId && (
                <p className="text-sm text-danger-500">{fieldErrors.categoryId}</p>
              )}
            </div>

            {/* Wallet */}
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink">Dompet</span>
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="Pilih dompet"
              >
                {activeWallets.map((w) => {
                  const selected = draft.walletId === w.id
                  return (
                    <button
                      key={w.id}
                      type="button"
                      disabled={saving}
                      aria-pressed={selected}
                      onClick={() => {
                        setDraft((prev) =>
                          prev ? { ...prev, walletId: w.id } : prev,
                        )
                        setFieldErrors((prev) => ({
                          ...prev,
                          walletId: undefined,
                        }))
                        setSubmitError(null)
                      }}
                      className={cn(
                        'inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition duration-150',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 active:scale-[0.98]',
                        selected
                          ? 'border-brand-500 bg-brand-500 text-white shadow-sm'
                          : 'border-line bg-card text-ink hover:bg-muted',
                      )}
                    >
                      <WalletIconLucide size={14} strokeWidth={1.9} aria-hidden />
                      {w.name}
                    </button>
                  )
                })}
              </div>
              {fieldErrors.walletId && (
                <p className="text-sm text-danger-500">{fieldErrors.walletId}</p>
              )}
            </div>

            {/* Date */}
            <Input
              type="date"
              label="Tanggal"
              value={draft.date}
              max={maxDate}
              disabled={saving}
              error={fieldErrors.date}
              onChange={(e) => {
                const value = e.target.value
                setDraft((prev) => (prev ? { ...prev, date: value } : prev))
                setFieldErrors((prev) => ({ ...prev, date: undefined }))
                setSubmitError(null)
              }}
            />

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor={notesId} className="text-sm font-medium text-ink">
                  Catatan
                </label>
                <span className="text-xs tabular-nums text-ink-soft">
                  {draft.notes.length}/{MAX_NOTES_LENGTH}
                </span>
              </div>
              <textarea
                id={notesId}
                rows={3}
                maxLength={MAX_NOTES_LENGTH}
                disabled={saving}
                value={draft.notes}
                placeholder="Tambahkan catatan (opsional)"
                aria-invalid={fieldErrors.notes ? true : undefined}
                aria-describedby={
                  fieldErrors.notes ? `${notesId}-error` : undefined
                }
                onChange={(e) => {
                  const value = e.target.value
                  setDraft((prev) => (prev ? { ...prev, notes: value } : prev))
                  setFieldErrors((prev) => ({ ...prev, notes: undefined }))
                  setSubmitError(null)
                }}
                className={cn(
                  'w-full resize-none rounded-[var(--radius-control)] border border-line bg-card px-3 py-2.5 text-sm text-ink outline-none transition-shadow',
                  'focus:ring-2 focus:ring-brand-400',
                  fieldErrors.notes && 'border-danger-500 focus:ring-danger-500',
                )}
              />
              {fieldErrors.notes && (
                <p id={`${notesId}-error`} className="text-sm text-danger-500">
                  {fieldErrors.notes}
                </p>
              )}
            </div>

            {/* Form buttons */}
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                size="md"
                disabled={saving}
                onClick={handleCancelEdit}
              >
                Batal
              </Button>
              <Button type="submit" variant="primary" size="md" loading={saving}>
                Simpan
              </Button>
            </div>
          </form>
        )}
      </Sheet>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Hapus transaksi?"
        description={
          transaction
            ? `Transaksi ${resolvedCategory?.name ?? ''} sebesar ${formatRupiah(transaction.amount)} akan dihapus dari daftar. Anda masih bisa memulihkannya sesaat setelah dihapus.`
            : 'Transaksi ini akan dihapus.'
        }
        confirmLabel="Hapus"
        cancelLabel="Batal"
        variant="danger"
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}

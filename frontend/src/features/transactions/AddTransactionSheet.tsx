import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { Input } from '@/components/ui/Input'
import { Sheet } from '@/components/ui/Sheet'
import { useToast } from '@/components/ui/Toast'
import { CategoryPickerField } from '@/features/transactions/CategoryPickerField'
import { Keypad } from '@/features/transactions/Keypad'
import { cn } from '@/lib/cn'
import { getIcon } from '@/lib/icons'
import { formatRupiah } from '@/lib/money'
import { useStore } from '@/lib/store'
import type { TransactionType } from '@/types'

type AddTransactionSheetProps = {
  open: boolean
  onClose: () => void
  initialType?: TransactionType
  initialDate?: string
  initialWalletId?: number
  lockWallet?: boolean
  onSaved?: () => void
}

const LAST_CATEGORY_KEY = 'myduid:lastCategoryId'
const LAST_WALLET_KEY = 'myduid:lastWalletId'
const MAX_DIGITS = 12

function todayJakarta(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function readStoredId(key: string): number | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const n = Number(raw)
    return Number.isInteger(n) && n > 0 ? n : null
  } catch {
    return null
  }
}

function writeStoredId(key: string, id: number) {
  try {
    localStorage.setItem(key, String(id))
  } catch {
    // ignore quota / private mode
  }
}

function appendDigits(current: string, chunk: string): string {
  const merged = `${current}${chunk}`.replace(/^0+/, '')
  if (merged.length > MAX_DIGITS) return current
  return merged
}

export function AddTransactionSheet({
  open,
  onClose,
  initialType = 'expense',
  initialDate,
  initialWalletId,
  lockWallet = false,
  onSaved,
}: AddTransactionSheetProps) {
  const { wallets, categories, addTransaction, removeTransaction } = useStore()
  const { show } = useToast()
  const activeWallets = useMemo(
    () => wallets.filter((wallet) => wallet.isActive !== false),
    [wallets],
  )

  const [type, setType] = useState<TransactionType>(initialType)
  const [digits, setDigits] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [walletId, setWalletId] = useState<number | null>(null)
  const [date, setDate] = useState(() => initialDate ?? todayJakarta())
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const amount = digits === '' ? 0 : Number(digits)

  const wasOpenRef = useRef(false)

  useEffect(() => {
    const justOpened = open && !wasOpenRef.current
    wasOpenRef.current = open
    if (!justOpened) return

    setType(initialType)
    setDigits('')
    setDate(initialDate ?? todayJakarta())
    setNotes('')

    if (initialWalletId != null) {
      setWalletId(initialWalletId)
    } else {
      const lastWallet = readStoredId(LAST_WALLET_KEY)
      const wallet =
        activeWallets.find((w) => w.id === lastWallet) ?? activeWallets[0] ?? null
      setWalletId(wallet?.id ?? null)
    }

    const lastCategory = readStoredId(LAST_CATEGORY_KEY)
    const availableCats = categories.filter((c) => c.type === initialType)
    const category =
      availableCats.find((c) => c.id === lastCategory) ?? availableCats[0] ?? null
    setCategoryId(category?.id ?? null)
  }, [open, initialType, initialDate, initialWalletId, activeWallets, categories])

  useEffect(() => {
    const available = categories.filter((c) => c.type === type)
    if (available.length === 0) {
      setCategoryId(null)
      return
    }
    setCategoryId((prev) => {
      if (prev != null && available.some((c) => c.id === prev)) return prev
      const lastId = readStoredId(LAST_CATEGORY_KEY)
      const last = available.find((c) => c.id === lastId)
      return last?.id ?? available[0].id
    })
  }, [type, categories])

  function handleDigit(chunk: string) {
    setDigits((prev) => appendDigits(prev, chunk))
  }

  function handleBackspace() {
    setDigits((prev) => prev.slice(0, -1))
  }

  async function handleSave() {
    if (isSubmitting) return
    if (!Number.isInteger(amount) || amount <= 0) return
    if (categoryId == null || walletId == null) return

    setIsSubmitting(true)
    try {
      const selectedCategory = categories.find((c) => c.id === categoryId)
      const selectedWallet = activeWallets.find((w) => w.id === walletId)

      const tx = await addTransaction({
        walletId,
        categoryId,
        type,
        amount,
        date,
        notes: notes.trim() || undefined,
      })

      writeStoredId(LAST_CATEGORY_KEY, categoryId)
      writeStoredId(LAST_WALLET_KEY, walletId)
      onClose()
      onSaved?.()

      const detailText = `${selectedCategory?.name ?? (type === 'income' ? 'Pemasukan' : 'Pengeluaran')} • ${formatRupiah(amount)}${selectedWallet ? ` (${selectedWallet.name})` : ''}`

      show({
        message: 'Transaksi berhasil disimpan',
        description: detailText,
        type: 'success',
        actionLabel: 'Batalkan',
        onAction: () => {
          void removeTransaction(tx.id)
            .then(() =>
              show({
                message: 'Transaksi dibatalkan',
                type: 'info',
              }),
            )
            .catch((error: unknown) =>
              show({
                message:
                  error instanceof Error
                    ? error.message
                    : 'Transaksi gagal dibatalkan',
                type: 'error',
              }),
            )
        },
      })
    } catch (error) {
      show({
        message:
          error instanceof Error ? error.message : 'Transaksi gagal disimpan',
        type: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSave =
    !isSubmitting &&
    Number.isInteger(amount) &&
    amount > 0 &&
    categoryId != null &&
    walletId != null

  return (
    <Sheet open={open} onClose={onClose} title="Catat Transaksi">
      <div className="flex flex-col gap-4">
        <div
          className="grid grid-cols-2 gap-1 rounded-[var(--radius-control)] bg-muted p-1"
          role="group"
          aria-label="Jenis transaksi"
        >
          <button
            type="button"
            aria-pressed={type === 'expense'}
            onClick={() => setType('expense')}
            className={cn(
              'min-h-11 rounded-[calc(var(--radius-control)-2px)] text-sm font-semibold transition duration-200 active:scale-[0.98]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
              type === 'expense'
                ? 'bg-expense-500 text-white'
                : 'text-ink-soft',
            )}
          >
            Pengeluaran
          </button>
          <button
            type="button"
            aria-pressed={type === 'income'}
            onClick={() => setType('income')}
            className={cn(
              'min-h-11 rounded-[calc(var(--radius-control)-2px)] text-sm font-semibold transition duration-200 active:scale-[0.98]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
              type === 'income'
                ? 'bg-income-500 text-white'
                : 'text-ink-soft',
            )}
          >
            Pemasukan
          </button>
        </div>

        <p
          className={cn(
            'tabular text-center text-3xl font-bold',
            type === 'income' ? 'text-income-600' : 'text-expense-500',
          )}
          aria-live="polite"
        >
          {formatRupiah(amount)}
        </p>

        <CategoryPickerField
          type={type}
          categories={categories}
          value={categoryId}
          onChange={(id) => setCategoryId(id)}
        />

        {!lockWallet && (
          <div>
            <p className="mb-2 text-sm font-medium text-ink">Dompet</p>
            <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {activeWallets.map((wallet) => {
                const Icon = getIcon(wallet.iconKey)
                return (
                  <Chip
                    key={wallet.id}
                    selected={wallet.id === walletId}
                    onClick={() => setWalletId(wallet.id)}
                    icon={<Icon size={16} strokeWidth={1.75} aria-hidden />}
                    className="shrink-0"
                  >
                    {wallet.name}
                  </Chip>
                )
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Tanggal"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Input
            label="Catatan"
            type="text"
            placeholder="Opsional"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <Keypad onDigit={handleDigit} onBackspace={handleBackspace} />

        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!canSave}
          loading={isSubmitting}
          onClick={handleSave}
        >
          Simpan
        </Button>
      </div>
    </Sheet>
  )
}

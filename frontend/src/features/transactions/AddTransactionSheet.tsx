import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { Input } from '@/components/ui/Input'
import { Sheet } from '@/components/ui/Sheet'
import { useToast } from '@/components/ui/Toast'
import { Keypad } from '@/features/transactions/Keypad'
import { cn } from '@/lib/cn'
import { getIcon } from '@/lib/icons'
import { formatRupiah } from '@/lib/money'
import { useStore } from '@/lib/store'
import type { TransactionType } from '@/types'

type AddTransactionSheetProps = {
  open: boolean
  onClose: () => void
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
}: AddTransactionSheetProps) {
  const { wallets, categories, addTransaction, removeTransaction } = useStore()
  const { show } = useToast()

  const [type, setType] = useState<TransactionType>('expense')
  const [digits, setDigits] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [walletId, setWalletId] = useState<number | null>(null)
  const [date, setDate] = useState(todayJakarta)
  const [notes, setNotes] = useState('')

  const amount = digits === '' ? 0 : Number(digits)

  const typedCategories = useMemo(() => {
    const filtered = categories.filter((c) => c.type === type)
    const lastId = readStoredId(LAST_CATEGORY_KEY)
    if (lastId == null) return filtered
    const last = filtered.find((c) => c.id === lastId)
    if (!last) return filtered
    return [last, ...filtered.filter((c) => c.id !== lastId)]
  }, [categories, type])

  useEffect(() => {
    if (!open) return
    setType('expense')
    setDigits('')
    setDate(todayJakarta())
    setNotes('')

    const lastWallet = readStoredId(LAST_WALLET_KEY)
    const wallet =
      wallets.find((w) => w.id === lastWallet) ?? wallets[0] ?? null
    setWalletId(wallet?.id ?? null)

    const lastCategory = readStoredId(LAST_CATEGORY_KEY)
    const expenseCats = categories.filter((c) => c.type === 'expense')
    const category =
      expenseCats.find((c) => c.id === lastCategory) ?? expenseCats[0] ?? null
    setCategoryId(category?.id ?? null)
  }, [open, wallets, categories])

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

  function handleSave() {
    if (!Number.isInteger(amount) || amount <= 0) return
    if (categoryId == null || walletId == null) return

    const tx = addTransaction({
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

    show({
      message: 'Transaksi disimpan',
      actionLabel: 'Batalkan',
      onAction: () => {
        removeTransaction(tx.id)
        show({ message: 'Dibatalkan' })
      },
    })
  }

  const canSave =
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

        <div>
          <p className="mb-2 text-sm font-medium text-ink">Kategori</p>
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {typedCategories.map((category) => {
              const Icon = getIcon(category.iconKey)
              const selected = category.id === categoryId
              return (
                <Chip
                  key={category.id}
                  selected={selected}
                  onClick={() => setCategoryId(category.id)}
                  icon={<Icon size={16} strokeWidth={1.75} aria-hidden />}
                  className={cn(
                    'shrink-0',
                    selected &&
                      type === 'expense' &&
                      'bg-expense-500 text-white',
                    selected &&
                      type === 'income' &&
                      'bg-income-500 text-white',
                  )}
                >
                  {category.name}
                </Chip>
              )
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-ink">Dompet</p>
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {wallets.map((wallet) => {
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
          onClick={handleSave}
        >
          Simpan
        </Button>
      </div>
    </Sheet>
  )
}

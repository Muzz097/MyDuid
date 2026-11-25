import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { Input } from '@/components/ui/Input'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { Sheet } from '@/components/ui/Sheet'
import { useToast } from '@/components/ui/Toast'
import { ApiError, api } from '@/lib/api'
import { cn } from '@/lib/cn'
import { getIcon } from '@/lib/icons'
import { formatRupiah } from '@/lib/money'
import { useStore } from '@/lib/store'

type TransferSheetProps = {
  open: boolean
  onClose: () => void
  initialSourceWalletId?: number
  lockSourceWallet?: boolean
  onSaved?: () => void
}

type FieldErrors = Partial<
  Record<
    'source_wallet_id' | 'destination_wallet_id' | 'amount' | 'transfer_date' | 'notes',
    string
  >
>

function todayJakarta(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export function TransferSheet({
  open,
  onClose,
  initialSourceWalletId,
  lockSourceWallet = false,
  onSaved,
}: TransferSheetProps) {
  const { wallets, refresh } = useStore()
  const { show } = useToast()

  const activeWallets = useMemo(
    () => wallets.filter((wallet) => wallet.isActive !== false),
    [wallets],
  )

  const [sourceWalletId, setSourceWalletId] = useState<number | null>(null)
  const [destinationWalletId, setDestinationWalletId] = useState<number | null>(null)
  const [amount, setAmount] = useState(0)
  const [transferDate, setTransferDate] = useState(() => todayJakarta())
  const [notes, setNotes] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const wasOpenRef = useRef(false)

  useEffect(() => {
    const justOpened = open && !wasOpenRef.current
    wasOpenRef.current = open
    if (!justOpened) return

    const defaultSource =
      initialSourceWalletId != null
        ? initialSourceWalletId
        : (activeWallets[0]?.id ?? null)

    const defaultDest =
      activeWallets.find((w) => w.id !== defaultSource)?.id ?? null

    setSourceWalletId(defaultSource)
    setDestinationWalletId(defaultDest)
    setAmount(0)
    setTransferDate(todayJakarta())
    setNotes('')
    setFieldErrors({})
  }, [open, initialSourceWalletId, activeWallets])

  const destinationOptions = useMemo(
    () => activeWallets.filter((w) => w.id !== sourceWalletId),
    [activeWallets, sourceWalletId],
  )

  useEffect(() => {
    if (destinationOptions.length === 0) {
      setDestinationWalletId(null)
      return
    }
    setDestinationWalletId((prev) =>
      prev != null && destinationOptions.some((w) => w.id === prev)
        ? prev
        : destinationOptions[0].id,
    )
  }, [destinationOptions])

  const sourceWallet = useMemo(
    () => activeWallets.find((w) => w.id === sourceWalletId) ?? null,
    [activeWallets, sourceWalletId],
  )
  const destinationWallet = useMemo(
    () => activeWallets.find((w) => w.id === destinationWalletId) ?? null,
    [activeWallets, destinationWalletId],
  )

  const hasValidAmount = Number.isInteger(amount) && amount > 0
  const sourceAfter = sourceWallet ? sourceWallet.balance - amount : 0
  const destinationAfter = destinationWallet ? destinationWallet.balance + amount : 0
  const willBeNegative = sourceWallet != null && hasValidAmount && sourceAfter < 0

  const canSubmit =
    !isSubmitting &&
    sourceWalletId != null &&
    destinationWalletId != null &&
    sourceWalletId !== destinationWalletId &&
    hasValidAmount &&
    transferDate.trim().length > 0

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!canSubmit) return

    setIsSubmitting(true)
    setFieldErrors({})

    try {
      await api('/transfers', {
        method: 'POST',
        body: JSON.stringify({
          source_wallet_id: sourceWalletId,
          destination_wallet_id: destinationWalletId,
          amount,
          transfer_date: transferDate,
          notes: notes.trim() || null,
        }),
      })

      await refresh()
      show({ message: 'Dana berhasil dipindahkan', type: 'success' })
      onClose()
      onSaved?.()
    } catch (err) {
      if (err instanceof ApiError && err.status === 422 && err.errors) {
        const nextErrors: FieldErrors = {}
        for (const [key, messages] of Object.entries(err.errors)) {
          if (messages?.[0]) {
            nextErrors[key as keyof FieldErrors] = messages[0]
          }
        }
        setFieldErrors(nextErrors)
        show({
          message: err.message || 'Periksa kembali data transfer',
          type: 'error',
        })
      } else {
        const message = err instanceof Error ? err.message : 'Gagal memindahkan dana'
        show({ message, type: 'error' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Pindah dana">
      {activeWallets.length < 2 ? (
        <p className="rounded-[var(--radius-card)] border border-dashed border-line bg-muted/50 px-4 py-6 text-center text-sm text-ink-soft">
          Butuh minimal 2 dompet aktif untuk melakukan pindah dana.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 pb-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-ink">Dari dompet</label>
            {lockSourceWallet && sourceWallet ? (
              <div className="flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] border border-line bg-muted/60 px-3 py-2 text-sm font-medium text-ink">
                {(() => {
                  const Icon = getIcon(sourceWallet.iconKey)
                  return <Icon size={16} strokeWidth={1.8} aria-hidden />
                })()}
                <span className="truncate">{sourceWallet.name}</span>
                <span className="ml-auto text-xs tabular text-ink-soft">
                  {formatRupiah(sourceWallet.balance)}
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {activeWallets.map((wallet) => {
                  const Icon = getIcon(wallet.iconKey)
                  return (
                    <Chip
                      key={wallet.id}
                      selected={sourceWalletId === wallet.id}
                      onClick={() => setSourceWalletId(wallet.id)}
                      icon={<Icon size={15} strokeWidth={1.8} aria-hidden />}
                    >
                      {wallet.name}
                    </Chip>
                  )
                })}
              </div>
            )}
            {fieldErrors.source_wallet_id ? (
              <p className="text-sm text-danger-500">{fieldErrors.source_wallet_id}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-ink">Ke dompet</label>
            <div className="flex flex-wrap gap-2">
              {destinationOptions.map((wallet) => {
                const Icon = getIcon(wallet.iconKey)
                return (
                  <Chip
                    key={wallet.id}
                    selected={destinationWalletId === wallet.id}
                    onClick={() => setDestinationWalletId(wallet.id)}
                    icon={<Icon size={15} strokeWidth={1.8} aria-hidden />}
                  >
                    {wallet.name}
                  </Chip>
                )
              })}
            </div>
            {fieldErrors.destination_wallet_id ? (
              <p className="text-sm text-danger-500">
                {fieldErrors.destination_wallet_id}
              </p>
            ) : null}
          </div>

          <MoneyInput
            label="Nominal"
            value={amount}
            onChange={setAmount}
            placeholder="0"
            error={fieldErrors.amount}
          />

          {sourceWallet && destinationWallet && (
            <div
              aria-live="polite"
              className="space-y-2 rounded-[var(--radius-card)] border border-line bg-muted/50 p-3 text-xs transition-all duration-200 motion-reduce:transition-none"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-medium text-ink-soft">
                  {sourceWallet.name}
                </span>
                <span className="flex items-center gap-1.5 tabular">
                  <span className="text-ink-soft">
                    {formatRupiah(sourceWallet.balance)}
                  </span>
                  <ArrowRight size={12} className="text-ink-soft" aria-hidden />
                  <span
                    className={cn(
                      'font-semibold',
                      willBeNegative ? 'text-danger-500' : 'text-ink',
                    )}
                  >
                    {formatRupiah(sourceAfter)}
                  </span>
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-medium text-ink-soft">
                  {destinationWallet.name}
                </span>
                <span className="flex items-center gap-1.5 tabular">
                  <span className="text-ink-soft">
                    {formatRupiah(destinationWallet.balance)}
                  </span>
                  <ArrowRight size={12} className="text-ink-soft" aria-hidden />
                  <span className="font-semibold text-income-600 dark:text-income-400">
                    {formatRupiah(destinationAfter)}
                  </span>
                </span>
              </div>

              {willBeNegative ? (
                <p className="pt-0.5 text-xs font-medium text-danger-500">
                  Saldo dompet asal akan menjadi negatif setelah transfer.
                </p>
              ) : null}
            </div>
          )}

          <Input
            label="Tanggal"
            type="date"
            value={transferDate}
            onChange={(event) => setTransferDate(event.target.value)}
            error={fieldErrors.transfer_date}
            required
          />

          <Input
            label="Catatan (opsional)"
            type="text"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Misalnya: Tarik tunai ATM"
            error={fieldErrors.notes}
          />

          <div className="pt-1">
            <Button
              type="submit"
              fullWidth
              disabled={!canSubmit}
              loading={isSubmitting}
            >
              Pindahkan dana
            </Button>
          </div>
        </form>
      )}
    </Sheet>
  )
}

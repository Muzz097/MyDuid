import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { Sheet } from '@/components/ui/Sheet'
import { useToast } from '@/components/ui/Toast'
import { ApiError, api } from '@/lib/api'
import { cn } from '@/lib/cn'
import { getIcon, iconKeys } from '@/lib/icons'
import type { Wallet } from '@/types'

type WalletFormSheetProps = {
  open: boolean
  wallet: Wallet | null
  onClose: () => void
  onSaved: () => Promise<void>
}

type WalletInput = {
  name: string
  type: Wallet['type']
  icon_key: string
  opening_balance?: number
}

const supportedWalletIcons = iconKeys.filter((key) =>
  ['cash', 'bank', 'ewallet', 'default'].includes(key),
)

const walletTypes: Array<{ value: Wallet['type']; label: string }> = [
  { value: 'cash', label: 'Kas' },
  { value: 'bank', label: 'Bank' },
  { value: 'ewallet', label: 'E-wallet' },
]

export function WalletFormSheet({
  open,
  wallet,
  onClose,
  onSaved,
}: WalletFormSheetProps) {
  const { show } = useToast()
  const [name, setName] = useState('')
  const [type, setType] = useState<Wallet['type']>('cash')
  const [iconKey, setIconKey] = useState('cash')
  const [openingBalance, setOpeningBalance] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(wallet?.name ?? '')
    setType(wallet?.type ?? 'cash')
    setIconKey(wallet?.iconKey ?? 'cash')
    setOpeningBalance(0)
    setErrors({})
  }, [open, wallet])

  async function handleSave() {
    setErrors({})
    setSaving(true)

    const body: WalletInput = {
      name: name.trim(),
      type,
      icon_key: iconKey,
      ...(wallet ? {} : { opening_balance: openingBalance }),
    }

    try {
      if (wallet) {
        await api(`/wallets/${wallet.id}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        })
      } else {
        await api('/wallets', {
          method: 'POST',
          body: JSON.stringify(body),
        })
      }
      await onSaved()
      onClose()
      show({ message: wallet ? 'Dompet diperbarui' : 'Dompet ditambahkan' })
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        const fieldErrors = Object.fromEntries(
          Object.entries(error.errors ?? {}).map(([key, messages]) => [
            key,
            messages[0],
          ]),
        )
        setErrors(fieldErrors)
        if (Object.keys(fieldErrors).length === 0) {
          show({ message: error.message })
        }
      } else {
        show({
          message:
            error instanceof Error ? error.message : 'Dompet gagal disimpan',
        })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={wallet ? 'Ubah dompet' : 'Tambah dompet'}
    >
      <div className="space-y-4">
        <Input
          label="Nama dompet"
          value={name}
          maxLength={60}
          error={errors.name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Contoh: Tabungan"
        />

        <div>
          <p className="mb-2 text-sm font-medium text-ink">Jenis dompet</p>
          <div
            className="grid grid-cols-3 gap-1 rounded-[var(--radius-control)] bg-muted p-1"
            role="group"
            aria-label="Jenis dompet"
          >
            {walletTypes.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={type === option.value}
                onClick={() => setType(option.value)}
                className={cn(
                  'min-h-11 rounded-[calc(var(--radius-control)-2px)] px-2 text-sm font-medium transition duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                  type === option.value
                    ? 'bg-brand-500 text-white'
                    : 'text-ink-soft',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          {errors.type ? (
            <p className="mt-1.5 text-sm text-danger-500">{errors.type}</p>
          ) : null}
        </div>

        {!wallet ? (
          <MoneyInput
            label="Saldo awal"
            value={openingBalance}
            onChange={setOpeningBalance}
            error={errors.opening_balance}
          />
        ) : null}

        <div>
          <p className="mb-2 text-sm font-medium text-ink">Ikon</p>
          <div className="grid grid-cols-5 gap-2">
            {supportedWalletIcons.map((key) => {
              const Icon = getIcon(key)
              const selected = iconKey === key
              return (
                <button
                  key={key}
                  type="button"
                  aria-label={`Pilih ikon ${key}`}
                  aria-pressed={selected}
                  onClick={() => setIconKey(key)}
                  className={cn(
                    'inline-flex min-h-12 items-center justify-center rounded-[var(--radius-control)] border border-line bg-card text-ink-soft transition duration-200 hover:bg-muted active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                    selected && 'border-brand-500 text-brand-600 ring-2 ring-brand-400',
                  )}
                >
                  <Icon size={22} strokeWidth={1.75} aria-hidden />
                </button>
              )
            })}
            <div
              className="flex min-h-12 flex-col items-center justify-center rounded-[var(--radius-control)] border border-dashed border-line px-1 text-center text-[10px] leading-4 text-ink-soft"
              aria-disabled="true"
            >
              <span>Unggah sendiri</span>
              <span>Segera hadir</span>
            </div>
          </div>
          {errors.icon_key ? (
            <p className="mt-1.5 text-sm text-danger-500">{errors.icon_key}</p>
          ) : null}
        </div>

        <Button
          size="lg"
          fullWidth
          loading={saving}
          disabled={!name.trim()}
          onClick={() => void handleSave()}
        >
          Simpan dompet
        </Button>
      </div>
    </Sheet>
  )
}

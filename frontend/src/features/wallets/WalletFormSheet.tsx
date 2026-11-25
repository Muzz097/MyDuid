import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { Sheet } from '@/components/ui/Sheet'
import { useToast } from '@/components/ui/Toast'
import { WalletIcon } from '@/components/ui/WalletIcon'
import {
  isValidSingleEmoji,
  WALLET_CARD_THEMES,
  WALLET_GROUPS,
  WALLET_PRESET_ICONS,
  WALLET_TYPES,
} from '@/features/wallets/walletOptions'
import { ApiError, api } from '@/lib/api'
import { cn } from '@/lib/cn'
import type { Wallet, WalletCardTheme, WalletGroup, WalletIconType } from '@/types'

type WalletFormSheetProps = {
  open: boolean
  onClose: () => void
  onSaved: () => Promise<void>
}

type WalletCreatePayload = {
  name: string
  type: Wallet['type']
  group: WalletGroup
  card_theme: WalletCardTheme
  icon_type: WalletIconType
  icon_key: string
  opening_balance: number
}

export function WalletFormSheet({
  open,
  onClose,
  onSaved,
}: WalletFormSheetProps) {
  const { show } = useToast()
  const [name, setName] = useState('')
  const [type, setType] = useState<Wallet['type']>('cash')
  const [group, setGroup] = useState<WalletGroup>('daily')
  const [cardTheme, setCardTheme] = useState<WalletCardTheme>('default')
  const [iconType, setIconType] = useState<WalletIconType>('preset')
  const [iconKey, setIconKey] = useState('cash')
  const [emojiInput, setEmojiInput] = useState('')
  const [openingBalance, setOpeningBalance] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setName('')
    setType('cash')
    setGroup('daily')
    setCardTheme('default')
    setIconType('preset')
    setIconKey('cash')
    setEmojiInput('')
    setOpeningBalance(0)
    setErrors({})
  }, [open])

  function handleEmojiChange(value: string) {
    setEmojiInput(value)
    setIconType('emoji')
    setErrors((prev) => {
      if (!prev.icon_key) return prev
      const next = { ...prev }
      delete next.icon_key
      return next
    })
  }

  async function handleSave() {
    setErrors({})

    const trimmedEmoji = emojiInput.trim()
    if (iconType === 'emoji' && !isValidSingleEmoji(trimmedEmoji)) {
      setErrors({ icon_key: 'Masukkan tepat 1 karakter emoji.' })
      return
    }

    setSaving(true)

    const body: WalletCreatePayload = {
      name: name.trim(),
      type,
      group,
      card_theme: cardTheme,
      icon_type: iconType,
      icon_key: iconType === 'emoji' ? trimmedEmoji : iconKey,
      opening_balance: openingBalance,
    }

    try {
      await api('/wallets', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      await onSaved()
      onClose()
      show({ message: 'Dompet ditambahkan' })
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
    <Sheet open={open} onClose={onClose} title="Tambah dompet">
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
            {WALLET_TYPES.map((option) => (
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

        <div>
          <p className="mb-2 text-sm font-medium text-ink">Kelompok</p>
          <div
            className="grid grid-cols-3 gap-1 rounded-[var(--radius-control)] bg-muted p-1"
            role="group"
            aria-label="Kelompok dompet"
          >
            {WALLET_GROUPS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={group === option.value}
                onClick={() => setGroup(option.value)}
                className={cn(
                  'min-h-11 rounded-[calc(var(--radius-control)-2px)] px-2 text-sm font-medium transition duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                  group === option.value
                    ? 'bg-brand-500 text-white'
                    : 'text-ink-soft',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          {WALLET_GROUPS.map((option) =>
            group === option.value ? (
              <p key={option.value} className="mt-1.5 text-xs text-ink-soft">
                {option.description}
              </p>
            ) : null,
          )}
          {errors.group ? (
            <p className="mt-1.5 text-sm text-danger-500">{errors.group}</p>
          ) : null}
        </div>

        <MoneyInput
          label="Saldo awal"
          value={openingBalance}
          onChange={setOpeningBalance}
          error={errors.opening_balance}
        />

        <div>
          <p className="mb-2 text-sm font-medium text-ink">Tema kartu</p>
          <div
            className="grid grid-cols-6 gap-2"
            role="group"
            aria-label="Tema kartu"
          >
            {WALLET_CARD_THEMES.map((theme) => {
              const selected = cardTheme === theme.value
              return (
                <button
                  key={theme.value}
                  type="button"
                  aria-label={`Tema ${theme.label}`}
                  aria-pressed={selected}
                  onClick={() => setCardTheme(theme.value)}
                  className={cn(
                    'flex min-h-11 flex-col items-center justify-center gap-1 rounded-[var(--radius-control)] border border-line p-1.5 transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]',
                    selected && 'border-brand-500 ring-2 ring-brand-400',
                  )}
                >
                  <span
                    className={cn(
                      'size-6 rounded-full bg-gradient-to-br shadow-xs',
                      theme.gradientClass,
                    )}
                    aria-hidden="true"
                  />
                  <span className="text-[10px] font-medium text-ink-soft">
                    {theme.label}
                  </span>
                </button>
              )
            })}
          </div>
          {errors.card_theme ? (
            <p className="mt-1.5 text-sm text-danger-500">{errors.card_theme}</p>
          ) : null}
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-ink">Ikon</p>
          <div className="grid grid-cols-5 gap-2">
            {WALLET_PRESET_ICONS.map((key) => {
              const selected = iconType === 'preset' && iconKey === key
              return (
                <button
                  key={key}
                  type="button"
                  aria-label={`Pilih ikon ${key}`}
                  aria-pressed={selected}
                  onClick={() => {
                    setIconType('preset')
                    setIconKey(key)
                    setErrors((prev) => {
                      if (!prev.icon_key) return prev
                      const next = { ...prev }
                      delete next.icon_key
                      return next
                    })
                  }}
                  className={cn(
                    'inline-flex min-h-12 items-center justify-center rounded-[var(--radius-control)] border border-line bg-card text-ink-soft transition duration-200 hover:bg-muted active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                    selected && 'border-brand-500 text-brand-600 ring-2 ring-brand-400',
                  )}
                >
                  <WalletIcon iconType="preset" iconKey={key} size={22} strokeWidth={1.75} />
                </button>
              )
            })}
            <div className="flex flex-col items-center justify-center">
              <input
                type="text"
                aria-label="Ikon emoji (1 karakter)"
                value={emojiInput}
                onChange={(event) => handleEmojiChange(event.target.value)}
                onFocus={() => setIconType('emoji')}
                placeholder="💳"
                className={cn(
                  'min-h-12 w-full rounded-[var(--radius-control)] border border-line bg-card text-center text-xl text-ink transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                  iconType === 'emoji' && 'border-brand-500 ring-2 ring-brand-400',
                )}
              />
            </div>
          </div>
          <p className="mt-1.5 text-xs text-ink-soft">
            Pilih ikon bawaan atau ketik 1 emoji di kotak kanan.
          </p>
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

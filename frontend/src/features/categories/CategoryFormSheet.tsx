import { useEffect, useRef, useState, type FormEvent } from 'react'
import { AlertCircle, TrendingDown, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CategoryAvatar } from '@/components/ui/CategoryAvatar'
import { Input } from '@/components/ui/Input'
import { Sheet } from '@/components/ui/Sheet'
import { useToast } from '@/components/ui/Toast'
import { api, ApiError } from '@/lib/api'
import {
  CATEGORY_EMOJI_OPTIONS,
  getCategoryEmoji,
  setCategoryEmoji,
} from '@/lib/categoryVisuals'
import { cn } from '@/lib/cn'
import { getIcon } from '@/lib/icons'
import type { Category, TransactionType } from '@/types'

const MAX_NAME_LENGTH = 60

export const PRESET_CATEGORY_ICONS = [
  { key: 'food', label: 'Makanan' },
  { key: 'transport', label: 'Transportasi' },
  { key: 'shopping', label: 'Belanja' },
  { key: 'entertainment', label: 'Hiburan' },
  { key: 'salary', label: 'Gaji' },
  { key: 'bonus', label: 'Bonus' },
  { key: 'default', label: 'Lainnya' },
] as const

type CategoryFormSheetProps = {
  open: boolean
  category: Category | null
  defaultType?: TransactionType
  existingCategories: Category[]
  onClose: () => void
  onSaved: () => Promise<void> | void
}

type ApiCategoryResponse = {
  data: {
    id: number
    name: string
    type: TransactionType
    icon_key: string
    is_active: boolean
  }
}

export function CategoryFormSheet({
  open,
  category,
  defaultType = 'expense',
  existingCategories,
  onClose,
  onSaved,
}: CategoryFormSheetProps) {
  const { show } = useToast()
  const nameInputRef = useRef<HTMLInputElement>(null)
  const isEdit = category != null

  const [name, setName] = useState('')
  const [type, setType] = useState<TransactionType>(defaultType)
  const [iconKey, setIconKey] = useState<string>('default')
  const [emoji, setEmoji] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | undefined>(undefined)
  const [iconError, setIconError] = useState<string | undefined>(undefined)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (category) {
      setName(category.name)
      setType(category.type)
      setIconKey(category.iconKey || 'default')
      setEmoji(getCategoryEmoji(category.id))
    } else {
      setName('')
      setType(defaultType)
      setIconKey(defaultType === 'income' ? 'salary' : 'food')
      setEmoji(null)
    }
    setNameError(undefined)
    setIconError(undefined)
    setSubmitError(null)
    setSaving(false)

    const frame = requestAnimationFrame(() => {
      nameInputRef.current?.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [open, category, defaultType])

  function validate(): boolean {
    const trimmed = name.trim()
    if (!trimmed) {
      setNameError('Nama kategori wajib diisi.')
      return false
    }
    if (trimmed.length > MAX_NAME_LENGTH) {
      setNameError(`Nama kategori maksimal ${MAX_NAME_LENGTH} karakter.`)
      return false
    }
    const duplicate = existingCategories.some(
      (c) =>
        c.id !== category?.id &&
        c.type === type &&
        c.name.trim().toLowerCase() === trimmed.toLowerCase(),
    )
    if (duplicate) {
      setNameError('Nama kategori sudah digunakan untuk jenis ini.')
      return false
    }
    return true
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (saving) return
    setNameError(undefined)
    setIconError(undefined)
    setSubmitError(null)

    if (!validate()) return

    setSaving(true)
    const trimmedName = name.trim()

    try {
      if (isEdit && category) {
        await api<ApiCategoryResponse>(`/categories/${category.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: trimmedName,
            icon_key: iconKey,
          }),
        })
        setCategoryEmoji(category.id, emoji)
        await onSaved()
        onClose()
        show({
          message: 'Kategori berhasil diperbarui',
          type: 'success',
        })
      } else {
        const res = await api<ApiCategoryResponse>('/categories', {
          method: 'POST',
          body: JSON.stringify({
            name: trimmedName,
            type,
            icon_key: iconKey,
          }),
        })
        setCategoryEmoji(res.data.id, emoji)
        await onSaved()
        onClose()
        show({
          message: 'Kategori berhasil ditambahkan',
          type: 'success',
        })
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.errors?.name?.[0]) setNameError(err.errors.name[0])
        if (err.errors?.icon_key?.[0]) setIconError(err.errors.icon_key[0])
        setSubmitError(err.message || 'Gagal menyimpan kategori.')
      } else {
        setSubmitError('Terjadi kesalahan saat menyimpan kategori.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet
      open={open}
      onClose={() => {
        if (!saving) onClose()
      }}
      variant="drawer"
      title={isEdit ? 'Ubah Kategori' : 'Tambah Kategori'}
    >
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="flex flex-col gap-5 pb-2"
        noValidate
      >
        {submitError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-[var(--radius-control)] border border-danger-100 bg-danger-100/40 px-3.5 py-2.5 text-sm text-danger-700 dark:border-danger-700/40 dark:bg-danger-950/30 dark:text-danger-400"
          >
            <AlertCircle size={17} strokeWidth={2} className="mt-0.5 shrink-0" aria-hidden />
            <span>{submitError}</span>
          </div>
        )}

        {/* Live preview */}
        <div className="flex items-center gap-3.5 rounded-[var(--radius-card)] border border-line/70 bg-muted/35 p-4">
          <CategoryAvatar
            categoryId={category?.id}
            name={name.trim() || 'Kategori'}
            iconKey={iconKey}
            type={type}
            emojiOverride={emoji}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">
              {name.trim() || 'Nama kategori'}
            </p>
            <p className="text-xs text-ink-soft">
              {type === 'income' ? 'Kategori Pemasukan' : 'Kategori Pengeluaran'}
            </p>
          </div>
        </div>

        {/* Type */}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Jenis kategori</span>
          {isEdit ? (
            <div className="flex items-center justify-between rounded-[var(--radius-control)] border border-line bg-muted/40 px-3.5 py-2.5">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink">
                {type === 'income' ? (
                  <TrendingUp size={15} strokeWidth={2} className="text-income-600" aria-hidden />
                ) : (
                  <TrendingDown size={15} strokeWidth={2} className="text-expense-500" aria-hidden />
                )}
                {type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
              </span>
              <span className="text-xs text-ink-soft">Tidak dapat diubah</span>
            </div>
          ) : (
            <div
              className="grid grid-cols-2 gap-1 rounded-[var(--radius-control)] bg-muted p-1"
              role="group"
              aria-label="Jenis kategori"
            >
              <button
                type="button"
                aria-pressed={type === 'expense'}
                disabled={saving}
                onClick={() => {
                  setType('expense')
                  setNameError(undefined)
                  setSubmitError(null)
                }}
                className={cn(
                  'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[calc(var(--radius-control)-2px)] text-sm font-semibold transition duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                  type === 'expense'
                    ? 'bg-expense-500 text-white shadow-sm'
                    : 'text-ink-soft hover:text-ink',
                )}
              >
                <TrendingDown size={15} strokeWidth={2} aria-hidden />
                Pengeluaran
              </button>
              <button
                type="button"
                aria-pressed={type === 'income'}
                disabled={saving}
                onClick={() => {
                  setType('income')
                  setNameError(undefined)
                  setSubmitError(null)
                }}
                className={cn(
                  'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[calc(var(--radius-control)-2px)] text-sm font-semibold transition duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                  type === 'income'
                    ? 'bg-income-500 text-white shadow-sm'
                    : 'text-ink-soft hover:text-ink',
                )}
              >
                <TrendingUp size={15} strokeWidth={2} aria-hidden />
                Pemasukan
              </button>
            </div>
          )}
        </div>

        {/* Name */}
        <Input
          ref={nameInputRef}
          label="Nama kategori"
          value={name}
          maxLength={MAX_NAME_LENGTH}
          disabled={saving}
          error={nameError}
          placeholder="Contoh: Kopi & Jajan"
          onChange={(e) => {
            setName(e.target.value)
            setNameError(undefined)
            setSubmitError(null)
          }}
        />

        {/* Preset icon */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-ink">Ikon bawaan</span>
          <div
            className="grid grid-cols-2 gap-2 sm:grid-cols-3"
            role="group"
            aria-label="Pilih ikon bawaan"
          >
            {PRESET_CATEGORY_ICONS.map((preset) => {
              const Icon = getIcon(preset.key)
              const selected = iconKey === preset.key
              return (
                <button
                  key={preset.key}
                  type="button"
                  disabled={saving}
                  aria-pressed={selected}
                  onClick={() => {
                    setIconKey(preset.key)
                    setIconError(undefined)
                  }}
                  className={cn(
                    'flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] border px-3 py-2 text-xs font-medium transition duration-150',
                    'hover:bg-muted/50 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                    selected
                      ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300'
                      : 'border-line bg-card text-ink',
                  )}
                >
                  <Icon size={16} strokeWidth={1.85} aria-hidden />
                  <span className="truncate">{preset.label}</span>
                </button>
              )
            })}
          </div>
          {iconError && <p className="text-sm text-danger-500">{iconError}</p>}
        </div>

        {/* Optional local emoji picker */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-ink">
              Emoji kustom (opsional)
            </span>
            {emoji ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => setEmoji(null)}
                className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
              >
                Hapus emoji
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-1.5 rounded-[var(--radius-control)] border border-line/70 bg-muted/30 p-2.5">
            {CATEGORY_EMOJI_OPTIONS.map((item) => {
              const selected = emoji === item
              return (
                <button
                  key={item}
                  type="button"
                  disabled={saving}
                  aria-pressed={selected}
                  onClick={() => setEmoji(selected ? null : item)}
                  className={cn(
                    'inline-flex size-9 items-center justify-center rounded-lg text-lg transition duration-150 hover:bg-card active:scale-95',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                    selected && 'bg-card ring-2 ring-brand-400',
                  )}
                >
                  {item}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-ink-soft">
            Emoji disimpan secara lokal di browser perangkat ini sebagai tampilan kustom di atas ikon bawaan.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            size="md"
            disabled={saving}
            onClick={onClose}
          >
            Batal
          </Button>
          <Button type="submit" variant="primary" size="md" loading={saving}>
            {isEdit ? 'Simpan perubahan' : 'Simpan kategori'}
          </Button>
        </div>
      </form>
    </Sheet>
  )
}

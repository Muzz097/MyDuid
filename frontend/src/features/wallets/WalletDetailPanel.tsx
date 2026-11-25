import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { ArrowRightLeft, Eye, EyeOff, ImagePlus, Pencil, Plus, Receipt, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { Input } from '@/components/ui/Input'
import { MoneyText } from '@/components/ui/MoneyText'
import { Sheet } from '@/components/ui/Sheet'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { TransactionItem } from '@/components/ui/TransactionItem'
import { WalletCard } from '@/components/ui/WalletCard'
import { WalletIcon } from '@/components/ui/WalletIcon'
import { useAddTransaction } from '@/features/transactions/AddTransactionContext'
import { TransferSheet } from '@/features/wallets/TransferSheet'
import { useWalletDetail } from '@/features/wallets/useWalletDetail'
import { WalletGoalSection } from '@/features/wallets/WalletGoalSection'
import {
  isValidSingleEmoji,
  WALLET_CARD_THEMES,
  WALLET_GROUPS,
  WALLET_PRESET_ICONS,
  WALLET_TYPES,
} from '@/features/wallets/walletOptions'
import { api, ApiError } from '@/lib/api'
import { cn } from '@/lib/cn'
import { formatGroupLabel } from '@/lib/date'
import { useStore } from '@/lib/store'
import type {
  Wallet,
  WalletActivityItem,
  WalletActivityResponse,
  WalletCardTheme,
  WalletGroup,
  WalletIconType,
} from '@/types'

const SHEET_EXIT_MS = 250
const MAX_CARD_IMAGE_BYTES = 2 * 1024 * 1024
const ALLOWED_CARD_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

type ActivityGroup = {
  date: string
  items: WalletActivityItem[]
}

function groupActivityByDate(items: WalletActivityItem[]): ActivityGroup[] {
  const map = new Map<string, WalletActivityItem[]>()
  for (const item of items) {
    const list = map.get(item.date)
    if (list) list.push(item)
    else map.set(item.date, [item])
  }
  return [...map.entries()].map(([date, groupItems]) => ({
    date,
    items: groupItems,
  }))
}

type WalletDraft = {
  name: string
  type: Wallet['type']
  group: WalletGroup
  cardTheme: WalletCardTheme
  iconType: WalletIconType
  iconKey: string
  emojiInput: string
}

function createDraftFromWallet(wallet: Wallet): WalletDraft {
  const isEmoji = wallet.iconType === 'emoji'
  return {
    name: wallet.name,
    type: wallet.type,
    group: wallet.group,
    cardTheme: wallet.cardTheme ?? 'default',
    iconType: wallet.iconType ?? 'preset',
    iconKey: isEmoji ? 'cash' : (wallet.iconKey || 'cash'),
    emojiInput: isEmoji ? wallet.iconKey : '',
  }
}

export function WalletDetailPanel() {
  const { walletId, initialEdit, openWallet, closeWallet } = useWalletDetail()
  const { openAddTransaction } = useAddTransaction()
  const { wallets, loading, refresh, version } = useStore()
  const { show } = useToast()

  const [hiddenForId, setHiddenForId] = useState<number | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<WalletDraft | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [localImageSrc, setLocalImageSrc] = useState<string | null>(null)
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null)
  const [deleteImage, setDeleteImage] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [transferOpen, setTransferOpen] = useState(false)
  const [transferSourceId, setTransferSourceId] = useState<number | null>(null)

  const [activities, setActivities] = useState<WalletActivityItem[]>([])
  const [activityLoading, setActivityLoading] = useState(false)
  const [activityLoadingMore, setActivityLoadingMore] = useState(false)
  const [activityError, setActivityError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [activityRefreshKey, setActivityRefreshKey] = useState(0)

  const wallet = walletId == null ? null : (wallets.find((item) => item.id === walletId) ?? null)
  const open = walletId != null
  const balanceHidden = walletId != null && hiddenForId === walletId

  const fetchActivity = useCallback(async (id: number, page: number, append: boolean) => {
    if (append) {
      setActivityLoadingMore(true)
    } else {
      setActivityLoading(true)
    }
    setActivityError(null)
    try {
      const res = await api<WalletActivityResponse>(`/wallets/${id}/activity?page=${page}`)
      setActivities((prev) => (append ? [...prev, ...res.data] : res.data))
      setCurrentPage(res.meta.current_page)
      setLastPage(res.meta.last_page)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Gagal memuat riwayat dompet'
      setActivityError(message)
    } finally {
      setActivityLoading(false)
      setActivityLoadingMore(false)
    }
  }, [])

  // Revoke local object URL whenever it changes or component unmounts
  useEffect(() => {
    return () => {
      if (localImageSrc) {
        URL.revokeObjectURL(localImageSrc)
      }
    }
  }, [localImageSrc])

  useEffect(() => {
    if (walletId == null) {
      setActivities([])
      setActivityError(null)
      setCurrentPage(1)
      setLastPage(1)
      setIsEditing(false)
      setDraft(null)
      setErrors({})
      setLocalImageSrc(null)
      setPendingImageFile(null)
      setDeleteImage(false)
      setImageError(null)
      return
    }
    void fetchActivity(walletId, 1, false)
  }, [walletId, activityRefreshKey, fetchActivity])

  // Enter edit mode automatically if opened with ?ubah=1
  useEffect(() => {
    if (!open || !wallet || !initialEdit) return
    setDraft(createDraftFromWallet(wallet))
    setErrors({})
    setLocalImageSrc(null)
    setPendingImageFile(null)
    setDeleteImage(false)
    setImageError(null)
    setIsEditing(true)
  }, [open, wallet, initialEdit])

  // Move focus to first field when entering edit mode
  useEffect(() => {
    if (!isEditing) return
    const frame = requestAnimationFrame(() => {
      nameInputRef.current?.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [isEditing])

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false)
    setDraft(null)
    setErrors({})
    setLocalImageSrc(null)
    setPendingImageFile(null)
    setDeleteImage(false)
    setImageError(null)
  }, [])

  // Escape = Batal while in edit mode (intercept before Sheet closes the drawer)
  useEffect(() => {
    if (!open || !isEditing) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      handleCancelEdit()
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [open, isEditing, handleCancelEdit])

  function enterEditMode() {
    if (!wallet) return
    setDraft(createDraftFromWallet(wallet))
    setErrors({})
    setLocalImageSrc(null)
    setPendingImageFile(null)
    setDeleteImage(false)
    setImageError(null)
    setIsEditing(true)
  }

  function handleImageSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setImageError(null)

    if (!ALLOWED_CARD_IMAGE_TYPES.has(file.type)) {
      setImageError('Format yang didukung: JPG, PNG, dan WebP.')
      return
    }

    if (file.size > MAX_CARD_IMAGE_BYTES) {
      setImageError('Ukuran foto maksimal 2 MB.')
      return
    }

    setPendingImageFile(file)
    setDeleteImage(false)
    setLocalImageSrc(URL.createObjectURL(file))
  }

  function handleRemoveImage() {
    setImageError(null)
    setLocalImageSrc(null)
    setPendingImageFile(null)
    if (wallet?.hasCardImage) {
      setDeleteImage(true)
    } else {
      setDeleteImage(false)
    }
  }

  async function handleSaveEdit() {
    if (!wallet || !draft) return
    setErrors({})
    setImageError(null)

    const trimmedName = draft.name.trim()
    if (!trimmedName) {
      setErrors({ name: 'Nama dompet wajib diisi.' })
      return
    }

    const trimmedEmoji = draft.emojiInput.trim()
    if (draft.iconType === 'emoji' && !isValidSingleEmoji(trimmedEmoji)) {
      setErrors({ icon_key: 'Masukkan tepat 1 karakter emoji.' })
      return
    }

    setSaving(true)
    try {
      await api(`/wallets/${wallet.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: trimmedName,
          type: draft.type,
          group: draft.group,
          card_theme: draft.cardTheme,
          icon_type: draft.iconType,
          icon_key: draft.iconType === 'emoji' ? trimmedEmoji : draft.iconKey,
        }),
      })
    } catch (error) {
      setSaving(false)
      if (error instanceof ApiError && error.status === 422) {
        const fieldErrors = Object.fromEntries(
          Object.entries(error.errors ?? {}).map(([key, messages]) => [
            key,
            messages[0],
          ]),
        )
        setErrors(fieldErrors)
        if (Object.keys(fieldErrors).length === 0) {
          show({ message: error.message, type: 'error' })
        }
      } else {
        show({
          message:
            error instanceof Error ? error.message : 'Dompet gagal diperbarui',
          type: 'error',
        })
      }
      return
    }

    try {
      if (deleteImage && wallet.hasCardImage) {
        await api(`/wallets/${wallet.id}/card-image`, {
          method: 'DELETE',
        })
      } else if (pendingImageFile) {
        const formData = new FormData()
        formData.append('image', pendingImageFile)
        await api(`/wallets/${wallet.id}/card-image`, {
          method: 'POST',
          body: formData,
        })
      }

      await refresh()
      setIsEditing(false)
      setDraft(null)
      setErrors({})
      setLocalImageSrc(null)
      setPendingImageFile(null)
      setDeleteImage(false)
      setImageError(null)
      show({ message: 'Dompet diperbarui' })
    } catch (error) {
      await refresh()
      if (error instanceof ApiError) {
        const serverImageError = error.errors?.image?.[0] ?? error.message
        setImageError(serverImageError)
      } else {
        setImageError('Foto kartu gagal diproses.')
      }
    } finally {
      setSaving(false)
    }
  }

  function handleCatat() {
    if (walletId == null) return
    const id = walletId
    closeWallet({ replace: true })
    window.setTimeout(() => {
      openAddTransaction({
        walletId: id,
        lockWallet: true,
        onSaved: () => {
          setActivityRefreshKey((k) => k + 1)
          openWallet(id)
        },
      })
    }, prefersReducedMotion() ? 0 : SHEET_EXIT_MS)
  }

  function handleTransfer() {
    if (walletId == null) return
    const id = walletId
    setTransferSourceId(id)
    closeWallet({ replace: true })
    window.setTimeout(() => {
      setTransferOpen(true)
    }, prefersReducedMotion() ? 0 : SHEET_EXIT_MS)
  }

  const previewWallet: Wallet | null =
    wallet && isEditing && draft
      ? {
          ...wallet,
          name: draft.name.trim() || wallet.name,
          type: draft.type,
          group: draft.group,
          cardTheme: draft.cardTheme,
          iconType: draft.iconType,
          iconKey:
            draft.iconType === 'emoji'
              ? (draft.emojiInput.trim() || wallet.iconKey)
              : draft.iconKey,
        }
      : wallet

  const previewImageSrc = isEditing
    ? localImageSrc
      ? localImageSrc
      : deleteImage
        ? null
        : undefined
    : undefined

  const hasPreviewPhoto = isEditing
    ? Boolean(localImageSrc) || (Boolean(wallet?.hasCardImage) && !deleteImage)
    : false

  return (
    <>
      <Sheet
        open={open}
        onClose={() => closeWallet()}
        title={isEditing ? 'Ubah dompet' : 'Detail dompet'}
        variant="drawer"
      >
        {loading && !wallet ? (
          <Skeleton className="h-36 w-full" rounded="card" />
        ) : !previewWallet || !wallet ? (
          <p className="text-sm text-ink-soft">Dompet tidak ditemukan.</p>
        ) : (
          <div className="space-y-5">
            <div className="overflow-x-auto">
              <WalletCard
                wallet={previewWallet}
                size="compact"
                hidden={balanceHidden}
                imageSrc={previewImageSrc}
                imageVersion={version}
                action={
                  <IconButton
                    label={balanceHidden ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
                    variant="ghost"
                    onClick={() =>
                      setHiddenForId((current) =>
                        current === wallet.id ? null : wallet.id,
                      )
                    }
                    className="border border-white/25 bg-black/20 text-white hover:bg-black/35 hover:text-white"
                    icon={
                      balanceHidden ? (
                        <Eye size={18} strokeWidth={1.75} aria-hidden />
                      ) : (
                        <EyeOff size={18} strokeWidth={1.75} aria-hidden />
                      )
                    }
                  />
                }
              />
            </div>

            {!isEditing ? (
              <div
                role="group"
                aria-label="Aksi dompet"
                className="grid grid-cols-3 divide-x divide-line overflow-hidden rounded-[var(--radius-card)] bg-muted"
              >
                <button
                  type="button"
                  onClick={handleCatat}
                  className="group flex min-h-11 flex-col items-center justify-center gap-1.5 px-2 py-3 text-center transition duration-150 hover:bg-brand-50/70 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--focus-ring)] motion-reduce:transform-none motion-reduce:transition-none dark:hover:bg-brand-900/20"
                >
                  <span className="inline-flex size-9 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm transition-transform duration-150 group-hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none">
                    <Plus size={18} strokeWidth={2} aria-hidden />
                  </span>
                  <span className="text-xs font-semibold text-brand-700 dark:text-brand-300">
                    Catat
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleTransfer}
                  className="group flex min-h-11 flex-col items-center justify-center gap-1.5 px-2 py-3 text-center transition duration-150 hover:bg-card/70 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--focus-ring)] motion-reduce:transform-none motion-reduce:transition-none"
                >
                  <span className="inline-flex size-9 items-center justify-center rounded-full border border-line bg-card text-ink transition-transform duration-150 group-hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none">
                    <ArrowRightLeft size={17} strokeWidth={1.8} aria-hidden />
                  </span>
                  <span className="text-xs font-medium text-ink">
                    Pindah dana
                  </span>
                </button>

                <button
                  type="button"
                  onClick={enterEditMode}
                  className="group flex min-h-11 flex-col items-center justify-center gap-1.5 px-2 py-3 text-center transition duration-150 hover:bg-card/70 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--focus-ring)] motion-reduce:transform-none motion-reduce:transition-none"
                >
                  <span className="inline-flex size-9 items-center justify-center rounded-full border border-line bg-card text-ink transition-transform duration-150 group-hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none">
                    <Pencil size={17} strokeWidth={1.8} aria-hidden />
                  </span>
                  <span className="text-xs font-medium text-ink">
                    Ubah
                  </span>
                </button>
              </div>
            ) : null}

            {isEditing && draft ? (
              <section
                key="edit-form"
                aria-label="Ubah dompet"
                className="animate-fade-in space-y-4 motion-reduce:animate-none"
              >
                <Input
                  ref={nameInputRef}
                  label="Nama dompet"
                  value={draft.name}
                  maxLength={60}
                  error={errors.name}
                  onChange={(event) =>
                    setDraft((prev) =>
                      prev ? { ...prev, name: event.target.value } : prev,
                    )
                  }
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
                        aria-pressed={draft.type === option.value}
                        onClick={() =>
                          setDraft((prev) =>
                            prev ? { ...prev, type: option.value } : prev,
                          )
                        }
                        className={cn(
                          'min-h-11 rounded-[calc(var(--radius-control)-2px)] px-2 text-sm font-medium transition duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]',
                          draft.type === option.value
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
                        aria-pressed={draft.group === option.value}
                        onClick={() =>
                          setDraft((prev) =>
                            prev ? { ...prev, group: option.value } : prev,
                          )
                        }
                        className={cn(
                          'min-h-11 rounded-[calc(var(--radius-control)-2px)] px-2 text-sm font-medium transition duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]',
                          draft.group === option.value
                            ? 'bg-brand-500 text-white'
                            : 'text-ink-soft',
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {WALLET_GROUPS.map((option) =>
                    draft.group === option.value ? (
                      <p key={option.value} className="mt-1.5 text-xs text-ink-soft">
                        {option.description}
                      </p>
                    ) : null,
                  )}
                  {errors.group ? (
                    <p className="mt-1.5 text-sm text-danger-500">{errors.group}</p>
                  ) : null}
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium text-ink">Tema kartu</p>
                  <div
                    className="grid grid-cols-6 gap-2"
                    role="group"
                    aria-label="Tema kartu"
                  >
                    {WALLET_CARD_THEMES.map((theme) => {
                      const selected = draft.cardTheme === theme.value
                      return (
                        <button
                          key={theme.value}
                          type="button"
                          aria-label={`Tema ${theme.label}`}
                          aria-pressed={selected}
                          onClick={() =>
                            setDraft((prev) =>
                              prev ? { ...prev, cardTheme: theme.value } : prev,
                            )
                          }
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
                      const selected =
                        draft.iconType === 'preset' && draft.iconKey === key
                      return (
                        <button
                          key={key}
                          type="button"
                          aria-label={`Pilih ikon ${key}`}
                          aria-pressed={selected}
                          onClick={() => {
                            setDraft((prev) =>
                              prev
                                ? { ...prev, iconType: 'preset', iconKey: key }
                                : prev,
                            )
                            setErrors((prev) => {
                              if (!prev.icon_key) return prev
                              const next = { ...prev }
                              delete next.icon_key
                              return next
                            })
                          }}
                          className={cn(
                            'inline-flex min-h-12 items-center justify-center rounded-[var(--radius-control)] border border-line bg-card text-ink-soft transition duration-200 hover:bg-muted active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]',
                            selected &&
                              'border-brand-500 text-brand-600 ring-2 ring-brand-400',
                          )}
                        >
                          <WalletIcon
                            iconType="preset"
                            iconKey={key}
                            size={22}
                            strokeWidth={1.75}
                          />
                        </button>
                      )
                    })}
                    <input
                      type="text"
                      aria-label="Ikon emoji (1 karakter)"
                      value={draft.emojiInput}
                      onFocus={() =>
                        setDraft((prev) =>
                          prev ? { ...prev, iconType: 'emoji' } : prev,
                        )
                      }
                      onChange={(event) => {
                        const value = event.target.value
                        setDraft((prev) =>
                          prev
                            ? { ...prev, iconType: 'emoji', emojiInput: value }
                            : prev,
                        )
                        setErrors((prev) => {
                          if (!prev.icon_key) return prev
                          const next = { ...prev }
                          delete next.icon_key
                          return next
                        })
                      }}
                      placeholder="💳"
                      className={cn(
                        'min-h-12 w-full rounded-[var(--radius-control)] border border-line bg-card text-center text-xl text-ink transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]',
                        draft.iconType === 'emoji' &&
                          'border-brand-500 ring-2 ring-brand-400',
                      )}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-ink-soft">
                    Pilih ikon bawaan atau ketik 1 emoji di kotak kanan.
                  </p>
                  {errors.icon_key ? (
                    <p className="mt-1.5 text-sm text-danger-500">{errors.icon_key}</p>
                  ) : null}
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium text-ink">Foto kartu</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageSelect}
                    className="sr-only"
                    aria-label="Pilih file foto kartu"
                  />
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="md"
                      disabled={saving}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImagePlus size={16} strokeWidth={1.75} aria-hidden />
                      {hasPreviewPhoto ? 'Ganti foto' : 'Pilih foto'}
                    </Button>
                    {hasPreviewPhoto ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="md"
                        disabled={saving}
                        onClick={handleRemoveImage}
                        className="text-danger-500 hover:bg-danger-500/10 hover:text-danger-500"
                      >
                        <Trash2 size={16} strokeWidth={1.75} aria-hidden />
                        Hapus foto
                      </Button>
                    ) : null}
                  </div>
                  <p className="mt-1.5 text-xs text-ink-soft">
                    Format JPG, PNG, atau WebP. Maksimal 2 MB (min. 300×300 piksel).
                    {pendingImageFile ? ` Dipilih: ${pendingImageFile.name}` : ''}
                  </p>
                  {imageError ? (
                    <p className="mt-1.5 text-sm text-danger-500" role="alert">
                      {imageError}
                    </p>
                  ) : null}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <Button
                    variant="outline"
                    size="lg"
                    fullWidth
                    disabled={saving}
                    onClick={handleCancelEdit}
                  >
                    Batal
                  </Button>
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={saving}
                    disabled={!draft.name.trim()}
                    onClick={() => void handleSaveEdit()}
                  >
                    Simpan
                  </Button>
                </div>
              </section>
            ) : (
              <>
                {wallet.group === 'savings' ? (
                  <WalletGoalSection wallet={wallet} onChanged={refresh} />
                ) : null}
                <section
                  key="history-view"
                  aria-label="Riwayat dompet"
                  className="animate-fade-in space-y-3 motion-reduce:animate-none"
                >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-ink">Riwayat</h3>
                </div>

                {activityLoading ? (
                  <div className="space-y-2.5" aria-label="Memuat riwayat dompet">
                    <Skeleton className="h-14 w-full" rounded="card" />
                    <Skeleton className="h-14 w-full" rounded="card" />
                    <Skeleton className="h-14 w-full" rounded="card" />
                  </div>
                ) : activityError ? (
                  <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-line bg-muted/40 px-4 py-6 text-center">
                    <p className="text-sm text-ink-soft">{activityError}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void fetchActivity(wallet.id, 1, false)}
                    >
                      Coba lagi
                    </Button>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-line bg-muted/50 px-4 py-8 text-center">
                    <span className="inline-flex size-11 items-center justify-center rounded-full bg-muted text-ink-soft">
                      <Receipt size={20} strokeWidth={1.75} aria-hidden />
                    </span>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-ink">Belum ada aktivitas</p>
                      <p className="text-xs text-ink-soft">
                        Catat pemasukan atau pengeluaran untuk dompet ini.
                      </p>
                    </div>
                    <Button size="sm" variant="primary" onClick={handleCatat}>
                      Catat
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {groupActivityByDate(activities).map((group) => (
                      <div key={group.date} className="space-y-1.5">
                        <h4 className="px-1 text-xs font-semibold uppercase tracking-wider text-ink-soft">
                          {formatGroupLabel(group.date)}
                        </h4>
                        <div className="divide-y divide-line rounded-[var(--radius-card)] border border-line bg-card px-3">
                          {group.items.map((item) => {
                            if (item.kind === 'transaction') {
                              return (
                                <TransactionItem
                                  key={`tx-${item.id}`}
                                  compact
                                  hidden={balanceHidden}
                                  transaction={{
                                    id: item.id,
                                    walletId: wallet.id,
                                    categoryId: item.category?.id ?? 0,
                                    type: item.type,
                                    amount: item.amount,
                                    date: item.date,
                                    notes: item.notes ?? undefined,
                                  }}
                                  category={
                                    item.category
                                      ? {
                                          id: item.category.id,
                                          name: item.category.name,
                                          type: item.type,
                                          iconKey: item.category.icon_key,
                                        }
                                      : null
                                  }
                                  wallet={wallet}
                                />
                              )
                            }

                            const isIncoming = item.direction === 'in'
                            const counterpartyName = item.counterparty_wallet?.name ?? 'Dompet lain'
                            const label = isIncoming
                              ? `Masuk dari ${counterpartyName}`
                              : `Keluar ke ${counterpartyName}`

                            return (
                              <div
                                key={`tr-${item.id}`}
                                className="flex min-h-12 items-center gap-3 py-2.5"
                              >
                                <span
                                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-ink-soft"
                                  aria-hidden
                                >
                                  <ArrowRightLeft size={18} strokeWidth={1.75} />
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-ink tracking-tight">
                                    {label}
                                  </p>
                                  {item.notes?.trim() ? (
                                    <p className="truncate text-xs text-ink-soft">
                                      {item.notes}
                                    </p>
                                  ) : null}
                                </div>
                                <div className="flex shrink-0 items-center gap-1">
                                  <span className="text-xs font-medium text-ink-soft" aria-hidden>
                                    {isIncoming ? '←' : '→'}
                                  </span>
                                  <MoneyText
                                    amount={item.amount}
                                    type="neutral"
                                    className="text-sm font-semibold tabular-nums"
                                    hidden={balanceHidden}
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}

                    {currentPage < lastPage ? (
                      <Button
                        variant="outline"
                        size="sm"
                        fullWidth
                        loading={activityLoadingMore}
                        onClick={() => void fetchActivity(wallet.id, currentPage + 1, true)}
                      >
                        Muat lagi
                      </Button>
                    ) : null}
                  </div>
                )}
              </section>
              </>
            )}
          </div>
        )}
      </Sheet>

      <TransferSheet
        open={transferOpen}
        initialSourceWalletId={transferSourceId ?? undefined}
        lockSourceWallet
        onClose={() => setTransferOpen(false)}
        onSaved={() => {
          setTransferOpen(false)
          setActivityRefreshKey((k) => k + 1)
          if (transferSourceId != null) {
            openWallet(transferSourceId)
          }
        }}
      />
    </>
  )
}

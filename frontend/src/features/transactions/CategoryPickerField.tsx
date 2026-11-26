import { useMemo, useState } from 'react'
import { Check, ChevronRight, Search, Smile, X } from 'lucide-react'
import { CategoryAvatar } from '@/components/ui/CategoryAvatar'
import { Sheet } from '@/components/ui/Sheet'
import {
  CATEGORY_EMOJI_OPTIONS,
  getCategoryDescription,
  getCategoryEmoji,
  setCategoryEmoji,
} from '@/lib/categoryVisuals'
import { cn } from '@/lib/cn'
import type { Category, TransactionType } from '@/types'

type CategoryPickerFieldProps = {
  label?: string
  type: TransactionType
  categories: Category[]
  value: number | null
  onChange: (categoryId: number) => void
  disabled?: boolean
  error?: string
  className?: string
}

export function CategoryPickerField({
  label = 'Kategori',
  type,
  categories,
  value,
  onChange,
  disabled = false,
  error,
  className,
}: CategoryPickerFieldProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [editingEmojiForId, setEditingEmojiForId] = useState<number | null>(null)
  const [emojiVersion, setEmojiVersion] = useState(0)

  const typedCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type],
  )

  const selectedCategory = useMemo(
    () => typedCategories.find((c) => c.id === value) ?? null,
    [typedCategories, value],
  )

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return typedCategories
    return typedCategories.filter((c) => {
      const desc = getCategoryDescription(c.iconKey, c.name).toLowerCase()
      return c.name.toLowerCase().includes(q) || desc.includes(q)
    })
  }, [typedCategories, search])

  function handleOpen() {
    if (disabled) return
    setSearch('')
    setEditingEmojiForId(null)
    setOpen(true)
  }

  function handleSelect(categoryId: number) {
    onChange(categoryId)
    setOpen(false)
  }

  function handlePickEmoji(categoryId: number, emoji: string | null) {
    setCategoryEmoji(categoryId, emoji)
    setEmojiVersion((v) => v + 1)
    setEditingEmojiForId(null)
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label ? (
        <span className="text-sm font-medium text-ink">{label}</span>
      ) : null}

      <button
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={error ? true : undefined}
        onClick={handleOpen}
        className={cn(
          'flex min-h-14 w-full items-center gap-3 rounded-[var(--radius-control)] border border-line bg-card px-3 py-2 text-left transition duration-150',
          'hover:bg-muted/40 active:scale-[0.995] motion-reduce:transition-none motion-reduce:active:scale-100',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
          disabled && 'cursor-not-allowed opacity-60',
          error && 'border-danger-500 focus-visible:ring-danger-500',
        )}
      >
        {selectedCategory ? (
          <>
            <CategoryAvatar
              key={`${selectedCategory.id}-${emojiVersion}`}
              categoryId={selectedCategory.id}
              name={selectedCategory.name}
              iconKey={selectedCategory.iconKey}
              type={type}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">
                {selectedCategory.name}
              </p>
              <p className="truncate text-xs text-ink-soft">
                {getCategoryDescription(
                  selectedCategory.iconKey,
                  selectedCategory.name,
                )}
              </p>
            </div>
          </>
        ) : (
          <div className="min-w-0 flex-1 py-1">
            <p className="text-sm text-ink-soft">Pilih kategori</p>
          </div>
        )}

        <ChevronRight
          size={18}
          strokeWidth={1.9}
          className="shrink-0 text-ink-soft"
          aria-hidden
        />
      </button>

      {error ? <p className="text-sm text-danger-500">{error}</p> : null}

      <Sheet open={open} onClose={() => setOpen(false)} title="Kategori">
        <div className="flex flex-col gap-3">
          {/* Search input */}
          <div className="relative flex items-center">
            <Search
              size={16}
              strokeWidth={2}
              className="pointer-events-none absolute left-3.5 text-ink-soft"
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kategori..."
              aria-label="Cari kategori"
              className={cn(
                'min-h-11 w-full rounded-full border border-line bg-muted/60 pl-10 pr-9 text-sm text-ink placeholder:text-ink-soft outline-none transition-shadow',
                'focus:border-brand-400 focus:bg-card focus:ring-2 focus:ring-brand-400/40',
              )}
            />
            {search ? (
              <button
                type="button"
                aria-label="Hapus pencarian"
                onClick={() => setSearch('')}
                className="absolute right-2.5 inline-flex size-7 items-center justify-center rounded-full text-ink-soft hover:bg-muted hover:text-ink"
              >
                <X size={14} strokeWidth={2} aria-hidden />
              </button>
            ) : null}
          </div>

          {/* Category list */}
          {filteredCategories.length === 0 ? (
            <div className="rounded-[var(--radius-card)] border border-line/60 bg-muted/30 px-4 py-8 text-center">
              <p className="text-sm font-medium text-ink">
                Kategori tidak ditemukan
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                Coba kata kunci lain untuk mencari kategori{' '}
                {type === 'income' ? 'pemasukan' : 'pengeluaran'}.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-line/60">
              {filteredCategories.map((cat) => {
                const selected = cat.id === value
                const currentEmoji = getCategoryEmoji(cat.id)
                const isEditingEmoji = editingEmojiForId === cat.id

                return (
                  <div key={cat.id} className="py-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelect(cat.id)}
                        aria-pressed={selected}
                        className={cn(
                          'flex min-h-14 flex-1 items-center gap-3 rounded-[var(--radius-control)] px-2 py-2 text-left transition duration-150',
                          'hover:bg-muted/50 active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                          selected && 'bg-brand-50/70 dark:bg-brand-950/30',
                        )}
                      >
                        <CategoryAvatar
                          key={`${cat.id}-${emojiVersion}`}
                          categoryId={cat.id}
                          name={cat.name}
                          iconKey={cat.iconKey}
                          type={type}
                          size="lg"
                        />

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink">
                            {cat.name}
                          </p>
                          <p className="truncate text-xs text-ink-soft">
                            {getCategoryDescription(cat.iconKey, cat.name)}
                          </p>
                        </div>

                        {selected ? (
                          <span
                            className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white shadow-sm"
                            aria-label="Dipilih"
                          >
                            <Check size={14} strokeWidth={2.5} aria-hidden />
                          </span>
                        ) : null}
                      </button>

                      <button
                        type="button"
                        aria-label={`Atur emoji untuk ${cat.name}`}
                        aria-expanded={isEditingEmoji}
                        onClick={() =>
                          setEditingEmojiForId((prev) =>
                            prev === cat.id ? null : cat.id,
                          )
                        }
                        className={cn(
                          'inline-flex size-9 shrink-0 items-center justify-center rounded-full text-ink-soft transition duration-150',
                          'hover:bg-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                          isEditingEmoji && 'bg-muted text-brand-600',
                        )}
                      >
                        <Smile size={16} strokeWidth={1.9} aria-hidden />
                      </button>
                    </div>

                    {isEditingEmoji ? (
                      <div className="mt-1.5 mb-2 rounded-[var(--radius-control)] border border-line/70 bg-muted/40 p-2.5">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-medium text-ink-soft">
                            Pilih emoji untuk {cat.name}
                          </span>
                          {currentEmoji ? (
                            <button
                              type="button"
                              onClick={() => handlePickEmoji(cat.id, null)}
                              className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
                            >
                              Reset ikon
                            </button>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {CATEGORY_EMOJI_OPTIONS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => handlePickEmoji(cat.id, emoji)}
                              className={cn(
                                'inline-flex size-9 items-center justify-center rounded-lg text-lg transition duration-150 hover:bg-card active:scale-95',
                                currentEmoji === emoji &&
                                  'bg-card ring-2 ring-brand-400',
                              )}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Sheet>
    </div>
  )
}

import { useMemo, useState } from 'react'
import {
  AlertCircle,
  Archive,
  Pencil,
  Plus,
  RefreshCw,
  Tag,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import {
  Button,
  Card,
  CategoryAvatar,
  ConfirmDialog,
  EmptyState,
  IconButton,
  PageHeaderMotion,
  Skeleton,
  StaggerContainer,
  StaggerItem,
} from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { CategoryFormSheet } from '@/features/categories/CategoryFormSheet'
import { api, ApiError } from '@/lib/api'
import { getCategoryDescription } from '@/lib/categoryVisuals'
import { cn } from '@/lib/cn'
import { useStore } from '@/lib/store'
import type { Category, TransactionType } from '@/types'

type TypeFilter = 'all' | TransactionType

export function CategoriesPage() {
  const { categories, loading, error, refresh } = useStore()
  const { show } = useToast()

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [archivingCategory, setArchivingCategory] = useState<Category | null>(
    null,
  )

  const activeCategories = useMemo(
    () => categories.filter((c) => c.isActive !== false),
    [categories],
  )

  const archivedCategories = useMemo(
    () => categories.filter((c) => c.isActive === false),
    [categories],
  )

  const visibleActive = useMemo(() => {
    if (typeFilter === 'all') return activeCategories
    return activeCategories.filter((c) => c.type === typeFilter)
  }, [activeCategories, typeFilter])

  const expenseCategories = useMemo(
    () => visibleActive.filter((c) => c.type === 'expense'),
    [visibleActive],
  )

  const incomeCategories = useMemo(
    () => visibleActive.filter((c) => c.type === 'income'),
    [visibleActive],
  )

  function openCreate() {
    setEditingCategory(null)
    setFormOpen(true)
  }

  function openEdit(category: Category) {
    setEditingCategory(category)
    setFormOpen(true)
  }

  async function handleConfirmArchive() {
    if (!archivingCategory) return
    const target = archivingCategory
    try {
      await api(`/categories/${target.id}/archive`, { method: 'PATCH' })
      setArchivingCategory(null)
      await refresh()
      show({
        message: 'Kategori diarsipkan',
        description: `${target.name} tidak akan muncul di pilihan transaksi baru.`,
        type: 'info',
      })
    } catch (err) {
      setArchivingCategory(null)
      show({
        message:
          err instanceof ApiError
            ? err.message
            : 'Gagal mengarsipkan kategori',
        type: 'error',
      })
    }
  }

  const defaultCreateType: TransactionType =
    typeFilter === 'income' ? 'income' : 'expense'

  const sections: Array<{
    key: TransactionType
    title: string
    items: Category[]
  }> = [
    ...(typeFilter !== 'income'
      ? [
          {
            key: 'expense' as const,
            title: 'Pengeluaran',
            items: expenseCategories,
          },
        ]
      : []),
    ...(typeFilter !== 'expense'
      ? [
          {
            key: 'income' as const,
            title: 'Pemasukan',
            items: incomeCategories,
          },
        ]
      : []),
  ].filter((s) => s.items.length > 0)

  return (
    <div className="flex flex-col gap-4 pb-8">
      <PageHeaderMotion
        title="Kategori"
        subtitle={`${activeCategories.length} kategori aktif`}
        action={
          <Button size="sm" variant="primary" onClick={openCreate}>
            <Plus size={16} strokeWidth={2.2} aria-hidden />
            Tambah
          </Button>
        }
      />

      {/* Type filter */}
      <div
        className="inline-flex w-full max-w-sm rounded-[var(--radius-control)] bg-muted p-1"
        role="group"
        aria-label="Filter jenis kategori"
      >
        {(
          [
            { value: 'all', label: 'Semua' },
            { value: 'expense', label: 'Pengeluaran' },
            { value: 'income', label: 'Pemasukan' },
          ] as const
        ).map((tab) => {
          const selected = typeFilter === tab.value
          return (
            <button
              key={tab.value}
              type="button"
              aria-pressed={selected}
              onClick={() => setTypeFilter(tab.value)}
              className={cn(
                'flex-1 min-h-10 rounded-[calc(var(--radius-control)-2px)] px-3 text-xs font-semibold transition duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                selected
                  ? 'bg-card text-ink shadow-xs'
                  : 'text-ink-soft hover:text-ink',
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="flex items-center gap-3 rounded-[var(--radius-card)] border border-danger-100 bg-danger-100/40 px-4 py-3 dark:border-danger-700/30 dark:bg-danger-950/20">
          <AlertCircle size={18} strokeWidth={2} className="shrink-0 text-danger-500" aria-hidden />
          <p className="flex-1 text-sm font-medium text-danger-700 dark:text-danger-400">
            {error}
          </p>
          <IconButton
            label="Muat ulang kategori"
            icon={<RefreshCw size={15} strokeWidth={2} aria-hidden />}
            variant="ghost"
            size="sm"
            onClick={() => void refresh()}
          />
        </div>
      )}

      {/* Loading */}
      {loading && categories.length === 0 && (
        <Card className="!p-0 overflow-hidden">
          <div className="divide-y divide-line px-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 py-3.5">
                <Skeleton className="size-10 shrink-0" rounded="card" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-1/3" rounded="control" />
                  <Skeleton className="h-3 w-1/2" rounded="control" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Empty state */}
      {!loading && !error && visibleActive.length === 0 && (
        <EmptyState
          icon={Tag}
          title="Belum ada kategori"
          description={
            typeFilter === 'all'
              ? 'Tambahkan kategori untuk mengelompokkan pemasukan dan pengeluaran Anda.'
              : `Belum ada kategori aktif untuk jenis ${typeFilter === 'income' ? 'pemasukan' : 'pengeluaran'}.`
          }
          action={{
            label: 'Tambah kategori',
            onClick: openCreate,
          }}
        />
      )}

      {/* Active category sections */}
      {sections.length > 0 && (
        <StaggerContainer className="space-y-5">
          {sections.map((section, sectionIdx) => (
            <StaggerItem
              key={section.key}
              index={sectionIdx}
              as="section"
              className="space-y-2"
            >
              <div className="flex items-center justify-between px-1">
                <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  {section.key === 'income' ? (
                    <TrendingUp size={13} strokeWidth={2.2} className="text-income-600" aria-hidden />
                  ) : (
                    <TrendingDown size={13} strokeWidth={2.2} className="text-expense-500" aria-hidden />
                  )}
                  {section.title}
                </h2>
                <span className="text-[11px] text-ink-soft">
                  {section.items.length} kategori
                </span>
              </div>

              <Card className="!p-0 overflow-hidden">
                <div className="divide-y divide-line px-4">
                  {section.items.map((cat) => (
                    <div
                      key={cat.id}
                      className="group flex min-h-14 items-center gap-3 py-3 transition-colors duration-150"
                    >
                      <CategoryAvatar
                        categoryId={cat.id}
                        name={cat.name}
                        iconKey={cat.iconKey}
                        type={cat.type}
                        size="md"
                        className="group-hover:scale-105 motion-reduce:group-hover:scale-100"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">
                          {cat.name}
                        </p>
                        <p className="truncate text-xs text-ink-soft">
                          {getCategoryDescription(cat.iconKey, cat.name)}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <IconButton
                          label={`Ubah kategori ${cat.name}`}
                          icon={<Pencil size={16} strokeWidth={1.9} aria-hidden />}
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(cat)}
                        />
                        <IconButton
                          label={`Arsipkan kategori ${cat.name}`}
                          icon={<Archive size={16} strokeWidth={1.9} aria-hidden />}
                          variant="ghost"
                          size="sm"
                          onClick={() => setArchivingCategory(cat)}
                          className="text-ink-soft hover:text-danger-600 dark:hover:text-danger-400"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}

      {/* Archived categories */}
      {archivedCategories.length > 0 && (
        <section className="space-y-2 pt-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
              Diarsipkan
            </h2>
            <span className="text-[11px] text-ink-soft">
              {archivedCategories.length} kategori
            </span>
          </div>
          <Card className="!p-0 overflow-hidden opacity-75">
            <div className="divide-y divide-line px-4">
              {archivedCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex min-h-12 items-center gap-3 py-3"
                >
                  <CategoryAvatar
                    categoryId={cat.id}
                    name={cat.name}
                    iconKey={cat.iconKey}
                    type={cat.type}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {cat.name}
                    </p>
                    <p className="text-xs text-ink-soft">
                      {cat.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} · Diarsipkan
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}

      <CategoryFormSheet
        open={formOpen}
        category={editingCategory}
        defaultType={defaultCreateType}
        existingCategories={categories}
        onClose={() => setFormOpen(false)}
        onSaved={refresh}
      />

      <ConfirmDialog
        open={archivingCategory != null}
        title="Arsipkan kategori?"
        description={
          archivingCategory
            ? `Kategori "${archivingCategory.name}" tidak akan muncul lagi saat mencatat atau mengubah transaksi baru. Transaksi lama yang sudah memakai kategori ini tetap aman.`
            : 'Kategori ini akan diarsipkan.'
        }
        confirmLabel="Arsipkan"
        cancelLabel="Batal"
        variant="danger"
        onClose={() => setArchivingCategory(null)}
        onConfirm={handleConfirmArchive}
      />
    </div>
  )
}

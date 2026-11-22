import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { Sheet } from '@/components/ui/Sheet'
import { useToast } from '@/components/ui/Toast'
import { ApiError, api } from '@/lib/api'
import { getIcon } from '@/lib/icons'
import { useStore } from '@/lib/store'

type BudgetCategory = {
  id: number
  name: string
  icon_key: string
}

type BudgetRecord = {
  id: number
  category_id: number | null
  wallet_id: number | null
  limit_amount: number
}

type BudgetFormSheetProps = {
  open: boolean
  month: string
  budget: BudgetRecord | null
  onClose: () => void
  onSaved: () => Promise<void>
}

function monthParts(month: string) {
  const [year, value] = month.split('-').map(Number)
  return { year, month: value }
}

export function BudgetFormSheet({
  open,
  month,
  budget,
  onClose,
  onSaved,
}: BudgetFormSheetProps) {
  const { wallets } = useStore()
  const { show } = useToast()
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [walletId, setWalletId] = useState<number | null>(null)
  const [limit, setLimit] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [loadingCategories, setLoadingCategories] = useState(false)

  useEffect(() => {
    if (!open) return
    setCategoryId(budget?.category_id ?? null)
    setWalletId(budget?.wallet_id ?? null)
    setLimit(budget?.limit_amount ?? 0)
    setErrors({})
    if (budget) return

    let active = true
    setLoadingCategories(true)
    api<{ data: BudgetCategory[] }>('/categories?type=expense&active=1')
      .then((response) => {
        if (active) setCategories(response.data)
      })
      .catch((error: unknown) => {
        if (active) {
          show({
            message:
              error instanceof Error
                ? error.message
                : 'Kategori gagal dimuat',
          })
        }
      })
      .finally(() => {
        if (active) setLoadingCategories(false)
      })

    return () => {
      active = false
    }
  }, [open, budget, show])

  async function handleSave() {
    setErrors({})
    setSaving(true)
    const monthValue = monthParts(month)
    const body = budget
      ? { limit_amount: limit }
      : {
          category_id: categoryId,
          wallet_id: walletId,
          year: monthValue.year,
          month: monthValue.month,
          limit_amount: limit,
        }

    try {
      if (budget) {
        await api(`/budgets/${budget.id}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        })
      } else {
        await api('/budgets', {
          method: 'POST',
          body: JSON.stringify(body),
        })
      }
      await onSaved()
      onClose()
      show({ message: budget ? 'Anggaran diperbarui' : 'Anggaran ditambahkan' })
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        const fieldErrors = Object.fromEntries(
          Object.entries(error.errors ?? {}).map(([key, messages]) => [
            key,
            messages[0],
          ]),
        )
        setErrors(fieldErrors)
        if (Object.keys(fieldErrors).length === 0) show({ message: error.message })
      } else {
        show({
          message:
            error instanceof Error ? error.message : 'Anggaran gagal disimpan',
        })
      }
    } finally {
      setSaving(false)
    }
  }

  const activeWallets = wallets.filter((wallet) => wallet.isActive !== false)
  const canSave = limit > 0 && (budget !== null || categoryId !== null || walletId !== null)

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={budget ? 'Ubah anggaran' : 'Tambah anggaran'}
    >
      <div className="space-y-4">
        {!budget ? (
          <>
            <div>
              <p className="mb-2 text-sm font-medium text-ink">Kategori pengeluaran</p>
              {loadingCategories ? (
                <p className="text-sm text-ink-soft">Memuat kategori…</p>
              ) : categories.length === 0 ? (
                <p className="text-sm text-ink-soft">
                  Belum ada kategori pengeluaran aktif.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => {
                    const Icon = getIcon(category.icon_key)
                    return (
                      <Chip
                        key={category.id}
                        selected={categoryId === category.id}
                        onClick={() =>
                          setCategoryId((current) =>
                            current === category.id ? null : category.id,
                          )
                        }
                        icon={<Icon size={16} strokeWidth={1.75} aria-hidden />}
                      >
                        {category.name}
                      </Chip>
                    )
                  })}
                </div>
              )}
              {errors.category_id ? (
                <p className="mt-1.5 text-sm text-danger-500">{errors.category_id}</p>
              ) : null}
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-ink">Dompet (opsional)</p>
              {activeWallets.length === 0 ? (
                <p className="text-sm text-ink-soft">Belum ada dompet aktif.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {activeWallets.map((wallet) => {
                    const Icon = getIcon(wallet.iconKey)
                    return (
                      <Chip
                        key={wallet.id}
                        selected={walletId === wallet.id}
                        onClick={() =>
                          setWalletId((current) =>
                            current === wallet.id ? null : wallet.id,
                          )
                        }
                        icon={<Icon size={16} strokeWidth={1.75} aria-hidden />}
                      >
                        {wallet.name}
                      </Chip>
                    )
                  })}
                </div>
              )}
              {errors.wallet_id ? (
                <p className="mt-1.5 text-sm text-danger-500">{errors.wallet_id}</p>
              ) : null}
            </div>

            {errors.month ? (
              <p className="text-sm text-danger-500">{errors.month}</p>
            ) : null}
            {errors.category_id === undefined && errors.wallet_id === undefined &&
            categoryId === null &&
            walletId === null ? (
              <p className="text-sm text-ink-soft">
                Pilih minimal satu kategori atau dompet.
              </p>
            ) : null}
          </>
        ) : null}

        <MoneyInput
          label="Batas anggaran"
          value={limit}
          onChange={setLimit}
          error={errors.limit_amount}
        />
        <Button
          size="lg"
          fullWidth
          loading={saving}
          disabled={!canSave}
          onClick={() => void handleSave()}
        >
          Simpan anggaran
        </Button>
      </div>
    </Sheet>
  )
}

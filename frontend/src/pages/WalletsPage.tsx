import { useCallback, useEffect, useState } from 'react'
import { MoreVertical, Plus, Wallet as WalletIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { MyDuidLoader } from '@/components/ui/MyDuidLoader'
import {
  PageHeaderMotion,
  SectionMotion,
} from '@/components/ui/Motion'
import { WalletFormSheet } from '@/features/wallets/WalletFormSheet'
import { ApiError, api } from '@/lib/api'
import { getIcon } from '@/lib/icons'
import { formatRupiah } from '@/lib/money'
import { useStore } from '@/lib/store'
import type { Wallet } from '@/types'

type WalletRecord = Wallet & {
  isActive: boolean
}

type ApiWallet = {
  id: number
  name: string
  type: Wallet['type']
  icon_key: string
  balance: number
  is_active: boolean
}

type WalletAction = 'archive' | 'delete'

const walletTypeLabels: Record<Wallet['type'], string> = {
  cash: 'Kas',
  bank: 'Bank',
  ewallet: 'E-wallet',
}

function mapWallet(wallet: ApiWallet): WalletRecord {
  return {
    id: wallet.id,
    name: wallet.name,
    type: wallet.type,
    iconKey: wallet.icon_key,
    balance: wallet.balance,
    isActive: wallet.is_active,
  }
}

function WalletSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="flex items-center justify-center p-8 bg-card rounded-[var(--radius-card)] border border-line shadow-xs">
        <MyDuidLoader
          variant="section"
          size="md"
          message="Memuat daftar dompet..."
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-40" />
        ))}
      </div>
    </div>
  )
}

export function WalletsPage() {
  const { refresh } = useStore()
  const { show } = useToast()
  const [wallets, setWallets] = useState<WalletRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Wallet | null>(null)
  const [menuId, setMenuId] = useState<number | null>(null)
  const [pendingAction, setPendingAction] = useState<{
    wallet: WalletRecord
    action: WalletAction
  } | null>(null)

  const loadWallets = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const response = await api<{ data: ApiWallet[] }>('/wallets')
      setWallets(response.data.map(mapWallet))
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Dompet gagal dimuat'
      setLoadError(message)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadWallets().catch(() => undefined)
  }, [loadWallets])

  async function reloadAfterMutation() {
    await loadWallets()
    try {
      await refresh()
    } catch (error) {
      show({
        message:
          error instanceof Error ? error.message : 'Data dashboard gagal dimuat',
      })
    }
  }

  async function handleWalletAction() {
    if (!pendingAction) return
    const { wallet, action } = pendingAction

    try {
      if (action === 'archive') {
        await api(`/wallets/${wallet.id}/archive`, { method: 'PATCH' })
        show({ message: 'Dompet diarsipkan' })
      } else {
        await api(`/wallets/${wallet.id}`, { method: 'DELETE' })
        show({ message: 'Dompet dihapus' })
      }
      setPendingAction(null)
      await reloadAfterMutation()
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        show({ message: error.message })
      } else {
        show({
          message:
            error instanceof Error ? error.message : 'Perubahan dompet gagal',
        })
      }
    }
  }

  function openCreateForm() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEditForm(wallet: WalletRecord) {
    setEditing(wallet)
    setFormOpen(true)
    setMenuId(null)
  }

  return (
    <div className="space-y-6 pb-6">
      <PageHeaderMotion
        title="Dompet"
        subtitle="Kelola sumber saldo yang kamu gunakan."
        action={
          <Button onClick={openCreateForm}>
            <Plus size={18} strokeWidth={1.75} className="mr-2" aria-hidden />
            Tambah dompet
          </Button>
        }
      />

      {loading ? (
        <WalletSkeleton />
      ) : loadError ? (
        <div className="space-y-3 rounded-[var(--radius-card)] border border-line bg-card p-6 text-center">
          <p className="text-sm text-ink-soft">{loadError}</p>
          <Button variant="secondary" onClick={() => void loadWallets().catch(() => undefined)}>
            Coba lagi
          </Button>
        </div>
      ) : wallets.length === 0 ? (
        <EmptyState
          icon={WalletIcon}
          title="Belum ada dompet"
          description="Tambahkan dompet untuk mulai mencatat saldo dan transaksi."
          action={{ label: 'Tambah dompet', onClick: openCreateForm }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {wallets.map((wallet, idx) => {
            const Icon = getIcon(wallet.iconKey)
            return (
              <SectionMotion
                key={wallet.id}
                delay={idx * 40}
              >
                <Card
                  className="group relative transition duration-200 hover:-translate-y-0.5 hover:shadow-lg motion-reduce:transform-none"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
                      <Icon size={24} strokeWidth={1.75} aria-hidden />
                    </span>
                    <div className="relative">
                      <button
                        type="button"
                        aria-label={`Aksi untuk ${wallet.name}`}
                        aria-expanded={menuId === wallet.id}
                        onClick={() =>
                          setMenuId((current) =>
                            current === wallet.id ? null : wallet.id,
                          )
                        }
                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-control)] text-ink-soft transition duration-200 hover:bg-muted active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                      >
                        <MoreVertical size={20} strokeWidth={1.75} aria-hidden />
                      </button>
                      {menuId === wallet.id ? (
                        <div className="absolute right-0 top-full z-10 mt-1 min-w-36 rounded-[var(--radius-control)] border border-line bg-card p-1 shadow-lg">
                          <button
                            type="button"
                            onClick={() => openEditForm(wallet)}
                            className="min-h-11 w-full rounded-lg px-3 text-left text-sm text-ink transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                          >
                            Ubah
                          </button>
                          <button
                            type="button"
                            disabled={!wallet.isActive}
                            onClick={() => {
                              setPendingAction({ wallet, action: 'archive' })
                              setMenuId(null)
                            }}
                            className="min-h-11 w-full rounded-lg px-3 text-left text-sm text-ink transition hover:bg-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                          >
                            Arsipkan
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPendingAction({ wallet, action: 'delete' })
                              setMenuId(null)
                            }}
                            className="min-h-11 w-full rounded-lg px-3 text-left text-sm text-danger-700 transition hover:bg-danger-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                          >
                            Hapus
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="max-w-full truncate text-base font-semibold text-ink">
                      {wallet.name}
                    </h2>
                    {!wallet.isActive ? (
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-ink-soft">
                        Diarsipkan
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs text-ink-soft capitalize">
                    {walletTypeLabels[wallet.type]}
                  </p>
                  <p className="mt-3 tabular-nums text-lg font-bold text-ink tracking-tight">
                    {formatRupiah(wallet.balance)}
                  </p>
                </div>
              </Card>
            </SectionMotion>
            )
          })}
        </div>
      )}

      {!loading && wallets.length > 0 ? (
        <Button
          fullWidth
          className="sm:hidden"
          onClick={openCreateForm}
        >
          <Plus size={18} strokeWidth={1.75} className="mr-2" aria-hidden />
          Tambah dompet
        </Button>
      ) : null}

      <WalletFormSheet
        open={formOpen}
        wallet={editing}
        onClose={() => setFormOpen(false)}
        onSaved={reloadAfterMutation}
      />

      <ConfirmDialog
        open={pendingAction !== null}
        title={pendingAction?.action === 'archive' ? 'Arsipkan dompet?' : 'Hapus dompet?'}
        description={
          pendingAction?.action === 'archive'
            ? `${pendingAction.wallet.name} akan diarsipkan dan tidak tersedia untuk transaksi baru.`
            : `${pendingAction?.wallet.name ?? 'Dompet'} akan dihapus. Dompet yang memiliki riwayat tidak dapat dihapus.`
        }
        confirmLabel={pendingAction?.action === 'archive' ? 'Arsipkan' : 'Hapus'}
        variant="danger"
        onClose={() => setPendingAction(null)}
        onConfirm={handleWalletAction}
      />
    </div>
  )
}

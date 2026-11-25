import { useCallback, useEffect, useState } from 'react'
import { MoreVertical, Plus } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { MyDuidLoader } from '@/components/ui/MyDuidLoader'
import {
  PageHeaderMotion,
  SectionMotion,
} from '@/components/ui/Motion'
import { WalletCard } from '@/components/ui/WalletCard'
import { AddWalletCard } from '@/features/wallets/AddWalletCard'
import { useWalletDetail } from '@/features/wallets/useWalletDetail'
import { WalletFormSheet } from '@/features/wallets/WalletFormSheet'
import { ApiError, api } from '@/lib/api'
import { formatRupiah } from '@/lib/money'
import { useStore } from '@/lib/store'
import type { Wallet, WalletCardTheme, WalletGoal, WalletGroup, WalletIconType } from '@/types'

type WalletRecord = Wallet & {
  isActive: boolean
}

type ApiWallet = {
  id: number
  name: string
  type: Wallet['type']
  group: WalletGroup
  card_theme?: WalletCardTheme
  icon_type?: WalletIconType
  icon_key: string
  has_card_image?: boolean
  balance: number
  is_active: boolean
  goal?: WalletGoal | null
}

type WalletAction = 'archive' | 'delete'

function mapWallet(wallet: ApiWallet): WalletRecord {
  return {
    id: wallet.id,
    name: wallet.name,
    type: wallet.type,
    group: wallet.group,
    cardTheme: wallet.card_theme ?? 'default',
    iconType: wallet.icon_type ?? 'preset',
    iconKey: wallet.icon_key,
    hasCardImage: wallet.has_card_image ?? false,
    balance: wallet.balance,
    isActive: wallet.is_active,
    goal: wallet.goal ?? null,
  }
}

type GroupMeta = {
  value: WalletGroup
  label: string
}

const GROUP_ORDER: GroupMeta[] = [
  { value: 'daily', label: 'Sehari-hari' },
  { value: 'savings', label: 'Tabungan' },
  { value: 'investment', label: 'Investasi' },
]

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
  const { refresh, version } = useStore()
  const { show } = useToast()
  const { openWallet } = useWalletDetail()
  const [searchParams, setSearchParams] = useSearchParams()
  const [wallets, setWallets] = useState<WalletRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
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
  }, [loadWallets, version])

  useEffect(() => {
    if (searchParams.get('tambah') !== '1') return
    setFormOpen(true)
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('tambah')
        return next
      },
      { replace: true },
    )
  }, [searchParams, setSearchParams])

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
    setFormOpen(true)
  }

  function openEditPanel(wallet: WalletRecord) {
    setMenuId(null)
    openWallet(wallet.id, { edit: true })
  }

  // Build per-group map (with cumulative delay offsets for animation)
  const groupedWallets = GROUP_ORDER.reduce<
    Array<GroupMeta & { items: WalletRecord[]; startDelay: number; subtotal: number }>
  >((acc, g) => {
    const prevTotal = acc.reduce((n, x) => n + x.items.length, 0)
    const items = wallets.filter((w) => w.group === g.value)
    return [
      ...acc,
      {
        ...g,
        items,
        startDelay: prevTotal,
        subtotal: items.reduce((sum, w) => sum + w.balance, 0),
      },
    ]
  }, [])

  const totalAsset = wallets.reduce((sum, w) => sum + w.balance, 0)

  // Visible groups (non-empty) for AddWalletCard placement
  const visibleGroups = groupedWallets.filter((g) => g.items.length > 0)
  const firstVisibleGroup = visibleGroups[0]?.value ?? 'daily'

  return (
    <div className="space-y-6 pb-6">
      <PageHeaderMotion
        title="Dompet"
        subtitle="Kelola sumber saldo yang kamu gunakan."
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
      ) : (
        <>
          {/* Ringkasan total aset */}
          {wallets.length > 0 ? (
            <SectionMotion delay={0}>
              <div className="rounded-[var(--radius-card)] border border-line bg-card p-4 shadow-xs">
                <div className="mb-3 flex items-baseline justify-between">
                  <p className="text-sm font-semibold text-ink">Total Aset</p>
                  <p className="tabular-nums text-lg font-extrabold text-ink">
                    {formatRupiah(totalAsset)}
                  </p>
                </div>
                <div className="space-y-1.5">
                  {groupedWallets.map((g) =>
                    g.items.length > 0 ? (
                      <div
                        key={g.value}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-ink-soft">{g.label}</span>
                        <span className="tabular-nums font-medium text-ink">
                          {formatRupiah(g.subtotal)}
                        </span>
                      </div>
                    ) : null,
                  )}
                </div>
              </div>
            </SectionMotion>
          ) : null}

          {/* Grid per kelompok */}
          <div className="space-y-6">
            {groupedWallets.map((g) => {
              const isFirst = g.value === firstVisibleGroup
              const showSection = g.items.length > 0 || isFirst
              if (!showSection) return null

              return (
                <div key={g.value}>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-ink">{g.label}</h2>
                    {g.items.length > 0 ? (
                      <span className="tabular-nums text-sm font-medium text-ink-soft">
                        {formatRupiah(g.subtotal)}
                      </span>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {g.items.map((wallet, idx) => {
                      const delay = (g.startDelay + idx) * 40
                      return (
                        <SectionMotion key={wallet.id} delay={delay}>
                          <WalletCard
                            wallet={wallet}
                            size="full"
                            imageVersion={version}
                            onClick={() => openWallet(wallet.id)}
                            action={
                              <div className="relative" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  aria-label={`Aksi untuk ${wallet.name}`}
                                  aria-expanded={menuId === wallet.id}
                                  onClick={() =>
                                    setMenuId((current) =>
                                      current === wallet.id ? null : wallet.id,
                                    )
                                  }
                                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-control)] border border-white/25 bg-brand-900/25 text-white transition duration-200 hover:bg-brand-900/40 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                                >
                                  <MoreVertical size={20} strokeWidth={1.75} aria-hidden />
                                </button>
                                {menuId === wallet.id ? (
                                  <div className="absolute right-0 top-full z-10 mt-1 min-w-36 rounded-[var(--radius-control)] border border-line bg-card p-1 shadow-lg">
                                    <button
                                      type="button"
                                      onClick={() => openEditPanel(wallet)}
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
                            }
                          />
                        </SectionMotion>
                      )
                    })}

                    {/* AddWalletCard hanya di kelompok pertama yang tampil */}
                    {isFirst ? (
                      <SectionMotion delay={(g.startDelay + g.items.length) * 40}>
                        <AddWalletCard size="full" onClick={openCreateForm} />
                      </SectionMotion>
                    ) : null}
                  </div>
                </div>
              )
            })}

            {/* Jika tidak ada dompet sama sekali, tampilkan AddWalletCard di bagian Sehari-hari */}
            {wallets.length === 0 ? (
              <div>
                <div className="mb-3">
                  <h2 className="text-sm font-semibold text-ink">Sehari-hari</h2>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <AddWalletCard size="full" onClick={openCreateForm} />
                </div>
              </div>
            ) : null}
          </div>
        </>
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

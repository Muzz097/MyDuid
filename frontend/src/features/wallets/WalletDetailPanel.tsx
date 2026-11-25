import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { Sheet } from '@/components/ui/Sheet'
import { Skeleton } from '@/components/ui/Skeleton'
import { WalletCard } from '@/components/ui/WalletCard'
import { useAddTransaction } from '@/features/transactions/AddTransactionContext'
import { useWalletDetail } from '@/features/wallets/useWalletDetail'
import { WalletFormSheet } from '@/features/wallets/WalletFormSheet'
import { useStore } from '@/lib/store'

const SHEET_EXIT_MS = 250

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export function WalletDetailPanel() {
  const { walletId, openWallet, closeWallet } = useWalletDetail()
  const { openAddTransaction } = useAddTransaction()
  const { wallets, loading, refresh } = useStore()
  const [hiddenForId, setHiddenForId] = useState<number | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  const wallet = walletId == null ? null : (wallets.find((item) => item.id === walletId) ?? null)
  const open = walletId != null
  const balanceHidden = walletId != null && hiddenForId === walletId

  function handleCatat() {
    if (walletId == null) return
    const id = walletId
    closeWallet({ replace: true })
    window.setTimeout(() => {
      openAddTransaction({
        walletId: id,
        lockWallet: true,
        onSaved: () => openWallet(id),
      })
    }, prefersReducedMotion() ? 0 : SHEET_EXIT_MS)
  }

  return (
    <>
      <Sheet
        open={open}
        onClose={() => closeWallet()}
        title="Detail dompet"
        variant="drawer"
      >
        {loading && !wallet ? (
          <Skeleton className="h-36 w-full" rounded="card" />
        ) : !wallet ? (
          <p className="text-sm text-ink-soft">Dompet tidak ditemukan.</p>
        ) : (
          <div className="space-y-5">
            <div className="overflow-x-auto">
              <WalletCard
                wallet={wallet}
                size="compact"
                hidden={balanceHidden}
                action={
                  <IconButton
                    label={balanceHidden ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
                    variant="ghost"
                    onClick={() =>
                      setHiddenForId((current) =>
                        current === wallet.id ? null : wallet.id,
                      )
                    }
                    className="border border-white/25 bg-brand-900/25 text-white hover:bg-brand-900/40 hover:text-white"
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

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Button fullWidth onClick={handleCatat}>
                Catat
              </Button>
              <Button fullWidth variant="secondary" disabled>
                <span className="inline-flex items-center gap-2">
                  Pindah dana
                  <Badge variant="neutral">Segera hadir</Badge>
                </span>
              </Button>
              <Button fullWidth variant="outline" onClick={() => setEditOpen(true)}>
                Ubah
              </Button>
            </div>

            <section aria-label="Riwayat dompet" className="space-y-2">
              <h3 className="text-sm font-semibold text-ink">Riwayat</h3>
              <p className="rounded-[var(--radius-card)] border border-dashed border-line bg-muted/50 px-4 py-8 text-center text-sm text-ink-soft">
                Riwayat dompet segera hadir
              </p>
            </section>
          </div>
        )}
      </Sheet>

      <WalletFormSheet
        open={editOpen && wallet != null}
        wallet={wallet}
        onClose={() => setEditOpen(false)}
        onSaved={refresh}
      />
    </>
  )
}

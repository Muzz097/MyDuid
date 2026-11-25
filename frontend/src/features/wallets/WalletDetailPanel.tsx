import { useState } from 'react'
import { ArrowRightLeft, Eye, EyeOff, Pencil, Plus } from 'lucide-react'
import { IconButton } from '@/components/ui/IconButton'
import { Sheet } from '@/components/ui/Sheet'
import { Skeleton } from '@/components/ui/Skeleton'
import { WalletCard } from '@/components/ui/WalletCard'
import { useAddTransaction } from '@/features/transactions/AddTransactionContext'
import { TransferSheet } from '@/features/wallets/TransferSheet'
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
  const [transferOpen, setTransferOpen] = useState(false)
  const [transferSourceId, setTransferSourceId] = useState<number | null>(null)

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

  function handleTransfer() {
    if (walletId == null) return
    const id = walletId
    setTransferSourceId(id)
    closeWallet({ replace: true })
    window.setTimeout(() => {
      setTransferOpen(true)
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
                onClick={() => setEditOpen(true)}
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

            <section aria-label="Riwayat dompet" className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-ink">Riwayat</h3>
                <button
                  type="button"
                  disabled
                  title="Tersedia pada pembaruan berikutnya"
                  className="text-xs font-medium text-ink-soft/70 disabled:cursor-not-allowed"
                >
                  Lihat semua
                </button>
              </div>
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

      <TransferSheet
        open={transferOpen}
        initialSourceWalletId={transferSourceId ?? undefined}
        lockSourceWallet
        onClose={() => setTransferOpen(false)}
        onSaved={() => {
          setTransferOpen(false)
          if (transferSourceId != null) {
            openWallet(transferSourceId)
          }
        }}
      />
    </>
  )
}

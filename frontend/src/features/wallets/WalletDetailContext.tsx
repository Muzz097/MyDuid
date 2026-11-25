import {
  useCallback,
  useMemo,
  type ReactNode,
} from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  WalletDetailContext,
  type CloseWalletOptions,
} from '@/features/wallets/useWalletDetail'

function parseWalletId(value: string | null): number | null {
  if (!value || !/^[1-9]\d*$/.test(value)) return null
  const id = Number(value)
  return Number.isSafeInteger(id) ? id : null
}

export function WalletDetailProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const walletId = parseWalletId(searchParams.get('dompet'))

  const openWallet = useCallback(
    (id: number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set('dompet', String(id))
        if (next.toString() === prev.toString()) return prev
        return next
      })
    },
    [setSearchParams],
  )

  const closeWallet = useCallback(
    (options?: CloseWalletOptions) => {
      setSearchParams(
        (prev) => {
          if (!prev.has('dompet')) return prev
          const next = new URLSearchParams(prev)
          next.delete('dompet')
          return next
        },
        { replace: options?.replace ?? false },
      )
    },
    [setSearchParams],
  )

  const value = useMemo(
    () => ({ walletId, openWallet, closeWallet }),
    [walletId, openWallet, closeWallet],
  )

  return (
    <WalletDetailContext.Provider value={value}>
      {children}
    </WalletDetailContext.Provider>
  )
}

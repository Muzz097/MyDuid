import { createContext, useContext } from 'react'

export type OpenWalletOptions = {
  edit?: boolean
}

export type CloseWalletOptions = {
  replace?: boolean
}

export type WalletDetailContextValue = {
  walletId: number | null
  initialEdit: boolean
  openWallet: (id: number, options?: OpenWalletOptions) => void
  closeWallet: (options?: CloseWalletOptions) => void
}

export const WalletDetailContext =
  createContext<WalletDetailContextValue | null>(null)

export function useWalletDetail(): WalletDetailContextValue {
  const ctx = useContext(WalletDetailContext)
  if (!ctx) {
    throw new Error('useWalletDetail harus di dalam WalletDetailProvider')
  }
  return ctx
}

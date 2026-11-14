import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { categories, transactions as seedTx, wallets as seedWallets } from '@/mocks/data'
import type { Category, Transaction, Wallet } from '@/types'

interface Store {
  wallets: Wallet[]
  categories: Category[]
  transactions: Transaction[]
  addTransaction: (tx: Omit<Transaction, 'id'>) => Transaction
  removeTransaction: (id: number) => void
  restoreTransaction: (tx: Transaction) => void
}

const Ctx = createContext<Store | null>(null)

function applyDelta(wallets: Wallet[], tx: Transaction, sign: 1 | -1): Wallet[] {
  const delta = (tx.type === 'income' ? tx.amount : -tx.amount) * sign
  return wallets.map((w) => (w.id === tx.walletId ? { ...w, balance: w.balance + delta } : w))
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [wallets, setWallets] = useState<Wallet[]>(seedWallets)
  const [transactions, setTransactions] = useState<Transaction[]>(seedTx)

  const value = useMemo<Store>(
    () => ({
      wallets,
      categories,
      transactions,
      addTransaction: (data) => {
        const tx: Transaction = { ...data, id: Date.now() }
        setTransactions((p) => [tx, ...p])
        setWallets((p) => applyDelta(p, tx, 1))
        return tx
      },
      removeTransaction: (id) => {
        const tx = transactions.find((t) => t.id === id)
        if (!tx) return
        setTransactions((p) => p.filter((t) => t.id !== id))
        setWallets((p) => applyDelta(p, tx, -1))
      },
      restoreTransaction: (tx) => {
        setTransactions((p) => [tx, ...p])
        setWallets((p) => applyDelta(p, tx, 1))
      },
    }),
    [wallets, transactions],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore harus di dalam StoreProvider')
  return v
}
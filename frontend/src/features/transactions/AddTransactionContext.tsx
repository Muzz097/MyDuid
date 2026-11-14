import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { AddTransactionSheet } from '@/features/transactions/AddTransactionSheet'

type AddTransactionContextValue = {
  openAddTransaction: () => void
}

const AddTransactionContext =
  createContext<AddTransactionContextValue | null>(null)

export function AddTransactionProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)

  const openAddTransaction = useCallback(() => setOpen(true), [])
  const value = useMemo(
    () => ({ openAddTransaction }),
    [openAddTransaction],
  )

  return (
    <AddTransactionContext.Provider value={value}>
      {children}
      <AddTransactionSheet open={open} onClose={() => setOpen(false)} />
    </AddTransactionContext.Provider>
  )
}

export function useAddTransaction(): AddTransactionContextValue {
  const ctx = useContext(AddTransactionContext)
  if (!ctx) {
    throw new Error('useAddTransaction harus di dalam AddTransactionProvider')
  }
  return ctx
}

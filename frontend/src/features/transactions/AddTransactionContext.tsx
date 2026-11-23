import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { AddTransactionSheet } from '@/features/transactions/AddTransactionSheet'
import type { TransactionType } from '@/types'

type AddTransactionContextValue = {
  openAddTransaction: (type?: TransactionType | unknown) => void
}

const AddTransactionContext =
  createContext<AddTransactionContextValue | null>(null)

export function AddTransactionProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [initialType, setInitialType] = useState<TransactionType>('expense')

  const openAddTransaction = useCallback((type?: TransactionType | unknown) => {
    if (type === 'income' || type === 'expense') {
      setInitialType(type)
    } else {
      setInitialType('expense')
    }
    setOpen(true)
  }, [])

  const value = useMemo(
    () => ({ openAddTransaction }),
    [openAddTransaction],
  )

  return (
    <AddTransactionContext.Provider value={value}>
      {children}
      <AddTransactionSheet
        open={open}
        initialType={initialType}
        onClose={() => setOpen(false)}
      />
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

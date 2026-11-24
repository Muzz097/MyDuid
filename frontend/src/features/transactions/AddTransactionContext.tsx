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

type OpenAddTransactionParam =
  | TransactionType
  | { type?: TransactionType; date?: string }
  | unknown

type AddTransactionContextValue = {
  openAddTransaction: (param?: OpenAddTransactionParam) => void
}

const AddTransactionContext =
  createContext<AddTransactionContextValue | null>(null)

export function AddTransactionProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [initialType, setInitialType] = useState<TransactionType>('expense')
  const [initialDate, setInitialDate] = useState<string | undefined>(undefined)

  const openAddTransaction = useCallback((param?: OpenAddTransactionParam) => {
    if (typeof param === 'string' && (param === 'income' || param === 'expense')) {
      setInitialType(param)
      setInitialDate(undefined)
    } else if (param && typeof param === 'object' && ('type' in param || 'date' in param)) {
      const obj = param as { type?: TransactionType; date?: string }
      if (obj.type === 'income' || obj.type === 'expense') {
        setInitialType(obj.type)
      } else {
        setInitialType('expense')
      }
      setInitialDate(obj.date)
    } else {
      setInitialType('expense')
      setInitialDate(undefined)
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
        initialDate={initialDate}
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

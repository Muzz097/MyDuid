import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AddTransactionSheet } from '@/features/transactions/AddTransactionSheet'
import type { TransactionType } from '@/types'

type OpenAddTransactionOptions = {
  type?: TransactionType
  date?: string
  walletId?: number
  lockWallet?: boolean
  onSaved?: () => void
}

type OpenAddTransactionParam =
  | TransactionType
  | OpenAddTransactionOptions
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
  const [initialWalletId, setInitialWalletId] = useState<number | undefined>(undefined)
  const [lockWallet, setLockWallet] = useState(false)
  const onSavedRef = useRef<(() => void) | undefined>(undefined)

  const openAddTransaction = useCallback((param?: OpenAddTransactionParam) => {
    if (typeof param === 'string' && (param === 'income' || param === 'expense')) {
      setInitialType(param)
      setInitialDate(undefined)
      setInitialWalletId(undefined)
      setLockWallet(false)
      onSavedRef.current = undefined
    } else if (
      param &&
      typeof param === 'object' &&
      ('type' in param ||
        'date' in param ||
        'walletId' in param ||
        'lockWallet' in param ||
        'onSaved' in param)
    ) {
      const obj = param as OpenAddTransactionOptions
      if (obj.type === 'income' || obj.type === 'expense') {
        setInitialType(obj.type)
      } else {
        setInitialType('expense')
      }
      setInitialDate(obj.date)
      setInitialWalletId(obj.walletId)
      setLockWallet(Boolean(obj.lockWallet))
      onSavedRef.current = obj.onSaved
    } else {
      setInitialType('expense')
      setInitialDate(undefined)
      setInitialWalletId(undefined)
      setLockWallet(false)
      onSavedRef.current = undefined
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
        initialWalletId={initialWalletId}
        lockWallet={lockWallet}
        onSaved={() => onSavedRef.current?.()}
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

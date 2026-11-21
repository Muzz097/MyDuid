import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api, ApiError } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import type { Category, Transaction, TransactionType, Wallet } from '@/types'

type DataEnvelope<T> = { data: T }

type ApiWallet = {
  id: number
  name: string
  type: Wallet['type']
  icon_key: string
  balance: number
}

type ApiCategory = {
  id: number
  name: string
  type: TransactionType
  icon_key: string
}

type ApiTransaction = {
  id: number
  wallet_id: number
  category_id: number
  type: TransactionType
  amount: number
  transaction_date: string
  notes: string | null
}

export type NewTransactionInput = Omit<Transaction, 'id'>

interface Store {
  wallets: Wallet[]
  categories: Category[]
  transactions: Transaction[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  addTransaction: (tx: NewTransactionInput) => Promise<Transaction>
  removeTransaction: (id: number) => Promise<void>
  restoreTransaction: (tx: Transaction) => Promise<void>
}

const Ctx = createContext<Store | null>(null)

function mapWallet(w: ApiWallet): Wallet {
  return {
    id: w.id,
    name: w.name,
    type: w.type,
    iconKey: w.icon_key,
    balance: w.balance,
  }
}

function mapCategory(c: ApiCategory): Category {
  return {
    id: c.id,
    name: c.name,
    type: c.type,
    iconKey: c.icon_key,
  }
}

function mapTransaction(t: ApiTransaction): Transaction {
  return {
    id: t.id,
    walletId: t.wallet_id,
    categoryId: t.category_id,
    type: t.type,
    amount: t.amount,
    date: t.transaction_date,
    notes: t.notes ?? undefined,
  }
}

function currentMonth(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
  }).format(new Date())
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const month = currentMonth()
      const [walletsRes, categoriesRes, transactionsRes] = await Promise.all([
        api<DataEnvelope<ApiWallet[]>>('/wallets'),
        api<DataEnvelope<ApiCategory[]>>('/categories'),
        api<DataEnvelope<ApiTransaction[]>>(`/transactions?month=${month}`),
      ])
      setWallets(walletsRes.data.map(mapWallet))
      setCategories(categoriesRes.data.map(mapCategory))
      setTransactions(transactionsRes.data.map(mapTransaction))
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Gagal memuat data'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setWallets([])
      setCategories([])
      setTransactions([])
      setError(null)
      setLoading(false)
      return
    }
    void refresh().catch(() => {
      // error sudah di state
    })
  }, [user, authLoading, refresh])

  const addTransaction = useCallback(
    async (data: NewTransactionInput) => {
      const res = await api<DataEnvelope<ApiTransaction>>('/transactions', {
        method: 'POST',
        body: JSON.stringify({
          wallet_id: data.walletId,
          category_id: data.categoryId,
          type: data.type,
          amount: data.amount,
          transaction_date: data.date,
          notes: data.notes ?? null,
        }),
      })
      const tx = mapTransaction(res.data)
      await refresh()
      return tx
    },
    [refresh],
  )

  const removeTransaction = useCallback(
    async (id: number) => {
      await api(`/transactions/${id}`, { method: 'DELETE' })
      await refresh()
    },
    [refresh],
  )

  const restoreTransaction = useCallback(
    async (tx: Transaction) => {
      await api(`/transactions/${tx.id}/restore`, { method: 'POST' })
      await refresh()
    },
    [refresh],
  )

  const value = useMemo<Store>(
    () => ({
      wallets,
      categories,
      transactions,
      loading,
      error,
      refresh,
      addTransaction,
      removeTransaction,
      restoreTransaction,
    }),
    [
      wallets,
      categories,
      transactions,
      loading,
      error,
      refresh,
      addTransaction,
      removeTransaction,
      restoreTransaction,
    ],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore harus di dalam StoreProvider')
  return v
}

/**
 * useTransactionQuery
 *
 * Independent fetch hook for the Transactions page. Does NOT use the global
 * store; it hits the API directly so it can handle arbitrary date ranges,
 * search, and pagination without polluting the store that Dashboard and
 * AddTransaction rely on.
 *
 * API contract (TransactionController@index):
 *   GET /api/transactions
 *   Query params:
 *     month        – YYYY-MM   (mutually exclusive with date_from/date_to)
 *     date_from    – YYYY-MM-DD
 *     date_to      – YYYY-MM-DD
 *     wallet_id    – integer
 *     category_ids – comma-separated integers (e.g. "1,3,7")
 *     type         – "income" | "expense"
 *     search       – string ≤200 chars (matches notes, category.name, wallet.name via ilike)
 *     per_page     – integer 1-200 (default 25)
 *     page         – integer (cursor from Laravel pagination)
 *
 *   Returns: Laravel paginated collection
 *   {
 *     data: ApiTransaction[]
 *     links: { first, last, prev, next }
 *     meta: { current_page, last_page, per_page, total, from, to }
 *   }
 *
 * Transfer API contract (TransferController@index):
 *   GET /api/transfers
 *   Query params:
 *     month, date_from, date_to, wallet_id, search, per_page, page
 *
 * Transfer summary: counted separately, never added to income/expense totals.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { api, ApiError } from '@/lib/api'
import { todayJakarta, shiftJakartaDate } from '@/lib/date'
import type { TransactionType } from '@/types'

// ---- Public filter shape ------------------------------------------------

export type PeriodPreset =
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'custom'

export type TransactionFilters = {
  search: string
  type: TransactionType | 'all'
  walletId: number | null
  categoryIds: number[]
  period: PeriodPreset
  dateFrom: string   // YYYY-MM-DD, relevant when period === 'custom'
  dateTo: string     // YYYY-MM-DD, relevant when period === 'custom'
}

export const DEFAULT_FILTERS: TransactionFilters = {
  search: '',
  type: 'all',
  walletId: null,
  categoryIds: [],
  period: 'this_month',
  dateFrom: '',
  dateTo: '',
}

// ---- API shapes --------------------------------------------------------

export type ApiTransaction = {
  id: number
  wallet_id: number
  category_id: number
  type: TransactionType
  amount: number
  transaction_date: string
  notes: string | null
  created_at?: string | null
  updated_at?: string | null
  wallet?: { id: number; name: string } | null
  category?: { id: number; name: string; icon_key: string } | null
}

type ApiTransfer = {
  id: number
  source_wallet_id: number
  destination_wallet_id: number
  amount: number
  transfer_date: string
  notes: string | null
  source_wallet?: { id: number; name: string } | null
  destination_wallet?: { id: number; name: string } | null
}

type PaginatedMeta = {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

type PaginatedResponse<T> = {
  data: T[]
  meta: PaginatedMeta
}

// ---- Public result types -----------------------------------------------

export type FetchedTransaction = {
  id: number
  walletId: number
  categoryId: number
  type: TransactionType
  amount: number
  date: string
  notes?: string
  createdAt?: string | null
  updatedAt?: string | null
  wallet?: { id: number; name: string } | null
  category?: { id: number; name: string; iconKey: string } | null
}

export type FetchedTransfer = {
  id: number
  sourceWalletId: number
  destinationWalletId: number
  amount: number
  date: string
  notes?: string
  sourceWallet?: { id: number; name: string } | null
  destinationWallet?: { id: number; name: string } | null
}

export type TransactionSummary = {
  income: number
  expense: number
  transferTotal: number
  transactionCount: number
  transferCount: number
}

export type TransactionQueryResult = {
  transactions: FetchedTransaction[]
  transfers: FetchedTransfer[]
  summary: TransactionSummary
  meta: PaginatedMeta | null
  transferMeta: PaginatedMeta | null
  loading: boolean
  loadingMore: boolean
  error: string | null
  hasMore: boolean
  page: number
  loadMore: () => void
  refetch: () => Promise<void>
  reset: () => void
}

// ---- Date range helpers ------------------------------------------------

function jakartaWeekBounds(): { from: string; to: string } {
  const today = todayJakarta()
  // ISO week: Monday=1 … Sunday=7
  const d = new Date(`${today}T12:00:00+07:00`)
  const dow = d.getDay() === 0 ? 7 : d.getDay() // 1-7
  const mondayOffset = -(dow - 1)
  const sundayOffset = 7 - dow
  return {
    from: shiftJakartaDate(today, mondayOffset),
    to: shiftJakartaDate(today, sundayOffset),
  }
}

function jakartaMonthBounds(offsetMonths = 0): { from: string; to: string } {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
  const y = now.getFullYear()
  const m = now.getMonth() + 1 + offsetMonths
  // Normalize
  const date = new Date(y, m - 1, 1)
  const fy = date.getFullYear()
  const fm = String(date.getMonth() + 1).padStart(2, '0')
  const lastDay = new Date(fy, date.getMonth() + 1, 0).getDate()
  return {
    from: `${fy}-${fm}-01`,
    to: `${fy}-${fm}-${String(lastDay).padStart(2, '0')}`,
  }
}

function jakartaYearBounds(): { from: string; to: string } {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
  const y = now.getFullYear()
  return { from: `${y}-01-01`, to: `${y}-12-31` }
}

export function resolveDateRange(filters: TransactionFilters): { from: string; to: string } | null {
  switch (filters.period) {
    case 'today': {
      const t = todayJakarta()
      return { from: t, to: t }
    }
    case 'this_week':
      return jakartaWeekBounds()
    case 'this_month':
      return jakartaMonthBounds(0)
    case 'last_month':
      return jakartaMonthBounds(-1)
    case 'this_year':
      return jakartaYearBounds()
    case 'custom':
      if (filters.dateFrom && filters.dateTo) {
        return { from: filters.dateFrom, to: filters.dateTo }
      }
      if (filters.dateFrom) return { from: filters.dateFrom, to: todayJakarta() }
      return null
    default:
      return null
  }
}

// ---- Mapping -----------------------------------------------------------

export function mapTransaction(t: ApiTransaction): FetchedTransaction {
  return {
    id: t.id,
    walletId: t.wallet_id,
    categoryId: t.category_id,
    type: t.type,
    amount: t.amount,
    date: t.transaction_date,
    notes: t.notes ?? undefined,
    createdAt: t.created_at ?? null,
    updatedAt: t.updated_at ?? null,
    wallet: t.wallet ?? null,
    category: t.category
      ? { id: t.category.id, name: t.category.name, iconKey: t.category.icon_key }
      : null,
  }
}

function mapTransfer(t: ApiTransfer): FetchedTransfer {
  return {
    id: t.id,
    sourceWalletId: t.source_wallet_id,
    destinationWalletId: t.destination_wallet_id,
    amount: t.amount,
    date: t.transfer_date,
    notes: t.notes ?? undefined,
    sourceWallet: t.source_wallet ?? null,
    destinationWallet: t.destination_wallet ?? null,
  }
}

// ---- Query param builder -----------------------------------------------

function buildParams(filters: TransactionFilters, page: number, perPage = 25): string {
  const params = new URLSearchParams()
  const range = resolveDateRange(filters)
  if (range) {
    params.set('date_from', range.from)
    params.set('date_to', range.to)
  }
  if (filters.type !== 'all') params.set('type', filters.type)
  if (filters.walletId) params.set('wallet_id', String(filters.walletId))
  if (filters.categoryIds.length > 0) params.set('category_ids', filters.categoryIds.join(','))
  if (filters.search.trim()) params.set('search', filters.search.trim())
  params.set('per_page', String(perPage))
  params.set('page', String(page))
  return params.toString()
}

function buildTransferParams(filters: TransactionFilters, page: number, perPage = 25): string {
  const params = new URLSearchParams()
  const range = resolveDateRange(filters)
  if (range) {
    params.set('date_from', range.from)
    params.set('date_to', range.to)
  }
  if (filters.walletId) params.set('wallet_id', String(filters.walletId))
  if (filters.search.trim()) params.set('search', filters.search.trim())
  params.set('per_page', String(perPage))
  params.set('page', String(page))
  return params.toString()
}

// ---- Hook --------------------------------------------------------------

const PER_PAGE = 25

export function useTransactionQuery(filters: TransactionFilters): TransactionQueryResult {
  const [transactions, setTransactions] = useState<FetchedTransaction[]>([])
  const [transfers, setTransfers] = useState<FetchedTransfer[]>([])
  const [summary, setSummary] = useState<TransactionSummary>({
    income: 0,
    expense: 0,
    transferTotal: 0,
    transactionCount: 0,
    transferCount: 0,
  })
  const [meta, setMeta] = useState<PaginatedMeta | null>(null)
  const [transferMeta, setTransferMeta] = useState<PaginatedMeta | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  // Abort controller ref to cancel stale requests
  const abortRef = useRef<AbortController | null>(null)
  // Track filter serialization to detect changes
  const filtersKey = JSON.stringify(filters)
  const filtersKeyRef = useRef(filtersKey)

  const fetchPage = useCallback(
    async (targetPage: number, append: boolean) => {
      // Cancel previous request
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl

      if (append) setLoadingMore(true)
      else setLoading(true)
      setError(null)

      try {
        const txParams = buildParams(filters, targetPage, PER_PAGE)
        const trParams = buildTransferParams(filters, 1, 100) // load all transfers for the period

        const [txRes, trRes] = await Promise.all([
          api<PaginatedResponse<ApiTransaction>>(`/transactions?${txParams}`),
          // Only fetch transfers on first page or when filters change
          append ? Promise.resolve(null) : api<PaginatedResponse<ApiTransfer>>(`/transfers?${trParams}`),
        ])

        if (ctrl.signal.aborted) return

        const newTxs = txRes.data.map(mapTransaction)
        const newTrs = trRes ? trRes.data.map(mapTransfer) : transfers

        if (append) {
          setTransactions((prev) => {
            const existingIds = new Set(prev.map((t) => t.id))
            const deduped = newTxs.filter((t) => !existingIds.has(t.id))
            return [...prev, ...deduped]
          })
        } else {
          setTransactions(newTxs)
          setTransfers(newTrs)
        }

        setMeta(txRes.meta)
        if (trRes) setTransferMeta(trRes.meta)

        // Compute summary: income + expense from transactions; transfer is separate
        const allTxs = append
          ? [...transactions, ...newTxs]
          : newTxs

        // For summary we need totals across ALL pages, not just current page.
        // The backend returns per-page data; we accumulate for already-fetched items.
        // For page 1, totalIncome/totalExpense are from the current page.
        // For subsequent pages we sum the new items into existing state.
        // NOTE: summary is computed from fetched data, not backend aggregation.
        // If only partial data is loaded (> 1 page), the summary reflects loaded items.
        // This is documented as a limitation; the full period summary would require a
        // dedicated backend aggregation endpoint.
        const computedIncome = allTxs
          .filter((t) => t.type === 'income')
          .reduce((s, t) => s + t.amount, 0)
        const computedExpense = allTxs
          .filter((t) => t.type === 'expense')
          .reduce((s, t) => s + t.amount, 0)
        const trList = trRes ? newTrs : transfers
        const computedTransfer = trList.reduce((s, t) => s + t.amount, 0)

        setSummary({
          income: computedIncome,
          expense: computedExpense,
          transferTotal: computedTransfer,
          transactionCount: txRes.meta.total,
          transferCount: trRes ? trRes.meta.total : (transferMeta?.total ?? 0),
        })
      } catch (err) {
        if (ctrl.signal.aborted) return
        const msg = err instanceof ApiError ? err.message : 'Gagal memuat transaksi'
        setError(msg)
      } finally {
        if (!ctrl.signal.aborted) {
          setLoading(false)
          setLoadingMore(false)
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtersKey],
  )

  // Reset and re-fetch when filters change
  useEffect(() => {
    if (filtersKeyRef.current !== filtersKey) {
      filtersKeyRef.current = filtersKey
      setPage(1)
      setTransactions([])
      setTransfers([])
      setSummary({ income: 0, expense: 0, transferTotal: 0, transactionCount: 0, transferCount: 0 })
    }
    void fetchPage(1, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey])

  const loadMore = useCallback(() => {
    if (meta && page < meta.last_page && !loadingMore) {
      const nextPage = page + 1
      setPage(nextPage)
      void fetchPage(nextPage, true)
    }
  }, [meta, page, loadingMore, fetchPage])

  const refetch = useCallback(async () => {
    setPage(1)
    await fetchPage(1, false)
  }, [fetchPage])

  const reset = useCallback(() => {
    setPage(1)
    setTransactions([])
    setTransfers([])
    setSummary({ income: 0, expense: 0, transferTotal: 0, transactionCount: 0, transferCount: 0 })
    setMeta(null)
    setTransferMeta(null)
    setError(null)
  }, [])

  const hasMore = meta ? page < meta.last_page : false

  return {
    transactions,
    transfers,
    summary,
    meta,
    transferMeta,
    loading,
    loadingMore,
    error,
    hasMore,
    page,
    loadMore,
    refetch,
    reset,
  }
}

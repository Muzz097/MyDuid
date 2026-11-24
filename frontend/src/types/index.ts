export type TransactionType = 'income' | 'expense'

export interface Wallet {
  id: number
  name: string
  type: 'cash' | 'bank' | 'ewallet'
  iconKey: string          // identifier ikon bawaan, mis. "wallet-cat"
  balance: number          // Rupiah utuh
  isActive?: boolean
}

export interface Category {
  id: number
  name: string
  type: TransactionType
  iconKey: string
}

export interface Transaction {
  id: number
  walletId: number
  categoryId: number
  type: TransactionType
  amount: number           // selalu positif
  date: string             // "2026-11-14"
  notes?: string
}

export interface Budget {
  id: number
  categoryId: number
  limit: number
  spent: number
}

export interface DailyCashFlowItem {
  date: string
  income: number
  expense: number
}

export interface CategorySummaryItem {
  category_id: number
  name: string
  icon_key: string | null
  amount: number
}

export interface DashboardData {
  month: string
  total_balance: number
  income: number
  expense: number
  wallets: Array<{
    id: number
    name: string
    type: Wallet['type']
    icon_key: string
    balance: number
  }>
  daily_cash_flow: DailyCashFlowItem[]
  income_by_category: CategorySummaryItem[]
  expense_by_category: CategorySummaryItem[]
  recent_transactions: Array<{
    id: number
    type: TransactionType
    amount: number
    transaction_date: string
    notes: string | null
    wallet: { id: number; name: string } | null
    category: { id: number; name: string; icon_key: string | null } | null
  }>
}

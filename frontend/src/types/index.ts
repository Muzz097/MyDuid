export type TransactionType = 'income' | 'expense'

export interface Wallet {
  id: number
  name: string
  type: 'cash' | 'bank' | 'ewallet'
  iconKey: string          // identifier ikon bawaan, mis. "wallet-cat"
  balance: number          // Rupiah utuh
}

export interface Category {
  id: number
  name: string
  type: TransactionType
  emoji: string
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
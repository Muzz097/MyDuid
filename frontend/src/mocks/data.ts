import type { Budget, Category, Transaction, Wallet } from '@/types'

export const wallets: Wallet[] = [
  { id: 1, name: 'Kas', type: 'cash', iconKey: 'cash', balance: 350000 },
  { id: 2, name: 'BCA', type: 'bank', iconKey: 'bank', balance: 4200000 },
  { id: 3, name: 'E-wallet', type: 'ewallet', iconKey: 'ewallet', balance: 1125000 },
]

export const categories: Category[] = [
  { id: 1, name: 'Makanan', type: 'expense', iconKey: 'food' },
  { id: 2, name: 'Transport', type: 'expense', iconKey: 'transport' },
  { id: 3, name: 'Belanja', type: 'expense', iconKey: 'shopping' },
  { id: 4, name: 'Hiburan', type: 'expense', iconKey: 'entertainment' },
  { id: 5, name: 'Gaji', type: 'income', iconKey: 'salary' },
  { id: 6, name: 'Bonus', type: 'income', iconKey: 'bonus' },
]

export const transactions: Transaction[] = [
  { id: 1, walletId: 2, categoryId: 5, type: 'income', amount: 5000000, date: '2026-11-01', notes: 'Gaji November' },
  { id: 2, walletId: 3, categoryId: 1, type: 'expense', amount: 25000, date: '2026-11-11', notes: 'Makan siang' },
  { id: 3, walletId: 1, categoryId: 2, type: 'expense', amount: 18000, date: '2026-11-12' },
  { id: 4, walletId: 3, categoryId: 3, type: 'expense', amount: 450000, date: '2026-11-13', notes: 'Sepatu' },
  { id: 5, walletId: 3, categoryId: 4, type: 'expense', amount: 55000, date: '2026-11-14' },
]

export const budgets: Budget[] = [
  { id: 1, categoryId: 1, limit: 1000000, spent: 500000 },
  { id: 2, categoryId: 4, limit: 300000, spent: 270000 },
  { id: 3, categoryId: 3, limit: 400000, spent: 450000 },
]
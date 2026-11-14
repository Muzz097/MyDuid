import type { Transaction, Wallet } from '@/types'

/** Jumlah saldo semua dompet (integer Rupiah). */
export function totalBalance(wallets: Wallet[]): number {
  return wallets.reduce((sum, wallet) => sum + wallet.balance, 0)
}

/** Ringkasan pemasukan & pengeluaran untuk bulan tertentu (month 1–12). */
export function monthSummary(
  transactions: Transaction[],
  year: number,
  month: number,
): { income: number; expense: number } {
  let income = 0
  let expense = 0

  for (const tx of transactions) {
    const [y, m] = tx.date.split('-').map(Number)
    if (y !== year || m !== month) continue
    if (tx.type === 'income') income += tx.amount
    else expense += tx.amount
  }

  return { income, expense }
}

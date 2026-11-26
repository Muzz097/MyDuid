export type TransactionType = 'income' | 'expense'

export type WalletGroup = 'daily' | 'savings' | 'investment'

export type WalletCardTheme =
  | 'default'
  | 'rose'
  | 'ocean'
  | 'emerald'
  | 'sunset'
  | 'graphite'

export type WalletIconType = 'preset' | 'emoji'

export interface WalletGoalDeadlineInfo {
  deadline: string
  days_left: number | null
  status: 'Dalam tenggat' | 'Tenggat terlewat' | 'Tercapai'
  weekly_deposit: number | null
  deposit_note: string | null
}

export interface WalletGoal {
  id: number
  wallet_id: number
  name: string
  target_amount: number
  starting_amount: number
  deadline: string | null
  completed_at: string | null
  balance: number
  percent: number
  remaining: number
  achieved: boolean
  deadline_info: WalletGoalDeadlineInfo | null
}

export interface Wallet {
  id: number
  name: string
  type: 'cash' | 'bank' | 'ewallet'
  group: WalletGroup      // kelompok: sehari-hari, tabungan, investasi
  cardTheme: WalletCardTheme
  iconType: WalletIconType
  iconKey: string          // identifier ikon bawaan atau 1 emoji
  hasCardImage: boolean
  balance: number          // Rupiah utuh
  isActive?: boolean
  goal?: WalletGoal | null
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
    group: WalletGroup
    card_theme?: WalletCardTheme
    icon_type?: WalletIconType
    icon_key: string
    has_card_image?: boolean
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


// --- Wallet Activity ---

export interface ActivityTransaction {
  kind: 'transaction'
  id: number
  date: string
  amount: number
  notes: string | null
  type: TransactionType
  category: { id: number; name: string; icon_key: string } | null
}

export interface ActivityTransfer {
  kind: 'transfer'
  id: number
  date: string
  amount: number
  notes: string | null
  direction: 'in' | 'out'
  counterparty_wallet: { id: number; name: string } | null
}

export type WalletActivityItem = ActivityTransaction | ActivityTransfer

export interface WalletActivityResponse {
  data: WalletActivityItem[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

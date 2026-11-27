export type ReportTab = 'summary' | 'categories' | 'trends' | 'wallets' | 'compare'

export type ComparisonBasis =
  | 'previous_month'
  | 'same_days_previous_month'
  | 'previous_equal_period'

export type CashFlowStatus = 'positive' | 'negative' | 'zero'

export type CashFlowGranularity = 'day' | 'week' | 'month'

export type ReportSummary = {
  income: number
  expense: number
  net: number
  transaction_count: number
  has_data: boolean
  income_used_percent: number | null
  income_remaining_percent: number | null
  cash_flow: CashFlowStatus
  previous: {
    from: string
    to: string
    income: number
    expense: number
    net: number
    income_change_percent: number | null
    expense_change_percent: number | null
    net_change_percent: number | null
  }
  comparison_basis: ComparisonBasis
}

export type ReportCashFlowBucket = {
  from: string
  to: string
  income: number
  expense: number
}

export type ReportStory = {
  top_expense_category: {
    category_id: number
    name: string
    amount: number
  } | null
  busiest_day: {
    date: string
    amount: number
  } | null
  largest_expense: {
    id: number
    amount: number
    notes: string | null
    transaction_date: string
    category_id: number | null
    category_name: string | null
  } | null
  expense_change: {
    percent: number | null
    previous_amount: number
  } | null
  reasons: Record<string, string>
}

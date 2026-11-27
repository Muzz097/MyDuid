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

export type ReportCategoryItem = {
  category_id: number
  name: string
  icon_key: string | null
  amount: number
  count: number
  average: number
  share_percent: number
  change_percent: number | null
}

export type ReportCategoriesResponse = {
  by_amount: ReportCategoryItem[]
  by_count: ReportCategoryItem[]
}

export type TrendMonthItem = {
  month: string
  income: number
  expense: number
  is_partial: boolean
}

export type WeekdayRhythmItem = {
  iso_weekday: number
  key: string
  total: number
  count: number
  average_per_occurrence: number
}

export type ReportTrendsResponse = {
  monthly: TrendMonthItem[]
  average_expense: number | null
  highest_expense_month: {
    month: string
    expense: number
  } | null
  lowest_expense_month: {
    month: string
    expense: number
  } | null
  month_over_month_change_percent: number | null
  weekday_rhythm: WeekdayRhythmItem[]
}

export type ReportWalletItem = {
  wallet_id: number
  name: string
  icon_key: string | null
  is_active: boolean
  income: number
  expense: number
  transfer_in: number
  transfer_out: number
  transaction_count: number
  balance: number // current all-time balance from BalanceService, not period-specific
}

export type ComparisonContributor = {
  category_id: number
  name: string
  current: number
  previous: number
  delta: number
  direction: 'up' | 'down'
}

export type ReportComparisonResponse = {
  period: {
    from: string
    to: string
    income: number
    expense: number
    net: number
  }
  comparison: {
    from: string
    to: string
    basis: ComparisonBasis
    income: number
    expense: number
    net: number
  }
  income_change_percent: number | null
  expense_change_percent: number | null
  net_change_percent: number | null
  contributors: ComparisonContributor[]
}

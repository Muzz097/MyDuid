export type WrappedMonthItem = {
  month: string
  transaction_count: number
}

export type WrappedMonthsResponse = {
  months: WrappedMonthItem[]
  upcoming: {
    month: string
    available_at: string
  }
}

export type WrappedPersonaCode =
  | 'calm_saver'
  | 'budget_keeper'
  | 'recovery_month'
  | 'moment_hunter'
  | 'weekend_king'
  | 'routine'
  | 'explorer'

export type WrappedPersona = {
  code: WrappedPersonaCode
  reason: Record<string, string | number>
}

export type WrappedSummary = {
  income: number
  expense: number
  net: number
  previous: {
    income: number
    expense: number
    net: number
    income_change_percent: number | null
    expense_change_percent: number | null
    net_change_percent: number | null
  } | null
  comparison_basis: string
}

export type WrappedTopCategory = {
  category_id: number
  name: string
  icon_key: string | null
  amount: number
  share_percent: number
}

export type WrappedMostFrequentCategory = {
  category_id: number
  name: string
  count: number
}

export type WrappedDayAmount = {
  date: string
  amount: number
}

export type WrappedWeekdayItem = {
  iso_weekday: number
  key: string
  total: number
  count: number
}

export type WrappedCategoryChange = {
  category_id: number
  name: string
  delta: number
  direction: 'up' | 'down'
}

export type WrappedBiggestTransaction = {
  id: number
  amount: number
  category_id: number | null
  category_name: string | null
  date: string
}

export type WrappedBudgetsSummary = {
  total: number
  healthy: number
  warning: number
  over: number
}

export type WrappedDetail = {
  month: string
  from: string
  to: string
  transaction_count: number
  has_data: boolean
  summary: WrappedSummary | null
  top_categories: WrappedTopCategory[]
  most_frequent_category: WrappedMostFrequentCategory | null
  biggest_day: WrappedDayAmount | null
  frugal_day: WrappedDayAmount | null
  no_spend_days: number
  longest_no_spend_streak: number
  daily_expense: WrappedDayAmount[]
  weekday_rhythm: WrappedWeekdayItem[]
  busiest_weekday: number | null
  changes: WrappedCategoryChange[]
  biggest_transaction: WrappedBiggestTransaction | null
  logging: {
    days_with_records: number
    longest_logging_streak: number
  }
  budgets: WrappedBudgetsSummary | null
  persona: WrappedPersona
}

export type WrappedSlide =
  | { id: 'intro'; data: WrappedDetail }
  | { id: 'numbers'; data: WrappedDetail }
  | { id: 'categories'; data: WrappedDetail }
  | { id: 'days'; data: WrappedDetail }
  | { id: 'rhythm'; data: WrappedDetail }
  | { id: 'changes'; data: WrappedDetail }
  | { id: 'habits'; data: WrappedDetail }
  | { id: 'biggest'; data: WrappedDetail }
  | { id: 'closing'; data: WrappedDetail }

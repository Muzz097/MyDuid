import type { WrappedDetail, WrappedSlide } from './types'

export function hasMeaningfulHabits(data: WrappedDetail): boolean {
  const keptBudgets = data.budgets ? data.budgets.healthy + data.budgets.warning : 0
  return (
    data.no_spend_days > 0 ||
    data.longest_no_spend_streak > 0 ||
    data.logging.longest_logging_streak > 0 ||
    keptBudgets > 0
  )
}

export function buildSlides(data: WrappedDetail): WrappedSlide[] {
  if (!data.has_data) {
    return []
  }

  const slides: WrappedSlide[] = [
    { id: 'intro', data },
    { id: 'numbers', data },
  ]

  if (data.top_categories.length > 0 || data.most_frequent_category !== null) {
    slides.push({ id: 'categories', data })
  }

  if (data.biggest_day !== null || data.daily_expense.length > 0) {
    slides.push({ id: 'days', data })
  }

  if (data.weekday_rhythm.some((w) => w.total > 0 || w.count > 0)) {
    slides.push({ id: 'rhythm', data })
  }

  if (data.changes.length > 0) {
    slides.push({ id: 'changes', data })
  }

  if (hasMeaningfulHabits(data)) {
    slides.push({ id: 'habits', data })
  }

  if (data.biggest_transaction !== null) {
    slides.push({ id: 'biggest', data })
  }

  slides.push({ id: 'closing', data })

  return slides
}

import { useRef, type KeyboardEvent } from 'react'
import { cn } from '@/lib/cn'
import type { ReportTab } from '@/features/reports/types'

export type ReportTabItem = {
  id: ReportTab
  label: string
  disabled?: boolean
}

export const REPORT_TABS: ReportTabItem[] = [
  { id: 'summary', label: 'Ringkasan' },
  { id: 'categories', label: 'Kategori' },
  { id: 'trends', label: 'Tren' },
  { id: 'wallets', label: 'Dompet' },
  { id: 'compare', label: 'Bandingkan' },
  { id: 'wrapped', label: 'Wrapped' },
]

export type ReportTabsProps = {
  activeTab: ReportTab
  onSelectTab: (tab: ReportTab) => void
}

export function ReportTabs({ activeTab, onSelectTab }: ReportTabsProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()

    const step = e.key === 'ArrowRight' ? 1 : -1
    let nextIndex = (index + step + REPORT_TABS.length) % REPORT_TABS.length
    while (REPORT_TABS[nextIndex].disabled && nextIndex !== index) {
      nextIndex = (nextIndex + step + REPORT_TABS.length) % REPORT_TABS.length
    }

    const nextTab = REPORT_TABS[nextIndex]
    if (!nextTab.disabled) {
      onSelectTab(nextTab.id)
      tabRefs.current[nextIndex]?.focus()
    }
  }

  return (
    <div
      role="tablist"
      aria-label="Bagian laporan"
      className="flex items-center gap-1.5 overflow-x-auto rounded-[var(--radius-card)] border border-line bg-muted/50 p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {REPORT_TABS.map((tab, index) => {
        const selected = activeTab === tab.id
        return (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[index] = el
            }}
            type="button"
            role="tab"
            id={`report-tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`report-panel-${tab.id}`}
            aria-disabled={tab.disabled || undefined}
            disabled={tab.disabled}
            tabIndex={selected ? 0 : -1}
            onClick={() => {
              if (!tab.disabled) onSelectTab(tab.id)
            }}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              'inline-flex min-h-10 shrink-0 items-center gap-2 rounded-[var(--radius-control)] px-3.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
              selected
                ? 'bg-card font-semibold text-ink shadow-sm'
                : tab.disabled
                  ? 'cursor-not-allowed text-ink-soft/60'
                  : 'text-ink-soft hover:bg-card/60 hover:text-ink',
            )}
          >
            <span>{tab.label}</span>
            {tab.disabled && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-ink-soft">
                Segera Hadir
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

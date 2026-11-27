import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeaderMotion, SectionMotion } from '@/components/ui/Motion'
import { CategoriesTabSection } from '@/features/reports/CategoriesTabSection'
import { FinancialRhythmSection } from '@/features/reports/FinancialRhythmSection'
import { MoneyStorySection } from '@/features/reports/MoneyStorySection'
import { ReportPeriodBar } from '@/features/reports/ReportPeriodBar'
import { ReportTabs } from '@/features/reports/ReportTabs'
import { SummaryCardsSection } from '@/features/reports/SummaryCardsSection'
import { TrendsTabSection } from '@/features/reports/TrendsTabSection'
import {
  resolveReportPeriod,
  resolveReportTab,
} from '@/features/reports/periodUtils'
import type { ReportSummary, ReportTab } from '@/features/reports/types'
import { useReportData } from '@/features/reports/useReportData'

export function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const rawFrom = searchParams.get('from')
  const rawTo = searchParams.get('to')
  const rawTab = searchParams.get('tab')

  const { from, to } = resolveReportPeriod(rawFrom, rawTo)
  const activeTab = resolveReportTab(rawTab)

  // Normalize missing/invalid URL params once without clobbering history needlessly
  useEffect(() => {
    if (rawFrom !== from || rawTo !== to || rawTab !== activeTab) {
      setSearchParams({ from, to, tab: activeTab }, { replace: true })
    }
  }, [rawFrom, rawTo, rawTab, from, to, activeTab, setSearchParams])

  function handleChangePeriod(nextFrom: string, nextTo: string) {
    setSearchParams({ from: nextFrom, to: nextTo, tab: activeTab })
  }

  function handleSelectTab(nextTab: ReportTab) {
    setSearchParams({ from, to, tab: nextTab })
  }

  const summaryQuery = useReportData<ReportSummary>(
    '/reports/summary',
    { from, to },
    activeTab === 'summary',
  )

  return (
    <div className="space-y-5 pb-8">
      <PageHeaderMotion
        title="Laporan"
        subtitle="Pahami pemasukan, pengeluaran, dan cerita di balik angka Anda"
      />

      <ReportPeriodBar
        from={from}
        to={to}
        onChangePeriod={handleChangePeriod}
      />

      <ReportTabs activeTab={activeTab} onSelectTab={handleSelectTab} />

      <div
        role="tabpanel"
        id={`report-panel-${activeTab}`}
        aria-labelledby={`report-tab-${activeTab}`}
        className="space-y-6"
      >
        {activeTab === 'summary' && (
          <>
            <SectionMotion delay={0}>
              <SummaryCardsSection
                summary={summaryQuery.data}
                loading={summaryQuery.loading}
                error={summaryQuery.error}
                onRetry={summaryQuery.retry}
                from={from}
                to={to}
              />
            </SectionMotion>

            <SectionMotion delay={40}>
              <FinancialRhythmSection from={from} to={to} />
            </SectionMotion>

            <SectionMotion delay={80}>
              <MoneyStorySection
                from={from}
                to={to}
                summary={summaryQuery.data}
              />
            </SectionMotion>
          </>
        )}

        {activeTab === 'categories' && (
          <SectionMotion delay={0}>
            <CategoriesTabSection from={from} to={to} />
          </SectionMotion>
        )}

        {activeTab === 'trends' && (
          <SectionMotion delay={0}>
            <TrendsTabSection />
          </SectionMotion>
        )}
      </div>
    </div>
  )
}

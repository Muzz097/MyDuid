import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ApiError, api } from '@/lib/api'
import { cn } from '@/lib/cn'
import {
  buildReportFilename,
  exportCashflowCsv,
  exportCategoriesCsv,
  exportComparisonContributorsCsv,
  exportComparisonSummaryCsv,
  exportSummaryAndStoryCsv,
  exportTrendsMonthlyCsv,
  exportTrendsWeekdayCsv,
  exportWalletsCsv,
} from '@/features/reports/exportCsv'
import type { ReportPrintPayload } from '@/features/reports/ReportPrintDocument'
import type {
  ReportCashFlowBucket,
  ReportCategoriesResponse,
  ReportComparisonResponse,
  ReportStory,
  ReportSummary,
  ReportTab,
  ReportTrendsResponse,
  ReportWalletItem,
} from '@/features/reports/types'

export type ReportExportMenuProps = {
  from: string
  to: string
  activeTab: ReportTab
  trendsMonths: number
  onPreparePrint: (payload: ReportPrintPayload) => void
}

type ExportDatasetKey =
  | 'summary_story'
  | 'summary_cashflow'
  | 'categories_all'
  | 'trends_monthly'
  | 'trends_weekday'
  | 'wallets_all'
  | 'compare_summary'
  | 'compare_contributors'

type CsvMenuOption = {
  key: ExportDatasetKey
  label: string
  description: string
}

function getCsvOptionsForTab(
  activeTab: ReportTab,
  trendsMonths: number,
): CsvMenuOption[] {
  switch (activeTab) {
    case 'summary':
      return [
        {
          key: 'summary_story',
          label: 'Ekspor CSV — Ringkasan & Story',
          description: 'Metrik utama, pembanding, dan Money Story',
        },
        {
          key: 'summary_cashflow',
          label: 'Ekspor CSV — Arus Kas Harian',
          description: 'Pemasukan & pengeluaran harian dalam periode',
        },
      ]
    case 'categories':
      return [
        {
          key: 'categories_all',
          label: 'Ekspor CSV — Kategori',
          description: 'Seluruh kategori pengeluaran & pemasukan',
        },
      ]
    case 'trends':
      return [
        {
          key: 'trends_monthly',
          label: `Ekspor CSV — Tren ${trendsMonths} Bulan`,
          description: 'Pemasukan, pengeluaran, dan arus kas bulanan',
        },
        {
          key: 'trends_weekday',
          label: 'Ekspor CSV — Ritme Mingguan',
          description: 'Pola pengeluaran per hari dalam seminggu',
        },
      ]
    case 'wallets':
      return [
        {
          key: 'wallets_all',
          label: 'Ekspor CSV — Aktivitas Dompet',
          description: 'Masuk, keluar, transfer terpisah, dan saldo',
        },
      ]
    case 'compare':
      return [
        {
          key: 'compare_summary',
          label: 'Ekspor CSV — Perbandingan Periode',
          description: 'Periode ini vs pembanding dan selisihnya',
        },
        {
          key: 'compare_contributors',
          label: 'Ekspor CSV — Kontributor Kategori',
          description: 'Kategori pengeluaran dengan perubahan terbesar',
        },
      ]
    case 'wrapped':
      return []
  }
}

function formatJakartaTimestamp(): string {
  return (
    new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date()) + ' WIB'
  )
}

export function ReportExportMenu({
  from,
  to,
  activeTab,
  trendsMonths,
  onPreparePrint,
}: ReportExportMenuProps) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState<'csv' | 'pdf' | null>(null)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  async function handleExportCsv(dataset: ExportDatasetKey) {
    if (busy !== null) return
    setBusy('csv')
    setFeedback(null)
    setOpen(false)

    try {
      const qs = `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      let filename = ''

      switch (dataset) {
        case 'summary_story': {
          const [summaryRes, storyRes] = await Promise.all([
            api<{ data: ReportSummary }>(`/reports/summary?${qs}`),
            api<{ data: ReportStory }>(`/reports/story?${qs}`).catch(() => ({
              data: null,
            })),
          ])
          filename = exportSummaryAndStoryCsv(
            from,
            to,
            summaryRes.data,
            storyRes.data,
          )
          break
        }
        case 'summary_cashflow': {
          const res = await api<{ data: ReportCashFlowBucket[] }>(
            `/reports/cashflow?${qs}&granularity=day`,
          )
          filename = exportCashflowCsv(from, to, 'day', res.data)
          break
        }
        case 'categories_all': {
          const [expRes, incRes] = await Promise.all([
            api<{ data: ReportCategoriesResponse }>(
              `/reports/categories?${qs}&type=expense`,
            ),
            api<{ data: ReportCategoriesResponse }>(
              `/reports/categories?${qs}&type=income`,
            ),
          ])
          filename = exportCategoriesCsv(from, to, expRes.data, incRes.data)
          break
        }
        case 'trends_monthly': {
          const res = await api<{ data: ReportTrendsResponse }>(
            `/reports/trends?months=${trendsMonths}`,
          )
          filename = exportTrendsMonthlyCsv(trendsMonths, res.data)
          break
        }
        case 'trends_weekday': {
          const res = await api<{ data: ReportTrendsResponse }>(
            `/reports/trends?months=${trendsMonths}`,
          )
          filename = exportTrendsWeekdayCsv(trendsMonths, res.data)
          break
        }
        case 'wallets_all': {
          const res = await api<{ data: ReportWalletItem[] }>(
            `/reports/wallets?${qs}`,
          )
          filename = exportWalletsCsv(from, to, res.data)
          break
        }
        case 'compare_summary': {
          const res = await api<{ data: ReportComparisonResponse }>(
            `/reports/comparison?${qs}`,
          )
          filename = exportComparisonSummaryCsv(from, to, res.data)
          break
        }
        case 'compare_contributors': {
          const res = await api<{ data: ReportComparisonResponse }>(
            `/reports/comparison?${qs}`,
          )
          filename = exportComparisonContributorsCsv(from, to, res.data)
          break
        }
      }

      setFeedback({
        type: 'success',
        message: `File CSV berhasil disiapkan: ${filename}`,
      })
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Gagal mengekspor data CSV. Silakan coba lagi.'
      setFeedback({ type: 'error', message })
    } finally {
      setBusy(null)
    }
  }

  async function handleExportPdf() {
    if (busy !== null) return
    setBusy('pdf')
    setFeedback(null)
    setOpen(false)

    try {
      const qs = `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      const [
        summaryRes,
        storyRes,
        expCatRes,
        incCatRes,
        trendsRes,
        walletsRes,
        comparisonRes,
      ] = await Promise.all([
        api<{ data: ReportSummary }>(`/reports/summary?${qs}`),
        api<{ data: ReportStory }>(`/reports/story?${qs}`).catch(() => ({
          data: null,
        })),
        api<{ data: ReportCategoriesResponse }>(
          `/reports/categories?${qs}&type=expense`,
        ),
        api<{ data: ReportCategoriesResponse }>(
          `/reports/categories?${qs}&type=income`,
        ),
        api<{ data: ReportTrendsResponse }>(
          `/reports/trends?months=${trendsMonths}`,
        ),
        api<{ data: ReportWalletItem[] }>(`/reports/wallets?${qs}`),
        api<{ data: ReportComparisonResponse }>(`/reports/comparison?${qs}`),
      ])

      const payload: ReportPrintPayload = {
        from,
        to,
        generatedAt: formatJakartaTimestamp(),
        trendsMonths,
        summary: summaryRes.data,
        story: storyRes.data,
        categoriesExpense: expCatRes.data,
        categoriesIncome: incCatRes.data,
        trends: trendsRes.data,
        wallets: walletsRes.data,
        comparison: comparisonRes.data,
      }

      onPreparePrint(payload)
      setFeedback({
        type: 'success',
        message:
          'Dokumen PDF siap. Pada dialog cetak browser, pilih "Save as PDF" atau "Simpan sebagai PDF".',
      })

      const previousTitle = document.title
      const pdfTitle = buildReportFilename('Keuangan', from, to, 'pdf').replace(
        /\.pdf$/i,
        '',
      )

      const restoreTitle = () => {
        document.title = previousTitle
        window.removeEventListener('afterprint', restoreTitle)
      }
      window.addEventListener('afterprint', restoreTitle)

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          document.title = pdfTitle
          window.print()
          // Fallback restore in case browser does not fire afterprint synchronously
          window.setTimeout(restoreTitle, 3000)
        })
      })
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Gagal menyiapkan dokumen PDF. Silakan coba lagi.'
      setFeedback({ type: 'error', message })
    } finally {
      setBusy(null)
    }
  }

  const csvOptions = getCsvOptionsForTab(activeTab, trendsMonths)

  return (
    <div ref={containerRef} className="relative flex flex-col items-end gap-2 print:hidden">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={busy !== null}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((prev) => !prev)}
        className="min-h-11 gap-2 px-3.5"
      >
        {busy !== null ? (
          <Loader2 size={16} className="animate-spin" aria-hidden />
        ) : (
          <Download size={16} aria-hidden />
        )}
        <span>
          {busy === 'csv'
            ? 'Menyiapkan CSV...'
            : busy === 'pdf'
              ? 'Menyiapkan PDF...'
              : 'Ekspor'}
        </span>
        <ChevronDown
          size={15}
          className={cn('transition-transform duration-150', open && 'rotate-180')}
          aria-hidden
        />
      </Button>

      {open && (
        <div
          role="menu"
          aria-label="Pilihan ekspor laporan"
          className="absolute right-0 top-12 z-40 w-72 rounded-[var(--radius-card)] border border-line bg-card p-1.5 shadow-lg sm:w-80"
        >
          <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
            Ekspor CSV (Tab Aktif)
          </div>
          {csvOptions.map((opt) => (
            <button
              key={opt.key}
              type="button"
              role="menuitem"
              disabled={busy !== null}
              onClick={() => void handleExportCsv(opt.key)}
              className="flex w-full items-start gap-2.5 rounded-[var(--radius-control)] px-2.5 py-2.5 text-left transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:opacity-50"
            >
              <FileSpreadsheet
                size={17}
                className="mt-0.5 shrink-0 text-income-600 dark:text-income-400"
                aria-hidden
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink">{opt.label}</p>
                <p className="text-[11px] text-ink-soft">{opt.description}</p>
              </div>
            </button>
          ))}

          <div className="my-1.5 border-t border-line" />

          <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
            Dokumen Lengkap
          </div>
          <button
            type="button"
            role="menuitem"
            disabled={busy !== null}
            onClick={() => void handleExportPdf()}
            className="flex w-full items-start gap-2.5 rounded-[var(--radius-control)] px-2.5 py-2.5 text-left transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:opacity-50"
          >
            <FileText
              size={17}
              className="mt-0.5 shrink-0 text-brand-600 dark:text-brand-400"
              aria-hidden
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ink">Ekspor PDF</p>
              <p className="text-[11px] text-ink-soft">
                Cetak atau pilih &ldquo;Save as PDF&rdquo; untuk laporan lengkap
              </p>
            </div>
          </button>
        </div>
      )}

      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={cn(
            'flex max-w-sm items-start gap-2 rounded-[var(--radius-control)] border px-3 py-2 text-xs',
            feedback.type === 'error'
              ? 'border-expense-400/40 bg-expense-50 text-expense-600 dark:bg-expense-500/10 dark:text-expense-400'
              : 'border-income-400/40 bg-income-50 text-income-700 dark:bg-income-500/10 dark:text-income-400',
          )}
        >
          {feedback.type === 'error' ? (
            <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden />
          ) : (
            <CheckCircle2 size={15} className="mt-0.5 shrink-0" aria-hidden />
          )}
          <span className="flex-1 leading-relaxed">{feedback.message}</span>
          <button
            type="button"
            aria-label="Tutup notifikasi ekspor"
            onClick={() => setFeedback(null)}
            className="shrink-0 rounded p-0.5 opacity-70 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            <X size={13} aria-hidden />
          </button>
        </div>
      )}
    </div>
  )
}

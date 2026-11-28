import { todayJakarta } from '@/lib/date'
import type {
  CashFlowGranularity,
  ComparisonBasis,
  ReportCashFlowBucket,
  ReportCategoriesResponse,
  ReportComparisonResponse,
  ReportStory,
  ReportSummary,
  ReportTrendsResponse,
  ReportWalletItem,
} from '@/features/reports/types'

const UTF8_BOM = '\uFEFF'

const WEEKDAY_NAMES_ID: Record<string, string> = {
  monday: 'Senin',
  tuesday: 'Selasa',
  wednesday: 'Rabu',
  thursday: 'Kamis',
  friday: 'Jumat',
  saturday: 'Sabtu',
  sunday: 'Minggu',
}

function comparisonBasisText(basis: ComparisonBasis): string {
  switch (basis) {
    case 'previous_month':
      return 'Bulan sebelumnya penuh'
    case 'same_days_previous_month':
      return 'Tanggal sama bulan sebelumnya'
    case 'previous_equal_period':
      return 'Periode sebelumnya dengan durasi sama'
  }
}

function granularityText(granularity: CashFlowGranularity): string {
  switch (granularity) {
    case 'day':
      return 'Harian'
    case 'week':
      return 'Mingguan'
    case 'month':
      return 'Bulanan'
  }
}

export function sanitizeFilenamePart(value: string): string {
  return value
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function buildReportFilename(
  label: string,
  from: string,
  to: string,
  ext: 'csv' | 'pdf',
): string {
  const safeLabel = sanitizeFilenamePart(label)
  const safeFrom = sanitizeFilenamePart(from)
  const safeTo = sanitizeFilenamePart(to)
  return `MyDuid-Laporan-${safeLabel}-${safeFrom}_sd_${safeTo}.${ext}`
}

export type CsvCell = string | number | null | undefined

export function escapeCsvCell(value: CsvCell): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return ''
    return String(value)
  }
  const str = String(value)
  if (
    str.includes(',') ||
    str.includes('"') ||
    str.includes('\n') ||
    str.includes('\r')
  ) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function buildCsvContent(
  headers: string[],
  rows: CsvCell[][],
): string {
  const lines: string[] = [headers.map(escapeCsvCell).join(',')]
  for (const row of rows) {
    lines.push(row.map(escapeCsvCell).join(','))
  }
  return `${UTF8_BOM}${lines.join('\r\n')}\r\n`
}

export function triggerCsvDownload(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function exportSummaryAndStoryCsv(
  from: string,
  to: string,
  summary: ReportSummary,
  story: ReportStory | null,
): string {
  const headers = ['bagian', 'metrik', 'nilai', 'satuan_atau_catatan']
  const rows: CsvCell[][] = [
    ['Periode', 'Tanggal Mulai', from, 'Asia/Jakarta'],
    ['Periode', 'Tanggal Akhir', to, 'Asia/Jakarta'],
    ['Ringkasan', 'Total Pemasukan', summary.income, 'IDR'],
    ['Ringkasan', 'Total Pengeluaran', summary.expense, 'IDR'],
    ['Ringkasan', 'Arus Kas Bersih', summary.net, 'IDR'],
    ['Ringkasan', 'Jumlah Transaksi', summary.transaction_count, 'transaksi'],
    ['Ringkasan', 'Porsi Pemasukan Terpakai', summary.income_used_percent, 'persen'],
    ['Ringkasan', 'Porsi Pemasukan Tersisa', summary.income_remaining_percent, 'persen'],
    ['Ringkasan', 'Status Arus Kas', summary.cash_flow, 'positive/negative/zero'],
    ['Pembanding', 'Basis Pembanding', comparisonBasisText(summary.comparison_basis), `${summary.previous.from} s.d. ${summary.previous.to}`],
    ['Pembanding', 'Pemasukan Periode Pembanding', summary.previous.income, 'IDR'],
    ['Pembanding', 'Pengeluaran Periode Pembanding', summary.previous.expense, 'IDR'],
    ['Pembanding', 'Arus Kas Bersih Pembanding', summary.previous.net, 'IDR'],
    ['Pembanding', 'Perubahan Pemasukan', summary.previous.income_change_percent, 'persen'],
    ['Pembanding', 'Perubahan Pengeluaran', summary.previous.expense_change_percent, 'persen'],
    ['Pembanding', 'Perubahan Arus Kas Bersih', summary.previous.net_change_percent, 'persen'],
  ]

  if (story) {
    rows.push([
      'Money Story',
      'Kategori Pengeluaran Terbesar',
      story.top_expense_category ? story.top_expense_category.amount : null,
      story.top_expense_category ? story.top_expense_category.name : 'Tidak ada pengeluaran',
    ])
    rows.push([
      'Money Story',
      'Hari Pengeluaran Terbesar',
      story.busiest_day ? story.busiest_day.amount : null,
      story.busiest_day ? story.busiest_day.date : 'Tidak ada pengeluaran',
    ])
    rows.push([
      'Money Story',
      'Transaksi Pengeluaran Terbesar',
      story.largest_expense ? story.largest_expense.amount : null,
      story.largest_expense
        ? `${story.largest_expense.transaction_date}${story.largest_expense.category_name ? ` - ${story.largest_expense.category_name}` : ''}${story.largest_expense.notes ? ` (${story.largest_expense.notes})` : ''}`
        : 'Tidak ada pengeluaran',
    ])
    rows.push([
      'Money Story',
      'Perubahan Pengeluaran vs Pembanding',
      story.expense_change?.percent ?? null,
      story.expense_change ? `Pembanding: ${story.expense_change.previous_amount} IDR` : 'Tidak ada pembanding',
    ])
  }

  const filename = buildReportFilename('Ringkasan', from, to, 'csv')
  triggerCsvDownload(filename, buildCsvContent(headers, rows))
  return filename
}

export function exportCashflowCsv(
  from: string,
  to: string,
  granularity: CashFlowGranularity,
  buckets: ReportCashFlowBucket[],
): string {
  const headers = [
    'tanggal_dari',
    'tanggal_sampai',
    'pemasukan_idr',
    'pengeluaran_idr',
    'arus_kas_bersih_idr',
    'granularitas',
  ]
  const granLabel = granularityText(granularity)
  const rows: CsvCell[][] = buckets.map((b) => [
    b.from,
    b.to,
    b.income,
    b.expense,
    b.income - b.expense,
    granLabel,
  ])

  const filename = buildReportFilename(`Arus-Kas-${granLabel}`, from, to, 'csv')
  triggerCsvDownload(filename, buildCsvContent(headers, rows))
  return filename
}

export function exportCategoriesCsv(
  from: string,
  to: string,
  expense: ReportCategoriesResponse,
  income: ReportCategoriesResponse,
): string {
  const headers = [
    'tipe',
    'peringkat_nominal',
    'nama_kategori',
    'total_nominal_idr',
    'jumlah_transaksi',
    'rata_rata_idr',
    'porsi_persen',
    'perubahan_vs_pembanding_persen',
  ]

  const rows: CsvCell[][] = [
    ...expense.by_amount.map((item, idx) => [
      'Pengeluaran',
      idx + 1,
      item.name,
      item.amount,
      item.count,
      item.average,
      item.share_percent,
      item.change_percent,
    ]),
    ...income.by_amount.map((item, idx) => [
      'Pemasukan',
      idx + 1,
      item.name,
      item.amount,
      item.count,
      item.average,
      item.share_percent,
      item.change_percent,
    ]),
  ]

  const filename = buildReportFilename('Kategori', from, to, 'csv')
  triggerCsvDownload(filename, buildCsvContent(headers, rows))
  return filename
}

export function exportTrendsMonthlyCsv(
  months: number,
  trends: ReportTrendsResponse,
): string {
  const headers = [
    'bulan',
    'pemasukan_idr',
    'pengeluaran_idr',
    'arus_kas_bersih_idr',
    'status_bulan',
  ]
  const rows: CsvCell[][] = trends.monthly.map((m) => [
    m.month,
    m.income,
    m.expense,
    m.income - m.expense,
    m.is_partial ? 'Berjalan' : 'Penuh',
  ])

  const today = todayJakarta()
  const firstMonth = trends.monthly[0]?.month ?? today.slice(0, 7)
  const lastMonth = trends.monthly[trends.monthly.length - 1]?.month ?? today.slice(0, 7)
  const filename = buildReportFilename(`Tren-${months}-Bulan`, firstMonth, lastMonth, 'csv')
  triggerCsvDownload(filename, buildCsvContent(headers, rows))
  return filename
}

export function exportTrendsWeekdayCsv(
  months: number,
  trends: ReportTrendsResponse,
): string {
  const headers = [
    'urutan_hari',
    'hari',
    'total_pengeluaran_idr',
    'jumlah_transaksi',
    'rata_rata_per_hari_idr',
  ]
  const rows: CsvCell[][] = trends.weekday_rhythm.map((w) => [
    w.iso_weekday,
    WEEKDAY_NAMES_ID[w.key] ?? w.key,
    w.total,
    w.count,
    w.average_per_occurrence,
  ])

  const today = todayJakarta()
  const firstMonth = trends.monthly[0]?.month ?? today.slice(0, 7)
  const lastMonth = trends.monthly[trends.monthly.length - 1]?.month ?? today.slice(0, 7)
  const filename = buildReportFilename(`Ritme-Mingguan-${months}-Bulan`, firstMonth, lastMonth, 'csv')
  triggerCsvDownload(filename, buildCsvContent(headers, rows))
  return filename
}

export function exportWalletsCsv(
  from: string,
  to: string,
  wallets: ReportWalletItem[],
): string {
  const headers = [
    'nama_dompet',
    'status',
    'pemasukan_idr',
    'pengeluaran_idr',
    'transfer_masuk_idr',
    'transfer_keluar_idr',
    'jumlah_transaksi',
    'saldo_saat_ini_idr',
  ]
  const rows: CsvCell[][] = wallets.map((w) => [
    w.name,
    w.is_active ? 'Aktif' : 'Diarsipkan',
    w.income,
    w.expense,
    w.transfer_in,
    w.transfer_out,
    w.transaction_count,
    w.balance,
  ])

  const filename = buildReportFilename('Dompet', from, to, 'csv')
  triggerCsvDownload(filename, buildCsvContent(headers, rows))
  return filename
}

export function exportComparisonSummaryCsv(
  from: string,
  to: string,
  comparison: ReportComparisonResponse,
): string {
  const headers = [
    'metrik',
    'periode_ini_dari',
    'periode_ini_sampai',
    'nilai_periode_ini_idr',
    'pembanding_dari',
    'pembanding_sampai',
    'nilai_pembanding_idr',
    'selisih_idr',
    'perubahan_persen',
    'basis_pembanding',
  ]
  const basis = comparisonBasisText(comparison.comparison.basis)
  const rows: CsvCell[][] = [
    [
      'Pemasukan',
      comparison.period.from,
      comparison.period.to,
      comparison.period.income,
      comparison.comparison.from,
      comparison.comparison.to,
      comparison.comparison.income,
      comparison.period.income - comparison.comparison.income,
      comparison.income_change_percent,
      basis,
    ],
    [
      'Pengeluaran',
      comparison.period.from,
      comparison.period.to,
      comparison.period.expense,
      comparison.comparison.from,
      comparison.comparison.to,
      comparison.comparison.expense,
      comparison.period.expense - comparison.comparison.expense,
      comparison.expense_change_percent,
      basis,
    ],
    [
      'Arus Kas Bersih',
      comparison.period.from,
      comparison.period.to,
      comparison.period.net,
      comparison.comparison.from,
      comparison.comparison.to,
      comparison.comparison.net,
      comparison.period.net - comparison.comparison.net,
      comparison.net_change_percent,
      basis,
    ],
  ]

  const filename = buildReportFilename('Perbandingan-Periode', from, to, 'csv')
  triggerCsvDownload(filename, buildCsvContent(headers, rows))
  return filename
}

export function exportComparisonContributorsCsv(
  from: string,
  to: string,
  comparison: ReportComparisonResponse,
): string {
  const headers = [
    'kategori',
    'periode_ini_idr',
    'periode_pembanding_idr',
    'selisih_idr',
    'arah_perubahan',
  ]
  const rows: CsvCell[][] = comparison.contributors.map((c) => [
    c.name,
    c.current,
    c.previous,
    c.delta,
    c.direction === 'up' ? 'Naik' : 'Turun',
  ])

  const filename = buildReportFilename('Kontributor-Perubahan', from, to, 'csv')
  triggerCsvDownload(filename, buildCsvContent(headers, rows))
  return filename
}

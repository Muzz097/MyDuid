import { formatRupiah } from '@/lib/money'
import {
  comparisonBasisLabel,
  formatDateRangeId,
  formatFullDateId,
} from '@/features/reports/periodUtils'
import type {
  ReportCategoriesResponse,
  ReportComparisonResponse,
  ReportStory,
  ReportSummary,
  ReportTrendsResponse,
  ReportWalletItem,
} from '@/features/reports/types'

export type ReportPrintPayload = {
  from: string
  to: string
  generatedAt: string
  trendsMonths: number
  summary: ReportSummary
  story: ReportStory | null
  categoriesExpense: ReportCategoriesResponse
  categoriesIncome: ReportCategoriesResponse
  trends: ReportTrendsResponse
  wallets: ReportWalletItem[]
  comparison: ReportComparisonResponse
}

const WEEKDAY_NAMES_ID: Record<string, string> = {
  monday: 'Senin',
  tuesday: 'Selasa',
  wednesday: 'Rabu',
  thursday: 'Kamis',
  friday: 'Jumat',
  saturday: 'Sabtu',
  sunday: 'Minggu',
}

function formatMonthLongId(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—'
  if (value > 0) return `+${value}%`
  return `${value}%`
}

function formatSignedRupiah(value: number): string {
  if (value > 0) return `+${formatRupiah(value)}`
  return formatRupiah(value)
}

export function ReportPrintDocument({ payload }: { payload: ReportPrintPayload | null }) {
  if (!payload) return null

  const {
    from,
    to,
    generatedAt,
    trendsMonths,
    summary,
    story,
    categoriesExpense,
    categoriesIncome,
    trends,
    wallets,
    comparison,
  } = payload

  const basisText = comparisonBasisLabel(
    summary.comparison_basis,
    summary.previous.from,
    summary.previous.to,
  )

  return (
    <article
      aria-label="Dokumen cetak laporan keuangan MyDuid"
      className="print-only-document hidden bg-white text-slate-900 print:block"
    >
      {/* A. Document Header */}
      <header className="mb-5 border-b-2 border-slate-900 pb-4 break-inside-avoid">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-slate-900 text-base font-bold text-white">
              M
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-slate-900">
                MyDuid
              </p>
              <p className="text-[11px] text-slate-600">
                Personal Finance — Your Money, Understood
              </p>
            </div>
          </div>

          <div className="text-right">
            <h1 className="text-lg font-bold tracking-tight text-slate-900">
              Laporan Keuangan
            </h1>
            <p className="text-xs font-medium text-slate-700">
              Periode: {formatDateRangeId(from, to)} ({from} s.d. {to})
            </p>
            <p className="text-[11px] text-slate-500">
              Dibuat pada: {generatedAt}
            </p>
          </div>
        </div>
      </header>

      {/* B. Ringkasan Keuangan */}
      <section className="mb-6 break-inside-avoid">
        <h2 className="mb-2.5 text-sm font-bold uppercase tracking-wider text-slate-700 break-after-avoid">
          Ringkasan Keuangan
        </h2>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-slate-300 p-3">
            <p className="text-[11px] font-medium text-slate-600">Total Pemasukan</p>
            <p className="mt-1 text-base font-bold tabular-nums text-emerald-700">
              {formatRupiah(summary.income)}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500 tabular-nums">
              {formatPercent(summary.previous.income_change_percent)} {basisText}
            </p>
          </div>

          <div className="rounded-lg border border-slate-300 p-3">
            <p className="text-[11px] font-medium text-slate-600">Total Pengeluaran</p>
            <p className="mt-1 text-base font-bold tabular-nums text-rose-700">
              {formatRupiah(summary.expense)}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500 tabular-nums">
              {formatPercent(summary.previous.expense_change_percent)} {basisText}
            </p>
          </div>

          <div className="rounded-lg border-2 border-slate-800 bg-slate-50 p-3">
            <p className="text-[11px] font-semibold text-slate-700">Arus Kas Bersih</p>
            <p
              className={`mt-1 text-base font-bold tabular-nums ${
                summary.net >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {formatSignedRupiah(summary.net)}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-600 tabular-nums">
              {summary.transaction_count} transaksi • {formatPercent(summary.previous.net_change_percent)}
            </p>
          </div>
        </div>

        {summary.income > 0 && summary.income_used_percent !== null && (
          <p className="mt-2 text-xs text-slate-600">
            Porsi pemasukan yang digunakan: <strong className="tabular-nums">{summary.income_used_percent}%</strong>
            {summary.income_remaining_percent !== null && (
              <>
                {' '}• Tersisa: <strong className="tabular-nums">{summary.income_remaining_percent}%</strong>
              </>
            )}
          </p>
        )}
      </section>

      {/* C1. Insight Money Story */}
      <section className="mb-6 break-inside-avoid">
        <h2 className="mb-2.5 text-sm font-bold uppercase tracking-wider text-slate-700 break-after-avoid">
          Insight Money Story
        </h2>
        {story ? (
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="rounded-lg border border-slate-300 p-3">
              <p className="text-[11px] font-medium text-slate-500">
                Kategori Pengeluaran Terbesar
              </p>
              {story.top_expense_category ? (
                <p className="mt-1 font-semibold text-slate-900 tabular-nums">
                  {story.top_expense_category.name} — {formatRupiah(story.top_expense_category.amount)}
                </p>
              ) : (
                <p className="mt-1 text-slate-500">Belum ada pengeluaran pada periode ini.</p>
              )}
            </div>

            <div className="rounded-lg border border-slate-300 p-3">
              <p className="text-[11px] font-medium text-slate-500">
                Hari Pengeluaran Terpadat
              </p>
              {story.busiest_day ? (
                <p className="mt-1 font-semibold text-slate-900 tabular-nums">
                  {formatFullDateId(story.busiest_day.date)} — {formatRupiah(story.busiest_day.amount)}
                </p>
              ) : (
                <p className="mt-1 text-slate-500">Belum ada pengeluaran pada periode ini.</p>
              )}
            </div>

            <div className="rounded-lg border border-slate-300 p-3">
              <p className="text-[11px] font-medium text-slate-500">
                Pengeluaran Tunggal Terbesar
              </p>
              {story.largest_expense ? (
                <p className="mt-1 font-semibold text-slate-900 tabular-nums">
                  {formatRupiah(story.largest_expense.amount)} (
                  {story.largest_expense.category_name ?? 'Tanpa kategori'},{' '}
                  {formatFullDateId(story.largest_expense.transaction_date)})
                </p>
              ) : (
                <p className="mt-1 text-slate-500">Belum ada pengeluaran pada periode ini.</p>
              )}
            </div>

            <div className="rounded-lg border border-slate-300 p-3">
              <p className="text-[11px] font-medium text-slate-500">
                Perubahan Pengeluaran
              </p>
              {story.expense_change ? (
                <p className="mt-1 font-semibold text-slate-900 tabular-nums">
                  {formatPercent(story.expense_change.percent)} (pembanding:{' '}
                  {formatRupiah(story.expense_change.previous_amount)})
                </p>
              ) : (
                <p className="mt-1 text-slate-500">Belum ada data pembanding yang cukup.</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500">Ringkasan narasi belum tersedia untuk periode ini.</p>
        )}
      </section>

      {/* C2. Ringkasan Kategori */}
      <section className="mb-6">
        <h2 className="mb-2.5 text-sm font-bold uppercase tracking-wider text-slate-700 break-after-avoid">
          Ringkasan Kategori
        </h2>

        <div className="space-y-4">
          {/* Pengeluaran */}
          <div>
            <h3 className="mb-1.5 text-xs font-semibold text-slate-800 break-after-avoid">
              Kategori Pengeluaran
            </h3>
            {categoriesExpense.by_amount.length > 0 ? (
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-400 bg-slate-100 text-left text-[11px] text-slate-700">
                    <th className="px-2 py-1.5 font-semibold">Kategori</th>
                    <th className="px-2 py-1.5 text-right font-semibold">Total</th>
                    <th className="px-2 py-1.5 text-right font-semibold">Transaksi</th>
                    <th className="px-2 py-1.5 text-right font-semibold">Rata-rata</th>
                    <th className="px-2 py-1.5 text-right font-semibold">Porsi</th>
                    <th className="px-2 py-1.5 text-right font-semibold">Perubahan</th>
                  </tr>
                </thead>
                <tbody>
                  {categoriesExpense.by_amount.map((c) => (
                    <tr key={c.category_id} className="border-b border-slate-200 break-inside-avoid">
                      <td className="px-2 py-1.5 font-medium text-slate-900">{c.name}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-rose-700">
                        {formatRupiah(c.amount)}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-slate-700">
                        {c.count}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-slate-700">
                        {formatRupiah(c.average)}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-slate-700">
                        {c.share_percent}%
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-slate-600">
                        {formatPercent(c.change_percent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-xs text-slate-500">Tidak ada pengeluaran pada periode ini.</p>
            )}
          </div>

          {/* Pemasukan */}
          <div>
            <h3 className="mb-1.5 text-xs font-semibold text-slate-800 break-after-avoid">
              Kategori Pemasukan
            </h3>
            {categoriesIncome.by_amount.length > 0 ? (
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-400 bg-slate-100 text-left text-[11px] text-slate-700">
                    <th className="px-2 py-1.5 font-semibold">Kategori</th>
                    <th className="px-2 py-1.5 text-right font-semibold">Total</th>
                    <th className="px-2 py-1.5 text-right font-semibold">Transaksi</th>
                    <th className="px-2 py-1.5 text-right font-semibold">Rata-rata</th>
                    <th className="px-2 py-1.5 text-right font-semibold">Porsi</th>
                    <th className="px-2 py-1.5 text-right font-semibold">Perubahan</th>
                  </tr>
                </thead>
                <tbody>
                  {categoriesIncome.by_amount.map((c) => (
                    <tr key={c.category_id} className="border-b border-slate-200 break-inside-avoid">
                      <td className="px-2 py-1.5 font-medium text-slate-900">{c.name}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-emerald-700">
                        {formatRupiah(c.amount)}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-slate-700">
                        {c.count}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-slate-700">
                        {formatRupiah(c.average)}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-slate-700">
                        {c.share_percent}%
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-slate-600">
                        {formatPercent(c.change_percent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-xs text-slate-500">Tidak ada pemasukan pada periode ini.</p>
            )}
          </div>
        </div>
      </section>

      {/* C3. Tren Pemasukan & Pengeluaran */}
      <section className="mb-6">
        <h2 className="mb-2.5 text-sm font-bold uppercase tracking-wider text-slate-700 break-after-avoid">
          Tren Pemasukan &amp; Pengeluaran ({trendsMonths} Bulan Terakhir)
        </h2>

        {trends.monthly.length > 0 ? (
          <>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-400 bg-slate-100 text-left text-[11px] text-slate-700">
                  <th className="px-2 py-1.5 font-semibold">Bulan</th>
                  <th className="px-2 py-1.5 text-right font-semibold">Pemasukan</th>
                  <th className="px-2 py-1.5 text-right font-semibold">Pengeluaran</th>
                  <th className="px-2 py-1.5 text-right font-semibold">Arus Kas Bersih</th>
                  <th className="px-2 py-1.5 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {trends.monthly.map((m) => {
                  const net = m.income - m.expense
                  return (
                    <tr key={m.month} className="border-b border-slate-200 break-inside-avoid">
                      <td className="px-2 py-1.5 font-medium text-slate-900">
                        {formatMonthLongId(m.month)}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-emerald-700">
                        {formatRupiah(m.income)}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-rose-700">
                        {formatRupiah(m.expense)}
                      </td>
                      <td
                        className={`px-2 py-1.5 text-right font-medium tabular-nums ${
                          net >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {formatSignedRupiah(net)}
                      </td>
                      <td className="px-2 py-1.5 text-right text-slate-600">
                        {m.is_partial ? 'Berjalan' : 'Penuh'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {trends.average_expense !== null && (
              <p className="mt-2 text-[11px] text-slate-600">
                Rata-rata pengeluaran bulanan:{' '}
                <strong className="tabular-nums">{formatRupiah(trends.average_expense)}</strong>
                {trends.highest_expense_month && (
                  <>
                    {' '}• Tertinggi: {formatMonthLongId(trends.highest_expense_month.month)} (
                    <span className="tabular-nums">
                      {formatRupiah(trends.highest_expense_month.expense)}
                    </span>
                    )
                  </>
                )}
              </p>
            )}

            {trends.weekday_rhythm.length > 0 && (
              <div className="mt-3 break-inside-avoid">
                <h3 className="mb-1.5 text-xs font-semibold text-slate-800">
                  Ritme Pengeluaran per Hari
                </h3>
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-400 bg-slate-100 text-left text-[11px] text-slate-700">
                      <th className="px-2 py-1.5 font-semibold">Hari</th>
                      <th className="px-2 py-1.5 text-right font-semibold">Total</th>
                      <th className="px-2 py-1.5 text-right font-semibold">Transaksi</th>
                      <th className="px-2 py-1.5 text-right font-semibold">Rata-rata / Hari</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trends.weekday_rhythm.map((w) => (
                      <tr key={w.iso_weekday} className="border-b border-slate-200 break-inside-avoid">
                        <td className="px-2 py-1 font-medium text-slate-900">
                          {WEEKDAY_NAMES_ID[w.key] ?? w.key}
                        </td>
                        <td className="px-2 py-1 text-right tabular-nums text-slate-800">
                          {formatRupiah(w.total)}
                        </td>
                        <td className="px-2 py-1 text-right tabular-nums text-slate-700">
                          {w.count}
                        </td>
                        <td className="px-2 py-1 text-right tabular-nums text-slate-700">
                          {formatRupiah(w.average_per_occurrence)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <p className="text-xs text-slate-500">Belum ada data tren bulanan.</p>
        )}
      </section>

      {/* C4. Aktivitas Dompet */}
      <section className="mb-6">
        <h2 className="mb-2.5 text-sm font-bold uppercase tracking-wider text-slate-700 break-after-avoid">
          Aktivitas Dompet
        </h2>
        {wallets.length > 0 ? (
          <>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-400 bg-slate-100 text-left text-[11px] text-slate-700">
                  <th className="px-2 py-1.5 font-semibold">Dompet</th>
                  <th className="px-2 py-1.5 text-right font-semibold">Pemasukan</th>
                  <th className="px-2 py-1.5 text-right font-semibold">Pengeluaran</th>
                  <th className="px-2 py-1.5 text-right font-semibold">Transfer Masuk</th>
                  <th className="px-2 py-1.5 text-right font-semibold">Transfer Keluar</th>
                  <th className="px-2 py-1.5 text-right font-semibold">Transaksi</th>
                  <th className="px-2 py-1.5 text-right font-semibold">Saldo Saat Ini*</th>
                </tr>
              </thead>
              <tbody>
                {wallets.map((w) => (
                  <tr key={w.wallet_id} className="border-b border-slate-200 break-inside-avoid">
                    <td className="px-2 py-1.5 font-medium text-slate-900">
                      {w.name}
                      {!w.is_active && (
                        <span className="ml-1 text-[10px] text-slate-500">(Diarsipkan)</span>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-emerald-700">
                      {formatRupiah(w.income)}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-rose-700">
                      {formatRupiah(w.expense)}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-slate-700">
                      {formatRupiah(w.transfer_in)}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-slate-700">
                      {formatRupiah(w.transfer_out)}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-slate-700">
                      {w.transaction_count}
                    </td>
                    <td className="px-2 py-1.5 text-right font-semibold tabular-nums text-slate-900">
                      {formatRupiah(w.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-1.5 text-[10px] text-slate-500">
              * Saldo saat ini mencerminkan saldo terkini seluruh waktu. Transfer internal dipisahkan dan tidak dihitung sebagai pemasukan atau pengeluaran.
            </p>
          </>
        ) : (
          <p className="text-xs text-slate-500">Belum ada aktivitas dompet pada periode ini.</p>
        )}
      </section>

      {/* C5. Perbandingan Periode */}
      <section className="mb-6 break-inside-avoid">
        <h2 className="mb-2.5 text-sm font-bold uppercase tracking-wider text-slate-700 break-after-avoid">
          Perbandingan Periode
        </h2>
        <p className="mb-2 text-[11px] text-slate-600">
          Periode ini ({formatDateRangeId(comparison.period.from, comparison.period.to)}){' '}
          {comparisonBasisLabel(
            comparison.comparison.basis,
            comparison.comparison.from,
            comparison.comparison.to,
          )}
        </p>

        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-400 bg-slate-100 text-left text-[11px] text-slate-700">
              <th className="px-2 py-1.5 font-semibold">Metrik</th>
              <th className="px-2 py-1.5 text-right font-semibold">Periode Ini</th>
              <th className="px-2 py-1.5 text-right font-semibold">Pembanding</th>
              <th className="px-2 py-1.5 text-right font-semibold">Selisih</th>
              <th className="px-2 py-1.5 text-right font-semibold">Perubahan</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="px-2 py-1.5 font-medium text-slate-900">Pemasukan</td>
              <td className="px-2 py-1.5 text-right tabular-nums">
                {formatRupiah(comparison.period.income)}
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums text-slate-600">
                {formatRupiah(comparison.comparison.income)}
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums">
                {formatSignedRupiah(comparison.period.income - comparison.comparison.income)}
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums">
                {formatPercent(comparison.income_change_percent)}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="px-2 py-1.5 font-medium text-slate-900">Pengeluaran</td>
              <td className="px-2 py-1.5 text-right tabular-nums">
                {formatRupiah(comparison.period.expense)}
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums text-slate-600">
                {formatRupiah(comparison.comparison.expense)}
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums">
                {formatSignedRupiah(comparison.period.expense - comparison.comparison.expense)}
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums">
                {formatPercent(comparison.expense_change_percent)}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="px-2 py-1.5 font-medium text-slate-900">Arus Kas Bersih</td>
              <td className="px-2 py-1.5 text-right font-semibold tabular-nums">
                {formatSignedRupiah(comparison.period.net)}
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums text-slate-600">
                {formatSignedRupiah(comparison.comparison.net)}
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums">
                {formatSignedRupiah(comparison.period.net - comparison.comparison.net)}
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums">
                {formatPercent(comparison.net_change_percent)}
              </td>
            </tr>
          </tbody>
        </table>

        {comparison.contributors.length > 0 && (
          <div className="mt-3">
            <h3 className="mb-1.5 text-xs font-semibold text-slate-800">
              Kategori Pengeluaran yang Berubah Paling Signifikan
            </h3>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-400 bg-slate-100 text-left text-[11px] text-slate-700">
                  <th className="px-2 py-1 font-semibold">Kategori</th>
                  <th className="px-2 py-1 text-right font-semibold">Periode Ini</th>
                  <th className="px-2 py-1 text-right font-semibold">Pembanding</th>
                  <th className="px-2 py-1 text-right font-semibold">Selisih</th>
                  <th className="px-2 py-1 text-right font-semibold">Arah</th>
                </tr>
              </thead>
              <tbody>
                {comparison.contributors.map((item) => (
                  <tr key={item.category_id} className="border-b border-slate-200">
                    <td className="px-2 py-1 font-medium text-slate-900">{item.name}</td>
                    <td className="px-2 py-1 text-right tabular-nums">
                      {formatRupiah(item.current)}
                    </td>
                    <td className="px-2 py-1 text-right tabular-nums text-slate-600">
                      {formatRupiah(item.previous)}
                    </td>
                    <td className="px-2 py-1 text-right tabular-nums">
                      {formatSignedRupiah(item.delta)}
                    </td>
                    <td className="px-2 py-1 text-right">
                      {item.direction === 'up' ? 'Naik' : 'Turun'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Document Footer */}
      <footer className="mt-6 border-t border-slate-300 pt-3 text-[10px] text-slate-500 break-inside-avoid">
        <div className="flex items-center justify-between gap-4">
          <span>MyDuid — Your Money, Understood</span>
          <span>Data bersumber dari catatan transaksi terverifikasi pengguna.</span>
        </div>
      </footer>
    </article>
  )
}

const idr = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

/** 25000 -> "Rp25.000" */
export function formatRupiah(amount: number): string {
  return idr.format(amount)
}

/** 1250000 -> "Rp1,25 jt" (untuk kartu kecil) */
export function formatCompact(amount: number): string {
  const abs = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''
  if (abs >= 1_000_000_000) return `${sign}Rp${(abs / 1_000_000_000).toFixed(2).replace('.', ',')} M`
  if (abs >= 1_000_000) return `${sign}Rp${(abs / 1_000_000).toFixed(2).replace('.', ',')} jt`
  if (abs >= 1_000) return `${sign}Rp${Math.round(abs / 1_000)} rb`
  return formatRupiah(amount)
}

/** "Rp25.000" atau "25.000" -> 25000 (untuk input) */
export function parseRupiah(input: string): number {
  const digits = input.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}
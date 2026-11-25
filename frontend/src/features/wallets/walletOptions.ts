import { walletThemeClasses } from '@/components/ui/WalletCard'
import { iconKeys } from '@/lib/icons'
import type { Wallet, WalletCardTheme, WalletGroup } from '@/types'

export const WALLET_PRESET_ICONS = iconKeys.filter((key) =>
  ['cash', 'bank', 'ewallet', 'default'].includes(key),
)

export const WALLET_TYPES: Array<{ value: Wallet['type']; label: string }> = [
  { value: 'cash', label: 'Kas' },
  { value: 'bank', label: 'Bank' },
  { value: 'ewallet', label: 'E-wallet' },
]

export const WALLET_GROUPS: Array<{
  value: WalletGroup
  label: string
  description: string
}> = [
  {
    value: 'daily',
    label: 'Sehari-hari',
    description: 'Uang operasional harian seperti kas atau rekening aktif.',
  },
  {
    value: 'savings',
    label: 'Tabungan',
    description: 'Dana yang disisihkan untuk tujuan tertentu.',
  },
  {
    value: 'investment',
    label: 'Investasi',
    description: 'Nilai dicatat manual, tidak terhubung ke pasar.',
  },
]

export const WALLET_CARD_THEMES: Array<{
  value: WalletCardTheme
  label: string
  gradientClass: string
}> = [
  { value: 'default', label: 'Bawaan', gradientClass: walletThemeClasses.default },
  { value: 'rose', label: 'Rose', gradientClass: walletThemeClasses.rose },
  { value: 'ocean', label: 'Ocean', gradientClass: walletThemeClasses.ocean },
  { value: 'emerald', label: 'Emerald', gradientClass: walletThemeClasses.emerald },
  { value: 'sunset', label: 'Sunset', gradientClass: walletThemeClasses.sunset },
  { value: 'graphite', label: 'Graphite', gradientClass: walletThemeClasses.graphite },
]

export function countGraphemes(value: string): number {
  const SegmenterCtor = (
    Intl as unknown as {
      Segmenter?: new (
        locale?: string,
        options?: { granularity: 'grapheme' },
      ) => { segment: (input: string) => Iterable<unknown> }
    }
  ).Segmenter

  if (SegmenterCtor) {
    return Array.from(
      new SegmenterCtor(undefined, { granularity: 'grapheme' }).segment(value),
    ).length
  }

  return Array.from(value).length
}

export function isValidSingleEmoji(value: string): boolean {
  if (!value) return false
  return countGraphemes(value) === 1 && /\p{Extended_Pictographic}/u.test(value)
}

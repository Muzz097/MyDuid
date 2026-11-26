/**
 * Category Visuals & Personalization
 *
 * Supports 3 display tiers for category icons:
 * 1. Custom illustration image (via CATEGORY_IMAGE_MAP)
 * 2. User-chosen emoji (persisted in localStorage per category ID)
 * 3. Default Lucide icon fallback
 */

const EMOJI_STORAGE_PREFIX = 'myduid:categoryEmoji:'

/**
 * Map category iconKey or lowercase category name to a custom image URL/import.
 * Add your custom illustrations here without modifying UI components.
 */
export const CATEGORY_IMAGE_MAP: Record<string, string> = {
  // Example:
  // food: '/images/categories/food.png',
  // transport: '/images/categories/transport.png',
}

export const CATEGORY_DESCRIPTION_MAP: Record<string, string> = {
  food: 'Restoran, Kafe, Jajan',
  makanan: 'Restoran, Kafe, Jajan',
  transport: 'Bensin, Parkir, Transportasi Publik',
  shopping: 'Pakaian, Kebutuhan, Belanja',
  belanja: 'Pakaian, Kebutuhan, Belanja',
  entertainment: 'Hobi, Streaming, Hiburan',
  hiburan: 'Hobi, Streaming, Hiburan',
  salary: 'Gaji Bulanan, Pendapatan Tetap',
  gaji: 'Gaji Bulanan, Pendapatan Tetap',
  bonus: 'Bonus, Hadiah, Insentif',
  default: 'Kategori transaksi',
}

export const CATEGORY_EMOJI_OPTIONS = [
  '🍔',
  '☕',
  '🛒',
  '🚗',
  '🏠',
  '🎮',
  '💊',
  '🎓',
  '✈️',
  '🎁',
  '💼',
  '💰',
  '📱',
  '⚡',
  '🐾',
  '🎵',
] as const

export function getCategoryCustomImage(
  iconKey?: string | null,
  name?: string | null,
): string | null {
  if (iconKey && CATEGORY_IMAGE_MAP[iconKey]) {
    return CATEGORY_IMAGE_MAP[iconKey]
  }
  const normalizedName = name?.trim().toLowerCase()
  if (normalizedName && CATEGORY_IMAGE_MAP[normalizedName]) {
    return CATEGORY_IMAGE_MAP[normalizedName]
  }
  return null
}

export function getCategoryDescription(
  iconKey?: string | null,
  name?: string | null,
): string {
  const normalizedName = name?.trim().toLowerCase()
  if (normalizedName && CATEGORY_DESCRIPTION_MAP[normalizedName]) {
    return CATEGORY_DESCRIPTION_MAP[normalizedName]
  }
  if (iconKey && CATEGORY_DESCRIPTION_MAP[iconKey]) {
    return CATEGORY_DESCRIPTION_MAP[iconKey]
  }
  return CATEGORY_DESCRIPTION_MAP.default
}

export function getCategoryEmoji(categoryId?: number | null): string | null {
  if (categoryId == null) return null
  try {
    const value = localStorage.getItem(`${EMOJI_STORAGE_PREFIX}${categoryId}`)
    return value && value.trim() ? value : null
  } catch {
    return null
  }
}

export function setCategoryEmoji(
  categoryId: number,
  emoji: string | null,
): void {
  try {
    const key = `${EMOJI_STORAGE_PREFIX}${categoryId}`
    if (emoji && emoji.trim()) {
      localStorage.setItem(key, emoji.trim())
    } else {
      localStorage.removeItem(key)
    }
  } catch {
    // ignore storage quota / private mode
  }
}

import { createContext, useContext } from 'react'

export const themes = [
  { id: 'rupiah-merah', name: 'Rupiah Merah' },
  { id: 'myduid-garden', name: 'MyDuid Garden' },
  { id: 'emerald', name: 'Emerald' },
  { id: 'midnight-rose', name: 'Midnight Rose' },
] as const

export type ThemeId = (typeof themes)[number]['id']
export type AppearanceMode = 'light' | 'dark' | 'system'

export type ThemeContextValue = {
  theme: ThemeId
  appearance: AppearanceMode
  setTheme: (theme: ThemeId) => void
  setAppearance: (appearance: AppearanceMode) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme harus di dalam ThemeProvider')
  return context
}

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  ThemeContext,
  themes,
  type AppearanceMode,
  type ThemeContextValue,
  type ThemeId,
} from '@/lib/theme-context'

const THEME_STORAGE_KEY = 'myduid.theme'
const APPEARANCE_STORAGE_KEY = 'myduid.appearance'

function isThemeId(value: string | undefined): value is ThemeId {
  return themes.some((theme) => theme.id === value)
}

function isAppearanceMode(value: string | undefined): value is AppearanceMode {
  return value === 'light' || value === 'dark' || value === 'system'
}

function getInitialTheme(): ThemeId {
  const rootTheme = document.documentElement.dataset.theme
  if (isThemeId(rootTheme)) return rootTheme

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY) ?? undefined
  return isThemeId(storedTheme) ? storedTheme : 'rupiah-merah'
}

function getInitialAppearance(): AppearanceMode {
  const rootAppearance = document.documentElement.dataset.appearance
  if (isAppearanceMode(rootAppearance)) return rootAppearance

  const storedAppearance =
    window.localStorage.getItem(APPEARANCE_STORAGE_KEY) ?? undefined
  return isAppearanceMode(storedAppearance) ? storedAppearance : 'system'
}

function applyAppearance(appearance: AppearanceMode) {
  const useDark =
    appearance === 'dark' ||
    (appearance === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', useDark)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState(getInitialTheme)
  const [appearance, setAppearanceState] = useState(getInitialAppearance)

  useLayoutEffect(() => {
    const root = document.documentElement
    root.dataset.theme = theme
    root.dataset.appearance = appearance
    applyAppearance(appearance)
  }, [theme, appearance])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handlePreferenceChange = () => {
      if (appearance === 'system') applyAppearance(appearance)
    }

    mediaQuery.addEventListener('change', handlePreferenceChange)
    return () => mediaQuery.removeEventListener('change', handlePreferenceChange)
  }, [appearance])

  useEffect(() => {
    function handleStorageChange(event: StorageEvent) {
      if (event.key === THEME_STORAGE_KEY || event.key === null) {
        const nextTheme = event.newValue ?? undefined
        setThemeState(
          isThemeId(nextTheme) ? nextTheme : 'rupiah-merah',
        )
      }

      if (event.key === APPEARANCE_STORAGE_KEY || event.key === null) {
        const nextAppearance = event.newValue ?? undefined
        setAppearanceState(
          isAppearanceMode(nextAppearance) ? nextAppearance : 'system',
        )
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const setTheme = useCallback((nextTheme: ThemeId) => {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    setThemeState(nextTheme)
  }, [])

  const setAppearance = useCallback((nextAppearance: AppearanceMode) => {
    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, nextAppearance)
    setAppearanceState(nextAppearance)
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, appearance, setTheme, setAppearance }),
    [theme, appearance, setTheme, setAppearance],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

const SESSION_SPLASH_SEEN_KEY = 'myduid.splash_seen'

/**
 * Checks whether splash screen was already displayed in this browser tab session.
 */
export function hasSeenSplash(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return window.sessionStorage.getItem(SESSION_SPLASH_SEEN_KEY) === 'true'
  } catch {
    return false
  }
}

/**
 * Marks splash screen as seen for this session.
 */
export function markSplashSeen(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(SESSION_SPLASH_SEEN_KEY, 'true')
  } catch {
    // Ignore private browsing or storage quota errors
  }
}

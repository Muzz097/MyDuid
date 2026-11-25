import { useEffect, useState } from 'react'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export interface WalletCardImageState {
  src: string | null
  loading: boolean
  error: boolean
}

export function useWalletCardImage(
  walletId: number | null | undefined,
  hasImage: boolean,
  cacheKey?: number | string,
): WalletCardImageState {
  const [src, setSrc] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (walletId == null || !hasImage) {
      setSrc(null)
      setLoading(false)
      setError(false)
      return
    }

    const controller = new AbortController()
    let objectUrl: string | null = null
    let cancelled = false

    setLoading(true)
    setError(false)

    fetch(`${BASE}/api/wallets/${walletId}/card-image`, {
      credentials: 'include',
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error('Gagal memuat foto kartu')
        return res.blob()
      })
      .then((blob) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setSrc(objectUrl)
      })
      .catch((err) => {
        if (cancelled || (err instanceof DOMException && err.name === 'AbortError')) {
          return
        }
        setSrc(null)
        setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
      controller.abort()
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [walletId, hasImage, cacheKey])

  return { src, loading, error }
}

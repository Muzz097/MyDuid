import { useCallback, useEffect, useState } from 'react'
import { ApiError, api } from '@/lib/api'

export type ReportQueryState<T> = {
  data: T | null
  loading: boolean
  error: string | null
  retry: () => void
}

export function useReportData<T>(
  path: string,
  params: Record<string, string | number | undefined>,
  enabled = true,
): ReportQueryState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState<boolean>(enabled)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const search = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') {
      search.set(k, String(v))
    }
  }
  const queryString = search.toString()

  const retry = useCallback(() => {
    setReloadKey((k) => k + 1)
  }, [])

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }

    const controller = new AbortController()
    let active = true

    async function load() {
      try {
        setLoading(true)
        setError(null)
        const url = queryString ? `${path}?${queryString}` : path
        const res = await api<{ data: T }>(url, { signal: controller.signal })
        if (!active) return
        setData(res.data)
      } catch (err) {
        if (!active || (err instanceof DOMException && err.name === 'AbortError')) {
          return
        }
        const message =
          err instanceof ApiError ? err.message : 'Gagal memuat data laporan.'
        setError(message)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      active = false
      controller.abort()
    }
  }, [path, queryString, enabled, reloadKey])

  return { data, loading, error, retry }
}

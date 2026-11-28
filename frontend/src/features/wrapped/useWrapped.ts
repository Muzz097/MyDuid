import { useCallback, useEffect, useState } from 'react'
import { ApiError, api } from '@/lib/api'
import type { WrappedDetail, WrappedMonthsResponse } from './types'

type QueryState<T> = {
  data: T | null
  loading: boolean
  error: string | null
  retry: () => void
}

export function useWrappedMonths(enabled = true): QueryState<WrappedMonthsResponse> {
  const [data, setData] = useState<WrappedMonthsResponse | null>(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

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
        const res = await api<{ data: WrappedMonthsResponse }>(
          '/reports/wrapped/months',
          { signal: controller.signal },
        )
        if (!active) return
        setData(res.data)
      } catch (err) {
        if (!active || (err instanceof DOMException && err.name === 'AbortError')) {
          return
        }
        setError(
          err instanceof ApiError ? err.message : 'Gagal memuat daftar Wrapped.',
        )
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
  }, [enabled, reloadKey])

  return { data, loading, error, retry }
}

export function useWrappedDetail(month: string | null): QueryState<WrappedDetail> {
  const [data, setData] = useState<WrappedDetail | null>(null)
  const [loading, setLoading] = useState(Boolean(month))
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const retry = useCallback(() => {
    setReloadKey((k) => k + 1)
  }, [])

  useEffect(() => {
    if (!month) {
      setData(null)
      setLoading(false)
      setError(null)
      return
    }

    const controller = new AbortController()
    let active = true

    async function load() {
      try {
        setLoading(true)
        setError(null)
        const res = await api<{ data: WrappedDetail }>(
          `/reports/wrapped?month=${encodeURIComponent(month!)}`,
          { signal: controller.signal },
        )
        if (!active) return
        setData(res.data)
      } catch (err) {
        if (!active || (err instanceof DOMException && err.name === 'AbortError')) {
          return
        }
        setError(
          err instanceof ApiError ? err.message : 'Gagal memuat cerita bulanan.',
        )
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
  }, [month, reloadKey])

  return { data, loading, error, retry }
}

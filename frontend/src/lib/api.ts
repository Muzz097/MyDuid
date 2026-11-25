const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

function xsrf(): string {
  const m = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : ''
}

export class ApiError extends Error {
  public status: number
  public errors?: Record<string, string[]>

  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message)
    this.status = status
    this.errors = errors
  }
}

export async function csrf() {
  await fetch(`${BASE}/sanctum/csrf-cookie`, { credentials: 'include' })
}

export async function api<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase()
  const isFormData = init.body instanceof FormData
  const res = await fetch(`${BASE}/api${path}`, {
    ...init,
    method,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(!isFormData && init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(method !== 'GET' ? { 'X-XSRF-TOKEN': xsrf() } : {}),
      ...init.headers,
    },
  })
  if (res.status === 204) return undefined as T
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(res.status, body.message ?? 'Terjadi kesalahan', body.errors)
  return body as T
}
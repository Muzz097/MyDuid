import { Navigate, Outlet } from 'react-router-dom'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/lib/auth'

export function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-page p-6">
        <div className="flex w-full max-w-sm flex-col gap-3" aria-busy="true">
          <Skeleton className="mx-auto size-12 rounded-[var(--radius-control)]" />
          <Skeleton className="h-4 w-2/3 self-center" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/masuk" replace />

  return <Outlet />
}

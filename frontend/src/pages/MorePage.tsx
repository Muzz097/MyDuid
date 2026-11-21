import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/lib/auth'

export function MorePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/masuk', { replace: true })
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-ink">Lainnya</h1>

      <Card>
        <p className="text-sm text-ink-soft">Masuk sebagai</p>
        <p className="mt-1 font-medium text-ink">{user?.name}</p>
        <p className="text-sm text-ink-soft">{user?.email}</p>
      </Card>

      <Button
        variant="secondary"
        size="lg"
        fullWidth
        onClick={() => void handleLogout()}
        className="gap-2"
      >
        <LogOut size={18} strokeWidth={1.75} aria-hidden />
        Keluar
      </Button>
    </div>
  )
}

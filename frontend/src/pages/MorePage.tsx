import { ArrowRight, LogOut, Wallet } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageHeaderMotion, SectionMotion } from '@/components/ui/Motion'
import { useAuth } from '@/lib/auth'

export function MorePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/masuk', { replace: true })
  }

  return (
    <div className="space-y-4 pb-6">
      <PageHeaderMotion
        title="Lainnya"
        subtitle="Pengaturan akun dan preferensi aplikasi"
      />

      <SectionMotion delay={40}>
        <Card>
          <p className="text-sm text-ink-soft">Masuk sebagai</p>
          <p className="mt-1 font-medium text-ink">{user?.name}</p>
          <p className="text-sm text-ink-soft">{user?.email}</p>
        </Card>
      </SectionMotion>

      <SectionMotion delay={80}>
        <Link
          to="/dompet"
          className="flex min-h-14 items-center gap-3 rounded-[var(--radius-control)] border border-line bg-card px-4 text-ink transition duration-200 hover:bg-muted active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
        >
          <Wallet size={20} strokeWidth={1.75} aria-hidden />
          <span className="flex-1 font-medium">Dompet</span>
          <ArrowRight size={18} strokeWidth={1.75} aria-hidden />
        </Link>
      </SectionMotion>

      <SectionMotion delay={120}>
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
      </SectionMotion>
    </div>
  )
}

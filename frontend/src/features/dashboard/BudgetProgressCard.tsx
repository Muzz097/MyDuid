import { ArrowRight, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { cn } from '@/lib/cn'

export interface DashboardBudget {
  id: number
  limit_amount: number
  spent: number
  percent: number
  category: { name: string } | null
  wallet: { name: string } | null
}

export interface BudgetProgressCardProps {
  budgets: DashboardBudget[]
  loading?: boolean
  className?: string
}

export function BudgetProgressCard({
  budgets,
  loading = false,
  className,
}: BudgetProgressCardProps) {
  return (
    <Card className={cn('flex flex-1 flex-col justify-between p-5', className)}>
      <div>
        <SectionHeader
          title="Progres Anggaran"
          subtitle="Pantauan batas belanja bulan ini"
          className="mb-4"
          action={
            <Link
              to="/anggaran"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 transition hover:text-brand-700 hover:underline dark:text-brand-400"
            >
              <span>Lihat Semua</span>
              <ArrowRight size={13} aria-hidden />
            </Link>
          }
        />

        {loading ? (
          <div className="flex h-40 items-center justify-center text-xs text-ink-soft">
            Memuat anggaran...
          </div>
        ) : budgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm font-medium text-ink">Belum ada anggaran</p>
            <p className="mt-1 max-w-xs text-xs text-ink-soft">
              Buat batasan pengeluaran bulanan agar keuangan Anda tetap terkendali dan terencana.
            </p>
            <Link to="/anggaran" className="mt-4">
              <Button size="sm" variant="outline" leftIcon={<Plus size={14} />}>
                Buat Anggaran
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {budgets.map((budget) => (
              <Link
                key={budget.id}
                to="/anggaran"
                className="group block rounded-xl p-2 -mx-2 transition duration-150 hover:bg-muted/40"
              >
                <ProgressBar
                  value={budget.spent}
                  max={budget.limit_amount}
                  label={
                    budget.category && budget.wallet
                      ? `${budget.category.name} · ${budget.wallet.name}`
                      : budget.category?.name ?? budget.wallet?.name ?? 'Anggaran'
                  }
                />
              </Link>
            ))}
          </div>
        )}
      </div>

      {budgets.length > 0 && (
        <div className="mt-4 border-t border-line/60 pt-3 text-right">
          <Link
            to="/anggaran"
            className="text-[11px] font-semibold text-ink-soft hover:text-brand-600 dark:hover:text-brand-400"
          >
            Kelola dan tambah target anggaran &rarr;
          </Link>
        </div>
      )}
    </Card>
  )
}

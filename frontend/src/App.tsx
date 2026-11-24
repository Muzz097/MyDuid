import { useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { GuestRoute } from '@/components/auth/GuestRoute'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { SplashScreen } from '@/components/layout/SplashScreen'
import { hasSeenSplash } from '@/lib/splash'
import { useAuth } from '@/lib/auth'
import { DashboardPage } from '@/pages/DashboardPage'
import { LoginPage } from '@/pages/LoginPage'
import { MorePage } from '@/pages/MorePage'
import { RegisterPage } from '@/pages/RegisterPage'
import { TransactionsPage } from '@/pages/TransactionsPage'
import { BudgetsPage } from '@/pages/BudgetsPage'
import { CalendarPage } from '@/pages/CalendarPage'
import { WalletsPage } from '@/pages/WalletsPage'

export default function App() {
  const { loading: authLoading } = useAuth()
  const [showSplash, setShowSplash] = useState(() => !hasSeenSplash())

  return (
    <>
      {showSplash && (
        <SplashScreen
          isLoading={authLoading}
          onFinish={() => setShowSplash(false)}
        />
      )}
      <BrowserRouter>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/masuk" element={<LoginPage />} />
            <Route path="/daftar" element={<RegisterPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/transaksi" element={<TransactionsPage />} />
              <Route path="/kalender" element={<CalendarPage />} />
              <Route path="/dompet" element={<WalletsPage />} />
              <Route path="/anggaran" element={<BudgetsPage />} />
              <Route path="/lainnya" element={<MorePage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  )
}

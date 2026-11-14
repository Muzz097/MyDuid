import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardPage } from '@/pages/DashboardPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { TransactionsPage } from '@/pages/TransactionsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/transaksi" element={<TransactionsPage />} />
          <Route path="/dompet" element={<PlaceholderPage title="Dompet" />} />
          <Route
            path="/anggaran"
            element={<PlaceholderPage title="Anggaran" />}
          />
          <Route
            path="/lainnya"
            element={<PlaceholderPage title="Lainnya" />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

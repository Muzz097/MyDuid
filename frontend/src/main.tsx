import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ToastProvider } from '@/components/ui/Toast'
import { AuthProvider } from '@/lib/auth'
import { StoreProvider } from '@/lib/store'
import { ThemeProvider } from '@/lib/theme'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <StoreProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </StoreProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppLayout } from '@/components/layout/AppLayout'
import { AppProvider } from '@/context/AppContext'
import { Assessments } from '@/pages/Assessments'
import { Audit } from '@/pages/Audit'
import { Dashboard } from '@/pages/Dashboard'
import { Disposition } from '@/pages/Disposition'
import { Reports } from '@/pages/Reports'
import { Sanitization } from '@/pages/Sanitization'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/assessments" element={<Assessments />} />
            <Route path="/sanitization" element={<Sanitization />} />
            <Route path="/disposition" element={<Disposition />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/audit" element={<Audit />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: 'border border-border bg-card text-card-foreground shadow-none',
        }}
      />
    </AppProvider>
  )
}

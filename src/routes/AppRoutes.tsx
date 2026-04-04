import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Layout } from '../components/layout/Layout'
import { LoginPage } from '../pages/LoginPage'
import { DashboardPage } from '../pages/DashboardPage'
import { ClientsPage } from '../pages/ClientsPage'
import { ClientDetailPage } from '../pages/ClientDetailPage'
import { NfsePage } from '../pages/NfsePage'
import { DocumentsListPage } from '../pages/DocumentsListPage'
import { EmailSendPage } from '../pages/EmailSendPage'
import { EmailSentPage } from '../pages/EmailSentPage'
import { EmailSentDetailPage } from '../pages/EmailSentDetailPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export function AppRoutes() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="documents" element={<DocumentsListPage />} />
          <Route path="email/sent/:id" element={<EmailSentDetailPage />} />
          <Route path="email/sent" element={<EmailSentPage />} />
          <Route path="email" element={<EmailSendPage />} />
          <Route path="clients/:id" element={<ClientDetailPage />} />
          <Route path="clients/:id/nfse" element={<NfsePage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

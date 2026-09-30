import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import { AdminDataProvider } from './lib/data'
import Layout from './components/Layout'
import { ToastProvider } from './components/ui'
import Analytics from './pages/Analytics'
import Dashboard from './pages/Dashboard'
import Login, { MfaChallenge, NotAdmin, NotConfigured, ResetPassword } from './pages/Login'
import Messages from './pages/Messages'
import Orders from './pages/Orders'
import Products from './pages/Products'

// Admin bo'lmagan hech kim panelning ichki sahifalarini ko'rmaydi.
// (Bu faqat interfeys; ma'lumotlarni haqiqatan himoya qiladigani — bazadagi RLS.)
function Gate() {
  const { state } = useAuth()

  if (state.status === 'not-configured') return <NotConfigured />
  if (state.status === 'loading')
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-400">
        Загрузка...
      </div>
    )
  if (state.status === 'signed-out') return <Login notice={state.notice} />
  if (state.status === 'mfa-required') return <MfaChallenge email={state.email} />
  if (state.status === 'recovery') return <ResetPassword email={state.email} />
  if (state.status === 'not-admin') return <NotAdmin email={state.email} />

  return (
    <AdminDataProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/products" element={<Products />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </AdminDataProvider>
  )
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </ToastProvider>
  )
}

export default App

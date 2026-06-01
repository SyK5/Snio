import { Routes, Route } from 'react-router-dom'
import { HomePage } from '@/routes/home'
import { LoginPage } from '@/routes/login'
import { RegisterPage } from '@/routes/register'
import { VerifyEmailSentPage } from '@/routes/verify-email-sent'
import { AppLayout } from '@/components/layout/app-layout'
import { useAuthBootstrap } from '@/features/auth/use-auth-bootstrap'

export function App() {
  const ready = useAuthBootstrap()
  if (!ready) return <Splash />

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email-sent" element={<VerifyEmailSentPage />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
      </Route>
    </Routes>
  )
}

function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B1120]">
      <img src="/Snio.png" alt="Snio" className="h-16 w-16 animate-pulse object-contain" style={{ borderRadius: 18 }} />
    </div>
  )
}

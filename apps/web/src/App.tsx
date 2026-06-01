import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { HomePage } from '@/routes/home'
import { LoginPage } from '@/routes/login'
import { RegisterPage } from '@/routes/register'
import { VerifyEmailSentPage } from '@/routes/verify-email-sent'
import { SettingsPage } from '@/routes/settings'
import { AppLayout } from '@/components/layout/app-layout'
import { useAuthBootstrap } from '@/features/auth/use-auth-bootstrap'
import { applyTheme, useThemeStore } from '@/features/theme/theme.store'
import { useLocaleStore } from '@/features/i18n/locale.store'

export function App() {
  const ready = useAuthBootstrap()
  const preference = useThemeStore(s => s.preference)
  const locale = useLocaleStore(s => s.locale)

  useEffect(() => {
    applyTheme(preference)
  }, [preference])

  if (!ready) return <Splash />

  return (
    <Routes key={locale}>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email-sent" element={<VerifyEmailSentPage />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}

function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <img src="/Snio.png" alt="Snio" className="h-16 w-16 animate-pulse object-contain" style={{ borderRadius: 18 }} />
    </div>
  )
}

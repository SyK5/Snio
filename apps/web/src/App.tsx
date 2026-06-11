import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { HomePage } from '@/routes/home'
import { LoginPage } from '@/routes/login'
import { RegisterPage } from '@/routes/register'
import { VerifyEmailSentPage } from '@/routes/verify-email-sent'
import { VerifyEmailPage } from '@/routes/verify-email'
import { ForgotPasswordPage } from '@/routes/forgot-password'
import { ResetPasswordPage } from '@/routes/reset-password'
import { SettingsPage } from '@/routes/settings'
import { ClansPage } from '@/routes/clans'
import { ClanDetailPage } from '@/routes/clan-detail'
import { InvitePage } from '@/routes/invite'
import { AppLayout } from '@/components/layout/app-layout'
import { useAuthBootstrap } from '@/features/auth/use-auth-bootstrap'
import { applyTheme, useThemeStore } from '@/features/theme/theme.store'
import { useLocaleStore } from '@/features/i18n/locale.store'

export function App() {
  const preference = useThemeStore(s => s.preference)
  const locale = useLocaleStore(s => s.locale)
  useAuthBootstrap()

  useEffect(() => {
    applyTheme(preference)
  }, [preference])

  return (
    <Routes key={locale}>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email-sent" element={<VerifyEmailSentPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/clans" element={<ClansPage />} />
        <Route path="/clans/:clanId" element={<ClanDetailPage />} />
        <Route path="/invite/:code" element={<InvitePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}

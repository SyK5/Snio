import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
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
import { AdminLayout } from '@/routes/admin'
import { AdminGames } from '@/features/admin/admin-games'
import { EventsPage } from '@/routes/events'
import { EventDetailPage } from '@/routes/event-detail'
import { InvitePage } from '@/routes/invite'
import { EventInvitePage } from '@/routes/event-invite'
import { AppLayout } from '@/components/layout/app-layout'
import { RequireAuth } from '@/components/auth/require-auth'
import { RequireAdmin } from '@/components/auth/require-admin'
import { useAuthBootstrap } from '@/features/auth/use-auth-bootstrap'
import { applyTheme, useThemeStore } from '@/features/theme/theme.store'
import { useLocaleStore } from '@/features/i18n/locale.store'
import { m } from '@/i18n/paraglide/messages'

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
        <Route
          path="/clans"
          element={
            <RequireAuth title={m.clan_list_title()}>
              <ClansPage />
            </RequireAuth>
          }
        />
        <Route
          path="/clans/:clanId"
          element={
            <RequireAuth title={m.clan_list_title()}>
              <ClanDetailPage />
            </RequireAuth>
          }
        />
        <Route
          path="/events"
          element={
            <RequireAuth title={m.events_title()}>
              <EventsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/events/:eventId"
          element={
            <RequireAuth title={m.events_title()}>
              <EventDetailPage />
            </RequireAuth>
          }
        />
        <Route path="/invite/:code" element={<InvitePage />} />
        <Route path="/event-invite/:code" element={<EventInvitePage />} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<Navigate to="games" replace />} />
          <Route path="games" element={<AdminGames />} />
        </Route>
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}

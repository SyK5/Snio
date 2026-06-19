import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/auth.store'
import { useProfile } from '@/features/user/user.hooks'
import { m } from '@/i18n/paraglide/messages'

export function RequireAdmin({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore(s => s.accessToken)
  const authReady = useAuthStore(s => s.authReady)
  const { data: profile, isLoading } = useProfile()

  if (!authReady || (accessToken && isLoading))
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">{m.clan_loading()}</div>
  if (!accessToken || !profile?.isPlatformAdmin) return <Navigate to="/" replace />
  return <>{children}</>
}

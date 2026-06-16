import type { ReactNode } from 'react'
import { useAuthStore } from '@/features/auth/auth.store'
import { AuthRequired } from './auth-required'
import { m } from '@/i18n/paraglide/messages'

export function RequireAuth({ title, children }: { title: string; children: ReactNode }) {
  const accessToken = useAuthStore(s => s.accessToken)
  const authReady = useAuthStore(s => s.authReady)

  if (!authReady) return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">{m.clan_loading()}</div>
  if (!accessToken) return <AuthRequired title={title} />
  return <>{children}</>
}

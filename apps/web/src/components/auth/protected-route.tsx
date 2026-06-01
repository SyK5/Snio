import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/auth.store'
import { useCurrentUser } from '@/features/auth/auth.hooks'

export function ProtectedRoute() {
  const accessToken = useAuthStore(s => s.accessToken)
  const { isLoading, isError } = useCurrentUser()

  if (!accessToken) return <Navigate to="/login" replace />
  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-[#0B1120] text-slate-400">Lade</div>
  if (isError) return <Navigate to="/login" replace />

  return <Outlet />
}

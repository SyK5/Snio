import { Outlet } from 'react-router-dom'
import { Sidebar } from './sidebar'
import { useCurrentUser } from '@/features/auth/auth.hooks'
import { CompleteProfilePage } from '@/routes/complete-profile'

export function AppLayout() {
  const { data: user } = useCurrentUser()

  if (user && user.pending_fields.length > 0) return <CompleteProfilePage pendingFields={user.pending_fields} />

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}

import { Outlet } from 'react-router-dom'

export function AdminLayout() {
  return (
    <div className="flex min-h-screen">
      <div className="min-w-0 flex-1 px-6 py-8 sm:px-8">
        <Outlet />
      </div>
    </div>
  )
}

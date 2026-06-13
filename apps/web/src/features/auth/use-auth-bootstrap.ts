import { useEffect } from 'react'
import { refreshSession } from '@/lib/api'
import { useAuthStore } from './auth.store'

export function useAuthBootstrap(): void {
  const setAuthReady = useAuthStore(s => s.setAuthReady)
  useEffect(() => {
    refreshSession()
      .catch(() => undefined)
      .finally(() => setAuthReady(true))
  }, [setAuthReady])
}

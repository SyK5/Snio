import { useEffect } from 'react'
import { refreshSession } from '@/lib/api'

export function useAuthBootstrap(): void {
  useEffect(() => {
    refreshSession().catch(() => undefined)
  }, [])
}

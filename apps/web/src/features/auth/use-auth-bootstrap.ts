import { useEffect, useState } from 'react'
import { refreshSession } from '@/lib/api'

export function useAuthBootstrap(): boolean {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    refreshSession()
      .catch(() => undefined)
      .finally(() => {
        if (active) setReady(true)
      })
    return () => {
      active = false
    }
  }, [])

  return ready
}

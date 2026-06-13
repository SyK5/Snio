import { create } from 'zustand'
import type { AuthUser } from './auth.types'

interface AuthState {
  accessToken: string | null
  user: AuthUser | null
  authReady: boolean
  setAccessToken: (token: string | null) => void
  setUser: (user: AuthUser | null) => void
  setAuthReady: (ready: boolean) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>(set => ({
  accessToken: null,
  user: null,
  authReady: false,
  setAccessToken: token => set({ accessToken: token }),
  setUser: user => set({ user }),
  setAuthReady: ready => set({ authReady: ready }),
  clear: () => set({ accessToken: null, user: null }),
}))

export const authStore = useAuthStore.getState

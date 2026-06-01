import { create } from 'zustand'
import type { AuthUser } from './auth.types'

interface AuthState {
  accessToken: string | null
  user: AuthUser | null
  setAccessToken: (token: string | null) => void
  setUser: (user: AuthUser | null) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>(set => ({
  accessToken: null,
  user: null,
  setAccessToken: token => set({ accessToken: token }),
  setUser: user => set({ user }),
  clear: () => set({ accessToken: null, user: null }),
}))

export const authStore = useAuthStore.getState

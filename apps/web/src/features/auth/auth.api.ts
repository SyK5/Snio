import { api } from '@/lib/api'
import type { AccessResponse, AuthUser, LoginPayload, RegisterPayload } from './auth.types'

export const authApi = {
  login: (payload: LoginPayload) => api.post<AccessResponse>('/auth/login', payload).then(r => r.data),
  register: (payload: RegisterPayload) => api.post<AccessResponse>('/auth/register', payload).then(r => r.data),
  logout: () => api.post<{ success: boolean }>('/auth/logout').then(r => r.data),
  refresh: () => api.post<AccessResponse>('/auth/refresh').then(r => r.data),
  me: () => api.get<AuthUser>('/auth/me').then(r => r.data),
}

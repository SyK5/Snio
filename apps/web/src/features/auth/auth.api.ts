import { api } from '@/lib/api'
import type { AccessResponse, AuthUser, LoginPayload, RegisterPayload } from './auth.types'

export const authApi = {
  login: (payload: LoginPayload) => api.post<AccessResponse>('/auth/login', payload).then(r => r.data),
  register: (payload: RegisterPayload) => api.post<AccessResponse>('/auth/register', payload).then(r => r.data),
  logout: () => api.post<{ success: boolean }>('/auth/logout').then(r => r.data),
  refresh: () => api.post<AccessResponse>('/auth/refresh').then(r => r.data),
  me: () => api.get<AuthUser>('/auth/me').then(r => r.data),
  verifyEmail: (token: string) => api.post<{ success: boolean }>('/auth/verify-email', { token }).then(r => r.data),
  resendVerification: (email: string) => api.post<{ success: boolean }>('/auth/resend-verification', { email }).then(r => r.data),
  forgotPassword: (email: string) => api.post<{ success: boolean }>('/auth/forgot-password', { email }).then(r => r.data),
  resetPassword: (token: string, password: string) => api.post<{ success: boolean }>('/auth/reset-password', { token, password }).then(r => r.data),
}

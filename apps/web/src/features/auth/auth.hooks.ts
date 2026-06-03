import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi } from './auth.api'
import { useAuthStore } from './auth.store'
import type { AccessResponse } from './auth.types'

const ME_KEY = ['auth', 'me'] as const

export function useCurrentUser() {
  const accessToken = useAuthStore(s => s.accessToken)
  const setUser = useAuthStore(s => s.setUser)
  return useQuery({
    queryKey: ME_KEY,
    queryFn: async () => {
      const user = await authApi.me()
      setUser(user)
      return user
    },
    enabled: !!accessToken,
    staleTime: 5 * 60_000,
  })
}

export function useLogin() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const setAccessToken = useAuthStore(s => s.setAccessToken)
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: async (data: AccessResponse) => {
      setAccessToken(data.accessToken)
      await qc.invalidateQueries({ queryKey: ME_KEY })
      navigate('/')
    },
  })
}

export function useRegister() {
  const navigate = useNavigate()
  const setAccessToken = useAuthStore(s => s.setAccessToken)
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data: AccessResponse) => {
      setAccessToken(data.accessToken)
      navigate('/verify-email-sent')
    },
  })
}

export function useVerifyEmail() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: authApi.verifyEmail,
    onSuccess: () => qc.invalidateQueries({ queryKey: ME_KEY }),
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
  })
}

export function useResetPassword() {
  const navigate = useNavigate()
  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) => authApi.resetPassword(token, password),
    onSuccess: () => navigate('/login'),
  })
}

export function useLogout() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const clear = useAuthStore(s => s.clear)
  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      clear()
      qc.clear()
      navigate('/')
    },
  })
}

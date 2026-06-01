import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/features/auth/auth.store'

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

const REFRESH_URL = '/auth/refresh'

api.interceptors.request.use(config => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshing: Promise<string> | null = null

export function refreshSession(): Promise<string> {
  refreshing ??= api
    .post<{ accessToken: string }>(REFRESH_URL)
    .then(res => {
      useAuthStore.getState().setAccessToken(res.data.accessToken)
      return res.data.accessToken
    })
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

api.interceptors.response.use(
  res => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined
    const isRefreshCall = original?.url === REFRESH_URL

    if (error.response?.status !== 401 || !original || original._retried || isRefreshCall) {
      if (isRefreshCall) useAuthStore.getState().clear()
      return Promise.reject(error)
    }

    original._retried = true
    try {
      const token = await refreshSession()
      original.headers.Authorization = `Bearer ${token}`
      return api(original)
    } catch (refreshError) {
      useAuthStore.getState().clear()
      return Promise.reject(refreshError)
    }
  },
)

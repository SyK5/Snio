import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/auth.store'
import { userApi, uploadToS3 } from './user.api'
import type { AvatarType, UpdateProfilePayload, UpdateUsernamePayload } from './user.types'

const PROFILE_KEY = ['user', 'profile'] as const

export function useProfile() {
  const accessToken = useAuthStore(s => s.accessToken)
  return useQuery({
    queryKey: PROFILE_KEY,
    queryFn: userApi.me,
    enabled: !!accessToken,
    staleTime: 10 * 60_000,
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => userApi.updateProfile(payload),
    onSuccess: data => {
      qc.setQueryData(PROFILE_KEY, data)
      qc.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })
}

export function useUpdateUsername() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateUsernamePayload) => userApi.updateUsername(payload),
    onSuccess: data => {
      qc.setQueryData(PROFILE_KEY, data)
      qc.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })
}

export function useUploadAvatar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const presign = await userApi.presignAvatar(file.type as AvatarType)
      await uploadToS3(presign, file)
      return userApi.confirmAvatar(presign.key)
    },
    onSuccess: data => {
      qc.setQueryData(PROFILE_KEY, data)
      qc.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })
}

export function useRemoveAvatar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: userApi.removeAvatar,
    onSuccess: data => {
      qc.setQueryData(PROFILE_KEY, data)
      qc.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })
}

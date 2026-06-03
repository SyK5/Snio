import axios from 'axios'
import { api } from '@/lib/api'
import type { AvatarPresignResponse, AvatarType, MeResponse, UpdateProfilePayload, UpdateUsernamePayload } from './user.types'

export const userApi = {
  me: () => api.get<MeResponse>('/users/me').then(r => r.data),
  updateProfile: (payload: UpdateProfilePayload) => api.patch<MeResponse>('/users/me', payload).then(r => r.data),
  updateUsername: (payload: UpdateUsernamePayload) => api.patch<MeResponse>('/users/me/username', payload).then(r => r.data),
  presignAvatar: (contentType: AvatarType) => api.post<AvatarPresignResponse>('/users/me/avatar/presign', { contentType }).then(r => r.data),
  confirmAvatar: (key: string) => api.post<MeResponse>('/users/me/avatar/confirm', { key }).then(r => r.data),
  removeAvatar: () => api.delete<MeResponse>('/users/me/avatar').then(r => r.data),
}

export async function uploadToS3(presign: AvatarPresignResponse, file: File): Promise<void> {
  const form = new FormData()
  Object.entries(presign.fields).forEach(([k, v]) => form.append(k, v))
  form.append('file', file)
  await axios.post(presign.url, form)
}

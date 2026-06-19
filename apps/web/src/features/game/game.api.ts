import { api } from '@/lib/api'
import { uploadToS3 } from '@/features/user/user.api'
import type { CreateGamePayload, GameIconPresignResponse, GameIconType, GameView, UpdateGamePayload } from './game.types'

export const gameApi = {
  list: () => api.get<GameView[]>('/games').then(r => r.data),
  create: (payload: CreateGamePayload) => api.post<GameView>('/games', payload).then(r => r.data),
  update: (gameId: string, payload: UpdateGamePayload) => api.patch<GameView>(`/games/${gameId}`, payload).then(r => r.data),
  remove: (gameId: string) => api.delete(`/games/${gameId}`).then(r => r.data),
  presignIcon: (contentType: GameIconType) => api.post<GameIconPresignResponse>('/games/icon/presign', { contentType }).then(r => r.data),
}

export async function uploadGameIcon(file: File): Promise<string> {
  const presign = await gameApi.presignIcon(file.type as GameIconType)
  await uploadToS3(presign, file)
  return presign.key
}

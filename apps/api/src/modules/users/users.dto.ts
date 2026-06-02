import { z } from 'zod'

const AVATAR_TYPES = ['image/webp', 'image/jpeg', 'image/png'] as const
const TYPE_EXTENSIONS: Record<(typeof AVATAR_TYPES)[number], string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
}

export const avatarPresignSchema = z.object({
  contentType: z.enum(AVATAR_TYPES),
})

export const avatarConfirmSchema = z.object({
  key: z.string().min(1).max(256),
})

export type AvatarPresignInput = z.infer<typeof avatarPresignSchema>
export type AvatarConfirmInput = z.infer<typeof avatarConfirmSchema>

export interface AvatarPresignResponse {
  key: string
  url: string
  fields: Record<string, string>
  maxBytes: number
}

export interface MeResponse {
  id: string
  email: string
  displayName: string
  emailVerified: boolean
  avatarUrl: string | null
}

export { AVATAR_TYPES, TYPE_EXTENSIONS }

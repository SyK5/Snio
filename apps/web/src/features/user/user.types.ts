export interface MeResponse {
  id: string
  email: string
  displayName: string
  emailVerified: boolean
  avatarUrl: string | null
}

export interface AvatarPresignResponse {
  key: string
  url: string
  fields: Record<string, string>
  maxBytes: number
}

export const AVATAR_TYPES = ['image/webp', 'image/jpeg', 'image/png'] as const
export type AvatarType = (typeof AVATAR_TYPES)[number]

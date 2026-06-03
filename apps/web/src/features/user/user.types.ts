export interface MeResponse {
  id: string
  email: string
  username: string
  displayName: string
  discriminator: string
  emailVerified: boolean
  avatarUrl: string | null
  pendingFields: string[]
}

export interface UpdateProfilePayload {
  username?: string
  displayName?: string
}

export interface AvatarPresignResponse {
  key: string
  url: string
  fields: Record<string, string>
  maxBytes: number
}

export const AVATAR_TYPES = ['image/webp', 'image/jpeg', 'image/png'] as const
export type AvatarType = (typeof AVATAR_TYPES)[number]

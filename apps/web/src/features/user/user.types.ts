export interface MeResponse {
  id: string
  email: string
  username: string
  usernameChangedAt: string | null
  displayName: string
  discriminator: string
  emailVerified: boolean
  isPlatformAdmin: boolean
  avatarUrl: string | null
  pendingFields: string[]
}

export interface UpdateProfilePayload {
  displayName: string
}

export interface UpdateUsernamePayload {
  username: string
}

export interface AvatarPresignResponse {
  key: string
  url: string
  fields: Record<string, string>
  maxBytes: number
}

export const AVATAR_TYPES = ['image/webp', 'image/jpeg', 'image/png'] as const
export type AvatarType = (typeof AVATAR_TYPES)[number]

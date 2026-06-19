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

export const usernameField = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(
    z
      .string()
      .min(3, 'Mindestens 3 Zeichen')
      .max(20, 'Maximal 20 Zeichen')
      .regex(/^[a-z0-9._]+$/, 'Nur a-z, 0-9, Punkt und Unterstrich')
      .regex(/^[a-z0-9]/, 'Muss mit Buchstabe oder Zahl beginnen')
      .regex(/[a-z0-9]$/, 'Muss mit Buchstabe oder Zahl enden')
      .refine(v => !v.includes('..'), 'Keine doppelten Punkte'),
  )

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(40),
})

export const updateUsernameSchema = z.object({
  username: usernameField,
})

export type AvatarPresignInput = z.infer<typeof avatarPresignSchema>
export type AvatarConfirmInput = z.infer<typeof avatarConfirmSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type UpdateUsernameInput = z.infer<typeof updateUsernameSchema>

export interface AvatarPresignResponse {
  key: string
  url: string
  fields: Record<string, string>
  maxBytes: number
}

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

export { AVATAR_TYPES, TYPE_EXTENSIONS }

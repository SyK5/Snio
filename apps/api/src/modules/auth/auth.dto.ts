import { z } from 'zod'

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

export const registerSchema = z.object({
  email: z.email().toLowerCase(),
  username: usernameField,
  password: z.string().min(8).max(200),
  displayName: z.string().trim().min(2).max(40),
})

export const loginSchema = z.object({
  identifier: z.string().trim().min(1).toLowerCase(),
  password: z.string().min(1),
})

export const usernameAvailableSchema = z.object({
  username: usernameField,
})

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
})

export const resendVerificationSchema = z.object({
  email: z.email().toLowerCase(),
})

export const forgotPasswordSchema = z.object({
  email: z.email().toLowerCase(),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(200),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type UsernameAvailableInput = z.infer<typeof usernameAvailableSchema>
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AccessResponse {
  accessToken: string
}

export interface SuccessResponse {
  success: boolean
}

export interface AvailabilityResponse {
  available: boolean
}

export const PENDING_FIELDS = {
  username: 'username',
} as const

export type PendingField = (typeof PENDING_FIELDS)[keyof typeof PENDING_FIELDS]

import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(200),
  displayName: z.string().min(2).max(40),
})

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
})

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
})

export const resendVerificationSchema = z.object({
  email: z.string().email().toLowerCase(),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase(),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(200),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
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

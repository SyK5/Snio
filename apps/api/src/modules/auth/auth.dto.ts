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

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AccessResponse {
  accessToken: string
}

import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Ungültige E-Mail'),
  password: z.string().min(1, 'Passwort erforderlich'),
})

export const registerSchema = z.object({
  email: z.string().email('Ungültige E-Mail'),
  displayName: z.string().min(2, 'Mindestens 2 Zeichen').max(40, 'Maximal 40 Zeichen'),
  password: z.string().min(8, 'Mindestens 8 Zeichen').max(200, 'Zu lang'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Ungültige E-Mail'),
})

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Mindestens 8 Zeichen').max(200, 'Zu lang'),
    confirmPassword: z.string(),
  })
  .refine(d => d.password === d.confirmPassword, { message: 'Passwörter stimmen nicht überein', path: ['confirmPassword'] })

export type LoginForm = z.infer<typeof loginSchema>
export type RegisterForm = z.infer<typeof registerSchema>
export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>

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

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Email oder Benutzername erforderlich'),
  password: z.string().min(1, 'Passwort erforderlich'),
})

export const registerSchema = z.object({
  email: z.email('Ungültige E-Mail'),
  username: usernameField,
  displayName: z.string().trim().min(2, 'Mindestens 2 Zeichen').max(40, 'Maximal 40 Zeichen'),
  password: z.string().min(8, 'Mindestens 8 Zeichen').max(200, 'Zu lang'),
})

export const forgotPasswordSchema = z.object({
  email: z.email('Ungültige E-Mail'),
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

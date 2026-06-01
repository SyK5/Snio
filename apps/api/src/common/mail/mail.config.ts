import { registerAs } from '@nestjs/config'

export const mailConfig = registerAs('mail', () => ({
  apiKey: process.env.RESEND_API_KEY || undefined,
  from: process.env.EMAIL_FROM ?? 'Snio <noreply@snio.gg>',
  webBaseUrl: process.env.WEB_BASE_URL ?? 'http://localhost:5173',
  logoUrl: process.env.EMAIL_LOGO_URL ?? `${process.env.WEB_BASE_URL ?? 'http://localhost:5173'}/Snio.png`,
}))

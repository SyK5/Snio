import { registerAs } from '@nestjs/config'

const DURATION_UNITS = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
} as const

const DURATION_REGEX = /^(?<value>\d+)(?<unit>s|m|h|d)$/

export type Duration = `${number}${keyof typeof DURATION_UNITS}`

export const authConfig = registerAs('auth', () => {
  const access = parseDuration(process.env.JWT_ACCESS_TTL ?? '15m')
  const refresh = parseDuration(process.env.JWT_REFRESH_TTL ?? '30d')
  return {
    accessSecret: required('JWT_ACCESS_SECRET'),
    accessTtl: access.value,
    refreshTtl: refresh.value,
    refreshTtlMs: refresh.ms,
    cookie: {
      name: process.env.REFRESH_COOKIE_NAME ?? 'snio_rt',
      domain: process.env.COOKIE_DOMAIN || undefined,
      secure: process.env.NODE_ENV === 'production',
      sameSite: (process.env.COOKIE_SAMESITE ?? 'lax') as 'lax' | 'strict' | 'none',
      path: '/api/auth',
      maxAge: refresh.ms,
    },
  }
})

export type AuthConfig = ReturnType<typeof authConfig>

function required(key: string): string {
  const value = process.env[key]
  if (!value || value.length < 32) {
    throw new Error(`${key} fehlt oder ist zu kurz, mindestens 32 Zeichen erwartet`)
  }
  return value
}

function parseDuration(input: string): { value: Duration; ms: number } {
  const match = DURATION_REGEX.exec(input)
  if (!match?.groups) {
    throw new Error(`Ungültiges Dauerformat: ${input}`)
  }
  const unit = match.groups.unit as keyof typeof DURATION_UNITS
  return { value: input as Duration, ms: Number(match.groups.value) * DURATION_UNITS[unit] }
}

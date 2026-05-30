import { User } from '@prisma/client'

export interface AccessTokenPayload {
  sub: string
}

export interface RefreshTokenResult {
  token: string
  tokenHash: string
  expiresAt: Date
}

export type AuthUser = Omit<User, 'password_hash'>

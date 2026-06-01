import { User } from '@prisma/client'

export interface AccessTokenPayload {
  sub: string
}

export interface OpaqueTokenResult {
  token: string
  tokenHash: string
  expiresAt: Date
}

export type RefreshTokenResult = OpaqueTokenResult

export type AuthUser = Omit<User, 'password_hash'>

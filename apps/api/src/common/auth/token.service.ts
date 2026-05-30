import { Inject, Injectable } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { randomBytes, createHash } from 'node:crypto'
import { authConfig } from './auth.config'
import { AccessTokenPayload, RefreshTokenResult } from './auth.types'

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    @Inject(authConfig.KEY) private readonly config: ConfigType<typeof authConfig>,
  ) {}

  signAccess(payload: AccessTokenPayload): Promise<string> {
    return this.jwt.signAsync(payload, {
      secret: this.config.accessSecret,
      expiresIn: this.config.accessTtl,
    })
  }

  async verifyAccess(token: string): Promise<AccessTokenPayload> {
    const decoded = await this.jwt.verifyAsync<AccessTokenPayload & { iat: number; exp: number }>(token, {
      secret: this.config.accessSecret,
    })
    return { sub: decoded.sub }
  }

  generateRefreshToken(): RefreshTokenResult {
    const token = randomBytes(48).toString('base64url')
    return { token, tokenHash: this.hashRefreshToken(token), expiresAt: new Date(Date.now() + this.config.refreshTtlMs) }
  }

  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex')
  }
}

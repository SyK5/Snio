import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common'
import { Prisma, RefreshToken } from '@prisma/client'
import { randomBytes } from 'node:crypto'
import { PrismaService } from '../../common/prisma/prisma.service'
import { PasswordService } from '../../common/auth/password.service'
import { TokenService } from '../../common/auth/token.service'
import { AuthTokens, LoginInput, RegisterInput } from './auth.dto'

@Injectable()
export class AuthService {
  private cachedDummyHash?: string

  constructor(
    private readonly prisma: PrismaService,
    private readonly password: PasswordService,
    private readonly token: TokenService,
  ) {}

  async register(input: RegisterInput): Promise<AuthTokens> {
    const password_hash = await this.password.hash(input.password)
    try {
      const user = await this.prisma.user.create({
        data: { email: input.email, password_hash, display_name: input.displayName },
      })
      return await this.issueTokens(user.id)
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('E-Mail bereits vergeben')
      }
      throw e
    }
  }

  async login(input: LoginInput): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      omit: { password_hash: false },
    })
    const hash = user?.password_hash ?? (await this.dummyHash())
    const valid = await this.password.verify(hash, input.password)

    if (!user || !valid || user.deleted_at) throw new UnauthorizedException('Anmeldedaten ungültig')

    return this.issueTokens(user.id)
  }

  async logout(presentedToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { token_hash: this.token.hashRefreshToken(presentedToken), revoked_at: null },
      data: { revoked_at: new Date() },
    })
  }

  async refresh(presentedToken: string): Promise<AuthTokens> {
    const existing = await this.prisma.refreshToken.findUnique({
      where: { token_hash: this.token.hashRefreshToken(presentedToken) },
    })

    if (!existing) throw new UnauthorizedException('Refresh Token ungültig')

    if (existing.revoked_at || existing.replaced_by_id) {
      await this.revokeAllForUser(existing.user_id)
      throw new UnauthorizedException('Refresh Token wiederverwendet, alle Sitzungen beendet')
    }

    if (existing.expires_at <= new Date()) {
      await this.prisma.refreshToken.update({ where: { id: existing.id }, data: { revoked_at: new Date() } })
      throw new UnauthorizedException('Refresh Token abgelaufen')
    }

    const refreshToken = await this.rotate(existing)
    return { accessToken: await this.token.signAccess({ sub: existing.user_id }), refreshToken }
  }

  private async rotate(current: RefreshToken): Promise<string> {
    const next = this.token.generateRefreshToken()
    await this.prisma.$transaction(async tx => {
      const claim = await tx.refreshToken.updateMany({
        where: { id: current.id, revoked_at: null, replaced_by_id: null },
        data: { revoked_at: new Date() },
      })
      if (claim.count === 0) throw new UnauthorizedException('Refresh kollidiert, bitte erneut anfordern')
      const row = await tx.refreshToken.create({
        data: { token_hash: next.tokenHash, user_id: current.user_id, expires_at: next.expiresAt },
      })
      await tx.refreshToken.update({ where: { id: current.id }, data: { replaced_by_id: row.id } })
    })
    return next.token
  }

  private async issueTokens(userId: string): Promise<AuthTokens> {
    const refresh = this.token.generateRefreshToken()
    await this.prisma.refreshToken.create({
      data: { token_hash: refresh.tokenHash, user_id: userId, expires_at: refresh.expiresAt },
    })
    return { accessToken: await this.token.signAccess({ sub: userId }), refreshToken: refresh.token }
  }

  private revokeAllForUser(userId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.refreshToken.updateMany({
      where: { user_id: userId, revoked_at: null },
      data: { revoked_at: new Date() },
    })
  }

  private async dummyHash(): Promise<string> {
    this.cachedDummyHash ??= await this.password.hash(randomBytes(32).toString('hex'))
    return this.cachedDummyHash
  }
}

import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import { Prisma, RefreshToken } from '@prisma/client'
import { randomBytes } from 'node:crypto'
import { PrismaService } from '../../common/prisma/prisma.service'
import { PasswordService } from '../../common/auth/password.service'
import { TokenService } from '../../common/auth/token.service'
import { MailService } from '../../common/mail/mail.service'
import { authConfig } from '../../common/auth/auth.config'
import { AuthTokens, ForgotPasswordInput, LoginInput, RegisterInput, ResendVerificationInput, ResetPasswordInput, VerifyEmailInput } from './auth.dto'

@Injectable()
export class AuthService {
  private cachedDummyHash?: string

  constructor(
    private readonly prisma: PrismaService,
    private readonly password: PasswordService,
    private readonly token: TokenService,
    private readonly mail: MailService,
    @Inject(authConfig.KEY) private readonly config: ConfigType<typeof authConfig>,
  ) {}

  async register(input: RegisterInput): Promise<AuthTokens> {
    const password_hash = await this.password.hash(input.password)
    try {
      const user = await this.prisma.user.create({
        data: { email: input.email, password_hash, display_name: input.displayName },
      })
      await this.dispatchVerification(user.id, user.email)
      return await this.issueTokens(user.id)
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') throw new ConflictException('E-Mail bereits vergeben')
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

  async verifyEmail(input: VerifyEmailInput): Promise<void> {
    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { token_hash: this.token.hashOpaque(input.token) },
    })
    if (!record || record.expires_at <= new Date()) throw new UnauthorizedException('Verifizierungslink ungültig')

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: record.user_id }, data: { email_verified: true } }),
      this.prisma.emailVerificationToken.deleteMany({ where: { user_id: record.user_id } }),
    ])
  }

  async resendVerification(input: ResendVerificationInput): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } })
    if (user && !user.email_verified && !user.deleted_at) await this.dispatchVerification(user.id, user.email)
  }

  async forgotPassword(input: ForgotPasswordInput): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } })
    if (!user || user.deleted_at) return

    const reset = this.token.generateOpaqueToken(this.config.passwordResetTtlMs)
    await this.prisma.passwordResetToken.create({
      data: { token_hash: reset.tokenHash, user_id: user.id, expires_at: reset.expiresAt },
    })
    await this.mail.sendPasswordReset(user.email, reset.token)
  }

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { token_hash: this.token.hashOpaque(input.token) },
    })
    if (!record || record.used_at || record.expires_at <= new Date()) throw new UnauthorizedException('Reset Link ungültig oder abgelaufen')

    const password_hash = await this.password.hash(input.password)
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: record.user_id }, data: { password_hash } }),
      this.prisma.passwordResetToken.update({ where: { id: record.id }, data: { used_at: new Date() } }),
      this.prisma.refreshToken.updateMany({
        where: { user_id: record.user_id, revoked_at: null },
        data: { revoked_at: new Date() },
      }),
    ])
  }

  private async dispatchVerification(userId: string, email: string): Promise<void> {
    await this.prisma.emailVerificationToken.deleteMany({ where: { user_id: userId } })
    const verification = this.token.generateOpaqueToken(this.config.emailVerificationTtlMs)
    await this.prisma.emailVerificationToken.create({
      data: { token_hash: verification.tokenHash, email, user_id: userId, expires_at: verification.expiresAt },
    })
    await this.mail.sendVerification(email, verification.token)
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

import { ConflictException, ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import { Prisma, RefreshToken, User } from '@prisma/client'
import { randomBytes, randomInt } from 'node:crypto'
import { PrismaService } from '../../common/prisma/prisma.service'
import { PasswordService } from '../../common/auth/password.service'
import { TokenService } from '../../common/auth/token.service'
import { MailService } from '../../common/mail/mail.service'
import { authConfig } from '../../common/auth/auth.config'
import { AuthTokens, ForgotPasswordInput, LoginInput, RegisterInput, ResendVerificationInput, ResetPasswordInput, VerifyEmailInput } from './auth.dto'

const DISCRIMINATOR_ATTEMPTS = 8

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
    const user = await this.createUser({ email: input.email, username: input.username, password_hash, display_name: input.displayName })
    await this.dispatchVerification(user.id, user.email)
    return this.issueTokens(user.id)
  }

  async isUsernameAvailable(username: string): Promise<boolean> {
    const existing = await this.prisma.user.findUnique({ where: { username }, select: { id: true } })
    return !existing
  }

  async login(input: LoginInput): Promise<AuthTokens> {
    const where = input.identifier.includes('@') ? { email: input.identifier } : { username: input.identifier }
    const user = await this.prisma.user.findUnique({ where, omit: { password_hash: false } })
    const hash = user?.password_hash ?? (await this.dummyHash())
    const valid = await this.password.verify(hash, input.password)

    if (!user || !valid || user.deleted_at) throw new UnauthorizedException('Anmeldedaten ungültig')
    if (!user.email_verified) throw new ForbiddenException('E-Mail nicht bestätigt')

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

  private async createUser(data: { email: string; username: string; password_hash: string; display_name: string }): Promise<User> {
    for (let i = 0; i < DISCRIMINATOR_ATTEMPTS; i++) {
      try {
        return await this.prisma.user.create({ data: { ...data, discriminator: randomDiscriminator() } })
      } catch (e) {
        const targets = uniqueTargets(e)
        if (targets.includes('email')) throw new ConflictException('E-Mail bereits vergeben')
        if (targets.includes('username')) throw new ConflictException('Benutzername bereits vergeben')
        if (targets.includes('discriminator') || targets.includes('display_name')) continue
        throw e
      }
    }
    throw new ConflictException('Kein freier Discriminator für diesen Anzeigenamen, bitte anderen wählen')
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

function randomDiscriminator(): string {
  return String(randomInt(1, 10000)).padStart(4, '0')
}

function uniqueTargets(e: unknown): string[] {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== 'P2002') return []
  const target = e.meta?.target
  if (Array.isArray(target)) return target as string[]
  return typeof target === 'string' ? [target] : []
}

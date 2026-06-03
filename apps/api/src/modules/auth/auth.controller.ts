import { Body, Controller, Get, Inject, Post, Query, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import type { Request, Response, CookieOptions } from 'express'
import { authConfig } from '../../common/auth/auth.config'
import { AuthGuard } from '../../common/guards/auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { AuthUser } from '../../common/auth/auth.types'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe'
import { AuthService } from './auth.service'
import {
  AccessResponse,
  AvailabilityResponse,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResendVerificationInput,
  ResetPasswordInput,
  SuccessResponse,
  UsernameAvailableInput,
  VerifyEmailInput,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  usernameAvailableSchema,
  verifyEmailSchema,
} from './auth.dto'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    @Inject(authConfig.KEY) private readonly config: ConfigType<typeof authConfig>,
  ) {}

  @Post('register')
  async register(@Body(new ZodValidationPipe(registerSchema)) dto: RegisterInput, @Res({ passthrough: true }) res: Response): Promise<AccessResponse> {
    const tokens = await this.auth.register(dto)
    this.setRefreshCookie(res, tokens.refreshToken)
    return { accessToken: tokens.accessToken }
  }

  @Post('login')
  async login(@Body(new ZodValidationPipe(loginSchema)) dto: LoginInput, @Res({ passthrough: true }) res: Response): Promise<AccessResponse> {
    const tokens = await this.auth.login(dto)
    this.setRefreshCookie(res, tokens.refreshToken)
    return { accessToken: tokens.accessToken }
  }

  @Get('username-available')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async usernameAvailable(@Query(new ZodValidationPipe(usernameAvailableSchema)) query: UsernameAvailableInput): Promise<AvailabilityResponse> {
    return { available: await this.auth.isUsernameAvailable(query.username) }
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<AccessResponse> {
    const tokens = await this.auth.refresh(this.requireRefreshCookie(req))
    this.setRefreshCookie(res, tokens.refreshToken)
    return { accessToken: tokens.accessToken }
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<SuccessResponse> {
    const presented = req.cookies?.[this.config.cookie.name]
    if (presented) await this.auth.logout(presented)
    this.clearRefreshCookie(res)
    return { success: true }
  }

  @Post('verify-email')
  async verifyEmail(@Body(new ZodValidationPipe(verifyEmailSchema)) dto: VerifyEmailInput): Promise<SuccessResponse> {
    await this.auth.verifyEmail(dto)
    return { success: true }
  }

  @Post('resend-verification')
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  async resendVerification(@Body(new ZodValidationPipe(resendVerificationSchema)) dto: ResendVerificationInput): Promise<SuccessResponse> {
    await this.auth.resendVerification(dto)
    return { success: true }
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  async forgotPassword(@Body(new ZodValidationPipe(forgotPasswordSchema)) dto: ForgotPasswordInput): Promise<SuccessResponse> {
    await this.auth.forgotPassword(dto)
    return { success: true }
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  async resetPassword(@Body(new ZodValidationPipe(resetPasswordSchema)) dto: ResetPasswordInput): Promise<SuccessResponse> {
    await this.auth.resetPassword(dto)
    return { success: true }
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user
  }

  private requireRefreshCookie(req: Request): string {
    const token = req.cookies?.[this.config.cookie.name]
    if (!token) throw new UnauthorizedException('Kein Refresh Token')
    return token
  }

  private setRefreshCookie(res: Response, token: string): void {
    res.cookie(this.config.cookie.name, token, this.cookieOptions())
  }

  private clearRefreshCookie(res: Response): void {
    res.clearCookie(this.config.cookie.name, this.cookieOptions())
  }

  private cookieOptions(): CookieOptions {
    const c = this.config.cookie
    return { httpOnly: true, secure: c.secure, sameSite: c.sameSite, domain: c.domain, path: c.path, maxAge: c.maxAge }
  }
}

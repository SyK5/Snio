import { Body, Controller, Get, Inject, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import type { Request, Response, CookieOptions } from 'express'
import { authConfig } from '../../common/auth/auth.config'
import { AuthGuard } from '../../common/guards/auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { AuthUser } from '../../common/auth/auth.types'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe'
import { AuthService } from './auth.service'
import { AccessResponse, LoginInput, RegisterInput, loginSchema, registerSchema } from './auth.dto'

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

  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<AccessResponse> {
    const tokens = await this.auth.refresh(this.requireRefreshCookie(req))
    this.setRefreshCookie(res, tokens.refreshToken)
    return { accessToken: tokens.accessToken }
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<{ success: boolean }> {
    const presented = req.cookies?.[this.config.cookie.name]
    if (presented) await this.auth.logout(presented)
    this.clearRefreshCookie(res)
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

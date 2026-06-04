import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import type { Request } from 'express'
import { PrismaService } from '../prisma/prisma.service'
import { TokenService } from '../auth/token.service'
import { currentStore } from '../context/request-context'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly token: TokenService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>()
    const bearer = this.extractBearer(req)
    if (!bearer) throw new UnauthorizedException('Kein Token')

    const payload = await this.verify(bearer)
    const user = await this.prisma.user.findFirst({ where: { id: payload.sub, deleted_at: null } })

    if (!user) throw new UnauthorizedException('Konto nicht verfügbar')
    if (!user.email_verified) throw new UnauthorizedException('E-Mail nicht bestätigt')

    req.user = user
    const store = currentStore()
    if (store) {
      store.userId = user.id
      store.isPlatformAdmin = user.is_platform_admin
      store.pendingFields = user.pending_fields
    }
    return true
  }

  private extractBearer(req: Request): string | null {
    const header = req.headers.authorization
    return header?.startsWith('Bearer ') ? header.slice(7) : null
  }

  private async verify(bearer: string) {
    try {
      return await this.token.verifyAccess(bearer)
    } catch {
      throw new UnauthorizedException('Token ungültig oder abgelaufen')
    }
  }
}

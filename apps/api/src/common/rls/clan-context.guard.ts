import { CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import type { Request } from 'express'
import { PrismaService } from '../prisma/prisma.service'
import { CacheService } from '../redis/cache.service'
import { currentStore } from '../context/request-context'
import { getClanContext } from './clan-context.cache'

@Injectable()
export class ClanContextGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>()
    const raw = req.params?.clanId
    const clanId = Array.isArray(raw) ? raw[0] : raw
    const store = currentStore()
    if (!clanId || !store?.userId) return true

    const ctx = await getClanContext(this.cache, this.prisma, clanId, store.userId)
    if (!ctx) throw new NotFoundException('Clan nicht gefunden')
    if (!ctx.member && !ctx.owner && !store.isPlatformAdmin) throw new ForbiddenException('Kein Mitglied dieses Clans')

    store.clanId = clanId
    store.isClanOwner = ctx.owner
    store.clanRolePosition = ctx.position
    store.grants = ctx.grants
    return true
  }
}

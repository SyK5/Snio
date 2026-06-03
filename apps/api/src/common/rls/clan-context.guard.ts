import { CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import type { Request } from 'express'
import { PrismaService } from '../prisma/prisma.service'
import { currentStore } from '../context/request-context'

@Injectable()
export class ClanContextGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>()
    const raw = req.params?.clanId
    const clanId = Array.isArray(raw) ? raw[0] : raw
    const store = currentStore()
    if (!clanId || !store?.userId) return true

    const clan = await this.prisma.clan.findFirst({
      where: { id: clanId, deleted_at: null },
      select: {
        owner_id: true,
        members: {
          where: { user_id: store.userId, left_at: null },
          select: { roles: { select: { role: { select: { grants: { select: { grant: true, actions: true } } } } } } },
        },
      },
    })
    if (!clan) throw new NotFoundException('Clan nicht gefunden')

    const member = clan.members[0]
    const isOwner = clan.owner_id === store.userId
    if (!member && !isOwner && !store.isPlatformAdmin) throw new ForbiddenException('Kein Mitglied dieses Clans')

    const grants: Record<string, number> = {}
    for (const mr of member?.roles ?? []) for (const g of mr.role.grants) grants[g.grant] = (grants[g.grant] ?? 0) | g.actions

    store.clanId = clanId
    store.isClanOwner = isOwner
    store.grants = grants
    return true
  }
}

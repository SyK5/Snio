import { PrismaClient } from '@prisma/client'
import { CacheService } from '../redis/cache.service'

export interface ClanCtx {
  owner: boolean
  member: boolean
  position: number
  grants: Record<string, number>
}

interface CtxEntry {
  ver: number
  ctx: ClanCtx
}

const CTX_TTL = Number(process.env.CLAN_CTX_TTL ?? 600)
const verKey = (clanId: string): string => `clan-ctx-ver:${clanId}`
const ctxKey = (clanId: string, userId: string): string => `clan-ctx:${clanId}:${userId}`

const inflight = new Map<string, Promise<ClanCtx | null>>()

async function loadCtx(prisma: PrismaClient, clanId: string, userId: string): Promise<ClanCtx | null> {
  const clan = await prisma.clan.findFirst({
    where: { id: clanId, deleted_at: null },
    select: {
      owner_id: true,
      members: {
        where: { user_id: userId, left_at: null },
        select: { roles: { select: { role: { select: { position: true, grants: { select: { grant: true, actions: true } } } } } } },
      },
    },
  })
  if (!clan) return null
  const member = clan.members[0]
  const grants: Record<string, number> = {}
  let position = -1
  for (const mr of member?.roles ?? []) {
    if (mr.role.position > position) position = mr.role.position
    for (const g of mr.role.grants) grants[g.grant] = (grants[g.grant] ?? 0) | g.actions
  }
  return { owner: clan.owner_id === userId, member: !!member, position, grants }
}

export async function getClanContext(cache: CacheService, prisma: PrismaClient, clanId: string, userId: string): Promise<ClanCtx | null> {
  const key = ctxKey(clanId, userId)
  const [verRaw, entry] = (await cache.mget(verKey(clanId), key)) as [number | null, CtxEntry | null]
  const ver = verRaw ?? 0
  if (entry && entry.ver === ver) return entry.ctx
  const running = inflight.get(key)
  if (running) return running
  const load = loadCtx(prisma, clanId, userId)
    .then(async ctx => {
      if (ctx) await cache.set(key, { ver, ctx }, CTX_TTL)
      return ctx
    })
    .finally(() => inflight.delete(key))
  inflight.set(key, load)
  return load
}

export function bumpClanContext(cache: CacheService, clanId: string): Promise<number> {
  return cache.incr(verKey(clanId))
}

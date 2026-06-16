import { Prisma, PrismaClient } from '@prisma/client'
import { ForbiddenException } from '@nestjs/common'
import { currentStore, RequestStore } from '../context/request-context'
import { ModelScope, modelScope } from './scopes'

const WHERE_OPS = new Set(['findMany', 'findFirst', 'findFirstOrThrow', 'count', 'aggregate', 'groupBy', 'updateMany', 'updateManyAndReturn', 'deleteMany'])
const CREATE_OPS = new Set(['create', 'createMany', 'createManyAndReturn'])
const VERIFY_OPS = new Set(['findUnique', 'findUniqueOrThrow'])
const BLOCKED_OPS = new Set(['update', 'delete', 'upsert'])
const CTX_MODELS = new Set(['Clan', 'ClanMember', 'ClanRoleDef', 'ClanRoleGrant', 'ClanMemberRole'])
const CTX_WRITE_OPS = new Set(['create', 'createMany', 'createManyAndReturn', 'updateMany', 'updateManyAndReturn', 'deleteMany'])

function nest(path: string[], value: unknown): Record<string, unknown> {
  const [head, ...rest] = path
  if (!head) return {}
  return rest.length ? { [head]: nest(rest, value) } : { [head]: value }
}

async function clanIds(base: PrismaClient, store: RequestStore): Promise<string[]> {
  if (store.membershipClanIds) return store.membershipClanIds
  if (!store.userId) return []
  const rows = await base.clanMember.findMany({ where: { user_id: store.userId, left_at: null }, select: { clan_id: true } })
  store.membershipClanIds = rows.map(r => r.clan_id)
  return store.membershipClanIds
}

function scopeField(scope: ModelScope): string {
  return scope.scope === 'self' ? 'user_id' : (scope.field as string)
}

async function allowedValues(base: PrismaClient, store: RequestStore, scope: ModelScope): Promise<string[]> {
  if (scope.scope === 'self') return store.userId ? [store.userId] : []
  if (store.clanId) return [store.clanId]
  return clanIds(base, store)
}

async function buildWhere(base: PrismaClient, store: RequestStore, scope: ModelScope): Promise<Record<string, unknown>> {
  if (scope.scope === 'self') return { user_id: store.userId }
  const value = store.clanId ?? { in: await clanIds(base, store) }
  return nest((scope.field as string).split('.'), value)
}

function validateCreate(model: string, scope: ModelScope, store: RequestStore, args: { data?: unknown }): void {
  const field = scope.scope === 'self' ? 'user_id' : scope.field === 'clan_id' ? 'clan_id' : null
  if (!field) return
  const expected = field === 'user_id' ? store.userId : store.clanId
  if (!expected) throw new ForbiddenException(`RLS: fehlender Kontext für create ${model}`)
  const rows = args.data ? (Array.isArray(args.data) ? args.data : [args.data]) : []
  for (const row of rows as Record<string, unknown>[]) {
    if (row[field] === undefined) row[field] = expected
    else if (row[field] !== expected) throw new ForbiddenException(`RLS: ${field} verletzt Kontext bei create ${model}`)
  }
}

export function rlsExtension(base: PrismaClient, onCtxMutation?: (clanId: string) => Promise<unknown>) {
  async function bumpCtx(store: RequestStore, model: string, operation: string): Promise<void> {
    if (!onCtxMutation || !store.clanId) return
    if (!CTX_MODELS.has(model) || !CTX_WRITE_OPS.has(operation)) return
    const bumped = (store.bumpedClans ??= new Set())
    if (bumped.has(store.clanId)) return
    bumped.add(store.clanId)
    await onCtxMutation(store.clanId)
  }
  return Prisma.defineExtension({
    name: 'rls',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const store = currentStore()
          if (!store || store.system || store.isPlatformAdmin) return query(args)

          const scope = modelScope(model)
          if (!scope) throw new ForbiddenException(`RLS: kein Scope für Model ${model}`)
          if (scope.scope === 'context-free') return query(args)
          if (scope.scope === 'deferred') throw new ForbiddenException(`RLS: Scope für ${model} noch nicht freigegeben`)
          if (!store.userId) throw new ForbiddenException('RLS: keine Authentifizierung')

          const a = (args ?? {}) as Record<string, unknown>

          if (CREATE_OPS.has(operation)) {
            validateCreate(model, scope, store, a)
            const result = await query(a)
            await bumpCtx(store, model, operation)
            return result
          }
          if (BLOCKED_OPS.has(operation)) throw new ForbiddenException(`RLS: ${operation} auf ${model} nicht erlaubt, nutze updateMany/deleteMany`)

          if (WHERE_OPS.has(operation)) {
            const where = await buildWhere(base, store, scope)
            a.where = a.where ? { AND: [a.where, where] } : where
            const result = await query(a)
            await bumpCtx(store, model, operation)
            return result
          }

          if (VERIFY_OPS.has(operation)) {
            const field = scopeField(scope)
            if (field.includes('.')) throw new ForbiddenException(`RLS: ${operation} auf ${model} nicht erlaubt, nutze findFirst`)
            const result = (await query(args)) as Record<string, unknown> | null
            if (!result) return result
            const allowed = await allowedValues(base, store, scope)
            if (allowed.includes(result[field] as string)) return result
            if (operation === 'findUniqueOrThrow') throw new ForbiddenException(`RLS: Zugriff verweigert auf ${model}`)
            return null
          }

          throw new ForbiddenException(`RLS: nicht unterstützte Operation ${operation} auf ${model}`)
        },
      },
    },
  })
}

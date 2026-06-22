import { Prisma, PrismaClient } from '@prisma/client'
import { ForbiddenException } from '@nestjs/common'
import { currentStore, RequestStore } from '../context/request-context'
import { ModelScope, modelScope, relationPolicy } from './scopes'
import { conditionalWhere, conditionalCreate } from './conditional'
import { clanIds } from './conditional.kit'

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

interface RelationMeta { target: string; isList: boolean }
let RELATION_MAP: Record<string, Record<string, RelationMeta>> | null = null

function relationMap(): Record<string, Record<string, RelationMeta>> {
  if (RELATION_MAP) return RELATION_MAP
  const map: Record<string, Record<string, RelationMeta>> = {}
  for (const m of Prisma.dmmf.datamodel.models) {
    const rels: Record<string, RelationMeta> = {}
    for (const f of m.fields) if (f.kind === 'object') rels[f.name] = { target: f.type, isList: f.isList }
    map[m.name] = rels
  }
  RELATION_MAP = map
  return map
}

async function scopeWhereFor(base: PrismaClient, store: RequestStore, model: string): Promise<Record<string, unknown> | null> {
  const scope = modelScope(model)
  if (!scope) throw new ForbiddenException(`RLS: kein Scope für Model ${model}`)
  if (scope.scope === 'context-free') return null
  if (scope.scope === 'deferred') throw new ForbiddenException(`RLS: Scope für ${model} noch nicht freigegeben`)
  if (scope.scope === 'conditional') return conditionalWhere(base, store, model)
  return buildWhere(base, store, scope)
}

const MAX_RELATION_DEPTH = 8

async function scopeRelations(base: PrismaClient, store: RequestStore, model: string, args: Record<string, unknown>, depth: number): Promise<void> {
  if (depth > MAX_RELATION_DEPTH) return
  const container = (args.include ?? args.select) as Record<string, unknown> | undefined
  if (!container) return
  const rels = relationMap()[model]
  if (!rels) return
  for (const key of Object.keys(container)) {
    const rel = rels[key]
    if (!rel) continue
    const val = container[key]
    if (val === false) continue
    const childArgs = (val === true ? {} : { ...(val as Record<string, unknown>) }) as Record<string, unknown>
    const policy = relationPolicy(model, key)
    if (policy !== 'INHERIT') {
      const cw = await scopeWhereFor(base, store, rel.target)
      if (cw) {
        if (policy === 'GATE') {
          const gate = rel.isList ? { [key]: { some: cw } } : { [key]: { is: cw } }
          args.where = args.where ? { AND: [args.where, gate] } : gate
        }
        if (rel.isList) childArgs.where = childArgs.where ? { AND: [childArgs.where, cw] } : cw
      }
    }
    await scopeRelations(base, store, rel.target, childArgs, depth + 1)
    container[key] = Object.keys(childArgs).length ? childArgs : true
  }
}

async function validateCreate(base: PrismaClient, model: string, scope: ModelScope, store: RequestStore, args: { data?: unknown }): Promise<void> {
  const rows = args.data ? (Array.isArray(args.data) ? args.data : [args.data]) : []
  if (scope.scope === 'conditional') return conditionalCreate(base, store, model, rows as Record<string, unknown>[])
  const field = scope.scope === 'self' ? 'user_id' : scope.field === 'clan_id' ? 'clan_id' : null
  if (!field) return
  const expected = field === 'user_id' ? store.userId : store.clanId
  if (!expected) throw new ForbiddenException(`RLS: fehlender Kontext für create ${model}`)
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
          if (!store || store.system || (store.isPlatformAdmin && store.adminMode)) return query(args)

          const scope = modelScope(model)
          if (!scope) throw new ForbiddenException(`RLS: kein Scope für Model ${model}`)
          if (scope.scope === 'context-free') return query(args)
          if (scope.scope === 'deferred') throw new ForbiddenException(`RLS: Scope für ${model} noch nicht freigegeben`)
          if (!store.userId) throw new ForbiddenException('RLS: keine Authentifizierung')

          const a = (args ?? {}) as Record<string, unknown>

          if (CREATE_OPS.has(operation)) {
            await validateCreate(base, model, scope, store, a)
            const result = await query(a)
            await bumpCtx(store, model, operation)
            return result
          }
          if (BLOCKED_OPS.has(operation)) throw new ForbiddenException(`RLS: ${operation} auf ${model} nicht erlaubt, nutze updateMany/deleteMany`)

          if (WHERE_OPS.has(operation)) {
            const where = scope.scope === 'conditional' ? await conditionalWhere(base, store, model) : await buildWhere(base, store, scope)
            a.where = a.where ? { AND: [a.where, where] } : where
            await scopeRelations(base, store, model, a, 0)
            const result = await query(a)
            await bumpCtx(store, model, operation)
            return result
          }

          if (VERIFY_OPS.has(operation)) {
            if (scope.scope === 'conditional') throw new ForbiddenException(`RLS: ${operation} auf ${model} nicht erlaubt, nutze findFirst`)
            const field = scopeField(scope)
            if (field.includes('.')) throw new ForbiddenException(`RLS: ${operation} auf ${model} nicht erlaubt, nutze findFirst`)
            await scopeRelations(base, store, model, a, 0)
            const result = (await query(a)) as Record<string, unknown> | null
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

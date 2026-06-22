import { PrismaClient } from '@prisma/client'
import { ForbiddenException } from '@nestjs/common'
import { RequestStore } from '../context/request-context'

export async function clanIds(base: PrismaClient, store: RequestStore): Promise<string[]> {
  if (store.membershipClanIds) return store.membershipClanIds
  if (!store.userId) return []
  const rows = await base.clanMember.findMany({ where: { user_id: store.userId, left_at: null }, select: { clan_id: true } })
  store.membershipClanIds = rows.map(r => r.clan_id)
  return store.membershipClanIds
}

export async function ownedOrgIds(base: PrismaClient, store: RequestStore): Promise<string[]> {
  if (store.ownedOrgIds) return store.ownedOrgIds
  if (!store.userId) return []
  const rows = await base.organization.findMany({ where: { owner_id: store.userId, deleted_at: null }, select: { id: true } })
  store.ownedOrgIds = rows.map(r => r.id)
  return store.ownedOrgIds
}

export type Rule = (base: PrismaClient, store: RequestStore) => Promise<Record<string, unknown>[]>
export type CreateRow = Record<string, unknown>
export type CreateRule = (base: PrismaClient, store: RequestStore, rows: CreateRow[]) => Promise<void>

interface OwnerSource {
  field: string
  ids: (base: PrismaClient, store: RequestStore) => Promise<string[]>
}

const organizerOwners: OwnerSource[] = [
  { field: 'clan_id', ids: clanIds },
  { field: 'organization_id', ids: ownedOrgIds },
]

export const selfRow: Rule = async (_base, store) => [{ user_id: store.userId }]
export const publicVisible: Rule = async () => [{ visibility: 'PUBLIC' }]
export const registered: Rule = async (_base, store) => [{ participations: { some: { user_id: store.userId } } }]
export const confirmedPublic: Rule = async () => [{ status: 'CONFIRMED', event: { visibility: 'PUBLIC', deleted_at: null } }]

export const myOrganizer =
  (path?: string): Rule =>
  async (base, store) => {
    const out: Record<string, unknown>[] = []
    for (const s of organizerOwners) {
      const ids = await s.ids(base, store)
      if (ids.length) out.push(path ? { [path]: { [s.field]: { in: ids } } } : { [s.field]: { in: ids } })
    }
    return out
  }

export const organizerCreate: CreateRule = async (base, store, rows) => {
  for (const row of rows) {
    let owned = false
    for (const s of organizerOwners) {
      const val = row[s.field]
      if (val == null) continue
      const ids = await s.ids(base, store)
      if (!ids.includes(val as string)) throw new ForbiddenException(`RLS: ${s.field} nicht im Besitz bei create`)
      owned = true
    }
    if (!owned) throw new ForbiddenException('RLS: kein erlaubter Organizer bei create')
  }
}

export const selfCreate: CreateRule = async (_base, store, rows) => {
  if (!store.userId) throw new ForbiddenException('RLS: fehlender Kontext für create')
  for (const row of rows) {
    if (row.user_id === undefined) row.user_id = store.userId
    else if (row.user_id !== store.userId) throw new ForbiddenException('RLS: user_id verletzt Kontext bei create')
  }
}

export async function resolveWhere(rules: Rule[] | undefined, base: PrismaClient, store: RequestStore, model: string): Promise<Record<string, unknown>> {
  if (!rules) throw new ForbiddenException(`RLS: kein conditional Resolver für ${model}`)
  const out: Record<string, unknown>[] = []
  for (const rule of rules) out.push(...(await rule(base, store)))
  if (!out.length) return { id: { in: [] } }
  return { OR: out }
}

export async function resolveCreate(rule: CreateRule | undefined, base: PrismaClient, store: RequestStore, rows: CreateRow[]): Promise<void> {
  if (!rule) return
  await rule(base, store, rows)
}

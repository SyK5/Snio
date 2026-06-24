import { Inject, Injectable } from '@nestjs/common'
import { Clan, Prisma } from '@prisma/client'
import { randomBytes } from 'node:crypto'
import { RLS_PRISMA, RlsPrismaClient, RlsTransactionClient } from '../../common/prisma/prisma.extended'
import { runSystem } from '../../common/context/request-context'
import { S3Service } from '../../common/s3/s3.service'
import { PermissionService } from '../../common/rls/permission.service'
import { Action } from '../../common/rls/actions'
import { NotificationService } from '../notifications/notification.service'
import { AuditService } from '../audit/audit.service'
import { AuditAction, AuditEntity } from '../audit/audit-actions'
import { GRANT_CATALOG, grantMeta } from '../../common/rls/grants.catalog'
import { DefaultRoleKey, ROLE_GRANT_DEFAULTS, SYSTEM_ROLES, SystemRoleKey, grantRows } from '../../common/rls/role-templates'
import { AuthUser } from '../../common/auth/auth.types'
import { clanErrors } from './clan.errors'
import {
  ClanDetail,
  ClanMemberView,
  ClanPage,
  ClanRoleDetail,
  ClanSummary,
  CreateClanInput,
  CreateRoleInput,
  GrantCatalogEntry,
  ListClansQuery,
  RoleTemplateView,
  SetGrantsInput,
  UpdateClanInput,
  UpdateRoleInput,
} from './clans.dto'

const SLUG_ATTEMPTS = 6

const MEMBER_INCLUDE = {
  user: { select: { id: true, username: true, display_name: true, discriminator: true, avatar_url: true } },
  roles: { include: { role: true } },
} satisfies Prisma.ClanMemberInclude

type MemberWithRelations = Prisma.ClanMemberGetPayload<{ include: typeof MEMBER_INCLUDE }>

const ROLE_INCLUDE = { grants: { select: { grant: true, actions: true } } } satisfies Prisma.ClanRoleDefInclude

type RoleWithGrants = Prisma.ClanRoleDefGetPayload<{ include: typeof ROLE_INCLUDE }>

@Injectable()
export class ClansService {
  constructor(
    @Inject(RLS_PRISMA) private readonly prisma: RlsPrismaClient,
    private readonly s3: S3Service,
    private readonly permissions: PermissionService,
    private readonly notifications: NotificationService,
    private readonly audit: AuditService,
  ) {}

  async create(user: AuthUser, input: CreateClanInput): Promise<ClanDetail> {
    let slug = slugify(input.name)
    for (let i = 0; i < SLUG_ATTEMPTS; i++) {
      try {
        const clan = await runSystem(() => this.persistClan(user, input, slug))
        return this.toDetail(clan, 1, user.id)
      } catch (e) {
        const targets = uniqueTargets(e)
        if (targets.includes('tag')) throw clanErrors.tagTaken()
        if (!targets.includes('slug')) throw e
        slug = `${slugify(input.name)}-${shortId()}`
      }
    }
    throw clanErrors.createFailed()
  }

  async list(query: ListClansQuery): Promise<ClanPage> {
    const take = query.limit + 1
    const clans = await this.prisma.clan.findMany({
      where: { deleted_at: null, ...(query.cursor ? { id: { lt: query.cursor } } : {}) },
      orderBy: { created_at: 'desc' },
      take,
    })
    const hasMore = clans.length === take
    const page = hasMore ? clans.slice(0, -1) : clans
    if (page.length === 0) return { items: [], nextCursor: null }
    const counts = await this.prisma.clanMember.groupBy({ by: ['clan_id'], where: { clan_id: { in: page.map(c => c.id) }, left_at: null }, _count: { _all: true } })
    const countMap = new Map(counts.map(c => [c.clan_id, c._count._all]))
    const items = await Promise.all(page.map(c => this.toSummary(c, countMap.get(c.id) ?? 0)))
    return { items, nextCursor: hasMore ? page[page.length - 1]!.id : null }
  }

  async detail(clanId: string, userId: string): Promise<ClanDetail> {
    const clan = await this.prisma.clan.findFirst({ where: { id: clanId, deleted_at: null } })
    if (!clan) throw clanErrors.notFound()
    const memberCount = await this.prisma.clanMember.count({ where: { clan_id: clanId, left_at: null } })
    return this.toDetail(clan, memberCount, userId)
  }

  async update(clanId: string, userId: string, input: UpdateClanInput): Promise<ClanDetail> {
    const data: Prisma.ClanUpdateManyMutationInput = {}
    if (input.name !== undefined) data.name = input.name
    if (input.tag !== undefined) data.tag = input.tag
    if (input.description !== undefined) data.description = input.description
    if (input.joinPolicy !== undefined) data.join_policy = input.joinPolicy
    try {
      await this.prisma.clan.updateMany({ where: { id: clanId, deleted_at: null }, data })
    } catch (e) {
      if (uniqueTargets(e).includes('tag')) throw clanErrors.tagTaken()
      throw e
    }
    await this.audit.write({ clanId, action: AuditAction.CLAN_UPDATED, entityType: AuditEntity.CLAN, entityId: clanId, metadata: { fields: Object.keys(data) } })
    return this.detail(clanId, userId)
  }

  async softDelete(clanId: string): Promise<void> {
    await this.prisma.clan.updateMany({ where: { id: clanId, deleted_at: null }, data: { deleted_at: new Date() } })
    await this.audit.write({ clanId, action: AuditAction.CLAN_DELETED, entityType: AuditEntity.CLAN, entityId: clanId })
  }

  async join(clanId: string, user: AuthUser): Promise<ClanDetail> {
    return runSystem(async () => {
      const clan = await this.prisma.clan.findFirst({ where: { id: clanId, deleted_at: null } })
      if (!clan) throw clanErrors.notFound()
      if (clan.join_policy === 'CLOSED') throw clanErrors.joinClosed()
      if (clan.join_policy === 'INVITE_ONLY') throw clanErrors.inviteRequired()
      return this.admit(clan, user)
    })
  }

  async admit(clan: Clan, user: AuthUser): Promise<ClanDetail> {
    const existing = await this.prisma.clanMember.findFirst({ where: { clan_id: clan.id, user_id: user.id } })
    if (existing?.left_at === null) throw clanErrors.alreadyMember()
    const memberId = existing ? await this.reactivateMember(existing.id) : await this.createMember(clan.id, user.id)
    const base = await this.baseRole(clan.id)
    await this.prisma.clanMemberRole.createMany({ data: [{ member_id: memberId, role_id: base.id }], skipDuplicates: true })
    const memberCount = await this.prisma.clanMember.count({ where: { clan_id: clan.id, left_at: null } })
    if (clan.owner_id !== user.id)
      await this.notifications.emit(clan.owner_id, 'CLAN_MEMBER_JOINED', {
        clanId: clan.id,
        clanName: clan.name,
        clanTag: clan.tag,
        userId: user.id,
        displayName: user.display_name,
        discriminator: user.discriminator,
      })
    await this.audit.write({
      clanId: clan.id,
      action: AuditAction.MEMBER_JOINED,
      entityType: AuditEntity.MEMBER,
      entityId: user.id,
      metadata: { displayName: user.display_name, discriminator: user.discriminator },
    })
    return this.toDetail(clan, memberCount, user.id)
  }

  async leave(clanId: string, user: AuthUser): Promise<void> {
    const clan = await this.prisma.clan.findFirst({ where: { id: clanId } })
    if (clan?.owner_id === user.id) throw clanErrors.ownerCannotLeave()
    const member = await this.prisma.clanMember.findFirst({ where: { user_id: user.id, left_at: null } })
    if (!member) throw clanErrors.noMembership()
    await this.deactivateMember(member.id)
    await this.audit.write({ clanId, action: AuditAction.MEMBER_LEFT, entityType: AuditEntity.MEMBER, entityId: user.id })
  }

  async kick(clanId: string, memberId: string): Promise<void> {
    const member = await this.prisma.clanMember.findFirst({
      where: { id: memberId, left_at: null },
      include: { roles: { select: { role: { select: { position: true } } } }, user: { select: { display_name: true, discriminator: true } } },
    })
    if (!member) throw clanErrors.memberNotFound()
    const clan = await this.prisma.clan.findFirst({ where: { id: clanId } })
    if (member.user_id === clan?.owner_id) throw clanErrors.ownerCannotBeKicked()
    if (!this.permissions.canManageRole(highestPosition(member.roles))) throw clanErrors.targetRoleTooHigh()
    await this.deactivateMember(memberId)
    await this.notifications.emit(member.user_id, 'CLAN_KICKED', { clanId, clanName: clan?.name ?? '', clanTag: clan?.tag ?? '' })
    await this.audit.write({
      clanId,
      action: AuditAction.MEMBER_KICKED,
      entityType: AuditEntity.MEMBER,
      entityId: member.user_id,
      metadata: { targetName: member.user.display_name, targetDiscriminator: member.user.discriminator },
    })
  }

  async listMembers(): Promise<ClanMemberView[]> {
    const members = await this.prisma.clanMember.findMany({ where: { left_at: null }, include: MEMBER_INCLUDE, orderBy: { joined_at: 'asc' } })
    return Promise.all(members.map(m => this.toMemberView(m)))
  }

  async assignRole(memberId: string, roleId: string): Promise<ClanMemberView> {
    const member = await this.prisma.clanMember.findFirst({
      where: { id: memberId, left_at: null },
      include: { user: { select: { display_name: true, discriminator: true } } },
    })
    if (!member) throw clanErrors.memberNotFound()
    const role = await this.prisma.clanRoleDef.findFirst({ where: { id: roleId } })
    if (!role) throw clanErrors.roleNotFound()
    if (role.is_system && role.key === 'owner') throw clanErrors.ownerRoleNotAssignable()
    if (!this.permissions.canManageRole(role.position)) throw clanErrors.roleAboveOwnPosition()
    await this.prisma.clanMemberRole.createMany({ data: [{ member_id: memberId, role_id: roleId }], skipDuplicates: true })
    await this.notifyRoleChange(member.user_id, role.clan_id, role.name, 'assigned')
    await this.audit.write({
      clanId: role.clan_id,
      action: AuditAction.ROLE_ASSIGNED,
      entityType: AuditEntity.MEMBER,
      entityId: member.user_id,
      metadata: { roleId, roleName: role.name, targetName: member.user.display_name, targetDiscriminator: member.user.discriminator },
    })
    return this.memberView(memberId)
  }

  async removeRole(memberId: string, roleId: string): Promise<ClanMemberView> {
    const role = await this.prisma.clanRoleDef.findFirst({ where: { id: roleId } })
    if (role?.is_system && role.key === 'owner') throw clanErrors.ownerRoleNotRemovable()
    if (role && !this.permissions.canManageRole(role.position)) throw clanErrors.roleAboveOwnPosition()
    await this.prisma.clanMemberRole.deleteMany({ where: { member_id: memberId, role_id: roleId } })
    if (role) {
      const member = await this.prisma.clanMember.findFirst({ where: { id: memberId }, include: { user: { select: { display_name: true, discriminator: true } } } })
      if (member) {
        await this.notifyRoleChange(member.user_id, role.clan_id, role.name, 'removed')
        await this.audit.write({
          clanId: role.clan_id,
          action: AuditAction.ROLE_REMOVED,
          entityType: AuditEntity.MEMBER,
          entityId: member.user_id,
          metadata: { roleId, roleName: role.name, targetName: member.user.display_name, targetDiscriminator: member.user.discriminator },
        })
      }
    }
    return this.memberView(memberId)
  }

  private async notifyRoleChange(userId: string, clanId: string, roleName: string, action: 'assigned' | 'removed'): Promise<void> {
    const clan = await this.prisma.clan.findFirst({ where: { id: clanId } })
    await this.notifications.emit(userId, 'CLAN_ROLE_CHANGED', { clanId, clanName: clan?.name ?? '', roleName, action })
  }

  grantCatalog(): GrantCatalogEntry[] {
    return Object.entries(GRANT_CATALOG).map(([key, meta]) => ({ key, category: meta.category, actions: meta.actions }))
  }

  roleTemplates(): RoleTemplateView[] {
    return SYSTEM_ROLES.filter(r => r.key !== 'owner').map(r => ({ key: r.key, name: r.name, color: r.color }))
  }

  async listRoles(): Promise<ClanRoleDetail[]> {
    const roles = await this.prisma.clanRoleDef.findMany({ include: ROLE_INCLUDE, orderBy: { position: 'desc' } })
    return roles.map(r => toRoleDetail(r, this.isManageable(r)))
  }

  async createRole(clanId: string, input: CreateRoleInput): Promise<ClanRoleDetail> {
    const tpl = input.template ? this.resolveTemplate(input.template) : null
    if (input.template && !tpl) throw clanErrors.grantUnknown()
    const roles = await this.prisma.clanRoleDef.findMany({ orderBy: { position: 'desc' } })
    const sortable = roles.filter(r => r.key !== 'owner')
    const insertAt = sortable.filter(r => r.position >= this.permissions.positionCeiling()).length
    const created = await this.prisma.clanRoleDef.create({
      data: {
        clan_id: clanId,
        key: `r${shortId()}`,
        name: tpl ? tpl.name : input.name!,
        color: tpl ? tpl.color : (input.color ?? null),
        is_system: false,
        position: 0,
        grants: tpl && tpl.grants.length ? { create: tpl.grants } : undefined,
      },
    })
    const order = [...sortable.slice(0, insertAt).map(r => r.id), created.id, ...sortable.slice(insertAt).map(r => r.id)]
    await this.prisma.$transaction(this.reseatOps(order, ownerRoleId(roles)))
    await this.audit.write({ clanId, action: AuditAction.ROLE_CREATED, entityType: AuditEntity.ROLE, entityId: created.id, metadata: { name: created.name } })
    return this.roleDetail(created.id)
  }

  private resolveTemplate(key: string): { name: string; color: string | null; grants: { grant: string; actions: number }[] } | null {
    const meta = SYSTEM_ROLES.find(r => r.key === key && r.key !== 'owner')
    if (!meta) return null
    const defaults = ROLE_GRANT_DEFAULTS[key as DefaultRoleKey] ?? {}
    const grants = grantRows(defaults)
      .map(g => ({ grant: g.grant, actions: g.actions & this.permissions.effectiveActions(g.grant) }))
      .filter(g => g.actions > 0)
    return { name: meta.name, color: meta.color, grants }
  }

  async updateRole(roleId: string, input: UpdateRoleInput): Promise<ClanRoleDetail> {
    const role = await this.prisma.clanRoleDef.findFirst({ where: { id: roleId } })
    if (!role) throw clanErrors.roleNotFound()
    if (!this.permissions.canManageRole(role.position)) throw clanErrors.roleAboveOwnPosition()
    const data: Prisma.ClanRoleDefUpdateManyMutationInput = {}
    if (input.name !== undefined) data.name = input.name
    if (input.color !== undefined) data.color = input.color
    await this.prisma.clanRoleDef.updateMany({ where: { id: roleId }, data })
    await this.audit.write({
      clanId: role.clan_id,
      action: AuditAction.ROLE_UPDATED,
      entityType: AuditEntity.ROLE,
      entityId: roleId,
      metadata: { fields: Object.keys(data) },
    })
    return this.roleDetail(roleId)
  }

  async deleteRole(roleId: string): Promise<ClanRoleDetail[]> {
    const role = await this.prisma.clanRoleDef.findFirst({ where: { id: roleId } })
    if (!role) throw clanErrors.roleNotFound()
    if (role.key === 'owner') throw clanErrors.ownerRoleNotDeletable()
    if (!this.permissions.canManageRole(role.position)) throw clanErrors.roleAboveOwnPosition()
    await this.prisma.clanRoleGrant.deleteMany({ where: { role_id: roleId } })
    await this.prisma.clanMemberRole.deleteMany({ where: { role_id: roleId } })
    await this.prisma.clanRoleDef.deleteMany({ where: { id: roleId } })
    await runSystem(() => this.ensureMembersHaveRole(role.clan_id))
    await this.audit.write({ clanId: role.clan_id, action: AuditAction.ROLE_DELETED, entityType: AuditEntity.ROLE, entityId: roleId, metadata: { name: role.name } })
    return this.listRoles()
  }

  async reorderRoles(orderedIds: string[]): Promise<ClanRoleDetail[]> {
    const roles = await this.prisma.clanRoleDef.findMany({ orderBy: { position: 'desc' } })
    const sortable = roles.filter(r => r.key !== 'owner')
    const ids = sortable.map(r => r.id)
    if (orderedIds.length !== ids.length || new Set(orderedIds).size !== ids.length || orderedIds.some(id => !ids.includes(id))) throw clanErrors.roleReorderInvalid()
    const locked = sortable.filter(r => r.position >= this.permissions.positionCeiling()).map(r => r.id)
    if (!locked.every((id, i) => orderedIds[i] === id)) throw clanErrors.roleAboveOwnPosition()
    await this.prisma.$transaction(this.reseatOps(orderedIds, ownerRoleId(roles)))
    const reorderClanId = roles[0]?.clan_id
    if (reorderClanId)
      await this.audit.write({ clanId: reorderClanId, action: AuditAction.ROLE_REORDERED, entityType: AuditEntity.ROLE, entityId: null, metadata: { order: orderedIds } })
    return this.listRoles()
  }

  async setRoleGrants(roleId: string, grants: SetGrantsInput['grants']): Promise<ClanRoleDetail> {
    const role = await this.prisma.clanRoleDef.findFirst({ where: { id: roleId } })
    if (!role) throw clanErrors.roleNotFound()
    if (role.key === 'owner') throw clanErrors.ownerRoleNotEditable()
    if (!this.permissions.canManageRole(role.position)) throw clanErrors.roleAboveOwnPosition()
    const rows: { role_id: string; grant: string; actions: number }[] = []
    for (const g of grants) {
      const meta = grantMeta(g.grant)
      if (!meta) throw clanErrors.grantUnknown()
      const actions = g.actions & meta.actions
      if (actions === 0) continue
      if ((actions & ~this.permissions.effectiveActions(g.grant)) !== 0) throw clanErrors.grantEscalation()
      rows.push({ role_id: roleId, grant: g.grant, actions })
    }
    await this.prisma.clanRoleGrant.deleteMany({ where: { role_id: roleId } })
    if (rows.length) await this.prisma.clanRoleGrant.createMany({ data: rows })
    await this.audit.write({
      clanId: role.clan_id,
      action: AuditAction.ROLE_GRANTS_SET,
      entityType: AuditEntity.ROLE,
      entityId: roleId,
      metadata: { grantCount: rows.length },
    })
    return this.roleDetail(roleId)
  }

  private async roleDetail(roleId: string): Promise<ClanRoleDetail> {
    const role = await this.prisma.clanRoleDef.findFirst({ where: { id: roleId }, include: ROLE_INCLUDE })
    if (!role) throw clanErrors.roleNotFound()
    return toRoleDetail(role, this.isManageable(role))
  }

  private isManageable(role: { key: string; position: number }): boolean {
    return role.key !== 'owner' && this.permissions.can('clan_role', Action.MANAGE) && this.permissions.canManageRole(role.position)
  }

  private reseatOps(orderedSortableIds: string[], ownerId: string | undefined) {
    const ops = orderedSortableIds.map((id, i) => this.prisma.clanRoleDef.updateMany({ where: { id }, data: { position: orderedSortableIds.length - 1 - i } }))
    if (ownerId) ops.push(this.prisma.clanRoleDef.updateMany({ where: { id: ownerId }, data: { position: orderedSortableIds.length } }))
    return ops
  }

  private persistClan(user: AuthUser, input: CreateClanInput, slug: string): Promise<Clan> {
    return this.prisma.$transaction(async tx => {
      const clan = await tx.clan.create({ data: { slug, name: input.name, tag: input.tag, description: input.description ?? null, owner_id: user.id } })
      const roleIds = await this.seedSystemRoles(tx, clan.id)
      const member = await tx.clanMember.create({ data: { clan_id: clan.id, user_id: user.id } })
      await tx.clanMemberRole.create({ data: { member_id: member.id, role_id: roleIds.owner } })
      return clan
    })
  }

  private async seedSystemRoles(tx: RlsTransactionClient, clanId: string): Promise<Record<SystemRoleKey, string>> {
    const ids = {} as Record<SystemRoleKey, string>
    for (const role of SYSTEM_ROLES) {
      const grants = ROLE_GRANT_DEFAULTS[role.key as DefaultRoleKey]
      const created = await tx.clanRoleDef.create({
        data: {
          clan_id: clanId,
          key: role.key,
          name: role.name,
          color: role.color,
          position: role.position,
          is_system: true,
          grants: grants ? { create: grantRows(grants) } : undefined,
        },
      })
      ids[role.key] = created.id
    }
    return ids
  }

  private async createMember(clanId: string, userId: string): Promise<string> {
    const member = await this.prisma.clanMember.create({ data: { clan_id: clanId, user_id: userId } })
    return member.id
  }

  private async reactivateMember(memberId: string): Promise<string> {
    await this.prisma.clanMember.updateMany({ where: { id: memberId }, data: { left_at: null, joined_at: new Date() } })
    return memberId
  }

  private async baseRole(clanId: string): Promise<{ id: string }> {
    const existing = await this.prisma.clanRoleDef.findMany({ where: { clan_id: clanId, key: { not: 'owner' } }, orderBy: { position: 'asc' }, take: 1 })
    if (existing[0]) return existing[0]
    const tpl = SYSTEM_ROLES.find(r => r.key === 'member')!
    return this.prisma.clanRoleDef.create({
      data: { clan_id: clanId, key: 'member', name: tpl.name, color: tpl.color, position: 0, is_system: true, grants: { create: grantRows(ROLE_GRANT_DEFAULTS.member) } },
    })
  }

  private async ensureMembersHaveRole(clanId: string): Promise<void> {
    const base = await this.baseRole(clanId)
    const members = await this.prisma.clanMember.findMany({ where: { clan_id: clanId, left_at: null }, include: { roles: true } })
    const roleless = members.filter(m => m.roles.length === 0)
    if (roleless.length === 0) return
    await this.prisma.clanMemberRole.createMany({ data: roleless.map(m => ({ member_id: m.id, role_id: base.id })), skipDuplicates: true })
  }

  private async deactivateMember(memberId: string): Promise<void> {
    await this.prisma.clanMemberRole.deleteMany({ where: { member_id: memberId } })
    await this.prisma.clanMember.updateMany({ where: { id: memberId }, data: { left_at: new Date() } })
  }

  private async memberView(memberId: string): Promise<ClanMemberView> {
    const member = await this.prisma.clanMember.findFirstOrThrow({ where: { id: memberId }, include: MEMBER_INCLUDE })
    return this.toMemberView(member)
  }

  private async toSummary(clan: Clan, memberCount: number): Promise<ClanSummary> {
    return { id: clan.id, slug: clan.slug, name: clan.name, tag: clan.tag, logoUrl: await this.resolveImage(clan.logo_url), memberCount, joinPolicy: clan.join_policy }
  }

  private async toDetail(clan: Clan, memberCount: number, userId: string): Promise<ClanDetail> {
    const summary = await this.toSummary(clan, memberCount)
    const isOwner = clan.owner_id === userId
    const canManageMembers = isOwner || this.permissions.can('clan_member', Action.MANAGE)
    const canManageRoles = isOwner || this.permissions.can('clan_role', Action.MANAGE)
    const canEditClan = isOwner || this.permissions.can('clan', Action.UPDATE)
    const canInvite = isOwner || this.permissions.can('clan_invite', Action.CREATE)
    const canViewAudit = isOwner || this.permissions.can('audit_log', Action.READ)
    const canCreateEvent = isOwner || this.permissions.can('event', Action.CREATE)
    return {
      ...summary,
      description: clan.description,
      ownerId: clan.owner_id,
      joinPolicy: clan.join_policy,
      isOwner,
      canManageMembers,
      canManageRoles,
      canEditClan,
      canInvite,
      canViewAudit,
      canCreateEvent,
      createdAt: clan.created_at.toISOString(),
    }
  }

  private async toMemberView(m: MemberWithRelations): Promise<ClanMemberView> {
    const roles = m.roles
      .map(r => ({ id: r.role.id, key: r.role.key, name: r.role.name, color: r.role.color, position: r.role.position, manageable: this.isManageable(r.role) }))
      .sort((a, b) => b.position - a.position)
    return {
      id: m.id,
      userId: m.user_id,
      username: m.user.username,
      displayName: m.user.display_name,
      discriminator: m.user.discriminator,
      avatarUrl: await this.resolveImage(m.user.avatar_url),
      joinedAt: m.joined_at.toISOString(),
      roles,
    }
  }

  private resolveImage(key: string | null): Promise<string> | null {
    return key ? this.s3.presignDownload(key) : null
  }
}

function slugify(value: string): string {
  const base = value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  return base || 'clan'
}

function shortId(): string {
  return randomBytes(3).toString('hex')
}

function highestPosition(roles: { role: { position: number } }[]): number {
  return roles.reduce((max, r) => (r.role.position > max ? r.role.position : max), -1)
}

function ownerRoleId(roles: { id: string; key: string }[]): string | undefined {
  return roles.find(r => r.key === 'owner')?.id
}

function toRoleDetail(role: RoleWithGrants, manageable: boolean): ClanRoleDetail {
  return {
    id: role.id,
    key: role.key,
    name: role.name,
    color: role.color,
    position: role.position,
    isSystem: role.is_system,
    manageable,
    grants: role.grants.map(g => ({ grant: g.grant, actions: g.actions })),
  }
}

function uniqueTargets(e: unknown): string[] {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== 'P2002') return []
  const target = e.meta?.target
  if (Array.isArray(target)) return target as string[]
  return typeof target === 'string' ? [target] : []
}
